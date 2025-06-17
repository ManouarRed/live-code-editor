
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
  // Needs to be before tag name replacements if attributes are part of tag regex.
  // Here, it's independent.
  html = html.replace(/(\s+)([a-zA-Z0-9_:-]+)(\s*=\s*)((?:&quot;[^&quot;]*&quot;)|(?:&#039;[^&#039;]*&#039;))/g, 
    (match, preSpace, attrName, equalsPart, attrFullValueWithQuotes) => {
      const quote = attrFullValueWithQuotes.startsWith('&quot;') ? '&quot;' : '&#039;';
      const attrValue = attrFullValueWithQuotes.substring(quote.length, attrFullValueWithQuotes.length - quote.length);
      return `${preSpace}<span class="token-attr-name">${attrName}</span><span class="token-punctuation">${equalsPart.trim()}</span><span class="token-punctuation">${quote}</span><span class="token-attr-value">${attrValue}</span><span class="token-punctuation">${quote}</span>`;
  });
  
  // Boolean attributes (e.g. <input disabled>) - simple version
  // This regex is tricky to make perfect without full parsing. It might miscolor things.
  // Let's refine: find a space, then attribute name, then lookahead for space or >
  // This needs to be careful not to match content within tags if not an attribute.
  // For now, focusing on valued attributes as they are more common and complex.
  // A more robust solution would be a proper tokenizer.

  // 3. Tag names and their brackets: <tag>, </tag>
  // &lt; or &lt;/ followed by tagname
  html = html.replace(/(&lt;\/?)([a-zA-Z0-9_:-]+)/g, 
    '<span class="token-punctuation">$1</span><span class="token-tag">$2</span>');
  
  // 4. Closing > of a tag (e.g., <tag attr="val" > or </tag > )
  // This should not affect > within escaped attribute values (&amp;gt;)
  html = html.replace(/((?:\s|\/)*&gt;)/g, '<span class="token-punctuation">$1</span>');

  // 5. HTML Entities in content (e.g., &amp;nbsp; &amp;lt;)
  // This runs on already escaped text, so we look for &amp;name;
  html = html.replace(/(&amp;(?:[a-zA-Z0-9]+|#\d+|#x[0-9a-fA-F]+);)/g, '<span class="token-entity">$1</span>');

  return html;
};

const highlightCss = (code: string): string => {
  let css = code; // code is already escaped
  // Comments
  css = css.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
  // Selectors (very basic, up to {)
  css = css.replace(/^([^{]+?)\s*({)/gm, (match, selector, brace) => {
    // Color various parts of selectors
    let highlightedSelector = selector.replace(/([#.:]?[\w-]+|\[.*?\]|\*)/g, '<span class="token-selector">$1</span>');
    // Color combinators like >, +, ~
    highlightedSelector = highlightedSelector.replace(/(\s*[>+~]\s*)/g, '<span class="token-punctuation">$1</span>');
    return `${highlightedSelector} <span class="token-punctuation">${brace}</span>`;
  });
  // Properties
  css = css.replace(/([a-zA-Z-]+)\s*(:)/g, '<span class="token-property">$1</span><span class="token-punctuation">$2</span>');
  // Values (simplified - keywords, hex colors, numbers with units, strings)
  css = css.replace(/:\s*([^;}]+)([;}])/g, (match, value, terminator) => {
    const highlightedValue = value
      .replace(/(#[0-9a-fA-F]{3,8}|rgba?\([\d\s,.]+\)|hsla?\([\d\s%,.]+\))/gi, '<span class="token-css-value">$1</span>') // Colors (hex, rgb, hsl)
      .replace(/(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|turn|fr|ch|ex|vmin|vmax)\b)/gi, '<span class="token-css-value">$1</span>') // Numbers with units
      .replace(/(&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;)/g, '<span class="token-css-value">$1</span>') // Strings
      .replace(/\b(important|inherit|initial|unset|none|auto|solid|dashed|dotted|true|false|[a-zA-Z-]+(?=\s|\())/g, (m) => { // Keywords & some functions
        if (/^(url|attr|calc|var|env|min|max|clamp|rgb|rgba|hsl|hsla)$/i.test(m)) {
          return `<span class="token-property">${m}</span>`; // function names
        }
        return `<span class="token-css-value">${m}</span>`; // other keywords
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
      // This helps minimize DOM manipulations but doesn't fully solve cursor jumps on edit.
      // For precise cursor preservation, a more complex solution involving saving
      // and restoring selection relative to character offsets would be needed.
      if (editorRef.current.innerHTML !== newHighlightedContent) {
        // TODO: Implement cursor position saving and restoring for a better UX.
        editorRef.current.innerHTML = newHighlightedContent;
      }
    }
  }, [value, language, getHighlightedCode]);


  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const rawText = event.currentTarget.innerText;
    onChange(rawText);
    // Note: The actual re-highlighting is handled by the useEffect above
    // when the `value` prop changes.
  };
  
  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      className={className}
      spellCheck="false"
      // style={{ whiteSpace: 'pre-wrap', WebkitUserModify: 'read-write-plaintext-only' }} // 'pre-wrap' is good. WebkitUserModify is non-standard.
      style={{ whiteSpace: 'pre-wrap' }} // Preserves whitespace, crucial for code.
      aria-label={`${language} code input with syntax highlighting`}
    />
  );
};
