import { App } from '@slack/bolt';
import { query } from './database';

export function registerListeners(app: App) {
  // Listen for completion signals (✅ emoji or "完了" message)
  app.message(async ({ message, client }) => {
    if (!('text' in message) || !message.text) return;

    const completionKeywords = ['✅', '完了', 'done', 'finished'];
    const isCompletion = completionKeywords.some(keyword =>
      message.text.includes(keyword)
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

          // Record completion proof
          await query(
            `INSERT INTO completion_proofs
             (action_item_id, source, source_message_id, completed_by, proof_text)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              actionItem.id,
              'slack',
              message.ts,
              message.user,
              message.text,
            ]
          );

          // Update action item status
          await query(
            `UPDATE action_items SET status = 'completed' WHERE id = $1`,
            [actionItem.id]
          );

          // Send confirmation
          await client.chat.postMessage({
            channel: message.channel,
            text: `✅ <@${message.user}> が '${actionItem.task_name}' を完了しました！`,
          });
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

          await query(
            `INSERT INTO completion_proofs
             (action_item_id, source, source_message_id, completed_by, proof_text)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              actionItem.id,
              'slack',
              event.item.ts,
              event.user,
              `Reaction: ${event.reaction}`,
            ]
          );

          await query(
            `UPDATE action_items SET status = 'completed' WHERE id = $1`,
            [actionItem.id]
          );
        }
      } catch (error) {
        console.error('Reaction listener error:', error);
      }
    }
  });
}
