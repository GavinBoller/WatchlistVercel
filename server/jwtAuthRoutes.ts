import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { insertUserSchema, UserResponse, insertWatchlistEntrySchema } from '@shared/schema';
import { Pool } from 'pg';
import { DATABASE_URL } from './db';
import { generateToken, createUserResponse, verifyToken, extractTokenFromHeader } from './jwtAuth';
import fetch from 'node-fetch';

const pool = new Pool({ connectionString: DATABASE_URL });
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

const router = Router();

// Register
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
      const result = await pool.query(query, [
        username,
        hashedPassword,
        userData.displayName,
        new Date(),
      ]);
      newUser = result.rows[0] as UserResponse;
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

// Login
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

// Get User Info
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

// Refresh Token
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

// TMDB Search Movies
router.get('/tmdb/search', async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req);
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    res.status(200).json(data.results || []);
  } catch (error) {
    console.error('[JwtAuthRoutes] TMDB search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TMDB Movie Details
router.get('/tmdb/movie/:id', async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req);
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    if (data.success === false) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error('[JwtAuthRoutes] TMDB movie error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to Watchlist
router.post('/watchlist/add', async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req);
    const user = token ? verifyToken(token) : null;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const entryData = insertWatchlistEntrySchema.parse(req.body);
    const existingEntry = await storage.getWatchlistEntry(user.id, entryData.movieId);
    if (existingEntry) {
      return res.status(400).json({ error: 'Movie already in watchlist' });
    }

    const newEntry = await storage.addWatchlistEntry(user.id, {
      movieId: entryData.movieId,
      addedAt: new Date(),
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('[JwtAuthRoutes] Watchlist add error:', error);
    res.status(400).json({ error: 'Invalid watchlist data' });
  }
});

// Remove from Watchlist
router.delete('/watchlist/remove/:movieId', async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req);
    const user = token ? verifyToken(token) : null;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const deletedEntry = await storage.deleteWatchlistEntry(user.id, movieId);
    if (!deletedEntry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }

    res.status(200).json({ message: 'Movie removed from watchlist' });
  } catch (error) {
    console.error('[JwtAuthRoutes] Watchlist remove error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Watchlist
router.get('/watchlist', async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req);
    const user = token ? verifyToken(token) : null;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const entries = await storage.getWatchlist(user.id);
    res.status(200).json(entries);
  } catch (error) {
    console.error('[JwtAuthRoutes] Watchlist get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const jwtRouter = router;