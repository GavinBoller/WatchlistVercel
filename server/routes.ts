import type { Request, Response } from "express";
import { Router } from "express";
import { storage } from "./storage";
import { isAuthenticated, validateSession } from "./auth";
import { isJwtAuthenticated, hasJwtWatchlistAccess } from "./jwtMiddleware";
import jwt from "jsonwebtoken";
import axios from "axios";
import { z } from "zod";
import {
  insertUserSchema,
  insertMovieSchema,
  type TMDBSearchResponse,
  type TMDBMovie,
  type User,
  type WatchlistEntryWithMovie,
} from "@shared/schema";
import { jwtAuthRouter } from "./jwtAuthRoutes";
import { simpleRegisterRouter } from "./simpleRegister";
import { executeDirectSql } from "./db";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "79d177894334dec45f251ff671833a50";
const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

const movieGenreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const tvGenreMap: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

async function convertGenreIdsToNames(
  genreIds: number[] = [],
  mediaType: string = "movie"
): Promise<string[]> {
  const genreMap = mediaType === "tv" ? tvGenreMap : movieGenreMap;
  return genreIds.map((id) => genreMap[id] || "").filter(Boolean);
}

const router = Router();

// Apply validateSession middleware
router.use(validateSession);

// Simplified registration router
console.log("[SERVER] Registering simplified registration endpoint");
router.use(simpleRegisterRouter);

// Status endpoints
router.get("/status/ping", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

router.get("/status/admin-check", async (_req, res) => {
  try {
    const admins = await executeDirectSql<{
      id: number;
      username: string;
      display_name: string | null;
    }>("SELECT id, username, display_name FROM users WHERE id = 1 ORDER BY id");

    if (admins.rows.length > 0) {
      res.json({
        status: "ok",
        adminUsers: admins.rows.map((user) => ({
          id: user.id,
          username: user.username,
          displayName: user.display_name || user.username,
        })),
      });
    } else {
      console.log("No admin users found in database");
      res.json({
        status: "ok",
        adminUsers: [
          {
            id: 1,
            username: "admin",
            displayName: "Default Admin",
          },
        ],
        note: "No admin users found in database, showing default admin user",
      });
    }
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({
      status: "error",
      message: "Could not determine admin users",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Session diagnostics endpoint
router.get("/diagnostics", (req, res) => {
  const sessionId = req.sessionID || "unknown";
  const isAuthenticatedStatus = req.isAuthenticated();
  const user = req.user
    ? {
        id: (req.user as User).id,
        username: (req.user as User).username,
      }
    : null;

  const sessionData = req.session
    ? {
        id: req.sessionID,
        cookie: req.session.cookie
          ? {
              expires: req.session.cookie.expires,
              maxAge: req.session.cookie.maxAge,
              secure: req.session.cookie.secure,
              httpOnly: req.session.cookie.httpOnly,
              sameSite: req.session.cookie.sameSite,
            }
          : "No cookie data",
        authenticated: req.session.authenticated,
        createdAt: req.session.createdAt,
        lastChecked: req.session.lastChecked,
        repaired: req.session.repaired,
      }
    : "No session data";

  const requestInfo = {
    ip: req.ip,
    ips: req.ips,
    secure: req.secure,
    protocol: req.protocol,
    hostname: req.hostname,
    path: req.path,
    headers: {
      userAgent: req.headers["user-agent"],
      cookie: req.headers.cookie,
      referer: req.headers.referer,
      accept: req.headers.accept,
    },
  };

  const environment = {
    nodeEnv: process.env.NODE_ENV || "development",
    sessionSecret: process.env.SESSION_SECRET
      ? `Length: ${process.env.SESSION_SECRET.length}`
      : "Not set",
    databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
  };

  res.json({
    success: true,
    sessionId,
    isAuthenticated: isAuthenticatedStatus,
    user,
    session: sessionData,
    request: requestInfo,
    environment,
  });
});

// Refresh session endpoint
router.get("/refresh-session", async (req, res) => {
  const userId = req.query.userId
    ? parseInt(req.query.userId as string, 10)
    : null;
  const username = (req.query.username as string) || null;
  const sessionId = req.sessionID || "unknown";

  console.log(
    `[SESSION-REFRESH] Refresh request received, session: ${sessionId}, userId: ${
      userId || "none"
    }, username: ${username || "none"}`
  );

  if (req.isAuthenticated() && req.user) {
    console.log(
      `[SESSION-REFRESH] User already authenticated as ${
        (req.user as User).username
      }`
    );
    req.session.authenticated = true;
    req.session.lastChecked = Date.now();

    return res.json({
      authenticated: true,
      user: req.user,
      sessionId: req.sessionID,
      refreshed: true,
    });
  }

  if (userId || username) {
    try {
      let user;
      if (userId) {
        user = await storage.getUser(userId);
      } else if (username) {
        user = await storage.getUserByUsername(username);
      }

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          authenticated: false,
        });
      }

      console.log(
        `[SESSION-REFRESH] Found user ${user.username} (ID: ${user.id}), attempting login`
      );

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error(`[SESSION-REFRESH] Login failed:`, loginErr);
          return res.status(500).json({
            message: "Login failed",
            error: loginErr.message,
            authenticated: false,
          });
        }

        req.session.authenticated = true;
        req.session.createdAt = Date.now();
        req.session.lastChecked = Date.now();

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error(`[SESSION-REFRESH] Session save failed:`, saveErr);
          } else {
            console.log(
              `[SESSION-REFRESH] Session refreshed successfully for ${user.username}`
            );
          }

          return res.json({
            authenticated: true,
            user: user,
            sessionId: req.sessionID,
            refreshed: true,
          });
        });
      });
    } catch (error) {
      console.error(`[SESSION-REFRESH] Error refreshing session:`, error);
      return res.status(500).json({
        message: "Session refresh failed",
        error: error instanceof Error ? error.message : "Unknown error",
        authenticated: false,
      });
    }
  } else {
    return res.json({
      authenticated: false,
      user: null,
      sessionId: req.sessionID,
    });
  }
});

