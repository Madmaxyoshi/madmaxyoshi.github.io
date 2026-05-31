export {};
const mockInitDatabaseError = jest.fn().mockRejectedValue(new Error('DB connection failed'));
const mockListenFn = jest.fn();
const mockUseFn = jest.fn();
const mockGetFn = jest.fn();
const mockExpressApp = { use: mockUseFn, get: mockGetFn, listen: mockListenFn };

jest.mock('../database.mock', () => ({ initDatabase: mockInitDatabaseError }));
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

describe('index.dev - エラーパス', () => {
  it('initDatabase 失敗時は process.exit(1) を呼ぶ', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    require('../index.dev');
    await new Promise(r => setTimeout(r, 50));

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error starting app'),
      expect.any(Error)
    );

    jest.restoreAllMocks();
  });
});
