import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import { insertMovieSchema, insertUserSchema, WatchlistEntryWithMovie } from '@shared/schema';
import { getEmergencyWatchlist } from './emergencyWatchlist';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const newUser = await storage.createUser({
      username: userData.username,
      password: userData.password,
      displayName: userData.displayName,
      role: userData.role || 'user',
      createdAt: new Date(),
    });
    res.status(201).json({ id: newUser.id, username: newUser.username });
  } catch (error) {
    console.error('[Register] Error:', error);
    res.status(400).json({ error: 'Invalid user data' });
  }
});

router.get('/watchlist/:userId', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const entries = await storage.getWatchlist(userId);
    const watchlist: WatchlistEntryWithMovie[] = entries.map(entry => ({
      ...entry,
      movie: { id: entry.movieId } as any,
    }));
    res.status(200).json(watchlist);
  } catch (error) {
    console.error('[Watchlist] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/movies', async (req: Request, res: Response) => {
  try {
    const movieData = insertMovieSchema.parse(req.body);
    const newMovie = await storage.addMovie({
      ...movieData,
      title: movieData.title || '',
      tmdbId: movieData.tmdbId || 0,
      createdAt: new Date(),
      genre: movieData.genre || [],
      platforms: movieData.platforms || [],
      cast: movieData.cast || [],
    });
    res.status(201).json(newMovie);
  } catch (error) {
    console.error('[Movies] Error:', error);
    res.status(400).json({ error: 'Invalid movie data' });
  }
});

router.get('/emergency-watchlist/:userId', getEmergencyWatchlist);

export const apiRouter = router;