import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload, setUploadType } from '../middleware/upload.js';
import { generateId } from '../utils/generateId.js';

const SALT_ROUNDS = 12;

const router = Router();

/** Map DB snake_case row to frontend camelCase */
function mapClientRow(row) {
  const mapped = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    businessName: row.business_name,
    businessAddress: row.business_address,
    street: row.street,
    city: row.city,
    state: row.state,
    zip: row.zip,
    dateOfBirth: row.date_of_birth,
    profileComplete: !!row.profile_complete,
    tier: row.tier,
    status: row.status,
    source: row.source,
    sourceProspectId: row.source_prospect_id,
    onboarding: typeof row.onboarding === 'string' ? JSON.parse(row.onboarding) : row.onboarding,
    hasPassword: !!row.password_hash,
    mustChangePassword: !!row.must_change_password,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by,
  };
  // Carry through any related data already attached
  if (row.notes) mapped.notes = row.notes;
  if (row.tags) mapped.tags = row.tags;
  if (row.documents) mapped.documents = row.documents;
  if (row.projects) {
    mapped.projects = row.projects.map(p => ({
      id: p.id,
      clientId: p.client_id,
      title: p.title || p.name,
      description: p.description || '',
      status: p.status,
      progress: p.progress || 0,
      startDate: p.start_date || null,
      dueDate: p.due_date || null,
      endDate: p.end_date || null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      tasks: p.tasks || [],
      milestones: p.milestones || [],
      developers: p.developers || [],
    }));
  }
  return mapped;
}

