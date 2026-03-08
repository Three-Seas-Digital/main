/**
 * Google Calendar API utility
 *
 * Wraps the googleapis SDK to provide a clean interface for:
 *   - OAuth2 flow (auth URL generation, code exchange)
 *   - Authenticated Google Calendar API client (with automatic token refresh)
 *   - Bidirectional sync: pull from Google → local DB, push local → Google
 *
 * Environment variables required:
 *   GOOGLE_CLIENT_ID      — OAuth2 client ID from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET  — OAuth2 client secret
 *   GOOGLE_REDIRECT_URI   — Registered redirect URI, e.g.
 *                           https://api.threeseasdigital.com/api/calendar/google/callback
 *
 * All functions that touch the DB accept a userId (VARCHAR(36)) and
 * use the `db` pool from server/config/db.js.
 */

import { google } from 'googleapis';
import pool from '../config/db.js';
import { generateId } from './generateId.js';

// ── OAuth2 client factory ──────────────────────────────────────────────────

/**
 * Create a bare OAuth2 client (no credentials set).
 * Used for auth URL generation and code exchange.
 */
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

// OAuth2 scopes required for full calendar read/write
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'];

// ── Auth URL ───────────────────────────────────────────────────────────────

/**
 * Generate the Google OAuth2 consent screen URL.
 *
 * @param {string} userId - Local user ID, embedded in `state` param so the
 *   callback can identify which user is completing the OAuth flow.
 * @returns {string} URL to redirect the browser to.
 */
export function getAuthUrl(userId) {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',   // request refresh_token on first consent
    prompt: 'consent',        // force consent screen so refresh_token is always returned
    scope: CALENDAR_SCOPES,
    state: userId,            // passed back verbatim in callback ?state=
  });
}

// ── Token exchange ─────────────────────────────────────────────────────────

/**
 * Exchange an OAuth2 authorization code for access + refresh tokens.
 *
 * @param {string} code - The `code` query param from the OAuth callback.
 * @returns {{ access_token: string, refresh_token: string, expiry: Date }}
 * @throws If the exchange fails or Google returns no refresh_token.
 */
export async function handleCallback(code) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    // This happens when the user has already granted access and Google
    // only returns an access_token. The caller should instruct the user
    // to revoke and re-authorize, or we use the existing refresh_token
    // from the DB. The route handler deals with this case.
    throw new Error(
      'Google did not return a refresh_token. ' +
      'The user may need to revoke access at myaccount.google.com/permissions and try again.',
    );
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    // expiry_date is epoch ms; convert to JS Date for DB storage
    expiry: new Date(tokens.expiry_date),
  };
}

// ── Authenticated client ───────────────────────────────────────────────────

/**
 * Build an authenticated Google Calendar API client for a user.
 * Automatically refreshes the access token when expired and persists
 * the new token back to the DB.
 *
 * @param {string} userId
 * @returns {import('googleapis').calendar_v3.Calendar} googleapis calendar instance
 * @throws If the user has no stored tokens.
 */
