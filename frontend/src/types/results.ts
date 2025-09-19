export interface LLMFileResult {
  file: string;
  component?: string;
  nloc?: number;
  cyclomatic_complexity?: number;
  cognitive_complexity?: number;
  parsing_error?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface LLMResult {
  results: LLMFileResult[];
  outputFile?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export interface ESLintMessage {
  ruleId: string;
  severity: number; // 1 = warning, 2 = error
  message: string;
  line: number;
  column: number;
  nodeType?: string;
  messageId?: string;
  endLine?: number;
  endColumn?: number;
  fix?: {
    range: [number, number];
    text: string;
  };
}

export interface ESLintFileResult {
  filePath: string;
  messages: ESLintMessage[];
  suppressedMessages: ESLintMessage[];
  errorCount: number;
  fatalErrorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  usedDeprecatedRules: string[];
}

export interface ESLintResult {
  results: ESLintFileResult[];
  error?: string;
}
