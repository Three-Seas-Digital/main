import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { sendInvoiceEmail } from '../services/emailService.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/invoices — List all invoices
router.get('/', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const [rows] = await // @ts-ignore
  pool.query(
      'SELECT * FROM invoices ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id — Get single invoice
router.get('/:id', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const [rows] = await // @ts-ignore
  pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices — Create invoice
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response): Promise<void> => {
  try {
    const { id: bodyId, clientId, amount, title, description, dueDate, status, recurring, frequency } = req.body;
    const id = bodyId || generateId();

    // Validate client exists to prevent FK constraint errors from stale localStorage refs
    if (clientId) {
      const [clientCheck] = await // @ts-ignore
  pool.query('SELECT id FROM clients WHERE id = ?', [clientId]);
      if (clientCheck.length === 0) {
        res.status(400).json({ error: 'Client not found — cannot create invoice for non-existent client' });
        return;
      }
    }

    await // @ts-ignore
  pool.query(
      `INSERT INTO invoices (id, client_id, title, amount, description, due_date, status, recurring, frequency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, clientId, title || description || 'Invoice', amount, description || null, dueDate || null, status || 'pending', recurring || false, frequency || null]
    );
    res.status(201).json({ id, message: 'Invoice created' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id — Update invoice
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response): Promise<void> => {
  try {
    const { amount, description, dueDate, status, recurring, frequency } = req.body;
    await // @ts-ignore
  pool.query(
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
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response): Promise<void> => {
  try {
    // Also remove associated payment record
    await // @ts-ignore
  pool.query('DELETE FROM payments WHERE invoice_id = ?', [req.params.id]);
    await // @ts-ignore
  pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id/mark-paid — Mark invoice as paid and create payment record
router.put('/:id/mark-paid', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response): Promise<void> => {
  try {
    const { paymentMethod } = req.body;

    // Get invoice details
    const [invoices] = await // @ts-ignore
  pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (invoices.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const invoice = invoices[0];

    // Update invoice status
    await // @ts-ignore
  pool.query(
      "UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    // Create payment record
    const paymentId = generateId();
    await // @ts-ignore
  pool.query(
      `INSERT INTO payments (id, client_id, invoice_id, amount, method, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [paymentId, invoice.client_id, invoice.id, invoice.amount, paymentMethod || 'other']
    );

    // Send invoice receipt email (non-blocking)
    const [clients] = await // @ts-ignore
  pool.query('SELECT * FROM clients WHERE id = ?', [invoice.client_id]);
    if (clients.length > 0 && clients[0].email) {
      sendInvoiceEmail(invoice, clients[0], { method: paymentMethod || 'other', created_at: new Date().toISOString() })
        .catch((err: any) => console.error('[invoices] Email send failed:', err.message));
    }

    res.json({ message: 'Invoice marked as paid' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id/unmark-paid — Reverse paid status
router.put('/:id/unmark-paid', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response): Promise<void> => {
  try {
    await // @ts-ignore
  pool.query(
      "UPDATE invoices SET status = 'pending', paid_at = NULL, updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    // Remove associated payment
    await // @ts-ignore
  pool.query('DELETE FROM payments WHERE invoice_id = ?', [req.params.id]);
    res.json({ message: 'Invoice payment reversed' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices/:id/generate-recurring — Generate next recurring invoice
router.post('/:id/generate-recurring', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response): Promise<void> => {
  try {
    const [invoices] = await // @ts-ignore
  pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (invoices.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const invoice = invoices[0];
    if (!invoice.recurring) {
      res.status(400).json({ error: 'Invoice is not recurring' });
      return;
    }

    // Calculate next due date based on frequency
    const nextDueDate = calculateNextDueDate(invoice.due_date, invoice.frequency);

    const newId = generateId();
    await // @ts-ignore
  pool.query(
      `INSERT INTO invoices (id, client_id, title, amount, description, due_date, status, recurring, frequency, parent_invoice_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, NOW())`,
      [newId, invoice.client_id, invoice.title || invoice.description || 'Invoice', invoice.amount, invoice.description, nextDueDate, invoice.recurring, invoice.frequency, invoice.id]
    );

    res.status(201).json({ id: newId, message: 'Recurring invoice generated' });
  } catch (err) {
    console.error('[invoices] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

function calculateNextDueDate(currentDate: string, frequency: string): string {
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
