-- Migration 009: Schema audit fixes
-- Addresses all issues from schema_audit_report.md
-- Run after 008_business_hours_overrides.sql

-- ============================================================
-- 1. Add remaining missing columns to clients
-- (004 added email_verified/token/sent_at, 005 added street/city/state/zip/dob/profile_complete)
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding JSON;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;

-- ============================================================
-- 2. Fix prospects.name NOT NULL constraint
-- Route uses business_name + contact_name, never sets name
-- ============================================================
ALTER TABLE prospects MODIFY name VARCHAR(255) DEFAULT '';

-- ============================================================
-- 3. Add lead_id to prospects for lead-to-prospect tracking
-- ============================================================
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS lead_id VARCHAR(36);

-- ============================================================
-- 4. Expand clients.tier ENUM to include starter and business
-- ============================================================
ALTER TABLE clients MODIFY tier ENUM('free', 'basic', 'starter', 'business', 'premium', 'enterprise') DEFAULT 'free';

-- ============================================================
-- 5. Expand ai_recommendations.ai_provider ENUM
-- ============================================================
ALTER TABLE ai_recommendations MODIFY ai_provider ENUM('gemini', 'claude', 'anthropic', 'ollama', 'external', 'webhook') NOT NULL DEFAULT 'gemini';

-- ============================================================
-- 6. Remove growth_snapshots progress_percent upper bound
-- (clients can exceed 100% of their growth target)
-- ============================================================
ALTER TABLE growth_snapshots DROP CHECK chk_progress;
ALTER TABLE growth_snapshots ADD CONSTRAINT chk_progress CHECK (progress_percent >= 0);

-- ============================================================
-- 7. Change client_tags.id from INT AUTO_INCREMENT to VARCHAR(36)
-- ============================================================
ALTER TABLE client_tags MODIFY id VARCHAR(36) NOT NULL;

-- ============================================================
-- 8. Remove dead assignee column from project_tasks
-- ============================================================
ALTER TABLE project_tasks DROP COLUMN IF EXISTS assignee;

-- ============================================================
-- 9. Fix expenses.created_by to use user ID instead of username
-- ============================================================
ALTER TABLE expenses MODIFY created_by VARCHAR(36);

-- ============================================================
-- 10. Add missing foreign key constraints
-- ============================================================
-- appointments.converted_to_client -> clients(id)
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_converted_client
  FOREIGN KEY (converted_to_client) REFERENCES clients(id) ON DELETE SET NULL;

-- time_entries.user_id -> users(id)
ALTER TABLE time_entries ADD CONSTRAINT fk_time_entries_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- expenses.created_by -> users(id)
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 11. Add missing indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_growth_snapshots_client ON growth_snapshots (client_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_client ON data_sync_log (client_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_status ON data_sync_log (status);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_started ON data_sync_log (started_at);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_section ON saved_filters (user_id, section);
CREATE INDEX IF NOT EXISTS idx_saved_filters_client_section ON saved_filters (client_id, section);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_converted ON appointments (converted_to_client);

-- ============================================================
-- 12. Add updated_at to recommendation_templates
-- ============================================================
ALTER TABLE recommendation_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
