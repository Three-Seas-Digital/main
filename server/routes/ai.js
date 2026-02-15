import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateContent, generateChat, generateJSON } from '../utils/gemini.js';

const router = Router();

// ─── POST /api/ai/generate ──────────────────────────────────────────
// Simple text generation
router.post('/generate', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req, res) => {
  try {
    const { prompt, systemInstruction, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const text = await generateContent(prompt, systemInstruction, model);
    res.json({ text });
  } catch (err) {
    console.error('[ai/generate] Error:', err.message);
    res.status(500).json({ error: 'AI generation failed', details: err.message });
  }
});

// ─── POST /api/ai/chat ─────────────────────────────────────────────
// Multi-turn chat
router.post('/chat', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req, res) => {
  try {
    const { messages, systemInstruction, model } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const text = await generateChat(messages, systemInstruction, model);
    res.json({ text });
  } catch (err) {
    console.error('[ai/chat] Error:', err.message);
    res.status(500).json({ error: 'AI chat failed', details: err.message });
  }
});

// ─── POST /api/ai/analyze-client ───────────────────────────────────
// Analyze client data and generate recommendations
router.post('/analyze-client', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req, res) => {
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
  } catch (err) {
    console.error('[ai/analyze-client] Error:', err.message);
    res.status(500).json({ error: 'Client analysis failed', details: err.message });
  }
});

// ─── POST /api/ai/generate-proposal ────────────────────────────────
// Generate a proposal or strategy document
router.post('/generate-proposal', authenticateToken, requireRole('owner', 'admin', 'manager'), async (req, res) => {
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
  } catch (err) {
    console.error('[ai/generate-proposal] Error:', err.message);
    res.status(500).json({ error: 'Proposal generation failed', details: err.message });
  }
});

// ─── POST /api/ai/audit-suggestions ────────────────────────────────
// Generate audit suggestions based on website/business data
router.post('/audit-suggestions', authenticateToken, requireRole('owner', 'admin', 'manager', 'it', 'analyst'), async (req, res) => {
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
  } catch (err) {
    console.error('[ai/audit-suggestions] Error:', err.message);
    res.status(500).json({ error: 'Audit suggestions failed', details: err.message });
  }
});

export default router;
