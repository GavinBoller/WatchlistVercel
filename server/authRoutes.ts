import { Router, Request, Response } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { storage } from './types/storage';
import { UserResponse } from '@shared/schema';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  const { username, password, displayName } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      displayName,
      role: 'user',
      createdAt: new Date(),
    });

    req.logIn(newUser, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      req.session.authenticated = true;
      req.session.createdAt = Date.now();
      req.session.lastChecked = Date.now();
      return res.json({
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        role: newUser.role,
        createdAt: newUser.createdAt,
      });
    });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

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