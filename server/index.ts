import { register } from 'tsconfig-paths';
register({ baseUrl: __dirname + '/..', paths: { '@shared/*': ['shared/*'] } });
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import authRouter from './authRoutes';
import apiRouter from './routes';
import jwtAuthRouter from './jwtAuthRoutes';
import { configurePassport, isAuthenticated, validateSession } from './auth';

const app = express();
const SESSION_SECRET = process.env.SESSION_SECRET || 'movie-watchlist-secret';

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(validateSession);

// Passport configuration
configurePassport();

// Routes
app.use('/api/auth', authRouter);
app.use('/api', isAuthenticated, apiRouter);
app.use('/api/jwt', jwtAuthRouter);

// Health check for Vercel
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});