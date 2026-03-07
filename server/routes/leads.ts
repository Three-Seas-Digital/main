import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/leads — List all leads
router.get('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM leads ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[leads] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leads/:id — Get single lead with notes
router.get('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    const rowsArray = Array.isArray(rows) ? rows : [];
    if (rowsArray.length === 0) return res.status(404).json({ error: 'Lead not found' });

    const lead = rowsArray[0] as any;
    const [notes] = await pool.query('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
    lead.notes = notes;

    res.json(lead);
  } catch (err) {
    console.error('[leads] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads — Create lead
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    const { id: bodyId, businessName, address, phone, website, category, status, source } = req.body;
    const id = bodyId || generateId();
    await pool.query(
      `INSERT INTO leads (id, business_name, address, phone, website, category, status, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, businessName, address || null, phone || null, website || null, category || null, status || 'new', source || 'manual']
    );
    res.status(201).json({ id, message: 'Lead created' });
  } catch (err) {
    console.error('[leads] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/leads/:id — Update lead
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    const { businessName, address, phone, website, category, status, source } = req.body;
    await pool.query(
      `UPDATE leads SET business_name = ?, address = ?, phone = ?, website = ?, category = ?,
       status = ?, source = ?, updated_at = NOW() WHERE id = ?`,
      [businessName, address, phone, website, category, status, source, req.params.id]
    );
    res.json({ message: 'Lead updated' });
  } catch (err) {
    console.error('[leads] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/leads/:id — Delete lead
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    await pool.query('DELETE FROM lead_notes WHERE lead_id = ?', [req.params.id]);
    await pool.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    console.error('[leads] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notes sub-routes ---

// POST /api/leads/:id/notes — Add note to lead
router.post('/:id/notes', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    const { text } = req.body;
    const noteId = generateId();
    await pool.query(
      'INSERT INTO lead_notes (id, lead_id, text, author, created_at) VALUES (?, ?, ?, ?, NOW())',
      [noteId, req.params.id, text, req.user?.username]
    );
    res.status(201).json({ id: noteId, message: 'Note added' });
  } catch (err) {
    console.error('[leads] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/leads/:id/notes/:noteId — Delete note
router.delete('/:id/notes/:noteId', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response) => {
  try {
    await pool.query('DELETE FROM lead_notes WHERE id = ? AND lead_id = ?', [req.params.noteId, req.params.id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('[leads] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
