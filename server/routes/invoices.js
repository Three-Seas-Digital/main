import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/invoices — List all invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM invoices ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id — Get single invoice
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices — Create invoice
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { clientId, amount, description, dueDate, status, recurring, frequency } = req.body;
    const [result] = await pool.query(
      `INSERT INTO invoices (client_id, amount, description, due_date, status, recurring, frequency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [clientId, amount, description || null, dueDate || null, status || 'pending', recurring || false, frequency || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Invoice created' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id — Update invoice
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { amount, description, dueDate, status, recurring, frequency } = req.body;
    await pool.query(
      `UPDATE invoices SET amount = ?, description = ?, due_date = ?, status = ?,
       recurring = ?, frequency = ?, updated_at = NOW() WHERE id = ?`,
      [amount, description, dueDate, status, recurring, frequency, req.params.id]
    );
    res.json({ message: 'Invoice updated' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/invoices/:id — Delete invoice
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    // Also remove associated payment record
    await pool.query('DELETE FROM payments WHERE invoice_id = ?', [req.params.id]);
    await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id/mark-paid — Mark invoice as paid and create payment record
router.put('/:id/mark-paid', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    // Get invoice details
    const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (invoices.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = invoices[0];

    // Update invoice status
    await pool.query(
      "UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    // Create payment record
    await pool.query(
      `INSERT INTO payments (client_id, invoice_id, amount, method, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [invoice.client_id, invoice.id, invoice.amount, paymentMethod || 'other']
    );

    res.json({ message: 'Invoice marked as paid' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id/unmark-paid — Reverse paid status
router.put('/:id/unmark-paid', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    await pool.query(
      "UPDATE invoices SET status = 'pending', paid_at = NULL, updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    // Remove associated payment
    await pool.query('DELETE FROM payments WHERE invoice_id = ?', [req.params.id]);
    res.json({ message: 'Invoice payment reversed' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices/:id/generate-recurring — Generate next recurring invoice
router.post('/:id/generate-recurring', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (invoices.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = invoices[0];
    if (!invoice.recurring) {
      return res.status(400).json({ error: 'Invoice is not recurring' });
    }

    // Calculate next due date based on frequency
    const nextDueDate = calculateNextDueDate(invoice.due_date, invoice.frequency);

    const [result] = await pool.query(
      `INSERT INTO invoices (client_id, amount, description, due_date, status, recurring, frequency, parent_invoice_id, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, NOW())`,
      [invoice.client_id, invoice.amount, invoice.description, nextDueDate, invoice.recurring, invoice.frequency, invoice.id]
    );

    res.status(201).json({ id: result.insertId, message: 'Recurring invoice generated' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

function calculateNextDueDate(currentDate, frequency) {
  const date = new Date(currentDate);
  switch (frequency) {
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'biweekly': date.setDate(date.getDate() + 14); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'quarterly': date.setMonth(date.getMonth() + 3); break;
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    default: date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
}

export default router;
