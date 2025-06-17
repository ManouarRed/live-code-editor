
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { PreviewWindow } from './components/PreviewWindow';
import type { CodeState } from './types';

const DEFAULT_HTML = `<!-- Welcome to the Code Editor! -->
<div class="container">
  <h1 style="color: #569CD6; font-family: 'Segoe UI', sans-serif;">Hello, Coder!</h1>
  <p style="color: #9CDCFE; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">Edit HTML, CSS, and JavaScript on the left.</p>
  <p style="font-weight: bold;">See your changes live on the right!</p>
  <button id="actionButton">Test JS</button>
</div>

<style>
  /* You can also embed styles here */
  .container {
    padding: 20px;
    border-radius: 8px;
    background-color: #252526; /* Slightly different from main editor bg */
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
</style>
`;

const DEFAULT_CSS = `/* Global styles for your preview */
body { 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
  margin: 0; 
  padding: 15px;
  background-color: #121212; /* Dark background for preview content */
  color: var(--theme-text-primary, #D4D4D4); 
  transition: background-color 0.3s ease;
}

h1 { 
  color: #569CD6; /* Blue for headings */
  text-align: center;
  margin-bottom: 20px;
}

p {
  line-height: 1.6;
  margin-bottom: 10px;
}

button { 
  display: block;
  margin: 20px auto;
  padding: 10px 20px; 
  background-color: #007ACC; 
  color: white; 
  border: none; 
  border-radius: 5px; 
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s ease;
}

button:hover { 
  background-color: #005A9E; 
}

/* Example of a more specific selector */
.container > p {
  font-style: italic;
  color: #808080; /* Secondary text color */
}
`;

const DEFAULT_JS = `// JavaScript for your preview
console.log("Preview JavaScript Initialized!");

const button = document.getElementById("actionButton");

if (button) {
  button.addEventListener("click", () => {
    alert("JavaScript is working! Button clicked.");
    
    const header = document.querySelector('h1');
    if (header) {
      header.textContent = "JS Executed!";
      header.style.color = '#B5CEA8'; // Change color on action
    }
  });
}

// Example: Add a new element
function addDynamicMessage() {
  const container = document.querySelector('.container');
  if (container) {
    const newMessage = document.createElement('p');
    newMessage.textContent = 'This message was added by JavaScript dynamically.';
    newMessage.style.color = '#CE9178'; // Orange-brown
    container.appendChild(newMessage);
  }
}

// Call it after a delay
setTimeout(addDynamicMessage, 1500);
`;

const HISTORY_LIMIT = 50;

type HistoryEntry = { html: string; css: string; js: string; };

const App: React.FC = () => {
  const [code, setCode] = useState<CodeState>({
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    js: DEFAULT_JS,
  });

  const undoStackRef = useRef<HistoryEntry[]>([]);
  const redoStackRef = useRef<HistoryEntry[]>([]);
  // To prevent pushing initial state or same state multiple times
  const lastPushedStateRef = useRef<CodeState | null>(null);

  const pushToUndoStack = useCallback((currentState: CodeState) => {
    if (lastPushedStateRef.current && 
        lastPushedStateRef.current.html === currentState.html &&
        lastPushedStateRef.current.css === currentState.css &&
        lastPushedStateRef.current.js === currentState.js) {
      return; // Avoid pushing identical state
    }

    undoStackRef.current = [...undoStackRef.current, currentState].slice(-HISTORY_LIMIT);
    redoStackRef.current = []; // Clear redo stack on new change
    lastPushedStateRef.current = currentState; // Update last pushed state
  }, []);

  const handleHtmlChange = useCallback((value: string) => {
    pushToUndoStack(code);
    setCode(prev => ({ ...prev, html: value }));
  }, [code, pushToUndoStack]);

  const handleCssChange = useCallback((value: string) => {
    pushToUndoStack(code);
    setCode(prev => ({ ...prev, css: value }));
  }, [code, pushToUndoStack]);

  const handleJsChange = useCallback((value: string) => {
    pushToUndoStack(code);
    setCode(prev => ({ ...prev, js: value }));
  }, [code, pushToUndoStack]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length > 0) {
      const previousState = undoStackRef.current[undoStackRef.current.length - 1];
      undoStackRef.current = undoStackRef.current.slice(0, -1);
      redoStackRef.current = [code, ...redoStackRef.current].slice(-HISTORY_LIMIT);
      setCode(previousState);
      lastPushedStateRef.current = previousState; // Update last state to prevent immediate re-push
    }
  }, [code]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      const nextState = redoStackRef.current[0];
      redoStackRef.current = redoStackRef.current.slice(1);
      undoStackRef.current = [...undoStackRef.current, code].slice(-HISTORY_LIMIT);
      setCode(nextState);
      lastPushedStateRef.current = nextState; // Update last state
    }
  }, [code]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) { // Meta key for MacOS
        if (event.key === 'z' || event.key === 'Z') {
          event.preventDefault();
          if (event.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (event.key === 'y' || event.key === 'Y') {
          event.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  return (
    <div className="flex flex-col h-screen bg-[var(--theme-bg-global)] text-[var(--theme-text-primary)]">
      <div className="p-2 editor-header-bg border-b editor-border-strong flex items-center space-x-2">
        <button
          onClick={handleUndo}
          disabled={undoStackRef.current.length === 0}
          className="px-3 py-1 bg-[var(--theme-focus-ring)] text-white rounded disabled:opacity-50 hover:bg-opacity-80 transition-opacity"
          aria-label="Undo change (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStackRef.current.length === 0}
          className="px-3 py-1 bg-[var(--theme-focus-ring)] text-white rounded disabled:opacity-50 hover:bg-opacity-80 transition-opacity"
          aria-label="Redo change (Ctrl+Y)"
        >
          Redo
        </button>
         <span className="text-sm text-[var(--theme-text-secondary)]"> (Ctrl+Z, Ctrl+Y/Ctrl+Shift+Z)</span>
      </div>
      <div className="flex flex-col md:flex-row flex-1 min-h-0"> {/* Ensure flex-1 and min-h-0 for proper flex shrink/grow */}
        <div className="md:w-1/2 w-full h-1/2 md:h-full flex flex-col p-1 border-r editor-border-strong overflow-hidden">
          <CodeEditor
            html={code.html}
            css={code.css}
            js={code.js}
            onHtmlChange={handleHtmlChange}
            onCssChange={handleCssChange}
            onJsChange={handleJsChange}
          />
        </div>
        <div className="md:w-1/2 w-full h-1/2 md:h-full flex flex-col overflow-hidden">
          <PreviewWindow html={code.html} css={code.css} js={code.js} />
        </div>
      </div>
    </div>
  );
};

export default App;
