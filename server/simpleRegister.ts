import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { insertUserSchema, UserResponse } from '@shared/schema';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';

  try {
    const validated = insertUserSchema.safeParse(req.body);
    if (!validated.success) {
      const errors = validated.error.format();
      console.error('[SIMPLE REGISTER] Validation failed:', JSON.stringify(errors, null, 2));
      return res.status(400).json({
        message: 'Invalid registration data',
        errors: isProd ? undefined : errors,
      });
    }

    const { username, password } = validated.data;

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      console.log(`[SIMPLE REGISTER] Username ${username} already exists`);
      return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      role: 'user',
      displayName: null,
      createdAt: new Date(),
    });

    if (!newUser) {
      console.error('[SIMPLE REGISTER] Failed to create user');
      return res.status(500).json({ message: 'Failed to create user' });
    }

    const userResponse: UserResponse = {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    req.login(userResponse, (loginErr) => {
      if (loginErr) {
        console.error('[SIMPLE REGISTER] Login failed:', loginErr);
        return res.status(500).json({ error: 'Login failed' });
      }
      return res.status(201).json(userResponse);
    });
  } catch (error) {
    console.error('[SIMPLE REGISTER] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;