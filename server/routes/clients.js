import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload, setUploadType } from '../middleware/upload.js';

const router = Router();

// GET /api/clients — List all clients
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, business_name, tier, status, source,
              source_prospect_id, created_at, archived_at, archived_by
       FROM clients ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/clients/:id — Get single client with related data
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [clients] = await pool.query(
      `SELECT id, name, email, phone, business_name, tier, status, source,
              source_prospect_id, created_at, archived_at, archived_by
       FROM clients WHERE id = ?`,
      [req.params.id]
    );
    if (clients.length === 0) return res.status(404).json({ error: 'Client not found' });

    const client = clients[0];

    // Fetch related data in parallel
    const [notes] = await pool.query('SELECT * FROM client_notes WHERE client_id = ? ORDER BY created_at DESC', [req.params.id]);
    const [tags] = await pool.query('SELECT tag FROM client_tags WHERE client_id = ?', [req.params.id]);
    const [documents] = await pool.query('SELECT * FROM client_documents WHERE client_id = ? ORDER BY created_at DESC', [req.params.id]);

    client.notes = notes;
    client.tags = tags.map(t => t.tag);
    client.documents = documents;

    res.json(client);
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/clients — Create client
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { name, email, phone, businessName, tier, status, source } = req.body;
    const [result] = await pool.query(
      `INSERT INTO clients (name, email, phone, business_name, tier, status, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, email || null, phone || null, businessName || null, tier || 'starter', status || 'active', source || 'manual']
    );
    res.status(201).json({ id: result.insertId, message: 'Client created' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:id — Update client
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { name, email, phone, businessName, tier, status } = req.body;
    await pool.query(
      `UPDATE clients SET name = ?, email = ?, phone = ?, business_name = ?, tier = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, email, phone, businessName, tier, status, req.params.id]
    );
    res.json({ message: 'Client updated' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/clients/:id — Delete client (hard delete, use archive instead)
router.delete('/:id', authenticateToken, requireRole('owner', 'admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Client deleted' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notes sub-routes ---

// POST /api/clients/:id/notes — Add note to client
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const [result] = await pool.query(
      'INSERT INTO client_notes (client_id, text, author, created_at) VALUES (?, ?, ?, NOW())',
      [req.params.id, text, req.user.username]
    );
    res.status(201).json({ id: result.insertId, message: 'Note added' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/clients/:id/notes/:noteId — Delete note
router.delete('/:id/notes/:noteId', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM client_notes WHERE id = ? AND client_id = ?', [req.params.noteId, req.params.id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Tags sub-routes ---

// POST /api/clients/:id/tags — Add tag to client
router.post('/:id/tags', authenticateToken, async (req, res) => {
  try {
    const { tag } = req.body;
    await pool.query(
      'INSERT IGNORE INTO client_tags (client_id, tag) VALUES (?, ?)',
      [req.params.id, tag]
    );
    res.status(201).json({ message: 'Tag added' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/clients/:id/tags/:tag — Remove tag
router.delete('/:id/tags/:tag', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM client_tags WHERE client_id = ? AND tag = ?', [req.params.id, req.params.tag]);
    res.json({ message: 'Tag removed' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Documents sub-routes ---

// POST /api/clients/:id/documents — Upload document
router.post('/:id/documents', authenticateToken, setUploadType('document'), upload.single('file'), async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'File required' });

    const [result] = await pool.query(
      `INSERT INTO client_documents (client_id, name, type, description, file_path, file_size, mime_type, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [req.params.id, name || file.originalname, type || 'other', description || null, file.path, file.size, file.mimetype, req.user.username]
    );
    res.status(201).json({ id: result.insertId, message: 'Document uploaded' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/clients/:id/documents/:docId — Delete document
router.delete('/:id/documents/:docId', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM client_documents WHERE id = ? AND client_id = ?', [req.params.docId, req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Status sub-routes ---

// PUT /api/clients/:id/approve — Approve pending client
router.put('/:id/approve', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    await pool.query(
      "UPDATE clients SET status = 'active', updated_at = NOW() WHERE id = ? AND status = 'pending'",
      [req.params.id]
    );
    res.json({ message: 'Client approved' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:id/reject — Reject pending client
router.put('/:id/reject', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    await pool.query(
      "UPDATE clients SET status = 'rejected', updated_at = NOW() WHERE id = ? AND status = 'pending'",
      [req.params.id]
    );
    res.json({ message: 'Client rejected' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:id/archive — Archive client (soft delete)
router.put('/:id/archive', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    await pool.query(
      "UPDATE clients SET status = 'archived', archived_at = NOW(), archived_by = ? WHERE id = ?",
      [req.user.username, req.params.id]
    );
    res.json({ message: 'Client archived' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:id/restore — Restore archived client
router.put('/:id/restore', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    await pool.query(
      "UPDATE clients SET status = 'active', archived_at = NULL, archived_by = NULL, updated_at = NOW() WHERE id = ? AND status = 'archived'",
      [req.params.id]
    );
    res.json({ message: 'Client restored' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
