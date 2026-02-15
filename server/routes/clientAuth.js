import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { authenticateClient, generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/client-auth/login — Client login
router.post('/login', loginRateLimit(5, 60000), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const [clients] = await pool.query(
      'SELECT id, name, email, password_hash, status, tier, business_name FROM clients WHERE email = ?',
      [email]
    );

    if (clients.length === 0) {
      req.trackFailedAttempt();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const client = clients[0];

    if (client.status === 'pending') {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    if (client.status === 'rejected' || client.status === 'archived') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    const validPassword = await bcrypt.compare(password, client.password_hash);
    if (!validPassword) {
      req.trackFailedAttempt();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear rate limit on success
    req.clearAttempts();

    const tokenPayload = {
      clientId: client.id,
      email: client.email,
      userType: 'client',
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Store refresh token
    await pool.query(
      'UPDATE clients SET refresh_token = ?, last_login = NOW() WHERE id = ?',
      [refreshToken, client.id]
    );

    res.json({
      accessToken,
      refreshToken,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        status: client.status,
        tier: client.tier,
        businessName: client.business_name,
      },
    });
  } catch (err) {
    console.error('[clientAuth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/client-auth/register — Client self-registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, businessName, tier } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM clients WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const validTiers = ['starter', 'business', 'premium', 'enterprise'];
    const clientTier = validTiers.includes(tier) ? tier : 'starter';

    const [result] = await pool.query(
      `INSERT INTO clients (name, email, password_hash, phone, business_name, tier, status, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'self-registration', NOW())`,
      [name, email, passwordHash, phone || null, businessName || null, clientTier]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      status: 'pending',
      tier: clientTier,
      message: 'Registration submitted. Awaiting admin approval.',
    });
  } catch (err) {
    console.error('[clientAuth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/client-auth/logout — Clear client refresh token
router.post('/logout', authenticateClient, async (req, res) => {
  try {
    await pool.query(
      'UPDATE clients SET refresh_token = NULL WHERE id = ?',
      [req.client.clientId]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[clientAuth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/client-auth/me — Get current client from JWT
router.get('/me', authenticateClient, async (req, res) => {
  try {
    const [clients] = await pool.query(
      `SELECT id, name, email, phone, business_name, tier, status, source, created_at, last_login
       FROM clients WHERE id = ?`,
      [req.client.clientId]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = clients[0];
    res.json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      businessName: client.business_name,
      tier: client.tier,
      status: client.status,
      source: client.source,
      createdAt: client.created_at,
      lastLogin: client.last_login,
    });
  } catch (err) {
    console.error('[clientAuth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/client-auth/refresh — Refresh client access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    if (decoded.userType !== 'client') {
      return res.status(403).json({ error: 'Invalid token type' });
    }

    const [clients] = await pool.query(
      'SELECT id, email, refresh_token FROM clients WHERE id = ?',
      [decoded.clientId]
    );

    if (clients.length === 0 || clients[0].refresh_token !== refreshToken) {
      return res.status(403).json({ error: 'Refresh token revoked or invalid' });
    }

    const client = clients[0];
    const tokenPayload = {
      clientId: client.id,
      email: client.email,
      userType: 'client',
    };

    const tokens = generateTokens(tokenPayload);

    // Rotate refresh token
    await pool.query(
      'UPDATE clients SET refresh_token = ? WHERE id = ?',
      [tokens.refreshToken, client.id]
    );

    res.json(tokens);
  } catch (err) {
    console.error('[clientAuth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
