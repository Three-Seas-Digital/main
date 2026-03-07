import api from './client';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Generate text from a prompt
 */
export async function aiGenerate(prompt: string, systemInstruction?: string, model?: string) {
  const { data } = await api.post('/ai/generate', { prompt, systemInstruction, model });
  return data;
}

/**
 * Multi-turn chat with Gemini
 */
export async function aiChat(messages: ChatMessage[], systemInstruction?: string, model?: string) {
  const { data } = await api.post('/ai/chat', { messages, systemInstruction, model });
  return data;
}

/**
 * Analyze client data with AI
 */
export async function aiAnalyzeClient(clientData: Record<string, unknown>, analysisType?: string) {
  const { data } = await api.post('/ai/analyze-client', { clientData, analysisType });
  return data;
}

/**
 * Generate a proposal for a client
 */
export async function aiGenerateProposal(params: Record<string, unknown>) {
  const { data } = await api.post('/ai/generate-proposal', params);
  return data;
}

/**
 * Get AI-powered audit suggestions
 */
export async function aiAuditSuggestions(auditData: Record<string, unknown>, category?: string) {
  const { data } = await api.post('/ai/audit-suggestions', { auditData, category });
  return data;
}

/**
 * Generate AI recommendations for a client via xAI
 */
export async function aiRecommend(clientId: string) {
  const { data } = await api.post(`/ai/recommend/${clientId}`);
  return data;
}

/**
 * Generate AI SWOT analysis for a client via xAI
 */
export async function aiGenerateSWOT(clientId: string) {
  const { data } = await api.post(`/ai/swot/${clientId}`);
  return data;
}

/**
 * Get latest SWOT analysis for a client
 */
export async function aiGetSWOT(clientId: string) {
  const { data } = await api.get(`/ai/swot/${clientId}`);
  return data;
}

/**
 * Get SWOT analysis history for a client
 */
export async function aiGetSWOTHistory(clientId: string) {
  const { data } = await api.get(`/ai/swot/${clientId}/history`);
  return data;
}
