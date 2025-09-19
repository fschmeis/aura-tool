<template>
  <div class="h-screen flex flex-col min-h-0">
    <!-- Header Bar -->
    <header class="h-16 flex items-center justify-between border-b px-6 bg-white">
      <div class="flex items-center gap-3">
        <img src="/assets/app-logo.webp" alt="App Logo" class="w-10 h-10 rounded-xl object-contain" />
        <span class="text-xl font-bold">Aura Tool</span>
      </div>
      <div class="flex items-center gap-4">
  <Select v-model="selectedRepo" @update:modelValue="setActiveRepo" class="min-w-[180px]">
          <SelectTrigger>
            <SelectValue placeholder="Select repository" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="repo in repos" :key="repo.path" :value="repo.path">
                {{ repo.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <RepoInput @repo-cloned="onRepoCloned" @repo-error="onRepoError" :check-repo-exists="checkRepoExists"
          :confirm-overwrite="confirmOverwrite" />
        <FolderInput @folder-added="onFolderAdded" @folder-error="onFolderError" />
      </div>
    </header>

    <!-- Body -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar: Event Log -->
      <aside class="w-80 border-r bg-white flex flex-col">
        <div class="flex-1 overflow-y-auto p-4">
          <EventLog :events="eventLog" :on-open-logfile="openLogfile" :on-clear-log="clearLog" />
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 min-h-0 overflow-hidden bg-gray-50 p-8">
  <section class="max-w-6xl mx-auto w-full">
          <Tabs v-model="activeTab">
            <TabsList>
              <TabsTrigger value="eslint">ESLint</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
            </TabsList>

            <!-- ESLint Tab -->
            <TabsContent value="eslint">
              <div class="mb-4 space-y-2">
                <Select v-model="selectedFolder" :disabled="!repoPath || folders.length === 0" class="min-w-[220px]">
                  <SelectTrigger>
                    <SelectValue placeholder="Select root folder for analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="folder in folders" :key="folder" :value="folder">
                        {{ folder }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div class="flex items-center gap-3">
                  <Button :disabled="!repoPath || !selectedFolder" @click="runESLint">
                    Run ESLint
                  </Button>
                    <Select v-model="selectedESLintHistoryId" :disabled="eslintHistory.length === 0" class="min-w-[200px]">
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
                    <!-- History selection auto-loads the run; Clear History button removed -->
                    <Button variant="outline" @click="editESLintConfig">
                      Edit ESLint Config
                    </Button>
                  <span v-if="!repoPath" class="text-sm text-gray-400">
                    Select or clone a repo to enable analysis
                  </span>
                </div>
              </div>

              <div>
                <!-- Always show table view for ESLint -->
                <ResultDisplay
                  :lintResult="lintResult"
                  viewMode="table"
                  :resultLabel="eslintResultLabel"
                  :isESLint="true"
                />
              </div>
            </TabsContent>

            <!-- LLM Tab -->
            <TabsContent value="llm">
              <div class="mb-4 space-y-2">
                <Select v-model="selectedFolder" :disabled="!repoPath || folders.length === 0" class="min-w-[220px]">
                  <SelectTrigger>
                    <SelectValue placeholder="Select root folder for analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="folder in folders" :key="folder" :value="folder">
                        {{ folder }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div class="space-y-2">
                  <div class="flex items-center gap-3">
                    <Input 
                      v-model="filePattern" 
                      placeholder="File patterns (e.g., *.ts,*.vue)"
                      class="min-w-[200px]"
                      :disabled="!repoPath"
                    />
                    <Input 
                      v-model="excludePattern" 
                      placeholder="Exclude patterns (e.g., *.test.ts,**/node_modules/**)"
                      class="min-w-[250px]"
                      :disabled="!repoPath"
                    />
                  </div>
                  
                  <div class="flex flex-wrap items-center gap-3">
                    <Button :disabled="!repoPath || !selectedFolder || llmRunning" @click="runLLM">
                      {{ llmRunning ? 'Running…' : 'Run LLM Analysis' }}
                    </Button>
                    <Select v-model="selectedLLMHistoryId" :disabled="llmHistory.length === 0" class="min-w-[220px]">
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
                    <!-- History selection auto-loads the run; Clear History button removed -->
                    <Button :disabled="!repoPath" variant="secondary" @click="editPrompt">
                      Edit Prompt
                    </Button>
                    <span v-if="!repoPath" class="text-sm text-gray-400">
                      Select or clone a repo to enable analysis
                    </span>
                    <span v-if="llmRunning" class="text-sm text-blue-600 animate-pulse">
                      Analysis running...
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <!-- Always show table view for LLM -->
                <ResultDisplay
                  :llmResult="llmResult"
                  viewMode="table"
                  :resultLabel="llmResultLabel"
                  :isESLint="false"
                />
              </div>
            </TabsContent>

          </Tabs>
        </section>

        <Toaster />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import RepoInput from './components/RepoInput.vue';
import FolderInput from './components/FolderInput.vue';
import EventLog from './components/EventLog.vue';
import ResultDisplay from './components/ResultDisplay.vue';
import { fetchLog, openLogfile } from './utils/logUtils';
import { useResultsPersistence } from './composables/useResultsPersistence';
import { useEventLog } from './composables/useEventLog';
import { useLLMHistory } from './composables/useLLMHistory';
import { useESLintHistory } from './composables/useESLintHistory';
import type { LLMResult, ESLintResult } from './types/results';

async function clearLog() {
  await fetch('/api/logfile', { method: 'DELETE' });
  // No need to call updateEventLog, polling will update automatically
}

const repoPath = ref<string | null>(null);
const lintResult = ref<ESLintResult | null>(null);
const llmResult = ref<LLMResult | null>(null);
const folders = ref<string[]>([]);
const selectedFolder = ref<string | null>(null);

async function fetchFolders() {
  if (!repoPath.value) { folders.value = []; selectedFolder.value = null; return; }
  try {
    const res = await fetch('/api/listfolders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath: repoPath.value })
    });
    if (!res.ok) {
      console.warn('listfolders request failed status', res.status);
      return;
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      folders.value = data;
      if (!selectedFolder.value || !folders.value.includes(selectedFolder.value)) {
        selectedFolder.value = folders.value[0] || null;
      }
    }
  } catch (e) {
    console.warn('Failed to load folders', e);
  }
}

const { load: loadResults } = useResultsPersistence(
  repoPath,
  lintResult,
  llmResult
);

// Watch repoPath and load results + folders when it changes
watch(repoPath, (newVal, oldVal) => {
  loadResults();
  if (newVal && newVal !== oldVal) {
    fetchFolders();
  }
  // If no folder selected yet but folders already present (e.g. loaded earlier), ensure selection
  if (folders.value.length && !selectedFolder.value) {
    selectedFolder.value = folders.value[0];
  }
}, { immediate: true });

// Persistence watchers moved inside useResultsPersistence

const repos = ref<{ name: string; path: string }[]>([]);
const selectedRepo = ref<string | null>(null);
const { events: eventLog } = useEventLog();

function setActiveRepo(val: string | null) {
  if (!val) {
    selectedRepo.value = null;
    repoPath.value = null;
    folders.value = [];
    selectedFolder.value = null;
    localStorage.removeItem('aura-tool-last-repo');
    return;
  }
  // If same repo reselected, still refresh folders
  selectedRepo.value = val;
  repoPath.value = val;
  localStorage.setItem('aura-tool-last-repo', val);
  fetchFolders();
  loadResults();
  loadESLintHistory();
}

// UI state for redesigned main area
const activeTab = ref<'eslint' | 'llm'>('eslint');

const eslintResultLabel = computed(() => {
  if (selectedESLintHistoryId.value) {
    const run = eslintHistory.value.find(r => r.id === selectedESLintHistoryId.value);
    if (run) return `Loaded from History (${formatRunLabel(run)})`;
  }
  if (lintResult.value && lintResult.value.results && lintResult.value.results.length) {
    return 'Current Analysis';
  }
  return '';
});

const llmResultLabel = computed(() => {
  if (selectedLLMHistoryId.value) {
    const run = llmHistory.value.find(r => r.id === selectedLLMHistoryId.value);
    if (run) return `Loaded from History (${formatRunLabel(run)})`;
  }
  if (llmResult.value && llmResult.value.results && llmResult.value.results.length) {
    return 'Current Analysis';
  }
  return '';
});

// LLM specific state
const filePattern = ref<string>('*.ts,*.vue');
const excludePattern = ref<string>('*.test.ts,**/node_modules/**,**/dist/**');
const llmRunning = ref<boolean>(false);
const { history: llmHistory, add: addLLMHistoryRun, clear: clearLLMHistory } = useLLMHistory(repoPath as any);
const selectedLLMHistoryId = ref<string | null>(null);
const { history: eslintHistory, add: addESLintHistoryRun, clear: clearESLintHistory, load: loadESLintHistory } = useESLintHistory(repoPath as any);
const selectedESLintHistoryId = ref<string | null>(null);

watch(repoPath, () => { loadESLintHistory(); }, { immediate: true });

function loadSelectedESLintHistory() {
  if (!selectedESLintHistoryId.value) return;
  const run = eslintHistory.value.find(r => r.id === selectedESLintHistoryId.value);
  if (run) {
    lintResult.value = JSON.parse(JSON.stringify(run.results));
  }
}

// Auto-load when user selects a history item (replaces explicit Load Run button)
watch(selectedESLintHistoryId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    loadSelectedESLintHistory();
  }
});

function formatRunLabel(run: any) {
  const d = new Date(run.timestamp);
  return d.toLocaleString();
}
function loadSelectedLLMHistory() {
  if (!selectedLLMHistoryId.value) return;
  const run = llmHistory.value.find(r => r.id === selectedLLMHistoryId.value);
  if (run) {
    llmResult.value = JSON.parse(JSON.stringify(run.results));
  }
}

watch(selectedLLMHistoryId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    loadSelectedLLMHistory();
  }
});

