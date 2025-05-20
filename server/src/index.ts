import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import watchlistRoutes from './watchlistRoutes';

declare module 'express-session' {
  interface SessionData {
    user?: { id: number; username: string; displayName: string; role: string; createdAt: string };
  }
}

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'GypZjJH+i2rPPbC1WHdNTvQVTtSRsSOYYyznjZQxWAEn',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true },
}));

app.get('/api/auth/check', (req: Request, res: Response) => {
  if (req.session.user) {
    res.json({ user: req.session.user, authenticated: true });
  } else {
    res.json({ user: null, authenticated: false });
  }
});

app.use('/', watchlistRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
