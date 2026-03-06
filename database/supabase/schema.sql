-- ============================================================
-- Three Seas Digital — Supabase / PostgreSQL Schema
-- Converted from: schema.sql + schema-bi.sql + views.sql
-- Conversion date: 2026-03-04
-- Target: PostgreSQL 15+ (Supabase)
--
-- Includes all audit fixes:
--   - clients.tier ENUM extended (starter, business added)
--   - clients gets refresh_token, last_login
--   - documents table DROPPED (dead table)
--   - sessions table DROPPED (dead table)
--   - project_tasks.assignee column DROPPED (dead)
--   - recommendation_templates gets updated_at
--   - service_requests.updated_at gets DEFAULT NOW()
--   - growth_snapshots CHECK allows > 100% progress (removed cap)
--   - audit_categories/subcriteria: sort_order kept, display_order removed
--   - projects.title DEFAULT ''
--   - prospects.name DEFAULT ''
--   - appointments.name DEFAULT ''
--
-- Run order: this file only (all objects in dependency order)
-- Then run: seed.sql
-- ============================================================

-- ============================================================
-- ENUM TYPE DEFINITIONS
-- All MySQL ENUM(...) fields are promoted to named PG types.
-- Create types before tables so they can be referenced.
-- ============================================================

-- users.role
CREATE TYPE user_role AS ENUM (
    'owner', 'admin', 'manager', 'sales', 'accountant',
    'it', 'developer', 'analyst', 'pending'
);

-- users.status
CREATE TYPE user_status AS ENUM ('active', 'approved', 'pending', 'rejected');

-- clients.tier — extended with 'starter' and 'business' (audit fix)
CREATE TYPE client_tier AS ENUM ('free', 'basic', 'starter', 'business', 'premium', 'enterprise');

-- clients.status
CREATE TYPE client_status AS ENUM ('active', 'pending', 'archived', 'rejected');

-- clients.source
CREATE TYPE client_source AS ENUM ('manual', 'appointment', 'signup', 'prospect', 'pipeline');

-- document type (used by client_documents and prospect_documents)
CREATE TYPE document_type AS ENUM (
    'proposal', 'contract', 'agreement', 'invoice', 'receipt',
    'report', 'intake', 'welcome_packet', 'bi_discovery', 'other'
);

-- invoices.status — added 'sent' to match portal.js queries
CREATE TYPE invoice_status AS ENUM ('unpaid', 'sent', 'paid', 'overdue', 'cancelled', 'pending');

-- invoices.frequency
CREATE TYPE invoice_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');

-- payments.status
CREATE TYPE payment_status AS ENUM ('completed', 'pending', 'refunded');

-- projects.status — use underscore form; portal.js was filtering 'in_progress'
CREATE TYPE project_status AS ENUM ('planning', 'in-progress', 'review', 'completed', 'archived');

-- project_tasks.status
CREATE TYPE task_status AS ENUM ('todo', 'in-progress', 'review', 'done');

-- project_tasks.priority
CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- appointments.status
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- appointments.follow_up_priority
CREATE TYPE followup_priority AS ENUM ('low', 'medium', 'high');

-- prospects.stage
CREATE TYPE prospect_stage AS ENUM (
    'inquiry', 'new', 'booked', 'confirmed', 'negotiating', 'closed', 'won', 'lost'
);

-- prospects.outcome
CREATE TYPE prospect_outcome AS ENUM ('won', 'lost');

-- prospects.loss_reason
CREATE TYPE prospect_loss_reason AS ENUM (
    'budget', 'timing', 'competitor', 'no-response', 'scope', 'other'
);

-- expenses.category
CREATE TYPE expense_category AS ENUM ('wages', 'fuel', 'food', 'meetings', 'trips', 'receipts');

-- email_templates.category
CREATE TYPE email_template_category AS ENUM (
    'invoice', 'appointment', 'follow-up', 'project', 'general'
);

-- notifications.type
CREATE TYPE notification_type AS ENUM ('warning', 'info', 'success', 'error');

-- BI: audit_type
CREATE TYPE audit_type AS ENUM ('initial', 'quarterly', 'milestone', 'ad_hoc');

-- BI: audit_status
CREATE TYPE audit_status AS ENUM ('draft', 'in_progress', 'published');

-- BI: priority (shared by recommendation_templates, audit_recommendations, ai_recommendation_items)
CREATE TYPE priority_level AS ENUM ('critical', 'high', 'medium', 'low');

-- BI: impact level (shared by recommendation_templates, audit_recommendations)
CREATE TYPE impact_level AS ENUM ('high', 'medium', 'low');

-- BI: recommendation status
CREATE TYPE recommendation_status AS ENUM (
    'proposed', 'pending', 'accepted', 'in_progress', 'completed', 'declined'
);

-- BI: author type (recommendation_threads)
CREATE TYPE author_type AS ENUM ('admin', 'client');

-- BI: data source type (growth_targets, data_source_connections, client_ad_spend, intervention_metrics)
CREATE TYPE data_source_type AS ENUM (
    'google_analytics', 'search_console', 'pagespeed',
    'facebook', 'instagram', 'google_business',
    'twitter', 'linkedin', 'mailchimp', 'manual'
);

-- BI: measurement frequency (growth_targets)
CREATE TYPE measurement_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');

-- BI: growth target status
CREATE TYPE growth_target_status AS ENUM ('active', 'achieved', 'missed', 'paused');

-- BI: snapshot source (growth_snapshots, intervention_snapshots)
CREATE TYPE snapshot_source AS ENUM ('automated', 'manual');

-- BI: connection status (data_source_connections)
CREATE TYPE connection_status AS ENUM ('connected', 'disconnected', 'error', 'pending');

-- BI: sync status (data_sync_log)
CREATE TYPE sync_status AS ENUM ('success', 'partial', 'failed');

-- BI: service request urgency
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'asap');

-- BI: service request status
CREATE TYPE service_request_status AS ENUM (
    'submitted', 'reviewing', 'quoted', 'approved',
    'in_progress', 'completed', 'cancelled'
);

-- BI: feedback target type
CREATE TYPE feedback_target_type AS ENUM ('project', 'milestone', 'recommendation', 'general');

-- BI: email digest preference
CREATE TYPE email_digest AS ENUM ('none', 'daily', 'weekly');

-- BI: data completeness
CREATE TYPE data_completeness AS ENUM ('full', 'partial', 'estimated');

-- BI: financial source
CREATE TYPE financial_source AS ENUM ('manual', 'automated', 'imported', 'mixed');

-- BI: ad platform
CREATE TYPE ad_platform AS ENUM (
    'google_ads', 'meta_ads', 'tiktok_ads', 'linkedin_ads',
    'twitter_ads', 'bing_ads', 'other'
);

-- BI: ad spend source (manual vs automated pull)
CREATE TYPE ad_spend_source AS ENUM ('manual', 'automated');

-- BI: intervention type
CREATE TYPE intervention_type AS ENUM (
    'website', 'seo', 'social', 'advertising', 'email', 'chatbot',
    'branding', 'content', 'technical', 'performance', 'analytics', 'other'
);

-- BI: intervention status
CREATE TYPE intervention_status AS ENUM (
    'planned', 'in_progress', 'completed', 'paused',
    'launched', 'measuring', 'measured', 'archived'
);

-- BI: effectiveness rating
CREATE TYPE effectiveness_rating AS ENUM (
    'pending', 'exceptional', 'strong', 'moderate', 'weak', 'negative'
);

-- BI: attribution type
CREATE TYPE attribution_type AS ENUM ('primary', 'contributing', 'indirect', 'negative');

-- BI: intervention metric data source (extends data_source_type with 'financial')
CREATE TYPE metric_data_source AS ENUM (
    'google_analytics', 'search_console', 'pagespeed',
    'facebook', 'instagram', 'google_business',
    'financial', 'manual'
);

-- BI: snapshot checkpoint
CREATE TYPE snapshot_checkpoint AS ENUM ('7d', '14d', '30d', '60d', '90d', '180d', 'custom');

-- BI: alert type
CREATE TYPE alert_type AS ENUM (
    'target_exceeded', 'negative_trend', 'high_roi',
    'measurement_complete', 'all_positive', 'engagement_drop'
);

