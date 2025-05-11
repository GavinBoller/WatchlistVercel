import { Router } from 'express';
import { storage } from './storage';
import { WatchlistEntryWithMovie } from '@shared/schema';
import { executeDirectSql } from './db';

const router = Router();

router.get('/emergency/watchlist/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const entries = await storage.getWatchlistEntries(userId);
    return res.json(entries);
  } catch (error) {
    console.error('[EMERGENCY WATCHLIST] Error:', error);
    try {
      const entryResults = await executeDirectSql(
        `SELECT we.*, m.*, p.id as platform_id, p.name as platform_name, p.is_default as platform_is_default
         FROM watchlist_entries we
         JOIN movies m ON we.movie_id = m.id
         LEFT JOIN platforms p ON we.platform_id = p.id
         WHERE we.user_id = $1
         ORDER BY we.created_at DESC`,
        [userId]
      );

      const watchlistData: WatchlistEntryWithMovie[] = entryResults.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        movieId: row.movie_id,
        platformId: row.platform_id || null,
        status: row.status || 'to_watch',
        watchedDate: row.watched_date || null,
        notes: row.notes || '',
        createdAt: new Date(row.created_at),
        movie: {
          id: row.movie_id,
          tmdbId: row.tmdb_id,
          title: row.title || '[Unknown]',
          overview: row.overview || '',
          posterPath: row.poster_path || '',
          backdropPath: row.backdrop_path || '',
          releaseDate: row.release_date || null,
          voteAverage: row.vote_average || 0,
          runtime: row.runtime || null,
          numberOfSeasons: row.number_of_seasons || null,
          numberOfEpisodes: row.number_of_episodes || null,
          mediaType: row.media_type || 'movie',
          createdAt: new Date(row.created_at),
        },
        platform: row.platform_id
          ? {
              id: row.platform_id,
              userId: row.user_id,
              name: row.platform_name || 'Unknown Platform',
              logoUrl: row.logo_url || null,
              isDefault: row.platform_is_default || false,
            }
          : null,
      }));

      return res.json(watchlistData);
    } catch (sqlError) {
      console.error('[EMERGENCY WATCHLIST] SQL Error:', sqlError);
      return res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  }
});

export default router;