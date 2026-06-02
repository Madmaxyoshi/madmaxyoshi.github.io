export {};

const mockListen = jest.fn((port: any, cb: any) => { if (cb) cb(); return {} as any; });
const mockUse = jest.fn();
const mockGet = jest.fn();

jest.mock('express', () => {
  const app = {
    use: mockUse,
    get: mockGet,
    listen: mockListen,
  };
  const express = () => app;
  (express as any).json = jest.fn(() => 'json-middleware');
  return express;
});

jest.mock('cors', () => () => 'cors-middleware');
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../api', () => 'api-router');

describe('index.ts', () => {
  beforeAll(() => {
    require('../index');
  });

  test('cors ミドルウェアを使用する', () => {
    expect(mockUse).toHaveBeenCalledWith('cors-middleware');
  });

  test('json ミドルウェアを使用する', () => {
    expect(mockUse).toHaveBeenCalledWith('json-middleware');
  });

  test('api ルーターを使用する', () => {
    expect(mockUse).toHaveBeenCalledWith('api-router');
  });

  test('ポート4000でサーバーを起動する', () => {
    expect(mockListen).toHaveBeenCalledWith(
      process.env.PORT || 4000,
      expect.any(Function),
    );
  });
});
