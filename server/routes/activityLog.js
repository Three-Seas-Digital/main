import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/activity-log — List activity log entries (with pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    const [rows] = await pool.query(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM activity_log');

    res.json({
      entries: rows,
      total: countResult[0].total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[activityLog] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/activity-log — Create activity log entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { action, details } = req.body;
    const [result] = await pool.query(
      `INSERT INTO activity_log (action, details, user_id, user_name, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [action, details ? JSON.stringify(details) : null, req.user.userId, req.user.username]
    );
    res.status(201).json({ id: result.insertId, message: 'Activity logged' });
  } catch (err) {
    console.error('[activityLog] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/activity-log — Clear activity log (admin only)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
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
