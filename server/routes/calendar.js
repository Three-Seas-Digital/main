import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';

const router = Router();

// ── Business Hours ──

// GET /api/calendar/hours
router.get('/hours', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const [rows] = await pool.query(
      'SELECT * FROM business_hours WHERE user_id = ? ORDER BY day_of_week',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching business hours:', error);
    res.status(500).json({ error: 'Failed to fetch business hours' });
  }
});

// PUT /api/calendar/hours
router.put('/hours', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { hours } = req.body;

    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'hours must be an array' });
    }

    await pool.query('DELETE FROM business_hours WHERE user_id = ?', [userId]);

    for (const h of hours) {
      await pool.query(
        'INSERT INTO business_hours (user_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)',
        [userId, h.day_of_week, h.start_time, h.end_time, h.is_available]
      );
    }

    res.json({ message: 'Business hours updated' });
  } catch (error) {
    console.error('Error updating business hours:', error);
    res.status(500).json({ error: 'Failed to update business hours' });
  }
});

// GET /api/calendar/hours/:userId
router.get('/hours/:userId', authenticateToken, async (req, res) => {
  try {
    const requesterId = req.user?.userId || req.user?.id;
    const { userId } = req.params;
    const role = req.user?.role;

    if (role !== 'owner' && role !== 'admin') {
      const [sharing] = await pool.query(
        "SELECT access_level FROM calendar_sharing WHERE owner_id = ? AND viewer_id = ? AND access_level != 'none'",
        [userId, requesterId]
      );
      if (!Array.isArray(sharing) || sharing.length === 0) {
        return res.status(403).json({ error: 'No access to this calendar' });
      }
    }

    const [rows] = await pool.query(
      'SELECT * FROM business_hours WHERE user_id = ? ORDER BY day_of_week',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user hours:', error);
    res.status(500).json({ error: 'Failed to fetch user hours' });
  }
});

// ── Calendar Events ──

// GET /api/calendar/events
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required' });
    }

    const [rows] = await pool.query(
      `SELECT e.*, c.name as client_name
       FROM calendar_events e
       LEFT JOIN clients c ON e.client_id = c.id
       WHERE e.user_id = ? AND e.start_time >= ? AND e.end_time <= ?
       ORDER BY e.start_time ASC`,
      [userId, start, end]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/calendar/events
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const id = req.body.id || generateId();
    const { title, description, start_time, end_time, event_type, client_id, all_day, location } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: 'title, start_time, and end_time are required' });
    }

    await pool.query(
      `INSERT INTO calendar_events (id, user_id, title, description, start_time, end_time, event_type, client_id, all_day, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, title, description || null, start_time, end_time, event_type || 'meeting', client_id || null, all_day || false, location || null]
    );

    res.status(201).json({ id, message: 'Event created' });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/calendar/events/:id
router.put('/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;
    const fields = [];
    const values = [];

    const allowed = ['title', 'description', 'start_time', 'end_time', 'event_type', 'client_id', 'all_day', 'location'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push('updated_at = NOW()');
    values.push(id, userId);

    const [result] = await pool.query(
      `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event updated' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/calendar/events/:id
router.delete('/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM calendar_events WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ── Sharing ──

// GET /api/calendar/sharing
router.get('/sharing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const [rows] = await pool.query(
      `SELECT cs.*, u.display_name as viewer_name, u.username as viewer_username
       FROM calendar_sharing cs
       JOIN users u ON cs.viewer_id = u.id
       WHERE cs.owner_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sharing settings:', error);
    res.status(500).json({ error: 'Failed to fetch sharing settings' });
  }
});

// PUT /api/calendar/sharing
router.put('/sharing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { shares } = req.body;

    if (!Array.isArray(shares)) {
      return res.status(400).json({ error: 'shares must be an array' });
    }

    await pool.query('DELETE FROM calendar_sharing WHERE owner_id = ?', [userId]);

    for (const s of shares) {
      if (s.viewer_id && s.access_level && s.access_level !== 'none') {
        const id = generateId();
        await pool.query(
          'INSERT INTO calendar_sharing (id, owner_id, viewer_id, access_level) VALUES (?, ?, ?, ?)',
          [id, userId, s.viewer_id, s.access_level]
        );
      }
    }

    res.json({ message: 'Sharing settings updated' });
  } catch (error) {
    console.error('Error updating sharing:', error);
    res.status(500).json({ error: 'Failed to update sharing settings' });
  }
});

// ── Team View ──

// GET /api/calendar/team
router.get('/team', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date query param required' });
    }

    const [users] = await pool.query(
      "SELECT id, username, display_name, role FROM users WHERE role NOT IN ('pending') ORDER BY display_name"
    );

    const dayOfWeek = new Date(date).getDay();
    const dateStr = date;
    const dayStart = `${dateStr}T00:00:00`;
    const dayEnd = `${dateStr}T23:59:59`;

    const team = [];
    for (const user of users) {
      const [hours] = await pool.query(
        'SELECT * FROM business_hours WHERE user_id = ? AND day_of_week = ?',
        [user.id, dayOfWeek]
      );

      const [events] = await pool.query(
        `SELECT id, title, start_time, end_time, event_type, client_id
         FROM calendar_events
         WHERE user_id = ? AND start_time >= ? AND end_time <= ?
         ORDER BY start_time ASC`,
        [user.id, dayStart, dayEnd]
      );

      team.push({
        user_id: user.id,
        name: user.display_name || user.username,
        role: user.role,
        hours: hours[0] || null,
        events: events,
      });
    }

    res.json(team);
  } catch (error) {
    console.error('Error fetching team availability:', error);
    res.status(500).json({ error: 'Failed to fetch team availability' });
  }
});

// ── Business Hours Overrides (open/close specific dates) ──

// GET /api/calendar/overrides?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/overrides', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { start, end } = req.query;
    let query = 'SELECT * FROM business_hours_overrides WHERE user_id = ?';
    const params = [userId];
    if (start && end) {
      query += ' AND override_date >= ? AND override_date <= ?';
      params.push(start, end);
    }
    query += ' ORDER BY override_date';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching overrides:', error);
    res.status(500).json({ error: 'Failed to fetch overrides' });
  }
});

// POST /api/calendar/overrides
router.post('/overrides', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const id = req.body.id || generateId();
    const { override_date, is_open, start_time, end_time, reason } = req.body;

    if (!override_date) {
      return res.status(400).json({ error: 'override_date is required' });
    }

    await pool.query(
      `INSERT INTO business_hours_overrides (id, user_id, override_date, is_open, start_time, end_time, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, override_date) DO UPDATE SET
         is_open = EXCLUDED.is_open, start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time, reason = EXCLUDED.reason, updated_at = NOW()`,
      [id, userId, override_date, is_open ?? false, start_time || null, end_time || null, reason || null]
    );

    res.status(201).json({ id, message: 'Override saved' });
  } catch (error) {
    console.error('Error saving override:', error);
    res.status(500).json({ error: 'Failed to save override' });
  }
});

// DELETE /api/calendar/overrides/:id
router.delete('/overrides/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;
    const [result] = await pool.query(
      'DELETE FROM business_hours_overrides WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if ((result.affectedRows || result.rowCount || 0) === 0) {
      return res.status(404).json({ error: 'Override not found' });
    }
    res.json({ message: 'Override removed' });
  } catch (error) {
    console.error('Error deleting override:', error);
    res.status(500).json({ error: 'Failed to delete override' });
  }
});

// ── Google Calendar Integration ──

let googleCalendarUtils = null;
try {
  googleCalendarUtils = await import('../utils/googleCalendar.js');
} catch {
  console.warn('[calendar] Google Calendar utils not available — Google sync disabled');
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://threeseasdigital.com';

// GET /api/calendar/google/status
router.get('/google/status', authenticateToken, async (req, res) => {
  try {
    if (!googleCalendarUtils) return res.json({ success: true, data: { connected: false } });
    const userId = req.user?.userId || req.user?.id;
    const status = await googleCalendarUtils.getConnectionStatus(userId);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('GET /calendar/google/status error:', error);
    res.status(500).json({ error: 'Failed to check Google Calendar status' });
  }
});

// GET /api/calendar/google/auth-url
router.get('/google/auth-url', authenticateToken, async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      return res.status(503).json({ error: 'Google Calendar integration is not configured on this server' });
    }
    const userId = req.user?.userId || req.user?.id;
    const url = googleCalendarUtils.getAuthUrl(userId);
    res.json({ success: true, data: { url } });
  } catch (error) {
    console.error('GET /calendar/google/auth-url error:', error);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
});

// GET /api/calendar/google/callback
router.get('/google/callback', async (req, res) => {
  const { code, state: userId, error: oauthError } = req.query;

  if (oauthError) return res.redirect(`${FRONTEND_URL}/admin?google_calendar=denied`);
  if (!code || !userId) return res.redirect(`${FRONTEND_URL}/admin?google_calendar=error&reason=missing_params`);

  try {
    let tokens;
    try {
      tokens = await googleCalendarUtils.handleCallback(code);
    } catch {
      const [existing] = await pool.query('SELECT refresh_token FROM google_calendar_tokens WHERE user_id = ?', [userId]);
      if (!Array.isArray(existing) || existing.length === 0) throw new Error('No refresh token');
      tokens = await googleCalendarUtils.handleCallbackPartial(code, existing[0].refresh_token);
    }

    await pool.query(
      `INSERT INTO google_calendar_tokens (user_id, access_token, refresh_token, token_expiry, updated_at)
       VALUES (?, ?, ?, ?, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
         token_expiry = EXCLUDED.token_expiry, sync_token = NULL, updated_at = NOW()`,
      [userId, tokens.access_token, tokens.refresh_token, tokens.expiry]
    );

    Promise.all([
      googleCalendarUtils.syncEventsFromGoogle(userId),
      googleCalendarUtils.syncEventsToGoogle(userId),
    ]).catch(err => console.error('[googleCalendar] Initial sync failed:', err.message));

    return res.redirect(`${FRONTEND_URL}/admin?google_calendar=connected`);
  } catch (error) {
    console.error('[googleCalendar] Callback error:', error.message);
    return res.redirect(`${FRONTEND_URL}/admin?google_calendar=error&reason=token_exchange`);
  }
});

// POST /api/calendar/google/sync
router.post('/google/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const status = await googleCalendarUtils.getConnectionStatus(userId);
    if (!status.connected) return res.status(400).json({ error: 'Google Calendar is not connected' });

    const [fromGoogle, toGoogle] = await Promise.all([
      googleCalendarUtils.syncEventsFromGoogle(userId),
      googleCalendarUtils.syncEventsToGoogle(userId),
    ]);

    res.json({ success: true, data: { fromGoogle, toGoogle, syncedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('POST /calendar/google/sync error:', error);
    res.status(500).json({ error: 'Sync failed', detail: error.message });
  }
});

// DELETE /api/calendar/google/disconnect
router.delete('/google/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const [result] = await pool.query('DELETE FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    const affected = result.affectedRows || result.rowCount || 0;
    if (affected === 0) return res.status(404).json({ error: 'No Google Calendar connection found' });

    await pool.query("UPDATE calendar_events SET google_event_id = NULL WHERE user_id = ?", [userId]);
    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (error) {
    console.error('DELETE /calendar/google/disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Google Calendar' });
  }
});

export default router;
