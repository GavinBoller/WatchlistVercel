import { Router, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import asyncHandler from 'express-async-handler';
import { UserResponse } from '@shared/schema';
import { getUserByUsername, createUser, getWatchlist, addToWatchlist } from './db';

const router = Router();

router.get('/api/auth/status', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const session = req.session as session.Session & { user?: UserResponse };
  if (session.user) {
    res.json({ authenticated: true, user: session.user });
  } else {
    res.json({ authenticated: false, user: null });
  }
}));

router.post('/api/auth/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const user = await getUserByUsername(username);
  if (user && password === 'password') {
    (req.session as session.Session & { user?: UserResponse }).user = user;
    res.json({ authenticated: true, user });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}));

router.post('/api/auth/register', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password, displayName } = req.body;
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    res.status(400).json({ error: 'Username already exists' });
    return;
  }
  const user = await createUser({ username, password, displayName });
  (req.session as session.Session & { user?: UserResponse }).user = user;
  res.status(201).json({ authenticated: true, user });
}));

router.post('/api/auth/logout', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
}));

const authMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = req.session as session.Session & { user?: UserResponse };
  if (!session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  (req as any).user = session.user;
  next();
});

router.get('/api/auth/platforms', authMiddleware, asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.json([]); // Mock platforms
}));

router.get('/api/auth/watchlist', authMiddleware, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const session = req.session as session.Session & { user?: UserResponse };
  if (!session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const watchlist = await getWatchlist(session.user.id);
  res.json(watchlist);
}));

router.post('/api/auth/watchlist', authMiddleware, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const session = req.session as session.Session & { user?: UserResponse };
  if (!session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { tmdbId } = req.body;
  const entry = await addToWatchlist(session.user.id, tmdbId);
  res.status(201).json(entry);
}));

router.put('/api/auth/watchlist/:id', authMiddleware, asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true }); // Mock update watchlist
}));

router.delete('/api/auth/watchlist/:id', authMiddleware, asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true }); // Mock delete watchlist
}));

router.get('/api/movies/search', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.json([]); // Mock search
}));

router.get('/api/movies/details/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.json({ id: req.params.id }); // Mock details
}));

router.get('/api/tmdb/search', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;
  if (!query) {
    res.json({ results: [] });
    return;
  }
  // Mock TMDB search response
  res.json({
    results: [
      {
        id: 1,
        title: `Mock Movie: ${query}`,
        name: `Mock Movie: ${query}`,
      },
    ],
  });
}));

export default router;
