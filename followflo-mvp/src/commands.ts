import { App } from '@slack/bolt';
import { query } from './database';
import { getCompletionMetrics } from './metrics';

export function registerCommands(app: App) {
  app.command('/followflo', async ({ ack, command, body, client }) => {
    ack();

    try {
      const args = command.text.trim().split(' ');
      const action = args[0];

      if (action === 'create' || action === 'add') {
        await handleCreate(command, client);
      } else if (action === 'list' || action === 'show') {
        await handleList(command, client);
      } else if (action === 'status') {
        await handleStatus(command, client);
      } else if (action === 'help') {
        await handleHelp(command, client);
      } else {
        await handleHelp(command, client);
      }
    } catch (error) {
      console.error('Command error:', error);
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: '❌ エラーが発生しました。`/followflo help` でヘルプを表示します。',
      });
    }
  });
}

async function handleCreate(command: any, client: any) {
  const taskMatch = command.text.match(/"([^"]+)"/);
  const userMatch = command.text.match(/@(\w+)/);
  const deadlineMatch = command.text.match(/deadline:(\d{4}-\d{2}-\d{2})/);

  if (!taskMatch || !userMatch || !deadlineMatch) {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: '❌ 使用方法: `/followflo create "タスク名" @ユーザー deadline:YYYY-MM-DD`',
    });
    return;
  }

  const taskName = taskMatch[1];
  const assignedTo = userMatch[1];
  const deadline = deadlineMatch[1];

  await query(
    `INSERT INTO action_items (task_name, assigned_to, deadline, created_by, slack_channel_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [taskName, assignedTo, deadline, command.user_id, command.channel_id]
  );

  await client.chat.postMessage({
    channel: command.channel_id,
    text: `✅ アクションアイテムを記録しました\n• タスク: ${taskName}\n• 担当者: @${assignedTo}\n• 期限: ${deadline}`,
  });
}

async function handleList(command: any, client: any) {
  const result = await query(
    `SELECT id, task_name, assigned_to, deadline, status
    FROM action_items
    WHERE status = 'pending'
    ORDER BY deadline ASC`
  );

  if (result.rows.length === 0) {
    await client.chat.postMessage({
      channel: command.channel_id,
      text: '✅ 未完了のタスクはありません',
    });
    return;
  }

  const taskList = result.rows
    .map((row: any) => `• ${row.task_name} (@${row.assigned_to}) - ${row.deadline}`)
    .join('\n');

  await client.chat.postMessage({
    channel: command.channel_id,
    text: `📋 未完了タスク一覧 (${result.rows.length}件)\n${taskList}`,
  });
}

async function handleStatus(command: any, client: any) {
  const metrics = await getCompletionMetrics(command.user_id);

  await client.chat.postMessage({
    channel: command.channel_id,
    text: `📊 <@${command.user_id}> の成績\n完了率: ${metrics.completion_rate}% (${metrics.completed_tasks}/${metrics.total_tasks})\n平均完了時間: ${metrics.average_completion_time_hours}時間`,
  });
}

async function handleHelp(command: any, client: any) {
  const help = `
🤖 *FollowFlo コマンドヘルプ*

\`/followflo create "タスク名" @ユーザー deadline:YYYY-MM-DD\`
→ 新しいアクションアイテムを作成

\`/followflo list\`
→ 未完了タスク一覧を表示

\`/followflo status\`
→ あなたの完了率を表示

\`/followflo help\`
→ このヘルプを表示

💡 *完了シグナル*
メッセージに「✅」または「完了」と入力するだけで自動検出されます
  `.trim();

  await client.chat.postMessage({
    channel: command.channel_id,
    text: help,
  });
}
