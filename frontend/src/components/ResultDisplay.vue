
<template>
  <div>
    <!-- Overview Bar -->
    <OverviewBar v-if="(isESLint && lintResult && lintResult.results) || (!isESLint && llmResult && llmResult.results)">
      <template v-if="isESLint && lintResult && lintResult.results">
        <span class="px-2 py-1 rounded bg-gray-100">Files: <span class="font-bold">{{ lintResult.results.length }}</span></span>
        <span class="px-2 py-1 rounded bg-red-100 text-red-700">Errors: <span class="font-bold">{{ totalErrors }}</span></span>
        <span class="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Warnings: <span class="font-bold">{{ totalWarnings }}</span></span>
        <span class="px-2 py-1 rounded bg-green-100 text-green-700">Clean: <span class="font-bold">{{ cleanFiles.length }}</span></span>
      </template>
      <template v-else-if="!isESLint && llmResult && llmResult.results">
        <span class="px-2 py-1 rounded bg-gray-100">Files: <span class="font-bold">{{ llmFilesCount }}</span></span>
        <span class="px-2 py-1 rounded bg-red-100 text-red-700">Errors: <span class="font-bold">{{ llmErrors }}</span></span>
        <span class="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Parse Errors: <span class="font-bold">{{ llmParseErrors }}</span></span>
        <span class="px-2 py-1 rounded bg-green-100 text-green-700">Clean: <span class="font-bold">{{ llmClean }}</span></span>
      </template>
      <template #actions>
        <button @click="openJson" class="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold">Open JSON</button>
      </template>
    </OverviewBar>

  <!-- Outer scrollable panel so long tables remain scrollable -->
  <div class="overflow-y-auto max-h-[65vh] border rounded px-2 py-2">
      <!-- Errors Table -->
      <div v-if="isESLint && errorFiles.length" class="mb-6">
        <div class="font-semibold text-red-700 mb-2">Files with Errors</div>
        <table class="w-full text-xs border table-auto">
          <thead class="bg-red-50">
            <tr>
              <th class="text-left p-2">File</th>
              <th class="text-left p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in errorFiles" :key="file.filePath">
              <td class="border-b p-2 font-mono">{{ file.filePath }}</td>
              <td class="border-b p-2">
                <div v-for="msg in file.messages.filter((m: ESLintMessage) => m.severity === 2)" :key="msg.ruleId + msg.line + msg.column" class="mb-1">
                  <span class="font-bold text-red-700">{{ msg.ruleId }}</span>: {{ msg.message }} <span class="text-gray-500">(Line {{ msg.line }})</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Warnings Table -->
      <div v-if="isESLint && warningFiles.length" class="mb-6">
        <div class="font-semibold text-yellow-700 mb-2">Files with Warnings</div>
        <table class="w-full text-xs border table-auto">
          <thead class="bg-yellow-50">
            <tr>
              <th class="text-left p-2">File</th>
              <th class="text-left p-2">Warning</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in warningFiles" :key="file.filePath">
              <td class="border-b p-2 font-mono">{{ file.filePath }}</td>
              <td class="border-b p-2">
                <div v-for="msg in file.messages.filter((m: ESLintMessage) => m.severity === 1)" :key="msg.ruleId + msg.line + msg.column" class="mb-1">
                  <span class="font-bold text-yellow-700">{{ msg.ruleId }}</span>: {{ msg.message }} <span class="text-gray-500">(Line {{ msg.line }})</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Clean Files Table -->
      <div v-if="isESLint && cleanFiles.length" class="mb-6">
        <div class="font-semibold text-green-700 mb-2">Clean Files</div>
        <table class="w-full text-xs border table-auto">
          <thead class="bg-green-50">
            <tr>
              <th class="text-left p-2">File</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in cleanFiles" :key="file.filePath">
              <td class="border-b p-2 font-mono">{{ file.filePath }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- LLM Results grouped similarly to ESLint -->
      <div v-if="!isESLint && llmResult && llmResult.results" class="mb-6">
        <div v-if="llmErrorsList.length" class="mb-6">
          <div class="font-semibold text-red-700 mb-2">Files with Errors</div>
          <table class="w-full text-xs border table-auto">
            <thead class="bg-red-50">
              <tr>
                <th class="text-left p-2">File</th>
                <th class="text-left p-2">Issue</th>
                <th class="text-left p-2">NLOC</th>
                <th class="text-left p-2">Cyclomatic</th>
                <th class="text-left p-2">Cognitive</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in llmErrorsList" :key="r.file || r.filePath">
                <td class="border-b p-2 font-mono">{{ (r.file || r.filePath || '').split('/').slice(-2).join('/') }}</td>
                <td class="border-b p-2 text-red-700">{{ r.error || 'Error' }}</td>
                <td class="border-b p-2 text-center">{{ r.nloc !== undefined ? r.nloc : '-' }}</td>
                <td class="border-b p-2 text-center"><span :style="getComplexityColor(r.cyclomatic_complexity, 'cyclomatic')">{{ r.cyclomatic_complexity ?? '-' }}</span></td>
                <td class="border-b p-2 text-center"><span :style="getComplexityColor(r.cognitive_complexity, 'cognitive')">{{ r.cognitive_complexity ?? '-' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="llmParseList.length" class="mb-6">
          <div class="font-semibold text-yellow-700 mb-2">Files with Parse Errors</div>
          <table class="w-full text-xs border table-auto">
            <thead class="bg-yellow-50">
              <tr>
                <th class="text-left p-2">File</th>
                <th class="text-left p-2">Raw Response</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in llmParseList" :key="r.file || r.filePath">
                <td class="border-b p-2 font-mono">{{ (r.file || r.filePath || '').split('/').slice(-2).join('/') }}</td>
                <td class="border-b p-2 font-mono text-xs whitespace-pre-wrap">{{ r.raw_response || r.rawResponse || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="llmCleanList.length" class="mb-6">
          <div class="font-semibold text-green-700 mb-2">Clean Files</div>
          <table class="w-full text-xs border table-auto">
            <thead class="bg-green-50">
              <tr>
                <th class="text-left p-2">File</th>
                <th class="text-left p-2">Component</th>
                <th class="text-left p-2">NLOC</th>
                <th class="text-left p-2">Cyclomatic</th>
                <th class="text-left p-2">Cognitive</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in llmCleanList" :key="r.file || r.filePath">
                <td class="border-b p-2 font-mono">{{ (r.file || r.filePath || '').split('/').slice(-2).join('/') }}</td>
                <td class="border-b p-2">{{ r.component || r.ruleId || 'N/A' }}</td>
                <td class="border-b p-2 text-center">{{ r.nloc !== undefined ? r.nloc : '-' }}</td>
                <td class="border-b p-2 text-center"><span :style="getComplexityColor(r.cyclomatic_complexity, 'cyclomatic')">{{ r.cyclomatic_complexity ?? '-' }}</span></td>
                <td class="border-b p-2 text-center"><span :style="getComplexityColor(r.cognitive_complexity, 'cognitive')">{{ r.cognitive_complexity ?? '-' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="!isESLint && (!llmResult || !llmResult.results)" class="flex items-center justify-center flex-1">
      <span class="w-full text-center text-gray-400 italic">No analysis results yet.</span>
    </div>
    <div v-if="isESLint && (!lintResult || !lintResult.results)" class="flex items-center justify-center flex-1">
      <span class="w-full text-center text-gray-400 italic">No analysis results yet.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
import OverviewBar from './OverviewBar.vue';

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
  lintResult: Object as PropType<any>,
  llmResult: Object as PropType<any>,
  viewMode: {
    type: String as PropType<'table' | 'json'>,
    default: 'table'
  },
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
type ESLintMessage = {
  ruleId: string;
  severity: number;
  message: string;
  line: number;
  column: number;
};
type ESLintFileResult = {
  filePath: string;
  messages: ESLintMessage[];
  errorCount: number;
  fatalErrorCount: number;
  warningCount: number;
};

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
const llmFiles = computed(() => {
  return props.llmResult && Array.isArray(props.llmResult.results) ? props.llmResult.results : [];
});
const llmFilesCount = computed(() => llmFiles.value.length);
const llmErrorsList = computed(() => llmFiles.value.filter((r: any) => r.error));
const llmParseList = computed(() => llmFiles.value.filter((r: any) => r.parsing_error));
const llmCleanList = computed(() => llmFiles.value.filter((r: any) => !r.error && !r.parsing_error));
const llmErrors = computed(() => llmErrorsList.value.length);
const llmParseErrors = computed(() => llmParseList.value.length);
const llmClean = computed(() => llmCleanList.value.length);

function getComplexityColor(value: number, type: 'cyclomatic' | 'cognitive' = 'cyclomatic') {
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
</script>
