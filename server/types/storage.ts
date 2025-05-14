import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

config();

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export interface Storage {
  getUserByUsername(username: string): Promise<schema.UserResponse | null>;
  createUser(user: {
    username: string;
    password: string;
    displayName: string;
    role: string;
    createdAt: Date;
  }): Promise<schema.UserResponse>;
  getUser(userId: number): Promise<schema.UserResponse | null>;
  getWatchlist(userId: number): Promise<schema.WatchlistEntryWithMovie[]>;
  addMovie(movie: {
    userId: number;
    movieId: number;
    status: string;
    rating?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<schema.WatchlistEntry>;
  getSystemStats(): Promise<{ userCount: number; watchlistCount: number }>;
  getFullSystemStats(): Promise<{ userCount: number; watchlistCount: number; activeSessions: number }>;
  getSummaryStats(): Promise<{ totalUsers: number; totalWatchlistEntries: number }>;
  getUserActivity(): Promise<{ userId: number; username: string; lastActive: Date }[]>;
  getSystemHealth(): Promise<{ status: string; uptime: number }>;
}

export const storage: Storage = {
  async getUserByUsername(username: string): Promise<schema.UserResponse | null> {
    const result = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        displayName: schema.users.displayName,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        password: schema.users.password,
      })
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return result[0] || null;
  },

  async createUser(user: {
    username: string;
    password: string;
    displayName: string;
    role: string;
    createdAt: Date;
  }): Promise<schema.UserResponse> {
    const [newUser] = await db
      .insert(schema.users)
      .values({
        username: user.username,
        password: user.password,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      })
      .returning({
        id: schema.users.id,
        username: schema.users.username,
        displayName: schema.users.displayName,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      });
    return newUser;
  },

  async getUser(userId: number): Promise<schema.UserResponse | null> {
    const result = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        displayName: schema.users.displayName,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        password: schema.users.password,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    return result[0] || null;
  },

  async getWatchlist(userId: number): Promise<schema.WatchlistEntryWithMovie[]> {
    const entries = await db
      .select({
        id: schema.watchlistEntries.id,
        userId: schema.watchlistEntries.userId,
        movieId: schema.watchlistEntries.movieId,
        status: schema.watchlistEntries.status,
        rating: schema.watchlistEntries.rating,
        notes: schema.watchlistEntries.notes,
        createdAt: schema.watchlistEntries.createdAt,
        updatedAt: schema.watchlistEntries.updatedAt,
        movie: {
          id: schema.movies.id,
          title: schema.movies.title,
          description: schema.movies.description,
          releaseDate: schema.movies.releaseDate,
          genre: schema.movies.genre,
          rating: schema.movies.rating,
          poster: schema.movies.poster,
          tmdbId: schema.movies.tmdbId,
          runtime: schema.movies.runtime,
          platforms: schema.movies.platforms,
          cast: schema.movies.cast,
          director: schema.movies.director,
          createdAt: schema.movies.createdAt,
        },
      })
      .from(schema.watchlistEntries)
      .innerJoin(schema.movies, eq(schema.watchlistEntries.movieId, schema.movies.id))
      .where(eq(schema.watchlistEntries.userId, userId));
    return entries;
  },

  async addMovie(movie: {
    userId: number;
    movieId: number;
    status: string;
    rating?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<schema.WatchlistEntry> {
    const [newEntry] = await db
      .insert(schema.watchlistEntries)
      .values({
        userId: movie.userId,
        movieId: movie.movieId,
        status: movie.status,
        rating: movie.rating,
        notes: movie.notes,
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt,
      })
      .returning();
    return newEntry;
  },

  async getSystemStats(): Promise<{ userCount: number; watchlistCount: number }> {
    const [userCount] = await db.select({ count: schema.sql`count(*)` }).from(schema.users);
    const [watchlistCount] = await db.select({ count: schema.sql`count(*)` }).from(schema.watchlistEntries);
    return {
      userCount: Number(userCount.count),
      watchlistCount: Number(watchlistCount.count),
    };
  },

  async getFullSystemStats(): Promise<{ userCount: number; watchlistCount: number; activeSessions: number }> {
    const [userCount] = await db.select({ count: schema.sql`count(*)` }).from(schema.users);
    const [watchlistCount] = await db.select({ count: schema.sql`count(*)` }).from(schema.watchlistEntries);
    return {
      userCount: Number(userCount.count),
      watchlistCount: Number(watchlistCount.count),
      activeSessions: 0, // Replace with actual session counting logic
    };
  },

  async getSummaryStats(): Promise<{ totalUsers: number; totalWatchlistEntries: number }> {
    const [userCount] = await db.select({ count: schema.sql`count(*)` }).from(schema.users);
    const [watchlistCount] = await db.select({ count: schema.sql`count(*)` }).from(schema.watchlistEntries);
    return {
      totalUsers: Number(userCount.count),
      totalWatchlistEntries: Number(watchlistCount.count),
    };
  },

  async getUserActivity(): Promise<{ userId: number; username: string; lastActive: Date }[]> {
    // Placeholder: Implement based on your user activity tracking
    return [];
  },

  async getSystemHealth(): Promise<{ status: string; uptime: number }> {
    return {
      status: 'healthy',
      uptime: process.uptime(),
    };
  },
};