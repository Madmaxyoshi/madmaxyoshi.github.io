import { App } from '@slack/bolt';
import { query } from './database';
import { verifyCompletion, updateVerificationStage, finalVerifyCompletion, evaluateEvidenceFile } from './ai-verification';

export function registerListeners(app: App) {
  // Listen for completion signals (✅ emoji or "完了" message)
  app.message(async ({ message, client }) => {
    if (!('text' in message) || !message.text) return;

    const completionKeywords = ['✅', '完了', 'done', 'finished', '終了', 'complete'];
    const isCompletion = completionKeywords.some(keyword =>
      message.text!.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isCompletion && 'user' in message) {
      try {
        // Find related action items for this user
        const result = await query(
          `SELECT id, task_name FROM action_items
           WHERE assigned_to = $1 AND status = 'pending'
           ORDER BY created_at DESC LIMIT 1`,
          [message.user]
        );

        if (result.rows.length > 0) {
          const actionItem = result.rows[0];

          // Run AI verification
          const verification = await verifyCompletion(
            actionItem.id,
            message.text!,
            message.user!
          );

          // Update verification stage
          await updateVerificationStage(actionItem.id, verification.stage);

          if (verification.verified) {
            // Update action item status
            await query(
              `UPDATE action_items SET status = 'completed' WHERE id = $1`,
              [actionItem.id]
            );

            const statusMsg = verification.stage === 3
              ? '⚠️ 人間による確認が必要です'
              : '✅ 自動認証されました';

            // Send confirmation with verification details
            await client.chat.postMessage({
              channel: message.channel,
              text: `✅ <@${message.user}> が '${actionItem.task_name}' を完了しました！\n${statusMsg}\n信頼度: ${(verification.confidence * 100).toFixed(0)}%`,
            });
          } else {
            // Send verification failed message
            await client.chat.postMessage({
              channel: message.channel,
              text: `⚠️ 完了認証に失敗しました\nタスク: '${actionItem.task_name}'\n理由: ${verification.reason}`,
            });
          }
        }
      } catch (error) {
        console.error('Listener error:', error);
      }
    }
  });

  // Listen for reaction_added events (custom emoji reactions)
  app.event('reaction_added', async ({ event, client }) => {
    if (event.reaction === 'white_check_mark' || event.reaction === 'heavy_check_mark') {
      try {
        const result = await query(
          `SELECT id, task_name FROM action_items
           WHERE assigned_to = $1 AND status = 'pending'
           ORDER BY created_at DESC LIMIT 1`,
          [event.user]
        );

        if (result.rows.length > 0) {
          const actionItem = result.rows[0];

          // Run AI verification with reaction text
          const verification = await verifyCompletion(
            actionItem.id,
            `Reaction: ${event.reaction}`,
            event.user
          );

          await updateVerificationStage(actionItem.id, verification.stage);

          if (verification.verified) {
            await query(
              `UPDATE action_items SET status = 'completed' WHERE id = $1`,
              [actionItem.id]
            );

            // Get channel info from event
            const channel = 'item' in event ? (event.item as any).channel : (event as any).channel;
            if (channel) {
              await client.chat.postMessage({
                channel,
                text: `✅ <@${event.user}> が '${actionItem.task_name}' を完了しました！`,
              });
            }
          }
        }
      } catch (error) {
        console.error('Reaction listener error:', error);
      }
    }
  });

  // Listen for file uploads (evidence files)
  app.event('file_shared', async ({ event, client }) => {
    try {
      const fileInfo = await client.files.info({ file: event.file_id });
      const file = fileInfo.file as any;

      // Find related action items for this user
      const result = await query(
        `SELECT id, task_name FROM action_items
         WHERE assigned_to = $1 AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [event.user_id]
      );

      if (result.rows.length > 0) {
        const actionItem = result.rows[0];

        // Get file content for text-based files
        let fileContent = '';
        if (file.mimetype && (file.mimetype.includes('text') || file.mimetype.includes('json') || file.mimetype.includes('csv'))) {
          try {
            const fileUrl = file.url_private;
            const response = await fetch(fileUrl, {
              headers: {
                Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
              },
            });
            fileContent = await response.text();
          } catch (error) {
            console.error('Failed to fetch file content:', error);
          }
        }

        // Create evidence file record
        const fileResult = await query(
          `INSERT INTO evidence_files (action_item_id, file_url, file_name, file_type, uploaded_by, file_content, ai_review_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            actionItem.id,
            file.url_private,
            file.name,
            file.filetype || 'unknown',
            event.user_id,
            fileContent || null,
            fileContent ? 'pending' : 'pending',
          ]
        );

        // Evaluate evidence file if content is available
        if (fileContent) {
          const evaluation = await evaluateEvidenceFile(fileContent, file.name, actionItem.task_name);

          await query(
            `UPDATE evidence_files SET quality_score = $1, quality_feedback = $2, ai_review_status = $3 WHERE id = $4`,
            [evaluation.score, evaluation.feedback, evaluation.isApproved ? 'approved' : 'needs_review', fileResult.rows[0].id]
          );

          await client.chat.postMessage({
            channel: event.channel_id,
            text: `📎 証拠ファイルを受け取りました: ${file.name}\n品質スコア: ${(evaluation.score * 100).toFixed(0)}%\n${evaluation.isApproved ? '✅ 承認済み' : '⚠️ 確認が必要'}`,
          });
        }
      }
    } catch (error) {
      console.error('File listener error:', error);
    }
  });
}
