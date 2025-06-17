
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
  let html = code; // code is already escaped

  // 1. Comments
  html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token-comment">$1</span>');

  // 2. Attributes: name="value" or name='value'
  html = html.replace(/(\s+)([a-zA-Z0-9_:-]+)(\s*=\s*)((?:&quot;[^&quot;]*&quot;)|(?:&#039;[^&#039;]*&#039;))/g, 
    (match, preSpace, attrName, equalsPart, attrFullValueWithQuotes) => {
      const quote = attrFullValueWithQuotes.startsWith('&quot;') ? '&quot;' : '&#039;';
      const attrValue = attrFullValueWithQuotes.substring(quote.length, attrFullValueWithQuotes.length - quote.length);
      return `${preSpace}<span class="token-attr-name">${attrName}</span><span class="token-punctuation">${equalsPart.trim()}</span><span class="token-punctuation">${quote}</span><span class="token-attr-value">${attrValue}</span><span class="token-punctuation">${quote}</span>`;
  });
  
  // 3. Tag names and their brackets: <tag>, </tag>
  html = html.replace(/(&lt;\/?)([a-zA-Z0-9_:-]+)/g, 
    '<span class="token-punctuation">$1</span><span class="token-tag">$2</span>');
  
  // 4. Closing > of a tag
  html = html.replace(/((?:\s|\/)*&gt;)/g, '<span class="token-punctuation">$1</span>');

  // 5. HTML Entities in content
  html = html.replace(/(&amp;(?:[a-zA-Z0-9]+|#\d+|#x[0-9a-fA-F]+);)/g, '<span class="token-entity">$1</span>');

  return html;
};

const highlightCss = (code: string): string => {
  let css = code; // code is already escaped
  // Comments
  css = css.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
  // Selectors (very basic, up to {)
  css = css.replace(/^([^{]+?)\s*({)/gm, (match, selector, brace) => {
    let highlightedSelector = selector.replace(/([#.:]?[\w-]+|\[.*?\]|\*)/g, '<span class="token-selector">$1</span>');
    highlightedSelector = highlightedSelector.replace(/(\s*[>+~]\s*)/g, '<span class="token-punctuation">$1</span>');
    return `${highlightedSelector} <span class="token-punctuation">${brace}</span>`;
  });
  // Properties
  css = css.replace(/([a-zA-Z-]+)\s*(:)/g, '<span class="token-property">$1</span><span class="token-punctuation">$2</span>');
  // Values
  css = css.replace(/:\s*([^;}]+)([;}])/g, (match, value, terminator) => {
    const highlightedValue = value
      .replace(/(#[0-9a-fA-F]{3,8}|rgba?\([\d\s,.]+\)|hsla?\([\d\s%,.]+\))/gi, '<span class="token-css-value">$1</span>') 
      .replace(/(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|turn|fr|ch|ex|vmin|vmax)\b)/gi, '<span class="token-css-value">$1</span>') 
      .replace(/(&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;)/g, '<span class="token-css-value">$1</span>') 
      .replace(/\b(important|inherit|initial|unset|none|auto|solid|dashed|dotted|true|false|[a-zA-Z-]+(?=\s|\())/g, (m) => { 
        if (/^(url|attr|calc|var|env|min|max|clamp|rgb|rgba|hsl|hsla)$/i.test(m)) {
          return `<span class="token-property">${m}</span>`; 
        }
        return `<span class="token-css-value">${m}</span>`; 
      });
    return `: ${highlightedValue}<span class="token-punctuation">${terminator}</span>`;
  });
   // Closing brace }
  css = css.replace(/(\})/g, '<span class="token-punctuation">$1</span>');
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
    return escapedCode;
  }, []);

  // This effect synchronizes the displayed highlighted content with the `value` prop.
  useEffect(() => {
    if (editorRef.current) {
      const newHighlightedContent = getHighlightedCode(value, language);
      // Only update innerHTML if it's actually different.
      // NOTE: Directly manipulating innerHTML like this is the primary cause of cursor jumping
      // on input/paste. A robust solution requires complex selection saving and restoration logic
      // or using a dedicated code editor library. This is a known limitation of the current approach.
      if (editorRef.current.innerHTML !== newHighlightedContent) {
        editorRef.current.innerHTML = newHighlightedContent;
      }
    }
  }, [value, language, getHighlightedCode]);


  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const rawText = event.currentTarget.innerText;
    onChange(rawText);
    // The actual re-highlighting and innerHTML update is handled by the useEffect above
    // when the `value` prop changes. This can lead to cursor position issues.
  };
  
  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      className={className}
      spellCheck="false"
      style={{ whiteSpace: 'pre-wrap' }} 
      aria-label={`${language} code input with syntax highlighting`}
    />
  );
};
