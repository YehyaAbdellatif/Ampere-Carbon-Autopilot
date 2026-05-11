import React from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const dangerous = doc.querySelectorAll('script, iframe, object, embed, form, link[rel="import"]');
  dangerous.forEach(el => el.remove());
  doc.body.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('on') || attr.value.trim().toLowerCase().startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const cleanedContent = (content || '').replace(/\$([^$]+)\$/g, '`$1`');
  const html = sanitizeHtml(marked.parse(cleanedContent) as string);

  return (
    <div
      className={`markdown-content font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};