<template>
  <header class="h-20 flex items-center border-b px-6 bg-white">
    <!-- App Logo & Title -->
    <div class="flex items-center gap-3">
      <img src="/assets/app-logo.webp" alt="App Logo" class="w-10 h-10 rounded-xl object-contain" />
      <span class="text-xl font-bold">Aura Tool</span>
    </div>
    
    <!-- Navigation Menu in the center -->
    <div class="flex-1 flex justify-center">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              @click="setActiveView('eslint')"
              :class="[
                'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
                { 'bg-accent text-accent-foreground': activeView === 'eslint' }
              ]"
            >
              ESLint Analysis
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              @click="setActiveView('llm')"
              :class="[
                'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
                { 'bg-accent text-accent-foreground': activeView === 'llm' }
              ]"
            >
              LLM Analysis
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
    
    <!-- Project & Target Controls -->
    <div class="flex items-start gap-8">
      <!-- Project Selection -->
      <div class="flex flex-col min-w-0">
        <label class="text-xs font-medium text-gray-500 mb-2">Repository</label>
        <div class="flex items-center gap-2">
          <Select v-model="selectedProject" @update:modelValue="onRepoSelect" class="w-[200px]" :disabled="availableProjects.length === 0">
            <SelectTrigger>
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="repo in availableProjects" :key="repo.path" :value="repo.path">
                  {{ repo.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <RepoInput />
        </div>
      </div>

      <!-- Analysis Target -->
      <div class="flex flex-col min-w-0">
        <label class="text-xs font-medium text-gray-500 mb-2">Analysis Target</label>
        <div class="flex items-center gap-2">
          <Select v-model="selectedAnalysisFolder" :disabled="!selectedProject || availableFolders.length === 0" class="w-[180px]">
            <SelectTrigger>
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="folder in availableFolders" :key="folder" :value="folder">
                  {{ folder }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FolderInput />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  NavigationMenu, 
  NavigationMenuItem, 
  NavigationMenuList, 
  NavigationMenuLink 
} from './ui/navigation-menu';
import RepoInput from './RepoInput.vue';
import FolderInput from './FolderInput.vue';
import { useProjectManagement } from '../composables/useProjectManagement';
import { useAnalysisTarget } from '../composables/useAnalysisTarget';

// Use project management composable
const {
  availableProjects,
  selectedProject,
  setActiveProject,
} = useProjectManagement();

// Use analysis target composable
const {
  availableFolders,
  selectedAnalysisFolder,
} = useAnalysisTarget(selectedProject);

// Navigation state - we'll emit this to parent
const activeView = ref<'eslint' | 'llm'>('eslint');

// Emit events to parent
const emit = defineEmits<{
  viewChange: [view: 'eslint' | 'llm'];
  analysisTargetChange: [folder: string | null];
}>();

function setActiveView(view: 'eslint' | 'llm') {
  activeView.value = view;
  emit('viewChange', view);
}

function onRepoSelect(value: any) {
  setActiveProject(value as string | null);
}

// Watch for analysis folder changes and emit them
watch(selectedAnalysisFolder, (newFolder: string | null) => {
  emit('analysisTargetChange', newFolder);
});
</script>
