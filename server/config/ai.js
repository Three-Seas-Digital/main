export const aiConfig = {
  provider: process.env.AI_PROVIDER || 'xai', // 'xai' | 'gemini'
  apiKey: process.env.XAI_API_KEY,
  model: process.env.XAI_MODEL || 'grok-3',
  baseUrl: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
  maxTokens: parseInt(process.env.XAI_MAX_TOKENS || '4096'),
};
