import { Request, Response, Router } from 'express';
import { storage } from './storage';
import { UserResponse } from '@shared/schema';
import bcrypt from 'bcryptjs';

const router = Router();

export interface UserPayload {
  id: number;
  username: string;
  createdAt: Date;
}

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await storage.getUserByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload: UserPayload = {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };

  req.login(payload, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Login failed' });
    }
    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    };
    return res.json(userResponse);
  });
});

export default router;