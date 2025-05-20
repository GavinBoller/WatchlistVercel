import { Router, Request, Response } from 'express';
import { db } from './db';
import { Movie, WatchlistEntry, Platform, TMDBMovie, UserResponse } from '@shared/schema';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: UserResponse | { id: number; iat: number; exp: number };
}

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const user = await db.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/api/auth/status', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.json({ authenticated: false });
  }
  try {
    const user = await db.getUserById(req.session.userId);
    res.json({ authenticated: !!user, user });
  } catch (error) {
    console.error('Status check error:', error);
    res.json({ authenticated: false });
  }
});

router.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await db.verifyUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    res.json({ authenticated: true, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, password, displayName } = req.body;
  try {
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const user = await db.createUser(username, password, displayName);
    req.session.userId = user.id;
    res.json({ authenticated: true, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/auth/logout', async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

router.get('/api/auth/platforms', authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const platforms: Platform[] = [
      { id: 1, name: 'Netflix', icon: '/netflix.png' },
      { id: 2, name: 'HBO Max', icon: '/hbo.png' },
    ];
    res.json(platforms);
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/auth/watchlist', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entries = await db.getWatchlist(req.user!.id);
    const watchlist: WatchlistEntry[] = entries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      tmdbId: entry.tmdbId,
      platformId: entry.platformId,
      watchedDate: entry.watchedDate,
      notes: entry.notes,
      status: entry.status,
      createdAt: entry.createdAt,
      movie: {
        tmdbId: entry.tmdbId,
        title: entry.movie.title,
        posterPath: entry.movie.posterPath,
        mediaType: entry.movie.mediaType,
        overview: entry.movie.overview,
        releaseDate: entry.movie.releaseDate,
        voteAverage: entry.movie.voteAverage,
        backdropPath: entry.movie.backdropPath,
        genres: entry.movie.genres,
      },
    }));
    res.json(watchlist);
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/auth/watchlist', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { tmdbId, tmdbMovie, status, notes } = req.body;
  try {
    const existingEntry = await db.getWatchlistEntry(req.user!.id, tmdbId);
    if (existingEntry) {
      return res.status(400).json({ error: 'Movie already in watchlist' });
    }
    const movie: Movie = {
      tmdbId,
      title: tmdbMovie.title || tmdbMovie.name || 'Unknown',
      posterPath: tmdbMovie.poster_path || '/unknown.jpg',
      mediaType: tmdbMovie.media_type || 'movie',
      overview: tmdbMovie.overview || 'No description available',
      releaseDate: tmdbMovie.release_date || tmdbMovie.first_air_date || 'N/A',
      voteAverage: tmdbMovie.vote_average || 0,
      backdropPath: tmdbMovie.backdrop_path || '/unknown.jpg',
      genres: tmdbMovie.genres || tmdbMovie.genre_ids?.join(',') || '',
    };
    const entry = await db.addToWatchlist(req.user!.id, tmdbId, movie, status, notes);
    res.json({ message: 'Added to watchlist', entry });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/api/auth/watchlist/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { watchedDate, notes, status, platformId } = req.body;
  try {
    const entry = await db.updateWatchlistEntry(req.user!.id, parseInt(id), {
      watchedDate,
      notes,
      status,
      platformId,
    });
    if (!entry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }
    res.json({ message: 'Watchlist entry updated', entry });
  } catch (error) {
    console.error('Update watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/api/auth/watchlist/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const success = await db.deleteWatchlistEntry(req.user!.id, parseInt(id));
    if (!success) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }
    res.json({ message: 'Watchlist entry deleted' });
  } catch (error) {
    console.error('Delete watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock TMDB API endpoints
router.get('/api/movies/search', async (req: Request, res: Response) => {
  const { query, mediaType } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }
  try {
    const mockResults: TMDBMovie[] = [
      {
        id: 550,
        title: 'Fight Club',
        poster_path: '/path.jpg',
        media_type: 'movie',
        overview: 'A ticking-time-bomb insomniac...',
        release_date: '1999-10-15',
        vote_average: 8.4,
        backdrop_path: '/backdrop.jpg',
        genre_ids: [18, 53],
        runtime: 139,
      },
      {
        id: 680,
        title: 'Pulp Fiction',
        poster_path: '/pulp.jpg',
        media_type: 'movie',
        overview: 'The lives of two mob hitmen...',
        release_date: '1994-10-14',
        vote_average: 8.5,
        backdrop_path: '/pulp-backdrop.jpg',
        genre_ids: [80, 18],
        runtime: 154,
      },
      {
        id: 714,
        name: 'Breaking Bad',
        poster_path: '/breakingbad.jpg',
        media_type: 'tv',
        overview: 'A chemistry teacher turned drug lord...',
        first_air_date: '2008-01-20',
        vote_average: 8.9,
        backdrop_path: '/breakingbad-backdrop.jpg',
        genre_ids: [18, 80],
        number_of_seasons: 5,
        number_of_episodes: 62,
      },
    ];
    const results = mockResults.filter((m) =>
      (m.title || m.name || '').toLowerCase().includes(query.toLowerCase()) &&
      (mediaType === 'all' || m.media_type === mediaType)
    );
    res.json({
      page: 1,
      results,
      total_results: results.length,
      total_pages: 1,
    });
  } catch (error) {
    console.error('Mock search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/movies/details/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { mediaType } = req.query;
  try {
    const mockDetails: Record<string, any> = {
      '550': {
        id: 550,
        runtime: 139,
        media_type: 'movie',
      },
      '680': {
        id: 680,
        runtime: 154,
        media_type: 'movie',
      },
      '714': {
        id: 714,
        number_of_seasons: 5,
        number_of_episodes: 62,
        media_type: 'tv',
      },
    };
    const details = mockDetails[id] || {};
    if (mediaType && details.media_type !== mediaType) {
      return res.status(404).json({ error: 'Details not found' });
    }
    res.json(details);
  } catch (error) {
    console.error('Mock details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/movies/external-ids/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const mockIds: Record<string, { imdb_id: string }> = {
      '550': { imdb_id: 'tt0137523' },
      '680': { imdb_id: 'tt0110912' },
      '714': { imdb_id: 'tt0903747' },
    };
    res.json(mockIds[id] || {});
  } catch (error) {
    console.error('Mock external IDs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set response headers
router.use((req: Request, res: Response, next: Function) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  next();
});

export default router;
