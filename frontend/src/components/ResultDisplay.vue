
<template>
  <div>
    <!-- Show results if we have them -->
    <div v-if="(isESLint && lintResult && lintResult.results && lintResult.results.length > 0) || (!isESLint && llmResult && llmResult.results && llmResult.results.length > 0)" class="p-6">
      <!-- Overview Bar -->
      <div class="mb-6">
        <OverviewBar>
          <template v-if="isESLint && lintResult && lintResult.results">
            <span class="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm font-medium">Files: <span class="font-bold">{{ lintResult.results.length }}</span></span>
            <span class="px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-sm font-medium">Errors: <span class="font-bold">{{ totalErrors }}</span></span>
            <span class="px-3 py-1.5 rounded-md bg-yellow-50 text-yellow-700 text-sm font-medium">Warnings: <span class="font-bold">{{ totalWarnings }}</span></span>
            <span class="px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-sm font-medium">Clean: <span class="font-bold">{{ cleanFiles.length }}</span></span>
          </template>
          <template v-else-if="!isESLint && llmResult && llmResult.results">
            <span class="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm font-medium">Files: <span class="font-bold">{{ llmFilesCount }}</span></span>
            <span class="px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-sm font-medium">Errors: <span class="font-bold">{{ llmErrors }}</span></span>
            <span class="px-3 py-1.5 rounded-md bg-yellow-50 text-yellow-700 text-sm font-medium">Parse Errors: <span class="font-bold">{{ llmParseErrors }}</span></span>
            <span class="px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-sm font-medium">Clean: <span class="font-bold">{{ llmClean }}</span></span>
          </template>
          <template #actions>
            <button @click="openJson" class="px-4 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium transition-colors">
              Open JSON
            </button>
          </template>
        </OverviewBar>
      </div>

      <!-- Scrollable Results Content -->
      <div class="overflow-y-auto max-h-[65vh] border rounded-lg bg-gray-50">
        <!-- ESLint Results -->
        <div v-if="isESLint">
          <!-- Errors Table -->
          <div v-if="errorFiles.length" class="bg-white m-4 rounded-lg border">
            <div class="px-4 py-3 border-b bg-red-50 rounded-t-lg">
              <h3 class="font-semibold text-red-800 text-sm">Files with Errors</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">File</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Error</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="file in errorFiles" :key="file.filePath" class="hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-xs text-gray-800 w-1/3">{{ file.filePath }}</td>
                    <td class="py-3 px-4">
                      <div v-for="msg in file.messages.filter((m: ESLintMessage) => m.severity === 2)" :key="msg.ruleId + msg.line + msg.column" class="mb-2 last:mb-0">
                        <span class="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">{{ msg.ruleId }}</span>
                        <span class="ml-2 text-sm">{{ msg.message }}</span>
                        <span class="ml-2 text-xs text-gray-500">(Line {{ msg.line }})</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Warnings Table -->
          <div v-if="warningFiles.length" class="bg-white m-4 rounded-lg border">
            <div class="px-4 py-3 border-b bg-yellow-50 rounded-t-lg">
              <h3 class="font-semibold text-yellow-800 text-sm">Files with Warnings</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">File</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Warning</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="file in warningFiles" :key="file.filePath" class="hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-xs text-gray-800 w-1/3">{{ file.filePath }}</td>
                    <td class="py-3 px-4">
                      <div v-for="msg in file.messages.filter((m: ESLintMessage) => m.severity === 1)" :key="msg.ruleId + msg.line + msg.column" class="mb-2 last:mb-0">
                        <span class="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">{{ msg.ruleId }}</span>
                        <span class="ml-2 text-sm">{{ msg.message }}</span>
                        <span class="ml-2 text-xs text-gray-500">(Line {{ msg.line }})</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Clean Files Table -->
          <div v-if="cleanFiles.length" class="bg-white m-4 rounded-lg border">
            <div class="px-4 py-3 border-b bg-green-50 rounded-t-lg">
              <h3 class="font-semibold text-green-800 text-sm">Clean Files</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">File</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="file in cleanFiles" :key="file.filePath" class="hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-xs text-gray-800">{{ file.filePath }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- LLM Results -->
        <div v-else-if="!isESLint && llmResult && llmResult.results">
          <!-- LLM Error Files -->
          <div v-if="llmErrorsList.length" class="bg-white m-4 rounded-lg border">
            <div class="px-4 py-3 border-b bg-red-50 rounded-t-lg">
              <h3 class="font-semibold text-red-800 text-sm">Files with Issues</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">File</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Issue</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">NLOC</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Cyclomatic</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Cognitive</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="r in llmErrorsList" :key="getFileKey(r)" class="hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-xs text-gray-800">{{ getFileName(r) }}</td>
                    <td class="py-3 px-4 text-red-700">{{ r.error || 'Error' }}</td>
                    <td class="py-3 px-4 text-center">{{ r.nloc !== undefined ? r.nloc : '-' }}</td>
                    <td class="py-3 px-4 text-center"><span :style="getComplexityColor(r.cyclomatic_complexity, 'cyclomatic')">{{ r.cyclomatic_complexity ?? '-' }}</span></td>
                    <td class="py-3 px-4 text-center"><span :style="getComplexityColor(r.cognitive_complexity, 'cognitive')">{{ r.cognitive_complexity ?? '-' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- LLM Parse Errors -->
          <div v-if="llmParseList.length" class="bg-white m-4 rounded-lg border">
            <div class="px-4 py-3 border-b bg-yellow-50 rounded-t-lg">
              <h3 class="font-semibold text-yellow-800 text-sm">Files with Parse Errors</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">File</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Raw Response</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="r in llmParseList" :key="getFileKey(r)" class="hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-xs text-gray-800">{{ getFileName(r) }}</td>
                    <td class="py-3 px-4 font-mono text-xs whitespace-pre-wrap">{{ r.raw_response || r.rawResponse || '' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- LLM Clean Files -->
          <div v-if="llmCleanList.length" class="bg-white m-4 rounded-lg border">
            <div class="px-4 py-3 border-b bg-green-50 rounded-t-lg">
              <h3 class="font-semibold text-green-800 text-sm">Clean Files</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">File</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Component</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">NLOC</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Cyclomatic</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-700">Cognitive</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="r in llmCleanList" :key="getFileKey(r)" class="hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-xs text-gray-800">{{ getFileName(r) }}</td>
                    <td class="py-3 px-4">{{ r.component || r.ruleId || 'N/A' }}</td>
                    <td class="py-3 px-4 text-center">{{ r.nloc !== undefined ? r.nloc : '-' }}</td>
                    <td class="py-3 px-4 text-center"><span :style="getComplexityColor(r.cyclomatic_complexity, 'cyclomatic')">{{ r.cyclomatic_complexity ?? '-' }}</span></td>
                    <td class="py-3 px-4 text-center"><span :style="getComplexityColor(r.cognitive_complexity, 'cognitive')">{{ r.cognitive_complexity ?? '-' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No results message - only show when there are no results -->
    <div v-else class="flex items-center justify-center py-16">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-4 text-sm font-medium text-gray-600">No analysis results yet</h3>
        <p class="mt-1 text-sm text-gray-400">Run an analysis to see results here</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
import OverviewBar from './OverviewBar.vue';
import type { ESLintResult, LLMResult, LLMFileResult, ESLintFileResult, ESLintMessage } from '../types/results';

function openJson() {
  // Choose which JSON to open: ESLint results or LLM results
  const payload = props.isESLint ? props.lintResult : props.llmResult;
  if (!payload) return;

  // The backend mounts the route under /api/llm
  fetch('/api/llm/open-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: payload })
  }).catch((e) => {
    // best-effort: nothing fancy here
    console.error('Failed to request open-json', e);
  });
}

const props = defineProps({
  lintResult: Object as PropType<ESLintResult>,
  llmResult: Object as PropType<LLMResult>,
  resultLabel: {
    type: String,
    default: ''
  },
  isESLint: {
    type: Boolean,
    default: false
  }
});

// ESLint summary and grouping logic
const errorFiles = computed(() => {
  if (!props.lintResult?.results) return [];
  return props.lintResult.results.filter((f: ESLintFileResult) => (f.errorCount > 0 || f.fatalErrorCount > 0));
});
const warningFiles = computed(() => {
  if (!props.lintResult?.results) return [];
  return props.lintResult.results.filter((f: ESLintFileResult) => (f.warningCount > 0 && f.errorCount === 0 && f.fatalErrorCount === 0));
});
const cleanFiles = computed(() => {
  if (!props.lintResult?.results) return [];
  return props.lintResult.results.filter((f: ESLintFileResult) => (f.errorCount === 0 && f.fatalErrorCount === 0 && f.warningCount === 0));
});
const totalErrors = computed(() => {
  if (!props.lintResult?.results) return 0;
  return props.lintResult.results.reduce((sum: number, f: ESLintFileResult) => sum + (f.errorCount || 0) + (f.fatalErrorCount || 0), 0);
});
const totalWarnings = computed(() => {
  if (!props.lintResult?.results) return 0;
  return props.lintResult.results.reduce((sum: number, f: ESLintFileResult) => sum + (f.warningCount || 0), 0);
});

// LLM grouping and counts (to mirror ESLint overview)
const llmFiles = computed((): LLMFileResult[] => {
  return props.llmResult && Array.isArray(props.llmResult.results) ? props.llmResult.results : [];
});
const llmFilesCount = computed(() => llmFiles.value.length);
const llmErrorsList = computed(() => llmFiles.value.filter((r: LLMFileResult) => r.error));
const llmParseList = computed(() => llmFiles.value.filter((r: LLMFileResult) => r.parsing_error));
const llmCleanList = computed(() => llmFiles.value.filter((r: LLMFileResult) => !r.error && !r.parsing_error));
const llmErrors = computed(() => llmErrorsList.value.length);
const llmParseErrors = computed(() => llmParseList.value.length);
const llmClean = computed(() => llmCleanList.value.length);

function getComplexityColor(value: number | undefined, type: 'cyclomatic' | 'cognitive' = 'cyclomatic') {
  if (value === undefined || value === null) return 'text-gray-500';
  if (type === 'cyclomatic') {
    if (value <= 5) return 'text-green-600';
    if (value <= 10) return 'text-yellow-600';
    return 'text-red-600';
  } else {
    if (value <= 5) return 'text-green-600';
    if (value <= 15) return 'text-yellow-600';
    return 'text-red-600';
  }
}

function getFileName(result: LLMFileResult): string {
  const filePath = result.file || result.filePath || '';
  if (typeof filePath === 'string') {
    return filePath.split('/').slice(-2).join('/');
  }
  return String(filePath);
}

function getFileKey(result: LLMFileResult): string {
  return result.file || String(result.filePath) || Math.random().toString();
}
</script>
