/**
 * AI Scheduling Agent — /api/calendar/agent
 *
 * Two endpoints:
 *   POST /chat    — Natural language → structured AI action proposal
 *   POST /execute — Execute a confirmed action proposal against the DB
 *
 * The agent understands:
 *   create      — Schedule a new event
 *   move        — Reschedule an existing event
 *   cancel      — Delete one or more events
 *   find_slots  — Find available time windows (no DB write)
 *   summary     — Describe the week's schedule (no DB write)
 */

import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { generateJSON } from '../utils/ai.js';
import {
  pushEventToGoogle,
  deleteEventFromGoogle,
  getConnectionStatus,
} from '../utils/googleCalendar.js';

const router = Router();

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Return the Monday of the ISO week containing `date`.
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a JS Date as "YYYY-MM-DD HH:MM" for human-readable AI context.
 */
function fmtDT(dt) {
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Format a JS Date as "YYYY-MM-DD" for day labels.
 */
function fmtDate(dt) {
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Day-of-week name → ISO number (Monday = 1). */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Compute free time slots for a day given business hours and existing events.
 *
 * @param {Date}   dayDate       - The calendar day
 * @param {object} hoursRow      - { start_time: "09:00", end_time: "17:00" }
 * @param {Array}  events        - Array of { start_time, end_time } for that day
 * @param {number} slotMinutes   - Desired slot length in minutes (default 60)
 * @returns {Array<{ start: string, end: string }>} ISO datetime strings
 */
function computeFreeSlots(dayDate, hoursRow, events, slotMinutes = 60) {
  if (!hoursRow || !hoursRow.is_available) return [];

  const dateStr = fmtDate(dayDate);
  const [bh, bm] = hoursRow.start_time.split(':').map(Number);
  const [eh, em] = hoursRow.end_time.split(':').map(Number);

  // Build a timeline in minutes from midnight
  const busStart = bh * 60 + bm;
  const busEnd = eh * 60 + em;

  // Collect busy intervals in minutes
  const busy = events.map((ev) => {
    const s = new Date(ev.start_time);
    const e = new Date(ev.end_time);
    return [s.getHours() * 60 + s.getMinutes(), e.getHours() * 60 + e.getMinutes()];
  });

  // Sort busy intervals
  busy.sort((a, b) => a[0] - b[0]);

  // Walk through business hours finding gaps >= slotMinutes
  const slots = [];
  let cursor = busStart;

  for (const [bs, be] of busy) {
    if (bs > cursor && bs - cursor >= slotMinutes) {
      // Gap before this busy block
      const gapEnd = Math.min(bs, busEnd);
      for (let t = cursor; t + slotMinutes <= gapEnd; t += slotMinutes) {
        slots.push({
          start: `${dateStr}T${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}:00`,
          end: `${dateStr}T${String(Math.floor((t + slotMinutes) / 60)).padStart(2, '0')}:${String((t + slotMinutes) % 60).padStart(2, '0')}:00`,
        });
      }
    }
    if (be > cursor) cursor = be;
  }

  // Gap after all events until end of business
  if (busEnd - cursor >= slotMinutes) {
    for (let t = cursor; t + slotMinutes <= busEnd; t += slotMinutes) {
      slots.push({
        start: `${dateStr}T${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}:00`,
        end: `${dateStr}T${String(Math.floor((t + slotMinutes) / 60)).padStart(2, '0')}:${String((t + slotMinutes) % 60).padStart(2, '0')}:00`,
      });
    }
  }

  return slots;
}

/**
 * Build the system prompt that the AI will use to understand the scheduling
 * context and return a structured JSON action.
 */
function buildSystemPrompt({ now, businessHours, weekEvents, clients }) {
  const nowStr = fmtDT(now);
  const weekStart = getWeekStart(now);

  // Format business hours
  const hoursText = businessHours.length === 0
    ? 'No business hours configured (treat Mon–Fri 09:00–17:00 as defaults).'
    : businessHours.map((h) => {
        const dayName = DAY_NAMES[h.day_of_week] || `Day ${h.day_of_week}`;
        return h.is_available
          ? `  ${dayName}: ${h.start_time} – ${h.end_time}`
          : `  ${dayName}: unavailable`;
      }).join('\n');

  // Format this week's events
  const eventsText = weekEvents.length === 0
    ? 'No events scheduled this week.'
    : weekEvents.map((ev) => {
        const clientPart = ev.client_name ? ` (client: ${ev.client_name})` : '';
        return `  [${ev.id}] ${fmtDT(ev.start_time)} – ${fmtDT(ev.end_time)}: ${ev.title}${clientPart} [${ev.event_type}]`;
      }).join('\n');

  // Format clients
  const clientsText = clients.length === 0
    ? 'No clients on file.'
    : clients.map((c) => `  [${c.id}] ${c.name}`).join('\n');

  return `You are an intelligent scheduling assistant for Three Seas Digital, a digital agency CRM.
Today is ${nowStr} (UTC). The current week starts on ${fmtDate(weekStart)} (Monday).

BUSINESS HOURS:
${hoursText}

THIS WEEK'S EVENTS (format: [id] start – end: title [type]):
${eventsText}

CLIENT LIST (format: [id] name):
${clientsText}

YOUR JOB:
Parse the user's scheduling request and return a JSON object describing the action to take.
Always match clients by name to the CLIENT LIST above and include their ID in client_id.
When the user mentions a day name (e.g. "Tuesday"), resolve it to the nearest upcoming date in the current or next week.
For time values, always produce full ISO-8601 datetime strings: "2026-03-10T14:00:00".

VALID ACTION TYPES:
- "create"     — Schedule a new calendar event
- "move"       — Reschedule an existing event (requires original_event_id)
- "cancel"     — Delete one or more events (requires events_to_cancel array of IDs)
- "find_slots" — Find available 1-hour time windows this week
- "summary"    — Provide a human-readable summary of the week's schedule

RESPONSE FORMAT — respond with ONLY this JSON, no markdown, no extra text:
{
  "action": "create" | "move" | "cancel" | "find_slots" | "summary",
  "message": "Brief human-readable explanation of what will be done or what was found",
  "event": {
    "title": "Event title",
    "start_time": "2026-03-10T14:00:00",
    "end_time": "2026-03-10T15:00:00",
    "event_type": "meeting" | "client-meeting" | "personal" | "blocked",
    "client_id": "id-from-client-list-or-null",
    "location": "optional location string or null",
    "description": "optional description or null"
  },
  "original_event_id": "id-of-event-being-moved-or-null",
  "slots": [],
  "events_to_cancel": []
}

RULES:
- For "create" and "move": populate the "event" object fully. Omit fields that are null.
- For "cancel": populate "events_to_cancel" with the IDs of matching events from THIS WEEK'S EVENTS.
- For "find_slots": leave "slots" empty — the server will compute them. Set message to describe the intent.
- For "summary": populate only "message" with a complete human-readable overview of the week.
- If the request is ambiguous, pick the most reasonable interpretation and note it in "message".
- Default meeting duration is 1 hour unless specified.
- Default event_type is "meeting". Use "client-meeting" when a client is involved.
- "blocked" means time blocked for deep work, admin, or personal tasks.
- If you cannot identify a client from the list, set client_id to null and note it in message.
- Dates and times in "event" must fall within business hours when possible.
- For "move", include both "original_event_id" and the "event" object with the new times.
- Always include all four top-level keys: action, message, event, original_event_id, slots, events_to_cancel.`;
}

// ─── POST /api/calendar/agent/chat ────────────────────────────────────────

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { message, context } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'message is required' });
    }

    const now = context?.date ? new Date(context.date) : new Date();
    if (isNaN(now.getTime())) {
      return res.status(400).json({ error: 'context.date is not a valid date' });
    }

    // Fetch this week's bounds (Mon 00:00 → Sun 23:59:59)
    const weekStart = getWeekStart(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Load business hours
    const [businessHours] = await pool.query(
      'SELECT day_of_week, start_time, end_time, is_available FROM business_hours WHERE user_id = ? ORDER BY day_of_week',
      [userId]
    );

    // Load this week's events (with client name for context)
    const [weekEvents] = await pool.query(
      `SELECT e.id, e.title, e.start_time, e.end_time, e.event_type, e.client_id,
              c.name as client_name
       FROM calendar_events e
       LEFT JOIN clients c ON e.client_id = c.id
       WHERE e.user_id = ? AND e.start_time >= ? AND e.start_time <= ?
       ORDER BY e.start_time ASC`,
      [userId, weekStart.toISOString(), weekEnd.toISOString()]
    );

    // Load client list for matching
    const [clients] = await pool.query(
      'SELECT id, name FROM clients ORDER BY name ASC',
      []
    );

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      now,
      businessHours: Array.isArray(businessHours) ? businessHours : [],
      weekEvents: Array.isArray(weekEvents) ? weekEvents : [],
      clients: Array.isArray(clients) ? clients : [],
    });

    // Call the AI
    let aiResponse;
    try {
      aiResponse = await generateJSON(message.trim(), systemPrompt);
    } catch (aiErr) {
      console.error('[calendarAgent] AI call failed:', aiErr.message);
      return res.status(502).json({ error: 'AI service unavailable. Please try again.' });
    }

    // Validate the shape of the AI response
    if (!aiResponse || typeof aiResponse !== 'object') {
      console.error('[calendarAgent] AI returned non-object:', aiResponse);
      return res.status(502).json({ error: 'AI returned an unexpected response format.' });
    }

    const validActions = ['create', 'move', 'cancel', 'find_slots', 'summary'];
    if (!validActions.includes(aiResponse.action)) {
      console.error('[calendarAgent] AI returned unknown action:', aiResponse.action);
      return res.status(502).json({ error: 'AI returned an unrecognised action type.' });
    }

    // Normalise: ensure required top-level keys exist even if AI omitted them
    aiResponse.event = aiResponse.event || null;
    aiResponse.original_event_id = aiResponse.original_event_id || null;
    aiResponse.slots = Array.isArray(aiResponse.slots) ? aiResponse.slots : [];
    aiResponse.events_to_cancel = Array.isArray(aiResponse.events_to_cancel) ? aiResponse.events_to_cancel : [];

    // For find_slots: compute free slots server-side across the week
    if (aiResponse.action === 'find_slots') {
      const allSlots = [];
      const hours = Array.isArray(businessHours) ? businessHours : [];

      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dayOfWeek = day.getDay();

        const hoursRow = hours.find((h) => h.day_of_week === dayOfWeek && h.is_available);
        if (!hoursRow) continue;

        const dayStr = fmtDate(day);
        const dayEvents = (Array.isArray(weekEvents) ? weekEvents : []).filter(
          (ev) => fmtDate(ev.start_time) === dayStr
        );

        const daySlots = computeFreeSlots(day, hoursRow, dayEvents, 60);
        allSlots.push(...daySlots);
      }

      aiResponse.slots = allSlots;
    }

    res.json({ success: true, data: aiResponse });
  } catch (err) {
    console.error('POST /api/calendar/agent/chat error:', err);
    res.status(500).json({ error: 'Failed to process scheduling request' });
  }
});