async function fetchRepos() {
  const res = await fetch('/api/repos');
  repos.value = await res.json();
  
  // Try to restore last selected repo from localStorage
  const lastSelectedRepo = localStorage.getItem('aura-tool-last-repo');
  const repoExists = lastSelectedRepo && repos.value.some(repo => repo.path === lastSelectedRepo);
  
  if (repoExists) {
    setActiveRepo(lastSelectedRepo);
  } else if (repos.value.length && !selectedRepo.value) {
    // Auto-select the first repo and trigger all related loading
    setActiveRepo(repos.value[0].path);
  }
}
async function updateEventLog() {
  eventLog.value = await fetchLog();
}
async function checkRepoExists(repoUrl: string) {
  const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'repo';
  const basePath = '/tmp/aura-tool';
  const targetPath = basePath + '/' + repoName;
  // Ask backend if folder exists
  const res = await fetch('/api/repos');
  const reposList = await res.json();
  return reposList.some((r: any) => r.path === targetPath);
}
async function confirmOverwrite(repoUrl: string) {
  return window.confirm('Repository already exists. Do you want to overwrite it? This will delete the previous clone.');
}
function onRepoCloned(payload: { repoPath: string; srcExists: boolean }) {
  repoPath.value = payload.repoPath;
  lintResult.value = null;
  llmResult.value = null;
  fetchRepos();
  fetchFolders();
  // No need to call updateEventLog, polling will update automatically
}

