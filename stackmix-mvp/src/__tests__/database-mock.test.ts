import { mockDb } from '../database.mock';

describe('mockDb.projects', () => {
  test('findAll は全プロジェクトを返す', () => {
    const all = mockDb.projects.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all[0]).toHaveProperty('id');
    expect(all[0]).toHaveProperty('title');
  });

  test('findById は存在するIDで返す', () => {
    const p = mockDb.projects.findById('proj-001');
    expect(p).not.toBeNull();
    expect(p!.title).toBe('Summer Vibes EP');
  });

  test('findById は存在しないIDでnullを返す', () => {
    const p = mockDb.projects.findById('nonexistent');
    expect(p).toBeNull();
  });

  test('create は新しいプロジェクトを追加する', () => {
    const before = mockDb.projects.findAll().length;
    const p = mockDb.projects.create({ title: 'Test Project', owner_id: 'user-1', collaborators: [] });
    expect(p.id).toBeDefined();
    expect(p.title).toBe('Test Project');
    expect(mockDb.projects.findAll().length).toBe(before + 1);
  });
});

describe('mockDb.tracks', () => {
  test('findByProject はプロジェクトのトラックを返す', () => {
    const tracks = mockDb.tracks.findByProject('proj-001');
    expect(tracks.length).toBeGreaterThanOrEqual(2);
    tracks.forEach(t => expect(t.project_id).toBe('proj-001'));
  });

  test('findByProject は存在しないプロジェクトで空配列を返す', () => {
    const tracks = mockDb.tracks.findByProject('nonexistent');
    expect(tracks).toEqual([]);
  });

  test('findById は存在するIDで返す', () => {
    const t = mockDb.tracks.findById('track-001');
    expect(t).not.toBeNull();
    expect(t!.title).toBe('Main Theme v3');
  });

  test('findById は存在しないIDでnullを返す', () => {
    const t = mockDb.tracks.findById('nonexistent');
    expect(t).toBeNull();
  });

  test('create は新しいトラックを追加する', () => {
    const before = mockDb.tracks.findByProject('proj-001').length;
    const t = mockDb.tracks.create({
      project_id: 'proj-001',
      title: 'Test Track',
      file_url: 'https://example.com/test.wav',
      duration_seconds: 180,
      stem_type: 'full',
      uploaded_by: 'user-1',
      version: 1,
    });
    expect(t.id).toBeDefined();
    expect(mockDb.tracks.findByProject('proj-001').length).toBe(before + 1);
  });
});

describe('mockDb.comments', () => {
  test('findByTrack はタイムスタンプ順でコメントを返す', () => {
    const comments = mockDb.comments.findByTrack('track-001');
    expect(comments.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < comments.length; i++) {
      expect(comments[i].timestamp_seconds).toBeGreaterThanOrEqual(comments[i - 1].timestamp_seconds);
    }
  });

  test('findByTrack は存在しないトラックで空配列を返す', () => {
    expect(mockDb.comments.findByTrack('nonexistent')).toEqual([]);
  });

  test('create は新しいコメントを追加する', () => {
    const c = mockDb.comments.create({
      track_id: 'track-001',
      author_id: 'user-1',
      timestamp_seconds: 10.0,
      text: 'テストコメント',
    });
    expect(c.id).toBeDefined();
    expect(c.resolved).toBe(false);
  });

  test('resolve は既存コメントをresolvedにする', () => {
    const c = mockDb.comments.create({
      track_id: 'track-001',
      author_id: 'user-1',
      timestamp_seconds: 20.0,
      text: '解決前',
    });
    const result = mockDb.comments.resolve(c.id);
    expect(result).toBe(true);
    const updated = mockDb.comments.findByTrack('track-001').find(x => x.id === c.id);
    expect(updated!.resolved).toBe(true);
  });

  test('resolve は存在しないIDでfalseを返す', () => {
    expect(mockDb.comments.resolve('nonexistent')).toBe(false);
  });
});

describe('mockDb.reviews', () => {
  test('findByProject はプロジェクトのレビューを返す', () => {
    const reviews = mockDb.reviews.findByProject('proj-001');
    expect(reviews.length).toBeGreaterThanOrEqual(1);
  });

  test('findByProject は存在しないプロジェクトで空配列を返す', () => {
    expect(mockDb.reviews.findByProject('nonexistent')).toEqual([]);
  });

  test('create は新しいレビューを追加する', () => {
    const r = mockDb.reviews.create({
      project_id: 'proj-001',
      track_id: 'track-001',
      requester_id: 'user-producer-1',
      reviewer_id: 'user-artist-1',
      status: 'pending',
    });
    expect(r.id).toBeDefined();
    expect(r.status).toBe('pending');
  });

  test('respond は approved に更新する', () => {
    const r = mockDb.reviews.create({
      project_id: 'proj-001',
      track_id: 'track-001',
      requester_id: 'user-a',
      reviewer_id: 'user-b',
      status: 'pending',
    });
    const updated = mockDb.reviews.respond(r.id, 'approved', 'LGTM');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('approved');
    expect(updated!.note).toBe('LGTM');
    expect(updated!.responded_at).toBeDefined();
  });

  test('respond は revision_requested に更新する', () => {
    const r = mockDb.reviews.create({
      project_id: 'proj-001',
      track_id: 'track-001',
      requester_id: 'user-a',
      reviewer_id: 'user-b',
      status: 'pending',
    });
    const updated = mockDb.reviews.respond(r.id, 'revision_requested');
    expect(updated!.status).toBe('revision_requested');
  });

  test('respond は存在しないIDでnullを返す', () => {
    expect(mockDb.reviews.respond('nonexistent', 'approved')).toBeNull();
  });
});
