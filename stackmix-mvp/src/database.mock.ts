import { Project, Track, Comment, ReviewRequest } from './types';
import { v4 as uuidv4 } from 'uuid';

const db: {
  projects: Project[];
  tracks: Track[];
  comments: Comment[];
  reviews: ReviewRequest[];
} = {
  projects: [
    {
      id: 'proj-001',
      title: 'Summer Vibes EP',
      owner_id: 'user-producer-1',
      collaborators: ['user-artist-1', 'user-engineer-1'],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(),
    },
    {
      id: 'proj-002',
      title: 'Game OST - Chapter 1',
      owner_id: 'user-composer-1',
      collaborators: ['user-director-1'],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(),
    },
  ],
  tracks: [
    {
      id: 'track-001',
      project_id: 'proj-001',
      title: 'Main Theme v3',
      file_url: 'https://storage.stackmix.io/track-001-v3.wav',
      duration_seconds: 214,
      version: 3,
      stem_type: 'full',
      uploaded_by: 'user-producer-1',
      created_at: new Date(),
    },
    {
      id: 'track-002',
      project_id: 'proj-001',
      title: 'Main Theme v3 (Drums)',
      file_url: 'https://storage.stackmix.io/track-001-v3-drums.wav',
      duration_seconds: 214,
      version: 3,
      stem_type: 'drums',
      uploaded_by: 'user-producer-1',
      created_at: new Date(),
    },
  ],
  comments: [
    {
      id: 'comment-001',
      track_id: 'track-001',
      author_id: 'user-artist-1',
      timestamp_seconds: 32.5,
      text: 'このサビ、もう少しドラムを前に出せますか？',
      resolved: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'comment-002',
      track_id: 'track-001',
      author_id: 'user-engineer-1',
      timestamp_seconds: 67.0,
      text: 'ここのトランジション、完璧です！',
      resolved: true,
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  ],
  reviews: [
    {
      id: 'review-001',
      project_id: 'proj-001',
      track_id: 'track-001',
      requester_id: 'user-producer-1',
      reviewer_id: 'user-artist-1',
      status: 'pending',
      created_at: new Date(),
    },
  ],
};

export const mockDb = {
  projects: {
    findAll: () => [...db.projects],
    findById: (id: string) => db.projects.find(p => p.id === id) || null,
    create: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project => {
      const project: Project = { ...data, id: uuidv4(), created_at: new Date(), updated_at: new Date() };
      db.projects.push(project);
      return project;
    },
  },
  tracks: {
    findByProject: (project_id: string) => db.tracks.filter(t => t.project_id === project_id),
    findById: (id: string) => db.tracks.find(t => t.id === id) || null,
    create: (data: Omit<Track, 'id' | 'created_at'>): Track => {
      const track: Track = { ...data, id: uuidv4(), created_at: new Date() };
      db.tracks.push(track);
      return track;
    },
  },
  comments: {
    findByTrack: (track_id: string) => db.comments.filter(c => c.track_id === track_id).sort((a, b) => a.timestamp_seconds - b.timestamp_seconds),
    create: (data: Omit<Comment, 'id' | 'created_at' | 'resolved'>): Comment => {
      const comment: Comment = { ...data, id: uuidv4(), resolved: false, created_at: new Date() };
      db.comments.push(comment);
      return comment;
    },
    resolve: (id: string): boolean => {
      const c = db.comments.find(c => c.id === id);
      if (!c) return false;
      c.resolved = true;
      return true;
    },
  },
  reviews: {
    findByProject: (project_id: string) => db.reviews.filter(r => r.project_id === project_id),
    create: (data: Omit<ReviewRequest, 'id' | 'created_at'>): ReviewRequest => {
      const review: ReviewRequest = { ...data, id: uuidv4(), created_at: new Date() };
      db.reviews.push(review);
      return review;
    },
    respond: (id: string, status: 'approved' | 'revision_requested', note?: string): ReviewRequest | null => {
      const r = db.reviews.find(r => r.id === id);
      if (!r) return null;
      r.status = status;
      r.note = note;
      r.responded_at = new Date();
      return r;
    },
  },
};