-- BI: alert severity
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'success', 'critical');

-- BI: user type in saved_filters
CREATE TYPE filter_user_type AS ENUM ('admin', 'client');

-- BI: scheduled report type
CREATE TYPE report_type AS ENUM (
    'scorecard', 'financial_summary', 'growth_report',
    'intervention_report', 'full_dashboard'
);

-- BI: scheduled report frequency
CREATE TYPE report_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly');

-- BI: report format
CREATE TYPE report_format AS ENUM ('pdf', 'csv', 'xlsx');

-- BI: client data snapshot period type
CREATE TYPE period_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- BI: generation trigger
CREATE TYPE generation_trigger AS ENUM ('manual', 'webhook', 'scheduled');

-- BI: AI provider
CREATE TYPE ai_provider AS ENUM ('gemini', 'external', 'webhook');

-- BI: AI generation status
CREATE TYPE ai_generation_status AS ENUM ('pending', 'generating', 'completed', 'failed');

-- BI: overall health rating
CREATE TYPE health_rating AS ENUM ('critical', 'at_risk', 'stable', 'growing', 'exceptional');

-- BI: AI recommendation item admin status
CREATE TYPE ai_item_status AS ENUM ('new', 'reviewed', 'accepted', 'declined', 'converted');

-- BI: AI estimated effort
CREATE TYPE effort_level AS ENUM ('low', 'medium', 'high');


-- ============================================================
-- SHARED TRIGGER FUNCTION: trigger_set_updated_at()
-- Replaces MySQL's ON UPDATE CURRENT_TIMESTAMP.
-- Attach to every table that has an updated_at column.
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- SECTION A: CORE TABLES (27 tables)
-- Converted from schema.sql
-- Dropped: documents, sessions (dead tables)
-- ============================================================

