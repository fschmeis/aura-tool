<template>
  <!-- Page Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">ESLint Analysis</h1>
    <p class="text-gray-600 mt-2">Static code analysis for JavaScript and TypeScript</p>
  </div>

  <!-- Controls Section -->
  <div class="bg-white rounded-lg border p-6 mb-6">
    <div class="space-y-6">
      <!-- Action Controls -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">Actions</label>
        <div class="flex items-center gap-3">
          <Button 
            :disabled="!canRunAnalysis || eslintError.isLoading" 
            @click="runESLint"
            class="min-w-[120px]"
          >
            Run Analysis
          </Button>
          <Select v-model="selectedESLintHistoryId" :disabled="eslintHistory.length === 0" class="w-[240px]">
            <SelectTrigger>
              <SelectValue :placeholder="eslintHistory.length ? 'Select past run' : 'No history yet'" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="run in eslintHistory" :key="run.id" :value="run.id">
                  {{ formatRunLabel(run) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" @click="editESLintConfig" class="min-w-[100px]">
            Edit Config
          </Button>
        </div>
        <div v-if="!selectedProject" class="text-sm text-gray-500 mt-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          Select or clone a repository to enable analysis
        </div>
      </div>

      <!-- Status Display -->
      <StatusDisplay 
        :hasError="eslintError.hasError"
        :errorMessage="eslintError.errorMessage"
        :isLoading="eslintError.isLoading"
        :showSuccess="false"
        successMessage=""
        loadingMessage="Running ESLint analysis..."
        @clearError="eslintError.hasError = false"
      />
    </div>
  </div>

  <!-- Results Section -->
  <div class="bg-white rounded-lg border">
    <ResultDisplay 
      :lintResult="eslintResult || undefined" 
      :resultLabel="eslintResultLabel"
      :isESLint="true" 
    />
  </div>
</template>

<script setup lang="ts">
import { watch, toRef, computed } from 'vue';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import ResultDisplay from './ResultDisplay.vue';
import StatusDisplay from './StatusDisplay.vue';
import { useProjectManagement } from '../composables/useProjectManagement';
import { useAnalysisWorkflow } from '../composables/useAnalysisWorkflow';

// Define props
interface Props {
  selectedAnalysisFolder: string | null;
}

const props = defineProps<Props>();

// Convert prop to ref for composables
const selectedAnalysisFolderRef = toRef(props, 'selectedAnalysisFolder');

// Use composables
const {
  selectedProject,
} = useProjectManagement();

const {
  eslintResult,
  eslintError,
  eslintHistory,
  selectedESLintHistoryId,
  eslintResultLabel,
  runESLint,
  editESLintConfig,
  formatRunLabel,
  loadSelectedESLintHistory,
} = useAnalysisWorkflow(selectedProject, selectedAnalysisFolderRef);

// Computed for can run analysis
const canRunAnalysis = computed(() => {
  return selectedProject.value && props.selectedAnalysisFolder;
});

// Auto-load when user selects a history item
watch(selectedESLintHistoryId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    loadSelectedESLintHistory();
  }
});
</script>