// GET /api/clients — List all clients with related data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, business_name, business_address, street, city, state, zip,
              date_of_birth, profile_complete, tier, status, source,
              source_prospect_id, onboarding, password_hash, must_change_password,
              created_at, archived_at, archived_by
       FROM clients ORDER BY created_at DESC`
    );

    // Fetch related data for all clients in parallel
    const clientIds = rows.map(r => r.id);
    if (clientIds.length > 0) {
      const placeholders = clientIds.map(() => '?').join(',');
      const [allNotes, allTags, allDocs, allProjects] = await Promise.all([
        pool.query(`SELECT * FROM client_notes WHERE client_id IN (${placeholders}) ORDER BY created_at DESC`, clientIds),
        pool.query(`SELECT client_id, tag FROM client_tags WHERE client_id IN (${placeholders})`, clientIds),
        pool.query(`SELECT * FROM client_documents WHERE client_id IN (${placeholders}) ORDER BY created_at DESC`, clientIds),
        pool.query(`SELECT * FROM projects WHERE client_id IN (${placeholders}) ORDER BY created_at DESC`, clientIds),
      ]);

      const notesMap = {};
      for (const n of allNotes[0]) { (notesMap[n.client_id] ||= []).push(n); }
      const tagsMap = {};
      for (const t of allTags[0]) { (tagsMap[t.client_id] ||= []).push(t.tag); }
      const docsMap = {};
      for (const d of allDocs[0]) { (docsMap[d.client_id] ||= []).push(d); }
      const projMap = {};
      for (const p of allProjects[0]) { (projMap[p.client_id] ||= []).push(p); }

      for (const row of rows) {
        row.notes = notesMap[row.id] || [];
        row.tags = tagsMap[row.id] || [];
        row.documents = docsMap[row.id] || [];
        row.projects = projMap[row.id] || [];
      }
    }

    // Map snake_case to camelCase for frontend
    const mapped = rows.map(mapClientRow);
    res.json(mapped);
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/clients/:id — Get single client with related data
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, business_name, business_address, street, city, state, zip,
              date_of_birth, profile_complete, tier, status, source,
              source_prospect_id, onboarding, password_hash, must_change_password,
              created_at, archived_at, archived_by
       FROM clients WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });

    const row = rows[0];

    // Fetch related data in parallel
    const [notes, tags, documents, projects] = await Promise.all([
      pool.query('SELECT * FROM client_notes WHERE client_id = ? ORDER BY created_at DESC', [req.params.id]),
      pool.query('SELECT tag FROM client_tags WHERE client_id = ?', [req.params.id]),
      pool.query('SELECT * FROM client_documents WHERE client_id = ? ORDER BY created_at DESC', [req.params.id]),
      pool.query('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC', [req.params.id]),
    ]);

    row.notes = notes[0];
    row.tags = tags[0].map(t => t.tag);
    row.documents = documents[0];
    row.projects = projects[0];

    res.json(mapClientRow(row));
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Password management (must be before /:id wildcard) ---

// PUT /api/clients/:id/set-password — Admin sets/resets a client password (bcrypt)
router.put('/:id/set-password', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { password, mustChangePassword } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const forceChange = mustChangePassword !== false; // default true for admin-set passwords

    await pool.query(
      'UPDATE clients SET password_hash = ?, must_change_password = ?, updated_at = NOW() WHERE id = ?',
      [hash, forceChange, req.params.id]
    );

    res.json({ message: 'Password set', mustChangePassword: forceChange });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/clients — Create client
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { id: clientId, name, email, phone, businessName, tier, status, source } = req.body;
    const id = clientId || generateId();
    await pool.query(
      `INSERT INTO clients (id, name, email, phone, business_name, tier, status, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, name, email || null, phone || null, businessName || null, tier || 'free', status || 'active', source || 'manual']
    );
    res.status(201).json({ id, message: 'Client created' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:id — Update client (dynamic — only updates sent fields)
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    // Map frontend camelCase keys to DB snake_case columns
    const fieldMap = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      businessName: 'business_name',
      business_name: 'business_name',
      street: 'street',
      city: 'city',
      state: 'state',
      zip: 'zip',
      tier: 'tier',
      status: 'status',
      service: 'service',
      dateOfBirth: 'date_of_birth',
      date_of_birth: 'date_of_birth',
      profileComplete: 'profile_complete',
      profile_complete: 'profile_complete',
      onboarding: 'onboarding',
      mustChangePassword: 'must_change_password',
      must_change_password: 'must_change_password',
    };

    // Build composite business_address from individual fields
    const addressParts = ['street', 'city', 'state', 'zip'];
    const hasAddress = addressParts.some((k) => req.body[k] !== undefined);
    if (hasAddress) {
      const parts = [req.body.street, req.body.city, req.body.state, req.body.zip].filter(Boolean);
      req.body._business_address = parts.join(', ');
      fieldMap._business_address = 'business_address';
    }
    // Also accept direct business_address
    if (req.body.businessAddress !== undefined) {
      fieldMap.businessAddress = 'business_address';
    }

    const setClauses = [];
    const values = [];

    for (const [bodyKey, dbCol] of Object.entries(fieldMap)) {
      if (req.body[bodyKey] !== undefined) {
        let val = req.body[bodyKey];
        // Merge onboarding JSON into existing JSONB column
        if (dbCol === 'onboarding' && typeof val === 'object') {
          setClauses.push(`onboarding = COALESCE(onboarding, '{}'::jsonb) || ?::jsonb`);
          values.push(JSON.stringify(val));
          continue;
        }
        setClauses.push(`${dbCol} = ?`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) {
      return res.json({ message: 'No fields to update' });
    }

    setClauses.push('updated_at = NOW()');
    values.push(req.params.id);

    await pool.query(
      `UPDATE clients SET ${setClauses.join(', ')} WHERE id = ?`,
      values
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
    const id = generateId();
    await pool.query(
      'INSERT INTO client_notes (id, client_id, text, author, created_at) VALUES (?, ?, ?, ?, NOW())',
      [id, req.params.id, text, req.user.username]
    );
    res.status(201).json({ id, message: 'Note added' });
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

    const id = generateId();
    await pool.query(
      `INSERT INTO client_documents (id, client_id, name, type, description, file_path, file_size, mime_type, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, req.params.id, name || file.originalname, type || 'other', description || null, file.path, file.size, file.mimetype, req.user.username]
    );
    res.status(201).json({ id, message: 'Document uploaded' });
  } catch (err) {
    console.error('[clients] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/clients/:id/documents/metadata — Save document metadata (file stored in R2)
router.post('/:id/documents/metadata', authenticateToken, async (req, res) => {
  try {
    const { id: docId, name, type, description, filePath, fileSize, mimeType, uploadedBy } = req.body;
    const id = docId || generateId();
    // Check if doc already exists — update if so, insert if not
    const [existing] = await pool.query('SELECT id FROM client_documents WHERE id = ?', [id]);
    if (existing.length > 0) {
      await pool.query(
        `UPDATE client_documents SET name = ?, description = ?, file_path = ?, file_size = ?, mime_type = ?, updated_at = NOW() WHERE id = ?`,
        [name, description || null, filePath || null, fileSize || 0, mimeType || 'application/pdf', id]
      );
    } else {
      await pool.query(
        `INSERT INTO client_documents (id, client_id, name, type, description, file_path, file_size, mime_type, uploaded_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, req.params.id, name, type || 'other', description || null, filePath || null, fileSize || 0, mimeType || 'application/pdf', uploadedBy || 'System']
      );
    }
    res.status(201).json({ id, message: 'Document metadata saved' });
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
