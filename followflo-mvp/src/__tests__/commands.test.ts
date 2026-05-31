import { registerCommands } from '../commands';

jest.mock('../database', () => ({
  query: jest.fn(),
}));

jest.mock('../metrics', () => ({
  getCompletionMetrics: jest.fn(),
}));

import { query } from '../database';
import { getCompletionMetrics } from '../metrics';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetCompletionMetrics = getCompletionMetrics as jest.MockedFunction<typeof getCompletionMetrics>;

const mockPostMessage = jest.fn().mockResolvedValue({ ok: true });
const mockPostEphemeral = jest.fn().mockResolvedValue({ ok: true });

const mockClient = {
  chat: {
    postMessage: mockPostMessage,
    postEphemeral: mockPostEphemeral,
  },
};

let registeredHandler: Function;
const mockApp = {
  command: jest.fn((name: string, handler: Function) => {
    registeredHandler = handler;
  }),
} as any;

function makeCommand(text: string, overrides = {}) {
  return {
    text,
    channel_id: 'C_TEST',
    user_id: 'U_TEST',
    ...overrides,
  };
}

async function invokeCommand(text: string) {
  const ack = jest.fn();
  await registeredHandler({ ack, command: makeCommand(text), body: {}, client: mockClient });
  return ack;
}

beforeEach(() => {
  jest.clearAllMocks();
  registerCommands(mockApp);
});

describe('registerCommands', () => {
  it('/followflo コマンドを登録する', () => {
    expect(mockApp.command).toHaveBeenCalledWith('/followflo', expect.any(Function));
  });
});

describe('/followflo create', () => {
  it('正しい形式でタスクを作成する', async () => {
    mockQuery.mockResolvedValue({ rows: [] } as any);

    const ack = await invokeCommand('create "営業資料作成" @user1 deadline:2026-12-31');

    expect(ack).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO action_items'),
      ['営業資料作成', 'user1', '2026-12-31', 'U_TEST', 'C_TEST']
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('✅ アクションアイテムを記録') })
    );
  });

  it('タスク名がない場合はエラーメッセージを返す', async () => {
    await invokeCommand('create @user1 deadline:2026-12-31');
    expect(mockPostEphemeral).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('使用方法') })
    );
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('ユーザーが指定されていない場合はエラーを返す', async () => {
    await invokeCommand('create "タスク名" deadline:2026-12-31');
    expect(mockPostEphemeral).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('使用方法') })
    );
  });

  it('期限が指定されていない場合はエラーを返す', async () => {
    await invokeCommand('create "タスク名" @user1');
    expect(mockPostEphemeral).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('使用方法') })
    );
  });

  it('過去の日付の場合は警告を返す', async () => {
    await invokeCommand('create "タスク名" @user1 deadline:2020-01-01');
    expect(mockPostEphemeral).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('過去の日付') })
    );
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('DBエラー時にエラーメッセージを返す', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));
    await invokeCommand('create "タスク名" @user1 deadline:2026-12-31');
    expect(mockPostEphemeral).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('データベースエラー') })
    );
  });
});

describe('/followflo list', () => {
  it('未完了タスクの一覧を表示する', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { id: 1, task_name: '営業資料', assigned_to: 'user1', deadline: '2026-12-31', status: 'pending' },
        { id: 2, task_name: '会議準備', assigned_to: 'user2', deadline: '2026-12-30', status: 'pending' },
      ],
    } as any);

    await invokeCommand('list');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('2件') })
    );
  });

  it('タスクがない場合は完了メッセージを表示する', async () => {
    mockQuery.mockResolvedValue({ rows: [] } as any);

    await invokeCommand('show');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('未完了のタスクはありません') })
    );
  });
});

describe('/followflo status', () => {
  it('ユーザーの完了率を表示する', async () => {
    mockGetCompletionMetrics.mockResolvedValue({
      user_id: 'U_TEST',
      completion_rate: 85,
      completed_tasks: 17,
      total_tasks: 20,
      average_completion_time_hours: 3,
    });

    await invokeCommand('status');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('85') })
    );
  });
});

describe('/followflo help', () => {
  it('helpコマンドでヘルプを表示する', async () => {
    await invokeCommand('help');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('FlowFllo コマンドヘルプ') })
    );
  });

  it('不明なコマンドでもヘルプを表示する', async () => {
    await invokeCommand('unknown');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('FlowFllo コマンドヘルプ') })
    );
  });
});

describe('エラーハンドリング', () => {
  it('予期せぬエラー時にephemeralエラーを送る', async () => {
    mockGetCompletionMetrics.mockRejectedValue(new Error('Unexpected'));

    await invokeCommand('status');
    expect(mockPostEphemeral).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('エラーが発生しました') })
    );
  });
});