// User routes
router.get("/users", async (_req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);

    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const newUser = await storage.createUser({
      ...userData,
      role: userData.role || 'user',
      createdAt: userData.createdAt || new Date(),
    });
    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid user data", errors: error.errors });
    } else {
      res.status(500).json({ message: "Failed to create user" });
    }
  }
});

// Movie external IDs
router.get("/movies/external-ids/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaType } = req.query;

    if (!id) {
      return res.status(400).json({ message: "ID parameter is required" });
    }

    const type = typeof mediaType === "string" ? mediaType : "movie";

    const response = await axios.get(
      `${TMDB_API_BASE_URL}/${type}/${id}/external_ids`,
      {
        params: { api_key: TMDB_API_KEY },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching external IDs:", error);
    res.status(500).json({ message: "Failed to fetch external IDs" });
  }
});

// Movie details
router.get("/movies/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaType } = req.query;

    if (!id) {
      return res.status(400).json({ message: "ID parameter is required" });
    }

    const type = typeof mediaType === "string" ? mediaType : "movie";

    const response = await axios.get(`${TMDB_API_BASE_URL}/${type}/${id}`, {
      params: { api_key: TMDB_API_KEY },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching movie/TV details:", error);
    res.status(500).json({ message: "Failed to fetch movie/TV details" });
  }
});

