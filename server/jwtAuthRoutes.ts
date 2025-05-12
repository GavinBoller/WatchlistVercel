import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { insertUserSchema, UserResponse } from '@shared/schema';
import { executeDirectSql } from './db';
import { generateToken, createUserResponse } from './jwtAuth';
import { verifyToken, extractTokenFromHeader } from './jwtAuth';

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

    const directSqlEnvironment = process.env.DIRECT_SQL === 'true';
    let newUser: UserResponse;

    if (directSqlEnvironment) {
      const query = `
        INSERT INTO users (username, password, displayName, createdAt)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, displayName, role, createdAt
      `;
      const result = await executeDirectSql(query, [
        username,
        hashedPassword,
        userData.displayName,
        new Date(),
      ]);
      newUser = result[0] as UserResponse;
    } else {
      const user = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        displayName: userData.displayName,
        role: userData.role || 'user',
        createdAt: new Date(),
      });
      newUser = createUserResponse(user);
    }

    const token = generateToken(newUser);
    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('[JwtAuthRoutes] Register error:', error);
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

    const userResponse = createUserResponse(user);
    const token = generateToken(userResponse);
    res.status(200).json({ user: userResponse, token });
  } catch (error) {
    console.error('[JwtAuthRoutes] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResponse = createUserResponse(dbUser);
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('[JwtAuthRoutes] Me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = generateToken(createUserResponse(dbUser));
    res.status(200).json({ token: newToken });
  } catch (error) {
    console.error('[JwtAuthRoutes] Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const jwtRouter = router;