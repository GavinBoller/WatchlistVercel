import { Router, Request, Response } from 'express';
import { isJwtAuthenticated } from './jwtMiddleware';
import { UserResponse } from '@shared/schema';
import { db } from './db';
import * as schema from '@shared/schema';
import { executeDirectSql } from './db';
import { count, sql, desc, eq } from 'drizzle-orm';

const router = Router();
const adminIds = ['1', '2'];
const adminUsernames = ['admin', 'superuser'];

// Basic ping endpoint (public)
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin stats endpoint
router.get('/stats', isJwtAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as UserResponse;
  const isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);

  if (!isAdmin) {
    console.log(`[ADMIN] Access DENIED to stats for non-admin user: ${user.username} (ID: ${user.id})`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log(`[ADMIN] Stats accessed by user: ${user.username} (ID: ${user.id})`);
    const [userCount] = await db.select({ count: count() }).from(schema.users);
    const [watchlistCount] = await db.select({ count: count() }).from(schema.watchlistEntries);
    const stats = {
      totalUsers: userCount.count,
      totalWatchlistEntries: watchlistCount.count,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(stats);
  } catch (error) {
    console.error('[ADMIN] Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Full stats endpoint (admin only)
router.get('/stats/full', isJwtAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as UserResponse;
  const isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);

  if (!isAdmin) {
    console.log(`[ADMIN] Access DENIED to full stats for non-admin user: ${user.username} (ID: ${user.id})`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log(`[ADMIN] Full stats accessed by user: ${user.username} (ID: ${user.id})`);
    const users = await db.select().from(schema.users).limit(100);
    const watchlistEntries = await db.select().from(schema.watchlistEntries).limit(100);
    const fullStats = {
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt,
      })),
      watchlistEntries,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(fullStats);
  } catch (error) {
    console.error('[ADMIN] Error fetching full stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Summary stats endpoint (admin only)
router.get('/stats/summary', isJwtAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as UserResponse;
  const isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);

  if (!isAdmin) {
    console.log(`[ADMIN] Access DENIED to summary stats for non-admin user: ${user.username} (ID: ${user.id})`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log(`[ADMIN] Summary stats accessed by user: ${user.username} (ID: ${user.id})`);
    const [activeUsers] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(sql`created_at > ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`);
    const [recentWatchlist] = await db
      .select({ count: count() })
      .from(schema.watchlistEntries)
      .where(sql`created_at > ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`);
    const summaryStats = {
      activeUsers: activeUsers.count,
      recentWatchlistEntries: recentWatchlist.count,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(summaryStats);
  } catch (error) {
    console.error('[ADMIN] Error fetching summary stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User activity endpoint (admin only)
router.get('/user-activity', isJwtAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as UserResponse;
  const isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);

  if (!isAdmin) {
    console.log(`[ADMIN] Access DENIED to user-activity for non-admin user: ${user.username} (ID: ${user.id})`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log(`[ADMIN] Dashboard access by user: ${user.username} (ID: ${user.id})`);
    const activity = await db
      .select({
        userId: schema.watchlistEntries.userId,
        username: schema.users.username,
        movieId: schema.watchlistEntries.movieId,
        title: schema.watchlistEntries.title,
        createdAt: schema.watchlistEntries.createdAt,
      })
      .from(schema.watchlistEntries)
      .innerJoin(schema.users, eq(schema.users.id, schema.watchlistEntries.userId))
      .orderBy(desc(schema.watchlistEntries.createdAt))
      .limit(50);
    res.status(200).json(activity);
  } catch (error) {
    console.error('[ADMIN] Error fetching user activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// System health endpoint (admin only)
router.get('/health', isJwtAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as UserResponse;
  const isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);

  if (!isAdmin) {
    console.log(`[ADMIN] Access DENIED to health for non-admin user: ${user.username} (ID: ${user.id})`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log(`[ADMIN] Health check accessed by user: ${user.username} (ID: ${user.id})`);
    const dbStatus = await executeDirectSql('SELECT 1 AS status');
    const health = {
      status: 'ok',
      database: dbStatus.length > 0 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(health);
  } catch (error) {
    console.error('[ADMIN] Error fetching system health:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Database status endpoint (admin only)
router.get('/db-status', isJwtAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as UserResponse;
  const isAdmin = adminIds.includes(user.id.toString()) || adminUsernames.includes(user.username);

  if (!isAdmin) {
    console.log(`[ADMIN] Access DENIED to db-status for non-admin user: ${user.username} (ID: ${user.id})`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log(`[ADMIN] DB status accessed by user: ${user.username} (ID: ${user.id})`);
    const dbStatus = await executeDirectSql('SELECT 1 AS status');
    res.status(200).json({ error: 'Admin access required' });
  } catch (error) {
    console.error('[ADMIN] Error fetching DB status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;