<template>
  <div class="h-screen flex flex-col min-h-0">
    <!-- Header Bar -->
    <AppHeader 
      @view-change="handleViewChange" 
      @analysis-target-change="handleAnalysisTargetChange"
    />

    <!-- Body -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar: Event Log -->
      <AppSidebar :events="eventLog" />

      <!-- Main Content -->
      <AppMainContent 
        :active-view="activeView" 
        :selected-analysis-folder="selectedAnalysisFolder"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from './components/AppHeader.vue';
import AppSidebar from './components/AppSidebar.vue';
import AppMainContent from './components/AppMainContent.vue';
import { useEventLog } from './composables/useEventLog';

// Event log for operation history
const { events: eventLog } = useEventLog();

// Navigation state
const activeView = ref<'eslint' | 'llm'>('eslint');

// Analysis target state (shared between header and content)
const selectedAnalysisFolder = ref<string | null>(null);

function handleViewChange(view: 'eslint' | 'llm') {
  activeView.value = view;
}

function handleAnalysisTargetChange(folder: string | null) {
  selectedAnalysisFolder.value = folder;
}
</script>


