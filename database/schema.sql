-- ============================================================
-- Three Seas Digital — MySQL 8.0+ Schema
-- Created: 2026-02-09
-- Updated: 2026-02-10
-- Purpose: Complete database schema for the Three Seas Digital
--          CRM backend. All 27 tables + 1 view in FK-dependency
--          order.
-- Usage:   mysql -u root -p three_seas_digital < schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- 1. users (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner','admin','manager','sales','accountant','it','developer','analyst','pending') NOT NULL DEFAULT 'pending',
  status ENUM('active', 'approved', 'pending', 'rejected') NOT NULL DEFAULT 'pending',
  color VARCHAR(7) DEFAULT '#3b82f6',
  last_login TIMESTAMP NULL,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_status (status)
);

-- ---------------------------------------------------------
-- 2. clients (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) DEFAULT '',
  password_hash VARCHAR(255),
  service VARCHAR(255) DEFAULT '',
  tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
  status ENUM('active', 'pending', 'archived', 'rejected') DEFAULT 'active',
  source ENUM('manual', 'appointment', 'signup', 'prospect', 'pipeline') DEFAULT 'manual',
  source_prospect_id VARCHAR(36),
  source_appointment_id VARCHAR(36),
  business_name VARCHAR(255) DEFAULT '',
  business_address TEXT,
  date_of_birth DATE,
  approved_at TIMESTAMP NULL,
  approved_by VARCHAR(255),
  archived_at TIMESTAMP NULL,
  archived_by VARCHAR(255),
  restored_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_tier (tier),
  INDEX idx_status_tier (status, tier),
  INDEX idx_created_at (created_at)
);

-- ---------------------------------------------------------
-- 3. client_notes (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_notes (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  author VARCHAR(255) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (client_id)
);

-- ---------------------------------------------------------
-- 4. client_tags (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_client_tag (client_id, tag),
  INDEX idx_client (client_id)
);

-- ---------------------------------------------------------
-- 5. documents (polymorphic: client or prospect)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  owner_type ENUM('client', 'prospect') NOT NULL,
  owner_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('proposal', 'contract', 'agreement', 'invoice', 'receipt', 'report', 'intake', 'welcome_packet', 'bi_discovery', 'other') DEFAULT 'other',
  description TEXT,
  file_path VARCHAR(500),
  file_type VARCHAR(100),
  file_size INT,
  uploaded_by VARCHAR(255) DEFAULT 'System',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_owner (owner_type, owner_id)
);

-- ---------------------------------------------------------
-- 5a. client_documents (FK -> clients)
--     Dedicated table referenced by server/routes/clients.js
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_documents (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('proposal', 'contract', 'agreement', 'invoice', 'receipt', 'report', 'intake', 'welcome_packet', 'bi_discovery', 'other') DEFAULT 'other',
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

-- ---------------------------------------------------------
-- 5b. prospect_documents (FK -> prospects)
--     Dedicated table referenced by server/routes/prospects.js
--     Note: prospects table created at #14 below; FK-safe due
--     to SET FOREIGN_KEY_CHECKS = 0 at top.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospect_documents (
  id VARCHAR(36) PRIMARY KEY,
  prospect_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('proposal', 'contract', 'agreement', 'invoice', 'receipt', 'report', 'intake', 'welcome_packet', 'bi_discovery', 'other') DEFAULT 'other',
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

-- ---------------------------------------------------------
-- 6. invoices (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('unpaid', 'paid', 'overdue', 'cancelled', 'pending') DEFAULT 'unpaid',
  due_date DATE,
  description TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly') NULL,
  next_due_date DATE,
  parent_invoice_id VARCHAR(36),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (client_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date),
  INDEX idx_client_status (client_id, status),
  CONSTRAINT chk_inv_amount CHECK (amount >= 0)
);

-- ---------------------------------------------------------
-- 7. payments (FK -> clients, invoices)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  invoice_id VARCHAR(36),
  client_name VARCHAR(255),
  service VARCHAR(255),
  service_tier VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) DEFAULT 'invoice',
  status ENUM('completed', 'pending', 'refunded') DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  INDEX idx_client (client_id),
  INDEX idx_created (created_at),
  INDEX idx_invoice (invoice_id),
  CONSTRAINT chk_pay_amount CHECK (amount > 0)
);

-- ---------------------------------------------------------
-- 8. projects (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  status ENUM('planning', 'in-progress', 'review', 'completed', 'archived') DEFAULT 'planning',
  progress INT DEFAULT 0,
  start_date DATE,
  due_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client (client_id),
  INDEX idx_status (status),
  INDEX idx_client_status (client_id, status),
  CONSTRAINT chk_progress CHECK (progress >= 0 AND progress <= 100)
);

