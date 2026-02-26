import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderMarkdown } from './renderMarkdown';

describe('renderMarkdown', () => {
  it('renders plain text as a paragraph', () => {
    const { container } = render(<>{renderMarkdown('Hello world')}</>);
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    expect(p!.textContent).toBe('Hello world');
  });

  it('renders a single bullet list item', () => {
    const { container } = render(<>{renderMarkdown('- Item one')}</>);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('Item one');
  });

  it('renders multiple bullet list items in one ul', () => {
    const { container } = render(<>{renderMarkdown('- Item one\n- Item two\n- Item three')}</>);
    const lists = container.querySelectorAll('ul');
    expect(lists).toHaveLength(1);
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });

  it('renders bold text with **', () => {
    const { container } = render(<>{renderMarkdown('Take **daily** medication')}</>);
    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe('daily');
  });

  it('renders mixed paragraph then list', () => {
    const text = 'Symptoms include:\n- Fever\n- Rash\n- Fatigue';
    const { container } = render(<>{renderMarkdown(text)}</>);
    expect(container.querySelector('p')!.textContent).toBe('Symptoms include:');
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });

  it('renders multiple paragraphs separated by blank lines', () => {
    const text = 'First paragraph.\n\nSecond paragraph.';
    const { container } = render(<>{renderMarkdown(text)}</>);
    const paras = container.querySelectorAll('p');
    expect(paras).toHaveLength(2);
    expect(paras[0].textContent).toBe('First paragraph.');
    expect(paras[1].textContent).toBe('Second paragraph.');
  });

  it('handles empty string without throwing', () => {
    expect(() => render(<>{renderMarkdown('')}</>)).not.toThrow();
  });

  it('list followed by a paragraph', () => {
    const text = '- Point one\n- Point two\n\nNote below.';
    const { container } = render(<>{renderMarkdown(text)}</>);
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelector('p')!.textContent).toBe('Note below.');
  });
});
