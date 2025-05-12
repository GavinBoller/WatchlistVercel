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
exports.authRouter = void 0;
var express_1 = require("express");
var storage_1 = require("./storage");
var schema_1 = require("@shared/schema");
var bcryptjs_1 = require("bcryptjs");
var jwtAuth_1 = require("./jwtAuth");
var pg_1 = require("pg");
var db_1 = require("./db");
var pool = new pg_1.Pool({ connectionString: db_1.DATABASE_URL });
var router = (0, express_1.Router)();
router.post('/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userData, hashedPassword, username, existingUser, directSqlEnvironment, query, result, newUser_1, token_1, newUser, token, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
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
                newUser_1 = result.rows[0];
                token_1 = (0, jwtAuth_1.generateToken)(newUser_1);
                return [2 /*return*/, res.status(201).json({ user: newUser_1, token: token_1 })];
            case 4: return [4 /*yield*/, storage_1.storage.createUser({
                    username: userData.username,
                    password: hashedPassword,
                    displayName: userData.displayName,
                    role: userData.role || 'user',
                    createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
                })];
            case 5:
                newUser = _a.sent();
                token = (0, jwtAuth_1.generateToken)({
                    id: newUser.id,
                    username: newUser.username,
                    displayName: newUser.displayName,
                    role: newUser.role,
                    createdAt: newUser.createdAt,
                });
                res.status(201).json({
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        displayName: newUser.displayName,
                        role: newUser.role,
                        createdAt: newUser.createdAt,
                    },
                    token: token,
                });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _a.sent();
                console.error('[AuthRoutes] Register error:', error_1);
                res.status(400).json({ error: 'Invalid user data' });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
router.post('/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, user, _b, token, error_2;
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
                token = (0, jwtAuth_1.generateToken)({
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    role: user.role,
                    createdAt: user.createdAt,
                });
                res.status(200).json({
                    user: {
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        role: user.role,
                        createdAt: user.createdAt,
                    },
                    token: token,
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _c.sent();
                console.error('[AuthRoutes] Login error:', error_2);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.authRouter = router;
