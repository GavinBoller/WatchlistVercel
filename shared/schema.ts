import { pgTable, serial, text, timestamp, integer, json } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const movies = pgTable('movies', {
  id: serial('id').primaryKey(),
  tmdbId: integer('tmdb_id').notNull().unique(),
  title: text('title').notNull(),
  overview: text('overview'),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
  releaseDate: text('release_date'),
  voteAverage: integer('vote_average').default(0),
  runtime: integer('runtime'),
  numberOfSeasons: integer('number_of_seasons'),
  numberOfEpisodes: integer('number_of_episodes'),
  mediaType: text('media_type').notNull().default('movie'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const watchlistEntries = pgTable('watchlist_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  movieId: integer('movie_id').notNull().references(() => movies.id),
  platformId: integer('platform_id').references(() => platforms.id),
  status: text('status').notNull().default('to_watch'),
  watchedDate: timestamp('watched_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  isDefault: integer('is_default').default(0),
});

export type User = typeof users.$inferSelect;
export type Movie = typeof movies.$inferSelect;
export type WatchlistEntry = typeof watchlistEntries.$inferSelect;
export type Platform = typeof platforms.$inferSelect;
export type InsertWatchlistEntry = typeof watchlistEntries.$inferInsert;

export type UserResponse = Omit<User, 'password'> & { displayName?: string };
export type WatchlistEntryWithMovie = WatchlistEntry & {
  movie: Movie;
  platform: Platform | null;
};

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3),
  password: z.string().min(6),
  displayName: z.string().optional(),
}).extend({
  confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

export const insertMovieSchema = createInsertSchema(movies, {
  tmdbId: z.number().int().positive(),
  title: z.string().min(1),
  mediaType: z.enum(['movie', 'tv']),
});

export type TMDBMovie = {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  media_type: 'movie' | 'tv';
  genre_ids?: number[];
};

export type TMDBSearchResponse = {
  page: number;
  results: TMDBMovie[];
  total_results: number;
  total_pages: number;
};