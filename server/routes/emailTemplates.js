import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/email-templates — List all email templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM email_templates ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/email-templates/:id — Get single template
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/email-templates — Create template
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    const [result] = await pool.query(
      'INSERT INTO email_templates (name, subject, body, category, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, subject, body, category || 'general']
    );
    res.status(201).json({ id: result.insertId, message: 'Template created' });
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/email-templates/:id — Update template
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    await pool.query(
      'UPDATE email_templates SET name = ?, subject = ?, body = ?, category = ?, updated_at = NOW() WHERE id = ?',
      [name, subject, body, category, req.params.id]
    );
    res.json({ message: 'Template updated' });
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/email-templates/:id — Delete template
router.delete('/:id', authenticateToken, requireRole('owner', 'admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM email_templates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Template deleted' });
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
