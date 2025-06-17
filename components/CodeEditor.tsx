import React, { useState, useEffect, useRef } from 'react';
import type { CodeEditorProps, EditorSectionProps } from '../types';
import { EditableSyntaxHighlighter } from './EditableSyntaxHighlighter';

const EditorSection: React.FC<EditorSectionProps> = ({ title, language, value, onChange, isExpanded, onToggle }) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const editorRef = useRef<HTMLDivElement | HTMLTextAreaElement>(null); // Ref for the actual input element

  const handleLocalChange = (newValue: string) => {
    onChange(newValue);
    if (!isFlashing) { // Prevent re-triggering animation if already active
      setIsFlashing(true);
    }
  };

  useEffect(() => {
    if (isFlashing) {
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 400); // Duration of the flash animation (must match CSS)
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);

  // Increased font size from text-sm to text-base for a larger caret
  const editorBaseClasses = `w-full p-3 font-mono text-base focus:outline-none min-h-[50px] matrix-editor-text ${isFlashing ? 'text-flash-active' : ''}`;
  
  return (
    <div className={`flex flex-col rounded-lg shadow-md overflow-hidden matrix-editor-bg ${isExpanded ? 'flex-1 min-h-0' : 'flex-none'}`}>
      <div 
        className="flex justify-between items-center p-3 matrix-header-bg matrix-text-header border-b cursor-pointer"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`editor-section-${language}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
      >
        <h2 className="text-lg font-semibold">
          {title}
        </h2>
        <button
          className="text-gray-400 hover:text-gray-100 transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          aria-label={isExpanded ? `Collapse ${title} editor` : `Expand ${title} editor`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
      {isExpanded && (
        <div id={`editor-section-${language}`} className="flex-1 min-h-0 overflow-auto">
          {language === 'html' || language === 'css' ? (
            <EditableSyntaxHighlighter
              // @ts-ignore TODO: Fix ref type for EditableSyntaxHighlighter if it directly exposes its div
              ref={editorRef as React.RefObject<HTMLDivElement>}
              value={value}
              language={language}
              onChange={handleLocalChange}
              className={`${editorBaseClasses} whitespace-pre-wrap`}
            />
          ) : (
            <textarea
              ref={editorRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => handleLocalChange(e.target.value)}
              placeholder={`Enter ${language} code here...`}
              className={`${editorBaseClasses} resize-none h-full`} // Ensure textarea takes full height
              spellCheck="false"
              aria-label={`${title} code editor`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  html,
  css,
  js,
  onHtmlChange,
  onCssChange,
  onJsChange,
}) => {
  const [expandedEditors, setExpandedEditors] = useState<{ [key: string]: boolean }>({
    html: true,
    css: true,
    js: true,
  });

  const toggleEditor = (editor: 'html' | 'css' | 'js') => {
    setExpandedEditors(prev => ({ ...prev, [editor]: !prev[editor] }));
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <EditorSection 
        title="HTML" 
        language="html" 
        value={html} 
        onChange={onHtmlChange}
        isExpanded={expandedEditors.html}
        onToggle={() => toggleEditor('html')} 
      />
      <EditorSection 
        title="CSS" 
        language="css" 
        value={css} 
        onChange={onCssChange}
        isExpanded={expandedEditors.css}
        onToggle={() => toggleEditor('css')}
      />
      <EditorSection 
        title="JavaScript" 
        language="javascript" 
        value={js} 
        onChange={onJsChange}
        isExpanded={expandedEditors.js}
        onToggle={() => toggleEditor('js')}
      />
    </div>
  );
};