// Movie and TV search
router.get("/movies/search", async (req, res) => {
  try {
    const { query, mediaType } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const type = typeof mediaType === "string" ? mediaType : "all";
    let results: TMDBMovie[] = [];

    if (type === "all" || type === "movie") {
      const movieResponse = await axios.get<TMDBSearchResponse>(
        `${TMDB_API_BASE_URL}/search/movie`,
        {
          params: {
            api_key: TMDB_API_KEY,
            query,
            include_adult: false,
          },
        }
      );

      results = [
        ...results,
        ...movieResponse.data.results.map((item: TMDBMovie) => ({
          ...item,
          media_type: "movie" as 'movie',
        })),
      ];

    if (type === "all" || type === "tv") {
      const tvResponse = await axios.get<TMDBSearchResponse>(
        `${TMDB_API_BASE_URL}/search/tv`,
        {
          params: {
            api_key: TMDB_API_KEY,
            query,
            include_adult: false,
          },
        }
      );

      results = [
        ...results,
        ...tvResponse.data.results.map((item: TMDBMovie) => ({ ...item, media_type: "tv" as 'tv' })),
      ];
    }

    results.sort((a, b) => b.vote_average - a.vote_average);

    const response: TMDBSearchResponse = {
      page: 1,
      results,
      total_results: results.length,
      total_pages: 1,
    };

    res.json(response);
  } catch (error) {
    console.error("Error searching movies/TV:", error);
    res.status(500).json({ message: "Failed to search movies and TV shows" });
  }
});

// Watchlist routes
router.get(
  "/watchlist/:userId",
  isJwtAuthenticated,
  hasJwtWatchlistAccess,
  async (req, res) => {
    const isProd = process.env.NODE_ENV === "production";

    try {
      console.log("[WATCHLIST] Verifying database connection before operation...");
      const { ensureDatabaseReady } = await import("./db");
      const isDbReady = await ensureDatabaseReady();

      if (!isDbReady) {
        console.warn(
          "[WATCHLIST] Database connection is not ready - using fallback mechanisms"
        );
      } else {
        console.log("[WATCHLIST] Database connection verified successfully");
      }
    } catch (dbCheckError) {
      console.error("[WATCHLIST] Error verifying database connection:", dbCheckError);
    }

    try {
      const userId = parseInt(req.params.userId, 10);
      console.log(`[WATCHLIST] Fetching watchlist for user ID: ${userId}`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const authId = (req.user as User).id;
      if (authId !== userId) {
        console.error(
          `[WATCHLIST] Authorization mismatch: authenticated user ID ${authId} != requested userId ${userId}`
        );
        return res.status(403).json({
          message: "You can only view your own watchlist",
        });
      }

      let watchlistData: WatchlistEntryWithMovie[] = [];
      let userFound = false;
      let fetchSuccess = false;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(
            `[WATCHLIST] Attempting to fetch watchlist (attempt ${attempt}/3)...`
          );

          const user = await storage.getUser(userId);

          if (user) {
            userFound = true;
            console.log(
              `[WATCHLIST] Found user: ${user.username} (ID: ${userId})`
            );

            watchlistData = await storage.getWatchlistEntries(userId);
            console.log(
              `[WATCHLIST] Standard fetch successful: ${watchlistData.length} entries`
            );

            if (isProd && req.session) {
              (req.session as any).lastWatchlistUser = userId;
              (req.session as any).lastWatchlistCount = watchlistData.length;
              (req.session as any).lastWatchlistTime = Date.now();
            }

            res.setHeader("X-Watchlist-Count", watchlistData.length.toString());
            res.setHeader("X-Watchlist-Timestamp", Date.now().toString());

            fetchSuccess = true;
            break;
          } else {
            console.log(
              `[WATCHLIST] User with ID ${userId} not found in lookup attempt ${attempt}`
            );

            if (attempt === 3) {
              return res.status(404).json({ message: "User not found" });
            }
          }
        } catch (primaryError) {
          console.error(
            `[WATCHLIST] Error in watchlist fetch attempt ${attempt}:`,
            primaryError
          );

          if (attempt === 3) {
            try {
              console.log(
                `[WATCHLIST] Attempting direct SQL watchlist fetch as last resort...`
              );

              const userResults = await executeDirectSql(
                `SELECT * FROM users WHERE id = $1`,
                [userId]
              );

              if (userResults.rows.length > 0) {
                userFound = true;
                const userData = userResults.rows[0];
                console.log(
                  `[WATCHLIST] Found user via direct SQL: ${userData.username} (ID: ${userData.id})`
                );

                const entryResults = await executeDirectSql(
                  `SELECT we.*, m.*, p.id as platform_id, p.name as platform_name, p.is_default as platform_is_default
                   FROM watchlist_entries we
                   JOIN movies m ON we.movie_id = m.id
                   LEFT JOIN platforms p ON we.platform_id = p.id
                   WHERE we.user_id = $1
                   ORDER BY we.created_at DESC`,
                  [userId]
                );

                if (entryResults.rows.length > 0) {
                  watchlistData = entryResults.rows.map((row: WatchlistEntryWithMovie) => ({
                    id: row.id,
                    userId: row.userId,
                    movieId: row.movieId,
                    platformId: row.platformId || null,
                    status: row.status || 'to_watch',
                    watchedDate: row.watchedDate || null,
                    notes: row.notes || '',
                    createdAt: row.createdAt || new Date(),
                    movie: {
                      id: row.movieId,
                      tmdbId: row.movie.tmdbId,
                      title: row.movie.title || '[Unknown]',
                      overview: row.movie.overview || '',
                      posterPath: row.movie.posterPath || '',
                      backdropPath: row.movie.backdropPath || '',
                      releaseDate: row.movie.releaseDate || null,
                      voteAverage: row.movie.voteAverage || 0,
                      runtime: row.movie.runtime || null,
                      numberOfSeasons: row.movie.numberOfSeasons || null,
                      numberOfEpisodes: row.movie.numberOfEpisodes || null,
                      mediaType: row.movie.mediaType || 'movie',
                      createdAt: row.movie.createdAt || new Date(),
                    },
                    platform: row.platformId ? {
                      id: row.platformId,
                      userId: row.userId,
                      name: row.platform?.name || 'Unknown Platform',
                      logoUrl: row.platform?.logoUrl || null,
                      isDefault: row.platform?.isDefault || 0,
                    } : null,
                  }));
                    const movie = {
                      id: row.id,
                      tmdbId: row.tmdb_id,
                      title: row.title || "[Unknown]",
                      overview: row.overview || "",
                      posterPath: row.poster_path || "",
                      backdropPath: row.backdrop_path || "",
                      releaseDate: row.release_date || null,
                      voteAverage: row.vote_average || 0,
                      mediaType: row.media_type || "movie",
                      createdAt: row.created_at || new Date().toISOString(),
                    };

                    let platform = null;
                    if (row.platform_id) {
                      platform = {
                        id: row.platform_id,
                        name: row.platform_name || "Unknown Platform",
                        isDefault: row.platform_is_default || false,
                      };
                    }

                    return {
                      id: row.id,
                      userId: row.user_id,
                      movieId: row.movie_id,
                      platformId: row.platform_id || null,
                      status: row.status || "to_watch",
                      watchedDate: row.watched_date || null,
                      notes: row.notes || "",
                      createdAt: row.created_at || new Date().toISOString(),
                      movie,
                      platform,
                    };
                  });

                  console.log(
                    `[WATCHLIST] Direct SQL watchlist fetch successful, found ${watchlistData.length} entries`
                  );
                  fetchSuccess = true;
                } else {
                  console.log(
                    `[WATCHLIST] Direct SQL watchlist fetch returned no entries, this may be normal`
                  );
                  watchlistData = [];
                  fetchSuccess = true;
                }
              } else {
                console.log(
                  `[WATCHLIST] User with ID ${userId} not found via direct SQL`
                );
                return res.status(404).json({ message: "User not found" });
              }
            } catch (directSqlError) {
              console.error(
                `[WATCHLIST] Direct SQL watchlist fetch failed:`,
                directSqlError
              );
              console.warn(
                `[WATCHLIST] All direct watchlist fetch methods failed, trying session recovery`
              );
            }
          } else {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          }
        }
      }

      if (fetchSuccess) {
        res.setHeader("X-Watchlist-Source", "primary");
        return res.json(watchlistData);
      }

      if (isProd && req.session) {
        const storedUserId = (req.session as any).lastWatchlistUser;

        if (storedUserId === userId) {
          console.log(
            `[WATCHLIST] Attempting recovery from session data for user ${userId}`
          );
          const backupCount = (req.session as any).lastWatchlistCount || 0;
          const backupTime = (req.session as any).lastWatchlistTime || 0;
          const ageInMinutes = (Date.now() - backupTime) / (1000 * 60);

          if (backupCount > 0) {
            console.log(
              `[WATCHLIST] Using recovery indicators with count ${backupCount} from ${ageInMinutes.toFixed(
                1
              )} minutes ago`
            );
            res.setHeader("X-Watchlist-Source", "recovery");
            res.setHeader("X-Watchlist-Count", backupCount.toString());
            res.setHeader("X-Watchlist-Recovery-Age", ageInMinutes.toFixed(1));

            return res.status(206).json({
              recoveryMode: true,
              message:
                "Watchlist data temporarily unavailable, recovery information provided",
              expectedCount: backupCount,
              recoveryAge: ageInMinutes,
              entries: [],
            });
          }
        }
      }

      return res
        .status(404)
        .json({ message: "Watchlist not found or temporarily unavailable" });
    } catch (error) {
      console.error("[WATCHLIST] Unhandled error in watchlist fetch:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : "No stack trace";
      console.error("[WATCHLIST] Error details:", errorMessage);
      console.error("[WATCHLIST] Error stack:", errorStack);

      let statusCode = 500;
      let userMessage = "Failed to fetch watchlist";

      if (
        errorMessage.includes("connection") ||
        errorMessage.includes("pool") ||
        errorMessage.includes("database") ||
        errorMessage.includes("timeout")
      ) {
        userMessage = "Database connection issue detected. Please try again later.";
        statusCode = 503;
      } else if (
        errorMessage.includes("not found") ||
        errorMessage.includes("404")
      ) {
        statusCode = 404;
        userMessage = "The requested resource was not found.";
      } else if (
        errorMessage.includes("token") ||
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("authentication")
      ) {
        statusCode = 401;
        userMessage = "Authentication error. Please log in again.";
      } else if (
        errorMessage.includes("permission") ||
        errorMessage.includes("forbidden") ||
        errorMessage.includes("403")
      ) {
        statusCode = 403;
        userMessage = "You don't have permission to access this watchlist.";
      }

      interface ErrorResponse {
        message: string;
        error?: string;
        stack?: string;
        time?: string;
        recoveryMode?: boolean;
      }

      const errorResponse: ErrorResponse = isProd
        ? { message: userMessage }
        : {
            message: userMessage,
            error: errorMessage,
            stack: errorStack,
            time: new Date().toISOString(),
          };

      res.status(statusCode).json(errorResponse);
    }
  }
);

