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
  if (!status || !['to-watch', 'watching', 'watched'].includes(status)) {
    return res.status(400).json({ error: 'Status must be one of: to-watch, watching, watched' });
  }

  try {
    const entry: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: currentUser.id,
      movieId,
      title,
      status,
    };
    const newEntry = await storage.addToWatchlist(entry);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('[ROUTES] Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

export default router;
