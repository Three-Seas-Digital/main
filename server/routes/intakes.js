import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';

const router = Router();

// POST /api/intakes/:clientId - Create/update intake for client
router.post('/:clientId', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      industry, sub_industry, years_in_operation, employee_count_range,
      annual_revenue_range, target_market, business_model, competitors,
      current_website_url, hosting_provider, tech_stack, domain_age_years,
      has_ssl, is_mobile_responsive, last_website_update,
      social_platforms, email_marketing_tool, paid_advertising,
      content_marketing, seo_efforts,
      pain_points, goals, previous_agency_experience, budget_range,
      timeline_expectations, decision_makers, notes
    } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM business_intakes WHERE client_id = ?',
      [clientId]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE business_intakes SET
          industry = ?, sub_industry = ?, years_in_operation = ?, employee_count_range = ?,
          annual_revenue_range = ?, target_market = ?, business_model = ?, competitors = ?,
          current_website_url = ?, hosting_provider = ?, tech_stack = ?, domain_age_years = ?,
          has_ssl = ?, is_mobile_responsive = ?, last_website_update = ?,
          social_platforms = ?, email_marketing_tool = ?, paid_advertising = ?,
          content_marketing = ?, seo_efforts = ?,
          pain_points = ?, goals = ?, previous_agency_experience = ?, budget_range = ?,
          timeline_expectations = ?, decision_makers = ?, notes = ?,
          updated_at = NOW()
        WHERE client_id = ?`,
        [
          industry || null, sub_industry || null, years_in_operation || null, employee_count_range || null,
          annual_revenue_range || null, target_market || null, business_model || null,
          competitors ? JSON.stringify(competitors) : null,
          current_website_url || null, hosting_provider || null, tech_stack || null, domain_age_years || null,
          has_ssl ?? null, is_mobile_responsive ?? null, last_website_update || null,
          social_platforms ? JSON.stringify(social_platforms) : null,
          email_marketing_tool || null,
          paid_advertising ? JSON.stringify(paid_advertising) : null,
          content_marketing ? JSON.stringify(content_marketing) : null,
          seo_efforts || null,
          pain_points ? JSON.stringify(pain_points) : null,
          goals ? JSON.stringify(goals) : null,
          previous_agency_experience || null, budget_range || null,
          timeline_expectations || null,
          decision_makers ? JSON.stringify(decision_makers) : null,
          notes || null,
          clientId
        ]
      );
      res.json({ success: true, data: { id: existing[0].id, message: 'Intake updated' } });
    } else {
      const id = generateId();
      await pool.query(
        `INSERT INTO business_intakes (
          id, client_id, industry, sub_industry, years_in_operation, employee_count_range,
          annual_revenue_range, target_market, business_model, competitors,
          current_website_url, hosting_provider, tech_stack, domain_age_years,
          has_ssl, is_mobile_responsive, last_website_update,
          social_platforms, email_marketing_tool, paid_advertising,
          content_marketing, seo_efforts,
          pain_points, goals, previous_agency_experience, budget_range,
          timeline_expectations, decision_makers, notes,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id,
          clientId,
          industry || null, sub_industry || null, years_in_operation || null, employee_count_range || null,
          annual_revenue_range || null, target_market || null, business_model || null,
          competitors ? JSON.stringify(competitors) : null,
          current_website_url || null, hosting_provider || null, tech_stack || null, domain_age_years || null,
          has_ssl ?? null, is_mobile_responsive ?? null, last_website_update || null,
          social_platforms ? JSON.stringify(social_platforms) : null,
          email_marketing_tool || null,
          paid_advertising ? JSON.stringify(paid_advertising) : null,
          content_marketing ? JSON.stringify(content_marketing) : null,
          seo_efforts || null,
          pain_points ? JSON.stringify(pain_points) : null,
          goals ? JSON.stringify(goals) : null,
          previous_agency_experience || null, budget_range || null,
          timeline_expectations || null,
          decision_makers ? JSON.stringify(decision_makers) : null,
          notes || null,
          req.user?.userId
        ]
      );
      res.status(201).json({ success: true, data: { id, message: 'Intake created' } });
    }
  } catch (err) {
    console.error('POST /api/intakes/:clientId error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/intakes/:clientId - Get intake for client
router.get('/:clientId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM business_intakes WHERE client_id = ?',
      [req.params.clientId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Intake not found' });
      return;
    }

    const intake = rows[0];
    const jsonFields = ['competitors', 'social_platforms', 'paid_advertising', 'content_marketing', 'pain_points', 'goals', 'decision_makers'];
    for (const field of jsonFields) {
      if (intake[field] && typeof intake[field] === 'string') {
        try { intake[field] = JSON.parse(intake[field]); } catch { /* leave as-is */ }
      }
    }

    res.json({ success: true, data: intake });
  } catch (err) {
    console.error('GET /api/intakes/:clientId error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/intakes/:id - Update intake by ID
router.put('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const {
      industry, sub_industry, years_in_operation, employee_count_range,
      annual_revenue_range, target_market, business_model, competitors,
      current_website_url, hosting_provider, tech_stack, domain_age_years,
      has_ssl, is_mobile_responsive, last_website_update,
      social_platforms, email_marketing_tool, paid_advertising,
      content_marketing, seo_efforts,
      pain_points, goals, previous_agency_experience, budget_range,
      timeline_expectations, decision_makers, notes
    } = req.body;

    await pool.query(
      `UPDATE business_intakes SET
        industry = ?, sub_industry = ?, years_in_operation = ?, employee_count_range = ?,
        annual_revenue_range = ?, target_market = ?, business_model = ?, competitors = ?,
        current_website_url = ?, hosting_provider = ?, tech_stack = ?, domain_age_years = ?,
        has_ssl = ?, is_mobile_responsive = ?, last_website_update = ?,
        social_platforms = ?, email_marketing_tool = ?, paid_advertising = ?,
        content_marketing = ?, seo_efforts = ?,
        pain_points = ?, goals = ?, previous_agency_experience = ?, budget_range = ?,
        timeline_expectations = ?, decision_makers = ?, notes = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        industry || null, sub_industry || null, years_in_operation || null, employee_count_range || null,
        annual_revenue_range || null, target_market || null, business_model || null,
        competitors ? JSON.stringify(competitors) : null,
        current_website_url || null, hosting_provider || null, tech_stack || null, domain_age_years || null,
        has_ssl ?? null, is_mobile_responsive ?? null, last_website_update || null,
        social_platforms ? JSON.stringify(social_platforms) : null,
        email_marketing_tool || null,
        paid_advertising ? JSON.stringify(paid_advertising) : null,
        content_marketing ? JSON.stringify(content_marketing) : null,
        seo_efforts || null,
        pain_points ? JSON.stringify(pain_points) : null,
        goals ? JSON.stringify(goals) : null,
        previous_agency_experience || null, budget_range || null,
        timeline_expectations || null,
        decision_makers ? JSON.stringify(decision_makers) : null,
        notes || null,
        req.params.id
      ]
    );
    res.json({ success: true, data: { message: 'Intake updated' } });
  } catch (err) {
    console.error('PUT /api/intakes/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/intakes/:id - Delete intake
router.delete('/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    await pool.query('DELETE FROM business_intakes WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Intake deleted' } });
  } catch (err) {
    console.error('DELETE /api/intakes/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
