-- ============================================================
-- Migration 001: Enhance Base + BI Schema
-- Created: 2026-02-10
-- Purpose: Idempotent migration for existing Three Seas Digital
--          databases. Adds missing columns, tables, indexes,
--          constraints, and ENUM expansions to both the base
--          schema (schema.sql) and BI schema (schema-bi.sql).
--
-- Run:     mysql -u root -p three_seas_digital < 001_enhance_schema.sql
-- Rollback: 001_rollback.sql
--
-- NOTE: MySQL does not support transactional DDL. Each ALTER
--       succeeds or fails independently. The script uses
--       IF NOT EXISTS and INFORMATION_SCHEMA checks for
--       idempotency so it is safe to run multiple times.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================================
-- HELPER: Stored procedure to add a column only if it doesn't
-- already exist. Avoids "Duplicate column" errors.
-- ==========================================================
DROP PROCEDURE IF EXISTS add_column_if_missing;
DELIMITER //
CREATE PROCEDURE add_column_if_missing(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- ==========================================================
-- HELPER: Stored procedure to add an index only if it doesn't
-- already exist.
-- ==========================================================
DROP PROCEDURE IF EXISTS add_index_if_missing;
DELIMITER //
CREATE PROCEDURE add_index_if_missing(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_columns TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND INDEX_NAME = p_index
  ) THEN
    SET @sql = CONCAT('CREATE INDEX `', p_index, '` ON `', p_table, '` (', p_columns, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;


-- ============================================================
-- SECTION 1: Base Schema — New columns on existing tables
-- ============================================================

-- 1a. users — display_name, last_login, refresh_token
CALL add_column_if_missing('users', 'display_name', 'VARCHAR(255) AFTER name');
CALL add_column_if_missing('users', 'last_login', 'TIMESTAMP NULL AFTER color');
CALL add_column_if_missing('users', 'refresh_token', 'TEXT AFTER last_login');

-- 1b. users — expand status ENUM to include 'active'
--     MySQL requires MODIFY COLUMN to change ENUM values.
--     Safe to re-run: existing values are a subset of the new ENUM.
ALTER TABLE users
  MODIFY COLUMN status ENUM('active', 'approved', 'pending', 'rejected') NOT NULL DEFAULT 'pending';

-- 1c. clients — expand source ENUM to include 'pipeline'
ALTER TABLE clients
  MODIFY COLUMN source ENUM('manual', 'appointment', 'signup', 'prospect', 'pipeline') DEFAULT 'manual';

-- 1d. appointments — client_name, type, notes, updated_at
CALL add_column_if_missing('appointments', 'client_name', "VARCHAR(255) AFTER name");
CALL add_column_if_missing('appointments', 'type', "VARCHAR(100) DEFAULT 'consultation' AFTER service");
CALL add_column_if_missing('appointments', 'notes', 'TEXT AFTER message');
CALL add_column_if_missing('appointments', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

-- 1e. prospects — business_name, contact_name, estimated_value, notes; expand stage ENUM
CALL add_column_if_missing('prospects', 'business_name', 'VARCHAR(255) AFTER name');
CALL add_column_if_missing('prospects', 'contact_name', 'VARCHAR(255) AFTER business_name');
CALL add_column_if_missing('prospects', 'estimated_value', 'DECIMAL(10,2) AFTER probability');
CALL add_column_if_missing('prospects', 'notes', 'TEXT AFTER loss_reason');

ALTER TABLE prospects
  MODIFY COLUMN stage ENUM('inquiry', 'new', 'booked', 'confirmed', 'negotiating', 'closed', 'won', 'lost') DEFAULT 'inquiry';

-- 1f. projects — name, end_date
CALL add_column_if_missing('projects', 'name', 'VARCHAR(255) AFTER title');
CALL add_column_if_missing('projects', 'end_date', 'DATE AFTER due_date');

-- 1g. project_tasks — description, assigned_to, sort_order, updated_at
CALL add_column_if_missing('project_tasks', 'description', 'TEXT AFTER title');
CALL add_column_if_missing('project_tasks', 'assigned_to', 'VARCHAR(36) AFTER assignee');
CALL add_column_if_missing('project_tasks', 'sort_order', 'INT DEFAULT 0 AFTER priority');
CALL add_column_if_missing('project_tasks', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

-- 1h. project_milestones — description, updated_at
CALL add_column_if_missing('project_milestones', 'description', 'TEXT AFTER title');
CALL add_column_if_missing('project_milestones', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

-- 1i. leads — category
CALL add_column_if_missing('leads', 'category', 'VARCHAR(100) AFTER type');

-- 1j. business_database — business_name, category, owner, email, notes, intel
CALL add_column_if_missing('business_database', 'business_name', 'VARCHAR(255) AFTER name');
CALL add_column_if_missing('business_database', 'category', 'VARCHAR(100) AFTER type');
CALL add_column_if_missing('business_database', 'owner', 'VARCHAR(255) AFTER category');
CALL add_column_if_missing('business_database', 'email', 'VARCHAR(255) AFTER owner');
CALL add_column_if_missing('business_database', 'notes', 'TEXT AFTER email');
CALL add_column_if_missing('business_database', 'intel', 'JSON AFTER enrichment');

-- 1k. documents — updated_at
CALL add_column_if_missing('documents', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER uploaded_at');

-- 1l. notifications — updated_at
CALL add_column_if_missing('notifications', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

-- 1m. expenses — notes, updated_at
CALL add_column_if_missing('expenses', 'notes', 'TEXT AFTER vendor');
CALL add_column_if_missing('expenses', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

-- 1n. payments — notes, updated_at
CALL add_column_if_missing('payments', 'notes', 'TEXT AFTER status');
CALL add_column_if_missing('payments', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

-- 1o. invoices — updated_at; expand status ENUM to include 'pending'
CALL add_column_if_missing('invoices', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

ALTER TABLE invoices
  MODIFY COLUMN status ENUM('unpaid', 'paid', 'overdue', 'cancelled', 'pending') DEFAULT 'unpaid';

-- 1p. time_entries — updated_at
CALL add_column_if_missing('time_entries', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');


-- ============================================================
-- SECTION 2: Base Schema — New tables
-- ============================================================

-- 2a. client_documents (referenced by server/routes/clients.js)
CREATE TABLE IF NOT EXISTS client_documents (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('proposal', 'contract', 'agreement', 'invoice', 'receipt', 'report', 'other') DEFAULT 'other',
  description TEXT,
  file_path VARCHAR(500),
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by VARCHAR(255) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (client_id)
);

-- 2b. prospect_documents (referenced by server/routes/prospects.js)
CREATE TABLE IF NOT EXISTS prospect_documents (
  id VARCHAR(36) PRIMARY KEY,
  prospect_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('proposal', 'contract', 'agreement', 'invoice', 'receipt', 'report', 'other') DEFAULT 'other',
  description TEXT,
  file_path VARCHAR(500),
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by VARCHAR(255) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  INDEX idx_prospect (prospect_id)
);


-- ============================================================
-- SECTION 3: Base Schema — View alias
-- ============================================================

-- routes/appointments.js references appointment_notes but the
-- underlying table is follow_up_notes
CREATE OR REPLACE VIEW appointment_notes AS SELECT * FROM follow_up_notes;


-- ============================================================
-- SECTION 4: Base Schema — New indexes
-- ============================================================

CALL add_index_if_missing('clients', 'idx_status_tier', 'status, tier');
CALL add_index_if_missing('clients', 'idx_created_at', 'created_at');
CALL add_index_if_missing('appointments', 'idx_assigned_date', 'assigned_to, date');
CALL add_index_if_missing('appointments', 'idx_status_date', 'status, date');
CALL add_index_if_missing('invoices', 'idx_client_status', 'client_id, status');
CALL add_index_if_missing('projects', 'idx_client_status', 'client_id, status');
CALL add_index_if_missing('time_entries', 'idx_project_date', 'project_id, date');
CALL add_index_if_missing('time_entries', 'idx_user', 'user_id');
CALL add_index_if_missing('prospects', 'idx_email', 'email');
CALL add_index_if_missing('leads', 'idx_business_name', 'business_name');
CALL add_index_if_missing('payments', 'idx_invoice', 'invoice_id');
CALL add_index_if_missing('expenses', 'idx_category_date', 'category, date');


-- ============================================================
-- SECTION 5: Base Schema — CHECK constraints
-- NOTE: MySQL 8.0.16+ supports CHECK constraints.
--       If a named constraint already exists, the ALTER will
--       fail harmlessly. We wrap each in a procedure check.
-- ============================================================

DROP PROCEDURE IF EXISTS add_check_if_missing;
DELIMITER //
CREATE PROCEDURE add_check_if_missing(
  IN p_table VARCHAR(64),
  IN p_constraint VARCHAR(64),
  IN p_expression TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND CONSTRAINT_NAME = p_constraint
      AND CONSTRAINT_TYPE = 'CHECK'
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_constraint, '` CHECK (', p_expression, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

CALL add_check_if_missing('invoices', 'chk_inv_amount', 'amount >= 0');
CALL add_check_if_missing('payments', 'chk_pay_amount', 'amount > 0');
CALL add_check_if_missing('projects', 'chk_progress', 'progress >= 0 AND progress <= 100');
CALL add_check_if_missing('prospects', 'chk_probability', 'probability >= 0 AND probability <= 100');
CALL add_check_if_missing('expenses', 'chk_exp_amount', 'amount >= 0');
CALL add_check_if_missing('time_entries', 'chk_hours', 'hours > 0');


-- ============================================================
-- SECTION 6: Base Schema — Data migration
-- Populate new columns from existing data where reasonable.
-- All use WHERE ... IS NULL so they are safe to re-run.
-- ============================================================

-- appointments: copy legacy columns into new ones
UPDATE appointments SET client_name = name WHERE client_name IS NULL;
UPDATE appointments SET type = service WHERE type IS NULL AND service IS NOT NULL;
UPDATE appointments SET notes = message WHERE notes IS NULL AND message IS NOT NULL;

-- prospects: copy name to business_name
UPDATE prospects SET business_name = name WHERE business_name IS NULL;

-- projects: copy title to name, due_date to end_date
UPDATE projects SET name = title WHERE name IS NULL;
UPDATE projects SET end_date = due_date WHERE end_date IS NULL AND due_date IS NOT NULL;

-- business_database: copy name/type to business_name/category
UPDATE business_database SET business_name = name WHERE business_name IS NULL AND name IS NOT NULL;
UPDATE business_database SET category = type WHERE category IS NULL AND type IS NOT NULL;


-- ============================================================
-- SECTION 7: BI Schema — New columns on existing BI tables
-- These are columns that were added during the BI schema
-- rewrite (Task #1). Safe to run on fresh installs (no-ops)
-- or on databases created with the old schema.
-- ============================================================

-- audit_categories — sort_order
CALL add_column_if_missing('audit_categories', 'sort_order', 'INT DEFAULT 0 AFTER display_order');

-- audit_subcriteria — sort_order
CALL add_column_if_missing('audit_subcriteria', 'sort_order', 'INT DEFAULT 0 AFTER display_order');

-- business_audits — audit_date
CALL add_column_if_missing('business_audits', 'audit_date', 'DATE AFTER status');

-- recommendation_templates — category (text column alongside category_id FK)
CALL add_column_if_missing('recommendation_templates', 'category', 'VARCHAR(100) AFTER category_id');

-- audit_recommendations — status ENUM expansion and new columns
-- The MODIFY handles both adding new values and being re-runnable
ALTER TABLE audit_recommendations
  MODIFY COLUMN status ENUM('proposed', 'pending', 'accepted', 'in_progress', 'completed', 'declined') DEFAULT 'proposed';

CALL add_column_if_missing('audit_recommendations', 'display_order', 'INT DEFAULT 0 AFTER dependencies');
CALL add_column_if_missing('audit_recommendations', 'decline_reason', 'TEXT AFTER completed_at');

-- BI data migration: copy display_order to sort_order where appropriate
UPDATE audit_categories SET sort_order = display_order WHERE sort_order IS NULL OR sort_order = 0;
UPDATE audit_subcriteria SET sort_order = display_order WHERE sort_order IS NULL OR sort_order = 0;

-- interventions — expand type and status ENUMs
ALTER TABLE interventions
  MODIFY COLUMN intervention_type ENUM('website', 'seo', 'social', 'advertising', 'email', 'chatbot', 'branding', 'content', 'technical', 'performance', 'analytics', 'other') NOT NULL;

ALTER TABLE interventions
  MODIFY COLUMN status ENUM('planned', 'in_progress', 'completed', 'paused', 'launched', 'measuring', 'measured', 'archived') DEFAULT 'planned';


-- ============================================================
-- SECTION 8: BI Schema — New indexes
-- ============================================================

CALL add_index_if_missing('audit_recommendations', 'idx_client_status', 'client_id, status');
CALL add_index_if_missing('audit_recommendations', 'idx_audit', 'audit_id');
CALL add_index_if_missing('service_requests', 'idx_svc_req_client', 'client_id');
CALL add_index_if_missing('client_feedback', 'idx_feedback_client', 'client_id');
CALL add_index_if_missing('business_audits', 'idx_client_version', 'client_id, version');
CALL add_index_if_missing('business_audits', 'idx_status', 'status');
CALL add_index_if_missing('interventions', 'idx_client_status', 'client_id, status');


-- ============================================================
-- SECTION 9: BI Schema — CHECK constraints
-- ============================================================

CALL add_check_if_missing('business_audits', 'chk_overall_score', 'overall_score >= 0 AND overall_score <= 10');
CALL add_check_if_missing('audit_scores', 'chk_score', 'score >= 0 AND score <= 10');
CALL add_check_if_missing('audit_subcriteria_scores', 'chk_sub_score', 'score >= 0 AND score <= 10');
CALL add_check_if_missing('growth_snapshots', 'chk_progress', 'progress_percent >= 0 AND progress_percent <= 100');
CALL add_check_if_missing('intervention_metrics', 'chk_attribution', 'attribution_percent >= 0 AND attribution_percent <= 100');
CALL add_check_if_missing('client_financials', 'chk_period_month', 'period_month >= 1 AND period_month <= 12');


-- ============================================================
-- SECTION 10: Aggregation Views (from views.sql)
-- CREATE OR REPLACE is idempotent.
-- ============================================================

CREATE OR REPLACE VIEW v_client_health_summary AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  c.email AS client_email,
  c.tier AS client_tier,
  c.status AS client_status,
  ba.id AS latest_audit_id,
  ba.audit_date AS latest_audit_date,
  ba.overall_score AS latest_overall_score,
  ba.status AS audit_status,
  COALESCE(rec.total_recommendations, 0) AS total_recommendations,
  COALESCE(rec.accepted_recommendations, 0) AS accepted_recommendations,
  COALESCE(rec.completed_recommendations, 0) AS completed_recommendations,
  COALESCE(intv.total_interventions, 0) AS total_interventions,
  COALESCE(intv.completed_interventions, 0) AS completed_interventions,
  intv.avg_roi AS avg_intervention_roi
FROM clients c
LEFT JOIN business_audits ba ON ba.client_id = c.id
  AND ba.version = (
    SELECT MAX(ba2.version) FROM business_audits ba2 WHERE ba2.client_id = c.id
  )
LEFT JOIN (
  SELECT client_id,
    COUNT(*) AS total_recommendations,
    SUM(CASE WHEN status IN ('accepted','in_progress','completed') THEN 1 ELSE 0 END) AS accepted_recommendations,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_recommendations
  FROM audit_recommendations
  GROUP BY client_id
) rec ON rec.client_id = c.id
LEFT JOIN (
  SELECT client_id,
    COUNT(*) AS total_interventions,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_interventions,
    AVG(overall_roi) AS avg_roi
  FROM interventions
  GROUP BY client_id
) intv ON intv.client_id = c.id;


CREATE OR REPLACE VIEW v_client_financial_summary AS
SELECT
  client_id,
  COUNT(*) AS total_months,
  SUM(COALESCE(gross_revenue, 0)) AS total_gross_revenue,
  SUM(COALESCE(net_revenue, 0)) AS total_net_revenue,
  SUM(COALESCE(total_expenses, 0)) AS total_expenses,
  SUM(COALESCE(gross_profit, 0)) AS total_gross_profit,
  SUM(COALESCE(net_profit, 0)) AS total_net_profit,
  AVG(COALESCE(gross_revenue, 0)) AS avg_monthly_revenue,
  AVG(COALESCE(profit_margin, 0)) AS avg_profit_margin,
  SUM(COALESCE(new_customers, 0)) AS total_new_customers,
  SUM(COALESCE(total_marketing_spend, 0)) AS total_marketing_spend,
  MAX(period_year * 100 + period_month) AS latest_period_code
FROM client_financials
GROUP BY client_id;


CREATE OR REPLACE VIEW v_intervention_roi_summary AS
SELECT
  client_id,
  COUNT(*) AS total_interventions,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
  SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) AS planned_count,
  AVG(CASE WHEN status = 'completed' THEN overall_roi ELSE NULL END) AS avg_roi,
  SUM(COALESCE(cost_to_client, 0)) AS total_client_investment,
  SUM(COALESCE(our_cost, 0)) AS total_our_cost,
  SUM(COALESCE(revenue_impact_monthly, 0)) AS total_monthly_revenue_impact,
  AVG(CASE
    WHEN effectiveness_rating = 'exceptional' THEN 5
    WHEN effectiveness_rating = 'strong' THEN 4
    WHEN effectiveness_rating = 'moderate' THEN 3
    WHEN effectiveness_rating = 'weak' THEN 2
    WHEN effectiveness_rating = 'negative' THEN 1
    ELSE NULL
  END) AS avg_effectiveness_score
FROM interventions
GROUP BY client_id;


CREATE OR REPLACE VIEW v_audit_queue_status AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  c.tier AS client_tier,
  c.status AS client_status,
  ba.audit_date AS latest_audit_date,
  DATEDIFF(CURDATE(), ba.audit_date) AS days_since_last_audit,
  ba.overall_score AS latest_overall_score,
  CASE
    WHEN ba.overall_score >= 7 THEN 'green'
    WHEN ba.overall_score >= 4 THEN 'amber'
    WHEN ba.overall_score IS NOT NULL THEN 'red'
    ELSE 'none'
  END AS traffic_light,
  COALESCE(audit_counts.audit_count, 0) AS audit_count,
  ba.status AS latest_audit_status
FROM clients c
LEFT JOIN business_audits ba ON ba.client_id = c.id
  AND ba.version = (
    SELECT MAX(ba2.version) FROM business_audits ba2 WHERE ba2.client_id = c.id
  )
LEFT JOIN (
  SELECT client_id, COUNT(*) AS audit_count
  FROM business_audits
  GROUP BY client_id
) audit_counts ON audit_counts.client_id = c.id
WHERE c.status IN ('active', 'approved');


-- ============================================================
-- CLEANUP: Drop helper procedures
-- ============================================================

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
DROP PROCEDURE IF EXISTS add_check_if_missing;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Migration 001 complete.
-- ============================================================
