import { Router, Request, Response } from 'express';
import passport from 'passport';
import { storage } from './types/storage';
import { UserResponse } from '@shared/schema';

const router = Router();

// Login endpoint
router.post('/login', (req: Request, res: Response, next) => {
  passport.authenticate('local', (err: any, user: UserResponse | false, info: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message || 'Authentication failed' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.authenticated = true;
      req.session.createdAt = Date.now();
      req.session.lastChecked = Date.now();
      return res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      });
    });
  })(req, res, next);
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: 'Session destruction failed' });
      res.status(204).send();
    });
  });
});

// Get current user
router.get('/user', (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = req.user as UserResponse;
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  });
});

export default router;