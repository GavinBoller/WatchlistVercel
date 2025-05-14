import { pgTable, serial, text, integer, timestamp, boolean, json } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  displayName: text('displayName').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const watchlistEntries = pgTable('watchlist_entries', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id),
  movieId: integer('movieId').notNull().references(() => movies.id),
  status: text('status').notNull(),
  rating: integer('rating'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const movies = pgTable('movies', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  releaseDate: timestamp('releaseDate'),
  genre: text('genre').array(),
  rating: text('rating'),
  poster: text('poster'),
  tmdbId: integer('tmdbId').notNull().unique(),
  runtime: integer('runtime'),
  platforms: text('platforms').array(),
  cast: text('cast').array(),
  director: text('director'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  userId: integer('userId').references(() => users.id),
  name: text('name').notNull(),
  logoUrl: text('logoUrl'),
  isDefault: boolean('isDefault').default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export interface WatchlistEntry {
  id: number;
  userId: number;
  movieId: number;
  status: string;
  rating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type User = typeof users.$inferSelect;
export type WatchlistEntryType = typeof watchlistEntries.$inferSelect;
export type Movie = typeof movies.$inferSelect;
export type Platform = typeof platforms.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type InsertWatchlistEntry = typeof watchlistEntries.$inferInsert;
export type InsertMovie = typeof movies.$inferInsert;
export type InsertPlatform = typeof platforms.$inferInsert;

export interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: Date;
  password?: string; // Optional for cases where password is needed
}

export type WatchlistEntryWithMovie = WatchlistEntry & {
  movie: Movie;
};

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

export const insertMovieSchema = createInsertSchema(movies, {
  title: z.string().min(1),
  tmdbId: z.number().int().positive(),
});

export const insertWatchlistEntrySchema = createInsertSchema(watchlistEntries, {
  userId: z.number().int().positive(),
  movieId: z.number().int().positive(),
  status: z.string().min(1),
  rating: z.number().int().min(0).max(10).optional(),
  notes: z.string().optional(),
});