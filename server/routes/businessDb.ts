import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/business-db — List all business database entries
router.get('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query(
      'SELECT * FROM business_database ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[businessDb] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/business-db/:id — Get single entry
router.get('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query('SELECT * FROM business_database WHERE id = ?', [req.params.id]);
    const rowsArray = Array.isArray(rows) ? rows : [];
    if (rowsArray.length === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json(rowsArray[0]);
  } catch (err) {
    console.error('[businessDb] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/business-db — Create entry
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    const { businessName, address, phone, website, category, owner, email, notes, source, intel } = req.body;
    const [result] = await // @ts-ignore
  pool.query(
      `INSERT INTO business_database (business_name, address, phone, website, category, owner, email, notes, source, intel, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [businessName, address || null, phone || null, website || null, category || null, owner || null, email || null, notes || null, source || 'manual', intel ? JSON.stringify(intel) : null]
    );
    res.status(201).json({ id: (result as any).insertId, message: 'Business entry created' });
  } catch (err) {
    console.error('[businessDb] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/business-db/:id — Update entry
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    const { businessName, address, phone, website, category, owner, email, notes, source, intel } = req.body;
    await // @ts-ignore
  pool.query(
      `UPDATE business_database SET business_name = ?, address = ?, phone = ?, website = ?, category = ?,
       owner = ?, email = ?, notes = ?, source = ?, intel = ?, updated_at = NOW() WHERE id = ?`,
      [businessName, address, phone, website, category, owner, email, notes, source, intel ? JSON.stringify(intel) : null, req.params.id]
    );
    res.json({ message: 'Business entry updated' });
  } catch (err) {
    console.error('[businessDb] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/business-db/:id — Delete entry
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    await // @ts-ignore
  pool.query('DELETE FROM business_database WHERE id = ?', [req.params.id]);
    res.json({ message: 'Business entry deleted' });
  } catch (err) {
    console.error('[businessDb] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
