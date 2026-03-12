import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload, setUploadType } from '../middleware/upload.js';
import { generateId } from '../utils/generateId.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/expenses — List all expenses
router.get('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response) => {
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
router.get('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    const rowsArray = Array.isArray(rows) ? rows : [];
    if (rowsArray.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(rowsArray[0]);
  } catch (err) {
    console.error('[expenses] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/expenses — Create expense (with optional receipt upload)
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), setUploadType('receipt'), upload.single('receipt'), async (req: any, res: Response) => {
  try {
    const { id: bodyId, description, amount, category, date, vendor, notes } = req.body;
    const id = bodyId || generateId();
    const receiptPath = req.file ? req.file.path : null;

    await pool.query(
      `INSERT INTO expenses (id, description, amount, category, date, vendor, notes, receipt_path, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, description, amount, category, date || new Date().toISOString().split('T')[0], vendor || null, notes || null, receiptPath, req.user?.id]
    );
    res.status(201).json({ id, message: 'Expense created' });
  } catch (err) {
    console.error('[expenses] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/expenses/:id — Update expense
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response) => {
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
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'accountant'), async (req: any, res: Response) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('[expenses] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
