import { ProjectDocument, LibraryDocument } from '../types';

const CHAR_LIMIT_PER_DOC = 40000;
const CHAR_LIMIT_TOTAL_PROMPT = 180000;

/**
 * Lossless text cleanup — removes noise from PDF/DOCX extraction
 * without losing meaningful content.
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/(\b(?:Page|page)\s*\d+\s*(?:of\s*\d+)?)/g, '')
    .replace(/(^|\n)\s*[-–—]{3,}\s*(\n|$)/g, '\n')
    .replace(/\f/g, '\n')
    .trim();
}

/**
 * Summarize a document via the API when it exceeds the char limit.
 * Falls back to truncation if the API call fails.
 */
async function summarizeDocument(name: string, content: string): Promise<string> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        payload: {
          systemInstruction: 'You are a precise document summarizer for carbon audit work. Preserve all technical details, numbers, dates, requirements, and findings. Do not omit any substantive information.',
          prompt: `Summarize the following document in detail, preserving ALL key information including specific requirements, numerical values, methodologies, findings, and technical details. The summary should be comprehensive enough that an auditor can work from it without needing the original.\n\n--- Document: ${name} ---\n${content.substring(0, 120000)}`,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Summarization failed for "${name}", falling back to truncation`);
      return content.substring(0, CHAR_LIMIT_PER_DOC) + '\n\n[... document truncated ...]';
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No stream');

    const decoder = new TextDecoder();
    let summary = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
          if (text) summary += text;
        } catch { /* partial line */ }
      }
    }

    return summary || content.substring(0, CHAR_LIMIT_PER_DOC);
  } catch (e) {
    console.error(`Summarization error for "${name}":`, e);
    return content.substring(0, CHAR_LIMIT_PER_DOC) + '\n\n[... document truncated ...]';
  }
}

/**
 * Compress a single document: clean first, summarize if still too large.
 */
async function compressContent(name: string, content: string): Promise<string> {
  const cleaned = cleanText(content);
  if (cleaned.length <= CHAR_LIMIT_PER_DOC) return cleaned;

  console.log(`Document "${name}" is ${cleaned.length} chars (limit ${CHAR_LIMIT_PER_DOC}), summarizing...`);
  return summarizeDocument(name, cleaned);
}

export const compressionService = {
  async compressDocuments(docs: ProjectDocument[]): Promise<ProjectDocument[]> {
    const results = await Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        content: await compressContent(doc.name, doc.content),
      }))
    );
    return results;
  },

  async compressLibraryDocs(docs: LibraryDocument[]): Promise<LibraryDocument[]> {
    const results = await Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        content: await compressContent(doc.name, doc.content),
      }))
    );
    return results;
  },

  cleanRequirements(text: string): string {
    const cleaned = cleanText(text);
    if (cleaned.length <= 60000) return cleaned;
    return cleaned.substring(0, 60000) + '\n\n[... requirements truncated for length ...]';
  },

  CHAR_LIMIT_TOTAL_PROMPT,
};