-- ---------------------------------------------------------
-- 9. project_developers (FK -> projects, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_developers (
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 10. project_tasks (FK -> projects)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_tasks (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in-progress', 'review', 'done') DEFAULT 'todo',
  goal TEXT,
  assignee VARCHAR(36),
  assigned_to VARCHAR(36),
  due_date DATE,
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project (project_id),
  INDEX idx_status (status)
);

-- ---------------------------------------------------------
-- 11. project_milestones (FK -> projects)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_milestones (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project (project_id)
);

-- ---------------------------------------------------------
-- 12. appointments (FK -> users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  service VARCHAR(255),
  message TEXT,
  type VARCHAR(100) DEFAULT 'consultation',
  notes TEXT,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  assigned_to VARCHAR(36),
  converted_to_client VARCHAR(36),
  follow_up_status VARCHAR(50),
  follow_up_date DATE,
  follow_up_priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_assigned (assigned_to),
  INDEX idx_assigned_date (assigned_to, date),
  INDEX idx_status_date (status, date)
);

-- ---------------------------------------------------------
-- 13. follow_up_notes (FK -> appointments)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS follow_up_notes (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  author VARCHAR(255) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_appointment (appointment_id)
);

-- View alias: routes/appointments.js references appointment_notes
CREATE OR REPLACE VIEW appointment_notes AS SELECT * FROM follow_up_notes;

-- ---------------------------------------------------------
-- 14. prospects (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  service VARCHAR(255),
  stage ENUM('inquiry', 'new', 'booked', 'confirmed', 'negotiating', 'closed', 'won', 'lost') DEFAULT 'inquiry',
  deal_value DECIMAL(10,2) DEFAULT 0,
  estimated_value DECIMAL(10,2),
  probability INT DEFAULT 25,
  expected_close_date DATE,
  outcome ENUM('won', 'lost') NULL,
  loss_reason ENUM('budget', 'timing', 'competitor', 'no-response', 'scope', 'other') NULL,
  notes TEXT,
  revisit_date DATE,
  source VARCHAR(50) DEFAULT 'manual',
  appointment_id VARCHAR(36),
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stage (stage),
  INDEX idx_outcome (outcome),
  INDEX idx_email (email),
  CONSTRAINT chk_probability CHECK (probability >= 0 AND probability <= 100)
);

-- ---------------------------------------------------------
-- 15. prospect_notes (FK -> prospects)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospect_notes (
  id VARCHAR(36) PRIMARY KEY,
  prospect_id VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  author VARCHAR(255) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  INDEX idx_prospect (prospect_id)
);

-- ---------------------------------------------------------
-- 16. leads (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(36) PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  type VARCHAR(100),
  category VARCHAR(100),
  website VARCHAR(500),
  status VARCHAR(50) DEFAULT 'new',
  source VARCHAR(50) DEFAULT 'manual',
  coordinates JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_business_name (business_name)
);

-- ---------------------------------------------------------
-- 17. lead_notes (FK -> leads)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_notes (
  id VARCHAR(36) PRIMARY KEY,
  lead_id VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  author VARCHAR(255) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_lead (lead_id)
);

-- ---------------------------------------------------------
-- 18. expenses (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(36) PRIMARY KEY,
  category ENUM('wages', 'fuel', 'food', 'meetings', 'trips', 'receipts') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  receipt_path VARCHAR(500),
  receipt_name VARCHAR(255),
  vendor VARCHAR(255),
  notes TEXT,
  created_by VARCHAR(255) DEFAULT 'Unknown',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_date (date),
  INDEX idx_category_date (category, date),
  CONSTRAINT chk_exp_amount CHECK (amount >= 0)
);

-- ---------------------------------------------------------
-- 19. time_entries (FK -> clients, projects)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_entries (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36),
  project_id VARCHAR(36),
  task_id VARCHAR(36),
  user_id VARCHAR(36),
  user_name VARCHAR(255),
  description TEXT,
  hours DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  billable BOOLEAN DEFAULT TRUE,
  billed BOOLEAN DEFAULT FALSE,
  billed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  INDEX idx_client (client_id),
  INDEX idx_project (project_id),
  INDEX idx_date (date),
  INDEX idx_project_date (project_id, date),
  INDEX idx_user (user_id),
  CONSTRAINT chk_hours CHECK (hours > 0)
);

-- ---------------------------------------------------------
-- 20. email_templates (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  category ENUM('invoice', 'appointment', 'follow-up', 'project', 'general') DEFAULT 'general',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 21. notifications (FK -> users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  type ENUM('warning', 'info', 'success', 'error') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read)
);

-- ---------------------------------------------------------
-- 22. activity_log (FK -> users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id VARCHAR(36) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details JSON,
  user_id VARCHAR(36),
  user_name VARCHAR(255) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);

-- ---------------------------------------------------------
-- 23. business_database (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_database (
  id VARCHAR(36) PRIMARY KEY,
  lookup_key VARCHAR(500) UNIQUE,
  name VARCHAR(255),
  business_name VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  type VARCHAR(100),
  category VARCHAR(100),
  owner VARCHAR(255),
  notes TEXT,
  coordinates JSON,
  enrichment JSON,
  intel JSON,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (lookup_key)
);

-- ---------------------------------------------------------
-- 24. market_research (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_research (
  id VARCHAR(36) PRIMARY KEY,
  lookup_key VARCHAR(500) UNIQUE,
  location VARCHAR(255),
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (lookup_key)
);

-- ---------------------------------------------------------
-- 25. sessions (FK -> users, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  client_id VARCHAR(36),
  token_hash VARCHAR(255) NOT NULL,
  user_type ENUM('admin', 'client') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_expires (expires_at)
);

SET FOREIGN_KEY_CHECKS = 1;
