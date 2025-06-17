
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
                <style>
                  /* Base styles for error message */
                  .preview-error-box {
                    position: fixed;
                    bottom: 10px;
                    left: 10px;
                    padding: 10px 15px;
                    background-color: #521313; /* Dark red background */
                    color: #FFBDBD; /* Light red/pink text */
                    border: 1px solid #800000; /* Darker red border */
                    border-radius: 5px;
                    font-family: 'Consolas', 'Menlo', 'Courier New', Courier, monospace;
                    font-size: 13px;
                    z-index: 9999;
                    max-width: calc(100% - 20px);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                  }
                  .preview-error-box strong {
                     color: #FF8F8F; /* Brighter red for title */
                  }
                </style>
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
                    errorDiv.className = 'preview-error-box';
                    const errorMessage = (error instanceof Error) ? error.message : String(error);
                    errorDiv.innerHTML = '<strong>JS EXCEPTION:</strong> ' + JSON.stringify(errorMessage).slice(1, -1).replace(/\\n/g, '<br>');
                    
                    // Check if body exists, otherwise append to documentElement for early errors
                    (document.body || document.documentElement).appendChild(errorDiv);
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
    
    // Debounce preview update
    const timeoutId = setTimeout(updatePreview, 250);
    return () => clearTimeout(timeoutId);

  }, [html, css, js]);

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[var(--theme-bg-editor)] overflow-hidden">
       <h2 className="text-lg font-semibold p-3 editor-header-bg editor-text-header border-b editor-border-strong">
        Live Preview
      </h2>
      <iframe
        ref={iframeRef}
        title="Preview"
        sandbox="allow-scripts allow-same-origin" 
        className="w-full flex-1 border-0 bg-white" /* iframe content bg is white by default */
        loading="lazy"
      />
    </div>
  );
};
