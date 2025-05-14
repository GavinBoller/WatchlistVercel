import { Request, Response } from 'express';
import { storage } from './types/storage';
import { WatchlistEntryWithMovie } from '@shared/schema';

export async function getEmergencyWatchlist(req: Request, res: Response) {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const entries = await storage.getWatchlist(userId);
    const watchlist: WatchlistEntryWithMovie[] = entries.map(entry => ({
      ...entry,
      movie: { id: entry.movieId } as any, // Simplified for emergency use
    }));
    res.status(200).json(watchlist);
  } catch (error) {
    console.error('[EmergencyWatchlist] Error fetching watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}