// POST watchlist endpoint
router.post("/watchlist", async (req, res) => {
  console.log("POST /api/watchlist - Request body:", JSON.stringify(req.body, null, 2));
  console.log(
    "POST /api/watchlist - Headers:",
    JSON.stringify(
      {
        auth: req.headers.authorization ? "Present" : "Missing",
        contentType: req.headers["content-type"],
        userAgent: req.headers["user-agent"],
      },
      null,
      2
    )
  );

  try {
    console.log("[WATCHLIST] Verifying database connection before operation...");
    const { ensureDatabaseReady } = await import("./db");
    const isDbReady = await ensureDatabaseReady();

    if (!isDbReady) {
      console.warn(
        "[WATCHLIST] Database connection is not ready - using fallback mechanisms"
      );
    } else {
      console.log("[WATCHLIST] Database connection verified successfully");
    }
  } catch (dbCheckError) {
    console.error("[WATCHLIST] Error verifying database connection:", dbCheckError);
  }

  try {
    if (!req.user) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        if (token) {
          console.log("[WATCHLIST] Checking JWT auth with token");
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "movie-watchlist-secure-jwt-secret-key") as any;
            if (decoded) {
              console.log(
                `[WATCHLIST] JWT auth successful for user: ${decoded.username}`
              );
              req.user = decoded;
            }
          } catch (tokenError) {
            console.error("[WATCHLIST] JWT token verification failed:", tokenError);
          }
        }
      }
    }

    if (!req.user) {
      console.log("[WATCHLIST] No authenticated user found after all auth checks");
      return res.status(401).json({
        message: "Authentication required",
        details: "Please log in again. Your session may have expired.",
      });
    }

    const authUserName = (req.user as User).username || "Unknown";
    const authUserId = (req.user as User).id || -1;
    console.log(
      `[WATCHLIST] User authenticated for watchlist action: ${authUserName} (ID: ${authUserId})`
    );

    console.log("[WATCHLIST] Raw request body:", JSON.stringify(req.body, null, 2));

    let userId = req.body.userId;
    let tmdbId = req.body.tmdbId;
    let tmdbData = req.body.tmdbData || req.body.tmdbMovie;
    const status = req.body.status || "to_watch";
    const watchedDate = req.body.watchedDate || null;
    const notes = req.body.notes || "";
    const platformId = req.body.platformId || null;

    if (!tmdbId && req.body.tmdbMovie && req.body.tmdbMovie.id) {
      tmdbId = req.body.tmdbMovie.id;
      console.log(`[WATCHLIST] Extracted tmdbId ${tmdbId} from tmdbMovie`);
    }

    console.log(
      `[WATCHLIST] Parsed values: userId=${userId}, tmdbId=${tmdbId}, status=${status}`
    );

    if (!userId || !tmdbId || !tmdbData) {
      const missingFields = [];
      if (!userId) missingFields.push("userId");
      if (!tmdbId) missingFields.push("tmdbId");
      if (!tmdbData) missingFields.push("tmdbData");

      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const authId = (req.user as User).id;
    if (authId !== userId) {
      console.log(
        `[WATCHLIST] Auth mismatch: authUser.id=${authId}, userId=${userId}`
      );
      return res.status(403).json({
        message: "You can only add movies to your own watchlist",
      });
    }

    let movie;
    try {
      movie = await storage.getMovieByTmdbId(tmdbId);
      console.log(
        `[WATCHLIST] Movie lookup result for TMDB ID ${tmdbId}: ${
          movie ? "Found" : "Not found"
        }`
      );
    } catch (movieLookupError) {
      console.error(
        `[WATCHLIST] Error looking up movie by TMDB ID ${tmdbId}:`,
        movieLookupError
      );
    }

    if (!movie) {
      console.log(`[WATCHLIST] Creating new movie record for TMDB ID ${tmdbId}`);
      const mediaType = tmdbData.media_type || "movie";
      const title = mediaType === "tv" ? tmdbData.name : tmdbData.title;
      const releaseDate =
        mediaType === "tv" ? tmdbData.first_air_date : tmdbData.release_date;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(
            `[WATCHLIST] Creating movie record (attempt ${attempt}/3)...`
          );
          movie = await storage.createMovie({
            tmdbId,
            title: title || "[Unknown Title]",
            overview: tmdbData.overview || "",
            posterPath: tmdbData.poster_path || "",
            backdropPath: tmdbData.backdrop_path || "",
            releaseDate: releaseDate || null,
            voteAverage: tmdbData.vote_average || 0,
            runtime: tmdbData.runtime || null,
            numberOfSeasons:
              mediaType === "tv" ? tmdbData.number_of_seasons || null : null,
            numberOfEpisodes:
              mediaType === "tv" ? tmdbData.number_of_episodes || null : null,
            mediaType,
          });

          console.log(
            `[WATCHLIST] Successfully created new movie: ${movie?.title || '[Unknown]'} (ID: ${movie?.id || 'unknown'})`
          );
          break;
        } catch (movieError) {
          console.error(
            `[WATCHLIST] Error creating movie (attempt ${attempt}/3):`,
            movieError
          );

          if (attempt === 3) {
            try {
              console.log(
                `[WATCHLIST] Attempting direct SQL movie creation as last resort...`
              );
              const result = await executeDirectSql(
                `INSERT INTO movies (tmdb_id, title, overview, poster_path, backdrop_path, release_date, vote_average, runtime, number_of_seasons, number_of_episodes, media_type) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
                 RETURNING *`,
                [
                  tmdbId,
                  title || "[Unknown Title]",
                  tmdbData.overview || "",
                  tmdbData.poster_path || "",
                  tmdbData.backdrop_path || "",
                  releaseDate || null,
                  tmdbData.vote_average || 0,
                  tmdbData.runtime || null,
                  mediaType === "tv" ? tmdbData.number_of_seasons || null : null,
                  mediaType === "tv" ? tmdbData.number_of_episodes || null : null,
                  mediaType,
                ]
              );

              if (result.rows.length > 0) {
                const row = result.rows[0] as any;
                movie = {
                  id: row.id,
                  tmdbId: row.tmdb_id,
                  title: row.title,
                  overview: row.overview,
                  posterPath: row.poster_path,
                  backdropPath: row.backdrop_path,
                  releaseDate: row.release_date,
                  voteAverage: row.vote_average,
                  runtime: row.runtime,
                  numberOfSeasons: row.number_of_seasons,
                  numberOfEpisodes: row.number_of_episodes,
                  mediaType: row.media_type,
                  createdAt: row.created_at,
                };

                console.log(
                  `[WATCHLIST] Direct SQL movie creation successful (ID: ${movie.id})`
                );
                break;
              }
            } catch (directSqlError) {
              console.error(
                `[WATCHLIST] Direct SQL movie creation failed:`,
                directSqlError
              );

              if (process.env.NODE_ENV === "production") {
                const tempId = new Date().getTime();
                movie = {
                  id: tempId,
                  tmdbId,
                  title: title || "[Unknown Title]",
                  overview: tmdbData.overview || "",
                  posterPath: tmdbData.poster_path || "",
                  backdropPath: tmdbData.backdrop_path || "",
                  releaseDate: releaseDate || null,
                  voteAverage: tmdbData.vote_average || 0,
                  runtime: tmdbData.runtime || null,
                  numberOfSeasons:
                    mediaType === "tv" ? tmdbData.number_of_seasons || null : null,
                  numberOfEpisodes:
                    mediaType === "tv" ? tmdbData.number_of_episodes || null : null,
                  mediaType,
                  createdAt: new Date().toISOString(),
                };

                console.log(
                  `[WATCHLIST] Using temporary movie object with ID ${tempId}`
                );
              } else {
                return res.status(500).json({
                  message:
                    "Failed to create movie record after multiple attempts",
                  details: "Database connection may be unstable",
                });
              }
            }
          } else {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          }
        }
      }
    } else {
      console.log(
        `[WATCHLIST] Found existing movie: ${movie.title} (ID: ${movie.id})`
      );
    }

    if (!movie) {
      return res.status(500).json({
        message: "Failed to create or retrieve movie record",
      });
    }

    let exists = false;
    try {
      exists = await storage.hasWatchlistEntry(userId, movie.id);
      console.log(
        `[WATCHLIST] Duplicate check: Movie ${movie.id} ${
          exists ? "already exists" : "does not exist"
        } in user ${userId}'s watchlist`
      );
    } catch (existsError) {
      console.error(
        `[WATCHLIST] Error checking for existing watchlist entry:`,
        existsError
      );
    }

    if (exists) {
      return res.status(409).json({
        message: "This movie is already in your watchlist",
      });
    }

    let entry;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `[WATCHLIST] Creating watchlist entry (attempt ${attempt}/3)...`
        );

        entry = await storage.createWatchlistEntry({
          userId,
          movieId: movie.id,
          platformId,
          status,
          watchedDate,
          notes,
        });

        console.log(
         `[WATCHLIST] Successfully added movie ${movie?.title || '[Unknown]'} to watchlist for user ${userId} (Entry ID: ${entry?.id || 'unknown'})`
        );
        break;
      } catch (entryError) {
        console.error(
          `[WATCHLIST] Error creating watchlist entry (attempt ${attempt}/3):`,
          entryError
        );

        if (attempt === 3) {
          try {
            console.log(
              `[WATCHLIST] Attempting direct SQL watchlist entry creation as last resort...`
            );
            const result = await executeDirectSql(
              `INSERT INTO watchlist_entries (user_id, movie_id, platform_id, status, watched_date, notes) 
               VALUES ($1, $2, $3, $4, $5, $6) 
               RETURNING *`,
              [userId, movie.id, platformId, status, watchedDate, notes]
            );

            if (result.rows.length > 0) {
              const row = result.rows[0] as any;
              entry = {
                id: row.id,
                userId: row.user_id,
                movieId: row.movie_id,
                status: row.status,
                watchedDate: row.watched_date,
                notes: row.notes,
                createdAt: row.created_at,
              };

              console.log(
                `[WATCHLIST] Direct SQL watchlist entry creation successful (ID: ${entry.id})`
              );
              break;
            }
          } catch (directSqlError) {
            console.error(
              `[WATCHLIST] Direct SQL watchlist entry creation failed:`,
              directSqlError
            );

            if (process.env.NODE_ENV === "production") {
              return res.status(202).json({
                message: "Watchlist entry created but not yet confirmed",
                temporary: true,
                userId,
                movieId: movie.id,
                movie: {
                  title: movie.title,
                  posterPath: movie.posterPath,
                },
              });
            } else {
              return res.status(500).json({
                message:
                  "Failed to add to watchlist after multiple attempts",
                details: "Database connection may be unstable",
              });
            }
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    console.log(
      `[WATCHLIST] Added movie ${movie.title} to watchlist for user ${userId}`
    );

    return res.status(201).json(entry);
  } catch (error) {
    console.error("Unhandled error in watchlist creation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    console.error("Error details:", errorMessage);
    console.error("Error stack:", errorStack);

    let statusCode = 500;
    let userMessage = "Failed to add movie to watchlist";

    if (
      errorMessage.includes("connection") ||
      errorMessage.includes("pool") ||
      errorMessage.includes("database") ||
      errorMessage.includes("timeout")
    ) {
      userMessage = "Database connection issue detected. Please try again later.";
      try {
        console.error(
          "[WATCHLIST] Critical database error detected, checking connection status..."
        );
        // Pool not needed; handled by executeDirectSql
       // if (pool && pool.totalCount !== undefined) {
         // const connStatus = {
           // totalCount: pool.totalCount,
            //idleCount: pool.idleCount,
            //waitingCount: pool.waitingCount,
          //};
          console.error("[WATCHLIST] Connection pool status:", connStatus);
          if (process.env.NODE_ENV !== "production") {
            userMessage += ` Pool stats: Total=${connStatus.totalCount}, Idle=${connStatus.idleCount}, Waiting=${connStatus.waitingCount}`;
          }
        }
      } catch (poolError) {
        console.error(
          "[WATCHLIST] Failed to check connection pool status:",
          poolError
        );
      }
    } else if (
      errorMessage.includes("not found") ||
      errorMessage.includes("404")
    ) {
      statusCode = 404;
      userMessage = "The requested resource was not found.";
    } else if (
      errorMessage.includes("token") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("authentication")
    ) {
      statusCode = 401;
      userMessage = "Authentication error. Please log in again.";
    } else if (
      errorMessage.includes("permission") ||
      errorMessage.includes("forbidden") ||
      errorMessage.includes("403")
    ) {
      statusCode = 403;
      userMessage = "You don't have permission to perform this action.";
    }

    interface ErrorResponse {
      message: string;
      error?: string;
      stack?: string;
      time?: string;
      path?: string;
      method?: string;
      userId?: number;
      tmdbId?: number;
      pending?: boolean;
      retry?: boolean;
    }

    const errorResponse: ErrorResponse =
      process.env.NODE_ENV === "production"
        ? { message: userMessage }
        : {
            message: userMessage,
            error: errorMessage,
            stack: errorStack,
            time: new Date().toISOString(),
            path: req.path,
            method: req.method,
            userId: req.body?.userId,
            tmdbId: req.body?.tmdbId,
          };

    if (
      process.env.NODE_ENV === "production" &&
      statusCode === 500 &&
      errorMessage.includes("database")
    ) {
      statusCode = 202;
      errorResponse.pending = true;
      errorResponse.retry = true;
      errorResponse.message =
        "Request accepted but processing delayed due to temporary issues";
    }

    res.status(statusCode).json(errorResponse);
  }
});

