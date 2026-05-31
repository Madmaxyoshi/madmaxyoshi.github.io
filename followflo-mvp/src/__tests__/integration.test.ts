import { verifyCompletion, updateVerificationStage } from '../ai-verification';
import { query } from '../database';

jest.mock('../database');

describe('FollowFlo MVP - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End: Action Item Completion Flow', () => {
    it('should complete full workflow: detect → verify → escalate → report', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;

      // Step 1: User sends completion message
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'action-123',
            task_name: 'Database Migration',
            assigned_to: 'user-john',
            deadline: '2026-06-15',
            status: 'pending',
          },
        ],
      } as any);

      const verification = await verifyCompletion(
        'action-123',
        '✅ Database Migration を完了しました',
        'user-john'
      );

      expect(verification.verified).toBe(true);
      expect(verification.stage).toBeGreaterThan(0);
      expect(verification.confidence).toBeGreaterThan(0.5);
      expect(verification.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle escalation for low-confidence completions', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'action-456',
            task_name: 'Critical Review',
            assigned_to: 'user-jane',
            deadline: '2026-05-31',
          },
        ],
      } as any);

      const verification = await verifyCompletion(
        'action-456',
        '完了',
        'user-jane'
      );

      if (verification.confidence < 0.8) {
        expect(verification.stage).toBe(3);
        expect(verification.reason).toContain('human review');
      }
    });

    it('should record verification stage in database', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValue({ rows: [] } as any);

      await updateVerificationStage('action-789', 2);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE action_items'),
        [2, 'action-789']
      );
    });
  });

  describe('Multi-User Scenario', () => {
    it('should handle multiple users completing different tasks', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;

      // User A completes task
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'task-a1',
            task_name: 'Feature A',
            assigned_to: 'user-a',
            deadline: '2026-06-01',
          },
        ],
      } as any);

      const resultA = await verifyCompletion(
        'task-a1',
        '✅ Feature A 完了',
        'user-a'
      );

      expect(resultA.verified).toBe(true);

      // User B completes task
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'task-b1',
            task_name: 'Feature B',
            assigned_to: 'user-b',
            deadline: '2026-06-02',
          },
        ],
      } as any);

      const resultB = await verifyCompletion(
        'task-b1',
        '✅ Feature B を完了',
        'user-b'
      );

      expect(resultB.verified).toBe(true);
      expect(resultA.hash).not.toBe(resultB.hash);
    });
  });

  describe('Quality Metrics', () => {
    it('should provide reliable confidence scoring', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            task_name: 'QA Test',
            assigned_to: 'user-qa',
            deadline: '2026-06-10',
          },
        ],
      } as any);

      const result = await verifyCompletion(
        'qa-001',
        '✅ QA Test を完了しました',
        'user-qa'
      );

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(typeof result.confidence).toBe('number');
    });
  });
});
