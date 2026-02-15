import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/appointments — List all appointments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM appointments ORDER BY date ASC, time ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[appointments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/appointments/:id — Get single appointment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    // Fetch follow-up notes
    const [notes] = await pool.query(
      'SELECT * FROM appointment_notes WHERE appointment_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    rows[0].followUpNotes = notes;

    res.json(rows[0]);
  } catch (err) {
    console.error('[appointments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/appointments — Create appointment
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req, res) => {
  try {
    const { clientName, email, phone, date, time, type, notes, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO appointments (client_name, email, phone, date, time, type, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [clientName, email || null, phone || null, date, time, type || 'consultation', notes || null, status || 'pending']
    );
    res.status(201).json({ id: result.insertId, message: 'Appointment created' });
  } catch (err) {
    console.error('[appointments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/appointments/:id — Update appointment
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req, res) => {
  try {
    const { clientName, email, phone, date, time, type, notes, status } = req.body;
    await pool.query(
      `UPDATE appointments SET client_name = ?, email = ?, phone = ?, date = ?, time = ?,
       type = ?, notes = ?, status = ?, updated_at = NOW() WHERE id = ?`,
      [clientName, email, phone, date, time, type, notes, status, req.params.id]
    );
    res.json({ message: 'Appointment updated' });
  } catch (err) {
    console.error('[appointments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/appointments/:id — Delete appointment
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req, res) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    console.error('[appointments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Follow-up notes ---

// POST /api/appointments/:id/follow-up-notes — Add follow-up note
router.post('/:id/follow-up-notes', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req, res) => {
  try {
    const { text } = req.body;
    const [result] = await pool.query(
      'INSERT INTO appointment_notes (appointment_id, text, author, created_at) VALUES (?, ?, ?, NOW())',
      [req.params.id, text, req.user.username]
    );
    res.status(201).json({ id: result.insertId, message: 'Follow-up note added' });
  } catch (err) {
    console.error('[appointments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/appointments/:id/status — Update appointment status
router.put('/:id/status', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await pool.query(
      'UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('[appointments] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
