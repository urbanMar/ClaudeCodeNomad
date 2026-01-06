import { For, Show, createSignal } from 'solid-js';
import { Button } from '../components/ui/Button';
import { useProjects } from '../stores/projects';
import { formatTimestamp } from '../lib/formatters';
import type { Project } from '../lib/types';

interface ProjectPickerProps {
  onSelectProject: (project: Project) => void;
}

export function ProjectPicker(props: ProjectPickerProps) {
  const { projects, refetch } = useProjects();
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = createSignal('');

  const filteredProjects = () => {
    const query = searchQuery().toLowerCase();
    return (projects() || []).filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.path.toLowerCase().includes(query)
    );
  };

  return (
    <div class="h-full flex flex-col bg-void">
      {/* Header */}
      <div class="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 class="text-3xl font-display font-bold text-neon-cyan glow-text">
            ClaudeCockpit
          </h1>
          <p class="text-muted text-sm mt-1">Mission Control for Claude Code</p>
        </div>
        <div class="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          <Button variant="primary" size="sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Session
          </Button>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div class="flex items-center gap-4 p-4 border-b border-border">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            class="input-field pl-10"
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>
        <div class="flex border border-border rounded-lg overflow-hidden">
          <button
            class={`px-3 py-2 transition-colors ${viewMode() === 'grid' ? 'bg-surface text-neon-cyan' : 'text-muted hover:text-text'}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            class={`px-3 py-2 transition-colors ${viewMode() === 'list' ? 'bg-surface text-neon-cyan' : 'text-muted hover:text-text'}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Project Grid/List */}
      <div class="flex-1 overflow-auto p-4">
        <Show when={projects.loading}>
          <div class="flex items-center justify-center h-64">
            <div class="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full" />
          </div>
        </Show>

        <Show when={!projects.loading && filteredProjects().length === 0}>
          <div class="flex flex-col items-center justify-center h-64 text-muted">
            <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p class="text-lg">No projects found</p>
            <p class="text-sm mt-1">
              {searchQuery() ? 'Try a different search term' : 'Run Claude CLI in a project to get started'}
            </p>
          </div>
        </Show>

        <Show when={!projects.loading && viewMode() === 'grid' && filteredProjects().length > 0}>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <For each={filteredProjects()}>
              {(project) => (
                <ProjectCard
                  project={project}
                  onClick={() => props.onSelectProject(project)}
                />
              )}
            </For>
          </div>
        </Show>

        <Show when={!projects.loading && viewMode() === 'list' && filteredProjects().length > 0}>
          <div class="space-y-2">
            <For each={filteredProjects()}>
              {(project) => (
                <ProjectRow
                  project={project}
                  onClick={() => props.onSelectProject(project)}
                />
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Footer */}
      <div class="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted">
        <span>ClaudeCockpit v0.1.0</span>
        <span>{filteredProjects().length} of {(projects() || []).length} projects</span>
      </div>
    </div>
  );
}

function ProjectCard(props: { project: Project; onClick: () => void }) {
  const lastActivity = () => {
    if (!props.project.last_activity) return null;
    return new Date(props.project.last_activity * 1000).toISOString();
  };

  return (
    <div
      class="panel p-4 cursor-pointer hover:border-neon-cyan/50 hover:shadow-lg hover:shadow-neon-cyan/10 transition-all group"
      onClick={props.onClick}
    >
      <div class="flex items-start justify-between mb-3">
        <div class="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center group-hover:bg-neon-cyan/20 transition-colors">
          <svg class="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <span class="tag-muted">{props.project.session_count} sessions</span>
      </div>

      <h3 class="font-semibold text-text group-hover:text-neon-cyan transition-colors truncate">
        {props.project.name}
      </h3>

      <p class="text-xs text-muted mt-1 truncate" title={props.project.path}>
        {props.project.path}
      </p>

      <Show when={lastActivity()}>
        <p class="text-xs text-muted mt-2 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatTimestamp(lastActivity()!)}
        </p>
      </Show>
    </div>
  );
}

function ProjectRow(props: { project: Project; onClick: () => void }) {
  const lastActivity = () => {
    if (!props.project.last_activity) return null;
    return new Date(props.project.last_activity * 1000).toISOString();
  };

  return (
    <div
      class="panel flex items-center gap-4 p-4 cursor-pointer hover:border-neon-cyan/50 transition-all group"
      onClick={props.onClick}
    >
      <div class="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center group-hover:bg-neon-cyan/20 transition-colors">
        <svg class="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-text group-hover:text-neon-cyan transition-colors">
          {props.project.name}
        </h3>
        <p class="text-xs text-muted truncate">{props.project.path}</p>
      </div>

      <div class="text-sm text-muted whitespace-nowrap">
        {props.project.session_count} sessions
      </div>

      <Show when={lastActivity()}>
        <div class="text-sm text-muted whitespace-nowrap">
          {formatTimestamp(lastActivity()!)}
        </div>
      </Show>

      <svg class="w-5 h-5 text-muted group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}
