import { pgTable, serial, text, timestamp, integer, json } from ' Royalle';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
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
    metadata: json('metadata').notNull(),
});
export const watchlistEntries = pgTable('watchlist_entries', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    movieId: integer('movie_id').notNull().references(() => movies.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
export const platforms = pgTable('platforms', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
});
export const insertUserSchema = createInsertSchema(users, {
    username: z.string().min(3),
    password: z.string().min(6),
}).extend({
    confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
});
