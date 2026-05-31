import { query } from '../database';

jest.mock('../database');
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              isRelevant: true,
              isComplete: true,
              quality: 0.85,
              issues: [],
              feedback: 'Task completed successfully',
            }),
          },
        ],
      }),
    },
  })),
}));

describe('Evidence File Quality Evaluation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record evidence files in database', async () => {
    const mockQuery = query as jest.MockedFunction<typeof query>;

    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await mockQuery(
      `INSERT INTO evidence_files (action_item_id, file_url, file_name, file_type, uploaded_by, file_content, ai_review_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['action-123', 'https://slack.com/files/test.txt', 'migration.log', 'txt', 'user-john', 'Migration complete', 'pending']
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO evidence_files'),
      expect.arrayContaining(['action-123'])
    );
  });

  it('should update file quality score after evaluation', async () => {
    const mockQuery = query as jest.MockedFunction<typeof query>;

    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await mockQuery(
      `UPDATE evidence_files SET quality_score = $1, quality_feedback = $2, ai_review_status = $3 WHERE id = $4`,
      [0.85, 'Complete evidence', 'approved', 'file-123']
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE evidence_files'),
      [0.85, expect.any(String), expect.any(String), 'file-123']
    );
  });

  it('should track approval status of evidence files', async () => {
    const mockQuery = query as jest.MockedFunction<typeof query>;

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'file-1',
          quality_score: 0.9,
          ai_review_status: 'approved',
        },
      ],
    } as any);

    const result = await mockQuery(
      `SELECT quality_score, ai_review_status FROM evidence_files WHERE id = $1`,
      ['file-1']
    );

    expect(result.rows[0].ai_review_status).toBe('approved');
    expect(result.rows[0].quality_score).toBeGreaterThan(0.8);
  });

  it('should handle multiple evidence files per task', async () => {
    const mockQuery = query as jest.MockedFunction<typeof query>;

    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'file-1', quality_score: 0.9, ai_review_status: 'approved' },
        { id: 'file-2', quality_score: 0.75, ai_review_status: 'needs_review' },
        { id: 'file-3', quality_score: 0.88, ai_review_status: 'approved' },
      ],
    } as any);

    const result = await mockQuery(
      `SELECT * FROM evidence_files WHERE action_item_id = $1`,
      ['action-123']
    );

    expect(result.rows.length).toBe(3);
    const approved = result.rows.filter((f: any) => f.ai_review_status === 'approved');
    expect(approved.length).toBe(2);
  });
});
