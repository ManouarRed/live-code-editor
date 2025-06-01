
import React, { useState, useCallback } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { PreviewWindow } from './components/PreviewWindow';
import type { CodeState } from './types';

const DEFAULT_HTML = `<h1>Hello, Live Preview!</h1>
<p>Type your HTML content here.</p>
<button id="myButton">Click Me</button>
<div class="dynamic-box">Hover over me!</div>
`;

const DEFAULT_CSS = `body { 
  font-family: Arial, sans-serif; 
  margin: 20px; 
  background-color: #f0f0f0; 
  color: #333; 
  transition: background-color 0.3s ease;
}

h1 { 
  color: steelblue; 
  text-align: center;
}

p {
  color: #555;
}

button { 
  padding: 10px 15px; 
  background-color: #4CAF50; /* Green */
  color: white; 
  border: none; 
  border-radius: 5px; 
  cursor: pointer;
  display: block;
  margin: 10px auto;
  transition: background-color 0.3s ease;
}

button:hover { 
  background-color: #45a049; 
}

.dynamic-box {
  width: 150px;
  height: 100px;
  background-color: orange;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dynamic-box:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
`;

const DEFAULT_JS = `console.log("Preview JS initialized!");

const button = document.getElementById("myButton");
if (button) {
  button.addEventListener("click", () => {
    alert("Button clicked! JavaScript is working correctly.");
  });
}

const dynamicBox = document.querySelector(".dynamic-box");
if (dynamicBox) {
  dynamicBox.addEventListener("mouseenter", () => {
    dynamicBox.textContent = "Magic!";
    document.body.style.backgroundColor = "#e0e0ff";
  });
  dynamicBox.addEventListener("mouseleave", () => {
    dynamicBox.textContent = "Hover over me!";
    document.body.style.backgroundColor = "#f0f0f0";
  });
}
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
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-100">
      <div className="md:w-1/2 w-full h-1/2 md:h-full flex flex-col p-1 border-r border-gray-700">
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
