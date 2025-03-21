import { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { loadWASM } from 'onigasm';
import { Registry } from 'monaco-textmate';
import { wireTmGrammars } from 'monaco-editor-textmate';
import { DiagnosticSeverity } from './types';
import { LspDiagnostic, TypeHint } from '../types';
import gruvBoxTheme from '../assets/gruvbox-light-hard.json';
import onigasmUrl from '/public/wasm/onigasm.wasm?url'


interface CodeEditorProps {
  initialCode: string;
  onCodeChange: (code: string) => void;
  errors?: LspDiagnostic[];
  hints?: TypeHint[];
}

function CodeEditor({ initialCode, onCodeChange, errors = [], hints = [] }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define and set theme
    monaco.editor.defineTheme("gruvbox", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: gruvBoxTheme.colors || {}
    });

    monaco.editor.setTheme("gruvbox");

    // Set initial value
    editor.setValue(initialCode);

    // Add change event listener
    editor.onDidChangeModelContent(() => {
      onCodeChange(editor.getValue());
    });

    // Setup Chicory language
    setupChicoryLanguage(monaco);
  };

  // Setup syntax highlighting for Chicory
  const setupChicoryLanguage = async (monaco: typeof import('monaco-editor')) => {
    try {
      // Register the Chicory language
      monaco.languages.register({ id: 'chicory' });

      // Load the WebAssembly for the tokenizer
      await loadWASM(onigasmUrl);

      // Create a registry for the TextMate grammar
      const registry = new Registry({
        getGrammarDefinition: async () => {
          const response = await fetch('chicory.tmLanguage.json');
          const grammar = await response.json();
          return {
            format: 'json',
            content: grammar
          };
        }
      });

      // Wire up the TextMate grammar to Monaco
      const grammars = new Map();
      grammars.set('chicory', 'source.chicory');

      await wireTmGrammars(monaco, registry, grammars);
    } catch (error) {
      console.error('Error setting up Chicory language:', error);
    }
  };

  // Update diagnostics (errors and hints) when they change
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const monaco = monacoRef.current;
      const model = editorRef.current.getModel();

      if (model) {
        // Clear previous markers
        monaco.editor.setModelMarkers(model, 'chicory', []);

        // Convert errors and hints to Monaco markers
        const markers = [
          ...errors.map(error => createMarker(error, DiagnosticSeverity.Error)),
        ];
        // TODO: Use hints to indicate type of var when hovered...

        // Set the markers on the model
        // TODO: Fix this...
        // @ts-expect-error It's hard to type markers...
        monaco.editor.setModelMarkers(model, 'chicory', markers);
      }
    }
  }, [errors, hints]);

  // Helper to create Monaco markers from our errors/hints
  const createMarker = (diagnostic: LspDiagnostic, severity: DiagnosticSeverity) => {
    const { range, message } = diagnostic;

    return {
      severity,
      startLineNumber: range.start.line + 1,
      startColumn: range.start.character + 1,
      endLineNumber: range.end.line + 1,
      endColumn: range.end.character + 1,
      message,
      source: 'chicory-compiler'
    };
  };

  return (
    <div className="code-editor">
      <Editor
        defaultLanguage="chicory"
        defaultValue={initialCode}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: 2,
          automaticLayout: true
        }}
      />
    </div>
  );
}

export default CodeEditor;
