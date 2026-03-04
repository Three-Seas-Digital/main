import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';

const router = Router();

// GET /api/clients/:clientId/growth-targets
router.get('/:clientId/growth-targets', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
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
router.post('/:clientId/growth-targets', authenticateToken, async (req, res) => {
  try {
    const { metric_name, metric_type, baseline_value, target_value, current_value, target_date, measurement_frequency, kpi_id, industry } = req.body;
    const id = generateId();
    await pool.query(
      `INSERT INTO growth_targets (id, client_id, metric_name, metric_type, baseline_value, target_value, current_value, target_date, measurement_frequency, kpi_id, industry, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [id, req.params.clientId, metric_name, metric_type || 'percentage', baseline_value || 0, target_value || 0, current_value || 0, target_date || null, measurement_frequency || 'monthly', kpi_id || null, industry || null]
    );
    res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    console.error('POST growth-targets error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/clients/:clientId/growth-targets/:id
router.put('/:clientId/growth-targets/:id', authenticateToken, async (req, res) => {
  try {
    const { current_value, target_value, status } = req.body;
    const sets = [];
    const vals = [];
    if (current_value !== undefined) { sets.push('current_value = ?'); vals.push(current_value); }
    if (target_value !== undefined) { sets.push('target_value = ?'); vals.push(target_value); }
    if (status) { sets.push('status = ?'); vals.push(status); }
    if (sets.length === 0) return res.json({ success: true });
    sets.push('updated_at = NOW()');
    vals.push(req.params.id);
    await pool.query(`UPDATE growth_targets SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ success: true });
  } catch (err) {
    console.error('PUT growth-targets error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/clients/:clientId/growth-targets/:id
router.delete('/:clientId/growth-targets/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM growth_targets WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/clients/:clientId/growth-targets/:id/snapshots
router.post('/:clientId/growth-targets/:id/snapshots', authenticateToken, async (req, res) => {
  try {
    const { value, notes } = req.body;
    const targetId = req.params.id;
    // Get previous value
    const [prev] = await pool.query(
      'SELECT value FROM growth_snapshots WHERE target_id = ? ORDER BY snapshot_date DESC LIMIT 1',
      [targetId]
    );
    const previousValue = prev.length > 0 ? prev[0].value : null;
    const changePct = previousValue && previousValue !== 0 ? ((value - previousValue) / previousValue) * 100 : null;

    // Get target for progress calc
    const [target] = await pool.query('SELECT baseline_value, target_value FROM growth_targets WHERE id = ?', [targetId]);
    let progressPct = null;
    if (target.length > 0 && target[0].target_value !== target[0].baseline_value) {
      progressPct = ((value - target[0].baseline_value) / (target[0].target_value - target[0].baseline_value)) * 100;
    }

    const id = generateId();
    await pool.query(
      `INSERT INTO growth_snapshots (id, target_id, value, previous_value, change_percent, progress_percent, notes, snapshot_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, targetId, value, previousValue, changePct, progressPct, notes || null]
    );
    // Update current_value on the target
    await pool.query('UPDATE growth_targets SET current_value = ?, updated_at = NOW() WHERE id = ?', [value, targetId]);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    console.error('POST growth-snapshots error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/clients/:clientId/growth-targets/:id/snapshots
router.get('/:clientId/growth-targets/:id/snapshots', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM growth_snapshots WHERE target_id = ? ORDER BY snapshot_date ASC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
