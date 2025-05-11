"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platforms = exports.watchlistEntries = exports.movies = exports.users = exports.statusEnum = exports.insertMovieSchema = exports.insertUserSchema = void 0;
const zod_1 = require("zod");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.insertUserSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
    displayName: zod_1.z.string().nullable().optional(),
    role: zod_1.z.string().optional(),
    createdAt: zod_1.z.date().optional(),
});
exports.insertMovieSchema = zod_1.z.object({
    tmdbId: zod_1.z.number(),
    title: zod_1.z.string(),
    overview: zod_1.z.string().nullable(),
    posterPath: zod_1.z.string().nullable(),
    backdropPath: zod_1.z.string().nullable(),
    releaseDate: zod_1.z.string().nullable(),
    voteAverage: zod_1.z.number(),
    runtime: zod_1.z.number().nullable(),
    numberOfSeasons: zod_1.z.number().nullable(),
    numberOfEpisodes: zod_1.z.number().nullable(),
    mediaType: zod_1.z.enum(['movie', 'tv']),
    createdAt: zod_1.z.date().optional(),
});
// Drizzle schema tables
exports.statusEnum = (0, pg_core_1.pgEnum)('status', ['to_watch', 'watching', 'watched']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    username: (0, pg_core_1.varchar)('username', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.text)('password').notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).notNull().default('user'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.movies = (0, pg_core_1.pgTable)('movies', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    tmdbId: (0, pg_core_1.integer)('tmdb_id').notNull().unique(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    overview: (0, pg_core_1.text)('overview'),
    posterPath: (0, pg_core_1.varchar)('poster_path', { length: 255 }),
    backdropPath: (0, pg_core_1.varchar)('backdrop_path', { length: 255 }),
    releaseDate: (0, pg_core_1.varchar)('release_date', { length: 10 }),
    voteAverage: (0, pg_core_1.numeric)('vote_average', { precision: 3, scale: 1 }).notNull().default('0'),
    runtime: (0, pg_core_1.integer)('runtime'),
    numberOfSeasons: (0, pg_core_1.integer)('number_of_seasons'),
    numberOfEpisodes: (0, pg_core_1.integer)('number_of_episodes'),
    mediaType: (0, pg_core_1.varchar)('media_type', { length: 10 }).notNull().default('movie'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.watchlistEntries = (0, pg_core_1.pgTable)('watchlist_entries', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    movieId: (0, pg_core_1.integer)('movie_id').notNull().references(() => exports.movies.id),
    platformId: (0, pg_core_1.integer)('platform_id').references(() => exports.platforms.id),
    status: (0, exports.statusEnum)('status').notNull().default('to_watch'),
    watchedDate: (0, pg_core_1.varchar)('watched_date', { length: 10 }),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.platforms = (0, pg_core_1.pgTable)('platforms', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    logoUrl: (0, pg_core_1.varchar)('logo_url', { length: 255 }),
    isDefault: (0, pg_core_1.boolean)('is_default').notNull().default(false),
});
