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

export interface ESLintResult {
  results: any[]; // Consider refining with an ESLint JSON schema later
  topRules: Array<[string, number]>;
  error?: string;
}
