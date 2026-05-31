import { registerListeners } from '../listeners';

jest.mock('../database', () => ({ query: jest.fn() }));
jest.mock('../ai-verification', () => ({
  verifyCompletion: jest.fn(),
  updateVerificationStage: jest.fn(),
  finalVerifyCompletion: jest.fn(),
  evaluateEvidenceFile: jest.fn(),
}));

import { query } from '../database';
import { verifyCompletion, updateVerificationStage, evaluateEvidenceFile } from '../ai-verification';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockVerifyCompletion = verifyCompletion as jest.MockedFunction<typeof verifyCompletion>;
const mockUpdateVerificationStage = updateVerificationStage as jest.MockedFunction<typeof updateVerificationStage>;
const mockEvaluateEvidenceFile = evaluateEvidenceFile as jest.MockedFunction<typeof evaluateEvidenceFile>;

const mockPostMessage = jest.fn().mockResolvedValue({ ok: true });
const mockFilesInfo = jest.fn();
const mockClient = {
  chat: { postMessage: mockPostMessage },
  files: { info: mockFilesInfo },
};

const handlers: Record<string, Function> = {};
const mockApp = {
  message: jest.fn((handler: Function) => { handlers['message'] = handler; }),
  event: jest.fn((name: string, handler: Function) => { handlers[name] = handler; }),
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  registerListeners(mockApp);
});

describe('registerListeners', () => {
  it('message / reaction_added / file_shared を登録する', () => {
    expect(mockApp.message).toHaveBeenCalled();
    expect(mockApp.event).toHaveBeenCalledWith('reaction_added', expect.any(Function));
    expect(mockApp.event).toHaveBeenCalledWith('file_shared', expect.any(Function));
  });
});

describe('message listener', () => {
  const pendingItem = { id: 'task-1', task_name: '営業資料作成' };

  async function sendMessage(text: string, user = 'U_USER') {
    await handlers['message']({
      message: { text, user, channel: 'C_CHAN' },
      client: mockClient,
    });
  }

  it('✅ を含むメッセージで完了検証を実行する', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pendingItem] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockVerifyCompletion.mockResolvedValue({ verified: true, stage: 1, confidence: 0.95, hash: 'abc', reason: '' });
    mockUpdateVerificationStage.mockResolvedValue(undefined as any);

    await sendMessage('✅ タスク完了しました');

    expect(mockVerifyCompletion).toHaveBeenCalledWith('task-1', '✅ タスク完了しました', 'U_USER');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('を完了しました') })
    );
  });

  it('"完了" を含むメッセージでも検証を実行する', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pendingItem] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockVerifyCompletion.mockResolvedValue({ verified: true, stage: 1, confidence: 0.9, hash: 'def', reason: '' });
    mockUpdateVerificationStage.mockResolvedValue(undefined as any);

    await sendMessage('完了しました');
    expect(mockVerifyCompletion).toHaveBeenCalled();
  });

  it('検証失敗時に失敗メッセージを送る', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [pendingItem] } as any);
    mockVerifyCompletion.mockResolvedValue({ verified: false, stage: 3, confidence: 0.3, hash: '', reason: 'needs human review' });
    mockUpdateVerificationStage.mockResolvedValue(undefined as any);

    await sendMessage('完了');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('完了認証に失敗') })
    );
  });

  it('stage 3 のとき人間確認メッセージを含む', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pendingItem] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockVerifyCompletion.mockResolvedValue({ verified: true, stage: 3, confidence: 0.75, hash: 'ghi', reason: '' });
    mockUpdateVerificationStage.mockResolvedValue(undefined as any);

    await sendMessage('✅ done');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('人間による確認') })
    );
  });

  it('完了キーワードがない場合は何もしない', async () => {
    await sendMessage('普通のメッセージです');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('テキストがないメッセージは無視する', async () => {
    await handlers['message']({ message: {}, client: mockClient });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('未完了タスクがない場合は何もしない', async () => {
    mockQuery.mockResolvedValue({ rows: [] } as any);
    await sendMessage('✅ 完了');
    expect(mockVerifyCompletion).not.toHaveBeenCalled();
  });

  it('エラー発生時も例外をスローしない', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));
    await expect(sendMessage('✅ 完了')).resolves.not.toThrow();
  });
});

