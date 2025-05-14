import { Router, Request, Response } from 'express';
import { isJwtAuthenticated } from './jwtMiddleware';
import { UserResponse } from '@shared/schema';
import { storage } from './types/storage';
import { executeDirectSql } from './db';

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
    const stats = await storage.getSystemStats();
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
    const fullStats = await storage.getFullSystemStats();
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
    const summaryStats = await storage.getSummaryStats();
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
    const activity = await storage.getUserActivity();
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
    const health = await storage.getSystemHealth();
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
    res.status(200).json({ status: 'ok', db: dbStatus });
  } catch (error) {
    console.error('[ADMIN] Error fetching DB status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const statusRouter = router;