import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { authenticateToken, generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { generateId } from '../utils/generateId.js';
import { AuthRequest, LoginRequest, RegisterRequest, AuthResponse } from '../types/index.js';

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/auth/login — Admin/staff login
router.post('/login', loginRateLimit(5, 60000), async (req: any, res: Response<AuthResponse>) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password required' 
      });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    const user = Array.isArray(users) && users.length > 0 ? users[0] as any : null;
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.username, user.role);

    // Store refresh token
    await pool.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [generateId(), user.id, refreshToken]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.display_name,
        displayName: user.display_name,
        email: user.email,
        status: user.status,
        createdAt: user.created_at,
      } as any,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// POST /api/auth/refresh — Refresh access token
router.post('/refresh', async (req: any, res: Response<AuthResponse>) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Refresh token required' 
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid refresh token' 
      });
    }

    // Check if refresh token exists in database
    const [tokens] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refreshToken]
    );

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Refresh token expired or invalid' 
      });
    }

    // Get user info
    const [users] = await pool.query(
      'SELECT id, username, role, email FROM users WHERE id = ?',
      [decoded.userId]
    );

    const user = Array.isArray(users) && users.length > 0 ? users[0] as any : null;
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    const { accessToken: newAccessToken } = generateTokens(user.id, user.username, user.role);

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// POST /api/auth/logout — Logout (invalidate refresh token)
router.post('/logout', authenticateToken, async (req: any, res: Response<{success: boolean}>) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query(
        'DELETE FROM refresh_tokens WHERE token = ? OR user_id = ?',
        [refreshToken, req.user?.id]
      );
    } else {
      // Invalidate all tokens for this user
      await pool.query(
        'DELETE FROM refresh_tokens WHERE user_id = ?',
        [req.user?.id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false });
  }
});

// POST /api/auth/register — Register new admin/staff user (requires admin)
router.post('/register', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      res.status(403).json({ error: 'Only admins can register new users' });
      return;
    }

    const { username, password, role, displayName, email } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (Array.isArray(existing) && existing.length > 0) {
      res.status(409).json({ error: 'Username already exists' });
      return;
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

    res.status(201).json({ id, username, role: userRole, displayName: displayName || username, email: email || null });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/setup — Check if first-run setup is needed (no auth required)
router.get('/setup', async (_req: any, res: Response): Promise<void> => {
  try {
    const [admins] = await pool.query("SELECT id FROM users WHERE role IN ('admin', 'owner') LIMIT 1");
    res.json({ needsSetup: !Array.isArray(admins) || admins.length === 0 });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/setup — First-run admin creation (no auth required)
router.post('/setup', async (req: any, res: Response): Promise<void> => {
  try {
    const [admins] = await pool.query("SELECT id FROM users WHERE role IN ('admin', 'owner') LIMIT 1");
    if (Array.isArray(admins) && admins.length > 0) {
      res.status(403).json({ error: 'Admin already exists. Use login instead.' });
      return;
    }

    const { username, password, displayName, email } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = generateId();
    await pool.query(
      `INSERT INTO users (id, username, password_hash, role, name, display_name, email, status, created_at)
       VALUES (?, ?, ?, 'owner', ?, ?, ?, 'active', NOW())`,
      [id, username, passwordHash, displayName || username, displayName || username, email || null]
    );

    const { accessToken, refreshToken } = generateTokens(id, username, 'owner');
    await pool.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [generateId(), id, refreshToken]
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id, username, role: 'owner', displayName: displayName || username, email: email || null },
    });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/change-password — Change own password (any authenticated user)
router.put('/change-password', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password required' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    const [users] = await pool.query('SELECT id, password_hash FROM users WHERE id = ?', [req.user.userId]);
    const user = Array.isArray(users) && users.length > 0 ? users[0] as any : null;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[auth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me — Get current user from JWT
router.get('/me', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, role, display_name, email, status, created_at, last_login FROM users WHERE id = ?',
      [req.user.userId]
    );

    const user = Array.isArray(users) && users.length > 0 ? users[0] as any : null;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

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

export default router;