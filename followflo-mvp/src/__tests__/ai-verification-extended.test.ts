const mockCreate = jest.fn();
jest.mock('../database', () => ({ query: jest.fn() }));
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import { evaluateEvidenceFile, finalVerifyCompletion } from '../ai-verification';
import { query } from '../database';

const mockQuery = query as jest.MockedFunction<typeof query>;

function makeApiResponse(json: object) {
  return { content: [{ type: 'text', text: JSON.stringify(json) }] };
}

beforeEach(() => {
  mockCreate.mockReset();
  mockQuery.mockReset();
});

// ─── evaluateEvidenceFile ────────────────────────────────────────────────

describe('evaluateEvidenceFile', () => {
  it('承認条件を満たす場合 isApproved=true を返す', async () => {
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: true, isComplete: true, quality: 0.9, issues: [], feedback: '高品質' })
    );
    const result = await evaluateEvidenceFile('証拠内容', 'report.txt', '営業資料作成');
    expect(result.isApproved).toBe(true);
    expect(result.score).toBe(0.9);
    expect(result.feedback).toBe('高品質');
    expect(result.issues).toEqual([]);
  });

  it('quality < 0.7 の場合 isApproved=false を返す', async () => {
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: true, isComplete: true, quality: 0.5, issues: ['内容不足'], feedback: '不十分' })
    );
    const result = await evaluateEvidenceFile('内容', 'draft.txt', 'タスクA');
    expect(result.isApproved).toBe(false);
    expect(result.issues).toContain('内容不足');
  });

  it('isRelevant=false の場合 isApproved=false を返す', async () => {
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: false, isComplete: true, quality: 0.8, issues: [], feedback: '無関係' })
    );
    const result = await evaluateEvidenceFile('内容', 'other.txt', 'タスクB');
    expect(result.isApproved).toBe(false);
  });

  it('isComplete=false の場合 isApproved=false を返す', async () => {
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: true, isComplete: false, quality: 0.8, issues: ['未完了'], feedback: '途中' })
    );
    const result = await evaluateEvidenceFile('内容', 'wip.txt', 'タスクC');
    expect(result.isApproved).toBe(false);
  });

  it('issues が undefined の場合は空配列を返す', async () => {
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: true, isComplete: true, quality: 0.85, feedback: '良好' })
    );
    const result = await evaluateEvidenceFile('内容', 'file.txt', 'タスク');
    expect(result.issues).toEqual([]);
  });

  it('Anthropic API エラー時にフォールバック値を返す', async () => {
    mockCreate.mockRejectedValue(new Error('API timeout'));
    const result = await evaluateEvidenceFile('内容', 'file.txt', 'タスク');
    expect(result.isApproved).toBe(false);
    expect(result.score).toBe(0.5);
    expect(result.issues).toContain('API error');
    expect(result.feedback).toContain('manual review needed');
  });

  it('Anthropic API に taskName を含むプロンプトで呼び出す', async () => {
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: true, isComplete: true, quality: 0.8, issues: [], feedback: 'OK' })
    );
    await evaluateEvidenceFile('内容サンプル', 'test.txt', '営業戦略策定');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-opus-4-8',
        max_tokens: 500,
        messages: expect.arrayContaining([
          expect.objectContaining({ content: expect.stringContaining('営業戦略策定') }),
        ]),
      })
    );
  });
});

// ─── finalVerifyCompletion ────────────────────────────────────────────────

describe('finalVerifyCompletion', () => {
  it('証拠ファイルなしでも必要なフィールドを返す', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ task_name: 'MTG準備', assigned_to: 'user1', deadline: '2026-12-31' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const result = await finalVerifyCompletion('task-1', '✅ MTG準備 完了 user1', 'user1');
    expect(result).toHaveProperty('final_confidence');
    expect(result).toHaveProperty('final_stage');
    expect(result.evidence_files).toEqual([]);
    expect(result.final_confidence).toBeLessThanOrEqual(0.99);
  });

  it('承認済み証拠ファイルがある場合 finalStage=4 になる', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ task_name: 'タスクX', assigned_to: 'u1', deadline: '2026-12-31' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ task_name: 'タスクX' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: true, isComplete: true, quality: 0.9, issues: [], feedback: '良好' })
    );

    const result = await finalVerifyCompletion(
      'task-1', '✅ タスクX 完了 u1', 'u1',
      [{ id: 'ef-1', file_name: 'proof.txt', file_content: '完了証拠', file_type: 'text', action_item_id: 'task-1', uploaded_by: 'u1' }] as any
    );
    expect(result.final_stage).toBe(4);
  });

  it('証拠ファイルあり・評価未承認の場合 finalStage=3 になる', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ task_name: 'タスクY', assigned_to: 'u2', deadline: '2026-12-31' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ task_name: 'タスクY' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: false, isComplete: false, quality: 0.3, issues: ['不十分'], feedback: 'NG' })
    );

    const result = await finalVerifyCompletion(
      'task-1', '✅ タスクY 完了 u2', 'u2',
      [{ id: 'ef-2', file_name: 'draft.txt', file_content: '不完全', file_type: 'text', action_item_id: 'task-1', uploaded_by: 'u2' }] as any
    );
    expect(result.final_stage).toBe(3);
  });

  it('final_confidence が 0.99 を超えない', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ task_name: 'タスクZ', assigned_to: 'u3', deadline: '2026-12-31' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ task_name: 'タスクZ' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockCreate.mockResolvedValue(
      makeApiResponse({ isRelevant: true, isComplete: true, quality: 1.0, issues: [], feedback: '完璧' })
    );

    const result = await finalVerifyCompletion(
      'task-1', '✅ タスクZ 完了 u3', 'u3',
      [{ id: 'ef-3', file_name: 'perfect.txt', file_content: '完璧', file_type: 'text', action_item_id: 'task-1', uploaded_by: 'u3' }] as any
    );
    expect(result.final_confidence).toBeLessThanOrEqual(0.99);
    expect(result.confidence).toBeLessThanOrEqual(0.99);
  });

  it('file_content が null の場合はAPIを呼び出さない', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ task_name: 'タスクW', assigned_to: 'u4', deadline: '2026-12-31' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ task_name: 'タスクW' }] } as any);

    await finalVerifyCompletion(
      'task-1', '✅ タスクW 完了 u4', 'u4',
      [{ id: 'ef-4', file_name: 'image.png', file_content: null, file_type: 'image', action_item_id: 'task-1', uploaded_by: 'u4' }] as any
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
