import { App } from '@slack/bolt';
import { getCompletionMetrics, getTeamMetrics, getOverdueItems } from './metrics';

export async function registerDashboard(app: App) {
  app.command('/followflo-dashboard', async ({ ack, body, client }) => {
    ack();

    try {
      const userMetrics = await getCompletionMetrics(body.user_id);
      const teamMetrics = await getTeamMetrics();
      const overdueItems = await getOverdueItems();

      const dashboard = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📊 FollowFlo ダッシュボード',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*個人の成績*\n完了率: ${userMetrics.completion_rate}% (${userMetrics.completed_tasks}/${userMetrics.total_tasks})\n平均完了時間: ${userMetrics.average_completion_time_hours}時間`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*チーム成績*',
            },
          },
          ...teamMetrics.map((metric: any) => ({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<@${metric.user_id}>: ${metric.completion_rate}% (${metric.completed_tasks}/${metric.total_tasks})`,
            },
          })),
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*期限超過タスク*: ${overdueItems.length}件`,
            },
          },
          ...(overdueItems.length > 0
            ? overdueItems.slice(0, 5).map((item: any) => ({
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `⚠️ "${item.task_name}" (<@${item.assigned_to}>) - 期限: ${item.deadline}`,
                },
              }))
            : [
                {
                  type: 'section',
                  text: {
                    type: 'plain_text',
                    text: '期限超過タスクはありません 🎉',
                  },
                },
              ]),
        ],
      };

      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          title: {
            type: 'plain_text',
            text: 'FollowFlo Dashboard',
          },
          blocks: dashboard.blocks,
        },
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: body.user_id,
        text: '❌ ダッシュボードの読み込みに失敗しました',
      });
    }
  });
}
