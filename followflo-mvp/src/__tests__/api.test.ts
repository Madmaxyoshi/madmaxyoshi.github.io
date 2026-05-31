import express from 'express';
import request from 'supertest';
import apiRouter from '../api';

jest.mock('../database.mock', () => ({
  query: jest.fn(),
}));

jest.mock('../metrics.mock', () => ({
  getCompletionMetrics: jest.fn(),
  getTeamMetrics: jest.fn(),
  getOverdueItems: jest.fn(),
}));

import { query } from '../database.mock';
import { getCompletionMetrics, getTeamMetrics, getOverdueItems } from '../metrics.mock';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetCompletionMetrics = getCompletionMetrics as jest.MockedFunction<typeof getCompletionMetrics>;
const mockGetTeamMetrics = getTeamMetrics as jest.MockedFunction<typeof getTeamMetrics>;
const mockGetOverdueItems = getOverdueItems as jest.MockedFunction<typeof getOverdueItems>;

const app = express();
app.use(express.json());
app.use(apiRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/action-items', () => {
  it('全アクションアイテムを返す', async () => {
    const mockItems = [
      { id: 1, task_name: 'タスクA', status: 'pending', assigned_to: 'user1' },
      { id: 2, task_name: 'タスクB', status: 'completed', assigned_to: 'user2' },
    ];
    mockQuery.mockResolvedValue({ rows: mockItems } as any);

    const res = await request(app).get('/api/action-items');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].task_name).toBe('タスクA');
  });

  it('status=pending でフィルタできる', async () => {
    const mockItems = [{ id: 1, task_name: 'タスクA', status: 'pending' }];
    mockQuery.mockResolvedValue({ rows: mockItems } as any);

    const res = await request(app).get('/api/action-items?status=pending');
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('status = $1'),
      ['pending']
    );
  });

  it('DBエラー時に500を返す', async () => {
    mockQuery.mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app).get('/api/action-items');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch action items');
  });
});

describe('GET /api/evidence-files', () => {
  it('証拠ファイル一覧を返す', async () => {
    const mockFiles = [
      { id: 1, file_name: 'screenshot.png', ai_review_status: 'approved' },
    ];
    mockQuery.mockResolvedValue({ rows: mockFiles } as any);

    const res = await request(app).get('/api/evidence-files');
    expect(res.status).toBe(200);
    expect(res.body[0].file_name).toBe('screenshot.png');
  });

  it('approved=true で承認済みのみ返す', async () => {
    mockQuery.mockResolvedValue({ rows: [] } as any);

    await request(app).get('/api/evidence-files?approved=true');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ai_review_status = $'),
      expect.arrayContaining(['approved'])
    );
  });
});

describe('GET /api/completion-proofs/:actionItemId', () => {
  it('特定アクションアイテムの完了証拠を返す', async () => {
    const mockProofs = [
      { id: 1, action_item_id: 1, proof_type: 'slack_status', ai_confidence: 0.95 },
    ];
    mockQuery.mockResolvedValue({ rows: mockProofs } as any);

    const res = await request(app).get('/api/completion-proofs/1');
    expect(res.status).toBe(200);
    expect(res.body[0].proof_type).toBe('slack_status');
    expect(res.body[0].ai_confidence).toBe(0.95);
  });
});

