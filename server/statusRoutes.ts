import express from 'express';
import { executeDirectSql } from './db';

const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    const dbStatus = await executeDirectSql('SELECT 1');
    res.json({
      status: 'ok',
      database: dbStatus.length > 0 ? 'connected' : 'disconnected',
    });
  } catch (err) {
    console.error('[STATUS] Error checking status:', err);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

export default router;
