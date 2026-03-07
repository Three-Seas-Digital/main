import { Router, Response } from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateContent, generateChat, generateJSON } from '../utils/ai.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// ─── POST /api/ai/generate ──────────────────────────────────────────
// Simple text generation
router.post('/generate', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const { prompt, systemInstruction, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const text = await generateContent(prompt, systemInstruction, model);
    res.json({ text });
  } catch (err: any) {
    console.error('[ai/generate] Error:', err.message);
    res.status(500).json({ error: 'AI generation failed', details: err.message });
  }
});

// ─── POST /api/ai/chat ─────────────────────────────────────────────
// Multi-turn chat
router.post('/chat', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const { messages, systemInstruction, model } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const text = await generateChat(messages, systemInstruction, model);
    res.json({ text });
  } catch (err: any) {
    console.error('[ai/chat] Error:', err.message);
    res.status(500).json({ error: 'AI chat failed', details: err.message });
  }
});

// ─── POST /api/ai/analyze-client ───────────────────────────────────
// Analyze client data and generate recommendations
router.post('/analyze-client', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const { clientData, analysisType } = req.body;

    if (!clientData) {
      return res.status(400).json({ error: 'Client data is required' });
    }

    const systemInstruction = `You are a digital marketing strategist for Three Seas Digital, a digital marketing agency.
Analyze the provided client data and give actionable insights.
Analysis type: ${analysisType || 'general'}
Respond in JSON format with: { "summary": "...", "strengths": [...], "weaknesses": [...], "recommendations": [...], "priorityActions": [...] }`;

    const result = await generateJSON(
      `Analyze this client data:\n${JSON.stringify(clientData, null, 2)}`,
      systemInstruction
    );

    res.json(result);
  } catch (err: any) {
    console.error('[ai/analyze-client] Error:', err.message);
    res.status(500).json({ error: 'Client analysis failed', details: err.message });
  }
});

// ─── POST /api/ai/generate-proposal ────────────────────────────────
// Generate a proposal or strategy document
router.post('/generate-proposal', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req: any, res: Response) => {
  try {
    const { clientName, industry, services, budget, goals } = req.body;

    if (!clientName || !industry) {
      return res.status(400).json({ error: 'Client name and industry are required' });
    }

    const prompt = `Generate a digital marketing proposal for:
Client: ${clientName}
Industry: ${industry}
Services requested: ${services || 'Full digital marketing'}
Budget range: ${budget || 'Not specified'}
Goals: ${goals || 'Increase online visibility and leads'}

Include: executive summary, recommended strategy, timeline, KPIs, and expected outcomes.`;

    const systemInstruction = `You are a senior digital marketing strategist at Three Seas Digital.
Write professional, detailed proposals that are specific to the client's industry.
Use data-driven language and include specific, measurable KPIs.`;

    const text = await generateContent(prompt, systemInstruction);
    res.json({ proposal: text });
  } catch (err: any) {
    console.error('[ai/generate-proposal] Error:', err.message);
    res.status(500).json({ error: 'Proposal generation failed', details: err.message });
  }
});

// ─── POST /api/ai/audit-suggestions ────────────────────────────────
// Generate audit suggestions based on website/business data
router.post('/audit-suggestions', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const { auditData, category } = req.body;

    if (!auditData) {
      return res.status(400).json({ error: 'Audit data is required' });
    }

    const systemInstruction = `You are a digital marketing audit specialist at Three Seas Digital.
Based on the audit data provided, generate specific, actionable recommendations.
Category focus: ${category || 'all'}
Respond in JSON format with: { "findings": [...], "recommendations": [...], "quickWins": [...], "longTermActions": [...], "estimatedImpact": "..." }`;

    const result = await generateJSON(
      `Review this audit data and provide recommendations:\n${JSON.stringify(auditData, null, 2)}`,
      systemInstruction
    );

    res.json(result);
  } catch (err: any) {
    console.error('[ai/audit-suggestions] Error:', err.message);
    res.status(500).json({ error: 'Audit suggestions failed', details: err.message });
  }
});

// ─── POST /api/ai/recommend/:clientId ─────────────────────────────
// Generate AI recommendations via xAI
router.post('/recommend/:clientId', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const { generateRecommendations } = await import('../services/aiRecommendationEngine.js');
    const result = await generateRecommendations(req.params.clientId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[ai/recommend] Error:', err.message);
    res.status(500).json({ error: 'Recommendation generation failed', details: err.message });
  }
});

// ─── POST /api/ai/swot/:clientId ─────────────────────────────────
// Generate AI SWOT analysis via xAI
router.post('/swot/:clientId', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req: any, res: Response) => {
  try {
    const { generateSWOT } = await import('../services/aiRecommendationEngine.js');
    const result = await generateSWOT(req.params.clientId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[ai/swot] Error:', err.message);
    res.status(500).json({ error: 'SWOT generation failed', details: err.message });
  }
});

// ─── GET /api/ai/swot/:clientId ──────────────────────────────────
// Get latest SWOT analysis for a client
router.get('/swot/:clientId', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM swot_analyses WHERE client_id = ? ORDER BY generated_at DESC LIMIT 1',
      [req.params.clientId]
    );
    const rowsArray = Array.isArray(rows) ? rows : [];
    if (rowsArray.length === 0) return res.json({ success: true, data: null });

    const swot = rowsArray[0] as any;
    // Parse JSON strings if needed
    for (const key of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
      if (typeof swot[key] === 'string') swot[key] = JSON.parse(swot[key]);
    }

    res.json({ success: true, data: swot });
  } catch (err: any) {
    console.error('[ai/swot] GET Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch SWOT', details: err.message });
  }
});

// ─── GET /api/ai/swot/:clientId/history ──────────────────────────
// Get all SWOT analyses for a client
router.get('/swot/:clientId/history', authenticateToken, async (req: any, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, client_id, ai_generated, generated_at, updated_at FROM swot_analyses WHERE client_id = ? ORDER BY generated_at DESC LIMIT 20',
      [req.params.clientId]
    );
    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[ai/swot/history] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch SWOT history' });
  }
});

export default router;
