<template>
  <form @submit.prevent="cloneRepo" class="flex gap-2 items-center w-full min-w-80">
    <Input v-model="repoUrl" type="text" placeholder="GitHub repository URL"/>
    <Button type="submit" variant="default">Clone</Button>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default defineComponent({
  emits: ['repo-cloned', 'repo-error'],
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
        emit('repo-error', 'Please enter a repository URL.');
        return;
      }
      let force = false;
      if (typeof props.checkRepoExists === 'function' && await props.checkRepoExists(repoUrl.value)) {
        if (!(typeof props.confirmOverwrite === 'function' && await props.confirmOverwrite(repoUrl.value))) {
          emit('repo-error', 'Repository already exists. Cloning cancelled.');
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
        emit('repo-error', e.message);
      }
    }
    return { repoUrl, cloneRepo };
  }
});
</script>
