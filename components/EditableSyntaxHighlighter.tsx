
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

const highlightInlineCss = (styleAttributeValue: string): string => {
  // styleAttributeValue is a slice of an already HTML-escaped string.
  // e.g., "font-family: Arial, sans-serif; color: #333333"
  // It does not need further escaping for its content, only wrapping in spans.
  let resultHTML = '';
  const declarations = styleAttributeValue.split(';');

  declarations.forEach((decl, index) => {
    const trimmedDecl = decl.trim();
    if (trimmedDecl === '') {
      // Add back semicolon if it's a separator and not just trailing
      if (index < declarations.length - 1 && declarations.slice(index + 1).some(d => d.trim() !== '')) {
         resultHTML += '<span class="token-punctuation">;</span>';
      }
      return;
    }

    const parts = trimmedDecl.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/); // property: value
    if (parts && parts.length === 3) {
      const propName = parts[1]; // Already escaped from parent, e.g., "color"
      let valueContent = parts[2].trim(); // Already escaped, e.g., "#333333" or "Arial, sans-serif"

      resultHTML += `<span class="token-property">${propName}</span><span class="token-punctuation">:</span> `;
      
      let valueTokensHTML = "";
      let remainingValue = valueContent;

      while (remainingValue.length > 0) {
        let matched = false;
        
        // Order of token checks:
        // 1. Quoted strings (e.g., &quot;Times New Roman&quot;)
        let match = remainingValue.match(/^(&quot;(?:[^&]|&amp;(?!quot;|#039;))*&quot;|&#039;(?:[^&]|&amp;(?!quot;|#039;))*&#039;)/);
        if (match) {
            const S = match[0];
            const openQuote = S.startsWith('&quot;') ? '&quot;' : '&#039;';
            const closeQuote = openQuote;
            const innerContent = S.substring(openQuote.length, S.length - closeQuote.length);
            
            valueTokensHTML += `<span class="token-punctuation">${openQuote}</span>` +
                               `<span class="token-css-value">${innerContent}</span>` + // innerContent is already escaped
                               `<span class="token-punctuation">${closeQuote}</span>`;
            remainingValue = remainingValue.substring(S.length);
            matched = true;
        }

        // 2. !important
        if (!matched) {
          match = remainingValue.match(/^!\s*important\b/i);
          if (match) {
              valueTokensHTML += `<span class="token-css-value keyword">${match[0]}</span>`;
              remainingValue = remainingValue.substring(match[0].length);
              matched = true;
          }
        }
        
        // 3. Functions (url(), var(), rgb(), etc.)
        if (!matched) {
          // Adjusted to handle rgb(), rgba(), hsl(), hsla() as functions or colors directly
           match = remainingValue.match(/^([a-zA-Z-]+)\s*\(([^)]*)\)/);
           if (match && !/^(rgb|rgba|hsl|hsla)$/i.test(match[1])) { // Don't treat color functions as generic functions here
              valueTokensHTML += `<span class="token-css-value function-name">${match[1]}</span>` +
                                 `<span class="token-punctuation">(</span>` +
                                 `${match[2]}` + // Args are already escaped slices
                                 `<span class="token-punctuation">)</span>`;
              remainingValue = remainingValue.substring(match[0].length);
              matched = true;
           }
        }

        // 4. Hex colors, rgb(), hsl() (content is already escaped)
        if (!matched) {
          match = remainingValue.match(/^(#[0-9a-fA-F]{3,8}\b|rgba?\([\d\s,./%&;#x]+\)|hsla?\([\d\s%,./&;#x]+\))/i);
          if (match) {
              valueTokensHTML += `<span class="token-css-value number-unit">${match[0]}</span>`;
              remainingValue = remainingValue.substring(match[0].length);
              matched = true;
          }
        }

        // 5. Numbers with units
        if (!matched) {
          match = remainingValue.match(/^(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms|deg|turn|fr|ch|ex|vmin|vmax|pt|pc|in|cm|mm|mozmm|Q)\b/i);
          if (match) {
              valueTokensHTML += `<span class="token-css-value number-unit">${match[0]}</span>`; // The whole thing (e.g. 24px)
              remainingValue = remainingValue.substring(match[0].length);
              matched = true;
          }
        }

        // 6. Standalone numbers
        if (!matched) {
          match = remainingValue.match(/^(\d+(?:\.\d+)?)\b/);
          if (match) {
              valueTokensHTML += `<span class="token-css-value number-unit">${match[0]}</span>`;
              remainingValue = remainingValue.substring(match[0].length);
              matched = true;
          }
        }
        
        // 7. CSS Keywords
        if (!matched) {
          const cssKeywords = /^(inherit|initial|unset|none|auto|solid|dashed|dotted|double|groove|ridge|inset|outset|hidden|visible|scroll|fixed|absolute|relative|static|sticky|flex|grid|inline|block|italic|normal|bold|lighter|bolder|revert|revert-layer|transparent|currentColor|serif|sans-serif|monospace|cursive|fantasy|system-ui|left|right|center|justify|start|end|uppercase|lowercase|capitalize|underline|overline|line-through|pointer|wait|text|help|default|grab|grabbing|zoom-in|zoom-out|no-drop|not-allowed|all-scroll|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize)\b/i;
          match = remainingValue.match(/^([a-zA-Z-]+)\b/);
          if (match && cssKeywords.test(match[0])) {
            valueTokensHTML += `<span class="token-css-value keyword">${match[0]}</span>`;
            remainingValue = remainingValue.substring(match[0].length);
            matched = true;
          } else if (match) { // Non-keyword identifier (e.g., font name if not quoted, like Arial)
            valueTokensHTML += match[0]; // As plain text (already escaped)
            remainingValue = remainingValue.substring(match[0].length);
            matched = true;
          }
        }
        
        // 8. Punctuation (comma) or remaining spaces
        if (!matched) {
            match = remainingValue.match(/^(\s*,\s*|\s+)/);
            if (match) {
                const trimmedMatch = match[0].trim();
                if (trimmedMatch === ',') {
                    if (match[0].startsWith(' ')) valueTokensHTML += ' ';
                    valueTokensHTML += `<span class="token-punctuation">,</span>`;
                    if (match[0].endsWith(' ')) valueTokensHTML += ' ';
                } else {
                     valueTokensHTML += match[0]; // Just whitespace
                }
                remainingValue = remainingValue.substring(match[0].length);
                matched = true;
            }
        }

        if (!matched && remainingValue.length > 0) { // Fallback for safety
            valueTokensHTML += remainingValue[0]; // Add char as is (it's already escaped)
            remainingValue = remainingValue.substring(1);
        }
      }
      resultHTML += valueTokensHTML;

    } else {
      resultHTML += trimmedDecl; // Not a valid prop:value, add as is (already escaped)
    }

    // Add back semicolon if it was a separator
    if (index < declarations.length - 1 && trimmedDecl !== '') {
         if(declarations.slice(index + 1).some(d => d.trim() !== '') || styleAttributeValue.trim().endsWith(';')) {
           resultHTML += '<span class="token-punctuation">;</span>';
         }
    } else if (index === declarations.length - 1 && trimmedDecl !== '' && styleAttributeValue.trim().endsWith(';')) {
        // Handle trailing semicolon on the very last declaration
        resultHTML += '<span class="token-punctuation">;</span>';
    }
  });
  return resultHTML;
};


const highlightHtml = (code: string): string => {
  let html = code; 

  html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token-comment">$1</span>');
  html = html.replace(/(\s+)([a-zA-Z0-9_:-]+)(\s*=\s*)((?:&quot;[^&quot;]*&quot;)|(?:&#039;[^&#039;]*&#039;))/g, 
    (match, preSpace, attrName, equalsPart, attrFullValueWithQuotes) => {
      const quote = attrFullValueWithQuotes.startsWith('&quot;') ? '&quot;' : '&#039;';
      const attrValue = attrFullValueWithQuotes.substring(quote.length, attrFullValueWithQuotes.length - quote.length);
      
      if (attrName.toLowerCase() === 'style') {
        const highlightedStyleContent = highlightInlineCss(attrValue);
        return `${preSpace}<span class="token-attr-name">${attrName}</span><span class="token-punctuation">${equalsPart.trim()}</span><span class="token-punctuation">${quote}</span>${highlightedStyleContent}<span class="token-punctuation">${quote}</span>`;
      } else {
        return `${preSpace}<span class="token-attr-name">${attrName}</span><span class="token-punctuation">${equalsPart.trim()}</span><span class="token-punctuation">${quote}</span><span class="token-attr-value">${attrValue}</span><span class="token-punctuation">${quote}</span>`;
      }
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
  // Process selectors and opening brace
  css = css.replace(/^([^{]+?)\s*({)/gm, (match, selector, brace) => {
    let highlightedSelector = selector.replace(/([#.:]?[\w-]+(?:\([^)]*\))?|\[.*?\]|\*|&amp;:[\w-]+)/g, '<span class="token-selector">$1</span>');
    highlightedSelector = highlightedSelector.replace(/(\s*[>+~]\s*)/g, '<span class="token-punctuation">$1</span>'); 
    highlightedSelector = highlightedSelector.replace(/([:,])/g, '<span class="token-punctuation">$1</span>'); 
    return `${highlightedSelector} <span class="token-punctuation">${brace}</span>`;
  });
  
  // Process properties and their values (simplified for block CSS, detail in highlightInlineCss for values)
  // This regex handles property: value; structure.
  css = css.replace(/([a-zA-Z0-9_-]+)\s*:\s*([^;}]+)\s*([;}])/g, (match, propName, valueContent, terminator) => {
    // For block CSS, we can use highlightInlineCss for the value part as well, or a simplified version
    // For now, let's keep the detailed value highlighting mostly for inline styles and style blocks.
    // This part can be enhanced further if needed.
    const highlightedValue = highlightInlineCss(valueContent + (terminator === ';' && !valueContent.endsWith(';') ? ';' : '')); // Reuse for consistency, add temp terminator if needed
    // Remove the trailing semicolon span if highlightInlineCss added it and we also have one
    let finalHighlightedValue = highlightedValue;
    if (terminator === ';' && highlightedValue.endsWith('<span class="token-punctuation">;</span>')) {
       finalHighlightedValue = highlightedValue.substring(0, highlightedValue.lastIndexOf('<span class="token-punctuation">;</span>'));
    }

    return `<span class="token-property">${propName}</span><span class="token-punctuation">:</span> ${finalHighlightedValue}<span class="token-punctuation">${terminator}</span>`;
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
      } else { 
         lastSelectionRef.current = { offset: editorNode.innerText.length, isCollapsed: true};
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
          // For non-collapsed, this basic restore only sets the start.
          // A full non-collapsed restore would need to save endOffset too.
          // For now, collapsing to start is a safe default on re-highlight.
          newRange.collapse(true); 
        }
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        console.error("Error restoring selection:", e);
        // Fallback: move to end
        const range = document.createRange();
        range.selectNodeContents(editorNode);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // Fallback if no suitable text node found (e.g. empty editor)
      const range = document.createRange();
      range.selectNodeContents(editorNode);
      range.collapse(false); // Move to end
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);


  useEffect(() => {
    if (editorRef.current) {
      const currentRawText = editorRef.current.innerText;
      // Only re-highlight if the raw text has changed, or if language changed.
      // Avoids re-highlighting just due to selection changes if value is identical.
      if (currentRawText !== value || editorRef.current.dataset.language !== language) {
        const newHighlightedContent = getHighlightedCode(value, language);
        if (editorRef.current.innerHTML !== newHighlightedContent) {
            // Save selection before changing innerHTML
            // saveSelection(); // this is now handled by onInput/onPaste before onChange
            editorRef.current.innerHTML = newHighlightedContent;
            restoreSelection(); // Restore selection after innerHTML is updated
        }
        editorRef.current.dataset.language = language; // Keep track of current language
      }
    }
  }, [value, language, getHighlightedCode, restoreSelection]);


  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    saveSelection(); // Save selection before getting innerText and calling onChange
    const rawText = event.currentTarget.innerText;
    onChange(rawText);
    // restoreSelection will be called by the useEffect hook when `value` changes
  };

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const editorNode = editorRef.current;
    if (!editorNode) return;

    const pastedText = event.clipboardData.getData('text/plain');
    if (!pastedText) return;

    // Get current selection character offset based on plain text
    const selection = window.getSelection();
    let charStartOffset = 0;
    let charEndOffset = 0;

    if (selection && selection.rangeCount > 0 && editorNode.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = document.createRange();
        preSelectionRange.selectNodeContents(editorNode);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        charStartOffset = preSelectionRange.toString().length;

        preSelectionRange.setEnd(range.endContainer, range.endOffset);
        charEndOffset = preSelectionRange.toString().length;
    } else { // Fallback if no selection or selection is outside editor
        charStartOffset = editorNode.innerText.length;
        charEndOffset = editorNode.innerText.length;
    }
    
    const currentValue = editorRef.current.innerText; // Get current plain text
    const newValue = currentValue.substring(0, charStartOffset) + pastedText + currentValue.substring(charEndOffset);

    // Set the selection state for after the highlight
    lastSelectionRef.current = { offset: charStartOffset + pastedText.length, isCollapsed: true };
    
    onChange(newValue);
    // restoreSelection will be called by the useEffect hook
  }, [onChange]); 
  
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
        
        // If caret is at the end of a line or in an empty spot, rect might be 0.
        // Insert a zero-width space to get its position, then remove it.
        if (rect.width === 0 && rect.height === 0 && editorNode.firstChild) {
            // Check if range is valid within editor before modifying
            if (editorNode.contains(range.startContainer)) {
                const tempSpan = document.createElement('span');
                tempSpan.textContent = '\uFEFF'; // Zero-width non-breaking space
                try {
                    range.insertNode(tempSpan);
                    rect = tempSpan.getBoundingClientRect();
                    tempSpan.parentNode?.removeChild(tempSpan);
                    // Restore selection to original state (collapsed)
                    selection.removeAllRanges();
                    range.selectNodeContents(tempSpan); // Select the tempSpan before removing
                    range.collapse(false); // Collapse to end of tempSpan
                    selection.addRange(range); // This might be slightly off after removal
                } catch (e) {
                    // Could fail if range is in a weird spot, fallback to editor rect
                    rect = editorNode.getBoundingClientRect(); // Fallback
                     if (tempSpan.parentNode) tempSpan.parentNode.removeChild(tempSpan);
                }
            } else {
                 rect = editorNode.getBoundingClientRect(); // Fallback if range is weird
            }
        }


        const editorRect = editorNode.getBoundingClientRect();
        const scrollTop = editorNode.scrollTop;
        const scrollLeft = editorNode.scrollLeft;
        
        const computedStyle = getComputedStyle(editorNode);
        let lineHeight = parseFloat(computedStyle.lineHeight);
        if (isNaN(lineHeight) || computedStyle.lineHeight === 'normal') {
            // Fallback for 'normal' or if parsing fails
            lineHeight = parseFloat(computedStyle.fontSize) * 1.6; // Approximate line height
        }
        
        setCaretPos({
          top: rect.top - editorRect.top + scrollTop,
          left: rect.left - editorRect.left + scrollLeft,
          height: lineHeight, // Use calculated line height
          visible: true,
        });
      } else {
        setCaretPos(prev => (prev ? { ...prev, visible: false } : null));
      }
    };
    
    // Initial caret position update if focused
    if(document.activeElement === editorNode) updateFakeCaret();
    
    const handleFocus = () => { requestAnimationFrame(updateFakeCaret); };
    const handleBlur = () => setCaretPos(prev => (prev ? { ...prev, visible: false } : null));

    document.addEventListener('selectionchange', updateFakeCaret);
    editorNode.addEventListener('focus', handleFocus);
    editorNode.addEventListener('blur', handleBlur);
    // Keyup and mousedown can also help catch rapid changes
    editorNode.addEventListener('keyup', updateFakeCaret); 
    editorNode.addEventListener('mousedown', updateFakeCaret);


    return () => {
      document.removeEventListener('selectionchange', updateFakeCaret);
      editorNode.removeEventListener('focus', handleFocus);
      editorNode.removeEventListener('blur', handleBlur);
      editorNode.removeEventListener('keyup', updateFakeCaret);
      editorNode.removeEventListener('mousedown', updateFakeCaret);
    };
  }, []); // Empty dependency array as this effect only sets up/cleans up listeners
  
  // Effect to manually trigger selection restoration if value changes externally
  // and the editor is focused (e.g. undo/redo or programmatic change not via input event)
  const previousValueRef = useRef(value);
  useEffect(() => {
    if (editorRef.current && document.activeElement === editorRef.current && value !== previousValueRef.current) {
        // If value changed externally while focused, try to restore selection
        // This is a heuristic and might not always be perfect
        restoreSelection();
    }
    previousValueRef.current = value;
  }, [value, restoreSelection]);


  return (
    <>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={saveSelection} // Save selection before key events that might change content
        onClick={saveSelection} // Save on click as well to update selection state
        className={className} 
        spellCheck="false"
        style={{ whiteSpace: 'pre-wrap' }} // Ensure whitespace is preserved like in <pre>
        aria-label={`${language} code input with syntax highlighting`}
        data-language={language} // Store language for useEffect dependency check
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
