import {
  ActivityHandler,
  BotFrameworkAdapter,
  MessageFactory,
  TurnContext,
  CardFactory,
} from 'botbuilder';
import express, { Request, Response } from 'express';
import { query } from './database';

export class FollowFloTeamsBot extends ActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context: TurnContext) => {
      const text = context.activity.text?.trim() || '';
      const userId = context.activity.from.id;
      const channelId = context.activity.channelData?.teamsChannelId || context.activity.conversation.id;
      const tenantId = context.activity.channelData?.tenant?.id || 'unknown';

      if (text.toLowerCase().includes('/followflo') || text.toLowerCase().startsWith('followflo')) {
        await this.handleFollowFloCommand(context, text, userId, channelId, tenantId);
      } else if (text.toLowerCase().includes('完了') || text.toLowerCase().includes('done') || text.toLowerCase().includes('完成')) {
        await this.handleCompletionSignal(context, text, userId);
      }

      await context.sendActivity(MessageFactory.text(`受信しました。\n\`followflo help\` でコマンド一覧を確認できます。`));
    });

    this.onMembersAdded(async (context: TurnContext) => {
      for (const member of context.activity.membersAdded || []) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(MessageFactory.attachment(
            CardFactory.heroCard(
              'FollowFlo へようこそ！',
              '会議アクションアイテムの完了を保証するBotです。\n\n`followflo help` でコマンド一覧を表示します。',
              [],
              [{ type: 'imBack', title: 'ヘルプを表示', value: 'followflo help' }]
            )
          ));
        }
      }
    });
  }

  private async handleFollowFloCommand(
    context: TurnContext,
    text: string,
    userId: string,
    channelId: string,
    tenantId: string
  ) {
    const parts = text.split(' ').filter(Boolean);
    const subCommand = parts[1]?.toLowerCase();

    switch (subCommand) {
      case 'add':
        await this.handleAddTask(context, parts, userId, channelId, tenantId);
        break;
      case 'list':
        await this.handleListTasks(context, userId);
        break;
      case 'done':
        await this.handleMarkDone(context, parts, userId);
        break;
      case 'help':
      default:
        await this.sendHelp(context);
    }
  }

  private async handleAddTask(
    context: TurnContext,
    parts: string[],
    userId: string,
    channelId: string,
    tenantId: string
  ) {
    const taskName = parts.slice(2, -2).join(' ').replace(/"/g, '');
    const assignedTo = parts[parts.length - 2]?.replace('@', '') || userId;
    const deadline = parts[parts.length - 1];

    if (!taskName || !deadline) {
      await context.sendActivity('使い方: `followflo add "タスク名" @担当者 YYYY-MM-DD`');
      return;
    }

    try {
      const result = await query(
        `INSERT INTO action_items (task_name, assigned_to, deadline, created_by, teams_channel_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [taskName, assignedTo, deadline, userId, channelId]
      );
      const itemId = result.rows[0].id;

      await context.sendActivity(MessageFactory.attachment(
        CardFactory.adaptiveCard({
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            { type: 'TextBlock', text: '✅ タスクを登録しました', size: 'Medium', weight: 'Bolder' },
            { type: 'FactSet', facts: [
              { title: 'タスク', value: taskName },
              { title: '担当者', value: `@${assignedTo}` },
              { title: '期限', value: deadline },
              { title: 'ID', value: itemId.slice(0, 8) },
            ]},
          ],
        })
      ));
    } catch (error) {
      await context.sendActivity('❌ タスクの登録に失敗しました。データベース接続を確認してください。');
    }
  }

  private async handleListTasks(context: TurnContext, userId: string) {
    try {
      const result = await query(
        `SELECT id, task_name, assigned_to, deadline, status
         FROM action_items
         WHERE (assigned_to = $1 OR created_by = $1) AND status != 'completed'
         ORDER BY deadline ASC LIMIT 10`,
        [userId]
      );

      if (result.rows.length === 0) {
        await context.sendActivity('📋 未完了のタスクはありません。');
        return;
      }

      const facts = result.rows.map(row => ({
        title: `${row.status === 'overdue' ? '🚨' : '⏳'} ${row.task_name.slice(0, 30)}`,
        value: `期限: ${new Date(row.deadline).toLocaleDateString('ja-JP')} | 担当: @${row.assigned_to}`,
      }));

      await context.sendActivity(MessageFactory.attachment(
        CardFactory.adaptiveCard({
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            { type: 'TextBlock', text: `📋 タスク一覧 (${result.rows.length}件)`, size: 'Medium', weight: 'Bolder' },
            { type: 'FactSet', facts },
          ],
        })
      ));
    } catch {
      await context.sendActivity('❌ タスクの取得に失敗しました。');
    }
  }

  private async handleMarkDone(context: TurnContext, parts: string[], userId: string) {
    const taskIdPrefix = parts[2];
    if (!taskIdPrefix) {
      await context.sendActivity('使い方: `followflo done <タスクID>`');
      return;
    }

    try {
      const result = await query(
        `UPDATE action_items SET status = 'completed'
         WHERE id::text LIKE $1 AND assigned_to = $2
         RETURNING task_name`,
        [`${taskIdPrefix}%`, userId]
      );

      if (result.rows.length === 0) {
        await context.sendActivity('❌ タスクが見つかりません。');
        return;
      }

      await query(
        `INSERT INTO completion_proofs (action_item_id, source, completed_by, proof_text)
         SELECT id, 'teams', $1, 'Teams経由で完了報告'
         FROM action_items WHERE id::text LIKE $2`,
        [userId, `${taskIdPrefix}%`]
      );

      await context.sendActivity(`✅ **${result.rows[0].task_name}** を完了しました。`);
    } catch {
      await context.sendActivity('❌ 完了処理に失敗しました。');
    }
  }

  private async handleCompletionSignal(context: TurnContext, text: string, userId: string) {
    try {
      const recentTasks = await query(
        `SELECT id, task_name FROM action_items
         WHERE assigned_to = $1 AND status = 'pending'
         ORDER BY deadline ASC LIMIT 1`,
        [userId]
      );

      if (recentTasks.rows.length > 0) {
        const task = recentTasks.rows[0];
        await query(
          `INSERT INTO completion_proofs (action_item_id, source, completed_by, proof_text)
           VALUES ($1, 'teams', $2, $3)`,
          [task.id, userId, text]
        );
      }
    } catch {
      // 自動検知は静かに失敗
    }
  }

  private async sendHelp(context: TurnContext) {
    await context.sendActivity(MessageFactory.attachment(
      CardFactory.adaptiveCard({
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          { type: 'TextBlock', text: '🎯 FollowFlo コマンド一覧', size: 'Large', weight: 'Bolder' },
          { type: 'FactSet', facts: [
            { title: 'followflo add', value: '"タスク名" @担当者 YYYY-MM-DD — タスク追加' },
            { title: 'followflo list', value: '自分のタスク一覧を表示' },
            { title: 'followflo done <ID>', value: 'タスクを完了にする' },
            { title: 'followflo help', value: 'このヘルプを表示' },
          ]},
        ],
      })
    ));
  }
}

export function createTeamsRouter(): express.Router {
  const router = express.Router();

  const adapter = new BotFrameworkAdapter({
    appId: process.env.TEAMS_APP_ID,
    appPassword: process.env.TEAMS_APP_PASSWORD,
  });

  adapter.onTurnError = async (context, error) => {
    console.error('Teams Bot エラー:', error);
    await context.sendActivity('エラーが発生しました。しばらく待ってから再試行してください。');
  };

  const bot = new FollowFloTeamsBot();

  router.post('/api/teams/messages', (req: Request, res: Response) => {
    adapter.processActivity(req, res, async (context) => {
      await bot.run(context);
    });
  });

  return router;
}