import React from 'react';

/**
 * Converts a markdown-style string to React elements.
 * Supported:
 *   Lines starting with "- " → <ul><li> (consecutive lines grouped into one <ul>)
 *   **text** → <strong>
 *   Plain text lines → <p>
 *   Blank lines → flush pending list, act as paragraph separator
 */
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let keyIdx = 0;

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={keyIdx++}>
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      flushList();
    } else if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      elements.push(<p key={keyIdx++}>{renderInline(trimmed)}</p>);
    }
  }
  flushList();

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}
