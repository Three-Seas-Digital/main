-- ============================================================
-- Three Seas Digital -- Business Intelligence Schema
-- ============================================================
-- This file creates all 26 BI tables organized into 6 groups.
--
-- DEPENDENCY: This file MUST be run AFTER schema.sql, which
-- creates the Phase 5 foundation tables (users, clients,
-- projects) that many BI tables reference via foreign keys.
--
-- Base table PK types (from schema.sql):
--   users.id    = VARCHAR(36)
--   clients.id  = VARCHAR(36)
--   projects.id = VARCHAR(36)
--
-- All BI table PKs use VARCHAR(36) to match frontend generateId().
-- All FK columns referencing base tables use VARCHAR(36).
--
-- Run order:
--   1. schema.sql       (foundation tables)
--   2. seed.sql         (foundation seed data)
--   3. schema-bi.sql    (this file -- BI tables)
--   4. seed-bi.sql      (BI seed data)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- GROUP 1: Business Audit System (9 tables)
-- ============================================================

-- 1. audit_categories (no deps)
CREATE TABLE IF NOT EXISTS audit_categories (
    id VARCHAR(36) PRIMARY KEY,
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

-- 2. audit_subcriteria (depends on audit_categories)
CREATE TABLE IF NOT EXISTS audit_subcriteria (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_score DECIMAL(3,1) DEFAULT 10.0,
    display_order INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES audit_categories(id) ON DELETE CASCADE
);

-- 3. recommendation_templates (depends on audit_categories)
CREATE TABLE IF NOT EXISTS recommendation_templates (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    category_id VARCHAR(36),
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

-- 4. business_intakes (depends on clients, users)
CREATE TABLE IF NOT EXISTS business_intakes (
    id VARCHAR(36) PRIMARY KEY,
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

-- 5. business_audits (depends on clients, users)
CREATE TABLE IF NOT EXISTS business_audits (
    id VARCHAR(36) PRIMARY KEY,
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

-- 6. audit_scores (depends on business_audits, audit_categories)
CREATE TABLE IF NOT EXISTS audit_scores (
    id VARCHAR(36) PRIMARY KEY,
    audit_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
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

-- 7. audit_subcriteria_scores (depends on audit_scores, audit_subcriteria)
CREATE TABLE IF NOT EXISTS audit_subcriteria_scores (
    id VARCHAR(36) PRIMARY KEY,
    audit_score_id VARCHAR(36) NOT NULL,
    subcriteria_id VARCHAR(36) NOT NULL,
    score DECIMAL(3,1) NOT NULL,
    notes TEXT,
    UNIQUE KEY unique_score_sub (audit_score_id, subcriteria_id),
    FOREIGN KEY (audit_score_id) REFERENCES audit_scores(id) ON DELETE CASCADE,
    FOREIGN KEY (subcriteria_id) REFERENCES audit_subcriteria(id) ON DELETE CASCADE,
    INDEX idx_audit_score (audit_score_id),
    CONSTRAINT chk_sub_score CHECK (score >= 0 AND score <= 10)
);

-- 8. audit_recommendations (depends on business_audits, clients, recommendation_templates, audit_categories, users)
CREATE TABLE IF NOT EXISTS audit_recommendations (
    id VARCHAR(36) PRIMARY KEY,
    audit_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    template_id VARCHAR(36),
    category_id VARCHAR(36),
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

-- 9. recommendation_threads (depends on audit_recommendations)
CREATE TABLE IF NOT EXISTS recommendation_threads (
    id VARCHAR(36) PRIMARY KEY,
    recommendation_id VARCHAR(36) NOT NULL,
    author_type ENUM('admin', 'client') NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommendation_id) REFERENCES audit_recommendations(id) ON DELETE CASCADE,
    INDEX idx_recommendation (recommendation_id)
);


-- ============================================================
-- GROUP 2: Growth Tracking (4 tables)
-- ============================================================

-- 10. growth_targets (depends on clients)
CREATE TABLE IF NOT EXISTS growth_targets (
    id VARCHAR(36) PRIMARY KEY,
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

-- 11. growth_snapshots (depends on growth_targets, clients)
CREATE TABLE IF NOT EXISTS growth_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    target_id VARCHAR(36) NOT NULL,
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

-- 12. data_source_connections (depends on clients)
CREATE TABLE IF NOT EXISTS data_source_connections (
    id VARCHAR(36) PRIMARY KEY,
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

-- 13. data_sync_log (depends on data_source_connections, clients)
CREATE TABLE IF NOT EXISTS data_sync_log (
    id VARCHAR(36) PRIMARY KEY,
    connection_id VARCHAR(36) NOT NULL,
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


-- ============================================================
-- GROUP 3: Client Interaction (3 tables)
-- ============================================================

-- 14. service_requests (depends on clients, audit_recommendations)
CREATE TABLE IF NOT EXISTS service_requests (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    recommendation_id VARCHAR(36),
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

-- 15. client_feedback (depends on clients)
CREATE TABLE IF NOT EXISTS client_feedback (
    id VARCHAR(36) PRIMARY KEY,
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

-- 16. client_notification_prefs (depends on clients)
CREATE TABLE IF NOT EXISTS client_notification_prefs (
    id VARCHAR(36) PRIMARY KEY,
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


-- ============================================================
-- GROUP 4: Client Financials (4 tables)
-- ============================================================

-- 17. client_financials (depends on clients, users)
CREATE TABLE IF NOT EXISTS client_financials (
    id VARCHAR(36) PRIMARY KEY,
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

-- 18. client_revenue_channels (depends on client_financials, clients)
CREATE TABLE IF NOT EXISTS client_revenue_channels (
    id VARCHAR(36) PRIMARY KEY,
    financial_id VARCHAR(36) NOT NULL,
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

-- 19. client_revenue_products (depends on client_financials, clients)
CREATE TABLE IF NOT EXISTS client_revenue_products (
    id VARCHAR(36) PRIMARY KEY,
    financial_id VARCHAR(36) NOT NULL,
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

-- 20. client_ad_spend (depends on clients)
CREATE TABLE IF NOT EXISTS client_ad_spend (
    id VARCHAR(36) PRIMARY KEY,
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


-- ============================================================
-- GROUP 5: Intervention Tracking (4 tables)
-- ============================================================

-- 21. interventions (depends on clients, audit_recommendations, projects, users)
CREATE TABLE IF NOT EXISTS interventions (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    recommendation_id VARCHAR(36),
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

-- 22. intervention_metrics (depends on interventions, growth_targets)
CREATE TABLE IF NOT EXISTS intervention_metrics (
    id VARCHAR(36) PRIMARY KEY,
    intervention_id VARCHAR(36) NOT NULL,
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
    growth_target_id VARCHAR(36),
    data_source ENUM('google_analytics', 'search_console', 'pagespeed', 'facebook', 'instagram', 'google_business', 'financial', 'manual') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (growth_target_id) REFERENCES growth_targets(id) ON DELETE SET NULL,
    INDEX idx_intervention (intervention_id),
    CONSTRAINT chk_attribution CHECK (attribution_percent >= 0 AND attribution_percent <= 100)
);

-- 23. intervention_snapshots (depends on intervention_metrics, interventions)
CREATE TABLE IF NOT EXISTS intervention_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    intervention_metric_id VARCHAR(36) NOT NULL,
    intervention_id VARCHAR(36) NOT NULL,
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

-- 24. intervention_alerts (depends on interventions, clients)
CREATE TABLE IF NOT EXISTS intervention_alerts (
    id VARCHAR(36) PRIMARY KEY,
    intervention_id VARCHAR(36) NOT NULL,
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


-- ============================================================
-- GROUP 6: Reporting (2 tables)
-- ============================================================

-- 25. saved_filters (depends on users, clients)
CREATE TABLE IF NOT EXISTS saved_filters (
    id VARCHAR(36) PRIMARY KEY,
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

-- 26. scheduled_reports (depends on clients)
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id VARCHAR(36) PRIMARY KEY,
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


-- 27. execution_plans (depends on clients)
CREATE TABLE IF NOT EXISTS execution_plans (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL DEFAULT 'Untitled Plan',
    plan_data JSON NOT NULL,
    start_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ============================================================
-- GROUP 7: AI Advisor System (3 tables)
-- ============================================================

-- 28. client_data_snapshots (depends on clients, users)
-- Stores compiled snapshots of ALL client data for AI analysis.
-- The snapshot_data JSON contains every BI component's data
-- aggregated for the given time period.
CREATE TABLE IF NOT EXISTS client_data_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,

    period_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    period_label VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    snapshot_data JSON NOT NULL,
    data_sources_included JSON,
    data_completeness_score DECIMAL(5,2),
    generated_by VARCHAR(36),
    generation_trigger ENUM('manual', 'webhook', 'scheduled') DEFAULT 'manual',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_client_period (client_id, period_type, period_start),
    INDEX idx_client_created (client_id, created_at)
);

-- 29. ai_recommendations (depends on clients, client_data_snapshots, users)
-- AI-generated analysis runs. Each links to the snapshot that drove it.
-- Separate from audit_recommendations (which are human-created).
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    snapshot_id VARCHAR(36) NOT NULL,

    ai_provider ENUM('gemini', 'external', 'webhook') NOT NULL DEFAULT 'gemini',
    model_used VARCHAR(100),
    analysis_type VARCHAR(50),
    generation_status ENUM('pending', 'generating', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    generated_at TIMESTAMP NULL,

    ai_response_raw JSON,

    executive_summary TEXT,
    overall_health_rating ENUM('critical', 'at_risk', 'stable', 'growing', 'exceptional') NULL,
    confidence_score DECIMAL(5,2),

    total_recommendations INT DEFAULT 0,
    critical_count INT DEFAULT 0,
    high_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    low_count INT DEFAULT 0,

    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (snapshot_id) REFERENCES client_data_snapshots(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_client_created (client_id, created_at DESC),
    INDEX idx_snapshot (snapshot_id),
    INDEX idx_status (generation_status)
);

-- 30. ai_recommendation_items (depends on ai_recommendations, clients, users)
-- Individual line items parsed from an AI analysis run.
CREATE TABLE IF NOT EXISTS ai_recommendation_items (
    id VARCHAR(36) PRIMARY KEY,
    ai_recommendation_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,

    category VARCHAR(100),
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT,
    expected_impact TEXT,
    suggested_timeline VARCHAR(100),
    estimated_effort ENUM('low', 'medium', 'high') NULL,

    priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
    display_order INT DEFAULT 0,

    supporting_data_sources JSON,

    admin_status ENUM('new', 'reviewed', 'accepted', 'declined', 'converted') DEFAULT 'new',
    converted_to_rec_id VARCHAR(36) NULL,
    admin_notes TEXT,
    reviewed_at TIMESTAMP NULL,
    reviewed_by VARCHAR(36),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ai_recommendation_id) REFERENCES ai_recommendations(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_rec_id (ai_recommendation_id),
    INDEX idx_client_priority (client_id, priority),
    INDEX idx_status (admin_status)
);

SET FOREIGN_KEY_CHECKS = 1;
