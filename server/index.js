"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_session_1 = require("express-session");
var connect_pg_simple_1 = require("connect-pg-simple");
var pg_1 = require("pg");
var node_postgres_1 = require("drizzle-orm/node-postgres");
var routes_1 = require("./routes");
var cors_1 = require("cors");
var app = (0, express_1.default)();
var PGSession = (0, connect_pg_simple_1.default)(express_session_1.default);
var pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
var db = (0, node_postgres_1.drizzle)(pool);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    store: new PGSession({
        pool: pool,
        tableName: 'sessions',
    }),
    secret: process.env.SESSION_SECRET || 'your-session-secret-456',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));
app.use('/api', routes_1.default);
exports.default = app;
