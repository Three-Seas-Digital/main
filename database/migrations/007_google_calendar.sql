-- Google Calendar OAuth token storage
-- Run against Neon PostgreSQL after 006_calendar_tables.sql
--
-- Stores per-user Google OAuth2 tokens for Calendar API access.
-- One row per user; primary key is user_id (1:1 relationship).
-- Tokens are encrypted at-rest by Neon TDE; access_token and
-- refresh_token are long TEXT fields to accommodate Google's sizes.

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  user_id       VARCHAR(36)  PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token  TEXT         NOT NULL,
  refresh_token TEXT         NOT NULL,
  token_expiry  TIMESTAMP    NOT NULL,
  calendar_id   VARCHAR(255) NOT NULL DEFAULT 'primary',
  -- sync_token returned by Google for incremental sync (Events: list nextSyncToken)
  sync_token    TEXT,
  last_sync     TIMESTAMP,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- No secondary indexes needed — every query hits the PK (user_id) directly.
-- updated_at is maintained by application code (not a trigger) for portability.

COMMENT ON TABLE google_calendar_tokens IS
  'Per-user Google Calendar OAuth2 tokens. One row per connected admin user.';
COMMENT ON COLUMN google_calendar_tokens.sync_token IS
  'Google incremental-sync token (nextSyncToken) from the last Events.list call. NULL means full sync required.';
COMMENT ON COLUMN google_calendar_tokens.calendar_id IS
  'Google Calendar ID to sync against (default: primary). Users can choose a specific calendar.';
