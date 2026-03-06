-- Migration 004: Email verification for self-registered clients
-- Run after 003_payments_finance_ai.sql

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP NULL;

-- Mark all existing clients as verified (they were admin-onboarded or already approved)
UPDATE clients SET email_verified = TRUE WHERE email_verified = FALSE;

-- Index for token lookup during verification
CREATE INDEX IF NOT EXISTS idx_clients_verification_token ON clients (email_verification_token);
