import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload, setUploadType } from '../middleware/upload.js';
import { generateId } from '../utils/generateId.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/prospects — List all prospects
router.get('/', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM prospects ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/prospects/:id — Get single prospect with notes and documents
router.get('/:id', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM prospects WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Prospect not found' });
      return;
    }

    const prospect = rows[0];

    const [notes] = await pool.query('SELECT * FROM prospect_notes WHERE prospect_id = ? ORDER BY created_at DESC', [req.params.id]);
    const [documents] = await pool.query('SELECT * FROM prospect_documents WHERE prospect_id = ? ORDER BY created_at DESC', [req.params.id]);

    prospect.notes = notes;
    prospect.documents = documents;

    res.json(prospect);
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/prospects — Create prospect
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response): Promise<void> => {
  try {
    const { id: bodyId, businessName, contactName, email, phone, stage, source, notes, estimatedValue } = req.body;
    const id = bodyId || generateId();
    await pool.query(
      `INSERT INTO prospects (id, business_name, contact_name, email, phone, stage, source, notes, estimated_value, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, businessName, contactName || null, email || null, phone || null, stage || 'new', source || 'manual', notes || null, estimatedValue || null]
    );
    res.status(201).json({ id, message: 'Prospect created' });
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/prospects/:id — Update prospect
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response): Promise<void> => {
  try {
    const { businessName, contactName, email, phone, stage, source, notes, estimatedValue, lossReason } = req.body;
    await pool.query(
      `UPDATE prospects SET business_name = ?, contact_name = ?, email = ?, phone = ?, stage = ?,
       source = ?, notes = ?, estimated_value = ?, loss_reason = ?, updated_at = NOW() WHERE id = ?`,
      [businessName, contactName, email, phone, stage, source, notes, estimatedValue, lossReason || null, req.params.id]
    );
    res.json({ message: 'Prospect updated' });
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/prospects/:id — Delete prospect
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response): Promise<void> => {
  try {
    // prospect_notes and prospect_documents have ON DELETE CASCADE
    await pool.query('DELETE FROM prospects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Prospect deleted' });
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notes sub-routes ---

// POST /api/prospects/:id/notes — Add note
router.post('/:id/notes', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const noteId = generateId();
    await pool.query(
      'INSERT INTO prospect_notes (id, prospect_id, text, author, created_at) VALUES (?, ?, ?, ?, NOW())',
      [noteId, req.params.id, text, req.user?.username]
    );
    res.status(201).json({ id: noteId, message: 'Note added' });
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/prospects/:id/notes/:noteId — Delete note
router.delete('/:id/notes/:noteId', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM prospect_notes WHERE id = ? AND prospect_id = ?', [req.params.noteId, req.params.id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Documents sub-routes ---

// POST /api/prospects/:id/documents — Upload document
router.post('/:id/documents', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), setUploadType('document'), upload.single('file'), async (req: any, res: Response): Promise<void> => {
  try {
    const { name, type, description } = req.body;
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'File required' });
      return;
    }

    const docId = generateId();
    await pool.query(
      `INSERT INTO prospect_documents (id, prospect_id, name, type, description, file_path, file_size, mime_type, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [docId, req.params.id, name || file.originalname, type || 'other', description || null, file.path, file.size, file.mimetype, req.user?.username]
    );
    res.status(201).json({ id: docId, message: 'Document uploaded' });
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/prospects/:id/documents/:docId — Delete document
router.delete('/:id/documents/:docId', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM prospect_documents WHERE id = ? AND prospect_id = ?', [req.params.docId, req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Convert to client ---

// POST /api/prospects/:id/convert-to-client — Convert prospect to client
router.post('/:id/convert-to-client', authenticateToken, requireRole('owner', 'admin', 'manager', 'sales'), async (req: any, res: Response): Promise<void> => {
  try {
    const [prospects] = await pool.query('SELECT * FROM prospects WHERE id = ?', [req.params.id]);
    if (prospects.length === 0) {
      res.status(404).json({ error: 'Prospect not found' });
      return;
    }

    const prospect = prospects[0];

    // Create client from prospect data
    const clientId = generateId();
    await pool.query(
      `INSERT INTO clients (id, name, email, phone, business_name, tier, status, source, source_prospect_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 'pipeline', ?, NOW())`,
      [clientId, prospect.contact_name || prospect.business_name, prospect.email, prospect.phone, prospect.business_name, req.body.tier || 'free', prospect.id]
    );

    // Transfer documents
    await pool.query(
      `INSERT INTO client_documents (id, client_id, name, type, description, file_path, file_size, mime_type, uploaded_by, created_at)
       SELECT CONCAT(UNIX_TIMESTAMP(), '-', SUBSTRING(MD5(RAND()), 1, 7)), ?, name, type, description, file_path, file_size, mime_type, uploaded_by, created_at
       FROM prospect_documents WHERE prospect_id = ?`,
      [clientId, req.params.id]
    );

    // Transfer notes
    await pool.query(
      `INSERT INTO client_notes (id, client_id, text, author, created_at)
       SELECT CONCAT(UNIX_TIMESTAMP(), '-', SUBSTRING(MD5(RAND()), 1, 7)), ?, text, author, created_at
       FROM prospect_notes WHERE prospect_id = ?`,
      [clientId, req.params.id]
    );

    // Update prospect stage
    await pool.query(
      "UPDATE prospects SET stage = 'won', updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    res.status(201).json({ clientId, message: 'Prospect converted to client' });
  } catch (err) {
    console.error('[prospects] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
