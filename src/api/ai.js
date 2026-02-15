import api from './client.js';

/**
 * AI API - Google Gemini integration
 * All endpoints require authentication
 */

/**
 * Generate text from a prompt
 * @param {string} prompt - The prompt to send
 * @param {string} [systemInstruction] - Optional system instruction
 * @param {string} [model] - Model name (default: gemini-2.5-flash)
 */
export async function aiGenerate(prompt, systemInstruction, model) {
  const { data } = await api.post('/ai/generate', { prompt, systemInstruction, model });
  return data;
}

/**
 * Multi-turn chat with Gemini
 * @param {Array<{role: 'user'|'model', text: string}>} messages - Chat history
 * @param {string} [systemInstruction] - Optional system instruction
 * @param {string} [model] - Model name
 */
export async function aiChat(messages, systemInstruction, model) {
  const { data } = await api.post('/ai/chat', { messages, systemInstruction, model });
  return data;
}

/**
 * Analyze client data with AI
 * @param {object} clientData - Client data to analyze
 * @param {string} [analysisType] - Type of analysis (general, seo, social, ppc, etc.)
 */
export async function aiAnalyzeClient(clientData, analysisType) {
  const { data } = await api.post('/ai/analyze-client', { clientData, analysisType });
  return data;
}

/**
 * Generate a proposal for a client
 * @param {object} params - { clientName, industry, services, budget, goals }
 */
export async function aiGenerateProposal(params) {
  const { data } = await api.post('/ai/generate-proposal', params);
  return data;
}

/**
 * Get AI-powered audit suggestions
 * @param {object} auditData - Audit data to analyze
 * @param {string} [category] - Category focus
 */
export async function aiAuditSuggestions(auditData, category) {
  const { data } = await api.post('/ai/audit-suggestions', { auditData, category });
  return data;
}
