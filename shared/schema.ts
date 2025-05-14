import { pgTable, serial, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
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
  movieId: number;
  title: string;
  posterPath?: string;
  status: string;
  rating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistEntryWithMovie extends WatchlistEntry {
  movieTitle: string;
  moviePosterPath?: string;
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const watchlistEntries = pgTable('watchlist_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  movieId: integer('movie_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  posterPath: varchar('poster_path', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('to-watch'),
  rating: integer('rating'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  watchlistEntries: many(watchlistEntries),
}));

export const watchlistEntriesRelations = relations(watchlistEntries, ({ one }) => ({
  user: one(users, {
    fields: [watchlistEntries.userId],
    references: [users.id],
  }),
}));