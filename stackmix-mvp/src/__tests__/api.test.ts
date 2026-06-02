import request from 'supertest';
import express from 'express';
import apiRouter from '../api';

const app = express();
app.use(express.json());
app.use(apiRouter);

describe('GET /api/projects', () => {
  test('プロジェクト一覧を返す', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('GET /api/projects/:id', () => {
  test('存在するIDでプロジェクトを返す', async () => {
    const res = await request(app).get('/api/projects/proj-001');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Summer Vibes EP');
  });

  test('存在しないIDで404を返す', async () => {
    const res = await request(app).get('/api/projects/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Project not found');
  });
});

describe('POST /api/projects', () => {
  test('新しいプロジェクトを作成する', async () => {
    const res = await request(app).post('/api/projects').send({
      title: 'New Album',
      owner_id: 'user-test',
      collaborators: ['user-a', 'user-b'],
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Album');
    expect(res.body.id).toBeDefined();
  });

  test('title欠如で400を返す', async () => {
    const res = await request(app).post('/api/projects').send({ owner_id: 'user-1' });
    expect(res.status).toBe(400);
  });

  test('owner_id欠如で400を返す', async () => {
    const res = await request(app).post('/api/projects').send({ title: 'Test' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/projects/:projectId/tracks', () => {
  test('プロジェクトのトラック一覧を返す', async () => {
    const res = await request(app).get('/api/projects/proj-001/tracks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('存在しないプロジェクトで空配列を返す', async () => {
    const res = await request(app).get('/api/projects/nonexistent/tracks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/projects/:projectId/tracks', () => {
  test('新しいトラックを作成する', async () => {
    const res = await request(app).post('/api/projects/proj-001/tracks').send({
      title: 'New Track',
      file_url: 'https://storage.stackmix.io/new.wav',
      duration_seconds: 120,
      uploaded_by: 'user-producer-1',
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Track');
    expect(res.body.stem_type).toBe('full');
    expect(res.body.version).toBe(1);
  });

  test('title欠如で400を返す', async () => {
    const res = await request(app).post('/api/projects/proj-001/tracks').send({
      file_url: 'https://example.com/track.wav',
      uploaded_by: 'user-1',
    });
    expect(res.status).toBe(400);
  });

  test('file_url欠如で400を返す', async () => {
    const res = await request(app).post('/api/projects/proj-001/tracks').send({
      title: 'Test',
      uploaded_by: 'user-1',
    });
    expect(res.status).toBe(400);
  });

  test('uploaded_by欠如で400を返す', async () => {
    const res = await request(app).post('/api/projects/proj-001/tracks').send({
      title: 'Test',
      file_url: 'https://example.com/track.wav',
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tracks/:trackId/comments', () => {
  test('トラックのコメント一覧を返す', async () => {
    const res = await request(app).get('/api/tracks/track-001/comments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('コメントはtimestamp順に並ぶ', async () => {
    const res = await request(app).get('/api/tracks/track-001/comments');
    for (let i = 1; i < res.body.length; i++) {
      expect(res.body[i].timestamp_seconds).toBeGreaterThanOrEqual(res.body[i - 1].timestamp_seconds);
    }
  });
});

describe('POST /api/tracks/:trackId/comments', () => {
  test('新しいコメントを作成する', async () => {
    const res = await request(app).post('/api/tracks/track-001/comments').send({
      author_id: 'user-artist-1',
      timestamp_seconds: 45.0,
      text: 'ここいい感じ！',
    });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('ここいい感じ！');
    expect(res.body.resolved).toBe(false);
  });

  test('timestamp_seconds=0 は有効', async () => {
    const res = await request(app).post('/api/tracks/track-001/comments').send({
      author_id: 'user-1',
      timestamp_seconds: 0,
      text: '冒頭から！',
    });
    expect(res.status).toBe(201);
  });

  test('author_id欠如で400を返す', async () => {
    const res = await request(app).post('/api/tracks/track-001/comments').send({
      timestamp_seconds: 10,
      text: 'テスト',
    });
    expect(res.status).toBe(400);
  });

  test('text欠如で400を返す', async () => {
    const res = await request(app).post('/api/tracks/track-001/comments').send({
      author_id: 'user-1',
      timestamp_seconds: 10,
    });
    expect(res.status).toBe(400);
  });

  test('timestamp_seconds欠如で400を返す', async () => {
    const res = await request(app).post('/api/tracks/track-001/comments').send({
      author_id: 'user-1',
      text: 'テスト',
    });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/comments/:id/resolve', () => {
  test('コメントを解決済みにする', async () => {
    const createRes = await request(app).post('/api/tracks/track-001/comments').send({
      author_id: 'user-1',
      timestamp_seconds: 5.0,
      text: '解決テスト',
    });
    const commentId = createRes.body.id;
    const res = await request(app).patch(`/api/comments/${commentId}/resolve`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comment resolved');
  });

  test('存在しないIDで404を返す', async () => {
    const res = await request(app).patch('/api/comments/nonexistent/resolve');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/projects/:projectId/reviews', () => {
  test('レビューリクエストを作成する', async () => {
    const res = await request(app).post('/api/projects/proj-001/reviews').send({
      track_id: 'track-001',
      requester_id: 'user-producer-1',
      reviewer_id: 'user-artist-1',
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  test('track_id欠如で400を返す', async () => {
    const res = await request(app).post('/api/projects/proj-001/reviews').send({
      requester_id: 'user-1',
      reviewer_id: 'user-2',
    });
    expect(res.status).toBe(400);
  });

  test('requester_id欠如で400を返す', async () => {
    const res = await request(app).post('/api/projects/proj-001/reviews').send({
      track_id: 'track-001',
      reviewer_id: 'user-2',
    });
    expect(res.status).toBe(400);
  });

  test('reviewer_id欠如で400を返す', async () => {
    const res = await request(app).post('/api/projects/proj-001/reviews').send({
      track_id: 'track-001',
      requester_id: 'user-1',
    });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/reviews/:id', () => {
  let reviewId: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/projects/proj-001/reviews').send({
      track_id: 'track-001',
      requester_id: 'user-producer-1',
      reviewer_id: 'user-artist-1',
    });
    reviewId = res.body.id;
  });

  test('approved に更新する', async () => {
    const res = await request(app).patch(`/api/reviews/${reviewId}`).send({
      status: 'approved',
      note: 'LGTM！',
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.note).toBe('LGTM！');
  });

  test('revision_requested に更新する', async () => {
    const res = await request(app).patch(`/api/reviews/${reviewId}`).send({
      status: 'revision_requested',
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('revision_requested');
  });

  test('無効なstatusで400を返す', async () => {
    const res = await request(app).patch(`/api/reviews/${reviewId}`).send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });

  test('status欠如で400を返す', async () => {
    const res = await request(app).patch(`/api/reviews/${reviewId}`).send({});
    expect(res.status).toBe(400);
  });

  test('存在しないIDで404を返す', async () => {
    const res = await request(app).patch('/api/reviews/nonexistent').send({ status: 'approved' });
    expect(res.status).toBe(404);
  });
});
