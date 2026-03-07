import { Router, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { generateJSON } from '../utils/ai.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// ─── Webhook Auth ────────────────────────────────────────────────────────────

function authenticateWebhook(req: any, res: Response, next: NextFunction): void {
  const secret = req.headers['x-webhook-secret'] || req.query.secret;
  const expected = process.env.AI_WEBHOOK_SECRET;
  if (!expected) {
    res.status(503).json({ error: 'Webhook not configured. Set AI_WEBHOOK_SECRET env var.' });
    return;
  }
  if (!secret || secret !== expected) {
    res.status(401).json({ error: 'Invalid webhook secret' });
    return;
  }
  next();
}

// ─── Period Helpers ──────────────────────────────────────────────────────────

function computePeriodBounds(periodType: string, periodLabel: string): { start: string; end: string } {
  let start: string, end: string;
  switch (periodType) {
    case 'daily': {
      // periodLabel = "2026-03-03"
      start = periodLabel;
      end = periodLabel;
      break;
    }
    case 'weekly': {
      // periodLabel = "2026-W09" → compute Monday-Sunday
      const [yr, wk] = periodLabel.split('-W').map(Number);
      const jan1 = new Date(yr, 0, 1);
      const dayOfWeek = jan1.getDay() || 7; // Mon=1..Sun=7
      const mon = new Date(jan1);
      mon.setDate(jan1.getDate() + (wk - 1) * 7 - dayOfWeek + 1);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      start = mon.toISOString().slice(0, 10);
      end = sun.toISOString().slice(0, 10);
      break;
    }
    case 'monthly': {
      // periodLabel = "2026-03"
      const [y, m] = periodLabel.split('-').map(Number);
      start = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      end = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
      break;
    }
    case 'yearly': {
      // periodLabel = "2026"
      start = `${periodLabel}-01-01`;
      end = `${periodLabel}-12-31`;
      break;
    }
    default:
      start = new Date().toISOString().slice(0, 10);
      end = start;
  }
  return { start, end };
}

// ─── Snapshot Compiler ───────────────────────────────────────────────────────

const POSSIBLE_SOURCES = [
  'client_profile', 'intake', 'audits', 'financials', 'ad_spend',
  'growth_targets', 'interventions', 'projects', 'invoices',
  'prospects', 'service_requests', 'execution_plans',
  'swot', 'porters', 'market_sizing', 'kpi_snapshots', 'forecasting'
];

async function compileClientSnapshot(clientId: string, periodStart: string, periodEnd: string, periodType: string, localStorageData: any): Promise<{ snapshotData: any; foundSources: string[]; completenessScore: number }> {
  // Calculate period_year/period_month range for ad_spend queries
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const startYYMM = startDate.getFullYear() * 100 + (startDate.getMonth() + 1);
  const endYYMM = endDate.getFullYear() * 100 + (endDate.getMonth() + 1);

  // Run all 12 DB queries in parallel
  const results = await Promise.allSettled([
    // 0: client profile
   
    pool.query('SELECT id, name, email, phone, service, tier, status, business_name, business_address, created_at FROM clients WHERE id = ?', [clientId]),

    // 1: intake
   
    pool.query('SELECT * FROM business_intakes WHERE client_id = ? ORDER BY created_at DESC LIMIT 1', [clientId]),

    // 2: audits with scores
   
    pool.query(
      `SELECT ba.id, ba.version, ba.audit_type, ba.overall_score, ba.status, ba.audit_date,
              ba.published_at, ba.notes
       FROM business_audits ba
       WHERE ba.client_id = ?
       ORDER BY ba.version DESC LIMIT 5`,
      [clientId]
    ),

    // 3: financials
    periodType === 'yearly'
      ?
    pool.query(
          `SELECT period_year,
            SUM(gross_revenue) as annual_revenue, SUM(total_expenses) as annual_expenses,
            SUM(net_profit) as annual_profit, AVG(profit_margin) as avg_margin,
            SUM(new_customers) as annual_new_customers, SUM(total_marketing_spend) as annual_marketing_spend,
            COUNT(*) as months_with_data
           FROM client_financials WHERE client_id = ? AND period_year = ?
           GROUP BY period_year`,
          [clientId, startDate.getFullYear()]
        )
      :
    pool.query(
          `SELECT * FROM client_financials WHERE client_id = ?
           AND (period_year * 100 + period_month) BETWEEN ? AND ?
           ORDER BY period_year DESC, period_month DESC`,
          [clientId, startYYMM, endYYMM]
        ),

    // 4: ad spend by platform
   
    pool.query(
      `SELECT platform,
        SUM(spend) as total_spend, AVG(roas) as avg_roas,
        SUM(impressions) as total_impressions, SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions
       FROM client_ad_spend WHERE client_id = ?
       AND (period_year * 100 + period_month) BETWEEN ? AND ?
       GROUP BY platform`,
      [clientId, startYYMM, endYYMM]
    ),

    // 5: growth targets with latest snapshot
   
    pool.query(
      `SELECT gt.*,
        (SELECT gs.value FROM growth_snapshots gs WHERE gs.target_id = gt.id ORDER BY gs.recorded_at DESC LIMIT 1) as latest_value,
        (SELECT gs.progress_percent FROM growth_snapshots gs WHERE gs.target_id = gt.id ORDER BY gs.recorded_at DESC LIMIT 1) as latest_progress,
        (SELECT gs.recorded_at FROM growth_snapshots gs WHERE gs.target_id = gt.id ORDER BY gs.recorded_at DESC LIMIT 1) as latest_snapshot_at
       FROM growth_targets gt WHERE gt.client_id = ?`,
      [clientId]
    ),

    // 6: interventions with metrics
   
    pool.query(
      `SELECT i.id, i.title, i.intervention_type, i.status, i.cost_to_client, i.overall_roi,
              i.effectiveness_rating, i.implementation_date, i.notes
       FROM interventions i WHERE i.client_id = ?
       ORDER BY i.created_at DESC LIMIT 20`,
      [clientId]
    ),

    // 7: projects
   
    pool.query(
      'SELECT id, title, status, progress, start_date, due_date FROM projects WHERE client_id = ? ORDER BY created_at DESC LIMIT 10',
      [clientId]
    ),

    // 8: invoices summary
   
    pool.query(
      `SELECT
        COUNT(*) as total_invoices,
        SUM(amount) as total_billed,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status IN ('unpaid', 'pending') THEN amount ELSE 0 END) as outstanding,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count
       FROM invoices WHERE client_id = ?`,
      [clientId]
    ),

    // 9: prospects/pipeline
   
    pool.query(
      `SELECT
        COUNT(*) as total_prospects,
        SUM(CASE WHEN outcome IS NULL THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN outcome IS NULL THEN COALESCE(deal_value, estimated_value, 0) ELSE 0 END) as active_pipeline_value,
        AVG(CASE WHEN outcome IS NULL THEN probability ELSE NULL END) as avg_probability,
        SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as won_count,
        SUM(CASE WHEN outcome = 'lost' THEN 1 ELSE 0 END) as lost_count
       FROM prospects WHERE client_id = ?`,
      [clientId]
    ),

    // 10: service requests
   
    pool.query(
      'SELECT title, urgency, status, budget_range, created_at FROM service_requests WHERE client_id = ? ORDER BY created_at DESC LIMIT 10',
      [clientId]
    ),

    // 11: execution plans
   
    pool.query(
      'SELECT name, plan_data, start_date, created_at FROM execution_plans WHERE client_id = ? ORDER BY created_at DESC LIMIT 3',
      [clientId]
    ),
  ]);

  // Also fetch audit scores for found audits
  let auditScores: { [key: string]: any[] } = {};
  if (results[2].status === 'fulfilled' && (results[2].value as any)[0].length > 0) {
    const auditIds = (results[2].value as any)[0].map((a: any) => a.id);
    try {
      const [scores] = await pool.query(
        `SELECT s.audit_id, ac.name as category_name, s.score, s.weight
         FROM audit_scores s
         JOIN audit_categories ac ON ac.id = s.category_id
         WHERE s.audit_id IN (${auditIds.map(() => '?').join(',')})`,
        auditIds
      );
      for (const s of (scores as any[])) {
        if (!auditScores[s.audit_id]) auditScores[s.audit_id] = [];
        auditScores[s.audit_id].push({ category: s.category_name, score: s.score, weight: s.weight });
      }
    } catch (e) { /* scores optional */ }
  }

  // Also fetch intervention metrics
  let interventionMetrics: { [key: string]: any[] } = {};
  if (results[6].status === 'fulfilled' && (results[6].value as any)[0].length > 0) {
    const intIds = (results[6].value as any)[0].map((i: any) => i.id);
    try {
      const [metrics] = await pool.query(
        `SELECT intervention_id, metric_name, baseline_value, current_value, change_percent
         FROM intervention_metrics WHERE intervention_id IN (${intIds.map(() => '?').join(',')})`,
        intIds
      );
      for (const m of (metrics as any[])) {
        if (!interventionMetrics[m.intervention_id]) interventionMetrics[m.intervention_id] = [];
        interventionMetrics[m.intervention_id].push(m);
      }
    } catch (e) { /* metrics optional */ }
  }

  // Assemble snapshot
  const extract = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value[0] : [];
  const foundSources: string[] = [];

  const clientProfile = extract(results[0])[0] || null;
  if (clientProfile) foundSources.push('client_profile');

  const intake = extract(results[1])[0] || null;
  if (intake) foundSources.push('intake');

  const rawAudits = extract(results[2]);
  const audits = rawAudits.map((a: any) => ({ ...a, category_scores: auditScores[a.id] || [] }));
  if (audits.length > 0) foundSources.push('audits');

  const financials = extract(results[3]);
  if (financials.length > 0) foundSources.push('financials');

  const adSpend = extract(results[4]);
  if (adSpend.length > 0) foundSources.push('ad_spend');

  const growthTargets = extract(results[5]);
  if (growthTargets.length > 0) foundSources.push('growth_targets');

  const rawInterventions = extract(results[6]);
  const interventions = rawInterventions.map((i: any) => ({ ...i, metrics: interventionMetrics[i.id] || [] }));
  if (interventions.length > 0) foundSources.push('interventions');

  const projects = extract(results[7]);
  if (projects.length > 0) foundSources.push('projects');

  const invoiceSummary = extract(results[8])[0] || null;
  if (invoiceSummary && invoiceSummary.total_invoices > 0) foundSources.push('invoices');

  const pipelineSummary = extract(results[9])[0] || null;
  if (pipelineSummary && pipelineSummary.total_prospects > 0) foundSources.push('prospects');

  const serviceRequests = extract(results[10]);
  if (serviceRequests.length > 0) foundSources.push('service_requests');

  const executionPlans = extract(results[11]);
  if (executionPlans.length > 0) foundSources.push('execution_plans');

  // Merge localStorage data
  const ls = localStorageData || {};
  if (ls.swot) foundSources.push('swot');
  if (ls.porters) foundSources.push('porters');
  if (ls.market_sizing) foundSources.push('market_sizing');
  if (ls.kpi_snapshots) foundSources.push('kpi_snapshots');
  if (ls.forecasting) foundSources.push('forecasting');

  const completenessScore = Math.round((foundSources.length / POSSIBLE_SOURCES.length) * 10000) / 100;

  const snapshotData = {
    compiled_at: new Date().toISOString(),
    period: { type: periodType, start: periodStart, end: periodEnd },
    client_profile: clientProfile,
    business_intake: intake,
    audit_history: audits,
    latest_audit: audits[0] || null,
    financials: periodType === 'yearly'
      ? { type: 'yearly_aggregate', data: financials[0] || null }
      : { type: 'period_records', data: financials },
    ad_spend: adSpend,
    growth_targets: growthTargets,
    interventions,
    projects,
    invoice_summary: invoiceSummary,
    pipeline_summary: pipelineSummary,
    service_requests: serviceRequests,
    execution_plans: executionPlans.map((ep: any) => {
      // Summarize plan_data to keep snapshot manageable
      let parsed = ep.plan_data;
      if (typeof parsed === 'string') try { parsed = JSON.parse(parsed); } catch (e) { parsed = null; }
      return { name: ep.name, start_date: ep.start_date, plan_summary: parsed };
    }),
    local_data: {
      swot: ls.swot || null,
      porters: ls.porters || null,
      market_sizing: ls.market_sizing || null,
      kpi_snapshots: ls.kpi_snapshots || null,
      forecasting: ls.forecasting || null,
    },
  };

  return { snapshotData, foundSources, completenessScore };
}

// ─── Gemini System Prompt ────────────────────────────────────────────────────

const AI_SYSTEM_INSTRUCTION = `You are an expert business analyst for a digital agency. You analyze compiled client data and produce actionable recommendations.

Return a JSON object with this exact structure:
{
  "executive_summary": "A 2-4 sentence summary of the client's overall business health and most important findings.",
  "overall_health_rating": "critical" | "at_risk" | "stable" | "growing" | "exceptional",
  "confidence_score": <number 0-100 based on data completeness>,
  "key_findings": ["finding1", "finding2", ...],
  "recommendations": [
    {
      "category": "<SEO|Financial|Growth|Operations|Marketing|Technical|Strategic|Client Health>",
      "title": "<short actionable title>",
      "description": "<detailed explanation>",
      "rationale": "<which data signals drove this recommendation>",
      "priority": "critical" | "high" | "medium" | "low",
      "estimated_effort": "low" | "medium" | "high",
      "expected_impact": "<what improvement is expected>",
      "suggested_timeline": "<e.g. '1-2 weeks', '30 days', 'ongoing'>",
      "supporting_data_sources": ["<source1>", "<source2>"]
    }
  ],
  "period_insights": {
    "notable_trends": ["trend1", "trend2"],
    "anomalies": ["anomaly1"],
    "risks": ["risk1"]
  }
}

Guidelines:
- Generate 5-15 recommendations sorted by priority (critical first).
- Base every recommendation on actual data in the snapshot. Do not invent data.
- If a data source is null/missing, note it in key_findings as a gap but do not fabricate insights about it.
- For financial analysis, compute growth rates, margins, and flag concerning trends.
- For SEO/audit scores, flag categories scoring below 5/10 as needing attention.
- Consider the client's tier, industry, and stated goals from their intake form.
- Be specific and actionable — avoid generic advice.`;

// ─── Routes: Snapshots ──────────────────────────────────────────────────────

// POST /api/ai-recommendations/clients/:clientId/snapshots — compile & store
router.post('/clients/:clientId/snapshots', authenticateToken, requireRole('owner', 'admin', 'manager', 'analyst'), async (req: any, res: Response) => {
  try {
    const { clientId } = req.params;
    const { period_type = 'monthly', period_label, localStorage_data } = req.body;

    // Compute period label if not provided
    const now = new Date();
    let label = period_label;
    if (!label) {
      switch (period_type) {
        case 'daily': label = now.toISOString().slice(0, 10); break;
        case 'weekly': {
          const onejan = new Date(now.getFullYear(), 0, 1);
          const wk = Math.ceil(((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay()) / 7);
          label = `${now.getFullYear()}-W${String(wk).padStart(2, '0')}`;
          break;
        }
        case 'monthly': label = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; break;
        case 'yearly': label = String(now.getFullYear()); break;
        default: label = now.toISOString().slice(0, 10);
      }
    }

    const { start, end } = computePeriodBounds(period_type, label);
    const { snapshotData, foundSources, completenessScore } = await compileClientSnapshot(
      clientId, start, end, period_type, localStorage_data
    );

    const id = generateId();
    await pool.query(
      `INSERT INTO client_data_snapshots
       (id, client_id, period_type, period_label, period_start, period_end,
        snapshot_data, data_sources_included, data_completeness_score,
        generated_by, generation_trigger)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`,
      [id, clientId, period_type, label, start, end,
       JSON.stringify(snapshotData), JSON.stringify(foundSources), completenessScore,
       req.user?.id]
    );

    res.json({
      success: true,
      data: {
        snapshotId: id,
        period_type, period_label: label,
        period_start: start, period_end: end,
        data_sources_included: foundSources,
        data_completeness_score: completenessScore,
        snapshot_data: snapshotData,
      }
    });
  } catch (err) {
    console.error('POST snapshot error:', err);
    res.status(500).json({ success: false, error: 'Failed to compile snapshot' });
  }
});

// GET /api/ai-recommendations/clients/:clientId/snapshots — list
router.get('/clients/:clientId/snapshots', authenticateToken, async (req: any, res: Response) => {
  try {
    const { clientId } = req.params;
    const { period_type, limit = 20, offset = 0 } = req.query;

    let sql = `SELECT id, period_type, period_label, period_start, period_end,
               data_sources_included, data_completeness_score, generation_trigger, created_at
               FROM client_data_snapshots WHERE client_id = ?`;
    const params: any[] = [clientId];

    if (period_type) { sql += ' AND period_type = ?'; params.push(period_type); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET snapshots error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/ai-recommendations/clients/:clientId/snapshots/:snapshotId — full snapshot
router.get('/clients/:clientId/snapshots/:snapshotId', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM client_data_snapshots WHERE id = ? AND client_id = ?',
      [req.params.snapshotId, req.params.clientId]
    );
    const rowsArray = Array.isArray(rows) ? rows : [];
    if (!rowsArray.length) return res.status(404).json({ success: false, error: 'Snapshot not found' });

    const row = rowsArray[0] as any;
    if (typeof row.snapshot_data === 'string') row.snapshot_data = JSON.parse(row.snapshot_data);
    if (typeof row.data_sources_included === 'string') row.data_sources_included = JSON.parse(row.data_sources_included);

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('GET snapshot detail error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Routes: Analysis ────────────────────────────────────────────────────────

// POST /api/ai-recommendations/clients/:clientId/analyze — run Gemini
router.post('/clients/:clientId/analyze', authenticateToken, requireRole('owner', 'admin', 'manager', 'analyst'), async (req: any, res: Response) => {
  try {
    const { clientId } = req.params;
    const { snapshot_id, period_type = 'monthly', period_label, localStorage_data, analysis_type = 'full' } = req.body;

    let snapshotId = snapshot_id;
    let snapshotData: any;

    // If no snapshot provided, compile one first
    if (!snapshotId) {
      const now = new Date();
      let label = period_label;
      if (!label) {
        switch (period_type) {
          case 'daily': label = now.toISOString().slice(0, 10); break;
          case 'weekly': {
            const onejan = new Date(now.getFullYear(), 0, 1);
            const wk = Math.ceil(((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay()) / 7);
            label = `${now.getFullYear()}-W${String(wk).padStart(2, '0')}`;
            break;
          }
          case 'monthly': label = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; break;
          case 'yearly': label = String(now.getFullYear()); break;
          default: label = now.toISOString().slice(0, 10);
        }
      }

      const { start, end } = computePeriodBounds(period_type, label);
      const compiled = await compileClientSnapshot(clientId, start, end, period_type, localStorage_data);

      snapshotId = generateId();
      await pool.query(
        `INSERT INTO client_data_snapshots
         (id, client_id, period_type, period_label, period_start, period_end,
          snapshot_data, data_sources_included, data_completeness_score,
          generated_by, generation_trigger)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`,
        [snapshotId, clientId, period_type, label, start, end,
         JSON.stringify(compiled.snapshotData), JSON.stringify(compiled.foundSources),
         compiled.completenessScore, req.user?.id]
      );
      snapshotData = compiled.snapshotData;
    } else {
      // Load existing snapshot
      const [rows] = await pool.query(
        'SELECT snapshot_data FROM client_data_snapshots WHERE id = ? AND client_id = ?',
        [snapshotId, clientId]
      );
      const rowsArray = Array.isArray(rows) ? rows : [];
      if (!rowsArray.length) return res.status(404).json({ success: false, error: 'Snapshot not found' });
      snapshotData = typeof rowsArray[0].snapshot_data === 'string'
        ? JSON.parse(rowsArray[0].snapshot_data) : rowsArray[0].snapshot_data;
    }

    // Create AI recommendation record
    const recId = generateId();
    await pool.query(
      `INSERT INTO ai_recommendations
       (id, client_id, snapshot_id, ai_provider, analysis_type, generation_status, created_by)
       VALUES (?, ?, ?, 'gemini', ?, 'generating', ?)`,
      [recId, clientId, snapshotId, analysis_type, req.user?.id]
    );

    // Build the Gemini prompt
    const focusHint = analysis_type !== 'full'
      ? `\n\nFOCUS: This is a "${analysis_type}" analysis. Prioritize ${analysis_type}-related insights.`
      : '';
    const prompt = `Analyze this compiled client data snapshot and provide recommendations.${focusHint}\n\nClient Data:\n${JSON.stringify(snapshotData, null, 2)}`;

    let aiResult: any;
    try {
      aiResult = await generateJSON(prompt, AI_SYSTEM_INSTRUCTION);
    } catch (aiErr: any) {
      console.error('Gemini error:', aiErr);
      await pool.query(
        `UPDATE ai_recommendations SET generation_status = 'failed', error_message = ? WHERE id = ?`,
        [aiErr.message || 'AI generation failed', recId]
      );
      return res.status(502).json({ success: false, error: 'AI generation failed', detail: aiErr.message });
    }

    // Parse and store results
    const recs = aiResult.recommendations || [];
    const counts: { [key: string]: number } = { total: recs.length, critical: 0, high: 0, medium: 0, low: 0 };
    recs.forEach((r: any) => { if (counts[r.priority] !== undefined) counts[r.priority]++; });

    await pool.query(
      `UPDATE ai_recommendations SET
        generation_status = 'completed', generated_at = NOW(),
        ai_response_raw = ?, executive_summary = ?,
        overall_health_rating = ?, confidence_score = ?,
        total_recommendations = ?, critical_count = ?,
        high_count = ?, medium_count = ?, low_count = ?,
        model_used = 'gemini-2.5-flash'
       WHERE id = ?`,
      [JSON.stringify(aiResult), aiResult.executive_summary || null,
       aiResult.overall_health_rating || null, aiResult.confidence_score || null,
       counts.total, counts.critical, counts.high, counts.medium, counts.low,
       recId]
    );

    // Insert individual items
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      const itemId = generateId();
      await pool.query(
        `INSERT INTO ai_recommendation_items
         (id, ai_recommendation_id, client_id, category, title, description,
          rationale, expected_impact, suggested_timeline, estimated_effort,
          priority, display_order, supporting_data_sources)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, recId, clientId, r.category || null, r.title, r.description || '',
         r.rationale || null, r.expected_impact || null, r.suggested_timeline || null,
         r.estimated_effort || null, r.priority || 'medium', i,
         JSON.stringify(r.supporting_data_sources || [])]
      );
    }

    // Return the full result
    res.json({
      success: true,
      data: {
        id: recId,
        snapshot_id: snapshotId,
        analysis_type,
        executive_summary: aiResult.executive_summary,
        overall_health_rating: aiResult.overall_health_rating,
        confidence_score: aiResult.confidence_score,
        key_findings: aiResult.key_findings || [],
        period_insights: aiResult.period_insights || {},
        total_recommendations: counts.total,
        items: recs.map((r: any, i: number) => ({ ...r, display_order: i, admin_status: 'new' })),
      }
    });
  } catch (err) {
    console.error('POST analyze error:', err);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// GET /api/ai-recommendations/clients/:clientId/analyses — list runs
router.get('/clients/:clientId/analyses', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, snapshot_id, ai_provider, analysis_type, generation_status,
              executive_summary, overall_health_rating, confidence_score,
              total_recommendations, critical_count, high_count, medium_count, low_count,
              generated_at, created_at
       FROM ai_recommendations WHERE client_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [req.params.clientId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET analyses error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/ai-recommendations/clients/:clientId/analyses/:analysisId — detail with items
router.get('/clients/:clientId/analyses/:analysisId', authenticateToken, async (req: any, res: Response) => {
  try {
    const [analyses] = await pool.query(
      'SELECT * FROM ai_recommendations WHERE id = ? AND client_id = ?',
      [req.params.analysisId, req.params.clientId]
    );
    const analysesArray = Array.isArray(analyses) ? analyses : [];
    if (!analysesArray.length) return res.status(404).json({ success: false, error: 'Analysis not found' });

    const analysis = analysesArray[0] as any;
    if (typeof analysis.ai_response_raw === 'string') analysis.ai_response_raw = JSON.parse(analysis.ai_response_raw);

    const [items] = await pool.query(
      `SELECT * FROM ai_recommendation_items WHERE ai_recommendation_id = ?
       ORDER BY display_order ASC`,
      [req.params.analysisId]
    );
    const itemsArray = Array.isArray(items) ? items : [];
    itemsArray.forEach((item: any) => {
      if (typeof item.supporting_data_sources === 'string')
        item.supporting_data_sources = JSON.parse(item.supporting_data_sources);
    });

    res.json({ success: true, data: { ...analysis, items: itemsArray } });
  } catch (err) {
    console.error('GET analysis detail error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/ai-recommendations/clients/:clientId/analyses/:analysisId/items/:itemId — admin review
router.put('/clients/:clientId/analyses/:analysisId/items/:itemId', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { admin_status, admin_notes, converted_to_rec_id } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (admin_status) { updates.push('admin_status = ?'); params.push(admin_status); }
    if (admin_notes !== undefined) { updates.push('admin_notes = ?'); params.push(admin_notes); }
    if (converted_to_rec_id) { updates.push('converted_to_rec_id = ?'); params.push(converted_to_rec_id); }
    if (admin_status && admin_status !== 'new') {
      updates.push('reviewed_at = NOW()');
      updates.push('reviewed_by = ?');
      params.push(req.user?.id);
    }

    if (!updates.length) return res.status(400).json({ success: false, error: 'No updates provided' });

    params.push(req.params.itemId, req.params.analysisId);
    await pool.query(
      `UPDATE ai_recommendation_items SET ${updates.join(', ')} WHERE id = ? AND ai_recommendation_id = ?`,
      params
    );

    res.json({ success: true });
  } catch (err) {
    console.error('PUT item error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/ai-recommendations/clients/:clientId/analyses/:analysisId
router.delete('/clients/:clientId/analyses/:analysisId', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM ai_recommendations WHERE id = ? AND client_id = ?',
      [req.params.analysisId, req.params.clientId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE analysis error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── Routes: Webhooks ────────────────────────────────────────────────────────

// GET /api/ai-recommendations/webhook/:clientId — external AI pulls snapshot
router.get('/webhook/:clientId', authenticateWebhook, async (req: any, res: Response) => {
  try {
    const { clientId } = req.params;
    const { period_type = 'monthly', period_label } = req.query;

    // Try to find existing snapshot for the period
    let sql = 'SELECT * FROM client_data_snapshots WHERE client_id = ? AND period_type = ?';
    const params: any[] = [clientId, period_type];
    if (period_label) { sql += ' AND period_label = ?'; params.push(period_label); }
    sql += ' ORDER BY created_at DESC LIMIT 1';

    const [rows] = await pool.query(sql, params);
    const rowsArray = Array.isArray(rows) ? rows : [];

    if (rowsArray.length) {
      const row = rowsArray[0] as any;
      if (typeof row.snapshot_data === 'string') row.snapshot_data = JSON.parse(row.snapshot_data);
      return res.json({ success: true, data: row.snapshot_data, snapshot_id: row.id, period: { type: row.period_type, label: row.period_label, start: row.period_start, end: row.period_end } });
    }

    // No existing snapshot — compile on-demand
    const now = new Date();
    let label = period_label;
    if (!label) {
      switch (period_type) {
        case 'daily': label = now.toISOString().slice(0, 10); break;
        case 'weekly': {
          const onejan = new Date(now.getFullYear(), 0, 1);
          const wk = Math.ceil(((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay()) / 7);
          label = `${now.getFullYear()}-W${String(wk).padStart(2, '0')}`;
          break;
        }
        case 'monthly': label = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; break;
        case 'yearly': label = String(now.getFullYear()); break;
        default: label = now.toISOString().slice(0, 10);
      }
    }

    const { start, end } = computePeriodBounds(period_type, label);
    const { snapshotData, foundSources, completenessScore } = await compileClientSnapshot(clientId, start, end, period_type, null);

    const id = generateId();
    await pool.query(
      `INSERT INTO client_data_snapshots
       (id, client_id, period_type, period_label, period_start, period_end,
        snapshot_data, data_sources_included, data_completeness_score,
        generation_trigger)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'webhook')`,
      [id, clientId, period_type, label, start, end,
       JSON.stringify(snapshotData), JSON.stringify(foundSources), completenessScore]
    );

    res.json({ success: true, data: snapshotData, snapshot_id: id, period: { type: period_type, label, start, end } });
  } catch (err) {
    console.error('GET webhook error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/ai-recommendations/webhook/:clientId — external AI posts recommendations
router.post('/webhook/:clientId', authenticateWebhook, async (req: any, res: Response) => {
  try {
    const { clientId } = req.params;
    const { snapshot_id, recommendations, executive_summary, overall_health_rating, confidence_score, model_used } = req.body;

    if (!snapshot_id || !recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({ success: false, error: 'snapshot_id and recommendations[] required' });
    }

    // Verify snapshot exists
    const [snaps] = await pool.query(
      'SELECT id FROM client_data_snapshots WHERE id = ? AND client_id = ?',
      [snapshot_id, clientId]
    );
    const snapsArray = Array.isArray(snaps) ? snaps : [];
    if (!snapsArray.length) return res.status(404).json({ success: false, error: 'Snapshot not found' });

    const counts: { [key: string]: number } = { total: recommendations.length, critical: 0, high: 0, medium: 0, low: 0 };
    recommendations.forEach((r: any) => { if (counts[r.priority] !== undefined) counts[r.priority]++; });

    const recId = generateId();
    await pool.query(
      `INSERT INTO ai_recommendations
       (id, client_id, snapshot_id, ai_provider, model_used, analysis_type,
        generation_status, generated_at, ai_response_raw,
        executive_summary, overall_health_rating, confidence_score,
        total_recommendations, critical_count, high_count, medium_count, low_count)
       VALUES (?, ?, ?, 'webhook', ?, 'external', 'completed', NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [recId, clientId, snapshot_id, model_used || 'external',
       JSON.stringify(req.body), executive_summary || null,
       overall_health_rating || null, confidence_score || null,
       counts.total, counts.critical, counts.high, counts.medium, counts.low]
    );

    // Insert items
    for (let i = 0; i < recommendations.length; i++) {
      const r = recommendations[i];
      const itemId = generateId();
      await pool.query(
        `INSERT INTO ai_recommendation_items
         (id, ai_recommendation_id, client_id, category, title, description,
          rationale, expected_impact, suggested_timeline, estimated_effort,
          priority, display_order, supporting_data_sources)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, recId, clientId, r.category || null, r.title || 'Untitled', r.description || '',
         r.rationale || null, r.expected_impact || null, r.suggested_timeline || null,
         r.estimated_effort || null, r.priority || 'medium', i,
         JSON.stringify(r.supporting_data_sources || [])]
      );
    }

    res.json({ success: true, data: { recommendationId: recId, items_stored: recommendations.length } });
  } catch (err) {
    console.error('POST webhook error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
