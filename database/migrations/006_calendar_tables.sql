-- Calendar system tables: business hours, events, and sharing
-- Run against Neon PostgreSQL

-- Business hours per user per day of week
CREATE TABLE IF NOT EXISTS business_hours (
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_business_hours_user ON business_hours(user_id);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  event_type VARCHAR(20) NOT NULL DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'personal', 'blocked', 'client-meeting')),
  client_id VARCHAR(36) REFERENCES clients(id) ON DELETE SET NULL,
  google_event_id VARCHAR(255),
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  location VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON calendar_events(user_id, start_time);

-- Calendar sharing permissions
CREATE TABLE IF NOT EXISTS calendar_sharing (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_level VARCHAR(10) NOT NULL DEFAULT 'freebusy' CHECK (access_level IN ('none', 'freebusy', 'details', 'edit')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (owner_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_sharing_owner ON calendar_sharing(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sharing_viewer ON calendar_sharing(viewer_id);
