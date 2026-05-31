import { App } from '@slack/bolt';
import { query } from './database';
import { verifyCompletion, updateVerificationStage } from './ai-verification';

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
}
