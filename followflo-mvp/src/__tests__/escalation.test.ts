import { checkAndExecuteEscalations } from '../escalation';

jest.mock('../database', () => ({
  query: jest.fn(),
}));

import { query } from '../database';
const mockQuery = query as jest.MockedFunction<typeof query>;

const mockPostMessage = jest.fn().mockResolvedValue({ ok: true });
const mockApp = {
  client: {
    chat: {
      postMessage: mockPostMessage,
    },
  },
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SLACK_CLEVEL_CHANNEL = 'executive';
});

describe('checkAndExecuteEscalations', () => {
  describe('Stage 1: 期限1日前リマインド', () => {
    it('期限1日前のタスクにリマインドを送る', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 'task-1',
            task_name: '営業戦略策定',
            assigned_to: 'U123ABC',
            deadline: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
            slack_channel_id: 'C001',
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await checkAndExecuteEscalations(mockApp);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C001',
          text: expect.stringContaining('リマインド'),
        })
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('escalation_level = 1'),
        ['task-1']
      );
    });

    it('期限前タスクがない場合はメッセージを送らない', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await checkAndExecuteEscalations(mockApp);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe('Stage 2: 24時間超過マネージャー通知', () => {
    it('24時間超過タスクにマネージャー通知を送る', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: 'task-2',
            task_name: '資料作成',
            assigned_to: 'U456DEF',
            created_by: 'U789GHI',
            deadline: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
            slack_channel_id: 'C002',
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await checkAndExecuteEscalations(mockApp);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C002',
          text: expect.stringContaining('エスカレーション Level 2'),
        })
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('escalation_level = 2'),
        ['task-2']
      );
    });
  });

  describe('Stage 3: 3日超過エグゼクティブレポート', () => {
    it('3日超過タスクをまとめてエグゼクティブチャンネルに送る', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'task-3a',
              task_name: '戦略レビュー',
              assigned_to: 'U111',
              created_by: 'U222',
              deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'task-3b',
              task_name: '予算承認',
              assigned_to: 'U333',
              created_by: 'U444',
              deadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        } as any)
        .mockResolvedValue({ rows: [] } as any);

      await checkAndExecuteEscalations(mockApp);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'executive',
          text: expect.stringContaining('Executive Report'),
        })
      );
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('2件'),
        })
      );
    });

    it('SLACK_CLEVEL_CHANNEL未設定時はgeneralに送る', async () => {
      delete process.env.SLACK_CLEVEL_CHANNEL;
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: 'task-4',
            task_name: 'テスト',
            assigned_to: 'U001',
            created_by: 'U002',
            deadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          }],
        } as any)
        .mockResolvedValue({ rows: [] } as any);

      await checkAndExecuteEscalations(mockApp);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'general' })
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('DBエラーが発生しても例外をスローしない', async () => {
      mockQuery.mockRejectedValue(new Error('DB connection failed'));

      await expect(checkAndExecuteEscalations(mockApp)).resolves.not.toThrow();
    });

    it('Slack送信失敗時も他のタスクの処理を継続する', async () => {
      mockPostMessage.mockRejectedValueOnce(new Error('Slack API error'));
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { id: 'task-a', task_name: 'タスクA', assigned_to: 'U1', deadline: new Date().toISOString(), slack_channel_id: 'C1' },
            { id: 'task-b', task_name: 'タスクB', assigned_to: 'U2', deadline: new Date().toISOString(), slack_channel_id: 'C2' },
          ],
        } as any)
        .mockResolvedValue({ rows: [] } as any);

      await expect(checkAndExecuteEscalations(mockApp)).resolves.not.toThrow();
    });

    it('Stage 2 内部Slackエラーをキャッチして継続する', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: 'task-s2', task_name: 'Stage2タスク', assigned_to: 'U1',
            created_by: 'U2', deadline: new Date().toISOString(), slack_channel_id: 'C1',
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any);
      mockPostMessage.mockRejectedValue(new Error('Slack error'));

      await expect(checkAndExecuteEscalations(mockApp)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Stage 2 escalation error'),
        expect.any(Error)
      );
    });

    it('Stage 3 内部Slackエラーをキャッチして継続する', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: 'task-s3', task_name: 'Stage3タスク', assigned_to: 'U1',
            created_by: 'U2', deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          }],
        } as any);
      mockPostMessage.mockRejectedValue(new Error('Slack error'));

      await expect(checkAndExecuteEscalations(mockApp)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Stage 3 escalation error:',
        expect.any(Error)
      );
    });
  });
});
