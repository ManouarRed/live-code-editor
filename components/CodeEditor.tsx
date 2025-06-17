
import React, { useState } from 'react';
import type { CodeEditorProps, EditorSectionProps } from '../types';
import { EditableSyntaxHighlighter } from './EditableSyntaxHighlighter';

const EditorSection: React.FC<EditorSectionProps> = ({ title, language, value, onChange, isExpanded, onToggle }) => {
  const editorBaseClasses = "w-full p-3 bg-gray-800 text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]";
  
  return (
    <div className={`flex flex-col bg-gray-800 rounded-lg shadow-md overflow-hidden ${isExpanded ? 'flex-1 min-h-0' : 'flex-none'}`}>
      <div className="flex justify-between items-center p-3 bg-gray-700 text-gray-200 border-b border-gray-600 cursor-pointer" onClick={onToggle}>
        <h2 className="text-lg font-semibold">
          {title}
        </h2>
        <button
          className="text-gray-400 hover:text-gray-100 transition-transform duration-200"
          aria-expanded={isExpanded}
          aria-controls={`editor-section-${language}`}
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
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
              value={value}
              language={language}
              onChange={onChange}
              className={`${editorBaseClasses} whitespace-pre-wrap`}
            />
          ) : (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${language} code here...`}
              className={`${editorBaseClasses} resize-none`}
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
