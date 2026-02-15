import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateClient } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';

const router = Router();

// All portal routes require client authentication
router.use(authenticateClient);

// ============================================================
// DASHBOARD
// ============================================================

// GET /api/portal/dashboard - Client dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    // Latest published audit with scores
    const [audits] = await pool.query(
      `SELECT ba.id, ba.version, ba.overall_score, ba.audit_type, ba.published_at
       FROM business_audits ba
       WHERE ba.client_id = ? AND ba.status = 'published'
       ORDER BY ba.version DESC LIMIT 1`,
      [clientId]
    );

    let latestAudit = null;
    if (audits.length > 0) {
      latestAudit = audits[0];
      const [scores] = await pool.query(
        `SELECT s.score, s.weight, s.client_summary, c.name AS category_name, c.slug, c.icon, c.color
         FROM audit_scores s
         JOIN audit_categories c ON s.category_id = c.id
         WHERE s.audit_id = ?
         ORDER BY c.display_order`,
        [latestAudit.id]
      );
      latestAudit.scores = scores;
    }

    // Active recommendations count (not declined or completed)
    const [recCount] = await pool.query(
      `SELECT COUNT(*) AS count FROM audit_recommendations
       WHERE client_id = ? AND status NOT IN ('declined', 'completed')`,
      [clientId]
    );

    // Active projects count
    const [projCount] = await pool.query(
      `SELECT COUNT(*) AS count FROM projects
       WHERE client_id = ? AND status IN ('planning', 'in_progress', 'review')`,
      [clientId]
    );

    // Open invoices count
    const [invCount] = await pool.query(
      `SELECT COUNT(*) AS count FROM invoices
       WHERE client_id = ? AND status IN ('sent', 'overdue')`,
      [clientId]
    );

    // Recent activity (last 10 items from various sources)
    const [recentActivity] = await pool.query(
      `(SELECT 'audit_published' AS type, ba.id AS target_id,
              CONCAT('Business audit v', ba.version, ' published') AS description,
              ba.published_at AS created_at
       FROM business_audits ba
       WHERE ba.client_id = ? AND ba.status = 'published'
       ORDER BY ba.published_at DESC LIMIT 3)
      UNION ALL
      (SELECT 'recommendation' AS type, ar.id AS target_id,
              CONCAT('New recommendation: ', ar.title) AS description,
              ar.created_at
       FROM audit_recommendations ar
       WHERE ar.client_id = ?
       ORDER BY ar.created_at DESC LIMIT 3)
      UNION ALL
      (SELECT 'intervention' AS type, i.id AS target_id,
              CONCAT('Intervention update: ', i.title) AS description,
              i.updated_at AS created_at
       FROM interventions i
       WHERE i.client_id = ? AND i.status != 'planned'
       ORDER BY i.updated_at DESC LIMIT 2)
      UNION ALL
      (SELECT 'service_request' AS type, sr.id AS target_id,
              CONCAT('Service request: ', sr.title, ' (', sr.status, ')') AS description,
              sr.updated_at AS created_at
       FROM service_requests sr
       WHERE sr.client_id = ?
       ORDER BY sr.updated_at DESC LIMIT 2)
      ORDER BY created_at DESC LIMIT 10`,
      [clientId, clientId, clientId, clientId]
    );

    res.json({
      success: true,
      data: {
        latestAudit,
        activeRecommendations: recCount[0].count,
        activeProjects: projCount[0].count,
        openInvoices: invCount[0].count,
        recentActivity,
      },
    });
  } catch (err) {
    console.error('GET /api/portal/dashboard error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// AUDITS (published only)
// ============================================================

// GET /api/portal/audits - All published audits with scores
router.get('/audits', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [audits] = await pool.query(
      `SELECT ba.id, ba.version, ba.audit_type, ba.overall_score, ba.status,
              ba.published_at, ba.created_at
       FROM business_audits ba
       WHERE ba.client_id = ? AND ba.status = 'published'
       ORDER BY ba.version DESC`,
      [clientId]
    );

    // Fetch scores for each audit
    for (const audit of audits) {
      const [scores] = await pool.query(
        `SELECT s.id, s.score, s.weight, s.client_summary, s.evidence_urls,
                c.name AS category_name, c.slug, c.icon, c.color, c.max_score
         FROM audit_scores s
         JOIN audit_categories c ON s.category_id = c.id
         WHERE s.audit_id = ?
         ORDER BY c.display_order`,
        [audit.id]
      );

      // Parse JSON fields, exclude internal_notes
      for (const score of scores) {
        if (score.evidence_urls && typeof score.evidence_urls === 'string') {
          try { score.evidence_urls = JSON.parse(score.evidence_urls); } catch { /* leave as-is */ }
        }
      }

      audit.scores = scores;
    }

    res.json({ success: true, data: audits });
  } catch (err) {
    console.error('GET /api/portal/audits error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/portal/score-history - Score progression across versions
router.get('/score-history', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.query(
      `SELECT ba.version, ba.overall_score, ba.published_at,
              s.score, s.weight,
              c.name AS category_name, c.slug, c.color
       FROM business_audits ba
       JOIN audit_scores s ON s.audit_id = ba.id
       JOIN audit_categories c ON s.category_id = c.id
       WHERE ba.client_id = ? AND ba.status = 'published'
       ORDER BY ba.version ASC, c.display_order ASC`,
      [clientId]
    );

    // Group by version for chart-friendly structure
    const versions = {};
    for (const row of rows) {
      if (!versions[row.version]) {
        versions[row.version] = {
          version: row.version,
          overall_score: row.overall_score,
          published_at: row.published_at,
          categories: [],
        };
      }
      versions[row.version].categories.push({
        category_name: row.category_name,
        slug: row.slug,
        color: row.color,
        score: row.score,
        weight: row.weight,
      });
    }

    res.json({ success: true, data: Object.values(versions) });
  } catch (err) {
    console.error('GET /api/portal/score-history error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// RECOMMENDATIONS
// ============================================================

// GET /api/portal/recommendations - All recommendations for the client
router.get('/recommendations', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.query(
      `SELECT r.id, r.audit_id, r.title, r.description, r.expected_outcome,
              r.priority, r.impact, r.estimated_cost_min, r.estimated_cost_max,
              r.estimated_timeline, r.linked_service, r.status,
              r.client_response, r.client_responded_at, r.decline_reason,
              r.dependencies, r.display_order, r.created_at, r.updated_at,
              ba.version AS audit_version,
              c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon
       FROM audit_recommendations r
       JOIN business_audits ba ON r.audit_id = ba.id
       LEFT JOIN audit_categories c ON r.category_id = c.id
       WHERE r.client_id = ?
       ORDER BY r.display_order ASC, r.created_at DESC`,
      [clientId]
    );

    // Parse JSON fields
    for (const row of rows) {
      if (row.dependencies && typeof row.dependencies === 'string') {
        try { row.dependencies = JSON.parse(row.dependencies); } catch { /* leave as-is */ }
      }
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/portal/recommendations error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/portal/recommendations/:id/accept - Accept a recommendation
router.post('/recommendations/:id/accept', async (req, res) => {
  try {
    const clientId = req.client.clientId;
    const recId = req.params.id;

    // Verify ownership
    const [check] = await pool.query(
      'SELECT id, status FROM audit_recommendations WHERE id = ? AND client_id = ?',
      [recId, clientId]
    );
    if (check.length === 0) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    await pool.query(
      `UPDATE audit_recommendations
       SET status = 'accepted', client_responded_at = NOW(), updated_at = NOW()
       WHERE id = ? AND client_id = ?`,
      [recId, clientId]
    );

    res.json({ success: true, data: { message: 'Recommendation accepted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/portal/recommendations/:id/decline - Decline a recommendation
router.post('/recommendations/:id/decline', async (req, res) => {
  try {
    const clientId = req.client.clientId;
    const recId = req.params.id;
    const { decline_reason } = req.body;

    // Verify ownership
    const [check] = await pool.query(
      'SELECT id FROM audit_recommendations WHERE id = ? AND client_id = ?',
      [recId, clientId]
    );
    if (check.length === 0) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    await pool.query(
      `UPDATE audit_recommendations
       SET status = 'declined', decline_reason = ?, client_responded_at = NOW(), updated_at = NOW()
       WHERE id = ? AND client_id = ?`,
      [decline_reason || null, recId, clientId]
    );

    res.json({ success: true, data: { message: 'Recommendation declined' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/portal/recommendations/:id/thread - Add thread message
router.post('/recommendations/:id/thread', async (req, res) => {
  try {
    const clientId = req.client.clientId;
    const recId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Verify ownership
    const [check] = await pool.query(
      'SELECT id FROM audit_recommendations WHERE id = ? AND client_id = ?',
      [recId, clientId]
    );
    if (check.length === 0) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    const id = generateId();
    await pool.query(
      `INSERT INTO recommendation_threads (id, recommendation_id, author_type, author_id, message, created_at)
       VALUES (?, ?, 'client', ?, ?, NOW())`,
      [id, recId, clientId, message.trim()]
    );

    res.status(201).json({ success: true, data: { id, message: 'Thread message added' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/portal/recommendations/:id/threads - Get thread messages
router.get('/recommendations/:id/threads', async (req, res) => {
  try {
    const clientId = req.client.clientId;
    const recId = req.params.id;

    // Verify ownership
    const [check] = await pool.query(
      'SELECT id FROM audit_recommendations WHERE id = ? AND client_id = ?',
      [recId, clientId]
    );
    if (check.length === 0) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    const [rows] = await pool.query(
      `SELECT id, author_type, author_id, message, created_at
       FROM recommendation_threads
       WHERE recommendation_id = ?
       ORDER BY created_at ASC`,
      [recId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// GROWTH METRICS
// ============================================================

// GET /api/portal/metrics - Growth targets with latest snapshot
router.get('/metrics', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [targets] = await pool.query(
      `SELECT gt.id, gt.metric_name, gt.metric_slug, gt.baseline_value, gt.target_value,
              gt.current_value, gt.unit, gt.target_date, gt.data_source,
              gt.measurement_frequency, gt.status, gt.achieved_at,
              gt.created_at, gt.updated_at
       FROM growth_targets gt
       WHERE gt.client_id = ?
       ORDER BY gt.status ASC, gt.target_date ASC`,
      [clientId]
    );

    // Fetch latest snapshot for each target
    for (const target of targets) {
      const [snapshots] = await pool.query(
        `SELECT id, value, previous_value, change_percent, progress_percent,
                recorded_at
         FROM growth_snapshots
         WHERE target_id = ? AND client_id = ?
         ORDER BY recorded_at DESC LIMIT 1`,
        [target.id, clientId]
      );
      target.latest_snapshot = snapshots.length > 0 ? snapshots[0] : null;
    }

    res.json({ success: true, data: targets });
  } catch (err) {
    console.error('GET /api/portal/metrics error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// FINANCIALS
// ============================================================

// GET /api/portal/financials - Client financial periods
router.get('/financials', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.query(
      `SELECT id, period_year, period_month, gross_revenue, net_revenue,
              online_revenue, offline_revenue, new_customer_revenue, returning_customer_revenue,
              transaction_count, average_order_value, cost_of_goods_sold,
              total_marketing_spend, our_fees, total_expenses,
              gross_profit, net_profit, profit_margin,
              new_customers, total_customers, customer_acquisition_cost,
              data_completeness, source, created_at
       FROM client_financials
       WHERE client_id = ?
       ORDER BY period_year DESC, period_month DESC`,
      [clientId]
    );

    // Exclude internal notes field
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/portal/financials/revenue - Revenue channels by period
router.get('/financials/revenue', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.query(
      `SELECT rc.id, rc.financial_id, rc.channel_name, rc.revenue,
              rc.transaction_count, rc.conversion_rate, rc.cost, rc.roi,
              cf.period_year, cf.period_month
       FROM client_revenue_channels rc
       JOIN client_financials cf ON rc.financial_id = cf.id
       WHERE rc.client_id = ?
       ORDER BY cf.period_year DESC, cf.period_month DESC, rc.revenue DESC`,
      [clientId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/portal/financials/expenses - Expense breakdown
router.get('/financials/expenses', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.query(
      `SELECT id, period_year, period_month,
              total_marketing_spend, our_fees, total_expenses,
              cost_of_goods_sold, gross_profit, net_profit, profit_margin
       FROM client_financials
       WHERE client_id = ?
       ORDER BY period_year DESC, period_month DESC`,
      [clientId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// INTERVENTIONS
// ============================================================

// GET /api/portal/interventions - Client interventions (excluding planned)
router.get('/interventions', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [interventions] = await pool.query(
      `SELECT i.id, i.title, i.description, i.intervention_type, i.status,
              i.planned_date, i.implementation_date, i.measurement_start, i.measurement_end,
              i.measurement_duration_days, i.cost_to_client, i.overall_roi,
              i.revenue_impact_monthly, i.payback_period_days, i.effectiveness_rating,
              i.before_screenshot_url, i.after_screenshot_url, i.report_url,
              i.client_summary, i.created_at, i.updated_at,
              ar.title AS recommendation_title
       FROM interventions i
       LEFT JOIN audit_recommendations ar ON i.recommendation_id = ar.id
       WHERE i.client_id = ? AND i.status != 'planned'
       ORDER BY i.updated_at DESC`,
      [clientId]
    );

    // Fetch linked metrics with latest snapshot for each intervention
    for (const intervention of interventions) {
      const [metrics] = await pool.query(
        `SELECT im.id, im.metric_name, im.metric_slug, im.unit,
                im.baseline_value, im.target_value, im.current_value,
                im.change_absolute, im.change_percent, im.attribution,
                im.attribution_percent, im.data_source
         FROM intervention_metrics im
         WHERE im.intervention_id = ?
         ORDER BY im.metric_name`,
        [intervention.id]
      );

      // Fetch latest snapshot per metric
      for (const metric of metrics) {
        const [snapshots] = await pool.query(
          `SELECT id, value, change_from_baseline, days_since_launch, checkpoint, recorded_at
           FROM intervention_snapshots
           WHERE intervention_metric_id = ? AND intervention_id = ?
           ORDER BY recorded_at DESC LIMIT 1`,
          [metric.id, intervention.id]
        );
        metric.latest_snapshot = snapshots.length > 0 ? snapshots[0] : null;
      }

      intervention.metrics = metrics;
    }

    // Exclude internal notes field (only expose client_summary)
    res.json({ success: true, data: interventions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// SERVICE REQUESTS
// ============================================================

// POST /api/portal/service-requests - Create a service request
router.post('/service-requests', async (req, res) => {
  try {
    const clientId = req.client.clientId;
    const { title, description, budget_range, urgency, recommendation_id } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    // If recommendation_id provided, verify it belongs to this client
    if (recommendation_id) {
      const [recCheck] = await pool.query(
        'SELECT id FROM audit_recommendations WHERE id = ? AND client_id = ?',
        [recommendation_id, clientId]
      );
      if (recCheck.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid recommendation reference' });
      }
    }

    const validUrgency = ['low', 'medium', 'high', 'asap'];
    const safeUrgency = validUrgency.includes(urgency) ? urgency : 'medium';

    const id = generateId();
    await pool.query(
      `INSERT INTO service_requests (id, client_id, recommendation_id, title, description, budget_range, urgency, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', NOW())`,
      [id, clientId, recommendation_id || null, title.trim(), description || null, budget_range || null, safeUrgency]
    );

    res.status(201).json({ success: true, data: { id, message: 'Service request submitted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/portal/service-requests - List client service requests
router.get('/service-requests', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.query(
      `SELECT sr.id, sr.title, sr.description, sr.budget_range, sr.urgency,
              sr.status, sr.admin_response, sr.quoted_amount,
              sr.created_at, sr.updated_at,
              ar.title AS recommendation_title
       FROM service_requests sr
       LEFT JOIN audit_recommendations ar ON sr.recommendation_id = ar.id
       WHERE sr.client_id = ?
       ORDER BY sr.created_at DESC`,
      [clientId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// FEEDBACK
// ============================================================

// POST /api/portal/feedback - Submit feedback
router.post('/feedback', async (req, res) => {
  try {
    const clientId = req.client.clientId;
    const { target_type, target_id, rating, comment } = req.body;

    const validTargets = ['project', 'milestone', 'recommendation', 'general'];
    if (!validTargets.includes(target_type)) {
      return res.status(400).json({ success: false, error: 'Invalid target_type. Must be: ' + validTargets.join(', ') });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const id = generateId();
    await pool.query(
      `INSERT INTO client_feedback (id, client_id, target_type, target_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, clientId, target_type, target_id || null, rating || null, comment || null]
    );

    res.status(201).json({ success: true, data: { id, message: 'Feedback submitted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/portal/feedback - List client feedback with admin responses
router.get('/feedback', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.query(
      `SELECT id, target_type, target_id, rating, comment,
              admin_response, responded_at, created_at
       FROM client_feedback
       WHERE client_id = ?
       ORDER BY created_at DESC`,
      [clientId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// NOTIFICATIONS
// ============================================================

// GET /api/portal/notifications - Client notifications (intervention alerts)
router.get('/notifications', async (req, res) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.query(
      `SELECT ia.id, ia.alert_type, ia.message, ia.severity,
              ia.is_read_client AS is_read, ia.created_at,
              i.title AS intervention_title
       FROM intervention_alerts ia
       JOIN interventions i ON ia.intervention_id = i.id
       WHERE ia.client_id = ? AND ia.sent_to_client = TRUE
       ORDER BY ia.created_at DESC
       LIMIT 50`,
      [clientId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/portal/notification-prefs - Update notification preferences
router.put('/notification-prefs', async (req, res) => {
  try {
    const clientId = req.client.clientId;
    const {
      email_digest,
      notify_new_scores,
      notify_new_recommendations,
      notify_metric_milestones,
      notify_invoices,
      notify_documents,
      notify_project_updates,
      notify_admin_messages,
    } = req.body;

    // Validate email_digest
    const validDigests = ['none', 'daily', 'weekly'];
    const safeDigest = validDigests.includes(email_digest) ? email_digest : undefined;

    // Upsert: insert or update
    const [existing] = await pool.query(
      'SELECT id FROM client_notification_prefs WHERE client_id = ?',
      [clientId]
    );

    if (existing.length > 0) {
      // Build dynamic update to only set provided fields
      const updates = [];
      const values = [];

      if (safeDigest !== undefined) { updates.push('email_digest = ?'); values.push(safeDigest); }
      if (notify_new_scores !== undefined) { updates.push('notify_new_scores = ?'); values.push(!!notify_new_scores); }
      if (notify_new_recommendations !== undefined) { updates.push('notify_new_recommendations = ?'); values.push(!!notify_new_recommendations); }
      if (notify_metric_milestones !== undefined) { updates.push('notify_metric_milestones = ?'); values.push(!!notify_metric_milestones); }
      if (notify_invoices !== undefined) { updates.push('notify_invoices = ?'); values.push(!!notify_invoices); }
      if (notify_documents !== undefined) { updates.push('notify_documents = ?'); values.push(!!notify_documents); }
      if (notify_project_updates !== undefined) { updates.push('notify_project_updates = ?'); values.push(!!notify_project_updates); }
      if (notify_admin_messages !== undefined) { updates.push('notify_admin_messages = ?'); values.push(!!notify_admin_messages); }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' });
      }

      values.push(clientId);
      await pool.query(
        `UPDATE client_notification_prefs SET ${updates.join(', ')} WHERE client_id = ?`,
        values
      );
    } else {
      await pool.query(
        `INSERT INTO client_notification_prefs
         (client_id, email_digest, notify_new_scores, notify_new_recommendations,
          notify_metric_milestones, notify_invoices, notify_documents,
          notify_project_updates, notify_admin_messages)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clientId,
          safeDigest || 'weekly',
          notify_new_scores !== undefined ? !!notify_new_scores : true,
          notify_new_recommendations !== undefined ? !!notify_new_recommendations : true,
          notify_metric_milestones !== undefined ? !!notify_metric_milestones : true,
          notify_invoices !== undefined ? !!notify_invoices : true,
          notify_documents !== undefined ? !!notify_documents : true,
          notify_project_updates !== undefined ? !!notify_project_updates : true,
          notify_admin_messages !== undefined ? !!notify_admin_messages : true,
        ]
      );
    }

    // Return current prefs
    const [prefs] = await pool.query(
      'SELECT * FROM client_notification_prefs WHERE client_id = ?',
      [clientId]
    );

    res.json({ success: true, data: prefs[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
