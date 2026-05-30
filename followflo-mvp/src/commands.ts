import { App } from '@slack/bolt';
import { query } from './database';
import { v4 as uuidv4 } from 'uuid';

export function registerCommands(app: App) {
  // /followflo create "タスク名" @ユーザー deadline:YYYY-MM-DD
  app.command('/followflo', async ({ ack, command, body, client }) => {
    ack();

    try {
      const args = command.text.split(' ');

      if (args[0] === 'create') {
        // Parse command: create "task name" @user deadline:date
        const taskMatch = command.text.match(/"([^"]+)"/);
        const userMatch = command.text.match(/@(\w+)/);
        const deadlineMatch = command.text.match(/deadline:(\d{4}-\d{2}-\d{2})/);

        if (!taskMatch || !userMatch || !deadlineMatch) {
          await client.chat.postMessage({
            channel: command.channel_id,
            text: '❌ Usage: `/followflo create "タスク名" @ユーザー deadline:YYYY-MM-DD`',
          });
          return;
        }

        const taskName = taskMatch[1];
        const assignedTo = userMatch[1];
        const deadline = deadlineMatch[1];
        const createdBy = command.user_id;

        // Save to database
        await query(
          `INSERT INTO action_items (task_name, assigned_to, deadline, created_by, slack_channel_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [taskName, assignedTo, deadline, createdBy, command.channel_id]
        );

        await client.chat.postMessage({
          channel: command.channel_id,
          text: `✅ アクションアイテムを記録しました\n• タスク: ${taskName}\n• 担当者: @${assignedTo}\n• 期限: ${deadline}`,
        });
      }
    } catch (error) {
      console.error('Command error:', error);
    }
  });
}
