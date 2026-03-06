-- ============================================================
-- Migration 002: Pre-Supabase Fixes
-- Created: 2026-03-04
-- Purpose: Idempotent cleanup and correctness fixes required
--          before migrating to Supabase/Postgres. Targets bugs
--          identified in the 2026-03-04 schema-vs-route audit:
--
--   1.  Add refresh_token + last_login to clients table
--   2.  Expand clients.tier ENUM (add starter, business)
--   3.  Add DEFAULT '' to projects.title (safe INSERT without title)
--   4.  Add DEFAULT '' to prospects.name (safe INSERT without name)
--   5.  Add DEFAULT '' to appointments.name (safe INSERT without name)
--   6.  Add updated_at to recommendation_templates
--   7.  Fix service_requests.updated_at to have a proper DEFAULT
--   8.  Drop dead table: documents
--   9.  Drop dead table: sessions
--  10.  Drop dead column: project_tasks.assignee
--  11.  Widen growth_snapshots.chk_progress to allow up to 999
--       (overachievement tracking)
--  12.  Consolidate audit_categories.display_order / sort_order
--  13.  Consolidate audit_subcriteria.display_order / sort_order
--
-- Run:  mysql -u root -p three_seas_digital < 002_pre_supabase_fixes.sql
--
-- NOTE: MySQL does not support transactional DDL. Each ALTER
--       succeeds or fails independently. All checks use
--       INFORMATION_SCHEMA so the script is safe to re-run.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- SECTION 1: clients — add refresh_token and last_login
-- These columns exist on the users table but were missing from
-- clients, which also stores portal JWTs for refresh flows.
-- ============================================================

-- 1a. clients.refresh_token
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'clients'
    AND COLUMN_NAME  = 'refresh_token'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE `clients` ADD COLUMN `refresh_token` TEXT NULL AFTER `updated_at`',
  'SELECT 1 -- clients.refresh_token already exists'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1b. clients.last_login
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'clients'
    AND COLUMN_NAME  = 'last_login'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE `clients` ADD COLUMN `last_login` TIMESTAMP NULL AFTER `updated_at`',
  'SELECT 1 -- clients.last_login already exists'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ============================================================
-- SECTION 2: clients.tier — expand ENUM
-- Current:  ('free', 'basic', 'premium', 'enterprise')
-- Required: ('free', 'basic', 'starter', 'business', 'premium', 'enterprise')
-- MODIFY COLUMN is safe: existing values remain valid, new values
-- are added. No data is changed.
-- ============================================================

ALTER TABLE `clients`
  MODIFY COLUMN `tier`
    ENUM('free', 'basic', 'starter', 'business', 'premium', 'enterprise')
    DEFAULT 'free';


-- ============================================================
-- SECTION 3: projects.title — add DEFAULT ''
-- The route server/routes/projects.js may INSERT rows providing
-- only `name` and leaving `title` absent. Without a DEFAULT,
-- MySQL strict mode raises "Field 'title' doesn't have a default
-- value". We keep NOT NULL so the column never stores NULL, but
-- allow omission by defaulting to empty string.
-- ============================================================

ALTER TABLE `projects`
  MODIFY COLUMN `title` VARCHAR(255) NOT NULL DEFAULT '';


-- ============================================================
-- SECTION 4: prospects.name — add DEFAULT ''
-- Same pattern as projects.title. Route code creates prospects
-- from pipeline / appointment conversions where name may not
-- be explicitly provided.
-- ============================================================

ALTER TABLE `prospects`
  MODIFY COLUMN `name` VARCHAR(255) NOT NULL DEFAULT '';


-- ============================================================
-- SECTION 5: appointments.name — add DEFAULT ''
-- Public booking form may omit name in some code paths. Giving
-- it a DEFAULT prevents hard crashes on INSERT.
-- ============================================================

ALTER TABLE `appointments`
  MODIFY COLUMN `name` VARCHAR(255) NOT NULL DEFAULT '';