describe('reaction_added listener', () => {
  const pendingItem = { id: 'task-2', task_name: 'チームMTG' };

  async function addReaction(reaction: string, user = 'U_REACT') {
    await handlers['reaction_added']({
      event: { reaction, user, item: { channel: 'C_CHAN' } },
      client: mockClient,
    });
  }

  it('white_check_mark リアクションで完了検証する', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pendingItem] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockVerifyCompletion.mockResolvedValue({ verified: true, stage: 1, confidence: 0.9, hash: 'jkl', reason: '' });
    mockUpdateVerificationStage.mockResolvedValue(undefined as any);

    await addReaction('white_check_mark');
    expect(mockVerifyCompletion).toHaveBeenCalledWith('task-2', 'Reaction: white_check_mark', 'U_REACT');
    expect(mockPostMessage).toHaveBeenCalled();
  });

  it('heavy_check_mark リアクションでも完了検証する', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pendingItem] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockVerifyCompletion.mockResolvedValue({ verified: true, stage: 1, confidence: 0.88, hash: 'mno', reason: '' });
    mockUpdateVerificationStage.mockResolvedValue(undefined as any);

    await addReaction('heavy_check_mark');
    expect(mockVerifyCompletion).toHaveBeenCalled();
  });

  it('無関係なリアクションは無視する', async () => {
    await addReaction('thumbsup');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('エラー発生時も例外をスローしない', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));
    await expect(addReaction('white_check_mark')).resolves.not.toThrow();
  });
});

describe('file_shared listener', () => {
  const pendingItem = { id: 'task-3', task_name: '報告書提出' };

  async function shareFile(file: object, userId = 'U_FILE') {
    mockFilesInfo.mockResolvedValue({ file });
    await handlers['file_shared']({
      event: { file_id: 'F_001', user_id: userId, channel_id: 'C_CHAN' },
      client: mockClient,
    });
  }

  it('テキストファイルをAI評価してスコアを保存する', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pendingItem] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'ef-1' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockEvaluateEvidenceFile.mockResolvedValue({ score: 0.9, feedback: '高品質', isApproved: true, issues: [] });

    global.fetch = jest.fn().mockResolvedValue({ text: async () => 'ファイル内容' }) as any;

    await shareFile({
      url_private: 'https://slack/file.txt',
      name: 'report.txt',
      filetype: 'text',
      mimetype: 'text/plain',
    });

    expect(mockEvaluateEvidenceFile).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('承認済み') })
    );
  });

  it('画像ファイルはAI評価をスキップしDBのみに保存する', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pendingItem] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'ef-2' }] } as any);

    await shareFile({
      url_private: 'https://slack/image.png',
      name: 'screenshot.png',
      filetype: 'png',
      mimetype: 'image/png',
    });

    expect(mockEvaluateEvidenceFile).not.toHaveBeenCalled();
  });

  it('エラー発生時も例外をスローしない', async () => {
    mockFilesInfo.mockRejectedValue(new Error('Slack API error'));
    await expect(shareFile({})).resolves.not.toThrow();
  });

  it('fetch失敗時もエラーをログして処理を継続する', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [pendingItem] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'ef-3' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    mockEvaluateEvidenceFile.mockResolvedValue({ score: 0.5, feedback: 'OK', isApproved: false, issues: [] });

    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(shareFile({
      url_private: 'https://slack/file.txt',
      name: 'report.txt',
      filetype: 'text',
      mimetype: 'text/plain',
    })).resolves.not.toThrow();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to fetch file content:',
      expect.any(Error)
    );
  });
});
