import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'OPENROUTER_API_KEY environment variable not set' });
  }

  const { action, payload } = request.body;

  try {
    if (action === 'generate') {
      const { systemInstruction, prompt, model } = payload;
      if (!prompt) {
        return response.status(400).json({ error: 'Payload must contain "prompt"' });
      }

      const messages: { role: string; content: string }[] = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const openRouterRes = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': request.headers.referer || request.headers.origin || 'https://ampere-carbon-autopilot.vercel.app',
          'X-Title': 'Ampere Carbon Audit Autopilot',
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODEL,
          messages,
          stream: true,
        }),
      });

      if (!openRouterRes.ok) {
        const errText = await openRouterRes.text();
        return response.status(openRouterRes.status).json({
          error: `OpenRouter API error: ${openRouterRes.status} - ${errText}`,
        });
      }

      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');

      const reader = (openRouterRes.body as any).getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        response.write(decoder.decode(value, { stream: true }));
      }

      response.end();
      return;
    }

    if (action === 'embed') {
      const { texts } = payload;
      if (!texts || !Array.isArray(texts)) {
        return response.status(400).json({ error: 'Payload must contain "texts" array' });
      }

      // OpenRouter doesn't support embeddings natively — return empty to degrade gracefully
      const embeddings = texts.map(() => null);
      return response.status(200).json({ embeddings });
    }

    return response.status(400).json({ error: 'Invalid action. Supported: "generate", "embed"' });

  } catch (error: any) {
    console.error(`Error in action '${action}':`, error);
    return response.status(500).json({ error: error.message || 'An unexpected error occurred.' });
  }
}
