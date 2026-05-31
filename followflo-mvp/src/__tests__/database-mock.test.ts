import { initDatabase, query } from '../database.mock';

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('initDatabase', () => {
  it('正常に初期化できる', async () => {
    await expect(initDatabase()).resolves.toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Mock database initialized'));
  });
});

describe('query - action_items', () => {
  it('全件取得', async () => {
    const result = await query('SELECT * FROM action_items ORDER BY created_at DESC');
    expect(result.rows).toHaveLength(3);
  });

  it('status=pending でフィルタ', async () => {
    const result = await query('SELECT * FROM action_items WHERE status = $1', ['pending']);
    expect(result.rows.every((r: any) => r.status === 'pending')).toBe(true);
  });

  it('status=completed でフィルタ', async () => {
    const result = await query('SELECT * FROM action_items WHERE status = $1', ['completed']);
    expect(result.rows.every((r: any) => r.status === 'completed')).toBe(true);
  });

  it('assigned_to でフィルタ', async () => {
    const result = await query('SELECT * FROM action_items WHERE assigned_to = $1', ['user1']);
    expect(result.rows.every((r: any) => r.assigned_to === 'user1')).toBe(true);
  });

  it('WHERE なしは全件返す', async () => {
    const result = await query('SELECT * FROM action_items');
    expect(result.rows).toHaveLength(3);
  });
});

describe('query - evidence_files', () => {
  it('全件取得', async () => {
    const result = await query('SELECT * FROM evidence_files ORDER BY created_at DESC');
    expect(result.rows).toHaveLength(2);
  });

  it('action_item_id でフィルタ', async () => {
    const result = await query('SELECT * FROM evidence_files WHERE action_item_id = $1', [1]);
    expect(result.rows.every((r: any) => r.action_item_id === 1)).toBe(true);
  });

  it('ai_review_status=approved でフィルタ', async () => {
    const result = await query('SELECT * FROM evidence_files WHERE ai_review_status = $1', ['approved']);
    expect(result.rows.every((r: any) => r.ai_review_status === 'approved')).toBe(true);
  });
});

describe('query - completion_proofs', () => {
  it('全件取得', async () => {
    const result = await query('SELECT * FROM completion_proofs ORDER BY created_at DESC');
    expect(result.rows).toHaveLength(2);
  });

  it('action_item_id でフィルタ', async () => {
    const result = await query('SELECT * FROM completion_proofs WHERE action_item_id = $1', [1]);
    expect(result.rows.every((r: any) => r.action_item_id === 1)).toBe(true);
  });
});

describe('query - COUNT', () => {
  it('全タスク数を返す', async () => {
    const result = await query('SELECT COUNT(*) as total FROM action_items');
    expect((result.rows[0] as any).total).toBe('3');
  });

  it('status=pending のタスク数を返す', async () => {
    const result = await query('SELECT COUNT(*) as total FROM action_items WHERE status = $1', ['pending']);
    expect(parseInt((result.rows[0] as any).total)).toBe(2);
  });

  it('status=completed のタスク数を返す', async () => {
    const result = await query('SELECT COUNT(*) as total FROM action_items WHERE status = $1', ['completed']);
    expect(parseInt((result.rows[0] as any).total)).toBe(1);
  });
});

describe('query - 未知のクエリ', () => {
  it('空の rows を返す', async () => {
    const result = await query('UNKNOWN SQL QUERY');
    expect(result.rows).toEqual([]);
  });
});
