import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload, setUploadType } from '../middleware/upload.js';

const router = Router();

// GET /api/expenses — List all expenses
router.get('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM expenses ORDER BY date DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[expenses] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/expenses/:id — Get single expense
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[expenses] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/expenses — Create expense (with optional receipt upload)
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), setUploadType('receipt'), upload.single('receipt'), async (req, res) => {
  try {
    const { description, amount, category, date, vendor, notes } = req.body;
    const receiptPath = req.file ? req.file.path : null;

    const [result] = await pool.query(
      `INSERT INTO expenses (description, amount, category, date, vendor, notes, receipt_path, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [description, amount, category, date || new Date().toISOString().split('T')[0], vendor || null, notes || null, receiptPath, req.user.username]
    );
    res.status(201).json({ id: result.insertId, message: 'Expense created' });
  } catch (err) {
    console.error('[expenses] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/expenses/:id — Update expense
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { description, amount, category, date, vendor, notes } = req.body;
    await pool.query(
      `UPDATE expenses SET description = ?, amount = ?, category = ?, date = ?, vendor = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [description, amount, category, date, vendor, notes, req.params.id]
    );
    res.json({ message: 'Expense updated' });
  } catch (err) {
    console.error('[expenses] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/expenses/:id — Delete expense
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('[expenses] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
