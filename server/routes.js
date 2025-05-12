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
exports.apiRouter = void 0;
var express_1 = require("express");
var storage_1 = require("./storage");
var schema_1 = require("@shared/schema");
var emergencyWatchlist_1 = require("./emergencyWatchlist");
var router = (0, express_1.Router)();
router.post('/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userData, newUser, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userData = schema_1.insertUserSchema.parse(req.body);
                return [4 /*yield*/, storage_1.storage.createUser({
                        username: userData.username,
                        password: userData.password,
                        displayName: userData.displayName,
                        role: userData.role || 'user',
                        createdAt: new Date(),
                    })];
            case 1:
                newUser = _a.sent();
                res.status(201).json({ id: newUser.id, username: newUser.username });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('[Register] Error:', error_1);
                res.status(400).json({ error: 'Invalid user data' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/watchlist/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, entries, watchlist, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = parseInt(req.params.userId, 10);
                if (isNaN(userId)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid user ID' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, storage_1.storage.getWatchlist(userId)];
            case 2:
                entries = _a.sent();
                watchlist = entries.map(function (entry) { return (__assign(__assign({}, entry), { movie: { id: entry.movieId } })); });
                res.status(200).json(watchlist);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error('[Watchlist] Error:', error_2);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.post('/movies', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var movieData, newMovie, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                movieData = schema_1.insertMovieSchema.parse(req.body);
                return [4 /*yield*/, storage_1.storage.addMovie(__assign(__assign({}, movieData), { title: movieData.title || '', tmdbId: movieData.tmdbId || 0, createdAt: new Date(), genre: movieData.genre || [], platforms: movieData.platforms || [], cast: movieData.cast || [] }))];
            case 1:
                newMovie = _a.sent();
                res.status(201).json(newMovie);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('[Movies] Error:', error_3);
                res.status(400).json({ error: 'Invalid movie data' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/emergency-watchlist/:userId', emergencyWatchlist_1.getEmergencyWatchlist);
exports.apiRouter = router;
