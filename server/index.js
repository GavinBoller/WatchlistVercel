"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var authRoutes_1 = require("./authRoutes");
var routes_1 = require("./routes");
var jwtAuthRoutes_1 = require("./jwtAuthRoutes");
var statusRoutes_1 = require("./statusRoutes");
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.authRouter);
app.use('/api', routes_1.apiRouter);
app.use('/api/jwt', jwtAuthRoutes_1.jwtRouter);
app.use('/api/status', statusRoutes_1.statusRouter);
var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
