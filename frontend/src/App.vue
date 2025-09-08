<template>
  <div class="h-screen flex flex-col">
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
              <SelectItem v-for="repo in repos" :key="repo.path" :value="repo.path">{{ repo.name }}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <RepoInput @repo-cloned="onRepoCloned" @repo-error="onRepoError" :check-repo-exists="checkRepoExists"
          :confirm-overwrite="confirmOverwrite" />
      </div>
    </header>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar: Event Log -->
      <aside class="w-80 border-r bg-white flex flex-col">
        <div class="flex-1 overflow-y-auto p-4">
          <EventLog :events="eventLog" :on-open-logfile="openLogfile" :on-clear-log="clearLog" />
        </div>
      </aside>

      <!-- Main Content -->
      <main class="p-8 bg-gray-50 min-h-screen">
        <section class="max-w-4xl mx-auto">
          <header class="mb-6">
            <h1 class="text-2xl font-bold">Code Analysis</h1>
            <p class="text-gray-600">Run ESLint or LLM analysis, then view and compare the results.</p>
          </header>

          <Tabs v-model="activeTab">
            <TabsList class="mb-6">
              <TabsTrigger value="eslint">ESLint</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
            </TabsList>

            <!-- ESLint Tab -->
            <TabsContent value="eslint">
              <div class="mb-4 flex items-center gap-3">
                <Button :disabled="!repoPath" @click="runESLint">Run ESLint</Button>
                <Button :disabled="!lintResult && !lastLintResult" variant="secondary" @click="showLastLint">Show Last</Button>
                <span v-if="!repoPath" class="text-sm text-gray-400">
                  Select or clone a repo to enable analysis
                </span>
              </div>
              <div class="rounded border bg-white p-4 shadow-sm">
                <Tabs v-model="eslintViewMode" class="w-full">
                  <TabsList class="mb-4">
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table">
                    <ResultDisplay :lintResult="lintResult" viewMode="table" />
                  </TabsContent>
                  <TabsContent value="json">
                    <ResultDisplay :lintResult="lintResult" viewMode="json" />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <!-- LLM Tab -->
            <TabsContent value="llm">
              <div class="mb-4 flex items-center gap-3">
                <Button :disabled="!repoPath" @click="runLLM">Run LLM Analysis</Button>
                <span v-if="!repoPath" class="text-sm text-gray-400">
                  Select or clone a repo to enable analysis
                </span>
              </div>
              <div class="rounded border bg-white p-4 shadow-sm">
                <ResultDisplay :llmResult="llmResult" :viewMode="llmViewMode" />
                <div class="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" :class="{ 'bg-gray-100': llmViewMode === 'table' }"
                    @click="llmViewMode = 'table'">Table</Button>
                  <Button size="sm" variant="outline" :class="{ 'bg-gray-100': llmViewMode === 'json' }"
                    @click="llmViewMode = 'json'">JSON</Button>
                </div>
              </div>
            </TabsContent>

            <!-- Compare Tab -->
            <TabsContent value="compare">
              <div class="rounded border bg-white p-4 shadow-sm">
                <ResultDisplay :lintResult="lintResult" :llmResult="llmResult" :viewMode="compareViewMode" compare />
                <div class="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" :class="{ 'bg-gray-100': compareViewMode === 'table' }"
                    @click="compareViewMode = 'table'">Table</Button>
                  <Button size="sm" variant="outline" :class="{ 'bg-gray-100': compareViewMode === 'json' }"
                    @click="compareViewMode = 'json'">JSON</Button>
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

    // Helper to get storage keys for a repo
    function getLintKey(repoPath: string | null) {
      return repoPath ? `aura-eslint-result-${repoPath}` : 'aura-eslint-result';
    }
    function getLastLintKey(repoPath: string | null) {
      return repoPath ? `aura-eslint-last-result-${repoPath}` : 'aura-eslint-last-result';
    }

    // Load persisted results for the current repo
    function loadLintResultsForRepo(path: string | null) {
      try {
        const savedLint = localStorage.getItem(getLintKey(path));
        const savedLastLint = localStorage.getItem(getLastLintKey(path));
        lintResult.value = savedLint ? JSON.parse(savedLint) : null;
        lastLintResult.value = savedLastLint ? JSON.parse(savedLastLint) : null;
      } catch {
        lintResult.value = null;
        lastLintResult.value = null;
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
    const llmResult = ref<any>(null);
    const repos = ref<{ name: string; path: string }[]>([]);
    const selectedRepo = ref<string | null>(null);
    const eventLog = ref<any[]>([]);

    // UI state for redesigned main area
    const activeTab = ref<'eslint' | 'llm' | 'compare'>('eslint');
    const eslintViewMode = ref<'table' | 'json'>('table');
    const llmViewMode = ref<'table' | 'json'>('table');
    const compareViewMode = ref<'table' | 'json'>('table');

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
      // No need to call updateEventLog, polling will update automatically
    }
    function onRepoSelect() {
      const repo = repos.value.find(r => r.path === selectedRepo.value);
      if (repo) repoPath.value = repo.path;
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
      if (!repoPath.value) return;
      try {
        // Save current result as last before running new
        if (lintResult.value) {
          lastLintResult.value = JSON.parse(JSON.stringify(lintResult.value));
        } else if (!lastLintResult.value) {
          // On first run, set lastLintResult to null so toggling is always possible
          lastLintResult.value = null;
        }
        const res = await fetch('/api/lint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath: repoPath.value })
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
      if (!repoPath.value) return;
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath: repoPath.value })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        llmResult.value = data;
      } catch (e: any) {
        llmResult.value = { error: e.message };
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
  repoPath, srcExists, lintResult, lastLintResult, llmResult, onRepoCloned, onLintResult, onLLMResult, repos, selectedRepo, onRepoSelect, eventLog, openLogfile, checkRepoExists, confirmOverwrite, onRepoError, clearLog,
  // new UI state and handlers
  activeTab, eslintViewMode, llmViewMode, compareViewMode, runESLint, runLLM, showLastLint
    };
  }
});
</script>
