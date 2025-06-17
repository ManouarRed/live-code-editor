
import React, { useState, useCallback } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { PreviewWindow } from './components/PreviewWindow';
import type { CodeState } from './types';

const DEFAULT_HTML = `<!-- Welcome to the Code Editor! -->
<div class="container">
  <h1>Hello, Coder!</h1>
  <p style="color: #9CDCFE;">Edit HTML, CSS, and JavaScript on the left.</p>
  <p>See your changes live on the right!</p>
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

const App: React.FC = () => {
  const [code, setCode] = useState<CodeState>({
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    js: DEFAULT_JS,
  });

  const handleHtmlChange = useCallback((value: string) => {
    setCode(prev => ({ ...prev, html: value }));
  }, []);

  const handleCssChange = useCallback((value: string) => {
    setCode(prev => ({ ...prev, css: value }));
  }, []);

  const handleJsChange = useCallback((value: string) => {
    setCode(prev => ({ ...prev, js: value }));
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[var(--theme-bg-global)] text-[var(--theme-text-primary)]">
      <div className="md:w-1/2 w-full h-1/2 md:h-full flex flex-col p-1 border-r editor-border-strong">
        <CodeEditor
          html={code.html}
          css={code.css}
          js={code.js}
          onHtmlChange={handleHtmlChange}
          onCssChange={handleCssChange}
          onJsChange={handleJsChange}
        />
      </div>
      <div className="md:w-1/2 w-full h-1/2 md:h-full flex flex-col">
        <PreviewWindow html={code.html} css={code.css} js={code.js} />
      </div>
    </div>
  );
};

export default App;
