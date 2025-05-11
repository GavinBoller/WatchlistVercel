import { eq, and, desc } from "drizzle-orm";
import { getDb, executeDirectSql } from "./db";
import * as schema from "@shared/schema";

const { users, movies, watchlistEntries, platforms } = schema;

export const storage = {
  async getUserByUsername(username: string) {
    const db = await getDb();
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  },

  async getUser(userId: number) {
    const db = await getDb();
    const result = await db.select().from(users).where(eq(users.id, userId));
    return result.length > 0 ? result[0] : undefined;
  },

  async getAllUsers() {
    const db = await getDb();
    return await db.select().from(users);
  },

  async createUser(userData: Omit<schema.User, 'id'>) {
    const db = await getDb();
    const result = await db.insert(users).values({
      username: userData.username,
      password: userData.password,
      role: userData.role || 'user',
      displayName: userData.displayName,
      createdAt: userData.createdAt || new Date(),
    }).returning();
    return result.length > 0 ? result[0] : undefined;
  },

  async getMovieByTmdbId(tmdbId: number) {
    const db = await getDb();
    const result = await db.select().from(movies).where(eq(movies.tmdbId, tmdbId));
    return result.length > 0 ? result[0] : undefined;
  },

  async getMovie(movieId: number) {
    const db = await getDb();
    const result = await db.select().from(movies).where(eq(movies.id, movieId));
    return result.length > 0 ? result[0] : undefined;
  },

  async createMovie(movieData: Omit<schema.Movie, 'id' | 'createdAt'>) {
    const db = await getDb();
    const result = await db.insert(movies).values({
      tmdbId: movieData.tmdbId,
      title: movieData.title,
      overview: movieData.overview || null,
      posterPath: movieData.posterPath || null,
      backdropPath: movieData.backdropPath || null,
      releaseDate: movieData.releaseDate || null,
      voteAverage: String(movieData.voteAverage || 0),
      runtime: movieData.runtime || null,
      numberOfSeasons: movieData.numberOfSeasons || null,
      numberOfEpisodes: movieData.numberOfEpisodes || null,
      mediaType: movieData.mediaType || 'movie',
      createdAt: new Date(),
    }).returning();
    return result.length > 0 ? result[0] : undefined;
  },

  async getWatchlistEntries(userId: number) {
    const db = await getDb();
    const result = await db
      .select({
        id: watchlistEntries.id,
        userId: watchlistEntries.userId,
        movieId: watchlistEntries.movieId,
        platformId: watchlistEntries.platformId,
        status: watchlistEntries.status,
        watchedDate: watchlistEntries.watchedDate,
        notes: watchlistEntries.notes,
        createdAt: watchlistEntries.createdAt,
        movie: movies,
        platform: platforms,
      })
      .from(watchlistEntries)
      .innerJoin(movies, eq(watchlistEntries.movieId, movies.id))
      .leftJoin(platforms, eq(watchlistEntries.platformId, platforms.id))
      .where(eq(watchlistEntries.userId, userId))
      .orderBy(desc(watchlistEntries.createdAt));
    return result;
  },

  async getWatchlistEntry(entryId: number) {
    const db = await getDb();
    const result = await db
      .select()
      .from(watchlistEntries)
      .where(eq(watchlistEntries.id, entryId));
    return result.length > 0 ? result[0] : undefined;
  },

  async createWatchlistEntry(entryData: Omit<schema.WatchlistEntry, 'id' | 'createdAt'>) {
    const db = await getDb();
    const status = entryData.status || 'to_watch';
    if (!['to_watch', 'watching', 'watched'].includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    const result = await db.insert(watchlistEntries).values({
      userId: entryData.userId,
      movieId: entryData.movieId,
      platformId: entryData.platformId || null,
      status: status as 'to_watch' | 'watching' | 'watched',
      watchedDate: entryData.watchedDate || null,
      notes: entryData.notes || null,
      createdAt: new Date(),
    }).returning();
    return result.length > 0 ? result[0] : undefined;
  },

  async updateWatchlistEntry(
    entryId: number,
    updates: Partial<Omit<schema.WatchlistEntry, 'id' | 'createdAt'>>
  ) {
    const db = await getDb();
    if (updates.status && !['to_watch', 'watching', 'watched'].includes(updates.status)) {
      throw new Error(`Invalid status: ${updates.status}`);
    }
    const result = await db
      .update(watchlistEntries)
      .set({
        ...updates,
        status: updates.status ? (updates.status as 'to_watch' | 'watching' | 'watched') : undefined,
      })
      .where(eq(watchlistEntries.id, entryId))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  },

  async deleteWatchlistEntry(entryId: number) {
    const db = await getDb();
    const result = await db
      .delete(watchlistEntries)
      .where(eq(watchlistEntries.id, entryId))
      .returning();
    return result.length > 0;
  },

  async hasWatchlistEntry(userId: number, movieId: number) {
    const db = await getDb();
    const result = await db
      .select()
      .from(watchlistEntries)
      .where(
        and(
          eq(watchlistEntries.userId, userId),
          eq(watchlistEntries.movieId, movieId)
        )
      );
    return result.length > 0;
  },

  async getPlatforms(userId: number) {
    const db = await getDb();
    const result = await db.select().from(platforms).where(eq(platforms.userId, userId));
    return result;
  },

  async getPlatform(platformId: number) {
    const db = await getDb();
    const result = await db
      .select()
      .from(platforms)
      .where(eq(platforms.id, platformId));
    return result.length > 0 ? result[0] : undefined;
  },

  async createPlatform(platformData: Omit<schema.Platform, 'id'>) {
    const db = await getDb();
    const result = await db.insert(platforms).values({
      userId: platformData.userId,
      name: platformData.name,
      logoUrl: platformData.logoUrl || null,
      isDefault: platformData.isDefault || false,
    }).returning();
    return result.length > 0 ? result[0] : undefined;
  },

  async updatePlatform(
    platformId: number,
    updates: Partial<schema.Platform>
  ) {
    const db = await getDb();
    const result = await db
      .update(platforms)
      .set(updates)
      .where(eq(platforms.id, platformId))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  },

  async deletePlatform(platformId: number) {
    const db = await getDb();
    const result = await db
      .delete(platforms)
      .where(eq(platforms.id, platformId))
      .returning();
    return result.length > 0;
  },
};