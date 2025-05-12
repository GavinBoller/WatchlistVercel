"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.db = void 0;
var schema = require("@shared/schema");
var node_postgres_1 = require("drizzle-orm/node-postgres");
var pg_1 = require("pg");
var db_1 = require("./db");
var drizzle_orm_1 = require("drizzle-orm");
var pool = new pg_1.Pool({ connectionString: db_1.DATABASE_URL });
exports.db = (0, node_postgres_1.drizzle)(pool, { schema: schema });
exports.storage = {
    createUser: function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.insert(schema.users).values(user).returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getUserByUsername: function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .select()
                            .from(schema.users)
                            .where((0, drizzle_orm_1.eq)(schema.users.username, username))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getUser: function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .select()
                            .from(schema.users)
                            .where((0, drizzle_orm_1.eq)(schema.users.id, userId))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getWatchlist: function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .select()
                            .from(schema.watchlistEntries)
                            .where((0, drizzle_orm_1.eq)(schema.watchlistEntries.userId, userId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    getWatchlistEntry: function (userId, movieId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .select()
                            .from(schema.watchlistEntries)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.watchlistEntries.userId, userId), (0, drizzle_orm_1.eq)(schema.watchlistEntries.movieId, movieId)))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getWatchlistWithMovies: function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .select()
                            .from(schema.watchlistEntries)
                            .leftJoin(schema.movies, (0, drizzle_orm_1.eq)(schema.watchlistEntries.movieId, schema.movies.id))
                            .where((0, drizzle_orm_1.eq)(schema.watchlistEntries.userId, userId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addWatchlistEntry: function (userId, entry) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .insert(schema.watchlistEntries)
                            .values(__assign(__assign({}, entry), { userId: userId }))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    updateWatchlistEntry: function (userId, movieId, entry) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .update(schema.watchlistEntries)
                            .set(entry)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.watchlistEntries.userId, userId), (0, drizzle_orm_1.eq)(schema.watchlistEntries.movieId, movieId)))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    deleteWatchlistEntry: function (userId, movieId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .delete(schema.watchlistEntries)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.watchlistEntries.userId, userId), (0, drizzle_orm_1.eq)(schema.watchlistEntries.movieId, movieId)))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getMovie: function (movieId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .select()
                            .from(schema.movies)
                            .where((0, drizzle_orm_1.eq)(schema.movies.id, movieId))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getMoviesByIds: function (movieIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .select()
                            .from(schema.movies)
                            .where((0, drizzle_orm_1.inArray)(schema.movies.id, movieIds))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addMovie: function (movie) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.insert(schema.movies).values(movie).returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    updateMovie: function (movieId, movie) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .update(schema.movies)
                            .set(movie)
                            .where((0, drizzle_orm_1.eq)(schema.movies.id, movieId))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getPlatform: function (platformId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .select()
                            .from(schema.platforms)
                            .where((0, drizzle_orm_1.eq)(schema.platforms.id, platformId))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getPlatforms: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.select().from(schema.platforms)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addPlatform: function (platform) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.insert(schema.platforms).values(platform).returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    updatePlatform: function (platformId, platform) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .update(schema.platforms)
                            .set(platform)
                            .where((0, drizzle_orm_1.eq)(schema.platforms.id, platformId))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    deletePlatform: function (platformId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db
                            .delete(schema.platforms)
                            .where((0, drizzle_orm_1.eq)(schema.platforms.id, platformId))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    },
    getSystemStats: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { users: 0, movies: 0, watchlistEntries: 0, platforms: 0 }];
            });
        });
    },
    getFullSystemStats: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { detailedUsers: [], detailedMovies: [], detailedWatchlist: [], detailedPlatforms: [] }];
            });
        });
    },
    getSummaryStats: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { totalUsers: 0, totalMovies: 0, totalWatchlistEntries: 0 }];
            });
        });
    },
    getUserActivity: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { recentLogins: [], recentWatchlistUpdates: [] }];
            });
        });
    },
    getSystemHealth: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { status: 'ok', uptime: process.uptime(), memory: process.memoryUsage() }];
            });
        });
    },
};
