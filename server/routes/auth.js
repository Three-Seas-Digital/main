import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { authenticateToken, generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { generateId } from '../utils/generateId.js';

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/auth/login — Admin/staff login
router.post('/login', loginRateLimit(5, 60000), async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [users] = await pool.query(
      'SELECT id, username, password_hash, role, display_name, email, status FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      req.trackFailedAttempt();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      req.trackFailedAttempt();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear rate limit on success
    req.clearAttempts();

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      userType: 'admin',
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Store refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?',
      [refreshToken, user.id]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.display_name,
        displayName: user.display_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register — Register new admin/staff user (requires admin)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only admins can register new users' });
    }

    const { username, password, role, displayName, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if username already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const validRoles = ['owner', 'admin', 'manager', 'sales', 'accountant', 'it', 'developer', 'analyst'];
    const userRole = validRoles.includes(role) ? role : 'developer';

    const id = generateId();
    await pool.query(
      `INSERT INTO users (id, username, password_hash, role, name, display_name, email, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [id, username, passwordHash, userRole, displayName || username, displayName || username, email || null]
    );

    res.status(201).json({
      id,
      username,
      role: userRole,
      displayName: displayName || username,
      email: email || null,
    });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/setup — Check if first-run setup is needed (no auth required)
router.get('/setup', async (req, res) => {
  try {
    const [admins] = await pool.query(
      "SELECT id FROM users WHERE role IN ('admin', 'owner') LIMIT 1"
    );
    res.json({ needsSetup: admins.length === 0 });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/setup — First-run admin creation (no auth required)
router.post('/setup', async (req, res) => {
  try {
    // Check if any admin user already exists
    const [admins] = await pool.query(
      "SELECT id FROM users WHERE role IN ('admin', 'owner') LIMIT 1"
    );

    if (admins.length > 0) {
      return res.status(403).json({ error: 'Admin already exists. Use login instead.' });
    }

    const { username, password, displayName, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const id = generateId();
    await pool.query(
      `INSERT INTO users (id, username, password_hash, role, name, display_name, email, status, created_at)
       VALUES (?, ?, ?, 'admin', ?, ?, ?, 'active', NOW())`,
      [id, username, passwordHash, displayName || username, displayName || username, email || null]
    );

    // Auto-login the new admin
    const tokenPayload = {
      userId: id,
      username,
      role: 'admin',
      userType: 'admin',
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    await pool.query(
      'UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?',
      [refreshToken, id]
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id,
        username,
        role: 'admin',
        displayName: displayName || username,
        email: email || null,
      },
    });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/change-password — Change own password (any authenticated user)
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const [users] = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout — Clear refresh token
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = ?',
      [req.user.userId]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me — Get current user from JWT
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, role, display_name, email, status, created_at, last_login FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.display_name,
      displayName: user.display_name,
      email: user.email,
      status: user.status,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/refresh — Refresh access token using refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Check that the refresh token matches what's stored
    const [users] = await pool.query(
      'SELECT id, username, role, refresh_token FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || users[0].refresh_token !== refreshToken) {
      return res.status(403).json({ error: 'Refresh token revoked or invalid' });
    }

    const user = users[0];
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      userType: 'admin',
    };

    const tokens = generateTokens(tokenPayload);

    // Update stored refresh token (rotation)
    await pool.query(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [tokens.refreshToken, user.id]
    );

    res.json(tokens);
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
