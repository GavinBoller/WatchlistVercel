import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { db } from './db';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

// Define User type based on schema
interface User {
  id: number;
  username: string;
  password: string;
  displayName: string;
  role: string;
  created_at: string;
}

const router = express.Router();

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err: any, user: User | false, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info.message || 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          created_at: user.created_at,
        },
      });
    });
  })(req, res, next);
});

router.post('/register', async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(schema.users).values({
      username,
      password: hashedPassword,
      displayName,
      role: 'user',
    }).returning();
    res.json({ message: 'Registration Successful', user: newUser });
  } catch (error) {
    console.error('[API] Registration error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'Logged out' });
  });
});

router.get('/status', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    const user = req.user as unknown as User; // Safe type assertion
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

router.get('/login-failure', (req, res) => {
  res.status(401).json({ error: 'Login failed' });
});

router.post('/reset-password-request', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Implement reset logic (e.g., send email)
    res.json({ message: 'Password reset request sent' });
  } catch (error) {
    console.error('[API] Reset password request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  try {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(schema.users)
      .set({ password: hashedPassword })
      .where(eq(schema.users.username, username));
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('[API] Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
