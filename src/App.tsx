import { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import ResultsDisplay from './components/ResultsDisplay';
import compile from "@chicory-lang/compiler";
import { CompileResult } from './types';
import { Allotment } from "allotment";
import './App.css';
import "allotment/dist/style.css";

// Consider including an example of bind...
// bind {
//   useState as (T) => [T, (T) => void]
// } from "react"

const DEFAULT_CODE = `// Welcome to the Chicory Playground!
// Try writing some Chicory code below:
type User =
  | LoggedIn(string)
  | Guest

const Component = () => {
  const u = LoggedIn("Luke")
  // const u = LoggedIn("John")
  // const u = Guest

  const welcomeText = match(u) {
    LoggedIn("Luke") => "Welcome, Mr Skywalker",
    LoggedIn(p) => "Hi " + p,
    Guest => "Welcome New User!"
  }

  <div>
    <h1>{"Compiled Chicory Code"}</h1>
    <p>{welcomeText}</p>
  </div>
}
export { Component }`

function App() {
  const [chicoryCode, setChicoryCode] = useState(DEFAULT_CODE);
  const [compileResult, setCompileResult] = useState<CompileResult>({ code: '', errors: [], hints: [] });

  useEffect(() => {
    // Compile the initial code
    handleCompile(DEFAULT_CODE);
  }, []);

  const handleCodeChange = (newCode: string) => {
    setChicoryCode(newCode);
    handleCompile(newCode);
  };

  const handleCompile = (code: string) => {
    try {
      const result = compile(code);
      setCompileResult(result);
    } catch (error) {
      console.error("Compilation error:", error);
      setCompileResult({
        code: '',
        errors: [{
          severity: 1,
          message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
          source: 'chicory-compiler'
        }],
        hints: []
      });
    }
  };

  return (
    <Allotment vertical={false} defaultSizes={[2,1]}>
      <CodeEditor
        initialCode={chicoryCode}
        onCodeChange={handleCodeChange}
        errors={compileResult.errors}
        hints={compileResult.hints}
      />
      <ResultsDisplay
        compiledCode={compileResult.code}
        errors={compileResult.errors}
        hints={compileResult.hints}
      />
    </Allotment>
  );
}

export default App;
