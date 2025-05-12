"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_EXPIRATION = exports.JWT_SECRET = void 0;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.createUserResponse = createUserResponse;
exports.extractTokenFromHeader = extractTokenFromHeader;
var jsonwebtoken_1 = require("jsonwebtoken");
exports.JWT_SECRET = process.env.JWT_SECRET || 'movie-watchlist-secure-jwt-secret-key';
exports.TOKEN_EXPIRATION = '7d';
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
    }, exports.JWT_SECRET, { expiresIn: exports.TOKEN_EXPIRATION });
}
function verifyToken(token) {
    try {
        var decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error('[JWT] Token verification error:', error);
        return null;
    }
}
function createUserResponse(user) {
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
    };
}
function extractTokenFromHeader(req) {
    var authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}
