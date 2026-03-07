import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/clients/:clientId/growth-targets
router.get('/:clientId/growth-targets', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query(
      'SELECT * FROM growth_targets WHERE client_id = ? ORDER BY created_at DESC',
      [req.params.clientId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET growth-targets error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/clients/:clientId/growth-targets
router.post('/:clientId/growth-targets', authenticateToken, async (req: any, res: Response) => {
  try {
    const { metric_name, baseline_value, target_value, current_value, target_date, measurement_frequency, unit } = req.body;
    const id = generateId();
    const metric_slug = (metric_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await // @ts-ignore
  pool.query(
      `INSERT INTO growth_targets (id, client_id, metric_name, metric_slug, unit, baseline_value, target_value, current_value, target_date, measurement_frequency, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [id, req.params.clientId, metric_name, metric_slug, unit || 'number', baseline_value || 0, target_value || 0, current_value || 0, target_date || null, measurement_frequency || 'monthly']
    );
    res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    console.error('POST growth-targets error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/clients/:clientId/growth-targets/:id
router.put('/:clientId/growth-targets/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const { current_value, target_value, status } = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    if (current_value !== undefined) { sets.push('current_value = ?'); vals.push(current_value); }
    if (target_value !== undefined) { sets.push('target_value = ?'); vals.push(target_value); }
    if (status) { sets.push('status = ?'); vals.push(status); }
    if (sets.length === 0) return res.json({ success: true });
    sets.push('updated_at = NOW()');
    vals.push(req.params.id);
    await // @ts-ignore
  pool.query(`UPDATE growth_targets SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ success: true });
  } catch (err) {
    console.error('PUT growth-targets error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/clients/:clientId/growth-targets/:id
router.delete('/:clientId/growth-targets/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    await // @ts-ignore
  pool.query('DELETE FROM growth_targets WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/clients/:clientId/growth-targets/:id/snapshots
router.post('/:clientId/growth-targets/:id/snapshots', authenticateToken, async (req: any, res: Response) => {
  try {
    const { value, notes } = req.body;
    const targetId = req.params.id;
    // Get previous value
    const [prev] = await // @ts-ignore
  pool.query(
      'SELECT value FROM growth_snapshots WHERE target_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [targetId]
    );
    const prevArray = Array.isArray(prev) ? prev : [];
    const previousValue = prevArray.length > 0 ? prevArray[0].value : null;
    const changePct = previousValue && previousValue !== 0 ? ((value - previousValue) / previousValue) * 100 : null;

    // Get target for progress calc
    const [target] = await // @ts-ignore
  pool.query('SELECT baseline_value, target_value FROM growth_targets WHERE id = ?', [targetId]);
    const targetArray = Array.isArray(target) ? target : [];
    let progressPct: number | null = null;
    if (targetArray.length > 0 && targetArray[0].target_value !== targetArray[0].baseline_value) {
      progressPct = ((value - targetArray[0].baseline_value) / (targetArray[0].target_value - targetArray[0].baseline_value)) * 100;
    }

    const id = generateId();
    await // @ts-ignore
  pool.query(
      `INSERT INTO growth_snapshots (id, target_id, client_id, value, previous_value, change_percent, progress_percent, notes, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, targetId, req.params.clientId, value, previousValue, changePct, Math.min(progressPct || 0, 999), notes || null]
    );
    // Update current_value on the target
    await // @ts-ignore
  pool.query('UPDATE growth_targets SET current_value = ?, updated_at = NOW() WHERE id = ?', [value, targetId]);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    console.error('POST growth-snapshots error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/clients/:clientId/growth-targets/:id/snapshots
router.get('/:clientId/growth-targets/:id/snapshots', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query(
      'SELECT * FROM growth_snapshots WHERE target_id = ? ORDER BY recorded_at ASC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
