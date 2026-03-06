-- ============================================================
-- Migration 003: Payments, Finance, AI, Email Tables
-- Created: 2026-03-04
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- Payment Transactions (links to existing invoices + payments)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(36) PRIMARY KEY,
  invoice_id VARCHAR(36),
  client_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  provider ENUM('stripe', 'google_pay', 'paypal') NOT NULL,
  provider_payment_id VARCHAR(255),
  provider_response JSON,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_invoice (invoice_id),
  INDEX idx_client (client_id),
  INDEX idx_status (status),
  INDEX idx_provider (provider),
  CONSTRAINT chk_pt_amount CHECK (amount > 0)
);

-- ---------------------------------------------------------
-- Revenue Entries (automatic on payment)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS revenue_entries (
  id VARCHAR(36) PRIMARY KEY,
  invoice_id VARCHAR(36),
  payment_id VARCHAR(36),
  client_id VARCHAR(36),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  category VARCHAR(50) DEFAULT 'service_revenue',
  description TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payment_transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  INDEX idx_client (client_id),
  INDEX idx_recorded (recorded_at),
  CONSTRAINT chk_re_amount CHECK (amount > 0)
);

-- ---------------------------------------------------------
-- Finance Summary (upserted per period)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_summary (
  id VARCHAR(36) PRIMARY KEY,
  period VARCHAR(7) NOT NULL UNIQUE,
  total_revenue DECIMAL(14,2) DEFAULT 0,
  total_invoices_issued INT DEFAULT 0,
  total_invoices_paid INT DEFAULT 0,
  total_outstanding DECIMAL(14,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_period (period)
);

-- ---------------------------------------------------------
-- SWOT Analyses (AI-generated)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS swot_analyses (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  strengths JSON DEFAULT ('[]'),
  weaknesses JSON DEFAULT ('[]'),
  opportunities JSON DEFAULT ('[]'),
  threats JSON DEFAULT ('[]'),
  ai_generated BOOLEAN DEFAULT TRUE,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (client_id)
);

-- ---------------------------------------------------------
-- Email Log
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_log (
  id VARCHAR(36) PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  template_type VARCHAR(50),
  related_invoice_id VARCHAR(36),
  status ENUM('queued', 'sent', 'failed', 'bounced') DEFAULT 'queued',
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient (recipient_email),
  INDEX idx_status (status),
  INDEX idx_invoice (related_invoice_id)
);

SET FOREIGN_KEY_CHECKS = 1;
