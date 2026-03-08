import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';

const router = express.Router();

// ── Business Hours ──

// GET /api/calendar/hours
router.get('/hours', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
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

// PUT /api/calendar/hours
router.put('/hours', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { hours } = req.body;

    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'hours must be an array' });
    }

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

// GET /api/calendar/hours/:userId
router.get('/hours/:userId', authenticateToken, async (req, res) => {
  try {
    const requesterId = req.user?.userId || req.user?.id;
    const { userId } = req.params;
    const role = req.user?.role;

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

// GET /api/calendar/events
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
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

// POST /api/calendar/events
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
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

    const [result] = await db.query(
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

    const [result] = await db.query(
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

// PUT /api/calendar/sharing
router.put('/sharing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { shares } = req.body;

    if (!Array.isArray(shares)) {
      return res.status(400).json({ error: 'shares must be an array' });
    }

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

// GET /api/calendar/team
router.get('/team', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date query param required' });
    }

    const [users] = await db.query(
      "SELECT id, username, display_name, role FROM users WHERE role != 'viewer' ORDER BY display_name"
    );

    const dayOfWeek = new Date(date).getDay();
    const dateStr = date;
    const dayStart = `${dateStr}T00:00:00`;
    const dayEnd = `${dateStr}T23:59:59`;

    const team = [];
    for (const user of users) {
      const [hours] = await db.query(
        'SELECT * FROM business_hours WHERE user_id = ? AND day_of_week = ?',
        [user.id, dayOfWeek]
      );

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

export default router;
