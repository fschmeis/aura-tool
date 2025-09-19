import { watch, type Ref } from 'vue';

function lintKey(path: string | null) {
  return path ? `aura-eslint-result-${path}` : 'aura-eslint-result';
}
function llmKey(path: string | null) {
  return path ? `aura-llm-result-${path}` : 'aura-llm-result';
}

export function useResultsPersistence(
  repoPath: Ref<string | null>,
  lintResult: Ref<any>,
  llmResult: Ref<any>
) {
  function load() {
    const path = repoPath.value;
    try {
      const savedLint = localStorage.getItem(lintKey(path));
      const savedLLM = localStorage.getItem(llmKey(path));
      lintResult.value = savedLint ? JSON.parse(savedLint) : null;
      llmResult.value = savedLLM ? JSON.parse(savedLLM) : null;
    } catch {
      lintResult.value = null;
      llmResult.value = null;
    }
  }

  // Persist results to localStorage per repo
  watch([lintResult, repoPath], ([val, path]) => {
    if (path) {
      if (val) localStorage.setItem(lintKey(path), JSON.stringify(val));
      else localStorage.removeItem(lintKey(path));
    }
  });
  watch([llmResult, repoPath], ([val, path]) => {
    if (path) {
      if (val) localStorage.setItem(llmKey(path), JSON.stringify(val));
      else localStorage.removeItem(llmKey(path));
    }
  });

  return { load };
}
