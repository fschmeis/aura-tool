<template>
  <form @submit.prevent="addFolder" class="flex gap-2 items-center w-full min-w-80">
    <Input v-model="folderPath" type="text" placeholder="Local folder path (e.g., /path/to/project)"/>
    <Button type="submit" variant="outline" :disabled="statusState.isLoading">
      Add Folder
    </Button>
  </form>
  
  <StatusDisplay 
    :hasError="statusState.hasError"
    :errorMessage="statusState.errorMessage"
    :isLoading="statusState.isLoading"
    :showSuccess="statusState.showSuccess"
    :successMessage="statusState.successMessage"
    loadingMessage="Adding folder..."
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

const folderPath = ref('');
const { statusState, handleAsyncOperation, clearError, clearSuccess } = useStatusHandling();
const { addProjectFromFolder } = useProjectManagement();

async function addFolder() {
  if (!folderPath.value) {
    return;
  }

  const result = await handleAsyncOperation(async () => {
    const res = await fetch('/api/repos/add-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderPath.value })
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to add folder');
    
    return { folderPath: data.folderPath, name: data.name };
  }, undefined, 'Folder added successfully!');

  if (result) {
    await addProjectFromFolder(result);
    folderPath.value = ''; // Clear on success
  }
}
</script>