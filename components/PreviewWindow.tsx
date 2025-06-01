
import React, { useEffect, useRef } from 'react';
import type { PreviewWindowProps } from '../types';

export const PreviewWindow: React.FC<PreviewWindowProps> = ({ html, css, js }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const updatePreview = () => {
      if (iframeRef.current) {
        const document = iframeRef.current.contentDocument;
        if (document) {
          document.open();
          document.write(`
            <html>
              <head>
                <style>${css}</style>
              </head>
              <body>
                ${html}
                <script>
                  try {
                    ${js}
                  } catch (error) {
                    console.error("Error in preview JavaScript:", error);
                    const errorDiv = document.createElement('div');
                    errorDiv.style.position = 'fixed';
                    errorDiv.style.bottom = '10px';
                    errorDiv.style.left = '10px';
                    errorDiv.style.padding = '10px';
                    errorDiv.style.backgroundColor = 'rgba(255,0,0,0.8)';
                    errorDiv.style.color = 'white';
                    errorDiv.style.border = '1px solid darkred';
                    errorDiv.style.borderRadius = '5px';
                    errorDiv.style.fontFamily = 'monospace';
                    errorDiv.textContent = 'JS Error: ' + error.message;
                    document.body.appendChild(errorDiv);
                    setTimeout(() => errorDiv.remove(), 5000);
                  }
                <\/script>
              </body>
            </html>
          `);
          document.close();
        }
      }
    };
    
    // Debounce the update
    const timeoutId = setTimeout(updatePreview, 250);
    return () => clearTimeout(timeoutId);

  }, [html, css, js]);

  return (
    <div className="flex-1 w-full h-full bg-gray-100 overflow-hidden">
       <h2 className="text-lg font-semibold p-3 bg-gray-700 text-gray-200 border-b border-gray-600">
        Live Preview
      </h2>
      <iframe
        ref={iframeRef}
        title="Preview"
        sandbox="allow-scripts allow-same-origin" // allow-modals allow-forms allow-popups
        className="w-full h-[calc(100%-48px)] border-0" // Adjust height to account for title
        loading="lazy"
      />
    </div>
  );
};