function onFolderAdded(payload: { folderPath: string; name: string }) {
  repoPath.value = payload.folderPath;
  lintResult.value = null;
  llmResult.value = null;
  fetchRepos();
  fetchFolders();
}

function onFolderError(msg: string) {
  console.error('Folder error:', msg);
  // Error handling - could show toast or similar
}

// onRepoSelect removed in favor of setActiveRepo
function onRepoError(msg: string) {
  // No need to call updateEventLog, polling will update automatically
}

async function runESLint() {
  if (!repoPath.value || !selectedFolder.value) return;
  try {
    const res = await fetch('/api/lint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath: repoPath.value, lintPath: selectedFolder.value })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    lintResult.value = data;
    if (lintResult.value) addESLintHistoryRun(lintResult.value);
  } catch (e: any) {
    lintResult.value = { results: [], topRules: [], error: e.message };
  }
}
async function runLLM() {
  if (!repoPath.value || !selectedFolder.value || llmRunning.value) return;

  try {
    llmRunning.value = true;
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoPath: repoPath.value,
        srcPath: selectedFolder.value,
        filePattern: filePattern.value,
        excludePattern: excludePattern.value
      })
    });
    const data = await res.json();
    console.log('LLM backend response:', data);
    let normalized = null;
    if (data.error) throw new Error(data.error);
    if (data && Array.isArray(data.results)) {
      normalized = { ...data, results: data.results };
    } else if (data && data.data && Array.isArray(data.data.results)) {
      normalized = { ...data.data, results: data.data.results };
    } else if (Array.isArray(data)) {
      normalized = { results: data };
    } else {
      normalized = { results: [], error: 'Unexpected LLM response format', raw: data };
    }
    // Defensive: always ensure results is an array
    if (!Array.isArray(normalized.results)) {
      normalized.results = [];
    }
    llmResult.value = normalized;
    console.log('Assigned llmResult:', llmResult.value);
    if (llmResult.value) {
      addLLMHistoryRun(JSON.parse(JSON.stringify(llmResult.value)));
      selectedLLMHistoryId.value = llmHistory.value[0]?.id || null;
    }
  } catch (e: any) {
    llmResult.value = { results: [], error: e.message } as LLMResult;
    console.error('LLM error:', e);
  } finally {
    llmRunning.value = false;
  }
}

async function editPrompt() {
  try {
    const res = await fetch('/api/llm/edit-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    // Don't throw error even if data.error exists - the event log will handle it
    // The editor might have opened successfully even if there was a "command failed" message
  } catch (e: any) {
    // Silently fail - errors are tracked in the event log
    console.log('Edit prompt request completed');
  }
}

async function editESLintConfig() {
  try {
    const res = await fetch('/api/eslint-config/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    // Don't throw error even if data.error exists - the event log will handle it
    console.log('Edit ESLint config request completed');
  } catch (e: any) {
    // Silently fail - errors are tracked in the event log
    console.log('Edit ESLint config request completed');
  }
}

// Event log polling handled by useEventLog; just fetch repos initially
fetchRepos();
</script>
