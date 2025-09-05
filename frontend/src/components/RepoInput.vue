<template>
  <form @submit.prevent="cloneRepo" class="flex gap-2">
    <input v-model="repoUrl" type="text" placeholder="GitHub repository URL" class="flex-1 border rounded px-2 py-1" />
    <button type="submit" class="bg-blue-600 text-white px-4 py-1 rounded">Clone</button>
  </form>
  <div v-if="error" class="text-red-600 mt-2">{{ error }}</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  emits: ['repo-cloned'],
  props: {
    checkRepoExists: Function,
    confirmOverwrite: Function
  },
  setup(props, { emit }) {
    const repoUrl = ref('');
    const error = ref('');
    async function cloneRepo() {
      error.value = '';
      if (!repoUrl.value) {
        error.value = 'Please enter a repository URL.';
        return;
      }
      let force = false;
      if (typeof props.checkRepoExists === 'function' && await props.checkRepoExists(repoUrl.value)) {
        if (!(typeof props.confirmOverwrite === 'function' && await props.confirmOverwrite(repoUrl.value))) {
          error.value = 'Repository already exists. Cloning cancelled.';
          return;
        }
        force = true;
      }
      try {
        const res = await fetch('/api/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: repoUrl.value, force })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Clone failed');
        emit('repo-cloned', { repoPath: data.repoPath, srcExists: data.srcExists });
      } catch (e: any) {
        error.value = e.message;
      }
    }
    return { repoUrl, error, cloneRepo };
  }
});
</script>
