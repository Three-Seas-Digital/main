-- ============================================================
-- Rollback for Migration 001: Enhance Base + BI Schema
-- Created: 2026-02-10
-- Purpose: Reverses the changes made by 001_enhance_schema.sql.
--
-- Run:     mysql -u root -p three_seas_digital < 001_rollback.sql
--
-- WARNING — PARTIAL ROLLBACK:
-- The following changes are DESTRUCTIVE and cannot be perfectly
-- reversed. Data in dropped columns/tables will be lost:
--
-- 1. ENUM narrowing (removing values) will fail if any rows
--    contain the removed value. You must UPDATE those rows first.
-- 2. Newly created tables (client_documents, prospect_documents)
--    are dropped entirely — all uploaded document metadata is lost.
-- 3. Newly added columns are dropped — data stored in them is lost.
-- 4. CHECK constraints are dropped.
-- 5. Views are dropped.
--
-- This rollback is primarily useful for development/staging.
-- In production, prefer a forward migration to fix issues.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- SECTION 1: Drop aggregation views
-- ============================================================

DROP VIEW IF EXISTS v_client_health_summary;
DROP VIEW IF EXISTS v_client_financial_summary;
DROP VIEW IF EXISTS v_intervention_roi_summary;
DROP VIEW IF EXISTS v_audit_queue_status;
DROP VIEW IF EXISTS appointment_notes;


-- ============================================================
-- SECTION 2: Drop newly created tables
-- ============================================================

DROP TABLE IF EXISTS prospect_documents;
DROP TABLE IF EXISTS client_documents;


-- ============================================================
-- SECTION 3: Drop CHECK constraints (base schema)
-- ============================================================

-- MySQL 8.0.16+ supports ALTER TABLE ... DROP CHECK
ALTER TABLE invoices DROP CHECK chk_inv_amount;
ALTER TABLE payments DROP CHECK chk_pay_amount;
ALTER TABLE projects DROP CHECK chk_progress;
ALTER TABLE prospects DROP CHECK chk_probability;
ALTER TABLE expenses DROP CHECK chk_exp_amount;
ALTER TABLE time_entries DROP CHECK chk_hours;

-- BI schema CHECK constraints
ALTER TABLE business_audits DROP CHECK chk_overall_score;
ALTER TABLE audit_scores DROP CHECK chk_score;
ALTER TABLE audit_subcriteria_scores DROP CHECK chk_sub_score;
ALTER TABLE growth_snapshots DROP CHECK chk_progress;
ALTER TABLE intervention_metrics DROP CHECK chk_attribution;
ALTER TABLE client_financials DROP CHECK chk_period_month;


-- ============================================================
-- SECTION 4: Drop newly added indexes (base schema)
-- ============================================================

DROP INDEX idx_status_tier ON clients;
DROP INDEX idx_created_at ON clients;
DROP INDEX idx_assigned_date ON appointments;
DROP INDEX idx_status_date ON appointments;
DROP INDEX idx_client_status ON invoices;
DROP INDEX idx_client_status ON projects;
DROP INDEX idx_project_date ON time_entries;
DROP INDEX idx_user ON time_entries;
DROP INDEX idx_email ON prospects;
DROP INDEX idx_business_name ON leads;
DROP INDEX idx_invoice ON payments;
DROP INDEX idx_category_date ON expenses;

-- BI schema indexes (only drop if they were added by migration)
-- Note: Some of these may be defined in the original schema-bi.sql
-- DROP INDEX idx_client_status ON audit_recommendations;
-- DROP INDEX idx_audit ON audit_recommendations;
-- DROP INDEX idx_svc_req_client ON service_requests;
-- DROP INDEX idx_feedback_client ON client_feedback;


-- ============================================================
-- SECTION 5: Drop newly added columns (base schema)
-- Reverse order of SECTION 1 in 001_enhance_schema.sql
-- ============================================================

-- time_entries
ALTER TABLE time_entries DROP COLUMN updated_at;

-- invoices — revert status ENUM (remove 'pending')
-- WARNING: Will fail if any rows have status = 'pending'
-- Run first: UPDATE invoices SET status = 'unpaid' WHERE status = 'pending';
ALTER TABLE invoices
  MODIFY COLUMN status ENUM('unpaid', 'paid', 'overdue', 'cancelled') DEFAULT 'unpaid';
ALTER TABLE invoices DROP COLUMN updated_at;

