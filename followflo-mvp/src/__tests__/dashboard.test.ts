jest.mock('../metrics', () => ({
  getCompletionMetrics: jest.fn(),
  getTeamMetrics: jest.fn(),
  getOverdueItems: jest.fn(),
}));

import { registerDashboard } from '../dashboard';
import * as metrics from '../metrics';

const mockGetCompletionMetrics = metrics.getCompletionMetrics as jest.Mock;
const mockGetTeamMetrics = metrics.getTeamMetrics as jest.Mock;
const mockGetOverdueItems = metrics.getOverdueItems as jest.Mock;

const mockAck = jest.fn();
const mockViewsOpen = jest.fn();
const mockPostEphemeral = jest.fn();
const mockClient = {
  views: { open: mockViewsOpen },
  chat: { postEphemeral: mockPostEphemeral },
};
const mockBody = {
  user_id: 'user1',
  trigger_id: 'trigger123',
  channel_id: 'C123',
};

let capturedHandler: Function;
const mockApp = {
  command: jest.fn().mockImplementation((_cmd: string, handler: Function) => {
    capturedHandler = handler;
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCompletionMetrics.mockResolvedValue({
    user_id: 'user1',
    total_tasks: 10,
    completed_tasks: 7,
    completion_rate: 70,
    average_completion_time_hours: 24,
  });
  mockGetTeamMetrics.mockResolvedValue([
    { user_id: 'user1', total_tasks: 10, completed_tasks: 7, completion_rate: 70 },
  ]);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('registerDashboard', () => {
  it('/followflo-dashboard コマンドを登録する', async () => {
    await registerDashboard(mockApp as any);
    expect(mockApp.command).toHaveBeenCalledWith('/followflo-dashboard', expect.any(Function));
  });

  it('期限超過タスクなしで成功する', async () => {
    mockGetOverdueItems.mockResolvedValue([]);
    await registerDashboard(mockApp as any);
    await capturedHandler({ ack: mockAck, body: mockBody, client: mockClient });
    expect(mockAck).toHaveBeenCalled();
    expect(mockViewsOpen).toHaveBeenCalled();
    const blocks = mockViewsOpen.mock.calls[0][0].view.blocks;
    expect(JSON.stringify(blocks)).toContain('期限超過タスクはありません');
  });

  it('期限超過タスクありで成功する', async () => {
    mockGetOverdueItems.mockResolvedValue([
      { task_name: '未提出の報告書', assigned_to: 'user2', deadline: new Date('2026-05-01') },
      { task_name: '遅延タスク', assigned_to: 'user3', deadline: new Date('2026-04-01') },
    ]);
    await registerDashboard(mockApp as any);
    await capturedHandler({ ack: mockAck, body: mockBody, client: mockClient });
    expect(mockViewsOpen).toHaveBeenCalled();
    const blocks = mockViewsOpen.mock.calls[0][0].view.blocks;
    expect(JSON.stringify(blocks)).toContain('未提出の報告書');
  });

  it('エラー時に postEphemeral を呼ぶ', async () => {
    mockGetCompletionMetrics.mockRejectedValue(new Error('DB error'));
    await registerDashboard(mockApp as any);
    await capturedHandler({ ack: mockAck, body: mockBody, client: mockClient });
    expect(mockAck).toHaveBeenCalled();
    expect(mockPostEphemeral).toHaveBeenCalledWith(
      expect.objectContaining({ channel: mockBody.channel_id, user: mockBody.user_id })
    );
  });
});
