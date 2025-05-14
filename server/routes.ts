import { Router, Request, Response } from 'express';
import { db } from './db';
import { watchlistEntries, WatchlistEntry } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated } from './auth';

const router = Router();

// Valid statuses for watchlist entries
const validStatuses = ['to-watch', 'watching', 'watched'];

// Get user's watchlist (session-authenticated)
router.get('/watchlist/:userId', isAuthenticated, async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  const currentUser = req.user as { id: number; username: string };

  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (userId !== currentUser.id) {
    console.log(`[ROUTES] Access DENIED: User ${currentUser.id} tried to access watchlist of user ${userId}`);
    return res.status(403).json({ error: 'Access denied: You can only view your own watchlist' });
  }

  try {
    const watchlistItems = await db
      .select()
      .from(watchlistEntries)
      .where(eq(watchlistEntries.userId, userId));
    res.json(watchlistItems);
  } catch (error) {
    console.error('[ROUTES] Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// Add to watchlist (session-authenticated)
router.post('/watchlist', isAuthenticated, async (req: Request, res: Response) => {
  const { movieId, title, posterPath, status, rating, notes } = req.body;
  const currentUser = req.user as { id: number; username: string };

  if (!movieId || !Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Valid movieId is required' });
  }
  if (!title || typeof title !== 'string' || title.length > 255) {
    return res.status(400).json({ error: 'Valid title (max 255 characters) is required' });
  }
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 10' });
  }

  try {
    // Check for duplicate movieId
    const [existingEntry] = await db
      .select({ id: watchlistEntries.id })
      .from(watchlistEntries)
      .where(and(eq(watchlistEntries.userId, currentUser.id), eq(watchlistEntries.movieId, movieId)))
      .limit(1);
    if (existingEntry) {
      return res.status(409).json({ error: 'Movie already in watchlist' });
    }

    const entry: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: currentUser.id,
      movieId,
      title,
      posterPath: posterPath && typeof posterPath === 'string' ? posterPath : undefined,
      status,
      rating,
      notes: notes && typeof notes === 'string' ? notes : undefined,
    };
    const [newItem] = await db
      .insert(watchlistEntries)
      .values({
        ...entry,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('[ROUTES] Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// Update watchlist entry (session-authenticated)
router.put('/watchlist/:id', isAuthenticated, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { status, rating, notes, title, posterPath } = req.body;
  const currentUser = req.user as { id: number; username: string };

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid watchlist entry ID' });
  }
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 10' });
  }
  if (title && (typeof title !== 'string' || title.length > 255)) {
    return res.status(400).json({ error: 'Title must be a string (max 255 characters)' });
  }

  try {
    const [existingEntry] = await db
      .select({ userId: watchlistEntries.userId })
      .from(watchlistEntries)
      .where(eq(watchlistEntries.id, id))
      .limit(1);

    if (!existingEntry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }

    if (existingEntry.userId !== currentUser.id) {
      console.log(`[ROUTES] Access DENIED: User ${currentUser.id} tried to update entry ${id} of user ${existingEntry.userId}`);
      return res.status(403).json({ error: 'Access denied: You can only update your own watchlist entries' });
    }

    const updates: Partial<Omit<WatchlistEntry, 'id' | 'userId' | 'movieId' | 'createdAt'>> = {};
    if (status) updates.status = status;
    if (rating !== undefined) updates.rating = rating;
    if (notes !== undefined) updates.notes = notes;
    if (title) updates.title = title;
    if (posterPath !== undefined) updates.posterPath = posterPath;
    updates.updatedAt = new Date();

    if (Object.keys(updates).length === 1) { // Only updatedAt
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const [updatedEntry] = await db
      .update(watchlistEntries)
      .set(updates)
      .where(eq(watchlistEntries.id, id))
      .returning();

    if (!updatedEntry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }

    res.json(updatedEntry);
  } catch (error) {
    console.error('[ROUTES] Error updating watchlist entry:', error);
    res.status(500).json({ error: 'Failed to update watchlist entry' });
  }
});

// Remove from watchlist (session-authenticated)
router.delete('/watchlist/:id', isAuthenticated, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const currentUser = req.user as { id: number; username: string };

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid watchlist entry ID' });
  }

  try {
    const [existingEntry] = await db
      .select({ userId: watchlistEntries.userId })
      .from(watchlistEntries)
      .where(eq(watchlistEntries.id, id))
      .limit(1);

    if (!existingEntry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }

    if (existingEntry.userId !== currentUser.id) {
      console.log(`[ROUTES] Access DENIED: User ${currentUser.id} tried to delete entry ${id} of user ${existingEntry.userId}`);
      return res.status(403).json({ error: 'Access denied: You can only delete your own watchlist entries' });
    }

    await db.delete(watchlistEntries).where(eq(watchlistEntries.id, id));
    res.status(204).send();
  } catch (error) {
    console.error('[ROUTES] Error removing from watchlist:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

export default router;