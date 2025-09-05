<template>
  <div class="mt-8">
    <div v-if="lintResult">
      <h2 class="font-semibold mb-2">ESLint Ergebnis</h2>
      <div v-if="lintResult.topRules && lintResult.topRules.length">
        <div class="mb-2">Top Fehlerregeln:</div>
        <ul class="list-disc ml-6">
          <li v-for="([rule, count], i) in lintResult.topRules" :key="i">{{ rule }}: {{ count }}</li>
        </ul>
      </div>
      <pre class="bg-gray-200 p-2 rounded text-xs overflow-x-auto mt-2">{{ JSON.stringify(lintResult.results, null, 2) }}</pre>
    </div>
    <div v-if="llmResult" class="mt-6">
      <h2 class="font-semibold mb-2">LLM Analyse (LOC)</h2>
      <div class="mb-2">Gesamte LOC: <span class="font-mono">{{ llmResult.totalLOC }}</span></div>
      <ul class="list-disc ml-6">
        <li v-for="file in llmResult.files" :key="file.file">{{ file.file }}: {{ file.loc }} LOC</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
export default defineComponent({
  props: {
    lintResult: Object as PropType<any>,
    llmResult: Object as PropType<any>
  }
});
</script>