describe('GET /api/dashboard/summary', () => {
  it('ダッシュボード統計を正しい構造で返す', async () => {
    mockGetTeamMetrics.mockResolvedValue([
      { user_id: 'user1', completion_rate: 85.5, completed_tasks: 17, total_tasks: 20 },
    ]);
    mockGetOverdueItems.mockResolvedValue([]);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '10' }] } as any)
      .mockResolvedValueOnce({ rows: [{ total: '7' }] } as any);

    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('team');
    expect(res.body).toHaveProperty('overdue');
    expect(res.body).toHaveProperty('globalStats');
    expect(res.body.globalStats.totalTasks).toBe(10);
    expect(res.body.globalStats.completedTasks).toBe(7);
  });

  it('userId指定時にユーザーメトリクスも含む', async () => {
    mockGetCompletionMetrics.mockResolvedValue({
      user_id: 'user1', completion_rate: 80, completed_tasks: 8, total_tasks: 10, average_completion_days: 3,
    });
    mockGetTeamMetrics.mockResolvedValue([]);
    mockGetOverdueItems.mockResolvedValue([]);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '10' }] } as any)
      .mockResolvedValueOnce({ rows: [{ total: '8' }] } as any);

    const res = await request(app).get('/api/dashboard/summary?userId=user1');
    expect(res.status).toBe(200);
    expect(res.body.user).not.toBeNull();
    expect(res.body.user.user_id).toBe('user1');
  });
});

describe('GET /api/user/:userId/metrics', () => {
  it('ユーザーメトリクスを返す', async () => {
    mockGetCompletionMetrics.mockResolvedValue({
      user_id: 'user1', completion_rate: 90, completed_tasks: 9, total_tasks: 10, average_completion_days: 2,
    });

    const res = await request(app).get('/api/user/user1/metrics');
    expect(res.status).toBe(200);
    expect(res.body.user_id).toBe('user1');
    expect(res.body.completion_rate).toBe(90);
  });
});

describe('GET /api/team/metrics', () => {
  it('チームメトリクス一覧を返す', async () => {
    mockGetTeamMetrics.mockResolvedValue([
      { user_id: 'user1', completion_rate: 85.5, completed_tasks: 17, total_tasks: 20 },
      { user_id: 'user2', completion_rate: 72.3, completed_tasks: 21, total_tasks: 29 },
    ]);

    const res = await request(app).get('/api/team/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].completion_rate).toBe(85.5);
  });
});

describe('GET /api/tasks/overdue', () => {
  it('期限超過タスクを返す', async () => {
    mockGetOverdueItems.mockResolvedValue([
      { task_name: 'レポート提出', deadline: new Date(Date.now() - 3*24*60*60*1000), days_overdue: 3, assigned_to: 'user1' },
    ]);

    const res = await request(app).get('/api/tasks/overdue');
    expect(res.status).toBe(200);
    expect(res.body[0].days_overdue).toBe(3);
  });

  it('期限超過なしの場合は空配列を返す', async () => {
    mockGetOverdueItems.mockResolvedValue([]);

    const res = await request(app).get('/api/tasks/overdue');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('DBエラー時に500を返す', async () => {
    mockGetOverdueItems.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/tasks/overdue');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch overdue items');
  });
});

describe('GET /api/action-items - userId フィルタ', () => {
  it('userId でフィルタできる', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, assigned_to: 'user1' }] } as any);
    const res = await request(app).get('/api/action-items?userId=user1');
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('assigned_to = $'),
      ['user1']
    );
  });
});

describe('GET /api/evidence-files - actionItemId フィルタ', () => {
  it('actionItemId でフィルタできる', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, action_item_id: 1 }] } as any);
    const res = await request(app).get('/api/evidence-files?actionItemId=1');
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('action_item_id = $'),
      ['1']
    );
  });

  it('DBエラー時に500を返す', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/evidence-files');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch evidence files');
  });
});

describe('GET /api/completion-proofs/:actionItemId - エラー', () => {
  it('DBエラー時に500を返す', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/completion-proofs/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch completion proofs');
  });
});

describe('GET /api/user/:userId/metrics - エラー', () => {
  it('DBエラー時に500を返す', async () => {
    mockGetCompletionMetrics.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/user/user1/metrics');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch metrics');
  });
});

describe('GET /api/team/metrics - エラー', () => {
  it('DBエラー時に500を返す', async () => {
    mockGetTeamMetrics.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/team/metrics');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch team metrics');
  });
});

describe('GET /api/dashboard/summary - エラー', () => {
  it('DBエラー時に500を返す', async () => {
    mockGetTeamMetrics.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch dashboard summary');
  });
});
