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

    const [users] = await // @ts-ignore
  pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    const user = Array.isArray(users) && users.length > 0 ? users[0] as any : null;
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.username, user.role);

    // Store refresh token
    await // @ts-ignore
  pool.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [generateId(), user.id, refreshToken]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      },
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
    const [tokens] = await // @ts-ignore
  pool.query(
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
    const [users] = await // @ts-ignore
  pool.query(
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
      await // @ts-ignore
  pool.query(
        'DELETE FROM refresh_tokens WHERE token = ? OR user_id = ?',
        [refreshToken, req.user?.id]
      );
    } else {
      // Invalidate all tokens for this user
      await // @ts-ignore
  pool.query(
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

export default router;