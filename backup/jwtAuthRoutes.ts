import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { verifyToken } from './jwtAuth';
import { watchlistEntries } from '@shared/schema';
import fetch from 'node-fetch';

const router = Router();

router.get('/tmdb/search', verifyToken, async (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('TMDB search error:', error);
    res.status(500).json({ error: 'Failed to search TMDB' });
  }
});

router.get('/watchlist', verifyToken, async (req, res) => {
  try {
    const userId = req.user!.id; // Use req.user from jwtMiddleware
    const watchlistItems = await db
      .select()
      .from(watchlistEntries)
      .where(eq(watchlistEntries.userId, userId));
    res.json(watchlistItems);
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/watchlist', verifyToken, async (req, res) => {
  const { movieId, title, posterPath } = req.body;
  if (!movieId || !title) {
    return res.status(400).json({ error: 'movieId and title are required' });
  }

  try {
    const userId = req.user!.id; // Use req.user from jwtMiddleware
    const [newItem] = await db
      .insert(watchlistEntries)
      .values({
        userId,
        movieId,
        title,
        posterPath,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

router.delete('/watchlist/:movieId', verifyToken, async (req, res) => {
  const { movieId } = req.params;
  try {
    const userId = req.user!.id; // Use req.user from jwtMiddleware
    await db
      .delete(watchlistEntries)
      .where(eq(watchlistEntries.userId, userId) && eq(watchlistEntries.movieId, parseInt(movieId)));
    res.status(204).send();
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

export default router;