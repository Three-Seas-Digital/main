import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/clients/:clientId/execution-plans
router.get('/:clientId/execution-plans', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM execution_plans WHERE client_id = ? ORDER BY created_at DESC',
      [req.params.clientId]
    );
    const rowsArray = Array.isArray(rows) ? rows : [];
    // Parse plan_data JSON
    rowsArray.forEach((r: any) => {
      if (typeof r.plan_data === 'string') {
        try { r.plan_data = JSON.parse(r.plan_data); } catch { /* leave as-is */ }
      }
    });
    res.json({ success: true, data: rowsArray });
  } catch (err) {
    console.error('GET execution-plans error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/clients/:clientId/execution-plans
router.post('/:clientId/execution-plans', authenticateToken, async (req: any, res: Response) => {
  try {
    const { name, plan_data, start_date } = req.body;
    const id = generateId();
    await pool.query(
      `INSERT INTO execution_plans (id, client_id, name, plan_data, start_date, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, req.params.clientId, name || 'Untitled Plan', JSON.stringify(plan_data || {}), start_date || null]
    );
    res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    console.error('POST execution-plans error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/clients/:clientId/execution-plans/:id
router.put('/:clientId/execution-plans/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const { name, plan_data, start_date } = req.body;
    await pool.query(
      'UPDATE execution_plans SET name = ?, plan_data = ?, start_date = ?, updated_at = NOW() WHERE id = ?',
      [name || 'Untitled Plan', JSON.stringify(plan_data || {}), start_date || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT execution-plans error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/clients/:clientId/execution-plans/:id
router.delete('/:clientId/execution-plans/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    await pool.query('DELETE FROM execution_plans WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
