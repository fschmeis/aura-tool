<template>
  <div class="h-screen flex flex-col min-h-0">
    <!-- Header Bar -->
    <header class="h-16 flex items-center justify-between border-b px-6 bg-white">
      <div class="flex items-center gap-3">
        <img src="/assets/app-logo.webp" alt="App Logo" class="w-10 h-10 rounded-xl object-contain" />
        <span class="text-xl font-bold">Aura Tool</span>
      </div>
      <div class="flex items-center gap-4">
        <Select v-model="selectedRepo" @update:modelValue="onRepoSelect" class="min-w-[180px]">
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
        <section class="flex flex-col flex-1 min-h-0 max-w-6xl mx-auto w-full">
          <header class="mb-6">
            <h1 class="text-2xl font-bold">Analysis</h1>
            <p class="text-gray-600">
              Run ESLint or LLM analysis, then view and compare the results.
            </p>
          </header>

          <Tabs v-model="activeTab" class="flex flex-col flex-1 min-h-0">
            <TabsList class="mb-6">
              <TabsTrigger value="eslint">ESLint</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
            </TabsList>

            <!-- ESLint Tab -->
            <TabsContent value="eslint" class="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                  <Button :disabled="!lintResult && !lastLintResult" variant="secondary" @click="showLastLint">
                    Show Last
                  </Button>
                  <span v-if="!repoPath" class="text-sm text-gray-400">
                    Select or clone a repo to enable analysis
                  </span>
                </div>
              </div>

              <div class="flex flex-col flex-1 min-h-0 border bg-white p-4 shadow-sm overflow-hidden">
                <Tabs v-model="eslintViewMode" class="flex flex-col flex-1 min-h-0">
                  <TabsList class="mb-4 flex-shrink-0">
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>

                  <TabsContent value="table" class="flex flex-col flex-1 min-h-0">
                    <ResultDisplay :lintResult="lintResult" viewMode="table" />
                  </TabsContent>

                  <TabsContent value="json" class="flex flex-col flex-1 min-h-0">
                    <ResultDisplay :lintResult="lintResult" viewMode="json" />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <!-- LLM Tab -->
            <TabsContent value="llm" class="flex flex-col flex-1 min-h-0">
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
                  
                  <div class="flex items-center gap-3">
                    <Button v-if="!llmRunning" :disabled="!repoPath || !selectedFolder" @click="runLLM">
                      Run LLM Analysis
                    </Button>
                    <Button v-else variant="destructive" @click="interruptLLM">
                      Interrupt Analysis
                    </Button>
                    <Button :disabled="!llmResult && !lastLLMResult" variant="secondary" @click="showLastLLM">
                      Show Last
                    </Button>
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

              <div class="flex flex-col flex-1 min-h-0 border bg-white p-4 shadow-sm overflow-hidden">
                <Tabs v-model="llmViewMode" class="flex flex-col flex-1 min-h-0">
                  <TabsList class="mb-4 flex-shrink-0">
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>

                  <TabsContent value="table" class="flex flex-col flex-1 min-h-0">
                    <ResultDisplay :llmResult="llmResult" viewMode="table" />
                  </TabsContent>

                  <TabsContent value="json" class="flex flex-col flex-1 min-h-0">
                    <ResultDisplay :llmResult="llmResult" viewMode="json" />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <!-- Compare Tab -->
            <TabsContent value="compare" class="flex flex-col flex-1 min-h-0">
              <div class="flex flex-col flex-1 min-h-0 rounded border bg-white p-4 shadow-sm overflow-hidden">
                <div class="flex-1 min-h-0 overflow-hidden">
                  <ResultDisplay :lintResult="lintResult" :llmResult="llmResult" :viewMode="compareViewMode" compare />
                </div>
                <div class="mt-4 flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" :class="{ 'bg-gray-100': compareViewMode === 'table' }"
                    @click="compareViewMode = 'table'">
                    Table
                  </Button>
                  <Button size="sm" variant="outline" :class="{ 'bg-gray-100': compareViewMode === 'json' }"
                    @click="compareViewMode = 'json'">
                    JSON
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <Toaster />
      </main>
    </div>
  </div>
</template>

<script lang="ts">

