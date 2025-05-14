import { Router, Request, Response } from 'express';
import { db, storage } from './types/storage';
import { insertUserSchema, UserResponse } from '@shared/schema';
import bcrypt from 'bcryptjs';
import { generateToken } from './jwtAuth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const username = userData.username;
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const newUser = await storage.createUser({
      username: userData.username,
      password: hashedPassword,
      displayName: userData.displayName,
      role: userData.role || 'user',
      createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
    });
    const token = generateToken(newUser);
    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      token,
    });
 視点: **register** endpoint
  } catch (error) {
    console.error('[AuthRoutes] Register error:', error);
    res.status(400).json({ error: 'Invalid user data' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    });
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('[AuthRoutes] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const authRouter = router;