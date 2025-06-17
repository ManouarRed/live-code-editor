
import React, { useState, useEffect, useRef } from 'react';
import type { CodeEditorProps, EditorSectionProps } from '../types';
import { EditableSyntaxHighlighter } from './EditableSyntaxHighlighter';

const EditorSection: React.FC<EditorSectionProps> = ({ title, language, value, onChange, isExpanded, onToggle }) => {
  const [isFlashing, setIsFlashing] = useState(false);
  
  const handleLocalChange = (newValue: string) => {
    onChange(newValue);
    if (!isFlashing) {
      setIsFlashing(true);
    }
  };

  useEffect(() => {
    if (isFlashing) {
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 300); // Duration of the flash animation
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);

  const editorBaseClasses = `w-full p-3 font-mono text-base focus:outline-none min-h-[50px] editor-text-base ${isFlashing ? 'text-flash-active' : ''}`;
  
  return (
    <div className={`flex flex-col rounded-lg shadow-md overflow-hidden editor-section-bg ${isExpanded ? 'flex-1 min-h-0' : 'flex-none'}`}>
      <div 
        className="flex justify-between items-center p-3 editor-header-bg editor-text-header border-b editor-border-strong cursor-pointer"
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
          className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          aria-label={isExpanded ? `Collapse ${title} editor` : `Expand ${title} editor`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
      {isExpanded && (
        <div 
          id={`editor-section-${language}`} 
          className="flex-1 min-h-0 overflow-auto relative" // position: relative for fake caret
        >
          {language === 'html' || language === 'css' ? (
            <EditableSyntaxHighlighter
              value={value}
              language={language}
              onChange={handleLocalChange}
              className={`${editorBaseClasses} whitespace-pre-wrap syntax-highlighter-editable`}
            />
          ) : (
            <textarea
              value={value}
              onChange={(e) => handleLocalChange(e.target.value)}
              placeholder={`Enter ${language} code here...`}
              className={`${editorBaseClasses} resize-none h-full bg-[var(--theme-bg-editor)]`} 
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
