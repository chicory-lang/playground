export interface LspPosition {
  line: number;
  character: number;
}

export interface LspRange {
  start: LspPosition;
  end: LspPosition;
}

export interface LspDiagnostic {
  severity: number;
  message: string;
  range: LspRange;
  source: string;
}

export interface TypeHint {
  range: LspRange;
  type: string;
}

export interface CompileResult {
  code: string;
  errors: LspDiagnostic[];
  hints: TypeHint[];
}