-- ============================================================
-- SECTION 6: recommendation_templates.updated_at
-- The table was created without an updated_at column. Any route
-- that UPDATEs recommendation_templates cannot track freshness.
-- ============================================================

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'recommendation_templates'
    AND COLUMN_NAME  = 'updated_at'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE `recommendation_templates` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`',
  'SELECT 1 -- recommendation_templates.updated_at already exists'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ============================================================
-- SECTION 7: service_requests.updated_at — fix DEFAULT
-- The column exists but may have been added without a DEFAULT
-- (migration 001 did not touch service_requests). We MODIFY to
-- ensure the column has CURRENT_TIMESTAMP as its default so new
-- rows get a meaningful updated_at instead of NULL, which
-- breaks activity-feed ordering in portal.js.
-- ============================================================

ALTER TABLE `service_requests`
  MODIFY COLUMN `updated_at`
    TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;


-- ============================================================
-- SECTION 8: Drop dead table — documents
-- The polymorphic `documents` table is superseded by the two
-- dedicated tables client_documents and prospect_documents.
-- No route file references the `documents` table. Dropping it
-- removes a source of confusion and frees the table name.
-- Foreign keys: none reference documents as a parent, so the
-- drop is safe without cascade.
-- ============================================================

DROP TABLE IF EXISTS `documents`;


-- ============================================================
-- SECTION 9: Drop dead table — sessions
-- JWT tokens are stored directly in users.refresh_token and
-- clients.refresh_token (added above). The sessions table is
-- unused by any route. It has FKs to users and clients — those
-- are child FKs (sessions → users/clients), so dropping
-- sessions does not affect users or clients.
-- ============================================================

DROP TABLE IF EXISTS `sessions`;


-- ============================================================
-- SECTION 10: Drop dead column — project_tasks.assignee
-- The column project_tasks.assignee is a legacy field replaced
-- by project_tasks.assigned_to (added in migration 001).
-- MySQL < 8.0.30 does not support DROP COLUMN IF EXISTS, so we
-- check INFORMATION_SCHEMA and build the DDL dynamically.
-- ============================================================

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'project_tasks'
    AND COLUMN_NAME  = 'assignee'
);
SET @sql = IF(
  @col_exists > 0,
  'ALTER TABLE `project_tasks` DROP COLUMN `assignee`',
  'SELECT 1 -- project_tasks.assignee already removed'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ============================================================
-- SECTION 11: growth_snapshots.chk_progress — widen to 999
-- The old constraint (progress_percent <= 100) rejects rows
-- where a metric overachieves its target. For example, a client
-- who achieved 150% of a traffic goal would cause an INSERT
-- failure. We allow up to 999 to cover realistic overachievement
-- while still blocking clearly bad data (negative or absurd).
--
-- Strategy:
--   a) Drop the constraint if it exists under either its
--      original name or a MySQL-generated name.
--   b) Re-add the constraint with the wider upper bound.
--
-- MySQL stores CHECK constraints in INFORMATION_SCHEMA.TABLE_CONSTRAINTS
-- (type 'CHECK') and the expression in CHECK_CONSTRAINTS.
-- We look up by constraint name. The constraint was named
-- 'chk_progress' in both schema-bi.sql and migration 001.
-- ============================================================

-- 11a. Drop the old constraint (named chk_progress) if it still exists
SET @constraint_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA     = DATABASE()
    AND TABLE_NAME       = 'growth_snapshots'
    AND CONSTRAINT_NAME  = 'chk_progress'
    AND CONSTRAINT_TYPE  = 'CHECK'
);
SET @sql = IF(
  @constraint_exists > 0,
  'ALTER TABLE `growth_snapshots` DROP CHECK `chk_progress`',
  'SELECT 1 -- chk_progress not present on growth_snapshots, nothing to drop'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 11b. Re-add with the wider range (0 to 999)
-- Guard: only add if still absent after step 11a (idempotency on re-run
-- after the new constraint was already applied).
SET @constraint_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA     = DATABASE()
    AND TABLE_NAME       = 'growth_snapshots'
    AND CONSTRAINT_NAME  = 'chk_progress'
    AND CONSTRAINT_TYPE  = 'CHECK'
);
SET @sql = IF(
  @constraint_exists = 0,
  'ALTER TABLE `growth_snapshots` ADD CONSTRAINT `chk_progress` CHECK (progress_percent >= 0 AND progress_percent <= 999)',
  'SELECT 1 -- chk_progress already present on growth_snapshots (widened version)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ============================================================
-- SECTION 12: audit_categories — consolidate display_order/sort_order
-- Both columns were added at different times and serve the same
-- purpose. Portal.js reads display_order; the admin BI system
-- wrote to sort_order. Where display_order is still 0 (never
-- set) but sort_order has a real value, copy sort_order in.
-- This is a data migration, not a structural change.
-- Safe to re-run: the WHERE clause limits updates to rows where
-- display_order is still 0 and sort_order has useful data.
-- ============================================================

UPDATE `audit_categories`
SET    `display_order` = `sort_order`
WHERE  `display_order` = 0
  AND  `sort_order`    > 0;


-- ============================================================
-- SECTION 13: audit_subcriteria — same consolidation as above
-- ============================================================

UPDATE `audit_subcriteria`
SET    `display_order` = `sort_order`
WHERE  `display_order` = 0
  AND  `sort_order`    > 0;


-- ============================================================
-- Re-enable FK checks
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Migration 002 complete.
-- Verify with:
--   SHOW COLUMNS FROM clients LIKE 'refresh_token';
--   SHOW COLUMNS FROM clients LIKE 'last_login';
--   SHOW COLUMNS FROM clients LIKE 'tier';
--   SHOW COLUMNS FROM projects LIKE 'title';
--   SHOW COLUMNS FROM prospects LIKE 'name';
--   SHOW COLUMNS FROM appointments LIKE 'name';
--   SHOW COLUMNS FROM recommendation_templates LIKE 'updated_at';
--   SHOW COLUMNS FROM service_requests LIKE 'updated_at';
--   SHOW TABLES LIKE 'documents';      -- should return empty
--   SHOW TABLES LIKE 'sessions';       -- should return empty
--   SHOW COLUMNS FROM project_tasks LIKE 'assignee';  -- should return empty
--   SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
--     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'growth_snapshots'
--     AND CONSTRAINT_TYPE = 'CHECK';
--   SELECT display_order, sort_order FROM audit_categories LIMIT 10;
--   SELECT display_order, sort_order FROM audit_subcriteria LIMIT 10;
-- ============================================================
