import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
const SALT_ROUNDS = 12;

// GET /api/users — List all users (admin/manager only)
router.get('/', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, display_name AS name, email, status, created_at AS "createdAt", last_login AS "lastLogin" FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[users] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id — Get single user
router.get('/:id', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, display_name AS name, email, status, created_at AS "createdAt", last_login AS "lastLogin" FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[users] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users — Create user (admin only)
router.post('/', authenticateToken, requireRole('owner', 'admin'), async (req: any, res: Response): Promise<void> => {
  try {
    const { username, password, role, displayName, email } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    // Check if username exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Role hierarchy: only owner can assign owner/admin roles
    if ((role === 'owner' || role === 'admin') && req.user?.role !== 'owner') {
      res.status(403).json({ error: 'Only the owner can assign owner or admin roles' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const validRoles = ['owner', 'admin', 'manager', 'sales', 'accountant', 'it', 'developer', 'analyst'];
    const userRole = validRoles.includes(role) ? role : 'developer';

    const id = generateId();
    const resolvedName = displayName || (req.body as any).name || username;
    await pool.query(
      `INSERT INTO users (id, username, password_hash, role, name, display_name, email, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [id, username, passwordHash, userRole, resolvedName, resolvedName, email || null]
    );

    res.status(201).json({
      id,
      username,
      role: userRole,
      displayName: displayName || username,
      email: email || null,
    });
  } catch (err) {
    console.error('[users] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id — Update user
router.put('/:id', authenticateToken, requireRole('owner', 'admin'), async (req: any, res: Response): Promise<void> => {
  try {
    // Look up target user to enforce role hierarchy
    const [target] = await pool.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
    if (target.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Only owner can edit owner accounts
    if (target[0].role === 'owner' && req.user?.role !== 'owner') {
      res.status(403).json({ error: 'Only the owner can modify owner accounts' });
      return;
    }
    // Admin can't edit other admins (only owner can)
    if (target[0].role === 'admin' && req.user?.role === 'admin' && req.user?.userId !== req.params.id) {
      res.status(403).json({ error: 'Admins cannot modify other admin accounts' });
      return;
    }

    const { username, password, role, displayName, name, email, status } = req.body;

    // Only owner can assign owner/admin roles
    if ((role === 'owner' || role === 'admin') && req.user?.role !== 'owner') {
      res.status(403).json({ error: 'Only the owner can assign owner or admin roles' });
      return;
    }

    const validRoles = ['owner', 'admin', 'manager', 'sales', 'accountant', 'it', 'developer', 'analyst'];
    const userRole = validRoles.includes(role) ? role : undefined; // undefined = keep existing role via COALESCE
    const resolvedName = displayName || name; // frontend sends "name", accept both

    // Handle password update if provided (raw plaintext from admin — hash it)
    if (password) {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.params.id]);
    }

    await pool.query(
      `UPDATE users SET username = COALESCE(?, username), role = COALESCE(?, role),
       display_name = COALESCE(?, display_name), email = COALESCE(?, email),
       status = COALESCE(?, status), updated_at = NOW() WHERE id = ?`,
      [username, userRole, resolvedName, email, status, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error('[users] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/password — Change password
router.put('/:id/password', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    // Only admin or the user themselves can change password
    if (req.user?.role !== 'admin' && req.user?.userId !== req.params.id) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    // If not admin, verify current password
    if (req.user?.role !== 'admin') {
      const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.params.id]);
      if (users.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!valid) {
        res.status(401).json({ error: 'Current password incorrect' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, req.params.id]);

    res.json({ message: 'Password changed' });
  } catch (err) {
    console.error('[users] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id — Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('owner', 'admin'), async (req: any, res: Response): Promise<void> => {
  try {
    // Prevent deleting yourself
    if (req.user?.userId === req.params.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[users] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
