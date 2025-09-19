import { ref, watch } from 'vue';
import type { LLMResult } from '../types/results';

export interface LLMRunRecord {
  id: string; // uuid or timestamp-based id
  timestamp: number; // ms epoch
  results: LLMResult;
}


function makeStorageKey(repoPath: string) {
  return `llm-history:${repoPath || 'default'}`;
}

export function useLLMHistory(repoPathRef: { value: string }) {
  const history = ref<LLMRunRecord[]>([]);

  function load() {
    if (!repoPathRef.value) {
      history.value = [];
      return;
    }
    try {
      const raw = localStorage.getItem(makeStorageKey(repoPathRef.value));
      if (raw) {
        const parsed = JSON.parse(raw) as LLMRunRecord[];
        if (Array.isArray(parsed)) {
          history.value = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load LLM history', e);
    }
  }

  function persist() {
    if (!repoPathRef.value) return;
    try {
      localStorage.setItem(makeStorageKey(repoPathRef.value), JSON.stringify(history.value));
    } catch (e) {
      console.warn('Failed to persist LLM history', e);
    }
  }

  function add(results: LLMResult) {
    const record: LLMRunRecord = {
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

  watch(() => repoPathRef.value, () => {
    load();
  }, { immediate: true });

  return { history, add, clear, load };
}
