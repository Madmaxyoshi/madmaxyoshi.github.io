const mockInitDatabase = jest.fn().mockResolvedValue(undefined);
const mockRegisterCommands = jest.fn();
const mockRegisterListeners = jest.fn();
const mockRegisterDashboard = jest.fn().mockResolvedValue(undefined);
const mockCheckAndExecuteEscalations = jest.fn().mockResolvedValue(undefined);
const mockSlackStart = jest.fn().mockResolvedValue(undefined);
const mockListenFn = jest.fn().mockImplementation((_p: any, cb: any) => { if (cb) cb(); });
const mockUseFn = jest.fn();
const mockGetFn = jest.fn();
const mockSlackApp = { start: mockSlackStart };
const mockExpressApp = { use: mockUseFn, get: mockGetFn, listen: mockListenFn };

jest.mock('../database.mock', () => ({ initDatabase: mockInitDatabase }));
jest.mock('../commands', () => ({ registerCommands: mockRegisterCommands }));
jest.mock('../listeners', () => ({ registerListeners: mockRegisterListeners }));
jest.mock('../dashboard', () => ({ registerDashboard: mockRegisterDashboard }));
jest.mock('../escalation', () => ({ checkAndExecuteEscalations: mockCheckAndExecuteEscalations }));
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

let capturedIntervalFn: Function | undefined;
let capturedTimeoutFn: Function | undefined;

beforeAll(async () => {
  jest.spyOn(global, 'setInterval').mockImplementation((fn: any) => {
    capturedIntervalFn = fn;
    return 0 as any;
  });
  jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
    capturedTimeoutFn = fn;
    return 0 as any;
  });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  require('../index');
  await new Promise(r => process.nextTick(r));
  await new Promise(r => process.nextTick(r));
  await new Promise(r => process.nextTick(r));
});

afterAll(() => jest.restoreAllMocks());

describe('index', () => {
  it('initDatabase を呼ぶ', () => {
    expect(mockInitDatabase).toHaveBeenCalled();
  });

  it('registerCommands を呼ぶ', () => {
    expect(mockRegisterCommands).toHaveBeenCalled();
  });

  it('registerListeners を呼ぶ', () => {
    expect(mockRegisterListeners).toHaveBeenCalled();
  });

  it('registerDashboard を呼ぶ', () => {
    expect(mockRegisterDashboard).toHaveBeenCalled();
  });

  it('express.listen を呼ぶ', () => {
    expect(mockListenFn).toHaveBeenCalled();
  });

  it('GET / ルートのハンドラを実行する', () => {
    const getCall = mockGetFn.mock.calls.find((c: any[]) => c[0] === '/');
    expect(getCall).toBeDefined();
    const handler = getCall![1];
    const mockRes = { sendFile: jest.fn() };
    handler({}, mockRes);
    expect(mockRes.sendFile).toHaveBeenCalled();
  });

  it('setInterval コールバックを実行する', async () => {
    expect(capturedIntervalFn).toBeDefined();
    await capturedIntervalFn!();
    expect(mockCheckAndExecuteEscalations).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Escalation check completed'));
  });

  it('setTimeout コールバックを実行する', async () => {
    expect(capturedTimeoutFn).toBeDefined();
    capturedTimeoutFn!();
    await new Promise(r => process.nextTick(r));
    expect(mockCheckAndExecuteEscalations).toHaveBeenCalled();
  });

  it('setTimeout でエスカレーションエラー発生時もエラーをログする', async () => {
    mockCheckAndExecuteEscalations.mockRejectedValueOnce(new Error('Initial error'));
    capturedTimeoutFn!();
    await new Promise(r => process.nextTick(r));
    await new Promise(r => process.nextTick(r));
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Initial escalation check error'),
      expect.any(Error)
    );
  });

  it('setInterval でエスカレーションエラー発生時もログする', async () => {
    mockCheckAndExecuteEscalations.mockRejectedValueOnce(new Error('Escalation error'));
    await capturedIntervalFn!();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Escalation check error'),
      expect.any(Error)
    );
  });
});
