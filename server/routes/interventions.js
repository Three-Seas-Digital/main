import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload, setUploadType } from '../middleware/upload.js';
import {
  calculateROI,
  calculateROAS,
  calculatePaybackPeriod,
  calculateEffectiveness,
  ratingToDbEnum,
} from '../utils/roiCalculator.js';
import { generateId } from '../utils/generateId.js';

const router = Router();

// Valid enum values (match schema-bi.sql)
const VALID_TYPES = [
  'website', 'seo', 'social', 'advertising', 'email', 'chatbot',
  'branding', 'content', 'technical', 'performance', 'analytics', 'other',
];
const VALID_STATUSES = [
  'planned', 'in_progress', 'completed', 'paused',
  'launched', 'measuring', 'measured', 'archived',
];

// ============================================================
// GET /api/clients/:clientId/interventions/summary
// Aggregate stats: total, by status, avg ROI, success rate
// NOTE: Must be registered BEFORE /:id to avoid param collision
// ============================================================
router.get('/:clientId/interventions/summary', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;

    // Total count and status breakdown
    const [statusRows] = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM interventions WHERE client_id = ?
       GROUP BY status`,
      [clientId]
    );

    // ROI stats for completed interventions
    const [roiRows] = await pool.query(
      `SELECT
         COUNT(*) as total_completed,
         AVG(overall_roi) as avg_roi,
         SUM(cost_to_client) as total_cost,
         SUM(revenue_impact_monthly) as total_monthly_revenue_impact,
         AVG(payback_period_days) as avg_payback_days
       FROM interventions
       WHERE client_id = ? AND status IN ('completed', 'measured')`,
      [clientId]
    );

    // Type breakdown
    const [typeRows] = await pool.query(
      `SELECT intervention_type, COUNT(*) as count
       FROM interventions WHERE client_id = ?
       GROUP BY intervention_type`,
      [clientId]
    );

    // Effectiveness distribution
    const [effectivenessRows] = await pool.query(
      `SELECT effectiveness_rating, COUNT(*) as count
       FROM interventions
       WHERE client_id = ? AND effectiveness_rating != 'pending'
       GROUP BY effectiveness_rating`,
      [clientId]
    );

    // Total across all statuses
    const totalInterventions = statusRows.reduce((sum, r) => sum + r.count, 0);

    // Success rate: completed+measured / total that are not planned
    const completed = statusRows
      .filter((r) => r.status === 'completed' || r.status === 'measured')
      .reduce((sum, r) => sum + r.count, 0);
    const attempted = statusRows
      .filter((r) => r.status !== 'planned')
      .reduce((sum, r) => sum + r.count, 0);
    const successRate = attempted > 0
      ? Math.round((completed / attempted) * 10000) / 100
      : 0;

    const roi = roiRows[0];

    res.json({
      success: true,
      data: {
        total: totalInterventions,
        by_status: statusRows,
        by_type: typeRows,
        by_effectiveness: effectivenessRows,
        success_rate: successRate,
        total_completed: roi.total_completed || 0,
        avg_roi: roi.avg_roi ? Math.round(roi.avg_roi * 100) / 100 : null,
        total_cost: roi.total_cost || 0,
        total_monthly_revenue_impact: roi.total_monthly_revenue_impact || 0,
        avg_payback_days: roi.avg_payback_days ? Math.round(roi.avg_payback_days) : null,
      },
    });
  } catch (err) {
    console.error('Error fetching intervention summary:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// GET /api/clients/:clientId/interventions
// List all interventions for a client, with optional filters
// Query params: ?status=completed&type=seo&sort=created_at&order=desc
// ============================================================
router.get('/:clientId/interventions', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status, type, sort, order } = req.query;

    let sql = `SELECT id, client_id, recommendation_id, project_id, title, description,
                      intervention_type, status, planned_date, implementation_date,
                      measurement_start, measurement_end, measurement_duration_days,
                      cost_to_client, our_cost, overall_roi, revenue_impact_monthly,
                      payback_period_days, effectiveness_rating,
                      before_screenshot_url, after_screenshot_url, report_url,
                      created_by, notes, client_summary, created_at, updated_at
               FROM interventions WHERE client_id = ?`;
    const params = [clientId];

    if (status && VALID_STATUSES.includes(status)) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (type && VALID_TYPES.includes(type)) {
      sql += ' AND intervention_type = ?';
      params.push(type);
    }

    // Sortable columns whitelist to prevent injection
    const allowedSorts = ['created_at', 'updated_at', 'planned_date', 'implementation_date', 'cost_to_client', 'overall_roi', 'title'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortCol} ${sortOrder}`;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error listing interventions:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// POST /api/clients/:clientId/interventions
// Create a new intervention
// ============================================================
router.post('/:clientId/interventions', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      title, description, intervention_type, status,
      planned_date, implementation_date, measurement_start, measurement_end,
      measurement_duration_days, cost_to_client, our_cost,
      revenue_impact_monthly, recommendation_id, project_id,
      notes, client_summary,
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      res.status(400).json({ success: false, error: 'Title is required' });
      return;
    }
    if (!intervention_type || !VALID_TYPES.includes(intervention_type)) {
      res.status(400).json({ success: false, error: `Invalid intervention type. Must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    // Auto-calculate ROI if we have cost and revenue data
    let overall_roi = null;
    let payback_period_days = null;
    if (cost_to_client && revenue_impact_monthly) {
      overall_roi = calculateROI(cost_to_client, revenue_impact_monthly * 12);
      const paybackMonths = calculatePaybackPeriod(cost_to_client, revenue_impact_monthly);
      payback_period_days = paybackMonths ? Math.round(paybackMonths * 30.44) : null;
    }

    const id = generateId();
    await pool.query(
      `INSERT INTO interventions (
        id, client_id, title, description, intervention_type, status,
        planned_date, implementation_date, measurement_start, measurement_end,
        measurement_duration_days, cost_to_client, our_cost,
        overall_roi, revenue_impact_monthly, payback_period_days,
        recommendation_id, project_id, notes, client_summary, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        clientId,
        title.trim(),
        description || null,
        intervention_type,
        status || 'planned',
        planned_date || null,
        implementation_date || null,
        measurement_start || null,
        measurement_end || null,
        measurement_duration_days || 90,
        cost_to_client || null,
        our_cost || null,
        overall_roi,
        revenue_impact_monthly || null,
        payback_period_days,
        recommendation_id || null,
        project_id || null,
        notes || null,
        client_summary || null,
        req.user?.userId,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id,
        overall_roi,
        payback_period_days,
        message: 'Intervention created',
      },
    });
  } catch (err) {
    console.error('Error creating intervention:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// PUT /api/clients/:clientId/interventions/:id
// Update an existing intervention
// ============================================================
router.put('/:clientId/interventions/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { clientId, id } = req.params;
    const {
      title, description, intervention_type, status,
      planned_date, implementation_date, measurement_start, measurement_end,
      measurement_duration_days, cost_to_client, our_cost,
      revenue_impact_monthly, recommendation_id, project_id,
      notes, client_summary, before_screenshot_url, after_screenshot_url,
      report_url,
    } = req.body;

    // Verify the intervention exists and belongs to this client
    const [existing] = await pool.query(
      'SELECT id FROM interventions WHERE id = ? AND client_id = ?',
      [id, clientId]
    );
    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Intervention not found' });
      return;
    }

    // Validate enum fields if provided
    if (intervention_type && !VALID_TYPES.includes(intervention_type)) {
      res.status(400).json({ success: false, error: `Invalid intervention type. Must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    // Auto-calculate ROI if we have cost and revenue data
    let overall_roi = null;
    let payback_period_days = null;
    const costVal = cost_to_client !== undefined ? cost_to_client : null;
    const revenueVal = revenue_impact_monthly !== undefined ? revenue_impact_monthly : null;
    if (costVal && revenueVal) {
      overall_roi = calculateROI(costVal, revenueVal * 12);
      const paybackMonths = calculatePaybackPeriod(costVal, revenueVal);
      payback_period_days = paybackMonths ? Math.round(paybackMonths * 30.44) : null;
    }

    // Auto-calculate effectiveness from metrics if status is completing
    let effectiveness_rating = null;
    if (status === 'completed' || status === 'measured') {
      const [metrics] = await pool.query(
        'SELECT baseline_value, current_value FROM intervention_metrics WHERE intervention_id = ? AND current_value IS NOT NULL',
        [id]
      );
      if (metrics.length > 0) {
        const pairs = metrics.map((m) => ({ before: m.baseline_value, after: m.current_value }));
        // calculateEffectiveness accepts either (before[], after[]) or (pairs[]).
        // Passing undefined as the second arg selects the single-array branch.
        const { rating } = calculateEffectiveness(pairs, undefined);
        effectiveness_rating = ratingToDbEnum(rating);
      }
    }

    await pool.query(
      `UPDATE interventions SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        intervention_type = COALESCE(?, intervention_type),
        status = COALESCE(?, status),
        planned_date = COALESCE(?, planned_date),
        implementation_date = COALESCE(?, implementation_date),
        measurement_start = COALESCE(?, measurement_start),
        measurement_end = COALESCE(?, measurement_end),
        measurement_duration_days = COALESCE(?, measurement_duration_days),
        cost_to_client = COALESCE(?, cost_to_client),
        our_cost = COALESCE(?, our_cost),
        overall_roi = COALESCE(?, overall_roi),
        revenue_impact_monthly = COALESCE(?, revenue_impact_monthly),
        payback_period_days = COALESCE(?, payback_period_days),
        effectiveness_rating = COALESCE(?, effectiveness_rating),
        recommendation_id = COALESCE(?, recommendation_id),
        project_id = COALESCE(?, project_id),
        notes = COALESCE(?, notes),
        client_summary = COALESCE(?, client_summary),
        before_screenshot_url = COALESCE(?, before_screenshot_url),
        after_screenshot_url = COALESCE(?, after_screenshot_url),
        report_url = COALESCE(?, report_url),
        updated_at = NOW()
      WHERE id = ? AND client_id = ?`,
      [
        title || null,
        description !== undefined ? description : null,
        intervention_type || null,
        status || null,
        planned_date || null,
        implementation_date || null,
        measurement_start || null,
        measurement_end || null,
        measurement_duration_days || null,
        cost_to_client !== undefined ? cost_to_client : null,
        our_cost !== undefined ? our_cost : null,
        overall_roi,
        revenue_impact_monthly !== undefined ? revenue_impact_monthly : null,
        payback_period_days,
        effectiveness_rating,
        recommendation_id || null,
        project_id || null,
        notes !== undefined ? notes : null,
        client_summary !== undefined ? client_summary : null,
        before_screenshot_url || null,
        after_screenshot_url || null,
        report_url || null,
        id,
        clientId,
      ]
    );

    res.json({
      success: true,
      data: {
        message: 'Intervention updated',
        overall_roi,
        payback_period_days,
        effectiveness_rating,
      },
    });
  } catch (err) {
    console.error('Error updating intervention:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// DELETE /api/clients/:clientId/interventions/:id
// Delete an intervention (cascades to metrics, snapshots, alerts)
// ============================================================
router.delete('/:clientId/interventions/:id', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { clientId, id } = req.params;

    const [existing] = await pool.query(
      'SELECT id FROM interventions WHERE id = ? AND client_id = ?',
      [id, clientId]
    );
    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Intervention not found' });
      return;
    }

    // FK CASCADE handles metrics, snapshots, alerts deletion
    await pool.query(
      'DELETE FROM interventions WHERE id = ? AND client_id = ?',
      [id, clientId]
    );

    res.json({ success: true, data: { message: 'Intervention deleted' } });
  } catch (err) {
    console.error('Error deleting intervention:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// POST /api/clients/:clientId/interventions/:id/metrics
// Add a before/after metric to an intervention
// ============================================================
router.post('/:clientId/interventions/:id/metrics', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { clientId, id } = req.params;
    const {
      metric_name, metric_slug, unit, baseline_value,
      baseline_period_start, baseline_period_end, baseline_source,
      target_value, current_value, attribution, attribution_percent,
      growth_target_id, data_source,
    } = req.body;

    // Validate intervention belongs to client
    const [intervention] = await pool.query(
      'SELECT id FROM interventions WHERE id = ? AND client_id = ?',
      [id, clientId]
    );
    if (intervention.length === 0) {
      res.status(404).json({ success: false, error: 'Intervention not found' });
      return;
    }

    // Validation
    if (!metric_name || !metric_name.trim()) {
      res.status(400).json({ success: false, error: 'Metric name is required' });
      return;
    }
    if (baseline_value === undefined || baseline_value === null) {
      res.status(400).json({ success: false, error: 'Baseline value is required' });
      return;
    }

    // Auto-generate slug if not provided
    const slug = metric_slug || metric_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // Calculate change values if current_value provided
    let change_absolute = null;
    let change_percent = null;
    if (current_value !== undefined && current_value !== null) {
      change_absolute = current_value - baseline_value;
      if (baseline_value !== 0) {
        change_percent = Math.round(((current_value - baseline_value) / Math.abs(baseline_value)) * 10000) / 100;
      }
    }

    const validAttributions = ['primary', 'contributing', 'indirect', 'negative'];
    const validDataSources = [
      'google_analytics', 'search_console', 'pagespeed', 'facebook',
      'instagram', 'google_business', 'financial', 'manual',
    ];

    const metricId = generateId();
    await pool.query(
      `INSERT INTO intervention_metrics (
        id, intervention_id, metric_name, metric_slug, unit, baseline_value,
        baseline_period_start, baseline_period_end, baseline_source,
        target_value, current_value, change_absolute, change_percent,
        attribution, attribution_percent, growth_target_id, data_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metricId,
        id,
        metric_name.trim(),
        slug,
        unit || null,
        baseline_value,
        baseline_period_start || null,
        baseline_period_end || null,
        baseline_source || null,
        target_value || null,
        current_value || null,
        change_absolute,
        change_percent,
        (attribution && validAttributions.includes(attribution)) ? attribution : 'primary',
        attribution_percent || 100,
        growth_target_id || null,
        (data_source && validDataSources.includes(data_source)) ? data_source : 'manual',
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: metricId,
        change_absolute,
        change_percent,
        message: 'Metric added',
      },
    });
  } catch (err) {
    console.error('Error adding intervention metric:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// PUT /api/clients/:clientId/interventions/:id/metrics/:metricId
// Update a metric (typically updating current_value for after)
// ============================================================
router.put('/:clientId/interventions/:id/metrics/:metricId', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { clientId, id, metricId } = req.params;
    const {
      metric_name, unit, baseline_value, current_value, target_value,
      baseline_period_start, baseline_period_end, baseline_source,
      attribution, attribution_percent, growth_target_id, data_source,
    } = req.body;

    // Validate intervention belongs to client
    const [intervention] = await pool.query(
      'SELECT id FROM interventions WHERE id = ? AND client_id = ?',
      [id, clientId]
    );
    if (intervention.length === 0) {
      res.status(404).json({ success: false, error: 'Intervention not found' });
      return;
    }

    // Validate metric belongs to intervention
    const [existingMetric] = await pool.query(
      'SELECT id, baseline_value FROM intervention_metrics WHERE id = ? AND intervention_id = ?',
      [metricId, id]
    );
    if (existingMetric.length === 0) {
      res.status(404).json({ success: false, error: 'Metric not found' });
      return;
    }

    // Use existing baseline if not being updated
    const effectiveBaseline = baseline_value !== undefined ? baseline_value : existingMetric[0].baseline_value;

    // Recalculate change values
    let change_absolute = null;
    let change_percent = null;
    if (current_value !== undefined && current_value !== null) {
      change_absolute = current_value - effectiveBaseline;
      if (effectiveBaseline !== 0) {
        change_percent = Math.round(((current_value - effectiveBaseline) / Math.abs(effectiveBaseline)) * 10000) / 100;
      }
    }

    await pool.query(
      `UPDATE intervention_metrics SET
        metric_name = COALESCE(?, metric_name),
        unit = COALESCE(?, unit),
        baseline_value = COALESCE(?, baseline_value),
        baseline_period_start = COALESCE(?, baseline_period_start),
        baseline_period_end = COALESCE(?, baseline_period_end),
        baseline_source = COALESCE(?, baseline_source),
        target_value = COALESCE(?, target_value),
        current_value = COALESCE(?, current_value),
        change_absolute = COALESCE(?, change_absolute),
        change_percent = COALESCE(?, change_percent),
        attribution = COALESCE(?, attribution),
        attribution_percent = COALESCE(?, attribution_percent),
        growth_target_id = COALESCE(?, growth_target_id),
        data_source = COALESCE(?, data_source),
        updated_at = NOW()
      WHERE id = ? AND intervention_id = ?`,
      [
        metric_name || null,
        unit || null,
        baseline_value !== undefined ? baseline_value : null,
        baseline_period_start || null,
        baseline_period_end || null,
        baseline_source || null,
        target_value !== undefined ? target_value : null,
        current_value !== undefined ? current_value : null,
        change_absolute,
        change_percent,
        attribution || null,
        attribution_percent !== undefined ? attribution_percent : null,
        growth_target_id || null,
        data_source || null,
        metricId,
        id,
      ]
    );

    res.json({
      success: true,
      data: {
        message: 'Metric updated',
        change_absolute,
        change_percent,
      },
    });
  } catch (err) {
    console.error('Error updating intervention metric:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// POST /api/clients/:clientId/interventions/:id/snapshots
// Capture a point-in-time snapshot of all metrics for this intervention
// ============================================================
router.post('/:clientId/interventions/:id/snapshots', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
  try {
    const { clientId, id } = req.params;
    const { checkpoint, notes } = req.body;

    // Validate intervention belongs to client
    const [intervention] = await pool.query(
      'SELECT id, implementation_date FROM interventions WHERE id = ? AND client_id = ?',
      [id, clientId]
    );
    if (intervention.length === 0) {
      res.status(404).json({ success: false, error: 'Intervention not found' });
      return;
    }

    // Fetch all metrics for this intervention
    const [metrics] = await pool.query(
      'SELECT id, current_value, baseline_value FROM intervention_metrics WHERE intervention_id = ?',
      [id]
    );
    if (metrics.length === 0) {
      res.status(400).json({ success: false, error: 'No metrics to snapshot. Add metrics first.' });
      return;
    }

    // Calculate days since launch
    let daysSinceLaunch = null;
    if (intervention[0].implementation_date) {
      const launchDate = new Date(intervention[0].implementation_date);
      const now = new Date();
      daysSinceLaunch = Math.floor((now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const validCheckpoints = ['7d', '14d', '30d', '60d', '90d', '180d', 'custom'];
    const snapshotCheckpoint = (checkpoint && validCheckpoints.includes(checkpoint)) ? checkpoint : 'custom';

    // Insert a snapshot row for each metric
    const insertedIds= [];
    for (const metric of metrics) {
      if (metric.current_value === null) continue; // skip metrics without current readings

      const changeFromBaseline = metric.baseline_value !== 0
        ? Math.round(((metric.current_value - metric.baseline_value) / Math.abs(metric.baseline_value)) * 10000) / 100
        : null;

      const snapshotId = generateId();
      await pool.query(
        `INSERT INTO intervention_snapshots (
          id, intervention_metric_id, intervention_id, value,
          change_from_baseline, days_since_launch, checkpoint,
          source, notes, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?, NOW())`,
        [
          snapshotId,
          metric.id,
          id,
          metric.current_value,
          changeFromBaseline,
          daysSinceLaunch,
          snapshotCheckpoint,
          notes || null,
        ]
      );
      insertedIds.push(snapshotId);
    }

    res.status(201).json({
      success: true,
      data: {
        snapshot_count: insertedIds.length,
        snapshot_ids: insertedIds,
        days_since_launch: daysSinceLaunch,
        checkpoint: snapshotCheckpoint,
        message: 'Snapshot captured',
      },
    });
  } catch (err) {
    console.error('Error capturing snapshot:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// GET /api/clients/:clientId/interventions/:id/snapshots
// List all snapshots for an intervention, grouped by timestamp
// ============================================================
router.get('/:clientId/interventions/:id/snapshots', authenticateToken, async (req, res) => {
  try {
    const { clientId, id } = req.params;

    // Validate intervention belongs to client
    const [intervention] = await pool.query(
      'SELECT id FROM interventions WHERE id = ? AND client_id = ?',
      [id, clientId]
    );
    if (intervention.length === 0) {
      res.status(404).json({ success: false, error: 'Intervention not found' });
      return;
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.intervention_metric_id, s.value, s.change_from_baseline,
              s.days_since_launch, s.checkpoint, s.source, s.notes, s.recorded_at,
              m.metric_name, m.metric_slug, m.unit, m.baseline_value
       FROM intervention_snapshots s
       JOIN intervention_metrics m ON s.intervention_metric_id = m.id
       WHERE s.intervention_id = ?
       ORDER BY s.recorded_at DESC, m.metric_name ASC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error listing snapshots:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================
// POST /api/clients/:clientId/interventions/:id/screenshots
// Upload before/after screenshots via multer
// Accepts fields: before_screenshot, after_screenshot (single file each)
// ============================================================
router.post(
  '/:clientId/interventions/:id/screenshots',
  authenticateToken,
  requireRole('owner', 'admin', 'manager'),
  setUploadType('document'),
  upload.fields([
    { name: 'before_screenshot', maxCount: 1 },
    { name: 'after_screenshot', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { clientId, id } = req.params;

      // Validate intervention belongs to client
      const [intervention] = await pool.query(
        'SELECT id FROM interventions WHERE id = ? AND client_id = ?',
        [id, clientId]
      );
      if (intervention.length === 0) {
        res.status(404).json({ success: false, error: 'Intervention not found' });
        return;
      }

      const updates = {};
      const files = (req).files;
      if (files && files.before_screenshot && files.before_screenshot[0]) {
        updates.before_screenshot_url = `/uploads/documents/${files.before_screenshot[0].filename}`;
      }
      if (files && files.after_screenshot && files.after_screenshot[0]) {
        updates.after_screenshot_url = `/uploads/documents/${files.after_screenshot[0].filename}`;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, error: 'No screenshots provided' });
        return;
      }

      // Build dynamic UPDATE query for provided fields only
      const setClauses= [];
      const params = [];
      for (const [col, val] of Object.entries(updates)) {
        setClauses.push(`${col} = ?`);
        params.push(val);
      }
      setClauses.push('updated_at = NOW()');
      params.push(id, clientId);

      await pool.query(
        `UPDATE interventions SET ${setClauses.join(', ')} WHERE id = ? AND client_id = ?`,
        params
      );

      res.json({
        success: true,
        data: {
          ...updates,
          message: 'Screenshots uploaded',
        },
      });
    } catch (err) {
      console.error('Error uploading screenshots:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

export default router;
