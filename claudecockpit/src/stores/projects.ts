import { createSignal, createResource } from 'solid-js';
import { listProjects, getProject } from '../lib/tauri';

// Current selected project
const [selectedProjectId, setSelectedProjectId] = createSignal<string | null>(null);

// Projects resource (auto-fetches)
const [projects, { refetch: refetchProjects }] = createResource(listProjects);

// Selected project details
const [selectedProject] = createResource(
  selectedProjectId,
  async (id) => {
    if (!id) return null;
    return getProject(id);
  }
);

export function useProjects() {
  return {
    projects,
    selectedProjectId,
    selectedProject,
    selectProject: setSelectedProjectId,
    refetch: refetchProjects,
  };
}
