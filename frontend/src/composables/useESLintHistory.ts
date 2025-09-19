import { ref, watch } from 'vue';
import type { ESLintResult } from '../types/results';

export interface ESLintRunRecord {
  id: string;
  timestamp: number;
  results: ESLintResult;
}

function makeStorageKey(repoPath: string) {
  return `eslint-history:${repoPath || 'default'}`;
}

export function useESLintHistory(repoPathRef: { value: string }) {
  const history = ref<ESLintRunRecord[]>([]);

  function load() {
    if (!repoPathRef.value) {
      history.value = [];
      return;
    }
    try {
      const raw = localStorage.getItem(makeStorageKey(repoPathRef.value));
      if (raw) {
        const parsed = JSON.parse(raw) as ESLintRunRecord[];
        if (Array.isArray(parsed)) {
          history.value = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load ESLint history', e);
    }
  }

  function persist() {
    if (!repoPathRef.value) return;
    try {
      localStorage.setItem(makeStorageKey(repoPathRef.value), JSON.stringify(history.value));
    } catch (e) {
      console.warn('Failed to persist ESLint history', e);
    }
  }

  function add(results: ESLintResult) {
    const record: ESLintRunRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      timestamp: Date.now(),
      results,
    };
    history.value.unshift(record);
    // limit to last 10
    if (history.value.length > 10) history.value = history.value.slice(0, 10);
    persist();
  }

  function clear() {
    history.value = [];
    persist();
  }

  // reload when repo changes
  watch(() => repoPathRef.value, () => {
    load();
  }, { immediate: true });

  return { history, add, clear, load };
}
