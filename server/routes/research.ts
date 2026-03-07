import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/research — List all research entries
router.get('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query(
      'SELECT * FROM market_research ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[research] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/research/:id — Get single research entry
router.get('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query('SELECT * FROM market_research WHERE id = ?', [req.params.id]);
    const rowsArray = Array.isArray(rows) ? rows : [];
    if (rowsArray.length === 0) return res.status(404).json({ error: 'Research not found' });
    res.json(rowsArray[0]);
  } catch (err) {
    console.error('[research] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/research — Save research data
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const { location, data } = req.body;
    const lookupKey = `${location}`;
    const [result] = await // @ts-ignore
  pool.query(
      `INSERT INTO market_research (lookup_key, location, data, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE data = ?, updated_at = NOW()`,
      [lookupKey, location, data ? JSON.stringify(data) : null, data ? JSON.stringify(data) : null]
    );
    res.status(201).json({ id: (result as any).insertId, message: 'Research saved' });
  } catch (err) {
    console.error('[research] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/research/:id — Update research
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const { location, data } = req.body;
    const lookupKey = `${location}`;
    await // @ts-ignore
  pool.query(
      `UPDATE market_research SET lookup_key = ?, location = ?, data = ?, updated_at = NOW()
       WHERE id = ?`,
      [lookupKey, location, data ? JSON.stringify(data) : null, req.params.id]
    );
    res.json({ message: 'Research updated' });
  } catch (err) {
    console.error('[research] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/research/:id — Delete research
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    await // @ts-ignore
  pool.query('DELETE FROM market_research WHERE id = ?', [req.params.id]);
    res.json({ message: 'Research deleted' });
  } catch (err) {
    console.error('[research] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
