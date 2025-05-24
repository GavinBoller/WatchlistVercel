import express, { Express, Request, Response } from 'express';
import session from 'express-session';
import cors from 'cors';
import watchlistRoutes from './watchlistRoutes';
import { User } from './db';

const app: Express = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: 'mock-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use(watchlistRoutes);

app.get('/api/auth/check', (req: Request, res: Response) => {
  const session = req.session as session.Session & { user?: User };
  if (session.user) {
    res.json({ user: session.user, authenticated: true });
  } else {
    res.json({ user: null, authenticated: false });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
