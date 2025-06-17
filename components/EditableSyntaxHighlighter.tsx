
import React, { useEffect, useRef, useCallback, useState } from 'react';
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

  html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token-comment">$1</span>');
  html = html.replace(/(\s+)([a-zA-Z0-9_:-]+)(\s*=\s*)((?:&quot;[^&quot;]*&quot;)|(?:&#039;[^&#039;]*&#039;))/g, 
    (match, preSpace, attrName, equalsPart, attrFullValueWithQuotes) => {
      const quote = attrFullValueWithQuotes.startsWith('&quot;') ? '&quot;' : '&#039;';
      const attrValue = attrFullValueWithQuotes.substring(quote.length, attrFullValueWithQuotes.length - quote.length);
      return `${preSpace}<span class="token-attr-name">${attrName}</span><span class="token-punctuation">${equalsPart.trim()}</span><span class="token-punctuation">${quote}</span><span class="token-attr-value">${attrValue}</span><span class="token-punctuation">${quote}</span>`;
  });
  html = html.replace(/(&lt;\/?)([a-zA-Z0-9_:-]+)/g, 
    '<span class="token-punctuation">$1</span><span class="token-tag">$2</span>');
  html = html.replace(/((?:\s|\/)*&gt;)/g, '<span class="token-punctuation">$1</span>');
  html = html.replace(/(&amp;(?:[a-zA-Z0-9]+|#\d+|#x[0-9a-fA-F]+);)/g, '<span class="token-entity">$1</span>');

  return html;
};

const highlightCss = (code: string): string => {
  let css = code; 
  css = css.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
  css = css.replace(/^([^{]+?)\s*({)/gm, (match, selector, brace) => {
    let highlightedSelector = selector.replace(/([#.:]?[\w-]+(?:\([^)]*\))?|\[.*?\]|\*|&amp;:[\w-]+)/g, '<span class="token-selector">$1</span>');
    highlightedSelector = highlightedSelector.replace(/(\s*[>+~]\s*)/g, '<span class="token-punctuation">$1</span>'); // Combinators
    highlightedSelector = highlightedSelector.replace(/([:,])/g, '<span class="token-punctuation">$1</span>'); // Punctuation in selectors
    return `${highlightedSelector} <span class="token-punctuation">${brace}</span>`;
  });
  css = css.replace(/([a-zA-Z-]+)\s*(:)/g, '<span class="token-property">$1</span><span class="token-punctuation">$2</span>');
  
  css = css.replace(/:\s*([^;}]+)([;}])/g, (match, valueContent, terminator) => {
    let highlightedValue = valueContent;
    
    // Numbers with units
    highlightedValue = highlightedValue.replace(/\b(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms|deg|turn|fr|ch|ex|vmin|vmax)\b/gi, 
        '<span class="token-css-value number-unit">$1$2</span>');
    // Standalone numbers (e.g., line-height, z-index, font-weight)
    highlightedValue = highlightedValue.replace(/\b(\d+(?:\.\d+)?)\b(?!\w|&)/g, '<span class="token-css-value number-unit">$1</span>');
    // Colors (hex, rgb, hsl)
    highlightedValue = highlightedValue.replace(/(#[0-9a-fA-F]{3,8}\b|rgba?\([\d\s,.]+\)|hsla?\([\d\s%,.]+\))/gi, '<span class="token-css-value number-unit">$1</span>');
    // Quoted strings
    highlightedValue = highlightedValue.replace(/(&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;)/g, '<span class="token-css-value">$1</span>');
    // Keywords (important, none, auto, color names etc.)
    highlightedValue = highlightedValue.replace(/\b(important|inherit|initial|unset|none|auto|solid|dashed|dotted|double|groove|ridge|inset|outset|hidden|visible|scroll|fixed|absolute|relative|static|sticky|flex|grid|inline|block|italic|normal|bold|lighter|bolder|[a-zA-Z-]+)\b/gi, 
        (m) => `<span class="token-css-value keyword">${m}</span>`);
    // CSS Functions (url, var, calc, etc.)
    highlightedValue = highlightedValue.replace(/\b([a-zA-Z-]+)\s*\(/g, (m, funcName) => `<span class="token-css-value function-name">${funcName}</span><span class="token-punctuation">(</span>`);


    return `: ${highlightedValue}<span class="token-punctuation">${terminator}</span>`;
  });
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
  const [caretPos, setCaretPos] = useState<{ top: number; left: number; height: number; visible: boolean } | null>(null);
  const lastSelectionRef = useRef<{ offset: number; isCollapsed: boolean } | null>(null);


  const getHighlightedCode = useCallback((code: string, lang: 'html' | 'css'): string => {
    const escapedCode = escapeHtml(code);
    if (lang === 'html') return highlightHtml(escapedCode);
    if (lang === 'css') return highlightCss(escapedCode);
    return escapedCode;
  }, []);

  const saveSelection = useCallback(() => {
    const editorNode = editorRef.current;
    if (!editorNode || document.activeElement !== editorNode) {
      lastSelectionRef.current = null;
      return;
    }
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = document.createRange();
      preSelectionRange.selectNodeContents(editorNode);
      if (range.startContainer && editorNode.contains(range.startContainer)) {
         preSelectionRange.setEnd(range.startContainer, range.startOffset);
         const offset = preSelectionRange.toString().length;
         lastSelectionRef.current = { offset, isCollapsed: range.collapsed };
      } else { // Selection might be outside or invalid
         lastSelectionRef.current = { offset: editorNode.innerText.length, isCollapsed: true}; // Fallback to end
      }
    } else {
      lastSelectionRef.current = null;
    }
  }, []);
  
  const restoreSelection = useCallback(() => {
    const editorNode = editorRef.current;
    const savedState = lastSelectionRef.current;
  
    if (!editorNode || !savedState || document.activeElement !== editorNode) {
      return;
    }
  
    const { offset: savedOffset, isCollapsed } = savedState;
    const selection = window.getSelection();
    if (!selection) return;
  
    let accumulatedLength = 0;
    let startNode: Node | null = null;
    let startNodeOffset = 0;
  
    const walker = document.createTreeWalker(editorNode, NodeFilter.SHOW_TEXT, null);
    let currentNode: Node | null = null;
  
    while ((currentNode = walker.nextNode())) {
      const textLength = currentNode.textContent?.length || 0;
      if (accumulatedLength + textLength >= savedOffset) {
        startNode = currentNode;
        startNodeOffset = savedOffset - accumulatedLength;
        break;
      }
      accumulatedLength += textLength;
    }
  
    if (startNode) {
      try {
        const newRange = document.createRange();
        newRange.setStart(startNode, Math.min(startNodeOffset, startNode.textContent?.length || 0));
        if (isCollapsed) {
          newRange.collapse(true);
        } else {
          // Note: Restoring non-collapsed selection accurately across innerHTML changes is much harder.
          // For now, if it was not collapsed, we still collapse it at the start offset.
          newRange.collapse(true); 
        }
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        console.error("Error restoring selection:", e);
        // Fallback: move to end if specific restore fails
        const range = document.createRange();
        range.selectNodeContents(editorNode);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // If no suitable text node found (e.g. content drastically changed or offset too large), move to end
      const range = document.createRange();
      range.selectNodeContents(editorNode);
      range.collapse(false); // false collapses to the end
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);


  useEffect(() => {
    if (editorRef.current) {
      const currentRawText = editorRef.current.innerText;
      // Only re-render if the raw text content is different or language changed.
      // This prevents re-highlighting if only selection changed.
      if (currentRawText !== value || editorRef.current.dataset.language !== language) {
        const newHighlightedContent = getHighlightedCode(value, language);
        // Avoid re-render if highlighted content is somehow the same (e.g. empty value)
        if (editorRef.current.innerHTML !== newHighlightedContent) {
            editorRef.current.innerHTML = newHighlightedContent;
            restoreSelection(); 
        }
        editorRef.current.dataset.language = language;
      }
    }
  // restoreSelection depends on lastSelectionRef.current, which is updated by saveSelection.
  // saveSelection is called in handleInput. The flow is: input -> saveSelection -> onChange -> value prop change -> this useEffect -> restoreSelection.
  }, [value, language, getHighlightedCode, restoreSelection]);


  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    saveSelection(); // Save selection before rawText extraction and state update
    const rawText = event.currentTarget.innerText;
    onChange(rawText);
  };
  
  useEffect(() => {
    const editorNode = editorRef.current;
    if (!editorNode) return;

    const updateFakeCaret = () => {
      if (document.activeElement !== editorNode) {
        setCaretPos(prev => (prev ? { ...prev, visible: false } : null));
        return;
      }

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();
        
        if (rect.width === 0 && rect.height === 0 && editorNode.firstChild) {
            const tempSpan = document.createElement('span');
            tempSpan.textContent = '\uFEFF'; 
            range.insertNode(tempSpan);
            rect = tempSpan.getBoundingClientRect();
            tempSpan.parentNode?.removeChild(tempSpan);
            selection.removeAllRanges();
            selection.addRange(range); 
        }

        const editorRect = editorNode.getBoundingClientRect();
        const scrollTop = editorNode.scrollTop;
        const scrollLeft = editorNode.scrollLeft;
        
        const computedStyle = getComputedStyle(editorNode);
        let lineHeight = parseFloat(computedStyle.lineHeight);
        if (isNaN(lineHeight) || computedStyle.lineHeight === 'normal') {
            lineHeight = parseFloat(computedStyle.fontSize) * 1.6; 
        }
        
        setCaretPos({
          top: rect.top - editorRect.top + scrollTop,
          left: rect.left - editorRect.left + scrollLeft,
          height: lineHeight,
          visible: true,
        });
      } else {
        setCaretPos(prev => (prev ? { ...prev, visible: false } : null));
      }
    };
    
    const handleBlur = () => setCaretPos(prev => (prev ? { ...prev, visible: false } : null));

    document.addEventListener('selectionchange', updateFakeCaret);
    editorNode.addEventListener('focus', updateFakeCaret);
    editorNode.addEventListener('blur', handleBlur);
    // Using keyup for fake caret update to ensure DOM has settled after char input
    editorNode.addEventListener('keyup', updateFakeCaret); 
    editorNode.addEventListener('mousedown', updateFakeCaret);


    if(document.activeElement === editorNode) updateFakeCaret();

    return () => {
      document.removeEventListener('selectionchange', updateFakeCaret);
      editorNode.removeEventListener('focus', updateFakeCaret);
      editorNode.removeEventListener('blur', handleBlur);
      editorNode.removeEventListener('keyup', updateFakeCaret);
      editorNode.removeEventListener('mousedown', updateFakeCaret);
    };
  }, []); 
  
  return (
    <>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={saveSelection} // Save selection on keydown for more responsive caret on non-char keys
        onClick={saveSelection} // Save selection on click
        className={className} 
        spellCheck="false"
        style={{ whiteSpace: 'pre-wrap' }} 
        aria-label={`${language} code input with syntax highlighting`}
        data-language={language} // Store language for effect check
      />
      {caretPos?.visible && (
        <div
          className="fake-caret"
          style={{
            position: 'absolute',
            top: `${caretPos.top}px`,
            left: `${caretPos.left}px`,
            height: `${caretPos.height}px`,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
};
