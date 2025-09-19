import { ref, watch, computed, type Ref } from 'vue';

export function useAnalysisTarget(selectedProject: Ref<string | null>) {
  const availableFolders = ref<string[]>([]);
  const selectedAnalysisFolder = ref<string | null>(null);
  const isLoading = ref(false);

  // Fetch available folders within the selected project
  async function fetchAnalysisFolders() {
    if (!selectedProject.value) {
      availableFolders.value = [];
      selectedAnalysisFolder.value = null;
      return;
    }

    try {
      isLoading.value = true;
      const res = await fetch('/api/listfolders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: selectedProject.value })
      });

      if (!res.ok) {
        console.warn('listfolders request failed with status', res.status);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        availableFolders.value = data;
        
        // Auto-select first folder if none selected or current selection is invalid
        if (!selectedAnalysisFolder.value || !availableFolders.value.includes(selectedAnalysisFolder.value)) {
          selectedAnalysisFolder.value = availableFolders.value[0] || null;
        }
      }
    } catch (error) {
      console.warn('Failed to load folders', error);
      availableFolders.value = [];
      selectedAnalysisFolder.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  // Set the analysis target folder
  function setAnalysisTarget(folderPath: string | null) {
    selectedAnalysisFolder.value = folderPath;
  }

  // Check if analysis can be performed
  const canAnalyze = computed(() => {
    return !!(selectedProject.value && selectedAnalysisFolder.value);
  });

  // Watch for project changes and refresh folders
  watch(selectedProject, (newProject, oldProject) => {
    if (newProject && newProject !== oldProject) {
      fetchAnalysisFolders();
    } else if (!newProject) {
      availableFolders.value = [];
      selectedAnalysisFolder.value = null;
    }
  }, { immediate: true });

  return {
    // State
    availableFolders,
    selectedAnalysisFolder,
    isLoading,
    canAnalyze,
    
    // Actions
    fetchAnalysisFolders,
    setAnalysisTarget,
  };
}
