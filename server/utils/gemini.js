import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

  const response = await ai.models.generateContent({
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

  const response = await ai.models.generateContent({
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
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction,
    },
  });

  return JSON.parse(response.text);
}

export default ai;
