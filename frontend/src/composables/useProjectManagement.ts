import { ref, watch } from 'vue';

export interface Project {
  name: string;
  path: string;
}

export function useProjectManagement() {
  const availableProjects = ref<Project[]>([]);
  const selectedProject = ref<string | null>(null);
  const isLoading = ref(false);

  // Fetch all available projects from backend
  async function fetchProjects() {
    try {
      isLoading.value = true;
      const res = await fetch('/api/repos');
      const projects = await res.json();
      availableProjects.value = projects;

      // Try to restore last selected project from localStorage
      const lastSelectedProject = localStorage.getItem('aura-tool-last-project');
      const projectExists = lastSelectedProject && availableProjects.value.some(p => p.path === lastSelectedProject);

      if (projectExists) {
        setActiveProject(lastSelectedProject);
      } else if (availableProjects.value.length && !selectedProject.value) {
        // Auto-select the first project
        setActiveProject(availableProjects.value[0].path);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      isLoading.value = false;
    }
  }

  // Set the active project
  function setActiveProject(projectPath: string | null) {
    if (!projectPath) {
      selectedProject.value = null;
      localStorage.removeItem('aura-tool-last-project');
      return;
    }

    selectedProject.value = projectPath;
    localStorage.setItem('aura-tool-last-project', projectPath);
  }

  // Add project from repository (clone)
  async function addProjectFromRepo(payload: { repoPath: string; srcExists: boolean }) {
    // Refresh projects list after cloning
    await fetchProjects();
    
    // Set the newly cloned repo as active
    setActiveProject(payload.repoPath);
  }

  // Add project from existing folder
  async function addProjectFromFolder(payload: { folderPath: string; name: string }) {
    // Refresh projects list after adding folder
    await fetchProjects();
    
    // Set the newly added folder as active
    setActiveProject(payload.folderPath);
  }

  // Check if a repository already exists
  async function checkProjectExists(repoUrl: string): Promise<boolean> {
    const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'repo';
    const basePath = '/tmp/aura-tool';
    const targetPath = basePath + '/' + repoName;
    
    const res = await fetch('/api/repos');
    const projectsList = await res.json();
    return projectsList.some((p: Project) => p.path === targetPath);
  }

  // Confirm overwrite of existing repository
  async function confirmOverwrite(repoUrl: string): Promise<boolean> {
    return window.confirm('Repository already exists. Do you want to overwrite it? This will delete the previous clone.');
  }

  // Initialize projects on first load
  fetchProjects();

  return {
    // State
    availableProjects,
    selectedProject,
    isLoading,
    
    // Actions
    fetchProjects,
    setActiveProject,
    addProjectFromRepo,
    addProjectFromFolder,
    checkProjectExists,
    confirmOverwrite,
  };
}
