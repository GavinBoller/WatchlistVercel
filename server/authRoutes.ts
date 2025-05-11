import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { insertUserSchema, UserResponse } from '@shared/schema';
import bcrypt from 'bcryptjs';
import passport from 'passport';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = await storage.getUserByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const userWithoutPassword: UserResponse = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  };

  req.login(userWithoutPassword, (loginErr) => {
    if (loginErr) {
      return res.status(500).json({ error: 'Login failed' });
    }
    return res.json(userWithoutPassword);
  });
});

router.post('/register', async (req: Request, res: Response) => {
  const userData = insertUserSchema.parse(req.body);
  const existingUser = await storage.getUserByUsername(userData.username);
  if (existingUser) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser = await storage.createUser({
    username: userData.username,
    password: hashedPassword,
    role: userData.role || 'user',
    displayName: userData.displayName,
    createdAt: userData.createdAt || new Date(),
  });

  const userWithoutPassword: UserResponse = {
    id: newUser.id,
    username: newUser.username,
    displayName: newUser.displayName,
    role: newUser.role,
    createdAt: newUser.createdAt,
  };

  req.login(userWithoutPassword, (loginErr) => {
    if (loginErr) {
      return res.status(500).json({ error: 'Login failed' });
    }
    return res.status(201).json(userWithoutPassword);
  });
});

export default router;