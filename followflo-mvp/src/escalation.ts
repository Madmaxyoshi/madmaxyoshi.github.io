import { query } from './database';
import { App } from '@slack/bolt';

export async function checkAndExecuteEscalations(app: App) {
  try {
    // Stage 1: T-1 Day Reminder (1 day before deadline)
    const reminderResult = await query(`
      SELECT id, task_name, assigned_to, deadline, slack_channel_id
      FROM action_items
      WHERE status = 'pending'
        AND escalation_level < 1
        AND deadline > NOW()
        AND deadline <= NOW() + INTERVAL '1 day'
    `);

    for (const item of reminderResult.rows) {
      try {
        await app.client.chat.postMessage({
          channel: item.slack_channel_id,
          text: `⏰ リマインド: <@${item.assigned_to}> - "${item.task_name}" の期限は明日です (${item.deadline})`,
        });

        await query(
          `UPDATE action_items SET escalation_level = 1, escalation_sent_at = NOW() WHERE id = $1`,
          [item.id]
        );
      } catch (error) {
        console.error(`Stage 1 escalation error for ${item.id}:`, error);
      }
    }

    // Stage 2: T+24h Manager Notification (24 hours after deadline)
    const managerResult = await query(`
      SELECT id, task_name, assigned_to, created_by, deadline, slack_channel_id
      FROM action_items
      WHERE status = 'pending'
        AND escalation_level < 2
        AND deadline <= NOW() - INTERVAL '24 hours'
    `);

    for (const item of managerResult.rows) {
      try {
        await app.client.chat.postMessage({
          channel: item.slack_channel_id,
          text: `⚠️ エスカレーション Level 2: <@${item.created_by}> - "${item.task_name}" (<@${item.assigned_to}>) が24時間超過しています`,
        });

        await query(
          `UPDATE action_items SET escalation_level = 2, escalation_sent_at = NOW() WHERE id = $1`,
          [item.id]
        );
      } catch (error) {
        console.error(`Stage 2 escalation error for ${item.id}:`, error);
      }
    }

    // Stage 3: T+3d Executive Report (3 days after deadline)
    const execResult = await query(`
      SELECT id, task_name, assigned_to, created_by, deadline
      FROM action_items
      WHERE status = 'pending'
        AND escalation_level < 3
        AND deadline <= NOW() - INTERVAL '3 days'
    `);

    if (execResult.rows.length > 0) {
      try {
        const overdueList = execResult.rows
          .map(item => `• "${item.task_name}" (責任者: <@${item.assigned_to}>) - 超過: ${Math.floor((Date.now() - new Date(item.deadline).getTime()) / (1000 * 60 * 60 * 24))}日`)
          .join('\n');

        // Use environment variable for C-level channel, default to 'general'
        const clevelChannel = process.env.SLACK_CLEVEL_CHANNEL || 'general';

        await app.client.chat.postMessage({
          channel: clevelChannel,
          text: `📊 Executive Report: ${execResult.rows.length}件のタスクが3日以上超過\n${overdueList}`,
        });

        for (const item of execResult.rows) {
          await query(
            `UPDATE action_items SET escalation_level = 3, escalation_sent_at = NOW() WHERE id = $1`,
            [item.id]
          );
        }
      } catch (error) {
        console.error('Stage 3 escalation error:', error);
      }
    }
  } catch (error) {
    console.error('Escalation check error:', error);
  }
}
