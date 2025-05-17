import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { executeDirectSql, User } from './db';

interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: Date;
}

const router = express.Router();

// Passport local strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      console.log('[AUTH] Authenticating user:', username);
      const result = await executeDirectSql('SELECT * FROM users WHERE username = $1', [username]);
      const user: User | undefined = result[0];
      if (!user) {
        console.log('[AUTH] No user found with username:', username);
        return done(null, false, { message: 'No user found' });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.log('[AUTH] Invalid password for user:', username);
        return done(null, false, { message: 'Invalid password' });
      }
      console.log('[AUTH] Password validation successful for user:', username);
      return done(null, {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        createdAt: new Date(user.created_at),
      } as UserResponse);
    } catch (err) {
      console.error('[AUTH] Error in local strategy:', err);
      return done(err);
    }
  }
));

router.post('/login', (req, res, next) => {
  console.log('[AUTH] Login attempt for username:', req.body.username);
  passport.authenticate('local', (err: any, user: UserResponse, info: any) => {
    if (err) {
      console.error('[AUTH] Error during authentication:', err);
      return next(err);
    }
    if (!user) {
      console.log('[AUTH] Login failed:', info.message);
      return res.status(401).json({ error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('[AUTH] Error logging in:', err);
        return next(err);
      }
      console.log('[AUTH] Login successful for user:', user.username, '(ID:', user.id, ')');
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

router.post('/register', async (req, res, next) => {
  const { username, password, displayName } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await executeDirectSql(
      'INSERT INTO users (username, password, display_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, hashedPassword, displayName || username, 'user']
    );
    const user: User | undefined = result[0];
    if (!user) {
      throw new Error('User creation failed');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('[AUTH] Error logging in after registration:', err);
        return next(err);
      }
      console.log('[AUTH] Registration successful for user:', user.username);
      return res.json({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        createdAt: new Date(user.created_at),
      });
    });
  } catch (err: any) {
    if (err.message.includes('unique_violation')) {
      console.log('[AUTH] Registration failed: Username already exists');
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('[AUTH] Registration error:', err);
    return next(err);
  }
});

router.get('/status', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    const user = req.user as UserResponse;
    console.log('[AUTH] Session status: Authenticated user:', user.username);
    return res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
  console.log('[AUTH] Session status: Not authenticated');
  return res.status(401).json({ error: 'Not authenticated' });
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('[AUTH] Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('[AUTH] Session destroy error:', err);
        return res.status(500).json({ error: 'Session destroy failed' });
      }
      console.log('[AUTH] Logout successful');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

router.get('/watchlist', async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    console.log('[WATCHLIST] Access denied: Not authenticated');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = req.user as UserResponse;
  try {
    const watchlist = await executeDirectSql(
      'SELECT w.*, m.title, m.poster_path, m.media_type FROM watchlist w JOIN movies m ON w.tmdb_id = m.tmdb_id WHERE w.user_id = $1',
      [user.id]
    );
    console.log('[WATCHLIST] Fetched watchlist for user:', user.username);
    res.json(watchlist);
  } catch (err) {
    console.error('[WATCHLIST] Error fetching watchlist:', err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/watchlist', async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    console.log('[WATCHLIST] Access denied: Not authenticated');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = req.user as UserResponse;
  const { tmdbId, tmdbMovie, platformId, watchedDate, notes, status } = req.body;
  try {
    // Check if already in watchlist
    const existing = await executeDirectSql(
      'SELECT * FROM watchlist WHERE user_id = $1 AND tmdb_id = $2',
      [user.id, tmdbId]
    );
    if (existing.length > 0) {
      console.log('[WATCHLIST] Item already in watchlist for user:', user.username);
      return res.status(409).json({ message: 'Already in watchlist' });
    }
    // Insert movie into movies table if not exists
    await executeDirectSql(
      'INSERT INTO movies (tmdb_id, title, poster_path, media_type) VALUES ($1, $2, $3, $4) ON CONFLICT (tmdb_id) DO NOTHING',
      [tmdbId, tmdbMovie.title, tmdbMovie.poster_path, tmdbMovie.media_type]
    );
    // Insert into watchlist
    const result = await executeDirectSql(
      'INSERT INTO watchlist (user_id, tmdb_id, platform_id, watched_date, notes, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user.id, tmdbId, platformId || null, watchedDate || null, notes || null, status]
    );
    console.log('[WATCHLIST] Added to watchlist for user:', user.username);
    res.json(result[0]);
  } catch (err) {
    console.error('[WATCHLIST] Error adding to watchlist:', err);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

router.get('/platforms/:userId', async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    console.log('[PLATFORMS] Access denied: Not authenticated');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = req.user as UserResponse;
  if (user.id !== parseInt(req.params.userId)) {
    console.log('[PLATFORMS] Access denied: User ID mismatch');
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const platforms = await executeDirectSql(
      'SELECT * FROM platforms WHERE user_id = $1',
      [user.id]
    );
    console.log('[PLATFORMS] Fetched platforms for user:', user.username);
    res.json(platforms);
  } catch (err) {
    console.error('[PLATFORMS] Error fetching platforms:', err);
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

export default router;