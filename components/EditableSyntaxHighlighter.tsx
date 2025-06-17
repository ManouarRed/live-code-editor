
import React, { useEffect, useRef, useCallback } from 'react';
import type { EditableSyntaxHighlighterProps } from '../types';

// Helper to escape HTML for safe rendering
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const highlightHtml = (code: string): string => {
  let html = code;
  // Comments
  html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token-comment">$1</span>');
  // Tags (simplified)
  html = html.replace(/(&lt;\/?)([a-zA-Z0-9_:-]+)/g, '$1<span class="token-tag">$2</span>');
  // Attributes names
  html = html.replace(/(\s+)([a-zA-Z0-9_:-]+)(\s*=\s*&quot;)/g, '$1<span class="token-attr-name">$2</span>$3');
  html = html.replace(/(\s+)([a-zA-Z0-9_:-]+)(\s*=\s*&#039;)/g, '$1<span class="token-attr-name">$2</span>$3');
  // Attribute values (inside quotes)
  html = html.replace(/(=&quot;)([^&quot;]*)&quot;/g, '$1<span class="token-attr-value">$2</span>&quot;');
  html = html.replace(/(=&#039;)([^&#039;]*)&#039;/g, '$1<span class="token-attr-value">$2</span>&#039;');
  return html;
};

const highlightCss = (code: string): string => {
  let css = code;
  // Comments
  css = css.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
  // Selectors (very basic, up to {)
  css = css.replace(/^([^{]+?)\s*({)/gm, (match, selector, brace) => {
    const highlightedSelector = selector.replace(/([#.:]?[\w-]+)/g, '<span class="token-selector">$1</span>');
    return `${highlightedSelector} ${brace}`;
  });
  // Properties
  css = css.replace(/([a-zA-Z-]+)\s*(:)/g, '<span class="token-property">$1</span>$2');
  // Values (simplified - keywords, hex colors, numbers with units)
  // This is very basic and won't cover all CSS value types perfectly
  css = css.replace(/:\s*([^;]+);/g, (match, value) => {
    const highlightedValue = value.replace(/(#[0-9a-fA-F]{3,6}|[a-zA-Z]+|\d+(px|em|rem|%|vh|vw|s|ms)?)/g, '<span class="token-css-value">$1</span>');
    return `: ${highlightedValue};`;
  });
  return css;
};


export const EditableSyntaxHighlighter: React.FC<EditableSyntaxHighlighterProps> = ({
  value,
  language,
  onChange,
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const getHighlightedCode = useCallback((code: string, lang: 'html' | 'css'): string => {
    const escapedCode = escapeHtml(code);
    if (lang === 'html') {
      return highlightHtml(escapedCode);
    }
    if (lang === 'css') {
      return highlightCss(escapedCode);
    }
    return escapedCode; // Should not happen with current usage
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const currentRawText = editorRef.current.innerText;
      if (currentRawText !== value) { // Only update if value prop differs from displayed text
        const highlighted = getHighlightedCode(value, language);
        editorRef.current.innerHTML = highlighted;
      }
    }
  }, [value, language, getHighlightedCode]);

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const rawText = event.currentTarget.innerText;
    onChange(rawText);
  };
  
  // Set initial content
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerText !== value) {
        editorRef.current.innerHTML = getHighlightedCode(value, language);
    }
  }, []); // Run once on mount if value is present

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      className={className}
      spellCheck="false"
      style={{ whiteSpace: 'pre-wrap', WebkitUserModify: 'read-write-plaintext-only' }} // Preserve whitespace, ensure plain text pasting
    />
  );
};
