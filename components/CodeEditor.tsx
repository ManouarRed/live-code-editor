
import React from 'react';
import type { CodeEditorProps, EditorSectionProps } from '../types';

const EditorSection: React.FC<EditorSectionProps> = ({ title, language, value, onChange }) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <h2 className="text-lg font-semibold p-3 bg-gray-700 text-gray-200 border-b border-gray-600">
        {title}
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${language} code here...`}
        className="w-full flex-1 p-3 bg-gray-800 text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        spellCheck="false"
      />
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
  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <EditorSection title="HTML" language="HTML" value={html} onChange={onHtmlChange} />
      <EditorSection title="CSS" language="CSS" value={css} onChange={onCssChange} />
      <EditorSection title="JavaScript" language="JavaScript" value={js} onChange={onJsChange} />
    </div>
  );
};