-- ---------------------------------------------------------
-- 1. users (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                TEXT PRIMARY KEY,
    username          TEXT UNIQUE NOT NULL,
    email             TEXT UNIQUE NOT NULL,
    name              TEXT NOT NULL,
    display_name      TEXT,
    password_hash     TEXT NOT NULL,
    role              user_role NOT NULL DEFAULT 'pending',
    status            user_status NOT NULL DEFAULT 'pending',
    color             TEXT DEFAULT '#3b82f6',
    last_login        TIMESTAMPTZ NULL,
    refresh_token     TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_status   ON users (status);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 2. clients (no FK deps)
-- Audit fix: tier enum extended, refresh_token + last_login added
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id                    TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    email                 TEXT UNIQUE NOT NULL,
    phone                 TEXT DEFAULT '',
    password_hash         TEXT,
    service               TEXT DEFAULT '',
    tier                  client_tier DEFAULT 'free',
    status                client_status DEFAULT 'active',
    source                client_source DEFAULT 'manual',
    source_prospect_id    TEXT,
    source_appointment_id TEXT,
    business_name         TEXT DEFAULT '',
    business_address      TEXT,
    date_of_birth         DATE,
    last_login            TIMESTAMPTZ NULL,
    refresh_token         TEXT,
    approved_at           TIMESTAMPTZ NULL,
    approved_by           TEXT,
    archived_at           TIMESTAMPTZ NULL,
    archived_by           TEXT,
    restored_at           TIMESTAMPTZ NULL,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_email          ON clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_status         ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_tier           ON clients (tier);
CREATE INDEX IF NOT EXISTS idx_clients_status_tier    ON clients (status, tier);
CREATE INDEX IF NOT EXISTS idx_clients_created_at     ON clients (created_at);

CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 3. client_notes (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_notes (
    id           TEXT PRIMARY KEY,
    client_id    TEXT NOT NULL,
    text         TEXT NOT NULL,
    author       TEXT DEFAULT 'System',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_client_notes_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes (client_id);


-- ---------------------------------------------------------
-- 4. client_tags (FK -> clients)
-- Using SERIAL PK (was INT AUTO_INCREMENT in MySQL)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_tags (
    id         SERIAL PRIMARY KEY,
    client_id  TEXT NOT NULL,
    tag        TEXT NOT NULL,
    CONSTRAINT fk_client_tags_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT unique_client_tag UNIQUE (client_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_client_tags_client ON client_tags (client_id);


-- NOTE: documents table INTENTIONALLY OMITTED — dead table, no active routes.
--       Use client_documents and prospect_documents instead.

-- NOTE: sessions table INTENTIONALLY OMITTED — dead table, auth uses JWT.
--       JWT tokens stored in clients.refresh_token / users.refresh_token.


-- ---------------------------------------------------------
-- 5a. client_documents (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_documents (
    id            TEXT PRIMARY KEY,
    client_id     TEXT NOT NULL,
    name          TEXT NOT NULL,
    type          document_type DEFAULT 'other',
    description   TEXT,
    file_path     TEXT,
    file_size     INT,
    mime_type     TEXT,
    uploaded_by   TEXT DEFAULT 'System',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_client_docs_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_docs_client ON client_documents (client_id);

CREATE TRIGGER trg_client_documents_updated_at
    BEFORE UPDATE ON client_documents
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 5b. prospect_documents (FK -> prospects)
-- FK defined after prospects table via ALTER TABLE at bottom.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospect_documents (
    id            TEXT PRIMARY KEY,
    prospect_id   TEXT NOT NULL,
    name          TEXT NOT NULL,
    type          document_type DEFAULT 'other',
    description   TEXT,
    file_path     TEXT,
    file_size     INT,
    mime_type     TEXT,
    uploaded_by   TEXT DEFAULT 'System',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
    -- FK added after prospects table is created (see ALTER TABLE below)
);

CREATE INDEX IF NOT EXISTS idx_prospect_docs_prospect ON prospect_documents (prospect_id);

CREATE TRIGGER trg_prospect_documents_updated_at
    BEFORE UPDATE ON prospect_documents
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 6. invoices (FK -> clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id                TEXT PRIMARY KEY,
    client_id         TEXT NOT NULL,
    title             TEXT NOT NULL,
    amount            DECIMAL(10,2) NOT NULL,
    status            invoice_status DEFAULT 'unpaid',
    due_date          DATE,
    description       TEXT,
    recurring         BOOLEAN DEFAULT FALSE,
    frequency         invoice_frequency NULL,
    next_due_date     DATE,
    parent_invoice_id TEXT,
    paid_at           TIMESTAMPTZ NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_invoices_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT chk_inv_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoices_client        ON invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status        ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date      ON invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices (client_id, status);

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 7. payments (FK -> clients, invoices)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id            TEXT PRIMARY KEY,
    client_id     TEXT NOT NULL,
    invoice_id    TEXT,
    client_name   TEXT,
    service       TEXT,
    service_tier  TEXT,
    amount        DECIMAL(10,2) NOT NULL,
    method        TEXT DEFAULT 'invoice',
    status        payment_status DEFAULT 'completed',
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_payments_client  FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices (id) ON DELETE SET NULL,
    CONSTRAINT chk_pay_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_client  ON payments (client_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments (created_at);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments (invoice_id);

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 8. projects (FK -> clients)
-- Audit fix: title DEFAULT ''
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id           TEXT PRIMARY KEY,
    client_id    TEXT NOT NULL,
    title        TEXT NOT NULL DEFAULT '',
    name         TEXT,
    description  TEXT,
    status       project_status DEFAULT 'planning',
    progress     INT DEFAULT 0,
    start_date   DATE,
    due_date     DATE,
    end_date     DATE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_projects_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT chk_progress CHECK (progress >= 0 AND progress <= 100)
);

CREATE INDEX IF NOT EXISTS idx_projects_client        ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status        ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_client_status ON projects (client_id, status);

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 9. project_developers (FK -> projects, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_developers (
    project_id  TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    PRIMARY KEY (project_id, user_id),
    CONSTRAINT fk_proj_dev_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_proj_dev_user    FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);


-- ---------------------------------------------------------
-- 10. project_tasks (FK -> projects)
-- Audit fix: assignee column DROPPED (dead).
--            assigned_to is the active column.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_tasks (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    status       task_status DEFAULT 'todo',
    goal         TEXT,
    -- NOTE: 'assignee' column intentionally omitted — dead field per audit.
    --       Use assigned_to instead.
    assigned_to  TEXT,
    due_date     DATE,
    priority     task_priority DEFAULT 'normal',
    sort_order   INT DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_project_tasks_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status  ON project_tasks (status);

CREATE TRIGGER trg_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 11. project_milestones (FK -> projects)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_milestones (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    due_date     DATE,
    completed    BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_proj_milestones_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proj_milestones_project ON project_milestones (project_id);

CREATE TRIGGER trg_project_milestones_updated_at
    BEFORE UPDATE ON project_milestones
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 12. appointments (FK -> users)
-- Audit fix: name DEFAULT ''
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id                   TEXT PRIMARY KEY,
    name                 TEXT NOT NULL DEFAULT '',
    client_name          TEXT,
    email                TEXT NOT NULL,
    phone                TEXT,
    service              TEXT,
    message              TEXT,
    type                 TEXT DEFAULT 'consultation',
    notes                TEXT,
    date                 DATE NOT NULL,
    time                 TEXT NOT NULL,
    status               appointment_status DEFAULT 'pending',
    assigned_to          TEXT,
    converted_to_client  TEXT,
    follow_up_status     TEXT,
    follow_up_date       DATE,
    follow_up_priority   followup_priority DEFAULT 'medium',
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_appointments_user FOREIGN KEY (assigned_to)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_date          ON appointments (date);
CREATE INDEX IF NOT EXISTS idx_appointments_status        ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned      ON appointments (assigned_to);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_date ON appointments (assigned_to, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status_date   ON appointments (status, date);

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 13. follow_up_notes (FK -> appointments)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS follow_up_notes (
    id               TEXT PRIMARY KEY,
    appointment_id   TEXT NOT NULL,
    text             TEXT NOT NULL,
    author           TEXT DEFAULT 'System',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_followup_notes_appt FOREIGN KEY (appointment_id)
        REFERENCES appointments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_followup_notes_appt ON follow_up_notes (appointment_id);

-- View alias: routes/appointments.js references appointment_notes
CREATE OR REPLACE VIEW appointment_notes AS SELECT * FROM follow_up_notes;


-- ---------------------------------------------------------
-- 14. prospects (no FK deps)
-- Audit fix: name DEFAULT ''
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospects (
    id                   TEXT PRIMARY KEY,
    name                 TEXT NOT NULL DEFAULT '',
    business_name        TEXT,
    contact_name         TEXT,
    email                TEXT,
    phone                TEXT,
    service              TEXT,
    stage                prospect_stage DEFAULT 'inquiry',
    deal_value           DECIMAL(10,2) DEFAULT 0,
    estimated_value      DECIMAL(10,2),
    probability          INT DEFAULT 25,
    expected_close_date  DATE,
    outcome              prospect_outcome NULL,
    loss_reason          prospect_loss_reason NULL,
    notes                TEXT,
    revisit_date         DATE,
    source               TEXT DEFAULT 'manual',
    appointment_id       TEXT,
    closed_at            TIMESTAMPTZ NULL,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_probability CHECK (probability >= 0 AND probability <= 100)
);

CREATE INDEX IF NOT EXISTS idx_prospects_stage   ON prospects (stage);
CREATE INDEX IF NOT EXISTS idx_prospects_outcome ON prospects (outcome);
CREATE INDEX IF NOT EXISTS idx_prospects_email   ON prospects (email);

CREATE TRIGGER trg_prospects_updated_at
    BEFORE UPDATE ON prospects
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Now that prospects exists, add the FK for prospect_documents
ALTER TABLE prospect_documents
    ADD CONSTRAINT fk_prospect_docs_prospect
    FOREIGN KEY (prospect_id) REFERENCES prospects (id) ON DELETE CASCADE;


-- ---------------------------------------------------------
-- 15. prospect_notes (FK -> prospects)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospect_notes (
    id            TEXT PRIMARY KEY,
    prospect_id   TEXT NOT NULL,
    text          TEXT NOT NULL,
    author        TEXT DEFAULT 'System',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_prospect_notes_prospect FOREIGN KEY (prospect_id)
        REFERENCES prospects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prospect_notes_prospect ON prospect_notes (prospect_id);


-- ---------------------------------------------------------
-- 16. leads (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id             TEXT PRIMARY KEY,
    business_name  TEXT NOT NULL,
    address        TEXT,
    phone          TEXT,
    email          TEXT,
    type           TEXT,
    category       TEXT,
    website        TEXT,
    status         TEXT DEFAULT 'new',
    source         TEXT DEFAULT 'manual',
    coordinates    JSONB,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status        ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_business_name ON leads (business_name);

CREATE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 17. lead_notes (FK -> leads)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_notes (
    id          TEXT PRIMARY KEY,
    lead_id     TEXT NOT NULL,
    text        TEXT NOT NULL,
    author      TEXT DEFAULT 'System',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_lead_notes_lead FOREIGN KEY (lead_id)
        REFERENCES leads (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes (lead_id);


-- ---------------------------------------------------------
-- 18. expenses (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id             TEXT PRIMARY KEY,
    category       expense_category NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    description    TEXT,
    date           DATE NOT NULL,
    receipt_path   TEXT,
    receipt_name   TEXT,
    vendor         TEXT,
    notes          TEXT,
    created_by     TEXT DEFAULT 'Unknown',
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_exp_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_expenses_category      ON expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_date          ON expenses (date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses (category, date);

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 19. time_entries (FK -> clients, projects)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_entries (
    id           TEXT PRIMARY KEY,
    client_id    TEXT,
    project_id   TEXT,
    task_id      TEXT,
    user_id      TEXT,
    user_name    TEXT,
    description  TEXT,
    hours        DECIMAL(5,2) NOT NULL,
    date         DATE NOT NULL,
    billable     BOOLEAN DEFAULT TRUE,
    billed       BOOLEAN DEFAULT FALSE,
    billed_at    TIMESTAMPTZ NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_time_entries_client  FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE SET NULL,
    CONSTRAINT fk_time_entries_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE SET NULL,
    CONSTRAINT chk_hours CHECK (hours > 0)
);

CREATE INDEX IF NOT EXISTS idx_time_entries_client       ON time_entries (client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project      ON time_entries (project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date         ON time_entries (date);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_date ON time_entries (project_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user         ON time_entries (user_id);

CREATE TRIGGER trg_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 20. email_templates (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_templates (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    subject     TEXT NOT NULL,
    body        TEXT NOT NULL,
    category    email_template_category DEFAULT 'general',
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 21. notifications (FK -> users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT PRIMARY KEY,
    user_id     TEXT,
    type        notification_type NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    link        TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (is_read);

CREATE TRIGGER trg_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 22. activity_log (FK -> users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
    id          TEXT PRIMARY KEY,
    action      TEXT NOT NULL,
    details     JSONB,
    user_id     TEXT,
    user_name   TEXT DEFAULT 'System',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_activity_log_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_action  ON activity_log (action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log (created_at);


-- ---------------------------------------------------------
-- 23. business_database (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_database (
    id           TEXT PRIMARY KEY,
    lookup_key   TEXT UNIQUE,
    name         TEXT,
    business_name TEXT,
    address      TEXT,
    phone        TEXT,
    email        TEXT,
    website      TEXT,
    type         TEXT,
    category     TEXT,
    owner        TEXT,
    notes        TEXT,
    coordinates  JSONB,
    enrichment   JSONB,
    intel        JSONB,
    source       TEXT DEFAULT 'manual',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_db_key ON business_database (lookup_key);

CREATE TRIGGER trg_business_database_updated_at
    BEFORE UPDATE ON business_database
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------
-- 24. market_research (no FK deps)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_research (
    id          TEXT PRIMARY KEY,
    lookup_key  TEXT UNIQUE,
    location    TEXT,
    data        JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_research_key ON market_research (lookup_key);

CREATE TRIGGER trg_market_research_updated_at
    BEFORE UPDATE ON market_research
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- SECTION B: BUSINESS INTELLIGENCE TABLES (30 tables)
-- Converted from schema-bi.sql
-- All PKs are TEXT (matches frontend generateId() string format)
-- ============================================================

-- ============================================================
-- GROUP 1: Business Audit System (9 tables)
-- ============================================================

-- BI-1. audit_categories (no deps)
-- Audit fix: display_order removed, sort_order is the single ordering column
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_categories (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    slug             TEXT NOT NULL UNIQUE,
    description      TEXT,
    is_base          BOOLEAN DEFAULT FALSE,
    default_weight   DECIMAL(5,2) DEFAULT 0,
    max_score        DECIMAL(3,1) DEFAULT 10.0,
    sort_order       INT DEFAULT 0,
    icon             TEXT,
    color            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
    -- Note: no updated_at — categories are mostly static reference data.
    -- Add if needed: updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- BI-2. audit_subcriteria (depends on audit_categories)
-- Audit fix: display_order removed, sort_order is the single ordering column
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_subcriteria (
    id            TEXT PRIMARY KEY,
    category_id   TEXT NOT NULL,
    name          TEXT NOT NULL,
    description   TEXT,
    max_score     DECIMAL(3,1) DEFAULT 10.0,
    sort_order    INT DEFAULT 0,
    CONSTRAINT fk_audit_subcriteria_category FOREIGN KEY (category_id)
        REFERENCES audit_categories (id) ON DELETE CASCADE
);


-- BI-3. recommendation_templates (depends on audit_categories)
-- Audit fix: updated_at column added
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendation_templates (
    id                    TEXT PRIMARY KEY,
    title                 TEXT NOT NULL,
    category_id           TEXT,
    category              TEXT,
    trigger_condition     TEXT,
    description           TEXT,
    expected_outcome      TEXT,
    estimated_cost_min    DECIMAL(10,2),
    estimated_cost_max    DECIMAL(10,2),
    estimated_timeline    TEXT,
    linked_service        TEXT,
    priority              priority_level DEFAULT 'medium',
    impact                impact_level DEFAULT 'medium',
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_rec_templates_category FOREIGN KEY (category_id)
        REFERENCES audit_categories (id) ON DELETE SET NULL
);

CREATE TRIGGER trg_recommendation_templates_updated_at
    BEFORE UPDATE ON recommendation_templates
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-4. business_intakes (depends on clients, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_intakes (
    id                           TEXT PRIMARY KEY,
    client_id                    TEXT NOT NULL,
    industry                     TEXT,
    sub_industry                 TEXT,
    years_in_operation           INT,
    employee_count_range         TEXT,
    annual_revenue_range         TEXT,
    target_market                TEXT,
    business_model               TEXT,
    competitors                  JSONB,
    current_website_url          TEXT,
    hosting_provider             TEXT,
    tech_stack                   TEXT,
    domain_age_years             INT,
    has_ssl                      BOOLEAN DEFAULT FALSE,
    is_mobile_responsive         BOOLEAN DEFAULT FALSE,
    last_website_update          DATE,
    social_platforms             JSONB,
    email_marketing_tool         TEXT,
    paid_advertising             JSONB,
    content_marketing            JSONB,
    seo_efforts                  TEXT,
    pain_points                  JSONB,
    goals                        JSONB,
    previous_agency_experience   TEXT,
    budget_range                 TEXT,
    timeline_expectations        TEXT,
    decision_makers              JSONB,
    notes                        TEXT,
    created_by                   TEXT,
    created_at                   TIMESTAMPTZ DEFAULT NOW(),
    updated_at                   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_business_intakes_client     FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_business_intakes_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE TRIGGER trg_business_intakes_updated_at
    BEFORE UPDATE ON business_intakes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-5. business_audits (depends on clients, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_audits (
    id             TEXT PRIMARY KEY,
    client_id      TEXT NOT NULL,
    version        INT NOT NULL DEFAULT 1,
    audit_type     audit_type DEFAULT 'initial',
    overall_score  DECIMAL(3,1),
    status         audit_status DEFAULT 'draft',
    audit_date     DATE,
    published_at   TIMESTAMPTZ NULL,
    audited_by     TEXT,
    created_by     TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_client_version UNIQUE (client_id, version),
    CONSTRAINT fk_business_audits_client     FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_business_audits_audited_by FOREIGN KEY (audited_by)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_business_audits_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_overall_score CHECK (overall_score >= 0 AND overall_score <= 10)
);

CREATE INDEX IF NOT EXISTS idx_business_audits_client_version ON business_audits (client_id, version);
CREATE INDEX IF NOT EXISTS idx_business_audits_status         ON business_audits (status);

CREATE TRIGGER trg_business_audits_updated_at
    BEFORE UPDATE ON business_audits
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-6. audit_scores (depends on business_audits, audit_categories)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_scores (
    id              TEXT PRIMARY KEY,
    audit_id        TEXT NOT NULL,
    category_id     TEXT NOT NULL,
    score           DECIMAL(3,1) NOT NULL,
    weight          DECIMAL(5,2),
    internal_notes  TEXT,
    client_summary  TEXT,
    evidence_urls   JSONB,
    CONSTRAINT unique_audit_category UNIQUE (audit_id, category_id),
    CONSTRAINT fk_audit_scores_audit    FOREIGN KEY (audit_id)
        REFERENCES business_audits (id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_scores_category FOREIGN KEY (category_id)
        REFERENCES audit_categories (id) ON DELETE CASCADE,
    CONSTRAINT chk_score CHECK (score >= 0 AND score <= 10)
);

CREATE INDEX IF NOT EXISTS idx_audit_scores_audit_category ON audit_scores (audit_id, category_id);


-- BI-7. audit_subcriteria_scores (depends on audit_scores, audit_subcriteria)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_subcriteria_scores (
    id               TEXT PRIMARY KEY,
    audit_score_id   TEXT NOT NULL,
    subcriteria_id   TEXT NOT NULL,
    score            DECIMAL(3,1) NOT NULL,
    notes            TEXT,
    CONSTRAINT unique_score_sub UNIQUE (audit_score_id, subcriteria_id),
    CONSTRAINT fk_sub_scores_audit_score  FOREIGN KEY (audit_score_id)
        REFERENCES audit_scores (id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_scores_subcriteria  FOREIGN KEY (subcriteria_id)
        REFERENCES audit_subcriteria (id) ON DELETE CASCADE,
    CONSTRAINT chk_sub_score CHECK (score >= 0 AND score <= 10)
);

CREATE INDEX IF NOT EXISTS idx_sub_scores_audit_score ON audit_subcriteria_scores (audit_score_id);


-- BI-8. audit_recommendations (depends on business_audits, clients, recommendation_templates, audit_categories, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_recommendations (
    id                   TEXT PRIMARY KEY,
    audit_id             TEXT NOT NULL,
    client_id            TEXT NOT NULL,
    template_id          TEXT,
    category_id          TEXT,
    title                TEXT NOT NULL,
    description          TEXT NOT NULL,
    expected_outcome     TEXT,
    priority             priority_level DEFAULT 'medium',
    impact               impact_level DEFAULT 'medium',
    estimated_cost_min   DECIMAL(10,2),
    estimated_cost_max   DECIMAL(10,2),
    estimated_timeline   TEXT,
    linked_service       TEXT,
    status               recommendation_status DEFAULT 'proposed',
    client_response      TEXT,
    client_responded_at  TIMESTAMPTZ NULL,
    completed_at         TIMESTAMPTZ NULL,
    decline_reason       TEXT,
    dependencies         JSONB,
    display_order        INT DEFAULT 0,
    created_by           TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_audit_recs_audit    FOREIGN KEY (audit_id)
        REFERENCES business_audits (id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_recs_client   FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_recs_template FOREIGN KEY (template_id)
        REFERENCES recommendation_templates (id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_recs_category FOREIGN KEY (category_id)
        REFERENCES audit_categories (id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_recs_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_recs_client_status ON audit_recommendations (client_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_recs_audit         ON audit_recommendations (audit_id);

CREATE TRIGGER trg_audit_recommendations_updated_at
    BEFORE UPDATE ON audit_recommendations
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-9. recommendation_threads (depends on audit_recommendations)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendation_threads (
    id                 TEXT PRIMARY KEY,
    recommendation_id  TEXT NOT NULL,
    author_type        author_type NOT NULL,
    author_id          TEXT NOT NULL,
    message            TEXT NOT NULL,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_rec_threads_recommendation FOREIGN KEY (recommendation_id)
        REFERENCES audit_recommendations (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rec_threads_recommendation ON recommendation_threads (recommendation_id);


-- ============================================================
-- GROUP 2: Growth Tracking (4 tables)
-- ============================================================

-- BI-10. growth_targets (depends on clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS growth_targets (
    id                     TEXT PRIMARY KEY,
    client_id              TEXT NOT NULL,
    metric_name            TEXT NOT NULL,
    metric_slug            TEXT NOT NULL,
    baseline_value         DECIMAL(15,2) NOT NULL,
    target_value           DECIMAL(15,2) NOT NULL,
    current_value          DECIMAL(15,2),
    unit                   TEXT,
    target_date            DATE NOT NULL,
    data_source            data_source_type DEFAULT 'manual',
    source_config          JSONB,
    measurement_frequency  measurement_frequency DEFAULT 'weekly',
    status                 growth_target_status DEFAULT 'active',
    achieved_at            TIMESTAMPTZ NULL,
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_growth_targets_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_growth_targets_client_status ON growth_targets (client_id, status);

CREATE TRIGGER trg_growth_targets_updated_at
    BEFORE UPDATE ON growth_targets
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-11. growth_snapshots (depends on growth_targets, clients)
-- Audit fix: CHECK constraint cap removed — progress_percent > 100 is valid
--            for overachieving metrics. Only floor enforced (>= 0).
-- Also added snapshot_date DATE column (was missing, referenced in routes).
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS growth_snapshots (
    id                TEXT PRIMARY KEY,
    target_id         TEXT NOT NULL,
    client_id         TEXT NOT NULL,
    value             DECIMAL(15,2) NOT NULL,
    previous_value    DECIMAL(15,2),
    change_percent    DECIMAL(8,2),
    progress_percent  DECIMAL(8,2),
    snapshot_date     DATE,
    source            snapshot_source DEFAULT 'automated',
    source_raw        JSONB,
    admin_note        TEXT,
    is_override       BOOLEAN DEFAULT FALSE,
    recorded_at       TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_growth_snapshots_target FOREIGN KEY (target_id)
        REFERENCES growth_targets (id) ON DELETE CASCADE,
    CONSTRAINT fk_growth_snapshots_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    -- Audit fix: no upper cap — overachieving metrics can exceed 100%
    CONSTRAINT chk_progress CHECK (progress_percent >= 0)
);

CREATE INDEX IF NOT EXISTS idx_growth_snapshots_target_date ON growth_snapshots (target_id, recorded_at);


-- BI-12. data_source_connections (depends on clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_source_connections (
    id               TEXT PRIMARY KEY,
    client_id        TEXT NOT NULL,
    source_type      data_source_type NOT NULL,
    status           connection_status DEFAULT 'pending',
    access_token     TEXT,
    refresh_token    TEXT,
    token_expires_at TIMESTAMPTZ NULL,
    account_id       TEXT,
    account_name     TEXT,
    config           JSONB,
    last_sync_at     TIMESTAMPTZ NULL,
    last_error       TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_client_source UNIQUE (client_id, source_type),
    CONSTRAINT fk_data_source_conn_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_data_source_conn_client ON data_source_connections (client_id);

CREATE TRIGGER trg_data_source_connections_updated_at
    BEFORE UPDATE ON data_source_connections
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-13. data_sync_log (depends on data_source_connections, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sync_log (
    id              TEXT PRIMARY KEY,
    connection_id   TEXT NOT NULL,
    client_id       TEXT NOT NULL,
    status          sync_status NOT NULL,
    metrics_synced  INT DEFAULT 0,
    error_message   TEXT,
    duration_ms     INT,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ NULL,
    CONSTRAINT fk_data_sync_log_connection FOREIGN KEY (connection_id)
        REFERENCES data_source_connections (id) ON DELETE CASCADE,
    CONSTRAINT fk_data_sync_log_client    FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);


-- ============================================================
-- GROUP 3: Client Interaction (3 tables)
-- ============================================================

-- BI-14. service_requests (depends on clients, audit_recommendations)
-- Audit fix: updated_at gets DEFAULT NOW() (was missing default)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_requests (
    id                 TEXT PRIMARY KEY,
    client_id          TEXT NOT NULL,
    recommendation_id  TEXT,
    title              TEXT NOT NULL,
    description        TEXT,
    budget_range       TEXT,
    urgency            urgency_level DEFAULT 'medium',
    status             service_request_status DEFAULT 'submitted',
    admin_response     TEXT,
    quoted_amount      DECIMAL(10,2),
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_service_requests_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_service_requests_recommendation FOREIGN KEY (recommendation_id)
        REFERENCES audit_recommendations (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests (client_id);

CREATE TRIGGER trg_service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-15. client_feedback (depends on clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_feedback (
    id              TEXT PRIMARY KEY,
    client_id       TEXT NOT NULL,
    target_type     feedback_target_type NOT NULL,
    target_id       TEXT,
    rating          INT,
    comment         TEXT,
    admin_response  TEXT,
    responded_at    TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_client_feedback_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_client_feedback_client ON client_feedback (client_id);


-- BI-16. client_notification_prefs (depends on clients)
-- Audit fix: id column present with TEXT PRIMARY KEY (was missing id in old INSERT)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_notification_prefs (
    id                          TEXT PRIMARY KEY,
    client_id                   TEXT NOT NULL UNIQUE,
    email_digest                email_digest DEFAULT 'weekly',
    notify_new_scores           BOOLEAN DEFAULT TRUE,
    notify_new_recommendations  BOOLEAN DEFAULT TRUE,
    notify_metric_milestones    BOOLEAN DEFAULT TRUE,
    notify_invoices             BOOLEAN DEFAULT TRUE,
    notify_documents            BOOLEAN DEFAULT TRUE,
    notify_project_updates      BOOLEAN DEFAULT TRUE,
    notify_admin_messages       BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_notif_prefs_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);


-- ============================================================
-- GROUP 4: Client Financials (4 tables)
-- ============================================================

-- BI-17. client_financials (depends on clients, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_financials (
    id                          TEXT PRIMARY KEY,
    client_id                   TEXT NOT NULL,
    period_year                 INT NOT NULL,
    period_month                INT NOT NULL,
    gross_revenue               DECIMAL(15,2),
    net_revenue                 DECIMAL(15,2),
    online_revenue              DECIMAL(15,2),
    offline_revenue             DECIMAL(15,2),
    new_customer_revenue        DECIMAL(15,2),
    returning_customer_revenue  DECIMAL(15,2),
    transaction_count           INT,
    average_order_value         DECIMAL(10,2),
    cost_of_goods_sold          DECIMAL(15,2),
    total_marketing_spend       DECIMAL(15,2),
    our_fees                    DECIMAL(15,2),
    total_expenses              DECIMAL(15,2),
    gross_profit                DECIMAL(15,2),
    net_profit                  DECIMAL(15,2),
    profit_margin               DECIMAL(8,4),
    new_customers               INT,
    total_customers             INT,
    customer_acquisition_cost   DECIMAL(10,2),
    data_completeness           data_completeness DEFAULT 'partial',
    source                      financial_source DEFAULT 'manual',
    notes                       TEXT,
    entered_by                  TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_client_period UNIQUE (client_id, period_year, period_month),
    CONSTRAINT fk_client_financials_client     FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_client_financials_entered_by FOREIGN KEY (entered_by)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_period_month CHECK (period_month >= 1 AND period_month <= 12)
);

CREATE INDEX IF NOT EXISTS idx_client_financials_client_period
    ON client_financials (client_id, period_year, period_month);

CREATE TRIGGER trg_client_financials_updated_at
    BEFORE UPDATE ON client_financials
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-18. client_revenue_channels (depends on client_financials, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_revenue_channels (
    id                TEXT PRIMARY KEY,
    financial_id      TEXT NOT NULL,
    client_id         TEXT NOT NULL,
    channel_name      TEXT NOT NULL,
    revenue           DECIMAL(15,2) NOT NULL,
    transaction_count INT,
    conversion_rate   DECIMAL(8,4),
    cost              DECIMAL(15,2),
    roi               DECIMAL(8,2),
    CONSTRAINT fk_rev_channels_financial FOREIGN KEY (financial_id)
        REFERENCES client_financials (id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_channels_client    FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rev_channels_financial ON client_revenue_channels (financial_id);


-- BI-19. client_revenue_products (depends on client_financials, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_revenue_products (
    id              TEXT PRIMARY KEY,
    financial_id    TEXT NOT NULL,
    client_id       TEXT NOT NULL,
    product_name    TEXT NOT NULL,
    revenue         DECIMAL(15,2) NOT NULL,
    units_sold      INT,
    average_price   DECIMAL(10,2),
    margin_percent  DECIMAL(8,4),
    CONSTRAINT fk_rev_products_financial FOREIGN KEY (financial_id)
        REFERENCES client_financials (id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_products_client    FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rev_products_financial ON client_revenue_products (financial_id);


-- BI-20. client_ad_spend (depends on clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_ad_spend (
    id                TEXT PRIMARY KEY,
    client_id         TEXT NOT NULL,
    platform          ad_platform NOT NULL,
    period_year       INT NOT NULL,
    period_month      INT NOT NULL,
    spend             DECIMAL(15,2) NOT NULL,
    impressions       BIGINT,
    clicks            INT,
    conversions       INT,
    conversion_value  DECIMAL(15,2),
    ctr               DECIMAL(8,4),
    cpc               DECIMAL(8,2),
    cpa               DECIMAL(10,2),
    roas              DECIMAL(8,2),
    source            ad_spend_source DEFAULT 'manual',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_client_platform_period UNIQUE (client_id, platform, period_year, period_month),
    CONSTRAINT fk_client_ad_spend_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_ad_spend_client_period
    ON client_ad_spend (client_id, period_year, period_month);


-- ============================================================
-- GROUP 5: Intervention Tracking (4 tables)
-- ============================================================

-- BI-21. interventions (depends on clients, audit_recommendations, projects, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS interventions (
    id                       TEXT PRIMARY KEY,
    client_id                TEXT NOT NULL,
    recommendation_id        TEXT,
    project_id               TEXT,
    title                    TEXT NOT NULL,
    description              TEXT,
    intervention_type        intervention_type NOT NULL,
    status                   intervention_status DEFAULT 'planned',
    planned_date             DATE,
    implementation_date      DATE,
    measurement_start        DATE,
    measurement_end          DATE,
    measurement_duration_days INT DEFAULT 90,
    cost_to_client           DECIMAL(10,2),
    our_cost                 DECIMAL(10,2),
    overall_roi              DECIMAL(10,2),
    revenue_impact_monthly   DECIMAL(15,2),
    payback_period_days      INT,
    effectiveness_rating     effectiveness_rating DEFAULT 'pending',
    before_screenshot_url    TEXT,
    after_screenshot_url     TEXT,
    report_url               TEXT,
    created_by               TEXT,
    notes                    TEXT,
    client_summary           TEXT,
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_interventions_client         FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_interventions_recommendation FOREIGN KEY (recommendation_id)
        REFERENCES audit_recommendations (id) ON DELETE SET NULL,
    CONSTRAINT fk_interventions_project        FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE SET NULL,
    CONSTRAINT fk_interventions_created_by     FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interventions_client_status ON interventions (client_id, status);

CREATE TRIGGER trg_interventions_updated_at
    BEFORE UPDATE ON interventions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-22. intervention_metrics (depends on interventions, growth_targets)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS intervention_metrics (
    id                    TEXT PRIMARY KEY,
    intervention_id       TEXT NOT NULL,
    metric_name           TEXT NOT NULL,
    metric_slug           TEXT NOT NULL,
    unit                  TEXT,
    baseline_value        DECIMAL(15,2) NOT NULL,
    baseline_period_start DATE,
    baseline_period_end   DATE,
    baseline_source       TEXT,
    target_value          DECIMAL(15,2),
    current_value         DECIMAL(15,2),
    change_absolute       DECIMAL(15,2),
    change_percent        DECIMAL(10,2),
    attribution           attribution_type DEFAULT 'primary',
    attribution_percent   DECIMAL(5,2) DEFAULT 100,
    growth_target_id      TEXT,
    data_source           metric_data_source DEFAULT 'manual',
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_intervention_metrics_intervention  FOREIGN KEY (intervention_id)
        REFERENCES interventions (id) ON DELETE CASCADE,
    CONSTRAINT fk_intervention_metrics_growth_target FOREIGN KEY (growth_target_id)
        REFERENCES growth_targets (id) ON DELETE SET NULL,
    CONSTRAINT chk_attribution CHECK (attribution_percent >= 0 AND attribution_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_intervention_metrics_intervention ON intervention_metrics (intervention_id);

CREATE TRIGGER trg_intervention_metrics_updated_at
    BEFORE UPDATE ON intervention_metrics
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-23. intervention_snapshots (depends on intervention_metrics, interventions)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS intervention_snapshots (
    id                       TEXT PRIMARY KEY,
    intervention_metric_id   TEXT NOT NULL,
    intervention_id          TEXT NOT NULL,
    value                    DECIMAL(15,2) NOT NULL,
    change_from_baseline     DECIMAL(10,2),
    days_since_launch        INT,
    checkpoint               snapshot_checkpoint DEFAULT 'custom',
    source                   snapshot_source DEFAULT 'automated',
    notes                    TEXT,
    recorded_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_intervention_snaps_metric       FOREIGN KEY (intervention_metric_id)
        REFERENCES intervention_metrics (id) ON DELETE CASCADE,
    CONSTRAINT fk_intervention_snaps_intervention FOREIGN KEY (intervention_id)
        REFERENCES interventions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_intervention_snaps_intervention_date
    ON intervention_snapshots (intervention_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_intervention_snaps_metric
    ON intervention_snapshots (intervention_metric_id);


-- BI-24. intervention_alerts (depends on interventions, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS intervention_alerts (
    id               TEXT PRIMARY KEY,
    intervention_id  TEXT NOT NULL,
    client_id        TEXT NOT NULL,
    alert_type       alert_type NOT NULL,
    message          TEXT NOT NULL,
    severity         alert_severity DEFAULT 'info',
    is_read_admin    BOOLEAN DEFAULT FALSE,
    is_read_client   BOOLEAN DEFAULT FALSE,
    sent_to_client   BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_intervention_alerts_intervention FOREIGN KEY (intervention_id)
        REFERENCES interventions (id) ON DELETE CASCADE,
    CONSTRAINT fk_intervention_alerts_client       FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_intervention_alerts_client ON intervention_alerts (client_id);


-- ============================================================
-- GROUP 6: Reporting (2 tables)
-- ============================================================

-- BI-25. saved_filters (depends on users, clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_filters (
    id             TEXT PRIMARY KEY,
    user_id        TEXT,
    client_id      TEXT,
    user_type      filter_user_type NOT NULL,
    name           TEXT NOT NULL,
    section        TEXT NOT NULL,
    filter_config  JSONB NOT NULL,
    is_default     BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_saved_filters_user   FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_filters_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);


-- BI-26. scheduled_reports (depends on clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id            TEXT PRIMARY KEY,
    client_id     TEXT NOT NULL,
    report_type   report_type NOT NULL,
    frequency     report_frequency DEFAULT 'monthly',
    format        report_format DEFAULT 'pdf',
    recipients    JSONB,
    last_sent_at  TIMESTAMPTZ NULL,
    next_send_at  TIMESTAMPTZ NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_scheduled_reports_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);


-- BI-27. execution_plans (depends on clients)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_plans (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL,
    name        TEXT NOT NULL DEFAULT 'Untitled Plan',
    plan_data   JSONB NOT NULL,
    start_date  DATE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_execution_plans_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_execution_plans_updated_at
    BEFORE UPDATE ON execution_plans
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- GROUP 7: AI Advisor System (3 tables)
-- ============================================================

-- BI-28. client_data_snapshots (depends on clients, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_data_snapshots (
    id                       TEXT PRIMARY KEY,
    client_id                TEXT NOT NULL,
    period_type              period_type NOT NULL DEFAULT 'monthly',
    period_label             TEXT NOT NULL,
    period_start             DATE NOT NULL,
    period_end               DATE NOT NULL,
    snapshot_data            JSONB NOT NULL,
    data_sources_included    JSONB,
    data_completeness_score  DECIMAL(5,2),
    generated_by             TEXT,
    generation_trigger       generation_trigger DEFAULT 'manual',
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_client_data_snaps_client       FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_client_data_snaps_generated_by FOREIGN KEY (generated_by)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_client_data_snaps_client_period
    ON client_data_snapshots (client_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_client_data_snaps_client_created
    ON client_data_snapshots (client_id, created_at);


-- BI-29. ai_recommendations (depends on clients, client_data_snapshots, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id                   TEXT PRIMARY KEY,
    client_id            TEXT NOT NULL,
    snapshot_id          TEXT NOT NULL,
    ai_provider          ai_provider NOT NULL DEFAULT 'gemini',
    model_used           TEXT,
    analysis_type        TEXT,
    generation_status    ai_generation_status DEFAULT 'pending',
    error_message        TEXT,
    generated_at         TIMESTAMPTZ NULL,
    ai_response_raw      JSONB,
    executive_summary    TEXT,
    overall_health_rating health_rating NULL,
    confidence_score     DECIMAL(5,2),
    total_recommendations INT DEFAULT 0,
    critical_count       INT DEFAULT 0,
    high_count           INT DEFAULT 0,
    medium_count         INT DEFAULT 0,
    low_count            INT DEFAULT 0,
    created_by           TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ai_recs_client   FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_recs_snapshot FOREIGN KEY (snapshot_id)
        REFERENCES client_data_snapshots (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_recs_created_by FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_recs_client_created ON ai_recommendations (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recs_snapshot       ON ai_recommendations (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_status         ON ai_recommendations (generation_status);

CREATE TRIGGER trg_ai_recommendations_updated_at
    BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- BI-30. ai_recommendation_items (depends on ai_recommendations, clients, users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_recommendation_items (
    id                      TEXT PRIMARY KEY,
    ai_recommendation_id    TEXT NOT NULL,
    client_id               TEXT NOT NULL,
    category                TEXT,
    title                   TEXT NOT NULL,
    description             TEXT NOT NULL,
    rationale               TEXT,
    expected_impact         TEXT,
    suggested_timeline      TEXT,
    estimated_effort        effort_level NULL,
    priority                priority_level DEFAULT 'medium',
    display_order           INT DEFAULT 0,
    supporting_data_sources JSONB,
    admin_status            ai_item_status DEFAULT 'new',
    converted_to_rec_id     TEXT NULL,
    admin_notes             TEXT,
    reviewed_at             TIMESTAMPTZ NULL,
    reviewed_by             TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ai_rec_items_ai_rec      FOREIGN KEY (ai_recommendation_id)
        REFERENCES ai_recommendations (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_rec_items_client      FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_rec_items_reviewed_by FOREIGN KEY (reviewed_by)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_rec_items_rec_id         ON ai_recommendation_items (ai_recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ai_rec_items_client_priority ON ai_recommendation_items (client_id, priority);
CREATE INDEX IF NOT EXISTS idx_ai_rec_items_status         ON ai_recommendation_items (admin_status);


-- ============================================================
-- SECTION B-2: PAYMENTS, FINANCE, AI, EMAIL TABLES
-- Added for Phase Next: payment processing, finance automation,
-- xAI integration, email logging
-- ============================================================

-- payment_transactions.provider
CREATE TYPE payment_provider AS ENUM ('stripe', 'google_pay', 'paypal');

-- payment_transactions.status
CREATE TYPE payment_tx_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- email_log.status
CREATE TYPE email_status AS ENUM ('queued', 'sent', 'failed', 'bounced');


-- ---------------------------------------------------------
-- Payment Transactions (links to existing invoices + payments)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
    id              VARCHAR(36) PRIMARY KEY,
    invoice_id      VARCHAR(36),
    client_id       VARCHAR(36) NOT NULL,
    amount          NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(3)   DEFAULT 'USD',
    provider        payment_provider NOT NULL,
    provider_payment_id VARCHAR(255),
    provider_response   JSONB,
    status          payment_tx_status DEFAULT 'pending',
    created_at      TIMESTAMPTZ  DEFAULT NOW(),

    CONSTRAINT fk_pt_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE SET NULL,
    CONSTRAINT fk_pt_client  FOREIGN KEY (client_id)  REFERENCES clients (id)  ON DELETE CASCADE,
    CONSTRAINT chk_pt_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_pt_invoice  ON payment_transactions (invoice_id);
CREATE INDEX IF NOT EXISTS idx_pt_client   ON payment_transactions (client_id);
CREATE INDEX IF NOT EXISTS idx_pt_status   ON payment_transactions (status);
CREATE INDEX IF NOT EXISTS idx_pt_provider ON payment_transactions (provider);


-- ---------------------------------------------------------
-- Revenue Entries (automatic on payment)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS revenue_entries (
    id              VARCHAR(36) PRIMARY KEY,
    invoice_id      VARCHAR(36),
    payment_id      VARCHAR(36),
    client_id       VARCHAR(36),
    amount          NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(3)    DEFAULT 'USD',
    category        VARCHAR(50)   DEFAULT 'service_revenue',
    description     TEXT,
    recorded_at     TIMESTAMPTZ   DEFAULT NOW(),

    CONSTRAINT fk_re_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id)              ON DELETE SET NULL,
    CONSTRAINT fk_re_payment FOREIGN KEY (payment_id) REFERENCES payment_transactions (id)  ON DELETE SET NULL,
    CONSTRAINT fk_re_client  FOREIGN KEY (client_id)  REFERENCES clients (id)               ON DELETE SET NULL,
    CONSTRAINT chk_re_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_re_client   ON revenue_entries (client_id);
CREATE INDEX IF NOT EXISTS idx_re_recorded ON revenue_entries (recorded_at);


-- ---------------------------------------------------------
-- Finance Summary (upserted per period YYYY-MM)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_summary (
    id                     VARCHAR(36) PRIMARY KEY,
    period                 VARCHAR(7)    NOT NULL UNIQUE,  -- 'YYYY-MM'
    total_revenue          NUMERIC(14,2) DEFAULT 0,
    total_invoices_issued  INT           DEFAULT 0,
    total_invoices_paid    INT           DEFAULT 0,
    total_outstanding      NUMERIC(14,2) DEFAULT 0,
    updated_at             TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fs_period ON finance_summary (period);


-- ---------------------------------------------------------
-- SWOT Analyses (AI-generated, DB-backed)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS swot_analyses (
    id              VARCHAR(36) PRIMARY KEY,
    client_id       VARCHAR(36) NOT NULL,
    strengths       JSONB DEFAULT '[]'::JSONB,
    weaknesses      JSONB DEFAULT '[]'::JSONB,
    opportunities   JSONB DEFAULT '[]'::JSONB,
    threats         JSONB DEFAULT '[]'::JSONB,
    ai_generated    BOOLEAN DEFAULT TRUE,
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_swot_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_swot_client ON swot_analyses (client_id);


-- ---------------------------------------------------------
-- Email Log
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_log (
    id                  VARCHAR(36)  PRIMARY KEY,
    recipient_email     VARCHAR(255) NOT NULL,
    recipient_name      VARCHAR(255),
    subject             VARCHAR(255) NOT NULL,
    template_type       VARCHAR(50),
    related_invoice_id  VARCHAR(36),
    status              email_status DEFAULT 'queued',
    provider            VARCHAR(50),
    provider_message_id VARCHAR(255),
    error_message       TEXT,
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_el_recipient ON email_log (recipient_email);
CREATE INDEX IF NOT EXISTS idx_el_status    ON email_log (status);
CREATE INDEX IF NOT EXISTS idx_el_invoice   ON email_log (related_invoice_id);


-- ---------------------------------------------------------
-- PostgreSQL function: handle_payment_completed
-- Chains: update invoice → insert revenue entry → upsert finance summary
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_payment_completed(p_payment_id TEXT)
RETURNS VOID AS $$
DECLARE
    v_invoice_id TEXT;
    v_client_id  TEXT;
    v_amount     NUMERIC(12,2);
    v_period     TEXT;
BEGIN
    SELECT invoice_id, client_id, amount
    INTO v_invoice_id, v_client_id, v_amount
    FROM payment_transactions WHERE id = p_payment_id;

    -- Update invoice
    IF v_invoice_id IS NOT NULL THEN
        UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW()
        WHERE id = v_invoice_id;
    END IF;

    -- Insert revenue entry
    INSERT INTO revenue_entries (id, invoice_id, payment_id, client_id, amount, category, description)
    VALUES (
        CONCAT(EXTRACT(EPOCH FROM NOW())::TEXT, '-', SUBSTR(MD5(RANDOM()::TEXT), 1, 7)),
        v_invoice_id, p_payment_id, v_client_id, v_amount,
        'service_revenue', 'Payment received'
    );

    -- Upsert finance summary
    v_period := TO_CHAR(NOW(), 'YYYY-MM');
    INSERT INTO finance_summary (id, period, total_revenue, total_invoices_paid, updated_at)
    VALUES (
        CONCAT(EXTRACT(EPOCH FROM NOW())::TEXT, '-', SUBSTR(MD5(RANDOM()::TEXT), 1, 7)),
        v_period, v_amount, 1, NOW()
    )
    ON CONFLICT (period) DO UPDATE SET
        total_revenue = finance_summary.total_revenue + EXCLUDED.total_revenue,
        total_invoices_paid = finance_summary.total_invoices_paid + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- SECTION C: VIEWS
-- Converted from views.sql
-- Key changes:
--   - DATEDIFF(CURDATE(), col) → EXTRACT(EPOCH FROM (CURRENT_DATE - col))/86400
--   - MySQL CASE WHEN enum comparisons work identically in PG
--   - Correlated subquery for latest-version pattern unchanged (ANSI SQL)
-- ============================================================

-- View 1: v_client_health_summary
-- Per-client: latest audit, recommendation counts, intervention stats.
-- Used by: AuditQueue, HealthOverview, ClientsDatabaseTab, Dashboard
CREATE OR REPLACE VIEW v_client_health_summary AS
SELECT
    c.id                                            AS client_id,
    c.name                                          AS client_name,
    c.email                                         AS client_email,
    c.tier                                          AS client_tier,
    c.status                                        AS client_status,
    ba.id                                           AS latest_audit_id,
    ba.audit_date                                   AS latest_audit_date,
    ba.overall_score                                AS latest_overall_score,
    ba.status                                       AS audit_status,
    COALESCE(rec.total_recommendations, 0)          AS total_recommendations,
    COALESCE(rec.accepted_recommendations, 0)       AS accepted_recommendations,
    COALESCE(rec.completed_recommendations, 0)      AS completed_recommendations,
    COALESCE(intv.total_interventions, 0)           AS total_interventions,
    COALESCE(intv.completed_interventions, 0)       AS completed_interventions,
    intv.avg_roi                                    AS avg_intervention_roi
FROM clients c
LEFT JOIN business_audits ba
    ON ba.client_id = c.id
    AND ba.version = (
        SELECT MAX(ba2.version)
        FROM business_audits ba2
        WHERE ba2.client_id = c.id
    )
LEFT JOIN (
    SELECT
        client_id,
        COUNT(*)                                                               AS total_recommendations,
        SUM(CASE WHEN status IN ('accepted','in_progress','completed') THEN 1 ELSE 0 END) AS accepted_recommendations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)                 AS completed_recommendations
    FROM audit_recommendations
    GROUP BY client_id
) rec ON rec.client_id = c.id
LEFT JOIN (
    SELECT
        client_id,
        COUNT(*)                                                         AS total_interventions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)           AS completed_interventions,
        AVG(overall_roi)                                                 AS avg_roi
    FROM interventions
    GROUP BY client_id
) intv ON intv.client_id = c.id;


-- View 2: v_client_financial_summary
-- Lifetime aggregates per client across all client_financials rows.
-- Used by: ClientFinancials, ClientAnalytics, portal Dashboard
CREATE OR REPLACE VIEW v_client_financial_summary AS
SELECT
    client_id,
    COUNT(*)                                  AS total_months,
    SUM(COALESCE(gross_revenue, 0))           AS total_gross_revenue,
    SUM(COALESCE(net_revenue, 0))             AS total_net_revenue,
    SUM(COALESCE(total_expenses, 0))          AS total_expenses,
    SUM(COALESCE(gross_profit, 0))            AS total_gross_profit,
    SUM(COALESCE(net_profit, 0))              AS total_net_profit,
    AVG(COALESCE(gross_revenue, 0))           AS avg_monthly_revenue,
    AVG(COALESCE(profit_margin, 0))           AS avg_profit_margin,
    SUM(COALESCE(new_customers, 0))           AS total_new_customers,
    SUM(COALESCE(total_marketing_spend, 0))   AS total_marketing_spend,
    MAX(period_year * 100 + period_month)     AS latest_period_code
FROM client_financials
GROUP BY client_id;


-- View 3: v_intervention_roi_summary
-- Per-client intervention counts by status, avg ROI, total investment,
-- and avg effectiveness on a 1-5 numeric scale.
-- Used by: InterventionTracker, ClientAnalytics Section H
CREATE OR REPLACE VIEW v_intervention_roi_summary AS
SELECT
    client_id,
    COUNT(*)                                                           AS total_interventions,
    SUM(CASE WHEN status = 'completed'   THEN 1 ELSE 0 END)           AS completed_count,
    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)           AS in_progress_count,
    SUM(CASE WHEN status = 'planned'     THEN 1 ELSE 0 END)           AS planned_count,
    AVG(CASE WHEN status = 'completed' THEN overall_roi ELSE NULL END) AS avg_roi,
    SUM(COALESCE(cost_to_client, 0))                                   AS total_client_investment,
    SUM(COALESCE(our_cost, 0))                                         AS total_our_cost,
    SUM(COALESCE(revenue_impact_monthly, 0))                           AS total_monthly_revenue_impact,
    AVG(CASE
        WHEN effectiveness_rating = 'exceptional' THEN 5
        WHEN effectiveness_rating = 'strong'      THEN 4
        WHEN effectiveness_rating = 'moderate'    THEN 3
        WHEN effectiveness_rating = 'weak'        THEN 2
        WHEN effectiveness_rating = 'negative'    THEN 1
        ELSE NULL
    END)                                                               AS avg_effectiveness_score
FROM interventions
GROUP BY client_id;


-- View 4: v_audit_queue_status
-- One row per active/approved client: latest audit info, days-since-last-audit,
-- traffic light color, and total audit count.
-- Used by: AuditQueue, HealthOverview
-- Conversion: DATEDIFF(CURDATE(), col) → EXTRACT(EPOCH FROM (CURRENT_DATE - col))/86400
CREATE OR REPLACE VIEW v_audit_queue_status AS
SELECT
    c.id                                                                          AS client_id,
    c.name                                                                        AS client_name,
    c.tier                                                                        AS client_tier,
    c.status                                                                      AS client_status,
    ba.audit_date                                                                 AS latest_audit_date,
    -- PG: DATE - DATE returns integer days directly
    (CURRENT_DATE - ba.audit_date)                                               AS days_since_last_audit,
    ba.overall_score                                                              AS latest_overall_score,
    CASE
        WHEN ba.overall_score >= 7 THEN 'green'
        WHEN ba.overall_score >= 4 THEN 'amber'
        WHEN ba.overall_score IS NOT NULL THEN 'red'
        ELSE 'none'
    END                                                                           AS traffic_light,
    COALESCE(audit_counts.audit_count, 0)                                         AS audit_count,
    ba.status                                                                     AS latest_audit_status
FROM clients c
LEFT JOIN business_audits ba
    ON ba.client_id = c.id
    AND ba.version = (
        SELECT MAX(ba2.version)
        FROM business_audits ba2
        WHERE ba2.client_id = c.id
    )
LEFT JOIN (
    SELECT client_id, COUNT(*) AS audit_count
    FROM business_audits
    GROUP BY client_id
) audit_counts ON audit_counts.client_id = c.id
WHERE c.status = 'active';


-- ============================================================
-- END OF SCHEMA
-- Run seed.sql next to populate reference data.
-- ============================================================