// Update watchlist entry
router.put(
  "/watchlist/:id",
  isJwtAuthenticated,
  hasJwtWatchlistAccess,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { watchedDate, notes, status, platformId } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid watchlist entry ID" });
      }

      const existingEntry = await storage.getWatchlistEntry(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Watchlist entry not found" });
      }

      if (existingEntry.userId !== (req.user as User).id) {
        return res
          .status(403)
          .json({ message: "You can only update your own watchlist entries" });
      }

      const updatedEntry = await storage.updateWatchlistEntry(id, {
        status,
        watchedDate,
        notes,
        platformId,
      });

      const movie = await storage.getMovie(existingEntry.movieId);
      if (!movie) {
        return res.status(500).json({ message: "Movie not found" });
      }

      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating watchlist entry:", error);
      res.status(500).json({ message: "Failed to update watchlist entry" });
    }
  }
);

// Delete watchlist entry
router.delete(
  "/watchlist/:id",
  isJwtAuthenticated,
  hasJwtWatchlistAccess,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid watchlist entry ID" });
      }

      const existingEntry = await storage.getWatchlistEntry(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Watchlist entry not found" });
      }

      if (existingEntry.userId !== (req.user as User).id) {
        return res
          .status(403)
          .json({ message: "You can only delete your own watchlist entries" });
      }

      const success = await storage.deleteWatchlistEntry(id);

      res.json({ success });
    } catch (error) {
      console.error("Error deleting watchlist entry:", error);
      res.status(500).json({ message: "Failed to delete watchlist entry" });
    }
  }
);

