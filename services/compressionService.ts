import { ProjectDocument, LibraryDocument } from '../types';

const CHAR_LIMIT_PER_DOC = 20000;
const CHAR_LIMIT_REQUIREMENTS = 30000;
const CHAR_LIMIT_SUMMARIZE_INPUT = 60000;
const MAX_FINAL_PROMPT_CHARS = 500000;

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

async function summarizeDocument(name: string, content: string): Promise<string> {
  try {
    const input = content.substring(0, CHAR_LIMIT_SUMMARIZE_INPUT);
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        payload: {
          systemInstruction: 'You are a precise document summarizer for carbon audit work. Preserve all technical details, numbers, dates, requirements, and findings. Do not omit any substantive information. Keep your summary under 5000 words.',
          prompt: `Summarize the following document in detail, preserving ALL key information including specific requirements, numerical values, methodologies, findings, and technical details. The summary should be comprehensive enough that an auditor can work from it without needing the original.\n\n--- Document: ${name} ---\n${input}`,
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

    if (summary && summary.length > 100) {
      console.log(`Summarized "${name}": ${content.length} → ${summary.length} chars`);
      return summary;
    }
    return content.substring(0, CHAR_LIMIT_PER_DOC) + '\n\n[... document truncated ...]';
  } catch (e) {
    console.error(`Summarization error for "${name}":`, e);
    return content.substring(0, CHAR_LIMIT_PER_DOC) + '\n\n[... document truncated ...]';
  }
}

async function compressContent(name: string, content: string): Promise<string> {
  const cleaned = cleanText(content);
  if (cleaned.length <= CHAR_LIMIT_PER_DOC) return cleaned;

  console.log(`Document "${name}" is ${cleaned.length} chars (limit ${CHAR_LIMIT_PER_DOC}), summarizing...`);
  return summarizeDocument(name, cleaned);
}

export const compressionService = {
  async compressDocuments(docs: ProjectDocument[]): Promise<ProjectDocument[]> {
    return Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        content: await compressContent(doc.name, doc.content),
      }))
    );
  },

  async compressLibraryDocs(docs: LibraryDocument[]): Promise<LibraryDocument[]> {
    return Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        content: await compressContent(doc.name, doc.content),
      }))
    );
  },

  cleanRequirements(text: string): string {
    const cleaned = cleanText(text);
    if (cleaned.length <= CHAR_LIMIT_REQUIREMENTS) return cleaned;
    return cleaned.substring(0, CHAR_LIMIT_REQUIREMENTS) + '\n\n[... requirements truncated for length ...]';
  },

  enforcePromptLimit(prompt: string): string {
    if (prompt.length <= MAX_FINAL_PROMPT_CHARS) return prompt;
    console.warn(`Final prompt is ${prompt.length} chars (limit ${MAX_FINAL_PROMPT_CHARS}), truncating`);
    return prompt.substring(0, MAX_FINAL_PROMPT_CHARS) + '\n\n[... prompt truncated to fit model context window ...]';
  },
};
