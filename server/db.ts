import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, watchlist } from './schema';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema: { users, watchlist } });