"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtMiddleware = jwtMiddleware;
exports.isJwtAuthenticated = isJwtAuthenticated;
var jwtAuth_1 = require("./jwtAuth");
function jwtMiddleware(req, res, next) {
    var token = (0, jwtAuth_1.extractTokenFromHeader)(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    var user = (0, jwtAuth_1.verifyToken)(token);
    if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
}
function isJwtAuthenticated(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
}
