
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
  language: string;
  value: string;
  onChange: (value: string) => void;
}
