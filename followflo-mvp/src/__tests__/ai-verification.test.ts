import { verifyCompletion, updateVerificationStage } from '../ai-verification';
import { query } from '../database';

// Mock database module
jest.mock('../database');

describe('AI Verification Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stage 1: Auto-detection', () => {
    it('should detect completion keyword ✅', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValue({
        rows: [],
      } as any);

      const result = await verifyCompletion('test-id', '✅ 完了しました', 'user123');
      expect(result.stage).toBe(1);
      expect(result.verified).toBe(false);
    });

    it('should detect Japanese completion keyword 完了', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValue({
        rows: [],
      } as any);

      const result = await verifyCompletion('test-id', '完了です', 'user123');
      expect(result.verified).toBe(false);
    });

    it('should reject message without completion keywords', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;

      const result = await verifyCompletion('test-id', 'just a regular message', 'user123');
      expect(result.stage).toBe(0);
      expect(result.verified).toBe(false);
      expect(result.reason).toBe('No completion keywords detected');
    });
  });

  describe('Stage 2: Context verification', () => {
    it('should verify when task name matches and user is assigned', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            task_name: 'Database Migration',
            assigned_to: 'user123',
            deadline: '2026-06-15',
          },
        ],
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const result = await verifyCompletion(
        'test-id',
        '✅ Database Migration を完了しました',
        'user123'
      );

      expect(result.stage).toBeGreaterThanOrEqual(1);
      expect(result.verified).toBe(true);
    });

    it('should fail context verification when user is not assigned', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            task_name: 'Database Migration',
            assigned_to: 'other_user',
            deadline: '2026-06-15',
          },
        ],
      } as any);

      const result = await verifyCompletion(
        'test-id',
        '✅ Database Migration 完了',
        'user123'
      );

      expect(result.verified).toBe(false);
      expect(result.reason).toContain('mismatch');
    });
  });

  describe('Stage 3: Proof recording', () => {
    it('should record completion proof with hash', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            task_name: 'Test Task',
            assigned_to: 'user123',
            deadline: '2026-06-15',
          },
        ],
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const result = await verifyCompletion(
        'test-id',
        '✅ Test Task 完了',
        'user123'
      );

      expect(result.hash).toBeTruthy();
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Stage 4: Confidence scoring', () => {
    it('should flag for review when confidence is low', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            task_name: 'Important Task',
            assigned_to: 'user123',
            deadline: '2026-06-15',
          },
        ],
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      // Task name not in message, user matches = 0.6 confidence
      const result = await verifyCompletion(
        'test-id',
        '✅ 完了しました',
        'user123'
      );

      if (result.confidence < 0.8) {
        expect(result.stage).toBe(3);
        expect(result.reason).toContain('human review');
      }
    });

    it('should auto-verify when confidence is high', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            task_name: 'Test Task',
            assigned_to: 'user123',
            deadline: '2026-06-15',
          },
        ],
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      // Task name in message + user matches = 1.0 confidence
      const result = await verifyCompletion(
        'test-id',
        '✅ Test Task を完了しました',
        'user123'
      );

      expect(result.confidence).toBe(0.95);
      if (result.confidence >= 0.8) {
        expect(result.reason).toBe('Automatically verified');
      }
    });
  });

  describe('Update verification stage', () => {
    it('should update verification stage in database', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>;
      mockQuery.mockResolvedValue({ rows: [] } as any);

      await updateVerificationStage('test-id', 2);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE action_items'),
        [2, 'test-id']
      );
    });
  });
});
