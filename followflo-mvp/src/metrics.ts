import { query } from './database';
import { CompletionMetric } from './types';

export async function getCompletionMetrics(userId: string): Promise<CompletionMetric> {
  const result = await query(
    `SELECT
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
      ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) /
        NULLIF(COUNT(*), 0), 2) as completion_rate,
      ROUND(AVG(EXTRACT(EPOCH FROM (
        SELECT completed_at FROM completion_proofs
        WHERE action_item_id = action_items.id LIMIT 1
      ) - action_items.created_at) / 3600), 2) as average_completion_time_hours
    FROM action_items
    WHERE assigned_to = $1`,
    [userId]
  );

  const row = result.rows[0];
  return {
    user_id: userId,
    total_tasks: parseInt(row.total_tasks) || 0,
    completed_tasks: parseInt(row.completed_tasks) || 0,
    completion_rate: parseFloat(row.completion_rate) || 0,
    average_completion_time_hours: parseFloat(row.average_completion_time_hours) || 0,
  };
}

export async function getTeamMetrics(): Promise<any> {
  const result = await query(
    `SELECT
      assigned_to as user_id,
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
      ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) /
        NULLIF(COUNT(*), 0), 2) as completion_rate
    FROM action_items
    GROUP BY assigned_to
    ORDER BY completion_rate DESC`
  );

  return result.rows.map(row => ({
    user_id: row.user_id,
    total_tasks: parseInt(row.total_tasks),
    completed_tasks: parseInt(row.completed_tasks),
    completion_rate: parseFloat(row.completion_rate),
  }));
}

export async function getOverdueItems(): Promise<any> {
  const result = await query(
    `SELECT id, task_name, assigned_to, deadline
    FROM action_items
    WHERE status = 'pending' AND deadline < NOW()`
  );

  return result.rows;
}
