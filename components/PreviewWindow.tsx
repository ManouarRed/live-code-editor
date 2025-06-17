
import React, { useEffect, useRef } from 'react';
import type { PreviewWindowProps } from '../types';

export const PreviewWindow = ({ html, css, js }: PreviewWindowProps): React.ReactElement => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const updatePreview = (): void => {
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
                    errorDiv.style.backgroundColor = 'rgba(128,0,0,0.8)'; // Dark red for error
                    errorDiv.style.color = '#FF8888'; // Lighter red text
                    errorDiv.style.border = '1px solid darkred';
                    errorDiv.style.borderRadius = '5px';
                    errorDiv.style.fontFamily = "'Courier New', Courier, monospace";
                    errorDiv.style.fontSize = "12px";
                    // Sanitize error message
                    const errorMessage = (error instanceof Error) ? error.message : String(error);
                    errorDiv.textContent = 'JS RUNTIME EXCEPTION: ' + JSON.stringify(errorMessage).slice(1, -1);
                    document.body.appendChild(errorDiv);
                    setTimeout(() => errorDiv.remove(), 7000);
                  }
                <\/script>
              </body>
            </html>
          `);
          document.close();
        }
      }
    };
    
    const timeoutId = setTimeout(updatePreview, 250);
    return () => clearTimeout(timeoutId);

  }, [html, css, js]);

  return (
    <div className="flex-1 w-full h-full bg-gray-100 overflow-hidden">
       <h2 className="text-lg font-semibold p-3 matrix-header-bg matrix-text-header border-b matrix-border-strong">
        Live Preview
      </h2>
      <iframe
        ref={iframeRef}
        title="Preview"
        sandbox="allow-scripts allow-same-origin" 
        className="w-full h-[calc(100%-48px)] border-0 bg-white" 
        loading="lazy"
      />
    </div>
  );
};
