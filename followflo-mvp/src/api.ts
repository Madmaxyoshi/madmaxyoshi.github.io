import express, { Request, Response } from 'express';
import { query } from './database.mock';
import { getCompletionMetrics, getTeamMetrics, getOverdueItems } from './metrics.mock';

const router = express.Router();

router.get('/api/user/:userId/metrics', async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const metrics = await getCompletionMetrics(userId);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.get('/api/team/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getTeamMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching team metrics:', error);
    res.status(500).json({ error: 'Failed to fetch team metrics' });
  }
});

router.get('/api/tasks/overdue', async (req: Request, res: Response) => {
  try {
    const items = await getOverdueItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching overdue items:', error);
    res.status(500).json({ error: 'Failed to fetch overdue items' });
  }
});

router.get('/api/action-items', async (req: Request, res: Response) => {
  try {
    const status = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    const userId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
    let queryStr = 'SELECT * FROM action_items WHERE 1=1';
    const params: any[] = [];

    if (status) {
      queryStr += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (userId) {
      queryStr += ' AND assigned_to = $' + (params.length + 1);
      params.push(userId);
    }

    queryStr += ' ORDER BY created_at DESC';

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching action items:', error);
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

router.get('/api/evidence-files', async (req: Request, res: Response) => {
  try {
    const actionItemId = Array.isArray(req.query.actionItemId) ? req.query.actionItemId[0] : req.query.actionItemId;
    const approved = Array.isArray(req.query.approved) ? req.query.approved[0] : req.query.approved;
    let queryStr = 'SELECT * FROM evidence_files WHERE 1=1';
    const params: any[] = [];

    if (actionItemId) {
      queryStr += ' AND action_item_id = $' + (params.length + 1);
      params.push(actionItemId);
    }

    if (approved) {
      const status = approved === 'true' ? 'approved' : 'needs_review';
      queryStr += ' AND ai_review_status = $' + (params.length + 1);
      params.push(status);
    }

    queryStr += ' ORDER BY created_at DESC';

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evidence files:', error);
    res.status(500).json({ error: 'Failed to fetch evidence files' });
  }
});

router.get('/api/completion-proofs/:actionItemId', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM completion_proofs WHERE action_item_id = $1 ORDER BY created_at DESC',
      [req.params.actionItemId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching completion proofs:', error);
    res.status(500).json({ error: 'Failed to fetch completion proofs' });
  }
});

router.get('/api/dashboard/summary', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.query.userId as string | string[] | undefined;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

    const userMetrics = userId ? await getCompletionMetrics(userId) : null;
    const teamMetrics = await getTeamMetrics();
    const overdueItems = await getOverdueItems();

    const totalTasksResult = await query('SELECT COUNT(*) as total FROM action_items');
    const completedTasksResult = await query(
      'SELECT COUNT(*) as total FROM action_items WHERE status = $1',
      ['completed']
    );

    res.json({
      user: userMetrics,
      team: teamMetrics,
      overdue: overdueItems,
      globalStats: {
        totalTasks: parseInt((totalTasksResult.rows[0] as any)?.total || '0'),
        completedTasks: parseInt((completedTasksResult.rows[0] as any)?.total || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

export default router;
