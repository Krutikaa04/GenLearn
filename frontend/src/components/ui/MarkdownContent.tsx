import { useMemo } from 'react';
import { marked } from 'marked';

marked.setOptions({ breaks: true });

interface Props {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: Props) {
  const html = useMemo(() => marked.parse(content) as string, [content]);

  return (
    <div
      className={`md ${className}`}
      // Content comes from our own AI service — not user-supplied HTML
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
