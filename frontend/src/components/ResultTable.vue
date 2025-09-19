<template>
  <div>
    <div v-if="items && items.length" class="mb-4 flex items-center">
      <div class="flex-1 text-sm">
        <span class="px-2 py-1 rounded bg-gray-100">Files: <span class="font-bold">{{ filesCount }}</span></span>
        <span class="px-2 py-1 rounded bg-red-100 text-red-700">Errors: <span class="font-bold">{{ errorCount }}</span></span>
        <span class="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Warnings: <span class="font-bold">{{ warningsCount }}</span></span>
        <span class="px-2 py-1 rounded bg-green-100 text-green-700">Clean: <span class="font-bold">{{ cleanCountGeneric }}</span></span>
      </div>
      <div class="ml-2">
        <slot name="open-json" />
      </div>
    </div>

    <!-- ESLint grouping: Errors, Warnings, Clean -->
    <div v-if="isEslint">
      <div v-if="errorFiles.length" class="mb-6">
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
                <div v-for="msg in file.messages.filter((m: any) => m.severity === 2)" :key="msg.ruleId + msg.line + msg.column" class="mb-1">
                  <span class="font-bold text-red-700">{{ msg.ruleId }}</span>: {{ msg.message }} <span class="text-gray-500">(Line {{ msg.line }})</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="warningFiles.length" class="mb-6">
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
                <div v-for="msg in file.messages.filter((m: any) => m.severity === 1)" :key="msg.ruleId + msg.line + msg.column" class="mb-1">
                  <span class="font-bold text-yellow-700">{{ msg.ruleId }}</span>: {{ msg.message }} <span class="text-gray-500">(Line {{ msg.line }})</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="cleanFiles.length" class="mb-6">
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
    </div>

    <!-- LLM grouping: Failed, Parse Error, Success -->
    <div v-else>
      <div v-if="failedItems.length" class="mb-6">
        <div class="font-semibold text-red-700 mb-2">Failed Analyses</div>
        <table class="w-full text-xs border table-auto">
          <thead class="bg-red-50">
            <tr>
              <th class="text-left p-2">File</th>
              <th class="text-left p-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in failedItems" :key="it.file || it.filePath">
              <td class="border-b p-2 font-mono">{{ (it.file || it.filePath || '').split('/').slice(-2).join('/') }}</td>
              <td class="border-b p-2 text-red-700">{{ it.error || 'Error' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="parseErrorItems.length" class="mb-6">
        <div class="font-semibold text-yellow-700 mb-2">Parse Errors</div>
        <table class="w-full text-xs border table-auto">
          <thead class="bg-yellow-50">
            <tr>
              <th class="text-left p-2">File</th>
              <th class="text-left p-2">Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in parseErrorItems" :key="it.file || it.filePath">
              <td class="border-b p-2 font-mono">{{ (it.file || it.filePath || '').split('/').slice(-2).join('/') }}</td>
              <td class="border-b p-2 text-yellow-700">Parse Error</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="successItems.length" class="mb-6">
        <div class="font-semibold text-green-700 mb-2">Successful Analyses</div>
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
            <tr v-for="it in successItems" :key="it.file || it.filePath">
              <td class="border-b p-2 font-mono">{{ (it.file || it.filePath || '').split('/').slice(-2).join('/') }}</td>
              <td class="border-b p-2">{{ it.component || it.ruleId || 'N/A' }}</td>
              <td class="border-b p-2 text-center">{{ it.nloc !== undefined ? it.nloc : '-' }}</td>
              <td class="border-b p-2 text-center"><span :class="getComplexityClass(it.cyclomatic_complexity)">{{ it.cyclomatic_complexity ?? '-' }}</span></td>
              <td class="border-b p-2 text-center"><span :class="getComplexityClass(it.cognitive_complexity)">{{ it.cognitive_complexity ?? '-' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';

const props = defineProps({
  isEslint: { type: Boolean, default: false },
  items: { type: Array as PropType<any[]>, default: () => [] },
  resultLabel: { type: String, default: '' }
});

const filesCount = computed(() => props.items?.length || 0);

// ESLint groupings
const errorFiles = computed(() => {
  if (!props.items) return [];
  return props.items.filter((f: any) => (f.errorCount || f.fatalErrorCount) > 0);
});
const warningFiles = computed(() => {
  if (!props.items) return [];
  return props.items.filter((f: any) => (f.warningCount || 0) > 0 && !(f.errorCount || f.fatalErrorCount));
});
const cleanFiles = computed(() => {
  if (!props.items) return [];
  return props.items.filter((f: any) => !(f.errorCount || f.fatalErrorCount || f.warningCount));
});
const totalErrors = computed(() => {
  if (!props.items) return 0;
  return props.items.reduce((s: number, f: any) => s + (f.errorCount || 0) + (f.fatalErrorCount || 0), 0);
});
const totalWarnings = computed(() => {
  if (!props.items) return 0;
  return props.items.reduce((s: number, f: any) => s + (f.warningCount || 0), 0);
});
const cleanCount = computed(() => cleanFiles.value.length);

// LLM groupings
const failedItems = computed(() => (props.items || []).filter(i => i?.error));
const parseErrorItems = computed(() => (props.items || []).filter(i => !i?.error && i?.parsing_error));
const successItems = computed(() => (props.items || []).filter(i => !i?.error && !i?.parsing_error));

// Generic counts used in the overview bar (works for ESLint and LLM)
const errorCount = computed(() => props.isEslint ? totalErrors.value : failedItems.value.length);
const warningsCount = computed(() => props.isEslint ? totalWarnings.value : parseErrorItems.value.length);
const cleanCountGeneric = computed(() => props.isEslint ? cleanCount.value : successItems.value.length);

function getComplexityClass(value: number | undefined) {
  if (value === undefined || value === null) return 'text-gray-500';
  if (value <= 5) return 'text-green-600';
  if (value <= 15) return 'text-yellow-600';
  return 'text-red-600';
}
</script>

<style scoped>
/* keep it minimal; tailwind handles styling */
</style>
<template>
  <div>
    <!-- Overview Bar -->
    <div class="mb-4 flex items-center">
      <div class="flex-1 text-sm">
        <span class="px-2 py-1 rounded bg-gray-100">Files: <span class="font-bold">{{ filesCount }}</span></span>
        <span v-if="errorsCount !== null" class="px-2 py-1 rounded bg-red-100 text-red-700">Errors: <span class="font-bold">{{ errorsCount }}</span></span>
        <span v-if="warningsCount !== null" class="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Warnings: <span class="font-bold">{{ warningsCount }}</span></span>
        <span v-if="cleanCount !== null" class="px-2 py-1 rounded bg-green-100 text-green-700">Clean: <span class="font-bold">{{ cleanCount }}</span></span>
      </div>
      <div class="ml-2">
        <slot name="actions" />
      </div>
    </div>

    <!-- Grouped tables -->
    <div class="overflow-y-auto max-h-[65vh] border rounded px-2 py-2">
      <!-- Errors Group -->
      <div v-if="errorGroup.length" class="mb-6">
        <div class="font-semibold text-red-700 mb-2">Files with Errors</div>
        <table class="w-full text-xs border table-auto">
          <thead class="bg-red-50">
            <tr>
              <th class="text-left p-2">File</th>
              <th class="text-left p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in errorGroup" :key="itemKey(item)">
              <td class="border-b p-2 font-mono">{{ displayFile(item) }}</td>
              <td class="border-b p-2">
                <slot name="error-cell" :item="item">
                  {{ item.summary || JSON.stringify(item) }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Warnings Group -->
      <div v-if="warningGroup.length" class="mb-6">
        <div class="font-semibold text-yellow-700 mb-2">Files with Warnings</div>
        <table class="w-full text-xs border table-auto">
          <thead class="bg-yellow-50">
            <tr>
              <th class="text-left p-2">File</th>
              <th class="text-left p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in warningGroup" :key="itemKey(item)">
              <td class="border-b p-2 font-mono">{{ displayFile(item) }}</td>
              <td class="border-b p-2">
                <slot name="warning-cell" :item="item">
                  {{ item.summary || JSON.stringify(item) }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Clean Group -->
      <div v-if="cleanGroup.length" class="mb-6">
        <div class="font-semibold text-green-700 mb-2">Clean Files</div>
        <table class="w-full text-xs border table-auto">
          <thead class="bg-green-50">
            <tr>
              <th class="text-left p-2">File</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cleanGroup" :key="itemKey(item)">
              <td class="border-b p-2 font-mono">{{ displayFile(item) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Fallback generic table when items are ungrouped -->
      <div v-if="!hasGroups && items && items.length" class="mb-6">
        <table class="w-full text-xs border table-auto">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left p-2">File</th>
              <th class="text-left p-2">Component</th>
              <th class="text-left p-2">NLOC</th>
              <th class="text-left p-2">Cyclomatic</th>
              <th class="text-left p-2">Cognitive</th>
              <th class="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="itemKey(item)">
              <td class="border-b p-2 font-mono">{{ displayFile(item) }}</td>
              <td class="border-b p-2">{{ item.component || item.ruleId || '-' }}</td>
              <td class="border-b p-2 text-center">{{ item.nloc ?? '-' }}</td>
              <td class="border-b p-2 text-center">{{ item.cyclomatic_complexity ?? '-' }}</td>
              <td class="border-b p-2 text-center">{{ item.cognitive_complexity ?? '-' }}</td>
              <td class="border-b p-2">
                <span v-if="item.error" class="text-red-600">Failed</span>
                <span v-else-if="item.parsing_error" class="text-yellow-600">Parse Error</span>
                <span v-else class="text-green-600">✓ Success</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';

const props = defineProps({
  items: { type: Array as PropType<any[]>, default: () => [] },
  // grouping: expected values 'eslint' or 'llm' to guide grouping heuristics
  type: { type: String as PropType<'eslint' | 'llm' | 'generic'>, default: 'generic' }
});

const hasGroups = computed(() => props.type === 'eslint');

function itemKey(item: any) {
  return item.file || item.filePath || item.component || JSON.stringify(item);
}

function displayFile(item: any) {
  return (item.file || item.filePath || '').split('/').slice(-2).join('/');
}

// ESLint-style grouping
const errorGroup = computed(() => {
  if (props.type !== 'eslint') return [];
  return props.items.filter((f: any) => (f.errorCount || f.fatalErrorCount) > 0);
});
const warningGroup = computed(() => {
  if (props.type !== 'eslint') return [];
  return props.items.filter((f: any) => (f.warningCount || 0) > 0 && !(f.errorCount || f.fatalErrorCount));
});
const cleanGroup = computed(() => {
  if (props.type !== 'eslint') return [];
  return props.items.filter((f: any) => !(f.errorCount || f.fatalErrorCount || f.warningCount));
});

const filesCount = computed(() => props.items?.length || 0);
const errorsCount = computed(() => {
  if (props.type === 'eslint') return props.items.reduce((s: number, f: any) => s + (f.errorCount || 0) + (f.fatalErrorCount || 0), 0);
  return null;
});
const warningsCount = computed(() => {
  if (props.type === 'eslint') return props.items.reduce((s: number, f: any) => s + (f.warningCount || 0), 0);
  return null;
});
const cleanCount = computed(() => {
  if (props.type === 'eslint') return cleanGroup.value.length;
  return null;
});
</script>

<style scoped>
/* minimal styles here rely on tailwind */
</style>
