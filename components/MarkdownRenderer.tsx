import React from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Pre-process content to handle stray LaTeX delimiters that might break rendering.
  // Replaces $equation$ with `equation` to ensure it renders as code instead of broken text.
  const cleanedContent = (content || '').replace(/\$([^$]+)\$/g, '`$1`');

  // Parse the markdown content to HTML
  const html = marked.parse(cleanedContent) as string;

  return (
    <div 
      className={`markdown-content font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};