jest.mock('../database', () => ({ query: jest.fn() }));

import { getCompletionMetrics, getTeamMetrics, getOverdueItems } from '../metrics';
import { query } from '../database';

const mockQuery = query as jest.MockedFunction<typeof query>;

beforeEach(() => mockQuery.mockReset());

describe('getCompletionMetrics', () => {
  it('DBの結果を正しい型に変換して返す', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ total_tasks: '10', completed_tasks: '7', completion_rate: '70.00', average_completion_time_hours: '24.50' }],
    } as any);

    const result = await getCompletionMetrics('user1');
    expect(result.user_id).toBe('user1');
    expect(result.total_tasks).toBe(10);
    expect(result.completed_tasks).toBe(7);
    expect(result.completion_rate).toBe(70.0);
    expect(result.average_completion_time_hours).toBe(24.5);
  });

  it('NULL値は0にフォールバックする', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ total_tasks: null, completed_tasks: null, completion_rate: null, average_completion_time_hours: null }],
    } as any);

    const result = await getCompletionMetrics('user2');
    expect(result.total_tasks).toBe(0);
    expect(result.completed_tasks).toBe(0);
    expect(result.completion_rate).toBe(0);
    expect(result.average_completion_time_hours).toBe(0);
  });

  it('正しいSQLクエリを実行する', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ total_tasks: '5', completed_tasks: '3', completion_rate: '60.00', average_completion_time_hours: '12.00' }],
    } as any);

    await getCompletionMetrics('user3');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE assigned_to = $1'),
      ['user3']
    );
  });
});

describe('getTeamMetrics', () => {
  it('複数ユーザーのメトリクスを配列で返す', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { user_id: 'user1', total_tasks: '20', completed_tasks: '17', completion_rate: '85.00' },
        { user_id: 'user2', total_tasks: '15', completed_tasks: '10', completion_rate: '66.67' },
      ],
    } as any);

    const result = await getTeamMetrics();
    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBe('user1');
    expect(result[0].total_tasks).toBe(20);
    expect(result[0].completion_rate).toBe(85.0);
  });

  it('GROUP BY assigned_to を含むクエリを実行する', async () => {
    mockQuery.mockResolvedValue({ rows: [] } as any);
    await getTeamMetrics();
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('GROUP BY assigned_to'));
  });
});

describe('getOverdueItems', () => {
  it('期限超過タスクを返す', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { id: 1, task_name: '報告書', assigned_to: 'user1', deadline: '2026-05-01' },
      ],
    } as any);

    const result = await getOverdueItems();
    expect(result).toHaveLength(1);
    expect(result[0].task_name).toBe('報告書');
  });

  it('deadline < NOW() を含むクエリを実行する', async () => {
    mockQuery.mockResolvedValue({ rows: [] } as any);
    await getOverdueItems();
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('deadline < NOW()')
    );
  });

  it('超過なしの場合は空配列を返す', async () => {
    mockQuery.mockResolvedValue({ rows: [] } as any);
    const result = await getOverdueItems();
    expect(result).toEqual([]);
  });
});
