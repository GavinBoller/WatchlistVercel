import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import routes from './routes';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PGSession = connectPgSimple(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);

app.use(cors());
app.use(express.json());
app.use(
  session({
    store: new PGSession({
      pool,
      tableName: 'sessions',
    }),
    secret: process.env.SESSION_SECRET || 'your-session-secret-456',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});