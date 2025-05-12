"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleJwtRouter = void 0;
var express_1 = require("express");
var jwtAuth_1 = require("./jwtAuth");
// Create router
var router = (0, express_1.Router)();
// Helper functions
function extractTokenFromHeader(req) {
    var authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}
// Routes - using the same JWT_SECRET as the main implementation for consistency
router.get('/simple-jwt/user', function (req, res) {
    try {
        var token = extractTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        var payload = (0, jwtAuth_1.verifyToken)(token);
        if (!payload) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.json(payload);
    }
    catch (error) {
        console.error('[SIMPLE-JWT] Error in /user endpoint:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Emergency token functionality has been removed for simplification
exports.simpleJwtRouter = router;
