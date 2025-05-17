import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Pool } from 'pg';
import authRoutes from './authRoutes';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password !== password) { // Replace with bcrypt in production
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/movies/search', async (req: Request, res: Response) => {
  const { query, mediaType } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        include_adult: false,
      },
    });
    console.log('[API] TMDB search successful for query:', query);
    res.json(response.data);
  } catch (error) {
    console.error('[API] TMDB search error:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

app.get('/api/movies/details/:tmdbId', async (req: Request, res: Response) => {
  const { tmdbId } = req.params;
  const { mediaType } = req.query;
  if (!mediaType || !['movie', 'tv'].includes(mediaType as string)) {
    return res.status(400).json({ error: 'Valid mediaType (movie or tv) is required' });
  }
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY },
    });
    console.log('[API] TMDB details successful for ID:', tmdbId);
    res.json(response.data);
  } catch (error) {
    console.error('[API] TMDB details error:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

app.get('/api/movies/external-ids/:tmdbId', async (req: Request, res: Response) => {
  const { tmdbId } = req.params;
  const { mediaType } = req.query;
  if (!mediaType || !['movie', 'tv'].includes(mediaType as string)) {
    return res.status(400).json({ error: 'Valid mediaType (movie or tv) is required' });
  }
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}/external_ids`, {
      params: { api_key: TMDB_API_KEY },
    });
    console.log('[API] TMDB external IDs successful for ID:', tmdbId);
    res.json(response.data);
  } catch (error) {
    console.error('[API] TMDB external IDs error:', error);
    res.status(500).json({ error: 'Failed to fetch external IDs' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});