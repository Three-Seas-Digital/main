import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/payments — List all payments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS client_name, c.business_name
       FROM payments p
       LEFT JOIN clients c ON p.client_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[payments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments/:id — Get single payment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS client_name, c.business_name
       FROM payments p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[payments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/payments — Create payment
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { clientId, invoiceId, amount, method, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO payments (client_id, invoice_id, amount, method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [clientId, invoiceId || null, amount, method || 'other', notes || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Payment recorded' });
  } catch (err) {
    console.error('[payments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/payments/:id — Update payment
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { amount, method, notes } = req.body;
    await pool.query(
      'UPDATE payments SET amount = ?, method = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [amount, method, notes, req.params.id]
    );
    res.json({ message: 'Payment updated' });
  } catch (err) {
    console.error('[payments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/payments/:id — Delete payment
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error('[payments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
