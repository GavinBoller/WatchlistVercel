"use strict";
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
exports.jwtRouter = void 0;
var express_1 = require("express");
var bcryptjs_1 = require("bcryptjs");
var storage_1 = require("./storage");
var schema_1 = require("@shared/schema");
var pg_1 = require("pg");
var db_1 = require("./db");
var jwtAuth_1 = require("./jwtAuth");
var node_fetch_1 = require("node-fetch");
var pool = new pg_1.Pool({ connectionString: db_1.DATABASE_URL });
var TMDB_API_KEY = process.env.TMDB_API_KEY || '';
var router = (0, express_1.Router)();
// Register
router.post('/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userData, hashedPassword, username, existingUser, directSqlEnvironment, newUser, query, result, user, token, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                userData = schema_1.insertUserSchema.parse(req.body);
                return [4 /*yield*/, bcryptjs_1.default.hash(userData.password, 10)];
            case 1:
                hashedPassword = _a.sent();
                username = userData.username;
                return [4 /*yield*/, storage_1.storage.getUserByUsername(username)];
            case 2:
                existingUser = _a.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(400).json({ error: 'Username already exists' })];
                }
                directSqlEnvironment = process.env.DIRECT_SQL === 'true';
                newUser = void 0;
                if (!directSqlEnvironment) return [3 /*break*/, 4];
                query = "\n        INSERT INTO users (username, password, displayName, createdAt)\n        VALUES ($1, $2, $3, $4)\n        RETURNING id, username, displayName, role, createdAt\n      ";
                return [4 /*yield*/, pool.query(query, [
                        username,
                        hashedPassword,
                        userData.displayName,
                        new Date(),
                    ])];
            case 3:
                result = _a.sent();
                newUser = result.rows[0];
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, storage_1.storage.createUser({
                    username: userData.username,
                    password: hashedPassword,
                    displayName: userData.displayName,
                    role: userData.role || 'user',
                    createdAt: new Date(),
                })];
            case 5:
                user = _a.sent();
                newUser = (0, jwtAuth_1.createUserResponse)(user);
                _a.label = 6;
            case 6:
                token = (0, jwtAuth_1.generateToken)(newUser);
                res.status(201).json({ user: newUser, token: token });
                return [3 /*break*/, 8];
            case 7:
                error_1 = _a.sent();
                console.error('[JwtAuthRoutes] Register error:', error_1);
                res.status(400).json({ error: 'Invalid user data' });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
// Login
router.post('/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, user, _b, userResponse, token, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                _a = req.body, username = _a.username, password = _a.password;
                return [4 /*yield*/, storage_1.storage.getUserByUsername(username)];
            case 1:
                user = _c.sent();
                _b = !user;
                if (_b) return [3 /*break*/, 3];
                return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
            case 2:
                _b = !(_c.sent());
                _c.label = 3;
            case 3:
                if (_b) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid credentials' })];
                }
                userResponse = (0, jwtAuth_1.createUserResponse)(user);
                token = (0, jwtAuth_1.generateToken)(userResponse);
                res.status(200).json({ user: userResponse, token: token });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _c.sent();
                console.error('[JwtAuthRoutes] Login error:', error_2);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Get User Info
router.get('/me', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, dbUser, userResponse, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                token = (0, jwtAuth_1.extractTokenFromHeader)(req);
                if (!token) {
                    return [2 /*return*/, res.status(401).json({ error: 'No token provided' })];
                }
                user = (0, jwtAuth_1.verifyToken)(token);
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid token' })];
                }
                return [4 /*yield*/, storage_1.storage.getUser(user.id)];
            case 1:
                dbUser = _a.sent();
                if (!dbUser) {
                    return [2 /*return*/, res.status(404).json({ error: 'User not found' })];
                }
                userResponse = (0, jwtAuth_1.createUserResponse)(dbUser);
                res.status(200).json(userResponse);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('[JwtAuthRoutes] Me error:', error_3);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Refresh Token
router.post('/refresh', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, dbUser, newToken, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                token = (0, jwtAuth_1.extractTokenFromHeader)(req);
                if (!token) {
                    return [2 /*return*/, res.status(401).json({ error: 'No token provided' })];
                }
                user = (0, jwtAuth_1.verifyToken)(token);
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid token' })];
                }
                return [4 /*yield*/, storage_1.storage.getUser(user.id)];
            case 1:
                dbUser = _a.sent();
                if (!dbUser) {
                    return [2 /*return*/, res.status(404).json({ error: 'User not found' })];
                }
                newToken = (0, jwtAuth_1.generateToken)((0, jwtAuth_1.createUserResponse)(dbUser));
                res.status(200).json({ token: newToken });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('[JwtAuthRoutes] Refresh error:', error_4);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// TMDB Search Movies