-- payments
ALTER TABLE payments DROP COLUMN updated_at;
ALTER TABLE payments DROP COLUMN notes;

-- expenses
ALTER TABLE expenses DROP COLUMN updated_at;
ALTER TABLE expenses DROP COLUMN notes;

-- notifications
ALTER TABLE notifications DROP COLUMN updated_at;

-- documents
ALTER TABLE documents DROP COLUMN updated_at;

-- business_database
ALTER TABLE business_database DROP COLUMN intel;
ALTER TABLE business_database DROP COLUMN notes;
ALTER TABLE business_database DROP COLUMN email;
ALTER TABLE business_database DROP COLUMN owner;
ALTER TABLE business_database DROP COLUMN category;
ALTER TABLE business_database DROP COLUMN business_name;

-- leads
ALTER TABLE leads DROP COLUMN category;

-- project_milestones
ALTER TABLE project_milestones DROP COLUMN updated_at;
ALTER TABLE project_milestones DROP COLUMN description;

-- project_tasks
ALTER TABLE project_tasks DROP COLUMN updated_at;
ALTER TABLE project_tasks DROP COLUMN sort_order;
ALTER TABLE project_tasks DROP COLUMN assigned_to;
ALTER TABLE project_tasks DROP COLUMN description;

-- projects
ALTER TABLE projects DROP COLUMN end_date;
ALTER TABLE projects DROP COLUMN name;

-- prospects — revert stage ENUM (remove 'new', 'won', 'lost')
-- WARNING: Will fail if any rows have stage = 'new', 'won', or 'lost'
-- Run first: UPDATE prospects SET stage = 'inquiry' WHERE stage IN ('new', 'won', 'lost');
ALTER TABLE prospects
  MODIFY COLUMN stage ENUM('inquiry', 'booked', 'confirmed', 'negotiating', 'closed') DEFAULT 'inquiry';
ALTER TABLE prospects DROP COLUMN notes;
ALTER TABLE prospects DROP COLUMN estimated_value;
ALTER TABLE prospects DROP COLUMN contact_name;
ALTER TABLE prospects DROP COLUMN business_name;

-- appointments
ALTER TABLE appointments DROP COLUMN updated_at;
ALTER TABLE appointments DROP COLUMN notes;
ALTER TABLE appointments DROP COLUMN type;
ALTER TABLE appointments DROP COLUMN client_name;

-- clients — revert source ENUM (remove 'pipeline')
-- WARNING: Will fail if any rows have source = 'pipeline'
-- Run first: UPDATE clients SET source = 'prospect' WHERE source = 'pipeline';
ALTER TABLE clients
  MODIFY COLUMN source ENUM('manual', 'appointment', 'signup', 'prospect') DEFAULT 'manual';

-- users — revert status ENUM (remove 'active')
-- WARNING: Will fail if any rows have status = 'active'
-- Run first: UPDATE users SET status = 'approved' WHERE status = 'active';
ALTER TABLE users
  MODIFY COLUMN status ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'pending';
ALTER TABLE users DROP COLUMN refresh_token;
ALTER TABLE users DROP COLUMN last_login;
ALTER TABLE users DROP COLUMN display_name;


-- ============================================================
-- SECTION 6: Drop BI schema columns added by migration
-- ============================================================

ALTER TABLE audit_recommendations DROP COLUMN decline_reason;
ALTER TABLE audit_recommendations DROP COLUMN display_order;

-- Revert audit_recommendations status ENUM (remove 'pending')
-- WARNING: Will fail if any rows have status = 'pending'
-- Run first: UPDATE audit_recommendations SET status = 'proposed' WHERE status = 'pending';
ALTER TABLE audit_recommendations
  MODIFY COLUMN status ENUM('proposed', 'accepted', 'in_progress', 'completed', 'declined') DEFAULT 'proposed';

ALTER TABLE business_audits DROP COLUMN audit_date;
ALTER TABLE audit_subcriteria DROP COLUMN sort_order;
ALTER TABLE audit_categories DROP COLUMN sort_order;

-- Revert recommendation_templates category column
ALTER TABLE recommendation_templates DROP COLUMN category;


-- ============================================================
-- CLEANUP
-- ============================================================

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
DROP PROCEDURE IF EXISTS add_check_if_missing;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Rollback 001 complete.
-- Remember: ENUM value removals will fail if rows contain
-- the removed values. Update those rows first (see WARNING
-- comments above).
-- ============================================================
