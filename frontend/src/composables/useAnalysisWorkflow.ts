import { ref, computed, type Ref } from 'vue';
import { useESLintHistory } from './useESLintHistory';
import { useLLMHistory } from './useLLMHistory';
import { useStatusHandling } from './useErrorHandling';
import type { ESLintResult, LLMResult } from '../types/results';

export function useAnalysisWorkflow(
  selectedProject: Ref<string | null>, 
  selectedAnalysisFolder: Ref<string | null>
) {
  // Analysis results
  const eslintResult = ref<ESLintResult | null>(null);
  const llmResult = ref<LLMResult | null>(null);
  
  // LLM specific settings
  const filePattern = ref<string>('*.ts,*.vue');
  const excludePattern = ref<string>('*.test.ts,**/node_modules/**,**/dist/**');
  
  // Error handling
  const { statusState: eslintError, handleAsyncOperation: handleESLintOperation } = useStatusHandling();
  const { statusState: llmError, handleAsyncOperation: handleLLMOperation } = useStatusHandling();
  
  // History management
  const { 
    history: eslintHistory, 
    add: addESLintHistoryRun, 
    load: loadESLintHistory 
  } = useESLintHistory(selectedProject as any);
  
  const { 
    history: llmHistory, 
    add: addLLMHistoryRun 
  } = useLLMHistory(selectedProject as any);
  
  // Selected history items
  const selectedESLintHistoryId = ref<string | null>(null);
  const selectedLLMHistoryId = ref<string | null>(null);

  // Computed labels for results
  const eslintResultLabel = computed(() => {
    if (selectedESLintHistoryId.value) {
      const run = eslintHistory.value.find(r => r.id === selectedESLintHistoryId.value);
      if (run) return `Loaded from History (${formatRunLabel(run)})`;
    }
    if (eslintResult.value && eslintResult.value.results && eslintResult.value.results.length) {
      return 'Current Analysis';
    }
    return '';
  });

  const llmResultLabel = computed(() => {
    if (selectedLLMHistoryId.value) {
      const run = llmHistory.value.find(r => r.id === selectedLLMHistoryId.value);
      if (run) return `Loaded from History (${formatRunLabel(run)})`;
    }
    if (llmResult.value && llmResult.value.results && llmResult.value.results.length) {
      return 'Current Analysis';
    }
    return '';
  });

  // Check if analysis can be performed
  const canRunAnalysis = computed(() => {
    return !!(selectedProject.value && selectedAnalysisFolder.value);
  });

  // Run ESLint analysis
  async function runESLint() {
    if (!canRunAnalysis.value) return;
    
    const result = await handleESLintOperation(async () => {
      const res = await fetch('/api/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoPath: selectedProject.value, 
          lintPath: selectedAnalysisFolder.value 
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      return data as ESLintResult;
    });

    if (result) {
      eslintResult.value = result;
      addESLintHistoryRun(result);
    }
  }

  // Run LLM analysis
  async function runLLM() {
    if (!canRunAnalysis.value) return;

    const result = await handleLLMOperation(async () => {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: selectedProject.value,
          srcPath: selectedAnalysisFolder.value,
          filePattern: filePattern.value,
          excludePattern: excludePattern.value
        })
      });
      
      const data = await res.json();
      console.log('LLM backend response:', data);
      
      if (data.error) throw new Error(data.error);
      
      let normalized = null;
      if (data && Array.isArray(data.results)) {
        normalized = { ...data, results: data.results };
      } else if (data && data.data && Array.isArray(data.data.results)) {
        normalized = { ...data.data, results: data.data.results };
      } else if (Array.isArray(data)) {
        normalized = { results: data };
      } else {
        normalized = { results: [], error: 'Unexpected LLM response format', raw: data };
      }
      
      // Defensive: always ensure results is an array
      if (!Array.isArray(normalized.results)) {
        normalized.results = [];
      }
      
      return normalized as LLMResult;
    });

    if (result) {
      llmResult.value = result;
      console.log('Assigned llmResult:', llmResult.value);
      addLLMHistoryRun(JSON.parse(JSON.stringify(result)));
      selectedLLMHistoryId.value = llmHistory.value[0]?.id || null;
    }
  }

  // Edit ESLint configuration
  async function editESLintConfig() {
    try {
      const res = await fetch('/api/eslint-config/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      console.log('Edit ESLint config request completed');
    } catch (e: any) {
      console.log('Edit ESLint config request completed');
    }
  }

  // Edit LLM prompt
  async function editPrompt() {
    try {
      const res = await fetch('/api/llm/edit-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      console.log('Edit prompt request completed');
    } catch (e: any) {
      console.log('Edit prompt request completed');
    }
  }

  // Load selected history
  function loadSelectedESLintHistory() {
    if (!selectedESLintHistoryId.value) return;
    const run = eslintHistory.value.find(r => r.id === selectedESLintHistoryId.value);
    if (run) {
      eslintResult.value = JSON.parse(JSON.stringify(run.results));
    }
  }

  function loadSelectedLLMHistory() {
    if (!selectedLLMHistoryId.value) return;
    const run = llmHistory.value.find(r => r.id === selectedLLMHistoryId.value);
    if (run) {
      llmResult.value = JSON.parse(JSON.stringify(run.results));
    }
  }

  // Format run labels for history display
  function formatRunLabel(run: any) {
    const d = new Date(run.timestamp);
    return d.toLocaleString();
  }

  // Clear results when project changes
  function clearResults() {
    eslintResult.value = null;
    llmResult.value = null;
    selectedESLintHistoryId.value = null;
    selectedLLMHistoryId.value = null;
  }

  return {
    // State
    eslintResult,
    llmResult,
    filePattern,
    excludePattern,
    eslintError,
    llmError,
    eslintHistory,
    llmHistory,
    selectedESLintHistoryId,
    selectedLLMHistoryId,
    eslintResultLabel,
    llmResultLabel,
    canRunAnalysis,
    
    // Actions
    runESLint,
    runLLM,
    editESLintConfig,
    editPrompt,
    loadSelectedESLintHistory,
    loadSelectedLLMHistory,
    formatRunLabel,
    clearResults,
    loadESLintHistory,
  };
}