// ─── POST /api/calendar/agent/execute ─────────────────────────────────────

router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { action } = req.body;

    if (!action || typeof action !== 'object') {
      return res.status(400).json({ error: 'action object is required' });
    }

    const validActions = ['create', 'move', 'cancel', 'find_slots', 'summary'];
    if (!validActions.includes(action.action)) {
      return res.status(400).json({ error: `Unknown action type: ${action.action}` });
    }

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (action.action === 'create') {
      const ev = action.event;
      if (!ev || !ev.title || !ev.start_time || !ev.end_time) {
        return res.status(400).json({ error: 'event.title, start_time, and end_time are required for create' });
      }

      const id = generateId();
      await pool.query(
        `INSERT INTO calendar_events
           (id, user_id, title, description, start_time, end_time, event_type, client_id, all_day, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          ev.title,
          ev.description || null,
          ev.start_time,
          ev.end_time,
          ev.event_type || 'meeting',
          ev.client_id || null,
          false,
          ev.location || null,
        ]
      );

      // Fire-and-forget: push to Google Calendar if connected
      getConnectionStatus(userId).then((status) => {
        if (status.connected) {
          pushEventToGoogle(userId, {
            id,
            title: ev.title,
            description: ev.description || null,
            start_time: ev.start_time,
            end_time: ev.end_time,
            all_day: false,
            location: ev.location || null,
            google_event_id: null,
          }).catch((err) => {
            console.warn('[calendarAgent] Google push failed after create:', err.message);
          });
        }
      }).catch(() => {/* ignore connection check errors */});

      return res.json({
        success: true,
        message: action.message || 'Event created.',
        data: { id },
      });
    }

    // ── MOVE ────────────────────────────────────────────────────────────────
    if (action.action === 'move') {
      const { original_event_id, event: ev } = action;

      if (!original_event_id) {
        return res.status(400).json({ error: 'original_event_id is required for move' });
      }
      if (!ev || !ev.start_time || !ev.end_time) {
        return res.status(400).json({ error: 'event.start_time and end_time are required for move' });
      }

      // Verify ownership and retrieve current google_event_id
      const [existing] = await pool.query(
        'SELECT id, google_event_id FROM calendar_events WHERE id = ? AND user_id = ?',
        [original_event_id, userId]
      );

      if (!Array.isArray(existing) || existing.length === 0) {
        return res.status(404).json({ error: 'Event not found or not owned by you' });
      }

      const currentEvent = existing[0];

      // Build dynamic UPDATE from the fields provided in ev
      const allowed = ['title', 'description', 'start_time', 'end_time', 'event_type', 'client_id', 'location'];
      const fields = [];
      const values = [];

      for (const key of allowed) {
        if (ev[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(ev[key]);
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No updatable fields provided in event' });
      }

      fields.push('updated_at = NOW()');
      values.push(original_event_id, userId);

      await pool.query(
        `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      );

      // Fire-and-forget: update Google Calendar if connected
      if (currentEvent.google_event_id) {
        getConnectionStatus(userId).then((status) => {
          if (status.connected) {
            pushEventToGoogle(userId, {
              id: original_event_id,
              title: ev.title,
              description: ev.description || null,
              start_time: ev.start_time,
              end_time: ev.end_time,
              all_day: false,
              location: ev.location || null,
              google_event_id: currentEvent.google_event_id,
            }).catch((err) => {
              console.warn('[calendarAgent] Google update failed after move:', err.message);
            });
          }
        }).catch(() => {/* ignore */});
      }

      return res.json({
        success: true,
        message: action.message || 'Event rescheduled.',
        data: { id: original_event_id },
      });
    }

    // ── CANCEL ──────────────────────────────────────────────────────────────
    if (action.action === 'cancel') {
      const ids = action.events_to_cancel;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'events_to_cancel must be a non-empty array for cancel' });
      }

      let deleted = 0;
      for (const eventId of ids) {
        // Retrieve google_event_id before deleting
        const [rows] = await pool.query(
          'SELECT google_event_id FROM calendar_events WHERE id = ? AND user_id = ?',
          [eventId, userId]
        );

        const googleEventId = Array.isArray(rows) && rows.length > 0 ? rows[0].google_event_id : null;

        const [result] = await pool.query(
          'DELETE FROM calendar_events WHERE id = ? AND user_id = ?',
          [eventId, userId]
        );

        const affected = result.affectedRows ?? result.rowCount ?? 0;
        if (affected > 0) {
          deleted++;

          // Fire-and-forget: remove from Google Calendar if linked
          if (googleEventId) {
            getConnectionStatus(userId).then((status) => {
              if (status.connected) {
                deleteEventFromGoogle(userId, googleEventId).catch((err) => {
                  console.warn('[calendarAgent] Google delete failed for event', eventId, ':', err.message);
                });
              }
            }).catch(() => {/* ignore */});
          }
        }
      }

      return res.json({
        success: true,
        message: action.message || `${deleted} event(s) cancelled.`,
        data: { deleted },
      });
    }

    // ── FIND_SLOTS / SUMMARY — read-only, nothing to execute ───────────────
    if (action.action === 'find_slots' || action.action === 'summary') {
      return res.json({
        success: true,
        message: action.message || 'No action required.',
        data: {
          slots: action.slots || [],
        },
      });
    }

    // Should never reach here given the validActions check above
    return res.status(400).json({ error: 'Unhandled action type' });
  } catch (err) {
    console.error('POST /api/calendar/agent/execute error:', err);
    res.status(500).json({ error: 'Failed to execute scheduling action' });
  }
});

export default router;
