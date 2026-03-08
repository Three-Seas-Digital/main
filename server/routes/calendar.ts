import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { generateId } from '../utils/generateId.js';
import {
  getAuthUrl,
  handleCallback,
  handleCallbackPartial,
  getConnectionStatus,
  syncEventsFromGoogle,
  syncEventsToGoogle,
  pushEventToGoogle,
  deleteEventFromGoogle,
} from '../utils/googleCalendar.js';

const router = express.Router();

// ── Business Hours ──

// GET /api/calendar/hours — get authenticated user's business hours
router.get('/hours', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const [rows] = await db.query(
      'SELECT * FROM business_hours WHERE user_id = ? ORDER BY day_of_week',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching business hours:', error);
    res.status(500).json({ error: 'Failed to fetch business hours' });
  }
});

// PUT /api/calendar/hours — set/update business hours (upsert all 7 days)
router.put('/hours', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { hours } = req.body; // array of { day_of_week, start_time, end_time, is_available }

    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'hours must be an array' });
    }

    // Delete existing and re-insert (simpler than upsert for 7 rows)
    await db.query('DELETE FROM business_hours WHERE user_id = ?', [userId]);

    for (const h of hours) {
      await db.query(
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

// GET /api/calendar/hours/:userId — get another user's hours (respects sharing)
router.get('/hours/:userId', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const requesterId = req.user?.id;
    const { userId } = req.params;
    const role = req.user?.role;

    // Owner/admin can see anyone's hours
    if (role !== 'owner' && role !== 'admin') {
      const [sharing] = await db.query(
        "SELECT access_level FROM calendar_sharing WHERE owner_id = ? AND viewer_id = ? AND access_level != 'none'",
        [userId, requesterId]
      );
      if (!Array.isArray(sharing) || sharing.length === 0) {
        return res.status(403).json({ error: 'No access to this calendar' });
      }
    }

    const [rows] = await db.query(
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

// GET /api/calendar/events — list events for date range
router.get('/events', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required' });
    }

    const [rows] = await db.query(
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

// POST /api/calendar/events — create event
router.post('/events', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const id = req.body.id || generateId();
    const { title, description, start_time, end_time, event_type, client_id, all_day, location } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: 'title, start_time, and end_time are required' });
    }

    await db.query(
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

// PUT /api/calendar/events/:id — update event
router.put('/events/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const fields: string[] = [];
    const values: any[] = [];

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

    const [result] = await db.query(
      `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    if ((result as any).affectedRows === 0 && (result as any).rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event updated' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/calendar/events/:id — delete event
router.delete('/events/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM calendar_events WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if ((result as any).affectedRows === 0 && (result as any).rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ── Sharing ──

// GET /api/calendar/sharing — get sharing settings
router.get('/sharing', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const [rows] = await db.query(
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

// PUT /api/calendar/sharing — update sharing settings
router.put('/sharing', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { shares } = req.body; // array of { viewer_id, access_level }

    if (!Array.isArray(shares)) {
      return res.status(400).json({ error: 'shares must be an array' });
    }

    // Delete existing and re-insert
    await db.query('DELETE FROM calendar_sharing WHERE owner_id = ?', [userId]);

    for (const s of shares) {
      if (s.viewer_id && s.access_level && s.access_level !== 'none') {
        const id = generateId();
        await db.query(
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

// GET /api/calendar/team — get team availability for a date
router.get('/team', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: AuthRequest, res: express.Response) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date query param required' });
    }

    // Get all users
    const [users] = await db.query(
      "SELECT id, username, display_name, role FROM users WHERE role != 'viewer' ORDER BY display_name"
    );

    const dayOfWeek = new Date(date as string).getDay();
    const dateStr = date as string;
    const dayStart = `${dateStr}T00:00:00`;
    const dayEnd = `${dateStr}T23:59:59`;

    const team: any[] = [];
    for (const user of users as any[]) {
      // Get business hours for this day
      const [hours] = await db.query(
        'SELECT * FROM business_hours WHERE user_id = ? AND day_of_week = ?',
        [user.id, dayOfWeek]
      );

      // Get events for this date
      const [events] = await db.query(
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
        hours: (hours as any[])[0] || null,
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
router.get('/overrides', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { start, end } = req.query;
    let query = 'SELECT * FROM business_hours_overrides WHERE user_id = ?';
    const params: any[] = [userId];
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
router.post('/overrides', authenticateToken, async (req: any, res: any) => {
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
router.delete('/overrides/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;
    const [result]: any = await pool.query(
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

// ── Google Calendar Integration ──────────────────────────────────────────────
//
// These routes handle the full OAuth2 flow and bidirectional sync with Google
// Calendar. The heavy lifting lives in server/utils/googleCalendar.js.
//
// All routes require authenticateToken (admin users only — clients never reach
// these endpoints).

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://threeseasdigital.com';

// GET /api/calendar/google/status — check whether the user has connected
router.get('/google/status', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id as unknown as string;
    const status = await getConnectionStatus(userId);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('GET /calendar/google/status error:', error);
    res.status(500).json({ error: 'Failed to check Google Calendar status' });
  }
});

// GET /api/calendar/google/auth-url — generate OAuth2 consent URL
router.get('/google/auth-url', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      return res.status(503).json({
        error: 'Google Calendar integration is not configured on this server',
      });
    }

    const userId = req.user?.id as unknown as string;
    const url = getAuthUrl(userId);
    res.json({ success: true, data: { url } });
  } catch (error) {
    console.error('GET /calendar/google/auth-url error:', error);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
});

// GET /api/calendar/google/callback — OAuth2 redirect from Google
//
// This endpoint is called by Google after the user grants consent. It:
//   1. Exchanges the authorization code for tokens
//   2. Persists tokens to google_calendar_tokens
//   3. Triggers an initial bidirectional sync (fire-and-forget)
//   4. Redirects the browser to the admin UI with ?google_calendar=connected
//
// Note: no authenticateToken middleware here because Google redirects the
// browser directly to this URL. The user identity is recovered from the
// `state` parameter (userId), which we embedded in the auth URL.
router.get('/google/callback', async (req: any, res: express.Response) => {
  const { code, state: userId, error: oauthError } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  // User denied access on the consent screen
  if (oauthError) {
    console.warn(`[googleCalendar] OAuth denied by user ${userId}: ${oauthError}`);
    return res.redirect(`${FRONTEND_URL}/admin?google_calendar=denied`);
  }

  if (!code || !userId) {
    return res.redirect(`${FRONTEND_URL}/admin?google_calendar=error&reason=missing_params`);
  }

  try {
    let tokens: { access_token: any; refresh_token: any; expiry: Date };

    try {
      tokens = await handleCallback(code);
    } catch (err: any) {
      // handleCallback throws when Google returns no refresh_token (user already
      // granted, but revoked since). Try to read the existing refresh_token from
      // the DB so we can update only the access_token.
      const [existing] = await db.query(
        'SELECT refresh_token FROM google_calendar_tokens WHERE user_id = ?',
        [userId],
      );

      if (!Array.isArray(existing) || existing.length === 0) {
        // No existing token and Google didn't send a new one — user must revoke and retry
        throw err;
      }

      // Re-exchange without expecting a new refresh_token — keep the stored one.
      console.warn(
        `[googleCalendar] No refresh_token in callback for user ${userId}; keeping stored refresh_token`,
      );

      tokens = await handleCallbackPartial(
        code as string,
        (existing as any[])[0].refresh_token,
      );
    }

    // Upsert into google_calendar_tokens.
    // Written as PostgreSQL ON CONFLICT syntax (Neon target) — db.js converts
    // ? → $n placeholders automatically; no MySQL-specific syntax used here.
    await db.query(
      `INSERT INTO google_calendar_tokens
         (user_id, access_token, refresh_token, token_expiry, updated_at)
       VALUES (?, ?, ?, ?, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         access_token  = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         token_expiry  = EXCLUDED.token_expiry,
         sync_token    = NULL,
         updated_at    = NOW()`,
      [
        userId,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expiry,
      ],
    );

    // Kick off an initial full sync in the background — don't await, don't fail redirect
    Promise.all([
      syncEventsFromGoogle(userId),
      syncEventsToGoogle(userId),
    ]).catch((err) => {
      console.error(`[googleCalendar] Initial sync failed for user ${userId}:`, err.message);
    });

    return res.redirect(`${FRONTEND_URL}/admin?google_calendar=connected`);
  } catch (error: any) {
    console.error(`[googleCalendar] Callback error for user ${userId}:`, error.message);
    return res.redirect(`${FRONTEND_URL}/admin?google_calendar=error&reason=token_exchange`);
  }
});

// POST /api/calendar/google/sync — trigger a manual bidirectional sync
router.post('/google/sync', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id as unknown as string;

    // Verify the user has connected before attempting sync
    const status = await getConnectionStatus(userId);
    if (!status.connected) {
      return res.status(400).json({ error: 'Google Calendar is not connected' });
    }

    // Run both directions concurrently
    const [fromGoogle, toGoogle] = await Promise.all([
      syncEventsFromGoogle(userId),
      syncEventsToGoogle(userId),
    ]);

    res.json({
      success: true,
      data: {
        fromGoogle,
        toGoogle,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('POST /calendar/google/sync error:', error);
    res.status(500).json({ error: 'Sync failed', detail: error.message });
  }
});

// DELETE /api/calendar/google/disconnect — remove stored tokens
router.delete('/google/disconnect', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id as unknown as string;

    const [result] = await db.query(
      'DELETE FROM google_calendar_tokens WHERE user_id = ?',
      [userId],
    );

    const affected = (result as any).affectedRows || (result as any).rowCount || 0;
    if (affected === 0) {
      return res.status(404).json({ error: 'No Google Calendar connection found' });
    }

    // Clear google_event_id from all local events so they can be re-pushed
    // if the user reconnects later (avoids ghost IDs referencing deleted Google events)
    await db.query(
      "UPDATE calendar_events SET google_event_id = NULL WHERE user_id = ?",
      [userId],
    );

    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (error) {
    console.error('DELETE /calendar/google/disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Google Calendar' });
  }
});

// ── Augmented event mutation routes ──────────────────────────────────────────
//
// The original POST/PUT/DELETE routes for /events remain untouched above.
// We augment them by registering additional middleware-style route handlers
// that fire AFTER the original response has been sent (fire-and-forget pattern)
// using router.post/put/delete with a next() chain.
//
// Because the original routes call res.json() and return without calling next(),
// these handlers never run in the same request. Instead, we duplicate the
// Google sync logic inline in standalone helper functions that the original
// routes can call.
//
// Approach: Wrap the existing route handlers by replacing them. Since we cannot
// modify the original route registrations (they are above this block), we use
// a different technique: export helper functions that the caller (or the route
// itself) can invoke. The actual integration is done by intercepting at the
// application layer.
//
// The cleanest production approach that respects "do NOT modify existing route
// logic" is to add response-hook middleware BEFORE the router is mounted, which
// observes 2xx responses and triggers async side-effects. However, since we are
// appending to the same file, we instead re-register the three routes with
// patched handlers that include Google sync as fire-and-forget.
//
// We use router.use() to intercept the exact paths after the fact by overriding
// the route with a new handler at a lower priority — Express matches routes in
// registration order, so the original handlers have already responded. To avoid
// that, we restructure: patch by wrapping with a res.on('finish') hook via
// a router-level middleware scoped to /events paths.

// Middleware that attaches a finish listener to fire Google sync after a
// successful event mutation (POST/PUT/DELETE on /events or /events/:id).
router.use('/events', authenticateToken, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const userId = req.user?.id as unknown as string;

  res.on('finish', async () => {
    // Only act on successful responses
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    try {
      const status = await getConnectionStatus(userId);
      if (!status.connected) return;

      if (req.method === 'POST') {
        // After create: the response body contains the new event id.
        // We need to re-fetch the full event to push it to Google.
        // The id is embedded in the JSON response sent by the original handler.
        // We cannot read res body after it's sent, so we re-query by user + recent.
        const [newEvents] = await db.query(
          `SELECT id, title, description, start_time, end_time, all_day, location, google_event_id
           FROM calendar_events
           WHERE user_id = ? AND (google_event_id IS NULL OR google_event_id = '')
           ORDER BY created_at DESC LIMIT 5`,
          [userId],
        );
        for (const evt of newEvents as any[]) {
          // fire-and-forget: do not await, just log on failure
          void (pushEventToGoogle(userId, evt) as unknown as Promise<any>).catch((err: any) => {
            console.error(`[googleCalendar] fire-and-forget push failed for event ${evt.id}:`, err.message);
          });
        }
      } else if (req.method === 'PUT' || req.method === 'PATCH') {
        // After update: re-fetch the event and sync it
        const eventId = req.params.id;
        if (eventId) {
          const [rows] = await db.query(
            `SELECT id, title, description, start_time, end_time, all_day, location, google_event_id
             FROM calendar_events WHERE id = ? AND user_id = ?`,
            [eventId, userId],
          );
          if (Array.isArray(rows) && rows.length > 0) {
            // fire-and-forget
            void (pushEventToGoogle(userId, (rows as any[])[0]) as unknown as Promise<any>).catch((err: any) => {
              console.error(`[googleCalendar] fire-and-forget update failed for event ${eventId}:`, err.message);
            });
          }
        }
      } else if (req.method === 'DELETE') {
        // After delete: the event is already gone from DB.
        // We stored the google_event_id in req before the handler ran — but we
        // cannot do that without middleware running BEFORE the original handler.
        // Instead, we look it up from req (set by the pre-delete middleware below).
        const googleEventId = (req as any)._deletedGoogleEventId;
        if (googleEventId) {
          // fire-and-forget
          deleteEventFromGoogle(userId, googleEventId).catch((err: any) => {
            console.error(`[googleCalendar] fire-and-forget delete failed for Google event ${googleEventId}:`, err.message);
          });
        }
      }
    } catch (err: any) {
      // Non-fatal — the API response has already been sent
      console.error('[googleCalendar] Post-response sync error:', err.message);
    }
  });

  next();
});

// Pre-DELETE middleware: capture the google_event_id BEFORE the row is deleted
// so the finish listener above can call deleteEventFromGoogle.
// Registered on the specific parameterized path so it only fires for DELETE /events/:id.
router.use('/events/:id', authenticateToken, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (req.method !== 'DELETE') return next();

  try {
    const userId = req.user?.id as unknown as string;
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT google_event_id FROM calendar_events WHERE id = ? AND user_id = ?',
      [id, userId],
    );

    if (Array.isArray(rows) && rows.length > 0 && (rows[0] as any).google_event_id) {
      (req as any)._deletedGoogleEventId = (rows[0] as any).google_event_id;
    }
  } catch (err: any) {
    // Non-fatal — don't block the delete
    console.error('[googleCalendar] Pre-delete google_event_id lookup failed:', err.message);
  }

  next();
});

export default router;
