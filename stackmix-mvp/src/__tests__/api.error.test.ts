export {};

import request from 'supertest';
import express from 'express';

const mockFindAll = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockFindByProject = jest.fn();
const mockFindByTrack = jest.fn();
const mockResolve = jest.fn();
const mockFindByProjectReviews = jest.fn();
const mockCreateReview = jest.fn();
const mockRespond = jest.fn();
const mockTracksCreate = jest.fn();
const mockCommentsCreate = jest.fn();

jest.mock('../database.mock', () => ({
  mockDb: {
    projects: {
      findAll: mockFindAll,
      findById: mockFindById,
      create: mockCreate,
    },
    tracks: {
      findByProject: mockFindByProject,
      findById: jest.fn(),
      create: mockTracksCreate,
    },
    comments: {
      findByTrack: mockFindByTrack,
      create: mockCommentsCreate,
      resolve: mockResolve,
    },
    reviews: {
      findByProject: mockFindByProjectReviews,
      create: mockCreateReview,
      respond: mockRespond,
    },
  },
}));

import apiRouter from '../api';

const app = express();
app.use(express.json());
app.use(apiRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('エラーハンドリング - GET /api/projects', () => {
  test('findAll が例外を投げると500を返す', async () => {
    mockFindAll.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch projects');
  });
});

describe('エラーハンドリング - GET /api/projects/:id', () => {
  test('findById が例外を投げると500を返す', async () => {
    mockFindById.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/projects/proj-001');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch project');
  });
});

describe('エラーハンドリング - POST /api/projects', () => {
  test('create が例外を投げると500を返す', async () => {
    mockCreate.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).post('/api/projects').send({ title: 'Test', owner_id: 'u1' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create project');
  });
});

describe('エラーハンドリング - GET /api/projects/:id/tracks', () => {
  test('findByProject が例外を投げると500を返す', async () => {
    mockFindByProject.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/projects/proj-001/tracks');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch tracks');
  });
});

describe('エラーハンドリング - POST /api/projects/:id/tracks', () => {
  test('create が例外を投げると500を返す', async () => {
    mockTracksCreate.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).post('/api/projects/proj-001/tracks').send({
      title: 'T', file_url: 'https://x.com/t.wav', uploaded_by: 'u1',
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create track');
  });
});

describe('エラーハンドリング - GET /api/tracks/:id/comments', () => {
  test('findByTrack が例外を投げると500を返す', async () => {
    mockFindByTrack.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/tracks/track-001/comments');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch comments');
  });
});

describe('エラーハンドリング - POST /api/tracks/:id/comments', () => {
  test('create が例外を投げると500を返す', async () => {
    mockCommentsCreate.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).post('/api/tracks/track-001/comments').send({
      author_id: 'u1', timestamp_seconds: 10, text: 'test',
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create comment');
  });
});

describe('エラーハンドリング - PATCH /api/comments/:id/resolve', () => {
  test('resolve が例外を投げると500を返す', async () => {
    mockResolve.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).patch('/api/comments/c1/resolve');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to resolve comment');
  });
});

describe('エラーハンドリング - POST /api/projects/:id/reviews', () => {
  test('create が例外を投げると500を返す', async () => {
    mockCreateReview.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).post('/api/projects/proj-001/reviews').send({
      track_id: 't1', requester_id: 'u1', reviewer_id: 'u2',
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create review');
  });
});

describe('エラーハンドリング - PATCH /api/reviews/:id', () => {
  test('respond が例外を投げると500を返す', async () => {
    mockRespond.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).patch('/api/reviews/r1').send({ status: 'approved' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to update review');
  });
});
