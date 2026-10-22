-- Migration 010: Remaining schema fixes
-- - Convert leads.status from VARCHAR to ENUM type
-- - Drop stale default on expenses.created_by

-- PostgreSQL: Create enum type for lead statuses
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'followup', 'interested', 'not-interested', 'converted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Convert leads.status column to use the enum
ALTER TABLE leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE leads ALTER COLUMN status TYPE lead_status USING status::lead_status;
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new';

-- Fix expenses.created_by default (was 'Unknown', now FK to users — NULL is correct)
ALTER TABLE expenses ALTER COLUMN created_by DROP DEFAULT;
