<template>
  <div class="w-full h-full flex flex-col min-h-0">
    <div v-if="lintResult" class="flex flex-col flex-1 min-h-0">
      <div class="font-semibold mb-2">ESLint Ergebnis</div>

      <div v-if="lintResult.topRules?.length" class="shrink-0 mb-2">
        <div class="mb-1">Top Fehlerregeln:</div>
        <ul class="list-disc ml-6">
          <li v-for="([rule, count], i) in lintResult.topRules" :key="i">{{ rule }}: {{ count }}</li>
        </ul>
      </div>

      <div v-if="viewMode === 'table'" class="flex-1 min-h-0 overflow-auto">
        <table class="w-full text-xs border rounded bg-white">
          <thead class="bg-gray-100">
            <tr>
              <th class="text-left px-2 py-1 border-b">File</th>
              <th class="text-left px-2 py-1 border-b">Errors</th>
              <th class="text-left px-2 py-1 border-b">Warnings</th>
              <th class="text-left px-2 py-1 border-b">Messages</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in lintResult.results" :key="file.filePath">
              <td class="px-2 py-1 border-b align-top">{{ file.filePath.split('/').slice(-2).join('/') }}</td>
              <td class="px-2 py-1 border-b align-top text-red-600">{{ file.errorCount }}</td>
              <td class="px-2 py-1 border-b align-top text-yellow-600">{{ file.warningCount }}</td>
              <td class="px-2 py-1 border-b align-top">
                <ul>
                  <li v-for="(msg, i) in file.messages" :key="i">
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
      <div v-else-if="viewMode === 'json'" class="flex-1 min-h-0 overflow-hidden">
        <pre class="h-full overflow-auto bg-gray-200 p-2 rounded text-xs">{{ JSON.stringify(lintResult.results, null, 2) }}</pre>
      </div>
    </div>
    <div v-else class="text-gray-400 italic">ESLint Ergebnis wird hier angezeigt.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
export default defineComponent({
  props: {
    lintResult: Object as PropType<any>,
    viewMode: {
      type: String as PropType<'table' | 'json'>,
      default: 'table'
    }
  }
});
</script>
