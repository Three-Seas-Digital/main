import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/activity-log — List activity log entries (with pagination)
router.get('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const [rows] = await pool.query(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM activity_log');

    res.json({
      entries: rows,
      total: (Array.isArray(countResult) ? countResult[0] : countResult).total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[activityLog] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/activity-log — Create activity log entry
router.post('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const { action, details } = req.body;
    const [result] = await pool.query(
      `INSERT INTO activity_log (action, details, user_id, user_name, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [action, details ? JSON.stringify(details) : null, req.user?.id, req.user?.username]
    );
    res.status(201).json({ id: (result as any).insertId, message: 'Activity logged' });
  } catch (err) {
    console.error('[activityLog] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/activity-log — Clear activity log (admin only)
router.delete('/', authenticateToken, async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await pool.query('DELETE FROM activity_log');
    res.json({ message: 'Activity log cleared' });
  } catch (err) {
    console.error('[activityLog] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
