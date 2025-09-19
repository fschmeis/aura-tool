<template>
  <!-- Page Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">LLM Analysis</h1>
    <p class="text-gray-600 mt-2">AI-powered code complexity and quality analysis</p>
  </div>

  <!-- Controls Section -->
  <div class="bg-white rounded-lg border p-6 mb-6">
    <div class="space-y-6">
      <!-- Action Controls -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">Actions</label>
        <div class="flex items-center gap-3">
          <Button 
            :disabled="!canRunAnalysis || llmError.isLoading" 
            @click="runLLM"
            class="min-w-[120px]"
          >
            Run Analysis
          </Button>
          <Select v-model="selectedLLMHistoryId" :disabled="llmHistory.length === 0" class="w-[240px]">
            <SelectTrigger>
              <SelectValue :placeholder="llmHistory.length ? 'Select past run' : 'No history yet'" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="run in llmHistory" :key="run.id" :value="run.id">
                  {{ formatRunLabel(run) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" @click="editPrompt" class="min-w-[100px]">
            Edit Prompt
          </Button>
        </div>
        <div v-if="!selectedProject" class="text-sm text-gray-500 mt-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          Select or clone a repository to enable analysis
        </div>
      </div>

      <!-- File Patterns -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">File Patterns</label>
        <div class="flex items-center gap-3">
          <Input 
            v-model="filePattern" 
            placeholder="File patterns (e.g., *.ts,*.vue)" 
            class="min-w-[200px]"
            :disabled="!selectedProject" 
          />
          <Input 
            v-model="excludePattern" 
            placeholder="Exclude patterns (e.g., *.test.ts,**/node_modules/**)"
            class="min-w-[250px]"
            :disabled="!selectedProject" 
          />
        </div>
      </div>

      <!-- Status Display -->
      <StatusDisplay 
        :hasError="llmError.hasError"
        :errorMessage="llmError.errorMessage"
        :isLoading="llmError.isLoading"
        :showSuccess="false"
        successMessage=""
        loadingMessage="Running LLM analysis..."
        @clearError="llmError.hasError = false"
      />
    </div>
  </div>

  <!-- Results Section -->
  <div class="bg-white rounded-lg border">
    <ResultDisplay 
      :llmResult="llmResult || undefined" 
      :resultLabel="llmResultLabel"
      :isESLint="false" 
    />
  </div>
</template>

<script setup lang="ts">
import { watch, toRef, computed } from 'vue';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
  llmResult,
  llmError,
  llmHistory,
  selectedLLMHistoryId,
  filePattern,
  excludePattern,
  llmResultLabel,
  runLLM,
  editPrompt,
  formatRunLabel,
  loadSelectedLLMHistory,
} = useAnalysisWorkflow(selectedProject, selectedAnalysisFolderRef);

// Computed for can run analysis
const canRunAnalysis = computed(() => {
  return selectedProject.value && props.selectedAnalysisFolder;
});

// Auto-load when user selects a history item
watch(selectedLLMHistoryId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    loadSelectedLLMHistory();
  }
});
</script>
