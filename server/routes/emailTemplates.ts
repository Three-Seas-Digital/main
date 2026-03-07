import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// POST /api/email-templates/send-welcome — Send welcome email to a client
router.post('/send-welcome', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { clientId, customSubject, customBody, tempPassword } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });

    const [clients] = await // @ts-ignore
  pool.query('SELECT * FROM clients WHERE id = ?', [clientId]);
    const clientsArray = Array.isArray(clients) ? clients : [];
    if (clientsArray.length === 0) return res.status(404).json({ error: 'Client not found' });

    const client = clientsArray[0] as any;
    if (!client.email) return res.status(400).json({ error: 'Client has no email address' });

    // Check if email is configured before attempting to send
    const { emailConfig } = await import('../config/email.js');
    if (!emailConfig.apiKey && !emailConfig.smtp.host) {
      return res.json({ success: true, skipped: true, message: 'Email not configured — marked as sent without delivering. Set EMAIL_API_KEY or SMTP_HOST in .env to enable.' });
    }

    const result = await sendWelcomeEmail(client, {
      subject: customSubject || undefined,
      customBody: customBody || undefined,
      tempPassword: tempPassword || undefined,
      hasTempPassword: !!client.must_change_password,
      portalUrl: process.env.APP_URL || undefined,
    });

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('[emailTemplates] send-welcome error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/email-templates — List all email templates
router.get('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query(
      'SELECT * FROM email_templates ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/email-templates/:id — Get single template
router.get('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await // @ts-ignore
  pool.query('SELECT * FROM email_templates WHERE id = ?', [req.params.id]);
    const rowsArray = Array.isArray(rows) ? rows : [];
    if (rowsArray.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(rowsArray[0]);
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/email-templates — Create template
router.post('/', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { name, subject, body, category } = req.body;
    const [result] = await // @ts-ignore
  pool.query(
      'INSERT INTO email_templates (name, subject, body, category, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, subject, body, category || 'general']
    );
    res.status(201).json({ id: (result as any).insertId, message: 'Template created' });
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/email-templates/:id — Update template
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { name, subject, body, category } = req.body;
    await // @ts-ignore
  pool.query(
      'UPDATE email_templates SET name = ?, subject = ?, body = ?, category = ?, updated_at = NOW() WHERE id = ?',
      [name, subject, body, category, req.params.id]
    );
    res.json({ message: 'Template updated' });
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/email-templates/:id — Delete template
router.delete('/:id', authenticateToken, requireRole('owner', 'admin'), async (req: any, res: Response) => {
  try {
    await // @ts-ignore
  pool.query('DELETE FROM email_templates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Template deleted' });
  } catch (err) {
    console.error('[emailTemplates] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
