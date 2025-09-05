<template>
  <div class="flex gap-2 items-center">
    <button @click="runLint" class="bg-green-600 text-white px-4 py-1 rounded">ESLint Analyse</button>
    <button @click="runLLM" class="bg-purple-600 text-white px-4 py-1 rounded">LLM Analyse</button>
    <div v-if="showSrcInput" class="flex items-center gap-2 ml-2">
      <span v-if="srcPath">Pfad: <span class="font-mono">{{ srcPath }}</span></span>
      <span v-else-if="ambiguous">Pfad: <span class="italic text-gray-500">(bitte wählen)</span></span>
      <template v-if="folders.length > 1">
        <select v-model="srcPath" class="border rounded px-2 py-1">
          <option v-for="folder in folders" :key="folder" :value="folder">{{ folder }}</option>
        </select>
        <input v-model="srcPath" type="text" placeholder="Pfad zum Quellordner (manuell)" class="border rounded px-2 py-1 ml-2" />
      </template>
      <template v-else-if="folders.length === 1">
        <!-- Only one folder, show as selected and allow manual override -->
        <input v-model="srcPath" type="text" :placeholder="folders[0]" class="border rounded px-2 py-1 ml-2" />
      </template>
      <template v-else>
        <span class="italic text-gray-500">Keine Unterordner gefunden, es wird das Wurzelverzeichnis verwendet.</span>
        <input v-model="srcPath" type="text" placeholder="(root)" class="border rounded px-2 py-1 ml-2" />
      </template>
    </div>
  </div>
  <div v-if="error" class="text-red-600 mt-2">{{ error }}</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';

export default defineComponent({
  props: {
    repoPath: { type: String, required: true },
    srcExists: { type: Boolean, required: true }
  },
  emits: ['lint-result', 'llm-result'],
  setup(props, { emit }) {
    const error = ref('');
  const srcPath = ref(props.srcExists ? 'src' : '');
  const ambiguous = ref(false);
  const manualInput = ref(false);
  const showSrcInput = ref(!props.srcExists);
  const folders = ref<string[]>([]);

    // Detect ambiguous case (multiple folders)
    watch(() => props.repoPath, async (newPath) => {
      ambiguous.value = false;
      manualInput.value = false;
      folders.value = [];
      if (!props.srcExists && newPath) {
        // Try to find possible source folders
        try {
          const res = await fetch('/api/repos');
          const repos = await res.json();
          const repo = repos.find((r: any) => r.path === newPath);
          if (repo) {
            // List folders in repo
            const resp = await fetch('/api/listfolders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ repoPath: newPath })
            });
            folders.value = await resp.json();
            if (folders.value.length === 1) {
              srcPath.value = folders.value[0];
            } else if (folders.value.length > 1) {
              ambiguous.value = true;
              srcPath.value = '';
            } else {
              srcPath.value = '';
            }
          }
        } catch {
          srcPath.value = '';
        }
      } else if (props.srcExists) {
        srcPath.value = 'src';
      }
    }, { immediate: true });

    async function selectFolder() {
      // Try to open explorer for folder selection
      try {
        const res = await fetch('/api/openfolder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath: props.repoPath })
        });
        if (!res.ok) throw new Error('openfolder failed');
      } catch {
        manualInput.value = true;
      }
    }
    async function runLint() {
      error.value = '';
      try {
        const res = await fetch('/api/lint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath: props.repoPath, lintPath: srcPath.value || undefined })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        emit('lint-result', data);
      } catch (e: any) {
        error.value = e.message;
      }
    }
    async function runLLM() {
      error.value = '';
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoPath: props.repoPath, srcPath: srcPath.value || undefined })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        emit('llm-result', data);
      } catch (e: any) {
        error.value = e.message;
      }
    }
  return { error, srcPath, showSrcInput, runLint, runLLM, ambiguous, selectFolder, manualInput, folders };
  }
});
</script>
