const mockPoolQuery = jest.fn();
const mockPoolConnect = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockPoolQuery,
    connect: mockPoolConnect,
  })),
}));

const mockReadFileSync = jest.fn();
jest.mock('fs', () => ({ readFileSync: mockReadFileSync }));

beforeEach(() => {
  mockPoolQuery.mockReset();
  mockPoolConnect.mockReset();
  mockReadFileSync.mockReset();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('database', () => {
  it('query が pool.query に委譲する', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [{ id: 1 }] });
    const { query } = require('../database');
    const result = await query('SELECT 1', []);
    expect(mockPoolQuery).toHaveBeenCalledWith('SELECT 1', []);
    expect(result.rows[0].id).toBe(1);
  });

  it('getClient が pool.connect に委譲する', async () => {
    const mockClient = { query: jest.fn(), release: jest.fn() };
    mockPoolConnect.mockResolvedValue(mockClient);
    const { getClient } = require('../database');
    const client = await getClient();
    expect(mockPoolConnect).toHaveBeenCalled();
    expect(client).toBe(mockClient);
  });

  it('initDatabase がスキーマを読み込んでDBに実行する', async () => {
    mockReadFileSync.mockReturnValue('CREATE TABLE test (id INT);');
    mockPoolQuery.mockResolvedValue({ rows: [] });
    const { initDatabase } = require('../database');
    await initDatabase();
    expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('schema.sql'), 'utf-8');
    expect(mockPoolQuery).toHaveBeenCalledWith('CREATE TABLE test (id INT);');
    expect(console.log).toHaveBeenCalledWith('Database schema initialized');
  });

  it('initDatabase がエラー時に例外をスローする', async () => {
    mockReadFileSync.mockImplementation(() => { throw new Error('File not found'); });
    const { initDatabase } = require('../database');
    await expect(initDatabase()).rejects.toThrow('File not found');
    expect(console.error).toHaveBeenCalled();
  });
});