router.get('/tmdb/search', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, query, response, data, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                token = (0, jwtAuth_1.extractTokenFromHeader)(req);
                if (!token || !(0, jwtAuth_1.verifyToken)(token)) {
                    return [2 /*return*/, res.status(401).json({ error: 'Unauthorized' })];
                }
                query = req.query.query;
                if (!query || typeof query !== 'string') {
                    return [2 /*return*/, res.status(400).json({ error: 'Search query required' })];
                }
                return [4 /*yield*/, (0, node_fetch_1.default)("https://api.themoviedb.org/3/search/movie?api_key=".concat(TMDB_API_KEY, "&query=").concat(encodeURIComponent(query)))];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                res.status(200).json(data.results || []);
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.error('[JwtAuthRoutes] TMDB search error:', error_5);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// TMDB Movie Details
router.get('/tmdb/movie/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, id, response, data, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                token = (0, jwtAuth_1.extractTokenFromHeader)(req);
                if (!token || !(0, jwtAuth_1.verifyToken)(token)) {
                    return [2 /*return*/, res.status(401).json({ error: 'Unauthorized' })];
                }
                id = req.params.id;
                return [4 /*yield*/, (0, node_fetch_1.default)("https://api.themoviedb.org/3/movie/".concat(id, "?api_key=").concat(TMDB_API_KEY))];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                if (data.success === false) {
                    return [2 /*return*/, res.status(404).json({ error: 'Movie not found' })];
                }
                res.status(200).json(data);
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                console.error('[JwtAuthRoutes] TMDB movie error:', error_6);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Add to Watchlist
router.post('/watchlist/add', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, entryData, existingEntry, newEntry, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                token = (0, jwtAuth_1.extractTokenFromHeader)(req);
                user = token ? (0, jwtAuth_1.verifyToken)(token) : null;
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: 'Unauthorized' })];
                }
                entryData = schema_1.insertWatchlistEntrySchema.parse(req.body);
                return [4 /*yield*/, storage_1.storage.getWatchlistEntry(user.id, entryData.movieId)];
            case 1:
                existingEntry = _a.sent();
                if (existingEntry) {
                    return [2 /*return*/, res.status(400).json({ error: 'Movie already in watchlist' })];
                }
                return [4 /*yield*/, storage_1.storage.addWatchlistEntry(user.id, {
                        movieId: entryData.movieId,
                        addedAt: new Date(),
                    })];
            case 2:
                newEntry = _a.sent();
                res.status(201).json(newEntry);
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                console.error('[JwtAuthRoutes] Watchlist add error:', error_7);
                res.status(400).json({ error: 'Invalid watchlist data' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Remove from Watchlist
router.delete('/watchlist/remove/:movieId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, movieId, deletedEntry, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                token = (0, jwtAuth_1.extractTokenFromHeader)(req);
                user = token ? (0, jwtAuth_1.verifyToken)(token) : null;
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: 'Unauthorized' })];
                }
                movieId = parseInt(req.params.movieId, 10);
                if (isNaN(movieId)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid movie ID' })];
                }
                return [4 /*yield*/, storage_1.storage.deleteWatchlistEntry(user.id, movieId)];
            case 1:
                deletedEntry = _a.sent();
                if (!deletedEntry) {
                    return [2 /*return*/, res.status(404).json({ error: 'Watchlist entry not found' })];
                }
                res.status(200).json({ message: 'Movie removed from watchlist' });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                console.error('[JwtAuthRoutes] Watchlist remove error:', error_8);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get Watchlist
router.get('/watchlist', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, entries, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                token = (0, jwtAuth_1.extractTokenFromHeader)(req);
                user = token ? (0, jwtAuth_1.verifyToken)(token) : null;
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: 'Unauthorized' })];
                }
                return [4 /*yield*/, storage_1.storage.getWatchlist(user.id)];
            case 1:
                entries = _a.sent();
                res.status(200).json(entries);
                return [3 /*break*/, 3];
            case 2:
                error_9 = _a.sent();
                console.error('[JwtAuthRoutes] Watchlist get error:', error_9);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.jwtRouter = router;
