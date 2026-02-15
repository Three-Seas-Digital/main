-- ============================================================
-- Three Seas Digital — Consolidated Database Schema
-- Created: 2026-02-10
-- Purpose: Complete schema for fresh installations. Includes all
--          53 tables and 5 views in FK-dependency order.
--
-- This file merges:
--   - schema.sql       (27 core tables + 1 view)
--   - schema-bi.sql    (26 BI tables)
--   - views.sql        (4 aggregation views)
--
-- Usage:   mysql -u root -p three_seas_digital < schema-full.sql
-- Then:    mysql -u root -p three_seas_digital < seed.sql
--          mysql -u root -p three_seas_digital < seed-bi.sql
--
-- Base table PKs: VARCHAR(36) — matches frontend generateId().
-- BI table PKs: INT AUTO_INCREMENT.
-- BI FK columns referencing base tables: VARCHAR(36).
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- SECTION A: Core Tables (27 tables, 1 view)
-- ============================================================

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
  type ENUM('proposal', 'contract', 'agreement', 'invoice', 'receipt', 'report', 'other') DEFAULT 'other',
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
-- 6. client_documents (FK -> clients)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- 7. prospect_documents (FK -> prospects)
--    prospects table at #16; FK-safe due to FOREIGN_KEY_CHECKS=0
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- 8. invoices (FK -> clients)
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
-- 9. payments (FK -> clients, invoices)
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
-- 10. projects (FK -> clients)
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
-- 11. project_developers (FK -> projects, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_developers (
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 12. project_tasks (FK -> projects)
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
-- 13. project_milestones (FK -> projects)
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
-- 14. appointments (FK -> users)
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
-- 15. follow_up_notes (FK -> appointments)
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
-- 16. prospects (no FK deps)
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
-- 17. prospect_notes (FK -> prospects)
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
-- 18. leads (no FK deps)
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
-- 19. lead_notes (FK -> leads)
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
-- 20. expenses (no FK deps)
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
-- 21. time_entries (FK -> clients, projects)
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
-- 22. email_templates (no FK deps)
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
-- 23. notifications (FK -> users)
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
-- 24. activity_log (FK -> users)
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
-- 25. business_database (no FK deps)
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
-- 26. market_research (no FK deps)
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
-- 27. sessions (FK -> users, clients)
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


-- ============================================================
-- SECTION B: Business Intelligence Tables (26 tables)
-- ============================================================

-- ---------------------------------------------------------
-- 28. audit_categories (no deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_base BOOLEAN DEFAULT FALSE,
    default_weight DECIMAL(5,2) DEFAULT 0,
    max_score DECIMAL(3,1) DEFAULT 10.0,
    display_order INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 29. audit_subcriteria (FK -> audit_categories)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_subcriteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_score DECIMAL(3,1) DEFAULT 10.0,
    display_order INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES audit_categories(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 30. recommendation_templates (FK -> audit_categories)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendation_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    category_id INT,
    category VARCHAR(100),
    trigger_condition TEXT,
    description TEXT,
    expected_outcome TEXT,
    estimated_cost_min DECIMAL(10,2),
    estimated_cost_max DECIMAL(10,2),
    estimated_timeline VARCHAR(100),
    linked_service VARCHAR(100),
    priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
    impact ENUM('high', 'medium', 'low') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES audit_categories(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- 31. business_intakes (FK -> clients, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_intakes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    industry VARCHAR(100),
    sub_industry VARCHAR(100),
    years_in_operation INT,
    employee_count_range VARCHAR(50),
    annual_revenue_range VARCHAR(50),
    target_market TEXT,
    business_model VARCHAR(50),
    competitors JSON,
    current_website_url VARCHAR(500),
    hosting_provider VARCHAR(100),
    tech_stack VARCHAR(200),
    domain_age_years INT,
    has_ssl BOOLEAN DEFAULT FALSE,
    is_mobile_responsive BOOLEAN DEFAULT FALSE,
    last_website_update DATE,
    social_platforms JSON,
    email_marketing_tool VARCHAR(100),
    paid_advertising JSON,
    content_marketing JSON,
    seo_efforts VARCHAR(50),
    pain_points JSON,
    goals JSON,
    previous_agency_experience VARCHAR(50),
    budget_range VARCHAR(100),
    timeline_expectations VARCHAR(200),
    decision_makers JSON,
    notes TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- 32. business_audits (FK -> clients, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    audit_type ENUM('initial', 'quarterly', 'milestone', 'ad_hoc') DEFAULT 'initial',
    overall_score DECIMAL(3,1),
    status ENUM('draft', 'in_progress', 'published') DEFAULT 'draft',
    audit_date DATE,
    published_at TIMESTAMP NULL,
    audited_by VARCHAR(36),
    created_by VARCHAR(36),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_client_version (client_id, version),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (audited_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_client_version (client_id, version),
    INDEX idx_status (status),
    CONSTRAINT chk_overall_score CHECK (overall_score >= 0 AND overall_score <= 10)
);

-- ---------------------------------------------------------
-- 33. audit_scores (FK -> business_audits, audit_categories)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL,
    category_id INT NOT NULL,
    score DECIMAL(3,1) NOT NULL,
    weight DECIMAL(5,2),
    internal_notes TEXT,
    client_summary TEXT,
    evidence_urls JSON,
    UNIQUE KEY unique_audit_category (audit_id, category_id),
    FOREIGN KEY (audit_id) REFERENCES business_audits(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES audit_categories(id) ON DELETE CASCADE,
    INDEX idx_audit_category (audit_id, category_id),
    CONSTRAINT chk_score CHECK (score >= 0 AND score <= 10)
);

-- ---------------------------------------------------------
-- 34. audit_subcriteria_scores (FK -> audit_scores, audit_subcriteria)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_subcriteria_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_score_id INT NOT NULL,
    subcriteria_id INT NOT NULL,
    score DECIMAL(3,1) NOT NULL,
    notes TEXT,
    UNIQUE KEY unique_score_sub (audit_score_id, subcriteria_id),
    FOREIGN KEY (audit_score_id) REFERENCES audit_scores(id) ON DELETE CASCADE,
    FOREIGN KEY (subcriteria_id) REFERENCES audit_subcriteria(id) ON DELETE CASCADE,
    INDEX idx_audit_score (audit_score_id),
    CONSTRAINT chk_sub_score CHECK (score >= 0 AND score <= 10)
);

-- ---------------------------------------------------------
-- 35. audit_recommendations (FK -> business_audits, clients, recommendation_templates, audit_categories, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    template_id INT,
    category_id INT,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    expected_outcome TEXT,
    priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
    impact ENUM('high', 'medium', 'low') DEFAULT 'medium',
    estimated_cost_min DECIMAL(10,2),
    estimated_cost_max DECIMAL(10,2),
    estimated_timeline VARCHAR(100),
    linked_service VARCHAR(100),
    status ENUM('proposed', 'pending', 'accepted', 'in_progress', 'completed', 'declined') DEFAULT 'proposed',
    client_response TEXT,
    client_responded_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    decline_reason TEXT,
    dependencies JSON,
    display_order INT DEFAULT 0,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_id) REFERENCES business_audits(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES recommendation_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES audit_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_client_status (client_id, status),
    INDEX idx_audit (audit_id)
);

-- ---------------------------------------------------------
-- 36. recommendation_threads (FK -> audit_recommendations)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendation_threads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id INT NOT NULL,
    author_type ENUM('admin', 'client') NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommendation_id) REFERENCES audit_recommendations(id) ON DELETE CASCADE,
    INDEX idx_recommendation (recommendation_id)
);

-- ---------------------------------------------------------
-- 37. growth_targets (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS growth_targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    metric_slug VARCHAR(200) NOT NULL,
    baseline_value DECIMAL(15,2) NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2),
    unit VARCHAR(50),
    target_date DATE NOT NULL,
    data_source ENUM('google_analytics', 'search_console', 'pagespeed', 'facebook', 'instagram', 'google_business', 'twitter', 'linkedin', 'mailchimp', 'manual') DEFAULT 'manual',
    source_config JSON,
    measurement_frequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
    status ENUM('active', 'achieved', 'missed', 'paused') DEFAULT 'active',
    achieved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client_status (client_id, status)
);

-- ---------------------------------------------------------
-- 38. growth_snapshots (FK -> growth_targets, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS growth_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_id INT NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    previous_value DECIMAL(15,2),
    change_percent DECIMAL(8,2),
    progress_percent DECIMAL(8,2),
    source ENUM('automated', 'manual') DEFAULT 'automated',
    source_raw JSON,
    admin_note TEXT,
    is_override BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_id) REFERENCES growth_targets(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_target_date (target_id, recorded_at),
    CONSTRAINT chk_progress CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

-- ---------------------------------------------------------
-- 39. data_source_connections (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_source_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    source_type ENUM('google_analytics', 'search_console', 'pagespeed', 'facebook', 'instagram', 'google_business', 'twitter', 'linkedin', 'mailchimp') NOT NULL,
    status ENUM('connected', 'disconnected', 'error', 'pending') DEFAULT 'pending',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP NULL,
    account_id VARCHAR(200),
    account_name VARCHAR(200),
    config JSON,
    last_sync_at TIMESTAMP NULL,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_client_source (client_id, source_type),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client (client_id)
);

-- ---------------------------------------------------------
-- 40. data_sync_log (FK -> data_source_connections, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    connection_id INT NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    status ENUM('success', 'partial', 'failed') NOT NULL,
    metrics_synced INT DEFAULT 0,
    error_message TEXT,
    duration_ms INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (connection_id) REFERENCES data_source_connections(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 41. service_requests (FK -> clients, audit_recommendations)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    recommendation_id INT,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    budget_range VARCHAR(100),
    urgency ENUM('low', 'medium', 'high', 'asap') DEFAULT 'medium',
    status ENUM('submitted', 'reviewing', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled') DEFAULT 'submitted',
    admin_response TEXT,
    quoted_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES audit_recommendations(id) ON DELETE SET NULL,
    INDEX idx_svc_req_client (client_id)
);

-- ---------------------------------------------------------
-- 42. client_feedback (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    target_type ENUM('project', 'milestone', 'recommendation', 'general') NOT NULL,
    target_id VARCHAR(36),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    admin_response TEXT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_feedback_client (client_id)
);

-- ---------------------------------------------------------
-- 43. client_notification_prefs (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_notification_prefs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL UNIQUE,
    email_digest ENUM('none', 'daily', 'weekly') DEFAULT 'weekly',
    notify_new_scores BOOLEAN DEFAULT TRUE,
    notify_new_recommendations BOOLEAN DEFAULT TRUE,
    notify_metric_milestones BOOLEAN DEFAULT TRUE,
    notify_invoices BOOLEAN DEFAULT TRUE,
    notify_documents BOOLEAN DEFAULT TRUE,
    notify_project_updates BOOLEAN DEFAULT TRUE,
    notify_admin_messages BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 44. client_financials (FK -> clients, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_financials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    gross_revenue DECIMAL(15,2),
    net_revenue DECIMAL(15,2),
    online_revenue DECIMAL(15,2),
    offline_revenue DECIMAL(15,2),
    new_customer_revenue DECIMAL(15,2),
    returning_customer_revenue DECIMAL(15,2),
    transaction_count INT,
    average_order_value DECIMAL(10,2),
    cost_of_goods_sold DECIMAL(15,2),
    total_marketing_spend DECIMAL(15,2),
    our_fees DECIMAL(15,2),
    total_expenses DECIMAL(15,2),
    gross_profit DECIMAL(15,2),
    net_profit DECIMAL(15,2),
    profit_margin DECIMAL(8,4),
    new_customers INT,
    total_customers INT,
    customer_acquisition_cost DECIMAL(10,2),
    data_completeness ENUM('full', 'partial', 'estimated') DEFAULT 'partial',
    source ENUM('manual', 'automated', 'imported', 'mixed') DEFAULT 'manual',
    notes TEXT,
    entered_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_client_period (client_id, period_year, period_month),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_client_period (client_id, period_year, period_month),
    CONSTRAINT chk_period_month CHECK (period_month >= 1 AND period_month <= 12)
);

-- ---------------------------------------------------------
-- 45. client_revenue_channels (FK -> client_financials, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_revenue_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    financial_id INT NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    revenue DECIMAL(15,2) NOT NULL,
    transaction_count INT,
    conversion_rate DECIMAL(8,4),
    cost DECIMAL(15,2),
    roi DECIMAL(8,2),
    FOREIGN KEY (financial_id) REFERENCES client_financials(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_financial (financial_id)
);

-- ---------------------------------------------------------
-- 46. client_revenue_products (FK -> client_financials, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_revenue_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    financial_id INT NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    revenue DECIMAL(15,2) NOT NULL,
    units_sold INT,
    average_price DECIMAL(10,2),
    margin_percent DECIMAL(8,4),
    FOREIGN KEY (financial_id) REFERENCES client_financials(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_financial (financial_id)
);

-- ---------------------------------------------------------
-- 47. client_ad_spend (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_ad_spend (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    platform ENUM('google_ads', 'meta_ads', 'tiktok_ads', 'linkedin_ads', 'twitter_ads', 'bing_ads', 'other') NOT NULL,
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    spend DECIMAL(15,2) NOT NULL,
    impressions BIGINT,
    clicks INT,
    conversions INT,
    conversion_value DECIMAL(15,2),
    ctr DECIMAL(8,4),
    cpc DECIMAL(8,2),
    cpa DECIMAL(10,2),
    roas DECIMAL(8,2),
    source ENUM('manual', 'automated') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_client_platform_period (client_id, platform, period_year, period_month),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client_period (client_id, period_year, period_month)
);

-- ---------------------------------------------------------
-- 48. interventions (FK -> clients, audit_recommendations, projects, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS interventions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    recommendation_id INT,
    project_id VARCHAR(36),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    intervention_type ENUM('website', 'seo', 'social', 'advertising', 'email', 'chatbot', 'branding', 'content', 'technical', 'performance', 'analytics', 'other') NOT NULL,
    status ENUM('planned', 'in_progress', 'completed', 'paused', 'launched', 'measuring', 'measured', 'archived') DEFAULT 'planned',
    planned_date DATE,
    implementation_date DATE,
    measurement_start DATE,
    measurement_end DATE,
    measurement_duration_days INT DEFAULT 90,
    cost_to_client DECIMAL(10,2),
    our_cost DECIMAL(10,2),
    overall_roi DECIMAL(10,2),
    revenue_impact_monthly DECIMAL(15,2),
    payback_period_days INT,
    effectiveness_rating ENUM('pending', 'exceptional', 'strong', 'moderate', 'weak', 'negative') DEFAULT 'pending',
    before_screenshot_url TEXT,
    after_screenshot_url TEXT,
    report_url TEXT,
    created_by VARCHAR(36),
    notes TEXT,
    client_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES audit_recommendations(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_client_status (client_id, status)
);

-- ---------------------------------------------------------
-- 49. intervention_metrics (FK -> interventions, growth_targets)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS intervention_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    intervention_id INT NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    metric_slug VARCHAR(200) NOT NULL,
    unit VARCHAR(50),
    baseline_value DECIMAL(15,2) NOT NULL,
    baseline_period_start DATE,
    baseline_period_end DATE,
    baseline_source TEXT,
    target_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    change_absolute DECIMAL(15,2),
    change_percent DECIMAL(10,2),
    attribution ENUM('primary', 'contributing', 'indirect', 'negative') DEFAULT 'primary',
    attribution_percent DECIMAL(5,2) DEFAULT 100,
    growth_target_id INT,
    data_source ENUM('google_analytics', 'search_console', 'pagespeed', 'facebook', 'instagram', 'google_business', 'financial', 'manual') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (growth_target_id) REFERENCES growth_targets(id) ON DELETE SET NULL,
    INDEX idx_intervention (intervention_id),
    CONSTRAINT chk_attribution CHECK (attribution_percent >= 0 AND attribution_percent <= 100)
);

-- ---------------------------------------------------------
-- 50. intervention_snapshots (FK -> intervention_metrics, interventions)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS intervention_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    intervention_metric_id INT NOT NULL,
    intervention_id INT NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    change_from_baseline DECIMAL(10,2),
    days_since_launch INT,
    checkpoint ENUM('7d', '14d', '30d', '60d', '90d', '180d', 'custom') DEFAULT 'custom',
    source ENUM('automated', 'manual') DEFAULT 'automated',
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_metric_id) REFERENCES intervention_metrics(id) ON DELETE CASCADE,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    INDEX idx_intervention_date (intervention_id, recorded_at),
    INDEX idx_metric (intervention_metric_id)
);

-- ---------------------------------------------------------
-- 51. intervention_alerts (FK -> interventions, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS intervention_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    intervention_id INT NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    alert_type ENUM('target_exceeded', 'negative_trend', 'high_roi', 'measurement_complete', 'all_positive', 'engagement_drop') NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'success', 'critical') DEFAULT 'info',
    is_read_admin BOOLEAN DEFAULT FALSE,
    is_read_client BOOLEAN DEFAULT FALSE,
    sent_to_client BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client (client_id)
);

-- ---------------------------------------------------------
-- 52. saved_filters (FK -> users, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_filters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36),
    client_id VARCHAR(36),
    user_type ENUM('admin', 'client') NOT NULL,
    name VARCHAR(200) NOT NULL,
    section VARCHAR(100) NOT NULL,
    filter_config JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 53. scheduled_reports (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    report_type ENUM('scorecard', 'financial_summary', 'growth_report', 'intervention_report', 'full_dashboard') NOT NULL,
    frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly') DEFAULT 'monthly',
    format ENUM('pdf', 'csv', 'xlsx') DEFAULT 'pdf',
    recipients JSON,
    last_sent_at TIMESTAMP NULL,
    next_send_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION C: Views (5 views)
-- ============================================================

-- v_client_health_summary: latest audit + recommendation counts + intervention stats per client
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

-- v_client_financial_summary: lifetime financial aggregates per client
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

-- v_intervention_roi_summary: intervention counts by status, ROI, effectiveness
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

-- v_audit_queue_status: active/approved clients with audit info and traffic light
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


SET FOREIGN_KEY_CHECKS = 1;
