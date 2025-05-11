import { z } from 'zod';
import { pgTable, serial, varchar, text, integer, timestamp, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const insertUserSchema = z.object({
  id: z.number().optional(),
  username: z.string().min(1),
  password: z.string().min(1),
  displayName: z.string().nullable().optional(),
  role: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertMovieSchema = z.object({
  tmdbId: z.number(),
  title: z.string(),
  overview: z.string().nullable(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  voteAverage: z.number(),
  runtime: z.number().nullable(),
  numberOfSeasons: z.number().nullable(),
  numberOfEpisodes: z.number().nullable(),
  mediaType: z.enum(['movie', 'tv']),
  createdAt: z.date().optional(),
});

export type User = {
  id: number;
  username: string;
  password: string;
  displayName: string | null;
  role: string;
  createdAt: Date;
};

export type UserResponse = {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: Date;
};

export type Movie = z.infer<typeof insertMovieSchema> & { id: number };

export type WatchlistEntry = {
  id: number;
  userId: number;
  movieId: number;
  platformId: number | null;
  status: string;
  watchedDate: string | null;
  notes: string | null;
  createdAt: Date;
};

export type Platform = {
  id: number;
  userId: number;
  name: string;
  logoUrl: string | null;
  isDefault: boolean;
};

export type WatchlistEntryWithMovie = WatchlistEntry & {
  movie: Movie;
  platform: Platform | null;
};

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
};

export type TMDBSearchResponse = {
  page: number;
  results: TMDBMovie[];
  total_results: number;
  total_pages: number;
};

// Drizzle schema tables
export const statusEnum = pgEnum('status', ['to_watch', 'watching', 'watched']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  displayName: varchar('display_name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const movies = pgTable('movies', {
  id: serial('id').primaryKey(),
  tmdbId: integer('tmdb_id').notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  overview: text('overview'),
  posterPath: varchar('poster_path', { length: 255 }),
  backdropPath: varchar('backdrop_path', { length: 255 }),
  releaseDate: varchar('release_date', { length: 10 }),
  voteAverage: numeric('vote_average', { precision: 3, scale: 1 }).notNull().default('0'),
  runtime: integer('runtime'),
  numberOfSeasons: integer('number_of_seasons'),
  numberOfEpisodes: integer('number_of_episodes'),
  mediaType: varchar('media_type', { length: 10 }).notNull().default('movie'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const watchlistEntries = pgTable('watchlist_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  movieId: integer('movie_id').notNull().references(() => movies.id),
  platformId: integer('platform_id').references(() => platforms.id),
  status: statusEnum('status').notNull().default('to_watch'),
  watchedDate: varchar('watched_date', { length: 10 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: varchar('logo_url', { length: 255 }),
  isDefault: boolean('is_default').notNull().default(false),
});