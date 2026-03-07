import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/time-entries — List all time entries (optionally filter by project)
router.get('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const { projectId } = req.query;
    let query = `SELECT te.*, p.name AS project_name, u.display_name AS user_name
                 FROM time_entries te
                 LEFT JOIN projects p ON te.project_id = p.id
                 LEFT JOIN users u ON te.user_id = u.id`;
    const params: any[] = [];

    if (projectId) {
      query += ' WHERE te.project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY te.date DESC, te.created_at DESC';

    const [rows] = await // @ts-ignore
  pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[timeEntries] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/time-entries/:id — Get single time entry
router.get('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query('SELECT * FROM time_entries WHERE id = ?', [req.params.id]);
    const rowsArray = Array.isArray(rows) ? rows : [];
    if (rowsArray.length === 0) return res.status(404).json({ error: 'Time entry not found' });
    res.json(rowsArray[0]);
  } catch (err) {
    console.error('[timeEntries] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/time-entries — Create time entry
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req: any, res: Response) => {
  try {
    const { projectId, date, hours, description, billable } = req.body;
    const [result] = await // @ts-ignore
  pool.query(
      `INSERT INTO time_entries (project_id, user_id, date, hours, description, billable, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [projectId, req.user?.id, date || new Date().toISOString().split('T')[0], hours, description || null, billable !== false]
    );
    res.status(201).json({ id: (result as any).insertId, message: 'Time entry created' });
  } catch (err) {
    console.error('[timeEntries] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/time-entries/:id — Update time entry
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req: any, res: Response) => {
  try {
    const { date, hours, description, billable } = req.body;
    await // @ts-ignore
  pool.query(
      'UPDATE time_entries SET date = ?, hours = ?, description = ?, billable = ?, updated_at = NOW() WHERE id = ?',
      [date, hours, description, billable, req.params.id]
    );
    res.json({ message: 'Time entry updated' });
  } catch (err) {
    console.error('[timeEntries] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/time-entries/:id — Delete time entry
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'developer'), async (req: any, res: Response) => {
  try {
    await // @ts-ignore
  pool.query('DELETE FROM time_entries WHERE id = ?', [req.params.id]);
    res.json({ message: 'Time entry deleted' });
  } catch (err) {
    console.error('[timeEntries] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
