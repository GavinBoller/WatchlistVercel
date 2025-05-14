import { Request, Response } from 'express';
import { db } from './db';
import { watchlistEntries, WatchlistEntryWithMovie } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function getEmergencyWatchlist(req: Request, res: Response) {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const entries = await db
      .select({
        id: watchlistEntries.id,
        userId: watchlistEntries.userId,
        movieId: watchlistEntries.movieId,
        title: watchlistEntries.title,
        posterPath: watchlistEntries.posterPath,
        status: watchlistEntries.status,
        rating: watchlistEntries.rating,
        notes: watchlistEntries.notes,
        createdAt: watchlistEntries.createdAt,
        updatedAt: watchlistEntries.updatedAt,
        movieTitle: watchlistEntries.title,
        moviePosterPath: watchlistEntries.posterPath,
      })
      .from(watchlistEntries)
      .where(eq(watchlistEntries.userId, userId));
    const watchlist: WatchlistEntryWithMovie[] = entries;
    res.status(200).json(watchlist);
  } catch (error) {
    console.error('[EmergencyWatchlist] Error fetching watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}