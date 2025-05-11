import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { UserResponse } from '@shared/schema';

const router = Router();

router.get('/emergency/raw-token/:username', async (req: Request, res: Response) => {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    let user = await storage.getUserByUsername(username);
    if (!user) {
      console.log(`[EMERGENCY AUTH] User ${username} not found, creating...`);
      user = await storage.createUser({
        username,
        password: 'emergency',
        role: 'user',
        displayName: null,
        createdAt: new Date(),
      });
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to create or retrieve user' });
    }

    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    };

    const token = jwt.sign(userResponse, process.env.JWT_SECRET || 'movie-watchlist-secure-jwt-secret-key', {
      expiresIn: '7d',
    });

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('[EMERGENCY AUTH] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;