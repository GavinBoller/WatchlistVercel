import { Request, Response } from 'express';
import { storage } from './storage';
import { executeDirectSql } from './db';
import bcrypt from 'bcrypt';
import { User, Movie, WatchlistEntry, WatchlistEntryWithMovie } from '@shared/schema';

export async function emergencyWatchlistFetch(userId: number): Promise<WatchlistEntryWithMovie[]> {
  try {
    const result = await executeDirectSql<WatchlistEntryWithMovie>(
      `SELECT we.*, m.*, p.id as platform_id, p.name as platform_name, p.is_default as platform_is_default
       FROM watchlist_entries we
       JOIN movies m ON we.movie_id = m.id
       LEFT JOIN platforms p ON we.platform_id = p.id
       WHERE we.user_id = $1
       ORDER BY we.created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      movieId: row.movieId,
      platformId: row.platformId || null,
      status: row.status || 'to_watch',
      watchedDate: row.watchedDate || null,
      notes: row.notes || '',
      createdAt: row.createdAt || new Date(),
      movie: {
        id: row.movieId,
        tmdbId: row.tmdbId,
        title: row.title || '[Unknown]',
        overview: row.overview || '',
        posterPath: row.posterPath || '',
        backdropPath: row.backdropPath || '',
        releaseDate: row.releaseDate || null,
        voteAverage: row.voteAverage || 0,
        mediaType: row.mediaType || 'movie',
        createdAt: row.createdAt || new Date(),
        runtime: row.runtime || null,
        numberOfSeasons: row.numberOfSeasons || null,
        numberOfEpisodes: row.numberOfEpisodes || null,
      },
      platform: row.platformId ? {
        id: row.platformId,
        name: row.platform_name || 'Unknown Platform',
        isDefault: row.platform_is_default || false,
        userId: row.userId,
        logoUrl: null,
      } : null,
    }));
  } catch (error) {
    console.error('[EMERGENCY WATCHLIST] Error fetching watchlist:', error);
    return [];
  }
}

export async function emergencyWatchlistAdd(
  req: Request,
  tmdbMovie: any
): Promise<WatchlistEntryWithMovie | null> {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return null;

  let movie: Movie | undefined;
  try {
    movie = await storage.getMovieByTmdbId(tmdbMovie.id);
    if (!movie) {
      const result = await executeDirectSql(
        `INSERT INTO movies (tmdb_id, title, overview, poster_path, backdrop_path, release_date, vote_average, runtime, number_of_seasons, number_of_episodes, media_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          tmdbMovie.id,
          tmdbMovie.title || tmdbMovie.name || '[Unknown Title]',
          tmdbMovie.overview || '',
          tmdbMovie.poster_path || '',
          tmdbMovie.backdrop_path || '',
          tmdbMovie.release_date || tmdbMovie.first_air_date || null,
          tmdbMovie.vote_average || 0,
          tmdbMovie.runtime || null,
          tmdbMovie.number_of_seasons || null,
          tmdbMovie.number_of_episodes || null,
          tmdbMovie.media_type || 'movie',
          new Date(),
        ]
      );

      if (result.rows.length > 0) {
        movie = result.rows[0] as Movie;
      }
    }

    if (!movie) return null;

    const entry: WatchlistEntry = {
      id: 0,
      userId,
      movieId: movie.id,
      platformId: null,
      status: 'to_watch',
      watchedDate: null,
      notes: '',
      createdAt: new Date(),
    };

    const result = await executeDirectSql(
      `INSERT INTO watchlist_entries (user_id, movie_id, platform_id, status, watched_date, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        movie.id,
        entry.platformId,
        entry.status,
        entry.watchedDate,
        entry.notes,
        entry.createdAt,
      ]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0] as WatchlistEntry;
      return {
        ...row,
        movie,
        platform: null,
      };
    }
  } catch (error) {
    console.error('[EMERGENCY WATCHLIST] Error adding to watchlist:', error);
  }
  return null;
}

export async function emergencyUserCreate(
  username: string,
  password: string
): Promise<User | null> {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await executeDirectSql(
      `INSERT INTO users (username, password, role, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [username, passwordHash, 'user', new Date()]
    );

    if (result.rows.length > 0) {
      return result.rows[0] as User;
    }
  } catch (error) {
    console.error('[EMERGENCY WATCHLIST] Error creating user:', error);
  }
  return null;
}

export async function emergencyUserCheck(
  username: string,
  password: string
): Promise<User | null> {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user) return null;

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return null;

    return user;
  } catch (error) {
    console.error('[EMERGENCY WATCHLIST] Error checking user:', error);
    return null;
  }
}