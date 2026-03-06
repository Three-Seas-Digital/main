import { callXAIJSON } from './xaiService.js';
import { generateId } from '../utils/generateId.js';
import pool from '../config/db.js';

const RECOMMEND_SYSTEM_PROMPT = `You are a senior business advisor for a digital marketing agency. Analyze the provided client data and generate actionable recommendations.

Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "type": "general" | "upsell" | "retention" | "strategy",
      "title": "<short actionable title>",
      "body": "<detailed explanation and action steps>",
      "confidence_score": <number 0.0 to 1.0>
    }
  ]
}

Guidelines:
- Generate 3-8 recommendations based on available data.
- Each recommendation should be specific and actionable.
- confidence_score reflects how much data supports the recommendation (0.0 = speculative, 1.0 = strongly supported).
- "upsell" = opportunities to expand services for the client.
- "retention" = actions to prevent churn or improve satisfaction.
- "strategy" = long-term strategic advice.
- "general" = other actionable advice.
- Base every recommendation on actual data provided. Do not invent data.`;

const SWOT_SYSTEM_PROMPT = `You are a business strategist. Analyze the provided client data and produce a comprehensive SWOT analysis.

Return a JSON object with this exact structure:
{
  "strengths": [{"title": "...", "description": "..."}],
  "weaknesses": [{"title": "...", "description": "..."}],
  "opportunities": [{"title": "...", "description": "..."}],
  "threats": [{"title": "...", "description": "..."}]
}

Guidelines:
- Generate 3-6 items per quadrant based on available data.
- Strengths/Weaknesses = internal factors. Opportunities/Threats = external factors.
- Be specific to the client's industry, performance data, and financial situation.
- Base every item on actual data provided.`;

async function gatherClientData(clientId) {
  const results = await Promise.allSettled([
    pool.query('SELECT id, name, email, service, tier, status, business_name, created_at FROM clients WHERE id = ?', [clientId]),
    pool.query('SELECT id, title, amount, status, due_date, paid_at FROM invoices WHERE client_id = ? ORDER BY created_at DESC LIMIT 20', [clientId]),
    pool.query('SELECT id, amount, method, status, created_at FROM payments WHERE client_id = ? ORDER BY created_at DESC LIMIT 20', [clientId]),
    pool.query('SELECT id, title, status, progress FROM projects WHERE client_id = ? ORDER BY created_at DESC LIMIT 10', [clientId]),
    pool.query('SELECT id, overall_score, audit_date, status FROM business_audits WHERE client_id = ? ORDER BY version DESC LIMIT 5', [clientId]),
    pool.query('SELECT id, title, intervention_type, status, cost_to_client, overall_roi, effectiveness_rating FROM interventions WHERE client_id = ? ORDER BY created_at DESC LIMIT 10', [clientId]),
    pool.query('SELECT * FROM growth_targets WHERE client_id = ?', [clientId]),
    pool.query('SELECT * FROM client_financials WHERE client_id = ? ORDER BY period_year DESC, period_month DESC LIMIT 12', [clientId]),
    pool.query('SELECT * FROM revenue_entries WHERE client_id = ? ORDER BY recorded_at DESC LIMIT 20', [clientId]),
    pool.query('SELECT strengths, weaknesses, opportunities, threats FROM swot_analyses WHERE client_id = ? ORDER BY generated_at DESC LIMIT 1', [clientId]),
  ]);

  const extract = (r) => r.status === 'fulfilled' ? r.value[0] : [];

  return {
    client: extract(results[0])[0] || null,
    invoices: extract(results[1]),
    payments: extract(results[2]),
    projects: extract(results[3]),
    audits: extract(results[4]),
    interventions: extract(results[5]),
    growthTargets: extract(results[6]),
    financials: extract(results[7]),
    revenueEntries: extract(results[8]),
    latestSwot: extract(results[9])[0] || null,
  };
}

export async function generateRecommendations(clientId) {
  const data = await gatherClientData(clientId);
  if (!data.client) throw new Error('Client not found');

  const userMessage = `Analyze this client data and provide recommendations:\n\n${JSON.stringify(data, null, 2)}`;
  const result = await callXAIJSON(RECOMMEND_SYSTEM_PROMPT, userMessage);

  const recommendations = result.recommendations || [];

  // Store in DB
  for (const rec of recommendations) {
    const id = generateId();
    await pool.query(
      `INSERT INTO ai_recommendations
       (id, client_id, snapshot_id, ai_provider, analysis_type, generation_status,
        executive_summary, confidence_score, total_recommendations, generated_at)
       VALUES (?, ?, NULL, 'xai', 'recommendation', 'completed', ?, ?, 1, NOW())`,
      [id, clientId, rec.title, rec.confidence_score || null]
    );

    // Also store as an ai_recommendation_item
    const itemId = generateId();
    await pool.query(
      `INSERT INTO ai_recommendation_items
       (id, ai_recommendation_id, client_id, category, title, description, priority, display_order)
       VALUES (?, ?, ?, ?, ?, ?, 'medium', 0)`,
      [itemId, id, clientId, rec.type || 'general', rec.title, rec.body || '']
    );
  }

  return { clientId, recommendations };
}

export async function generateSWOT(clientId) {
  const data = await gatherClientData(clientId);
  if (!data.client) throw new Error('Client not found');

  const userMessage = `Analyze this client data and produce a SWOT analysis:\n\n${JSON.stringify(data, null, 2)}`;
  const result = await callXAIJSON(SWOT_SYSTEM_PROMPT, userMessage);

  // Store in swot_analyses
  const id = generateId();
  await pool.query(
    `INSERT INTO swot_analyses (id, client_id, strengths, weaknesses, opportunities, threats, ai_generated, generated_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
    [id, clientId,
     JSON.stringify(result.strengths || []),
     JSON.stringify(result.weaknesses || []),
     JSON.stringify(result.opportunities || []),
     JSON.stringify(result.threats || [])]
  );

  return {
    id,
    clientId,
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    opportunities: result.opportunities || [],
    threats: result.threats || [],
    generated_at: new Date().toISOString(),
  };
}
