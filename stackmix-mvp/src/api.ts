import express, { Request, Response } from 'express';
import { mockDb } from './database.mock';

const router = express.Router();

// GET /api/projects
router.get('/api/projects', (_req: Request, res: Response) => {
  try {
    res.json(mockDb.projects.findAll());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id
router.get('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const project = mockDb.projects.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects
router.post('/api/projects', (req: Request, res: Response) => {
  try {
    const { title, owner_id, collaborators = [] } = req.body;
    if (!title || !owner_id) return res.status(400).json({ error: 'title and owner_id are required' });
    const project = mockDb.projects.create({ title, owner_id, collaborators });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:projectId/tracks
router.get('/api/projects/:projectId/tracks', (req: Request, res: Response) => {
  try {
    const tracks = mockDb.tracks.findByProject(req.params.projectId);
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// POST /api/projects/:projectId/tracks
router.post('/api/projects/:projectId/tracks', (req: Request, res: Response) => {
  try {
    const { title, file_url, duration_seconds, stem_type = 'full', uploaded_by, version = 1 } = req.body;
    if (!title || !file_url || !uploaded_by) {
      return res.status(400).json({ error: 'title, file_url, uploaded_by are required' });
    }
    const track = mockDb.tracks.create({
      project_id: req.params.projectId,
      title, file_url, duration_seconds, stem_type, uploaded_by, version,
    });
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create track' });
  }
});

// GET /api/tracks/:trackId/comments
router.get('/api/tracks/:trackId/comments', (req: Request, res: Response) => {
  try {
    const comments = mockDb.comments.findByTrack(req.params.trackId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/tracks/:trackId/comments
router.post('/api/tracks/:trackId/comments', (req: Request, res: Response) => {
  try {
    const { author_id, timestamp_seconds, text } = req.body;
    if (!author_id || timestamp_seconds === undefined || !text) {
      return res.status(400).json({ error: 'author_id, timestamp_seconds, text are required' });
    }
    const comment = mockDb.comments.create({
      track_id: req.params.trackId,
      author_id, timestamp_seconds, text,
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// PATCH /api/comments/:id/resolve
router.patch('/api/comments/:id/resolve', (req: Request, res: Response) => {
  try {
    const resolved = mockDb.comments.resolve(req.params.id);
    if (!resolved) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Comment resolved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve comment' });
  }
});

// POST /api/projects/:projectId/reviews
router.post('/api/projects/:projectId/reviews', (req: Request, res: Response) => {
  try {
    const { track_id, requester_id, reviewer_id } = req.body;
    if (!track_id || !requester_id || !reviewer_id) {
      return res.status(400).json({ error: 'track_id, requester_id, reviewer_id are required' });
    }
    const review = mockDb.reviews.create({
      project_id: req.params.projectId,
      track_id, requester_id, reviewer_id, status: 'pending',
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// PATCH /api/reviews/:id
router.patch('/api/reviews/:id', (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    if (!status || !['approved', 'revision_requested'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or revision_requested' });
    }
    const review = mockDb.reviews.respond(req.params.id, status, note);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

export default router;
