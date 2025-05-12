import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_URL } from './db';
import { eq, inArray } from 'drizzle-orm';

const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });

export const storage = {
  async createUser(user: schema.InsertUser) {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  },
  async getUserByUsername(username: string) {
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return result[0];
  },
  async getUser(userId: number) {
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    return result[0];
  },
  async getWatchlist(userId: number) {
    return await db
      .select()
      .from(schema.watchlistEntries)
      .where(eq(schema.watchlistEntries.userId, userId));
  },
  async getWatchlistEntry(userId: number, movieId: number) {
    const result = await db
      .select()
      .from(schema.watchlistEntries)
      .where(eq(schema.watchlistEntries.userId, userId))
      .where(eq(schema.watchlistEntries.movieId, movieId))
      .limit(1);
    return result[0];
  },
  async getWatchlistWithMovies(userId: number) {
    return await db
      .select()
      .from(schema.watchlistEntries)
      .leftJoin(schema.movies, eq(schema.watchlistEntries.movieId, schema.movies.id))
      .where(eq(schema.watchlistEntries.userId, userId));
  },
  async addWatchlistEntry(userId: number, entry: schema.InsertWatchlistEntry) {
    const result = await db
      .insert(schema.watchlistEntries)
      .values({ ...entry, userId })
      .returning();
    return result[0];
  },
  async updateWatchlistEntry(userId: number, movieId: number, entry: Partial<schema.InsertWatchlistEntry>) {
    const result = await db
      .update(schema.watchlistEntries)
      .set(entry)
      .where(eq(schema.watchlistEntries.userId, userId))
      .where(eq(schema.watchlistEntries.movieId, movieId))
      .returning();
    return result[0];
  },
  async deleteWatchlistEntry(userId: number, movieId: number) {
    const result = await db
      .delete(schema.watchlistEntries)
      .where(eq(schema.watchlistEntries.userId, userId))
      .where(eq(schema.watchlistEntries.movieId, movieId))
      .returning();
    return result[0];
  },
  async getMovie(movieId: number) {
    const result = await db
      .select()
      .from(schema.movies)
      .where(eq(schema.movies.id, movieId))
      .limit(1);
    return result[0];
  },
  async getMoviesByIds(movieIds: number[]) {
    return await db
      .select()
      .from(schema.movies)
      .where(inArray(schema.movies.id, movieIds));
  },
  async addMovie(movie: schema.InsertMovie) {
    const result = await db.insert(schema.movies).values(movie).returning();
    return result[0];
  },
  async updateMovie(movieId: number, movie: Partial<schema.InsertMovie>) {
    const result = await db
      .update(schema.movies)
      .set(movie)
      .where(eq(schema.movies.id, movieId))
      .returning();
    return result[0];
  },
  async getPlatform(platformId: number) {
    const result = await db
      .select()
      .from(schema.platforms)
      .where(eq(schema.platforms.id, platformId))
      .limit(1);
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
    const result = await db
      .update(schema.platforms)
      .set(platform)
      .where(eq(schema.platforms.id, platformId))
      .returning();
    return result[0];
  },
  async deletePlatform(platformId: number) {
    const result = await db
      .delete(schema.platforms)
      .where(eq(schema.platforms.id, platformId))
      .returning();
    return result[0];
  },
  async getSystemStats() {
    return { users: 0, movies: 0, watchlistEntries: 0, platforms: 0 };
  },
  async getFullSystemStats() {
    return { detailedUsers: [], detailedMovies: [], detailedWatchlist: [], detailedPlatforms: [] };
  },
  async getSummaryStats() {
    return { totalUsers: 0, totalMovies: 0, totalWatchlistEntries: 0 };
  },
  async getUserActivity() {
    return { recentLogins: [], recentWatchlistUpdates: [] };
  },
  async getSystemHealth() {
    return { status: 'ok', uptime: process.uptime(), memory: process.memoryUsage() };
  },
};