import { defineComponent, ref, onMounted, onUnmounted, watch } from 'vue';
import RepoInput from './components/RepoInput.vue';
import EventLog from './components/EventLog.vue';
import ResultDisplay from './components/ResultDisplay.vue';
import { fetchLog, openLogfile } from './utils/logUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
export default defineComponent({
  components: {
    RepoInput,
    EventLog,
    ResultDisplay,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Button,
    Input,
    Select,
    SelectTrigger,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectValue
  },
  setup() {
    async function clearLog() {
      await fetch('/api/logfile', { method: 'DELETE' });
      // No need to call updateEventLog, polling will update automatically
    }
    const repoPath = ref<string | null>(null);
    const srcExists = ref<boolean>(false);
    const lintResult = ref<any>(null);
    const lastLintResult = ref<any>(null);
    const llmResult = ref<any>(null);
    const lastLLMResult = ref<any>(null);
    const folders = ref<string[]>([]);
    const selectedFolder = ref<string | null>(null);

    async function fetchFolders() {
      folders.value = [];
      selectedFolder.value = null;
      if (!repoPath.value) return;
      try {
        const res = await fetch('/api/listfolders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath: repoPath.value })
        });
        const data = await res.json();
        folders.value = data;
        selectedFolder.value = data.length > 0 ? data[0] : null;
      } catch {
        folders.value = [];
        selectedFolder.value = null;
      }
    }

    // Helper to get storage keys for a repo
    function getLintKey(repoPath: string | null) {
      return repoPath ? `aura-eslint-result-${repoPath}` : 'aura-eslint-result';
    }
    function getLastLintKey(repoPath: string | null) {
      return repoPath ? `aura-eslint-last-result-${repoPath}` : 'aura-eslint-last-result';
    }
    function getLLMKey(repoPath: string | null) {
      return repoPath ? `aura-llm-result-${repoPath}` : 'aura-llm-result';
    }
    function getLastLLMKey(repoPath: string | null) {
      return repoPath ? `aura-llm-last-result-${repoPath}` : 'aura-llm-last-result';
    }

    // Load persisted results for the current repo
    function loadLintResultsForRepo(path: string | null) {
      try {
        const savedLint = localStorage.getItem(getLintKey(path));
        const savedLastLint = localStorage.getItem(getLastLintKey(path));
        const savedLLM = localStorage.getItem(getLLMKey(path));
        const savedLastLLM = localStorage.getItem(getLastLLMKey(path));
        lintResult.value = savedLint ? JSON.parse(savedLint) : null;
        lastLintResult.value = savedLastLint ? JSON.parse(savedLastLint) : null;
        llmResult.value = savedLLM ? JSON.parse(savedLLM) : null;
        lastLLMResult.value = savedLastLLM ? JSON.parse(savedLastLLM) : null;
      } catch {
        lintResult.value = null;
        lastLintResult.value = null;
        llmResult.value = null;
        lastLLMResult.value = null;
      }
    }

    // Watch repoPath and load results when it changes
    watch(repoPath, (newPath) => {
      loadLintResultsForRepo(newPath);
    }, { immediate: true });

    // Persist results to localStorage per repo
    watch([lintResult, repoPath], ([val, path]) => {
      if (path) {
        if (val) {
          localStorage.setItem(getLintKey(path), JSON.stringify(val));
        } else {
          localStorage.removeItem(getLintKey(path));
        }
      }
    });
    watch([lastLintResult, repoPath], ([val, path]) => {
      if (path) {
        if (val) {
          localStorage.setItem(getLastLintKey(path), JSON.stringify(val));
        } else {
          localStorage.removeItem(getLastLintKey(path));
        }
      }
    });
    
    // Persist LLM results to localStorage per repo
    watch([llmResult, repoPath], ([val, path]) => {
      if (path) {
        if (val) {
          localStorage.setItem(getLLMKey(path), JSON.stringify(val));
        } else {
          localStorage.removeItem(getLLMKey(path));
        }
      }
    });
    watch([lastLLMResult, repoPath], ([val, path]) => {
      if (path) {
        if (val) {
          localStorage.setItem(getLastLLMKey(path), JSON.stringify(val));
        } else {
          localStorage.removeItem(getLastLLMKey(path));
        }
      }
    });

    const repos = ref<{ name: string; path: string }[]>([]);
    const selectedRepo = ref<string | null>(null);
    const eventLog = ref<any[]>([]);

    // UI state for redesigned main area
    const activeTab = ref<'eslint' | 'llm' | 'compare'>('eslint');
    const eslintViewMode = ref<'table' | 'json'>('table');
    const llmViewMode = ref<'table' | 'json'>('table');
    const compareViewMode = ref<'table' | 'json'>('table');

    // LLM specific state
    const filePattern = ref<string>('*.ts,*.vue');
    const excludePattern = ref<string>('*.test.ts,**/node_modules/**,**/dist/**');
    const llmRunning = ref<boolean>(false);
    const llmAbortController = ref<AbortController | null>(null);

    async function fetchRepos() {
      const res = await fetch('/api/repos');
      repos.value = await res.json();
      if (repos.value.length && !selectedRepo.value) {
        selectedRepo.value = repos.value[0].path;
        repoPath.value = repos.value[0].path;
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
      srcExists.value = payload.srcExists;
      lintResult.value = null;
      llmResult.value = null;
      fetchRepos();
      fetchFolders();
      // No need to call updateEventLog, polling will update automatically
    }
    function onRepoSelect() {
      const repo = repos.value.find(r => r.path === selectedRepo.value);
      if (repo) repoPath.value = repo.path;
      fetchFolders();
    }
    function onLintResult(result: any) {
      lintResult.value = result;
    }
    function onLLMResult(result: any) {
      llmResult.value = result;
    }
    function onRepoError(msg: string) {
      // No need to call updateEventLog, polling will update automatically
    }

    async function runESLint() {
      if (!repoPath.value || !selectedFolder.value) return;
      try {
        // Save current result as last before running new
        if (lintResult.value) {
          lastLintResult.value = JSON.parse(JSON.stringify(lintResult.value));
        } else if (!lastLintResult.value) {
          lastLintResult.value = null;
        }
        const res = await fetch('/api/lint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath: repoPath.value, lintPath: selectedFolder.value })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        lintResult.value = data;
      } catch (e: any) {
        lintResult.value = { error: e.message };
      }
    }

    function showLastLint() {
      // Always allow toggling if there is a lintResult
      const tmp = lintResult.value;
      lintResult.value = lastLintResult.value;
      lastLintResult.value = tmp;
    }
    async function runLLM() {
      if (!repoPath.value || !selectedFolder.value || llmRunning.value) return;
      
      try {
        // Save current result as last before running new
        if (llmResult.value) {
          lastLLMResult.value = JSON.parse(JSON.stringify(llmResult.value));
        } else if (!lastLLMResult.value) {
          lastLLMResult.value = null;
        }
        
        // Set up abort controller and running state
        llmRunning.value = true;
        llmAbortController.value = new AbortController();
        
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            repoPath: repoPath.value,
            srcPath: selectedFolder.value,
            filePattern: filePattern.value,
            excludePattern: excludePattern.value
          }),
          signal: llmAbortController.value.signal
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        llmResult.value = data;
      } catch (e: any) {
        if (e.name === 'AbortError') {
          // Analysis was interrupted - don't overwrite result, just log
          console.log('LLM analysis was interrupted');
        } else {
          llmResult.value = { error: e.message };
        }
      } finally {
        llmRunning.value = false;
        llmAbortController.value = null;
      }
    }

    function interruptLLM() {
      if (llmAbortController.value) {
        llmAbortController.value.abort();
      }
    }

    function showLastLLM() {
      // Always allow toggling if there is a llmResult
      const tmp = llmResult.value;
      llmResult.value = lastLLMResult.value;
      lastLLMResult.value = tmp;
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

    let logInterval: any = null;
    onMounted(() => {
      fetchRepos();
      updateEventLog();
      logInterval = setInterval(updateEventLog, 1000); // Poll every 1s for immediacy
    });
    onUnmounted(() => {
      if (logInterval) clearInterval(logInterval);
    });
    return {
      repoPath, srcExists, lintResult, lastLintResult, llmResult, lastLLMResult, onRepoCloned, onLintResult, onLLMResult, repos, selectedRepo, onRepoSelect, eventLog, openLogfile, checkRepoExists, confirmOverwrite, onRepoError, clearLog,
      // new UI state and handlers
      activeTab, eslintViewMode, llmViewMode, compareViewMode, runESLint, runLLM, showLastLint, showLastLLM,
      folders, selectedFolder,
      // LLM specific
      filePattern, excludePattern, llmRunning, interruptLLM, editPrompt
    };
  }
});
</script>
