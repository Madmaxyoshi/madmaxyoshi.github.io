const mockInitDatabase = jest.fn().mockResolvedValue(undefined);
const mockListenFn = jest.fn().mockImplementation((_p: any, cb: any) => { if (cb) cb(); });
const mockUseFn = jest.fn();
const mockGetFn = jest.fn();

const mockExpressApp = { use: mockUseFn, get: mockGetFn, listen: mockListenFn };

jest.mock('../database.mock', () => ({ initDatabase: mockInitDatabase }));
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('cors', () => jest.fn().mockReturnValue('cors-middleware'));
jest.mock('../api', () => ({ __esModule: true, default: 'api-router' }));
jest.mock('../metrics.mock', () => ({
  getCompletionMetrics: jest.fn(),
  getTeamMetrics: jest.fn(),
  getOverdueItems: jest.fn(),
}));
jest.mock('express', () => {
  const e: any = jest.fn().mockReturnValue(mockExpressApp);
  e.json = jest.fn().mockReturnValue('json-middleware');
  e.static = jest.fn().mockReturnValue('static-middleware');
  return e;
});

beforeAll(async () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  require('../index.dev');
  await new Promise(r => setTimeout(r, 50));
});

afterAll(() => jest.restoreAllMocks());

describe('index.dev', () => {
  it('initDatabase を呼ぶ', () => {
    expect(mockInitDatabase).toHaveBeenCalled();
  });

  it('express.listen を呼ぶ', () => {
    expect(mockListenFn).toHaveBeenCalled();
  });

  it('正常起動のログを出力する', () => {
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Mock Database initialized'));
  });

  it('GET / ルートのハンドラを実行する', () => {
    const getCall = mockGetFn.mock.calls.find((c: any[]) => c[0] === '/');
    expect(getCall).toBeDefined();
    const handler = getCall![1];
    const mockRes = { sendFile: jest.fn() };
    handler({}, mockRes);
    expect(mockRes.sendFile).toHaveBeenCalled();
  });
});