// Platform routes
router.get("/platforms/:userId", isJwtAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if ((req.user as User).id !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to access these platforms" });
    }

    const platforms = await storage.getPlatforms(userId);
    res.json(platforms);
  } catch (error) {
    console.error("Error fetching platforms:", error);
    res
      .status(500)
      .json({ message: "Error fetching platforms", error: String(error) });
  }
});

router.post("/platforms", isJwtAuthenticated, async (req, res) => {
  try {
    const { userId, name, logoUrl, isDefault } = req.body;

    if ((req.user as User).id !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to create platforms for this user" });
    }

    const platform = await storage.createPlatform({
      userId,
      name,
      logoUrl,
      isDefault: isDefault || false,
    });

    res.status(201).json(platform);
  } catch (error) {
    console.error("Error creating platform:", error);
    res
      .status(500)
      .json({ message: "Error creating platform", error: String(error) });
  }
});

router.put("/platforms/:id", isJwtAuthenticated, async (req, res) => {
  try {
    const platformId = parseInt(req.params.id, 10);
    const updates = req.body;

    const existingPlatform = await storage.getPlatform(platformId);
    if (!existingPlatform) {
      return res.status(404).json({ message: "Platform not found" });
    }

    if ((req.user as User).id !== existingPlatform.userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this platform" });
    }

    const updatedPlatform = await storage.updatePlatform(platformId, updates);
    res.json(updatedPlatform);
  } catch (error) {
    console.error("Error updating platform:", error);
    res
      .status(500)
      .json({ message: "Error updating platform", error: String(error) });
  }
});

router.delete("/platforms/:id", isJwtAuthenticated, async (req, res) => {
  try {
    const platformId = parseInt(req.params.id, 10);

    const existingPlatform = await storage.getPlatform(platformId);
    if (!existingPlatform) {
      return res.status(404).json({ message: "Platform not found" });
    }

    if ((req.user as User).id !== existingPlatform.userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this platform" });
    }

    const deleted = await storage.deletePlatform(platformId);
    res.json({ success: deleted });
  } catch (error) {
    console.error("Error deleting platform:", error);
    res
      .status(500)
      .json({ message: "Error deleting platform", error: String(error) });
  }
});

// JWT auth routes
console.log("[SERVER] Registering JWT auth endpoints");
router.use(jwtAuthRouter);

export default router;