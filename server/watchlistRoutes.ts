import { Router, Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

interface AuthenticatedRequest extends Request {
  session: {
    user?: { id: number; username: string; displayName: string; role: string; createdAt: string };
  };
}

const router = Router();

router.get('/api/auth/status', asyncHandler(async (req: Request, res: Response) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false, user: null });
  }
}));

router.post('/api/auth/login', asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === 'TestUser' && password === 'password') {
    req.session.user = { id: 1, username, displayName: 'Test User', role: 'user', createdAt: new Date().toISOString() };
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}));

router.post('/api/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, password, displayName } = req.body;
  if (username === 'TestUser') {
    return res.status(400).json({ error: 'Username already exists' });
  }
  req.session.user = { id: 2, username, displayName, role: 'user', createdAt: new Date().toISOString() };
  res.status(201).json({ authenticated: true, user: req.session.user });
}));

const authMiddleware = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

router.get('/api/auth/platforms', authMiddleware, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  res.json([]); // Mock platforms
}));

router.get('/api/auth/watchlist', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json([]); // Mock watchlist
}));

router.post('/api/auth/watchlist', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.status(201).json({ success: true }); // Mock add to watchlist
}));

router.put('/api/auth/watchlist/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true }); // Mock update watchlist
}));

router.delete('/api/auth/watchlist/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true }); // Mock delete watchlist
}));

router.get('/api/movies/search', asyncHandler(async (req: Request, res: Response) => {
  res.json([]); // Mock search
}));

router.get('/api/movies/details/:id', asyncHandler(async (req: Request, res: Response) => {
  res.json({ id: req.params.id }); // Mock details
}));

export default router;
