<template>
  <form @submit.prevent="addFolder" class="flex gap-2 items-center w-full min-w-80">
    <Input v-model="folderPath" type="text" placeholder="Local folder path (e.g., /path/to/project)"/>
    <Button type="submit" variant="outline">Add Folder</Button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'folder-added', payload: { folderPath: string; name: string }): void,
  (e: 'folder-error', message: string): void
}>();

const folderPath = ref('');

async function addFolder() {
  if (!folderPath.value) {
    emit('folder-error', 'Please enter a folder path.');
    return;
  }

  try {
    const res = await fetch('/api/repos/add-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderPath.value })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to add folder');
    emit('folder-added', { folderPath: data.folderPath, name: data.name });
    folderPath.value = '';
  } catch (e: any) {
    emit('folder-error', e.message);
  }
}
</script>