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
exports.statusRouter = void 0;
var express_1 = require("express");
var jwtMiddleware_1 = require("./jwtMiddleware");
var storage_1 = require("./storage");
var db_1 = require("./db");
var router = (0, express_1.Router)();
var adminIds = ['1', '2'];
var adminUsernames = ['admin', 'superuser'];
// Basic ping endpoint (public)
router.get('/ping', function (req, res) {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Admin stats endpoint
router.get('/stats', jwtMiddleware_1.isJwtAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, isAdmin, stats, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                user = req.user;
                isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);
                if (!isAdmin) {
                    console.log("[ADMIN] Access DENIED to stats for non-admin user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                    return [2 /*return*/, res.status(403).json({ error: 'Admin access required' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ADMIN] Stats accessed by user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                return [4 /*yield*/, storage_1.storage.getSystemStats()];
            case 2:
                stats = _a.sent();
                res.status(200).json(stats);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error('[ADMIN] Error fetching stats:', error_1);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Full stats endpoint (admin only)
router.get('/stats/full', jwtMiddleware_1.isJwtAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, isAdmin, fullStats, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                user = req.user;
                isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);
                if (!isAdmin) {
                    console.log("[ADMIN] Access DENIED to full stats for non-admin user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                    return [2 /*return*/, res.status(403).json({ error: 'Admin access required' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ADMIN] Full stats accessed by user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                return [4 /*yield*/, storage_1.storage.getFullSystemStats()];
            case 2:
                fullStats = _a.sent();
                res.status(200).json(fullStats);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error('[ADMIN] Error fetching full stats:', error_2);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Summary stats endpoint (admin only)
router.get('/stats/summary', jwtMiddleware_1.isJwtAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, isAdmin, summaryStats, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                user = req.user;
                isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);
                if (!isAdmin) {
                    console.log("[ADMIN] Access DENIED to summary stats for non-admin user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                    return [2 /*return*/, res.status(403).json({ error: 'Admin access required' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ADMIN] Summary stats accessed by user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                return [4 /*yield*/, storage_1.storage.getSummaryStats()];
            case 2:
                summaryStats = _a.sent();
                res.status(200).json(summaryStats);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('[ADMIN] Error fetching summary stats:', error_3);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// User activity endpoint (admin only)
router.get('/user-activity', jwtMiddleware_1.isJwtAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, isAdmin, activity, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                user = req.user;
                isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);
                if (!isAdmin) {
                    console.log("[ADMIN] Access DENIED to user-activity for non-admin user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                    return [2 /*return*/, res.status(403).json({ error: 'Admin access required' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ADMIN] Dashboard access by user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                return [4 /*yield*/, storage_1.storage.getUserActivity()];
            case 2:
                activity = _a.sent();
                res.status(200).json(activity);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                console.error('[ADMIN] Error fetching user activity:', error_4);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// System health endpoint (admin only)
router.get('/health', jwtMiddleware_1.isJwtAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, isAdmin, health, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                user = req.user;
                isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);
                if (!isAdmin) {
                    console.log("[ADMIN] Access DENIED to health for non-admin user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                    return [2 /*return*/, res.status(403).json({ error: 'Admin access required' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ADMIN] Health check accessed by user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                return [4 /*yield*/, storage_1.storage.getSystemHealth()];
            case 2:
                health = _a.sent();
                res.status(200).json(health);
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.error('[ADMIN] Error fetching system health:', error_5);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Database status endpoint (admin only)
router.get('/db-status', jwtMiddleware_1.isJwtAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, isAdmin, dbStatus, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                user = req.user;
                isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);
                if (!isAdmin) {
                    console.log("[ADMIN] Access DENIED to db-status for non-admin user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                    return [2 /*return*/, res.status(403).json({ error: 'Admin access required' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ADMIN] DB status accessed by user: ".concat(user.username, " (ID: ").concat(user.id, ")"));
                return [4 /*yield*/, (0, db_1.executeDirectSql)('SELECT 1 AS status')];
            case 2:
                dbStatus = _a.sent();
                res.status(200).json({ status: 'ok', db: dbStatus });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                console.error('[ADMIN] Error fetching DB status:', error_6);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.statusRouter = router;