export async function getCalendarClient(userId) {
  const [rows] = await pool.query(
    'SELECT access_token, refresh_token, token_expiry, calendar_id FROM google_calendar_tokens WHERE user_id = ?',
    [userId],
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`User ${userId} has not connected Google Calendar`);
  }

  const tokenRow = rows[0];

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: new Date(tokenRow.token_expiry).getTime(),
  });

  // Listen for automatic token refreshes and persist the new access token
  oauth2Client.on('tokens', async (newTokens) => {
    try {
      const updates = ['access_token = ?', 'updated_at = NOW()'];
      const values = [newTokens.access_token];

      if (newTokens.expiry_date) {
        updates.push('token_expiry = ?');
        values.push(new Date(newTokens.expiry_date));
      }
      // Google occasionally rotates the refresh token; persist if provided
      if (newTokens.refresh_token) {
        updates.push('refresh_token = ?');
        values.push(newTokens.refresh_token);
      }

      values.push(userId);
      await pool.query(
        `UPDATE google_calendar_tokens SET ${updates.join(', ')} WHERE user_id = ?`,
        values,
      );
      console.log(`[googleCalendar] Token refreshed and persisted for user ${userId}`);
    } catch (err) {
      // Non-fatal — the request will still succeed with the in-memory token
      console.error(`[googleCalendar] Failed to persist refreshed token for user ${userId}:`, err.message);
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// ── Pull from Google → local DB ────────────────────────────────────────────

/**
 * Fetch events from the user's Google Calendar and upsert them into the
 * local `calendar_events` table.
 *
 * Uses the stored sync_token for incremental sync when available; falls back
 * to a full 90-day window on the first sync or after a 410 Gone (sync token
 * invalidated).
 *
 * @param {string} userId
 * @returns {{ inserted: number, updated: number, deleted: number }}
 */
export async function syncEventsFromGoogle(userId) {
  const calendarClient = await getCalendarClient(userId);

  // Retrieve current sync state
  const [tokenRows] = await pool.query(
    'SELECT sync_token, calendar_id FROM google_calendar_tokens WHERE user_id = ?',
    [userId],
  );

  const { sync_token: storedSyncToken, calendar_id: calendarId } = tokenRows[0];

  let pageToken = undefined;
  let nextSyncToken = undefined;
  let inserted = 0;
  let updated = 0;
  let deleted = 0;
  let items = [];

  // Build the initial list params
  const buildListParams = (pt) => {
    const params = {
      calendarId: calendarId || 'primary',
      maxResults: 250,
      singleEvents: true,
      pageToken: pt,
    };

    if (storedSyncToken) {
      params.syncToken = storedSyncToken;
    } else {
      // Full sync — 90-day lookback + 1-year lookahead
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(now.getDate() - 90);
      const futureDate = new Date(now);
      futureDate.setFullYear(now.getFullYear() + 1);
      params.timeMin = pastDate.toISOString();
      params.timeMax = futureDate.toISOString();
      params.orderBy = 'startTime';
    }

    return params;
  };

  // Paginate through all results; handle 410 Gone by falling back to full sync
  const fetchAll = async (useSyncToken) => {
    pageToken = undefined;
    items = [];
    nextSyncToken = undefined;

    do {
      let response;
      try {
        const params = buildListParams(pageToken);
        if (!useSyncToken) {
          delete params.syncToken;
          // Ensure timeMin/timeMax are present for full sync
          const now = new Date();
          const pastDate = new Date(now);
          pastDate.setDate(now.getDate() - 90);
          const futureDate = new Date(now);
          futureDate.setFullYear(now.getFullYear() + 1);
          params.timeMin = pastDate.toISOString();
          params.timeMax = futureDate.toISOString();
          params.orderBy = 'startTime';
        }

        response = await calendarClient.events.list(params);
      } catch (err) {
        if (err.code === 410 && useSyncToken) {
          // Sync token expired — clear it and retry as full sync
          console.warn(`[googleCalendar] Sync token expired for user ${userId}, falling back to full sync`);
          await pool.query(
            'UPDATE google_calendar_tokens SET sync_token = NULL, updated_at = NOW() WHERE user_id = ?',
            [userId],
          );
          return fetchAll(false);
        }
        throw err;
      }

      const data = response.data;
      items.push(...(data.items || []));
      pageToken = data.nextPageToken;
      nextSyncToken = data.nextSyncToken;
    } while (pageToken);
  };

  await fetchAll(!!storedSyncToken);

  // Process each event returned by Google
  for (const gEvent of items) {
    // Cancelled events should be deleted locally
    if (gEvent.status === 'cancelled') {
      if (gEvent.id) {
        const [del] = await pool.query(
          'DELETE FROM calendar_events WHERE google_event_id = ? AND user_id = ?',
          [gEvent.id, userId],
        );
        if ((del.affectedRows || del.rowCount || 0) > 0) deleted++;
      }
      continue;
    }

    // Parse start/end — handle all-day events (date-only) and datetime events
    const allDay = !gEvent.start?.dateTime;
    const startRaw = gEvent.start?.dateTime || gEvent.start?.date;
    const endRaw = gEvent.end?.dateTime || gEvent.end?.date;

    if (!startRaw || !endRaw) continue; // skip malformed events

    const startTime = new Date(startRaw);
    const endTime = new Date(endRaw);

    // Check if we already have this Google event locally
    const [existing] = await pool.query(
      'SELECT id FROM calendar_events WHERE google_event_id = ? AND user_id = ?',
      [gEvent.id, userId],
    );

    if (Array.isArray(existing) && existing.length > 0) {
      // Update existing local event
      await pool.query(
        `UPDATE calendar_events
         SET title = ?, description = ?, start_time = ?, end_time = ?, all_day = ?,
             location = ?, updated_at = NOW()
         WHERE google_event_id = ? AND user_id = ?`,
        [
          gEvent.summary || '(No title)',
          gEvent.description || null,
          startTime,
          endTime,
          allDay,
          gEvent.location || null,
          gEvent.id,
          userId,
        ],
      );
      updated++;
    } else {
      // Insert as a new local event
      const localId = generateId();
      await pool.query(
        `INSERT INTO calendar_events
           (id, user_id, title, description, start_time, end_time, event_type, all_day, location, google_event_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localId,
          userId,
          gEvent.summary || '(No title)',
          gEvent.description || null,
          startTime,
          endTime,
          'meeting',          // default event_type for imported events
          allDay,
          gEvent.location || null,
          gEvent.id,
        ],
      );
      inserted++;
    }
  }

  // Persist the new sync token so the next sync is incremental
  if (nextSyncToken) {
    await pool.query(
      'UPDATE google_calendar_tokens SET sync_token = ?, last_sync = NOW(), updated_at = NOW() WHERE user_id = ?',
      [nextSyncToken, userId],
    );
  } else {
    await pool.query(
      'UPDATE google_calendar_tokens SET last_sync = NOW(), updated_at = NOW() WHERE user_id = ?',
      [userId],
    );
  }

  console.log(`[googleCalendar] syncEventsFromGoogle user=${userId}: +${inserted} ~${updated} -${deleted}`);
  return { inserted, updated, deleted };
}

// ── Push local event → Google ──────────────────────────────────────────────

/**
 * Create or update a local event on Google Calendar.
 *
 * If the event already has a `google_event_id`, update that Google event.
 * Otherwise create a new Google event and return the google_event_id.
 *
 * @param {string} userId
 * @param {{ id: string, title: string, description?: string, start_time: string|Date,
 *           end_time: string|Date, all_day?: boolean, location?: string,
 *           google_event_id?: string }} event - Local event row
 * @returns {string} The google_event_id (new or existing)
 */
export async function pushEventToGoogle(userId, event) {
  const calendarClient = await getCalendarClient(userId);

  const [tokenRows] = await pool.query(
    'SELECT calendar_id FROM google_calendar_tokens WHERE user_id = ?',
    [userId],
  );
  const calendarId = tokenRows[0]?.calendar_id || 'primary';

  const startDt = new Date(event.start_time);
  const endDt = new Date(event.end_time);

  // Build the Google event resource
  const resource = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
  };

  if (event.all_day) {
    // All-day events use date (YYYY-MM-DD), not dateTime
    const toDateStr = (d) => d.toISOString().split('T')[0];
    resource.start = { date: toDateStr(startDt) };
    resource.end = { date: toDateStr(endDt) };
  } else {
    resource.start = { dateTime: startDt.toISOString(), timeZone: 'UTC' };
    resource.end = { dateTime: endDt.toISOString(), timeZone: 'UTC' };
  }

  let googleEventId;

  if (event.google_event_id) {
    // Update existing Google event
    const response = await calendarClient.events.update({
      calendarId,
      eventId: event.google_event_id,
      resource,
    });
    googleEventId = response.data.id;
  } else {
    // Create a new Google event
    const response = await calendarClient.events.insert({
      calendarId,
      resource,
    });
    googleEventId = response.data.id;

    // Persist the google_event_id back to the local event row
    await pool.query(
      'UPDATE calendar_events SET google_event_id = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [googleEventId, event.id, userId],
    );
  }

  return googleEventId;
}

// ── Delete event from Google ───────────────────────────────────────────────

/**
 * Delete a Google Calendar event by its Google event ID.
 *
 * @param {string} userId
 * @param {string} googleEventId
 */
export async function deleteEventFromGoogle(userId, googleEventId) {
  const calendarClient = await getCalendarClient(userId);

  const [tokenRows] = await pool.query(
    'SELECT calendar_id FROM google_calendar_tokens WHERE user_id = ?',
    [userId],
  );
  const calendarId = tokenRows[0]?.calendar_id || 'primary';

  try {
    await calendarClient.events.delete({
      calendarId,
      eventId: googleEventId,
    });
  } catch (err) {
    // 404 / 410 = already gone on Google's side — treat as success
    if (err.code === 404 || err.code === 410) {
      console.warn(
        `[googleCalendar] Event ${googleEventId} already deleted on Google (user=${userId})`,
      );
      return;
    }
    throw err;
  }
}

// ── Push local-only events → Google ───────────────────────────────────────

/**
 * Find all local events for the user that have no google_event_id and push
 * them to Google Calendar, persisting the returned google_event_id.
 *
 * @param {string} userId
 * @returns {{ pushed: number, errors: number }}
 */
export async function syncEventsToGoogle(userId) {
  const [events] = await pool.query(
    `SELECT id, title, description, start_time, end_time, all_day, location
     FROM calendar_events
     WHERE user_id = ? AND (google_event_id IS NULL OR google_event_id = '')
     ORDER BY start_time ASC`,
    [userId],
  );

  let pushed = 0;
  let errors = 0;

  for (const event of events) {
    try {
      await pushEventToGoogle(userId, event);
      pushed++;
    } catch (err) {
      errors++;
      console.error(
        `[googleCalendar] Failed to push event ${event.id} for user ${userId}:`,
        err.message,
      );
    }
  }

  console.log(`[googleCalendar] syncEventsToGoogle user=${userId}: pushed=${pushed} errors=${errors}`);
  return { pushed, errors };
}

// ── Partial callback exchange (no refresh_token expected) ─────────────────

/**
 * Exchange an authorization code for an access token when the user has
 * already granted access and Google will not return a new refresh_token.
 * The caller is responsible for supplying the existing stored refresh_token.
 *
 * @param {string} code - OAuth2 authorization code from the callback
 * @param {string} existingRefreshToken - The refresh_token already in the DB
 * @returns {{ access_token: string, refresh_token: string, expiry: Date }}
 */
export async function handleCallbackPartial(code, existingRefreshToken) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  return {
    access_token: tokens.access_token,
    refresh_token: existingRefreshToken,
    expiry: new Date(tokens.expiry_date),
  };
}

// ── Token check helper ─────────────────────────────────────────────────────

/**
 * Check whether a user has stored Google Calendar tokens.
 *
 * @param {string} userId
 * @returns {{ connected: boolean, calendarId?: string, lastSync?: Date }}
 */
export async function getConnectionStatus(userId) {
  const [rows] = await pool.query(
    'SELECT calendar_id, last_sync FROM google_calendar_tokens WHERE user_id = ?',
    [userId],
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return { connected: false };
  }

  return {
    connected: true,
    calendarId: rows[0].calendar_id,
    lastSync: rows[0].last_sync,
  };
}
