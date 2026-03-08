-- Migration 008: Business Hours Overrides (open/close specific dates)
-- Allows overriding regular business hours for specific dates (holidays, special hours, etc.)

CREATE TABLE IF NOT EXISTS business_hours_overrides (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT FALSE,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, override_date)
);
