import { getCompletionMetrics, getTeamMetrics, getOverdueItems } from '../metrics.mock';

describe('getCompletionMetrics', () => {
  it('user_id を含む結果を返す', async () => {
    const result = await getCompletionMetrics('user1');
    expect(result.user_id).toBe('user1');
  });

  it('数値フィールドを持つ', async () => {
    const result = await getCompletionMetrics('user2');
    expect(typeof result.completion_rate).toBe('number');
    expect(typeof result.completed_tasks).toBe('number');
    expect(typeof result.total_tasks).toBe('number');
    expect(typeof result.average_completion_days).toBe('number');
  });

  it('completion_rate が 0〜100 の範囲内', async () => {
    const result = await getCompletionMetrics('user3');
    expect(result.completion_rate).toBeGreaterThanOrEqual(0);
    expect(result.completion_rate).toBeLessThanOrEqual(100);
  });
});

describe('getTeamMetrics', () => {
  it('4人分のチームメトリクスを返す', async () => {
    const result = await getTeamMetrics();
    expect(result).toHaveLength(4);
  });

  it('各メンバーに必要なフィールドがある', async () => {
    const result = await getTeamMetrics();
    result.forEach((m: any) => {
      expect(m).toHaveProperty('user_id');
      expect(m).toHaveProperty('completion_rate');
      expect(m).toHaveProperty('completed_tasks');
      expect(m).toHaveProperty('total_tasks');
    });
  });

  it('固定データを返す（user1のcompletion_rate=85.5）', async () => {
    const result = await getTeamMetrics();
    const user1 = result.find((m: any) => m.user_id === 'user1')!;
    expect(user1.completion_rate).toBe(85.5);
  });
});

describe('getOverdueItems', () => {
  it('2件の期限超過タスクを返す', async () => {
    const result = await getOverdueItems();
    expect(result).toHaveLength(2);
  });

  it('各アイテムに必要なフィールドがある', async () => {
    const result = await getOverdueItems();
    result.forEach((item: any) => {
      expect(item).toHaveProperty('task_name');
      expect(item).toHaveProperty('deadline');
      expect(item).toHaveProperty('assigned_to');
      expect(item).toHaveProperty('days_overdue');
    });
  });

  it('deadline が過去の日付である', async () => {
    const result = await getOverdueItems();
    result.forEach((item: any) => {
      expect(item.deadline.getTime()).toBeLessThan(Date.now());
    });
  });
});
