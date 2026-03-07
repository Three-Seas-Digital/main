import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { authenticateClient, generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { generateId } from '../utils/generateId.js';
import { sendVerificationEmail } from '../services/emailService.js';

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/client-auth/login — Client login
router.post('/login', loginRateLimit(5, 60000), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const [clients] = await pool.query(
      'SELECT id, name, email, password_hash, status, tier, business_name, must_change_password, email_verified, source FROM clients WHERE email = ?',
      [email]
    );

    if (clients.length === 0) {
      req.trackFailedAttempt?.();
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const client = clients[0];

    // Block unverified self-registered clients
    if (client.source === 'signup' && client.email_verified === false) {
      res.status(403).json({ error: 'Please verify your email address before signing in. Check your inbox for the verification link.', code: 'EMAIL_NOT_VERIFIED' });
      return;
    }

    if (client.status === 'pending') {
      res.status(403).json({ error: 'Account pending approval' });
      return;
    }

    if (client.status === 'rejected' || client.status === 'archived') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    // Debug: log password hash status
    console.log('[clientAuth] Login attempt:', { email, hasHash: !!client.password_hash, hashPrefix: client.password_hash?.substring(0, 7), status: client.status, source: client.source });

    if (!client.password_hash) {
      req.trackFailedAttempt?.();
      res.status(401).json({ error: 'No password set for this account. Contact admin.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, client.password_hash);
    if (!validPassword) {
      req.trackFailedAttempt?.();
      console.log('[clientAuth] Password mismatch for:', email);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Clear rate limit on success
    req.clearAttempts?.();

    // For clients, use clientId as the identifier and email as username
    const { accessToken, refreshToken } = generateTokens(client.id, client.email, 'client');

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
        mustChangePassword: !!client.must_change_password,
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
      res.status(400).json({ error: 'Name, email, and password required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM clients WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const validTiers = ['free', 'basic', 'premium', 'enterprise'];
    const clientTier = validTiers.includes(tier) ? tier : 'free';

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const id = generateId();
    await pool.query(
      `INSERT INTO clients (id, name, email, password_hash, phone, business_name, tier, status, source, email_verified, email_verification_token, email_verification_sent_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'signup', FALSE, ?, NOW(), NOW())`,
      [id, name, email, passwordHash, phone || null, businessName || null, clientTier, verificationToken]
    );

    // Send verification email (non-blocking)
    sendVerificationEmail({ name, email }, verificationToken).catch((err) => {
      console.error('[clientAuth] Verification email failed:', err.message);
    });

    res.status(201).json({
      id,
      name,
      email,
      status: 'pending',
      tier: clientTier,
      message: 'Registration submitted. Please check your email to verify your address.',
    });
  } catch (err) {
    console.error('[clientAuth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/client-auth/verify-email — Verify email via token
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ error: 'Verification token required' });
      return;
    }

    const [clients] = await pool.query(
      'SELECT id, name, email, email_verified, email_verification_sent_at FROM clients WHERE email_verification_token = ?',
      [token]
    );

    if (clients.length === 0) {
      res.status(400).json({ error: 'Invalid or expired verification link' });
      return;
    }

    const client = clients[0];

    if (client.email_verified) {
      res.json({ message: 'Email already verified', alreadyVerified: true });
      return;
    }

    // Check if token is expired (24 hours)
    if (client.email_verification_sent_at) {
      const sentAt = new Date(client.email_verification_sent_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        res.status(400).json({ error: 'Verification link has expired. Please request a new one.', code: 'TOKEN_EXPIRED' });
        return;
      }
    }

    await pool.query(
      'UPDATE clients SET email_verified = TRUE, email_verification_token = NULL, updated_at = NOW() WHERE id = ?',
      [client.id]
    );

    res.json({ message: 'Email verified successfully! Your account is pending admin approval.', verified: true });
  } catch (err) {
    console.error('[clientAuth] verify-email error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/client-auth/resend-verification — Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const [clients] = await pool.query(
      'SELECT id, name, email, email_verified FROM clients WHERE email = ?',
      [email]
    );

    if (clients.length === 0) {
      // Don't reveal whether email exists
      res.json({ message: 'If that email is registered, a verification link has been sent.' });
      return;
    }

    const client = clients[0];

    if (client.email_verified) {
      res.json({ message: 'Email is already verified.' });
      return;
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE clients SET email_verification_token = ?, email_verification_sent_at = NOW() WHERE id = ?',
      [newToken, client.id]
    );

    sendVerificationEmail(client, newToken).catch((err) => {
      console.error('[clientAuth] Resend verification email failed:', err.message);
    });

    res.json({ message: 'If that email is registered, a verification link has been sent.' });
  } catch (err) {
    console.error('[clientAuth] resend-verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/client-auth/logout — Clear client refresh token
router.post('/logout', authenticateClient, async (req, res) => {
  try {
    await pool.query(
      'UPDATE clients SET refresh_token = NULL WHERE id = ?',
      [req.client?.clientId]
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
      `SELECT id, name, email, phone, business_name, tier, status, source, must_change_password, created_at, last_login
       FROM clients WHERE id = ?`,
      [req.client?.clientId]
    );

    if (clients.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
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
      mustChangePassword: !!client.must_change_password,
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
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      res.status(403).json({ error: 'Invalid refresh token' });
      return;
    }

    if (decoded.userType !== 'client') {
      res.status(403).json({ error: 'Invalid token type' });
      return;
    }

    const [clients] = await pool.query(
      'SELECT id, email, refresh_token FROM clients WHERE id = ?',
      [decoded.clientId]
    );

    if (clients.length === 0 || clients[0].refresh_token !== refreshToken) {
      res.status(403).json({ error: 'Refresh token revoked or invalid' });
      return;
    }

    const client = clients[0];
    // For clients, use clientId as the identifier and email as username
    const tokens = generateTokens(client.id, client.email, 'client');

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

// PUT /api/client-auth/change-password — Client changes their own password
router.put('/change-password', authenticateClient, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new passwords required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    const [clients] = await pool.query(
      'SELECT id, password_hash FROM clients WHERE id = ?',
      [req.client?.clientId]
    );

    if (clients.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, clients[0].password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      'UPDATE clients SET password_hash = ?, must_change_password = false, updated_at = NOW() WHERE id = ?',
      [hash, req.client?.clientId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('[clientAuth] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
