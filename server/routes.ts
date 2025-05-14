import { Router } from 'express';
import { storage } from './types/storage';

const router = Router();

router.get('/status/ping', (req, res) => {
  res.json({ message: 'pong', time: new Date().toISOString() });
});

router.get('/watchlist', async (req, res) => {
  const user = req.user as { id: number };
  const watchlist = await storage.getWatchlist(user.id);
  res.json(watchlist);
});

export default router;
