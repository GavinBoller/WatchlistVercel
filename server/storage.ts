import { eq, and, desc } from "drizzle-orm";
import { getDb, executeDirectSql } from "./db";
import * as schema from "@shared/schema";

const { users, movies, watchlistEntries, platforms } = schema;

async function getUserByUsername(username: string) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.username, username));
  return result.length > 0 ? result[0] : undefined;
}

async function getUser(userId: number) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result.length > 0 ? result[0] : undefined;
}

async function getAllUsers() {
  const db = await getDb();
  return await db.select().from(users);
}

async function createUser(userData: schema.User) {
  const db = await getDb();
  const result = await db.insert(users).values(userData).returning();
  return result.length > 0 ? result[0] : undefined;
}

async function getMovieByTmdbId(tmdbId: number) {
  const db = await getDb();
  const result = await db.select().from(movies).where(eq(movies.tmdbId, tmdbId));
  return result.length > 0 ? result[0] : undefined;
}

async function getMovie(movieId: number) {
  const db = await getDb();
  const result = await db.select().from(movies).where(eq(movies.id, movieId));
  return result.length > 0 ? result[0] : undefined;
}

async function createMovie(movieData: Partial<schema.Movie>) {
  const db = await getDb();
  const result = await db.insert(movies).values(movieData).returning();
  return result.length > 0 ? result[0] : undefined;
}

async function getWatchlistEntries(userId: number) {
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
}

async function getWatchlistEntry(entryId: number) {
  const db = await getDb();
  const result = await db
    .select()
    .from(watchlistEntries)
    .where(eq(watchlistEntries.id, entryId));
  return result.length > 0 ? result[0] : undefined;
}

async function createWatchlistEntry(entryData: Partial<schema.WatchlistEntry>) {
  const db = await getDb();
  const result = await db.insert(watchlistEntries).values(entryData).returning();
  return result.length > 0 ? result[0] : undefined;
}

async function updateWatchlistEntry(
  entryId: number,
  updates: Partial<schema.WatchlistEntry>
) {
  const db = await getDb();
  const result = await db
    .update(watchlistEntries)
    .set(updates)
    .where(eq(watchlistEntries.id, entryId))
    .returning();
  return result.length > 0 ? result[0] : undefined;
}

async function deleteWatchlistEntry(entryId: number) {
  const db = await getDb();
  const result = await db
    .delete(watchlistEntries)
    .where(eq(watchlistEntries.id, entryId))
    .returning();
  return result.length > 0;
}

async function hasWatchlistEntry(userId: number, movieId: number) {
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
}

async function getPlatforms(userId: number) {
  const db = await getDb();
  const result = await db.select().from(platforms).where(eq(platforms.userId, userId));
  return result;
}

async function getPlatform(platformId: number) {
  const db = await getDb();
  const result = await db
    .select()
    .from(platforms)
    .where(eq(platforms.id, platformId));
  return result.length > 0 ? result[0] : undefined;
}

async function createPlatform(platformData: Partial<schema.Platform>) {
  const db = await getDb();
  const result = await db.insert(platforms).values(platformData).returning();
  return result.length > 0 ? result[0] : undefined;
}

async function updatePlatform(
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
}

async function deletePlatform(platformId: number) {
  const db = await getDb();
  const result = await db
    .delete(platforms)
    .where(eq(platforms.id, platformId))
    .returning();
  return result.length > 0;
}

export const storage = {
  getUserByUsername,
  getUser,
  getAllUsers,
  createUser,
  getMovieByTmdbId,
  getMovie,
  createMovie,
  getWatchlistEntries,
  getWatchlistEntry,
  createWatchlistEntry,
  updateWatchlistEntry,
  deleteWatchlistEntry,
  hasWatchlistEntry,
  getPlatforms,
  getPlatform,
  createPlatform,
  updatePlatform,
  deletePlatform,
};