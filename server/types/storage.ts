import { db } from '../db';
import * as schema from '@shared/schema';
import { UserResponse, WatchlistEntry } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const storage = {
  async createUser(user: Omit<UserResponse, 'id'> & { password?: string }): Promise<UserResponse> {
    const [newUser] = await db
      .insert(schema.users)
      .values({
        username: user.username,
        password: user.password,
        displayName: user.displayName || user.username,
        role: user.role || 'user',
        createdAt: user.createdAt || new Date(),
      })
      .returning();
    return {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  },

  async getUser(id: number): Promise<UserResponse | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      password: user.password,
    };
  },

  async getUserByUsername(username: string): Promise<UserResponse | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      password: user.password,
    };
  },

  async getWatchlist(userId: number): Promise<WatchlistEntry[]> {
    return db
      .select()
      .from(schema.watchlistEntries)
      .where(eq(schema.watchlistEntries.userId, userId));
  },

  async addToWatchlist(entry: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<WatchlistEntry> {
    const [newEntry] = await db
      .insert(schema.watchlistEntries)
      .values({
        userId: entry.userId,
        movieId: entry.movieId,
        title: entry.title,
        posterPath: entry.posterPath,
        status: entry.status,
        rating: entry.rating,
        notes: entry.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newEntry;
  },

  async updateWatchlistEntry(id: number, updates: Partial<Omit<WatchlistEntry, 'id' | 'userId' | 'movieId' | 'createdAt'>>): Promise<WatchlistEntry | null> {
    const [updatedEntry] = await db
      .update(schema.watchlistEntries)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.watchlistEntries.id, id))
      .returning();
    return updatedEntry || null;
  },

  async removeFromWatchlist(id: number): Promise<boolean> {
    const [result] = await db
      .delete(schema.watchlistEntries)
      .where(eq(schema.watchlistEntries.id, id))
      .returning();
    return !!result;
  },
};