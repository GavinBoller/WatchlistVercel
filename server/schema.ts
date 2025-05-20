import { pgTable, serial, varchar, integer, text, timestamp, boolean, date, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: Date;
  password?: string;
}

export interface WatchlistEntry {
  id: number;
  userId: number;
  tmdbId: number;
  platformId: number | null;
  watchedDate: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
}

export interface WatchlistEntryWithMovie extends WatchlistEntry {
  movie: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    mediaType: string;
    overview: string | null;
    releaseDate: string | null;
    voteAverage: number | null;
    backdropPath: string | null;
    genres: string | null;
  };
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  password: text('password').notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const movies = pgTable('movies', {
  tmdbId: integer('tmdb_id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  posterPath: text('poster_path'),
  mediaType: varchar('media_type', { length: 50 }).notNull(),
  overview: text('overview'),
  releaseDate: date('release_date'),
  voteAverage: doublePrecision('vote_average'),
  backdropPath: text('backdrop_path'),
  genres: text('genres'),
});

export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tmdbId: integer('tmdb_id').notNull().references(() => movies.tmdbId, { onDelete: 'cascade' }),
  platformId: integer('platform_id').references(() => platforms.id, { onDelete: 'set null' }),
  watchedDate: date('watched_date'),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).notNull().default('watched'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  watchlist: many(watchlist),
  platforms: many(platforms),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  watchlist: many(watchlist),
}));

export const platformsRelations = relations(platforms, ({ one, many }) => ({
  user: one(users, {
    fields: [platforms.userId],
    references: [users.id],
  }),
  watchlist: many(watchlist),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [watchlist.tmdbId],
    references: [movies.tmdbId],
  }),
  platform: one(platforms, {
    fields: [watchlist.platformId],
    references: [platforms.id],
  }),
}));
