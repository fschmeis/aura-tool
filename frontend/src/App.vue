<template>
  <div class="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-200">
  <EventLog :events="eventLog" :onOpenLogfile="openLogfile" />
    <main class="flex-1 flex flex-col items-center justify-start py-10 px-6">
      <div class="w-full max-w-2xl space-y-8">
        <div class="bg-white rounded-xl shadow p-8 flex flex-col items-center">
          <img src="/assets/app-logo.webp" alt="App Logo" class="mx-auto mb-4 w-24 h-24 object-contain" />
          <h1 class="text-3xl font-extrabold mb-6 text-blue-900 tracking-tight">Aura Tool</h1>
          <RepoInput @repo-cloned="onRepoCloned" :check-repo-exists="checkRepoExists" :confirm-overwrite="confirmOverwrite" />
        </div>
        <div class="bg-white rounded-xl shadow p-8 flex flex-col items-center">
          <div v-if="repos.length" class="w-full mb-6">
            <label class="block mb-1 font-semibold text-gray-700">Cloned repositories:</label>
            <select v-model="selectedRepo" @change="onRepoSelect" class="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-300">
              <option v-for="repo in repos" :key="repo.path" :value="repo.path">{{ repo.name }}</option>
            </select>
          </div>
          <div v-if="repoPath" class="w-full mb-8">
            <AnalysisButtons :repoPath="repoPath" :srcExists="srcExists" @lint-result="onLintResult" @llm-result="onLLMResult" />
          </div>
          <ResultDisplay :lintResult="lintResult" :llmResult="llmResult" />
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import RepoInput from './components/RepoInput.vue';
import AnalysisButtons from './components/AnalysisButtons.vue';
import ResultDisplay from './components/ResultDisplay.vue';
import EventLog from './components/EventLog.vue';
import { fetchLog, openLogfile } from './utils/logUtils';

export default defineComponent({
  components: { RepoInput, AnalysisButtons, ResultDisplay, EventLog },
  setup() {
    const repoPath = ref<string | null>(null);
    const srcExists = ref<boolean>(false);
    const lintResult = ref<any>(null);
    const llmResult = ref<any>(null);
    const repos = ref<{ name: string; path: string }[]>([]);
    const selectedRepo = ref<string | null>(null);
  const eventLog = ref<any[]>([]);

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
      setTimeout(updateEventLog, 500);
    }
    function onRepoSelect() {
      const repo = repos.value.find(r => r.path === selectedRepo.value);
      if (repo) repoPath.value = repo.path;
    }
    function onLintResult(result: any) {
      lintResult.value = result;
      setTimeout(updateEventLog, 500);
    }
    function onLLMResult(result: any) {
      llmResult.value = result;
      setTimeout(updateEventLog, 500);
    }
  onMounted(() => { fetchRepos(); updateEventLog(); });
  return { repoPath, srcExists, lintResult, llmResult, onRepoCloned, onLintResult, onLLMResult, repos, selectedRepo, onRepoSelect, eventLog, openLogfile, checkRepoExists, confirmOverwrite };
  }
});
</script>
