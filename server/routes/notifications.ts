import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/notifications — List notifications for current user
router.get('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user?.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[notifications] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/notifications/unread-count — Get unread count
router.get('/unread-count', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user?.id]
    );
    const rowsArray = Array.isArray(rows) ? rows : [];
    res.json({ count: (rowsArray[0] as any).count });
  } catch (err) {
    console.error('[notifications] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notifications — Create notification
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { id: bodyId, userId, type, title, message, link } = req.body;
    const id = bodyId || generateId();
    await // @ts-ignore
  pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())',
      [id, userId || req.user?.id, type, title || 'Notification', message, link || null]
    );
    res.status(201).json({ id, message: 'Notification created' });
  } catch (err) {
    console.error('[notifications] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/:id/read — Mark notification as read
router.put('/:id/read', authenticateToken, async (req: any, res: Response) => {
  try {
    await // @ts-ignore
  pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user?.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('[notifications] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/read-all — Mark all as read
router.put('/read-all', authenticateToken, async (req: any, res: Response) => {
  try {
    await // @ts-ignore
  pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user?.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[notifications] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/notifications/:id — Delete notification (admin only for others' notifications)
router.delete('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    await // @ts-ignore
  pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('[notifications] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
