export {};
const mockInitDatabaseError = jest.fn().mockRejectedValue(new Error('DB connection failed'));
const mockListenFn = jest.fn();
const mockUseFn = jest.fn();
const mockGetFn = jest.fn();
const mockSlackApp = { start: jest.fn() };
const mockExpressApp = { use: mockUseFn, get: mockGetFn, listen: mockListenFn };

jest.mock('../database.mock', () => ({ initDatabase: mockInitDatabaseError }));
jest.mock('../commands', () => ({ registerCommands: jest.fn() }));
jest.mock('../listeners', () => ({ registerListeners: jest.fn() }));
jest.mock('../dashboard', () => ({ registerDashboard: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../escalation', () => ({ checkAndExecuteEscalations: jest.fn() }));
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('cors', () => jest.fn().mockReturnValue('cors-middleware'));
jest.mock('../api', () => ({ __esModule: true, default: 'api-router' }));
jest.mock('@slack/bolt', () => ({
  App: jest.fn().mockImplementation(() => mockSlackApp),
}));
jest.mock('express', () => {
  const e: any = jest.fn().mockReturnValue(mockExpressApp);
  e.json = jest.fn().mockReturnValue('json-middleware');
  e.static = jest.fn().mockReturnValue('static-middleware');
  return e;
});

describe('index - エラーパス', () => {
  it('initDatabase 失敗時は process.exit(1) を呼ぶ', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(global, 'setInterval').mockImplementation((() => {}) as any);
    jest.spyOn(global, 'setTimeout').mockImplementation((() => {}) as any);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    require('../index');
    await new Promise(r => process.nextTick(r));
    await new Promise(r => process.nextTick(r));
    await new Promise(r => process.nextTick(r));

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error starting app'),
      expect.any(Error)
    );

    jest.restoreAllMocks();
  });
});
