
export interface CodeState {
  html: string;
  css: string;
  js: string;
}

export interface CodeEditorProps {
  html: string;
  css: string;
  js: string;
  onHtmlChange: (value: string) => void;
  onCssChange: (value: string) => void;
  onJsChange: (value: string) => void;
}

export interface PreviewWindowProps {
  html: string;
  css: string;
  js: string;
}

export interface EditorSectionProps {
  title: string;
  language: 'html' | 'css' | 'javascript';
  value: string;
  onChange: (value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface EditableSyntaxHighlighterProps {
  value: string;
  language: 'html' | 'css';
  onChange: (value: string) => void;
  className?: string;
}
