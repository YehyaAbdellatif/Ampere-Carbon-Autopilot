import { describe, it, expect, vi } from 'vitest';
import { readFileContent } from './fileReaderService';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

vi.mock('pdfjs-dist/build/pdf.mjs', () => {
  return {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
    getDocument: vi.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Hello' }, { str: 'World' }],
          }),
        }),
      }),
    }),
  };
});

describe('readFileContent', () => {
  it('should correctly extract text from a PDF, preserving spaces', async () => {
    const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const text = await readFileContent(mockFile);
    expect(text).toBe('Hello World\n');
  });
});