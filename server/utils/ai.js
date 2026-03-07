import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-6';

// ─── Claude Client ───────────────────────────────────────────────
const claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function claudeGenerateContent(prompt, systemInstruction = '', model = CLAUDE_MODEL) {
  const response = await claudeClient.messages.create({
    model,
    max_tokens: 4096,
    system: systemInstruction || undefined,
    messages: [
      { role: 'user', content: prompt },
    ],
  });

  return response.content[0]?.type === 'text' ? response.content[0].text : '';
}

async function claudeGenerateChat(messages, systemInstruction = '', model = CLAUDE_MODEL) {
  // Convert messages from Gemini format to Claude format
  const claudeMessages = messages.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : msg.role,
    content: msg.text,
  }));

  const response = await claudeClient.messages.create({
    model,
    max_tokens: 4096,
    system: systemInstruction || undefined,
    messages: claudeMessages,
  });

  return response.content[0]?.type === 'text' ? response.content[0].text : '';
}

async function claudeGenerateJSON(prompt, systemInstruction, model = CLAUDE_MODEL) {
  const jsonInstruction = `${systemInstruction}\n\nYou must respond with ONLY valid JSON, no markdown formatting, no extra text.`;

  const response = await claudeClient.messages.create({
    model,
    max_tokens: 4096,
    system: jsonInstruction,
    messages: [
      { role: 'user', content: prompt },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

  // Try to extract JSON (Claude usually responds cleanly but handle edge cases)
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting JSON if wrapped in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Claude returned invalid JSON: ${text.slice(0, 100)}`);
  }
}

// ─── Ollama Client ───────────────────────────────────────────────
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

async function ollamaGenerateContent(prompt, systemInstruction = '', model = OLLAMA_MODEL) {
  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\nUser: ${prompt}`
    : prompt;

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model,
      prompt: fullPrompt,
      stream: false,
    }, { timeout: 120000 });

    return response.data.response || '';
  } catch (err) {
    console.error('[Ollama] generateContent error:', err.message);
    throw new Error(`Ollama generation failed: ${err.message}`);
  }
}

async function ollamaGenerateChat(messages, systemInstruction = '', model = OLLAMA_MODEL) {
  // Convert messages to Ollama chat format
  const chatMessages = messages.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : msg.role,
    content: msg.text,
  }));

  if (systemInstruction) {
    chatMessages.unshift({
      role: 'system',
      content: systemInstruction,
    });
  }

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
      model,
      messages: chatMessages,
      stream: false,
    }, { timeout: 120000 });

    return response.data.message?.content || '';
  } catch (err) {
    console.error('[Ollama] generateChat error:', err.message);
    throw new Error(`Ollama chat failed: ${err.message}`);
  }
}

async function ollamaGenerateJSON(prompt, systemInstruction, model = OLLAMA_MODEL) {
  // Request JSON output by instructing the model
  const jsonInstruction = `${systemInstruction}\n\nIMPORTANT: Respond ONLY with valid JSON, no other text.`;
  const fullPrompt = `${jsonInstruction}\n\nRequest: ${prompt}`;

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model,
      prompt: fullPrompt,
      stream: false,
    }, { timeout: 120000 });

    const text = response.data.response || '';
    // Try to extract JSON from response (may include markdown formatting)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (err) {
    console.error('[Ollama] generateJSON error:', err.message);
    throw new Error(`Ollama JSON generation failed: ${err.message}`);
  }
}

// ─── Gemini Client ───────────────────────────────────────────────
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function geminiGenerateContent(prompt, systemInstruction = '', model = 'gemini-2.5-flash') {
  const config = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const response = await geminiClient.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  return response.text;
}

async function geminiGenerateChat(messages, systemInstruction = '', model = 'gemini-2.5-flash') {
  const contents = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const config = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const response = await geminiClient.models.generateContent({
    model,
    contents,
    config,
  });

  return response.text;
}

async function geminiGenerateJSON(prompt, systemInstruction, model = 'gemini-2.5-flash') {
  const response = await geminiClient.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction,
    },
  });

  return JSON.parse(response.text);
}

// ─── Export Interface ───────────────────────────────────────────────
// Routes import these functions and don't need to know which provider is used

export async function generateContent(prompt, systemInstruction = '', model) {
  if (AI_PROVIDER === 'claude') {
    return claudeGenerateContent(prompt, systemInstruction, model);
  }
  if (AI_PROVIDER === 'ollama') {
    return ollamaGenerateContent(prompt, systemInstruction, model);
  }
  return geminiGenerateContent(prompt, systemInstruction, model);
}

export async function generateChat(messages, systemInstruction = '', model) {
  if (AI_PROVIDER === 'claude') {
    return claudeGenerateChat(messages, systemInstruction, model);
  }
  if (AI_PROVIDER === 'ollama') {
    return ollamaGenerateChat(messages, systemInstruction, model);
  }
  return geminiGenerateChat(messages, systemInstruction, model);
}

export async function generateJSON(prompt, systemInstruction, model) {
  if (AI_PROVIDER === 'claude') {
    return claudeGenerateJSON(prompt, systemInstruction, model);
  }
  if (AI_PROVIDER === 'ollama') {
    return ollamaGenerateJSON(prompt, systemInstruction, model);
  }
  return geminiGenerateJSON(prompt, systemInstruction, model);
}

export default {
  generateContent,
  generateChat,
  generateJSON,
};
