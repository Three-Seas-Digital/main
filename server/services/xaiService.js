import { aiConfig } from '../config/ai.js';

export async function callXAI(systemPrompt, userMessage) {
  if (!aiConfig.apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const res = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: aiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: aiConfig.maxTokens,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`xAI API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

export async function callXAIJSON(systemPrompt, userMessage) {
  const raw = await callXAI(
    systemPrompt + '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown fences, no extra text.',
    userMessage
  );

  // Extract JSON from response (handle markdown fences if present)
  let jsonStr = raw.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr);
}
