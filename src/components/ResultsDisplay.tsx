import { useState, useEffect, useRef } from 'react';
import { LspDiagnostic, TypeHint } from '../types';
import { transform } from '@babel/standalone';

interface ResultsDisplayProps {
  compiledCode: string;
  errors: LspDiagnostic[];
  hints: TypeHint[];
}

function ResultsDisplay({ compiledCode }: ResultsDisplayProps) {
  const iframeRef = useRef(null);
  const [iframeContent, setIframeContent] = useState('');


  useEffect(() => {
    try {
      if (!compiledCode.trim()) {
        setIframeContent('');
        return;
      }

      // Step 1: Transpile the JSX
      const { code: transpiledCode } = transform(compiledCode, {
        presets: ['react', 'env'],
        plugins: [
          ['transform-modules-commonjs', { strictMode: false }]
        ]
      });

      // Step 2: Create safe HTML template
      const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
                <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
                <style>
                  body { margin: 0; padding: 10px; }
                  * { box-sizing: border-box; }
                </style>
              </head>
              <body>
                <div id="root"></div>
                <script>
                  // If the user uses 'import ... from "react"', we want to support "require":
                  const require = (id) => {
                    if (id === 'react') {
                      return React;
                    }
                    throw new Error('Module not found: ' + id);
                  };
                  
                  const exports = {};
                  const module = { exports };
                  ${transpiledCode}
                  
                  try {
                    const Component = module.exports.Component;
                    if (!Component) {
                      throw new Error('No Component exported');
                    }
                    ReactDOM.render(
                      React.createElement(Component),
                      document.getElementById('root')
                    );
                  } catch (err) {
                    document.body.innerHTML = '<div style="color: red">Error: ' + err.message + '</div>';
                  }
                </script>
              </body>
            </html>
          `;

      // Step 3: Update iframe content
      setIframeContent(html);
    } catch (err) {
      console.log(err)
    }
  }, [compiledCode]);

  return (
    <div className="results-display">
      <iframe
        ref={iframeRef}
        srcDoc={iframeContent}
        sandbox="allow-scripts"
        title="preview"
        style={{ width: '100%', height: '300px', border: 'none' }}
        // Key forces remount when content changes
        key={iframeContent}
      />
    </div>
  );
}

export default ResultsDisplay;
