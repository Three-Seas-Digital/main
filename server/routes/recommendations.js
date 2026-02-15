import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';

const router = Router();

// ====================================

// GET /api/recommendation-templates - List templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM recommendation_templates ORDER BY category, title'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/recommendation-templates error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/recommendation-templates - Create template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, title, description, priority, estimated_cost_min, estimated_cost_max, estimated_timeline } = req.body;
    const id = generateId();
    await pool.query(
      `INSERT INTO recommendation_templates (id, category, title, description, priority, estimated_cost_min, estimated_cost_max, estimated_timeline, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, category, title, description || null, priority || 'medium', estimated_cost_min || null, estimated_cost_max || null, estimated_timeline || null]
    );
    res.status(201).json({ success: true, data: { id, message: 'Template created' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/recommendation-templates/:id - Update template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { category, title, description, priority, estimated_cost_min, estimated_cost_max, estimated_timeline } = req.body;
    await pool.query(
      `UPDATE recommendation_templates SET category = ?, title = ?, description = ?,
       priority = ?, estimated_cost_min = ?, estimated_cost_max = ?, estimated_timeline = ? WHERE id = ?`,
      [category, title, description || null, priority || 'medium', estimated_cost_min || null, estimated_cost_max || null, estimated_timeline || null, req.params.id]
    );
    res.json({ success: true, data: { message: 'Template updated' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/recommendation-templates/:id - Delete template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM recommendation_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Template deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ========================================

// POST /api/audits/:auditId/recommendations - Add recommendation to audit
router.post('/audits/:auditId/recommendations', authenticateToken, async (req, res) => {
  try {
    const { auditId } = req.params;
    const { category_id, title, description, priority, estimated_cost_min, estimated_cost_max, estimated_timeline } = req.body;
    const id = generateId();
    await pool.query(
      `INSERT INTO audit_recommendations (id, audit_id, category_id, title, description, priority,
       estimated_cost_min, estimated_cost_max, estimated_timeline, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [id, auditId, category_id || null, title, description || null, priority || 'medium',
       estimated_cost_min || null, estimated_cost_max || null, estimated_timeline || null, req.user.userId]
    );
    res.status(201).json({ success: true, data: { id, message: 'Recommendation added' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/recommendations/client/:clientId - List all recommendations for client
router.get('/recommendations/client/:clientId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, a.version as audit_version, a.status as audit_status
       FROM audit_recommendations r
       JOIN business_audits a ON r.audit_id = a.id
       WHERE a.client_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.clientId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/recommendations/client/:clientId error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/recommendations/:id - Update recommendation
router.put('/recommendations/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, estimated_cost_min, estimated_cost_max, estimated_timeline } = req.body;
    await pool.query(
      `UPDATE audit_recommendations SET title = ?, description = ?, priority = ?,
       estimated_cost_min = ?, estimated_cost_max = ?, estimated_timeline = ?, updated_at = NOW() WHERE id = ?`,
      [title, description || null, priority || 'medium', estimated_cost_min || null, estimated_cost_max || null, estimated_timeline || null, req.params.id]
    );
    res.json({ success: true, data: { message: 'Recommendation updated' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/recommendations/:id/status - Update status (accept/decline/complete)
router.put('/recommendations/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'declined', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be: ' + validStatuses.join(', ') });
    }

    const extraFields = status === 'completed' ? ', completed_at = NOW()' : '';
    await pool.query(
      `UPDATE audit_recommendations SET status = ?${extraFields}, updated_at = NOW() WHERE id = ?`,
      [status, req.params.id]
    );
    res.json({ success: true, data: { message: 'Status updated to ' + status } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/recommendations/:id - Delete recommendation
router.delete('/recommendations/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM audit_recommendations WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Recommendation deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ========================================

// GET /api/recommendations/:id/threads - List threads
router.get('/recommendations/:id/threads', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM recommendation_threads WHERE recommendation_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/recommendations/:id/threads error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/recommendations/:id/threads - Add thread message
router.post('/recommendations/:id/threads', authenticateToken, async (req, res) => {
  try {
    const { message, author_type } = req.body;
    const id = generateId();
    await pool.query(
      `INSERT INTO recommendation_threads (id, recommendation_id, message, author_type, author_id, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, req.params.id, message, author_type || 'admin', req.user.userId]
    );
    res.status(201).json({ success: true, data: { id, message: 'Thread message added' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
