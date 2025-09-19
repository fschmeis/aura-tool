<template>
  <form @submit.prevent="cloneRepo" class="flex gap-2 items-center w-full min-w-80">
    <Input v-model="repoUrl" type="text" placeholder="GitHub repository URL" />
    <Button type="submit" variant="default" :disabled="statusState.isLoading">
      Clone
    </Button>
  </form>
  
  <StatusDisplay 
    :hasError="statusState.hasError"
    :errorMessage="statusState.errorMessage"
    :isLoading="statusState.isLoading"
    :showSuccess="statusState.showSuccess"
    :successMessage="statusState.successMessage"
    loadingMessage="Cloning repository..."
    @clearError="clearError"
    @clearSuccess="clearSuccess"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Input } from './ui/input';
import { Button } from './ui/button';
import StatusDisplay from './StatusDisplay.vue';
import { useStatusHandling } from '../composables/useErrorHandling';
import { useProjectManagement } from '../composables/useProjectManagement';

const repoUrl = ref('');
const { statusState, handleAsyncOperation, clearError, clearSuccess } = useStatusHandling();
const { addProjectFromRepo, checkProjectExists, confirmOverwrite } = useProjectManagement();

async function cloneRepo() {
  if (!repoUrl.value) {
    return;
  }

  const result = await handleAsyncOperation(async () => {
    // Check if repo already exists
    if (await checkProjectExists(repoUrl.value)) {
      if (!(await confirmOverwrite(repoUrl.value))) {
        throw new Error('Repository already exists. Cloning cancelled.');
      }
    }

    // Perform the clone
    const res = await fetch('/api/clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        repoUrl: repoUrl.value, 
        force: await checkProjectExists(repoUrl.value)
      })
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Clone failed');
    
    return { repoPath: data.repoPath, srcExists: data.srcExists };
  }, undefined, 'Repository cloned successfully!');

  if (result) {
    await addProjectFromRepo(result);
    repoUrl.value = ''; // Clear on success
  }
}
</script>
