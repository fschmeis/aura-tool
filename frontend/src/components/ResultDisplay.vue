<template>
  <div class="w-full h-full flex flex-col min-h-0">
    <!-- ESLint Results -->
    <div v-if="lintResult" class="flex flex-col flex-1 min-h-0">
      <h2 class="font-semibold mb-2">ESLint Ergebnis</h2>

      <div v-if="lintResult.topRules?.length" class="mb-2">
        <p class="mb-1">Top Fehlerregeln:</p>
        <ul class="list-disc ml-6">
          <li v-for="([rule, count], i) in lintResult.topRules" :key="i">
            {{ rule }}: {{ count }}
          </li>
        </ul>
      </div>

      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="flex-1 min-h-0 overflow-hidden">
        <div class="w-full h-full overflow-y-auto overflow-x-auto rounded border bg-white" style="max-height: 30vh;">
          <table class="w-full text-xs">
            <thead class="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th class="text-left px-2 py-1 border-b">File</th>
                <th class="text-left px-2 py-1 border-b">Errors</th>
                <th class="text-left px-2 py-1 border-b">Warnings</th>
                <th class="text-left px-2 py-1 border-b">Messages</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in lintResult.results" :key="file.filePath">
                <td class="px-2 py-1 border-b align-top">
                  {{ file.filePath.split('/').slice(-2).join('/') }}
                </td>
                <td class="px-2 py-1 border-b align-top text-red-600">
                  {{ file.errorCount }}
                </td>
                <td class="px-2 py-1 border-b align-top text-yellow-600">
                  {{ file.warningCount }}
                </td>
                <td class="px-2 py-1 border-b align-top">
                  <ul>
                    <li v-for="(msg, i) in file.messages" :key="i" class="break-words">
                      <span :class="msg.severity === 2 ? 'text-red-600' : 'text-yellow-600'">
                        [{{ msg.ruleId || 'unknown' }}] {{ msg.message }} (line {{ msg.line }})
                      </span>
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- JSON View -->
      <div v-else-if="viewMode === 'json'" class="flex-1 min-h-0 overflow-hidden">
        <pre class="w-full h-full overflow-auto bg-gray-200 p-2 rounded text-xs" style="max-height: 30vh;">{{ JSON.stringify(lintResult.results, null, 2) }}</pre>
      </div>
    </div>

    <!-- LLM Results -->
    <div v-else-if="llmResult" class="flex flex-col flex-1 min-h-0">
      <h2 class="font-semibold mb-2">LLM Analysis Ergebnis</h2>

      <div v-if="llmResult.outputFile" class="mb-2">
        <p class="text-sm text-gray-600">Results saved to: {{ llmResult.outputFile }}</p>
      </div>

      <div v-if="llmResult.error" class="mb-2 p-2 bg-red-100 text-red-700 rounded">
        Error: {{ llmResult.error }}
      </div>

      <!-- Table View -->
      <div v-if="viewMode === 'table' && llmResult.results" class="flex-1 min-h-0 overflow-hidden">
        <div class="w-full h-full overflow-y-auto overflow-x-auto rounded border bg-white" style="max-height: 30vh;">
          <table class="w-full text-xs">
            <thead class="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th class="text-left px-2 py-1 border-b">File</th>
                <th class="text-left px-2 py-1 border-b">Component</th>
                <th class="text-left px-2 py-1 border-b">NLOC</th>
                <th class="text-left px-2 py-1 border-b">Cyclomatic Complexity</th>
                <th class="text-left px-2 py-1 border-b">Cognitive Complexity</th>
                <th class="text-left px-2 py-1 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in llmResult.results" :key="result.file">
                <td class="px-2 py-1 border-b align-top font-mono text-xs">
                  {{ result.file.split('/').slice(-2).join('/') }}
                </td>
                <td class="px-2 py-1 border-b align-top">
                  <div v-if="result.error" class="text-red-600 text-xs">
                    Error: {{ result.error }}
                  </div>
                  <div v-else-if="result.parsing_error" class="text-yellow-600 text-xs">
                    Parse Error
                  </div>
                  <div v-else class="text-sm">
                    {{ result.component || 'N/A' }}
                  </div>
                </td>
                <td class="px-2 py-1 border-b align-top text-center">
                  <span v-if="!result.error && !result.parsing_error && result.nloc !== undefined">
                    {{ result.nloc }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-2 py-1 border-b align-top text-center">
                  <span v-if="!result.error && !result.parsing_error && result.cyclomatic_complexity !== undefined"
                        :class="getComplexityColor(result.cyclomatic_complexity, 'cyclomatic')">
                    {{ result.cyclomatic_complexity }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-2 py-1 border-b align-top text-center">
                  <span v-if="!result.error && !result.parsing_error && result.cognitive_complexity !== undefined"
                        :class="getComplexityColor(result.cognitive_complexity, 'cognitive')">
                    {{ result.cognitive_complexity }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-2 py-1 border-b align-top">
                  <span v-if="result.error" class="text-red-600 text-xs">Failed</span>
                  <span v-else-if="result.parsing_error" class="text-yellow-600 text-xs">Parse Error</span>
                  <span v-else class="text-green-600 text-xs">✓ Success</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- JSON View -->
      <div v-else-if="viewMode === 'json'" class="flex-1 min-h-0 overflow-hidden">
        <pre class="w-full h-full overflow-auto bg-gray-200 p-2 rounded text-xs" style="max-height: 30vh;">{{ JSON.stringify(llmResult.results, null, 2) }}</pre>
      </div>
    </div>

    <!-- Placeholder -->
    <div v-else class="text-gray-400 italic">
      Analysis results will be displayed here.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    lintResult: Object as PropType<any>,
    llmResult: Object as PropType<any>,
    viewMode: {
      type: String as PropType<'table' | 'json'>,
      default: 'table'
    }
  },
  methods: {
    getComplexityColor(value: number, type: 'cyclomatic' | 'cognitive' = 'cyclomatic') {
      if (value === undefined || value === null) return 'text-gray-500';
      
      if (type === 'cyclomatic') {
        // Cyclomatic complexity thresholds
        if (value <= 5) return 'text-green-600';
        if (value <= 10) return 'text-yellow-600';
        return 'text-red-600';
      } else {
        // Cognitive complexity thresholds
        if (value <= 5) return 'text-green-600';
        if (value <= 15) return 'text-yellow-600';
        return 'text-red-600';
      }
    },
    getMaintainabilityColor(maintainability: string) {
      switch (maintainability?.toLowerCase()) {
        case 'excellent': return 'text-green-600';
        case 'good': return 'text-green-500';
        case 'fair': return 'text-yellow-600';
        case 'poor': return 'text-red-600';
        default: return 'text-gray-500';
      }
    }
  }
});
</script>
