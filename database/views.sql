-- ============================================================
-- Three Seas Digital — Database Views
-- Created: 2026-02-10
-- Purpose: Aggregation views for common dashboard queries.
--          Run AFTER schema.sql and schema-bi.sql.
-- ============================================================

-- 1. v_client_health_summary
-- Provides a single-row-per-client overview combining the latest
-- audit score, recommendation counts, and intervention stats.
-- Used by: AuditQueue, HealthOverview, ClientsDatabaseTab, Dashboard
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


-- 2. v_client_financial_summary
-- Aggregates all client_financials rows into a single summary per
-- client. Produces lifetime totals, averages, and the latest
-- period code (YYYYMM) for freshness checks.
-- Used by: ClientFinancials, ClientAnalytics, portal Dashboard
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


-- 3. v_intervention_roi_summary
-- Per-client aggregation of intervention counts by status,
-- average ROI for completed work, total investment figures,
-- and an average effectiveness score mapped to a 1-5 numeric scale.
-- Used by: InterventionTracker, ClientAnalytics Section H
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


-- 4. v_audit_queue_status
-- Drives the Audit Queue UI: one row per active/approved client
-- with their latest audit info, days-since-last-audit calculation,
-- traffic light color, and total audit count.
-- Used by: AuditQueue, HealthOverview
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
WHERE c.status IN ('active');
