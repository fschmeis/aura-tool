<template>
  <main class="flex-1 min-h-0 overflow-hidden bg-gray-50">
    <div class="h-full overflow-y-auto">
      <div class="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <!-- ESLint View -->
        <div v-if="activeView === 'eslint'">
          <ESLintTab :selected-analysis-folder="selectedAnalysisFolder" />
        </div>

        <!-- LLM View -->
        <div v-if="activeView === 'llm'">
          <LLMTab :selected-analysis-folder="selectedAnalysisFolder" />
        </div>
      </div>
    </div>

    <Toaster />
  </main>
</template>

<script setup lang="ts">
import { Toaster } from './ui/toast';
import ESLintTab from './ESLintTab.vue';
import LLMTab from './LLMTab.vue';

// Define props to receive active view and analysis folder from parent
interface Props {
  activeView: 'eslint' | 'llm';
  selectedAnalysisFolder: string | null;
}

const props = defineProps<Props>();
</script>
