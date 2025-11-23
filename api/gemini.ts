import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const EMBEDDING_MODEL = 'text-embedding-004';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.API_KEY) {
    return response.status(500).json({ error: 'API_KEY environment variable not set' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { action, payload } = request.body;

  try {
    if (action === 'embed') {
        const { texts } = payload;
        if (!texts || !Array.isArray(texts)) {
            return response.status(400).json({ error: 'Payload must contain "texts" array' });
        }

        const embeddings = await Promise.all(texts.map(async (text: string) => {
            const result = await ai.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: { parts: [{ text }] }
            });
            return result.embeddings?.[0]?.values;
        }));

        return response.status(200).json({ embeddings });
    }

    return response.status(400).json({ error: 'Invalid action. This endpoint only supports embeddings.' });

  } catch (error: any) {
    console.error(`Error in action '${action}':`, error);
    return response.status(500).json({ error: error.message || 'An unexpected error occurred.' });
  }
}
