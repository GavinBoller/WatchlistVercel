import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_URL } from './db';

const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });

export const storage = {
  async getUserByUsername(username: string) {
    const result = await db.select().from(schema.users).where({ username }).limit(1);
    return result[0];
  },
  async getUser(userId: number) {
    const result = await db.select().from(schema.users).where({ id: userId }).limit(1);
    return result[0];
  },
  async getWatchlist(userId: number) {
    return await db.select().from(schema.watchlistEntries).where({ userId });
  },
  async getWatchlistEntry(userId: number, movieId: number) {
    const result = await db
      .select()
      .from(schema.watchlistEntries)
      .where({ userId, movieId })
      .limit(1);
    return result[0];
  },
  async getWatchlistWithMovies(userId: number) {
    return await db
      .select()
      .from(schema.watchlistEntries)
      .leftJoin(schema.movies, { movieId: schema.movies.id })
      .where({ userId });
  },
  async addWatchlistEntry(userId: number, entry: schema.InsertWatchlistEntry) {
    const result = await db.insert(schema.watchlistEntries).values({ ...entry, userId }).returning();
    return result[0];
  },
  async updateWatchlistEntry(userId: number, movieId: number, entry: Partial<schema.InsertWatchlistEntry>) {
    const result = await db
      .update(schema.watchlistEntries)
      .set(entry)
      .where({ userId, movieId })
      .returning();
    return result[0];
  },
  async deleteWatchlistEntry(userId: number, movieId: number) {
    const result = await db.delete(schema.watchlistEntries).where({ userId, movieId }).returning();
    return result[0];
  },
  async getMovie(movieId: number) {
    const result = await db.select().from(schema.movies).where({ id: movieId }).limit(1);
    return result[0];
  },
  async getMoviesByIds(movieIds: number[]) {
    return await db.select().from(schema.movies).where({ id: { in: movieIds } });
  },
  async addMovie(movie: schema.InsertMovie) {
    const result = await db.insert(schema.movies).values(movie).returning();
    return result[0];
  },
  async updateMovie(movieId: number, movie: Partial<schema.InsertMovie>) {
    const result = await db.update(schema.movies).set(movie).where({ id: movieId }).returning();
    return result[0];
  },
  async getPlatform(platformId: number) {
    const result = await db.select().from(schema.platforms).where({ id: platformId }).limit(1);
    return result[0];
  },
  async getPlatforms() {
    return await db.select().from(schema.platforms);
  },
  async addPlatform(platform: schema.InsertPlatform) {
    const result = await db.insert(schema.platforms).values(platform).returning();
    return result[0];
  },
  async updatePlatform(platformId: number, platform: Partial<schema.InsertPlatform>) {
    const result = await db.update(schema.platforms).set(platform).where({ id: platformId }).returning();
    return result[0];
  },
  async deletePlatform(platformId: number) {
    const result = await db.delete(schema.platforms).where({ id: platformId }).returning();
    return result[0];
  },
  async getSystemStats() {
    // TODO: Implement actual stats logic
    return { users: 0, movies: 0, watchlistEntries: 0, platforms: 0 };
  },
  async getFullSystemStats() {
    // TODO: Implement actual full stats logic
    return { detailedUsers: [], detailedMovies: [], detailedWatchlist: [], detailedPlatforms: [] };
  },
  async getSummaryStats() {
    // TODO: Implement actual summary stats logic
    return { totalUsers: 0, totalMovies: 0, totalWatchlistEntries: 0 };
  },
  async getUserActivity() {
    // TODO: Implement actual user activity logic
    return { recentLogins: [], recentWatchlistUpdates: [] };
  },
  async getSystemHealth() {
    // TODO: Implement actual system health logic
    return { status: 'ok', uptime: process.uptime(), memory: process.memoryUsage() };
  },
};