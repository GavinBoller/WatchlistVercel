import { Router, Request, Response } from 'express';
import { storage } from './types/storage';
import { isAuthenticated } from './auth';
import { WatchlistEntry } from '@shared/schema';

const router = Router();

router.get('/status/ping', (req, res) => {
  res.json({ message: 'pong', time: new Date().toISOString() });
});

router.get('/watchlist', isAuthenticated, async (req, res) => {
  const user = req.user as { id: number };
  const watchlist = await storage.getWatchlist(user.id);
  res.json(watchlist);
});

router.post('/watchlist', isAuthenticated, async (req: Request, res: Response) => {
  const { movieId, title, status } = req.body;
  const currentUser = req.user as { id: number };

  if (!movieId || !Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Valid movieId is required' });
  }
  if (!title || typeof title !== 'string' || title.length > 255) {
    return res.status(400).json({ error: 'Valid title (max 255 characters) is required' });
  }
  const validStatuses = ['to-watch', 'watching', 'watched'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status must be one of: to-watch, watching, watched' });
  }

  // Map status to database enum
  const dbStatus = status === 'to-watch' ? 'to_watch' : status;

  try {
    const entry: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: currentUser.id,
      movieId,
      title,
      status: dbStatus,
    };
    const newEntry = await storage.addToWatchlist(entry);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('[ROUTES] Detailed error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add to watchlist', details: error.message });
  }
});

export default router;
