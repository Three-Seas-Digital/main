/**
 * Gemini-only text/JSON helpers. Used by routes/ai.js and routes/aiRecommendations.js.
 * NOTE: these two routes read GEMINI_API_KEY directly and do NOT honor AI_PROVIDER
 * — the provider switch (Claude/Ollama) lives in utils/ai.js, used by calendarAgent.js.
 *
 * ── HOW TO RE-ENABLE AI (disabled since the Oct 2026 key rotation) ──────────────
 * Set GEMINI_API_KEY in the environment (Railway → `main` service → Variables) and
 * redeploy. No code change needed. (This re-enables AI Advisor / SWOT / recommendations.)
 *
 * ── WHY THE CLIENT IS LAZY (fix in commit 25d1806) ─────────────────────────────
 * new GoogleGenAI(...) THROWS when GEMINI_API_KEY is absent. It used to run at import
 * time, crash-looping the server on boot. It is now constructed on first use in
 * getClient(), which throws a clear error only when an endpoint is actually called.
 */
import { GoogleGenAI } from '@google/genai';

// Lazily initialize the Gemini client. Constructing it at import time throws
// when GEMINI_API_KEY is absent, which would crash the whole server on boot.
// Deferring construction keeps the API up; AI calls fail only when invoked
// without a configured key.
let _ai = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set — Gemini AI features are disabled.');
  }
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

/**
 * Generate text content using Gemini
 * @param {string} prompt - The user prompt
 * @param {string} systemInstruction - Optional system instruction
 * @param {string} model - Model name (default: gemini-2.5-flash)
 * @returns {Promise<string>} Generated text
 */
export async function generateContent(prompt, systemInstruction = '', model = 'gemini-2.5-flash') {
  const config = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const response = await getClient().models.generateContent({
    model,
    contents: prompt,
    config,
  });

  return response.text;
}

/**
 * Generate content with chat history (multi-turn)
 * @param {Array} messages - Array of { role: 'user'|'model', text: string }
 * @param {string} systemInstruction - Optional system instruction
 * @param {string} model - Model name
 * @returns {Promise<string>} Generated text
 */
export async function generateChat(messages, systemInstruction = '', model = 'gemini-2.5-flash') {
  const contents = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const config = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const response = await getClient().models.generateContent({
    model,
    contents,
    config,
  });

  return response.text;
}

/**
 * Generate structured JSON output from Gemini
 * @param {string} prompt - The prompt
 * @param {string} systemInstruction - System instruction that asks for JSON
 * @param {string} model - Model name
 * @returns {Promise<object>} Parsed JSON response
 */
export async function generateJSON(prompt, systemInstruction, model = 'gemini-2.5-flash') {
  const response = await getClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction,
    },
  });

  return JSON.parse(response.text);
}

export default { generateContent, generateChat, generateJSON };
