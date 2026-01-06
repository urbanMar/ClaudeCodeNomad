import { For, Show, createEffect, createSignal } from 'solid-js';
import { Button } from '../components/ui/Button';
import { useSessions } from '../stores/sessions';
import { formatTimestamp, formatModelName } from '../lib/formatters';
import { spawnClaudeSession, openInFinder } from '../lib/tauri';
import type { Project, Session } from '../lib/types';

interface SessionPickerProps {
  project: Project;
  onBack: () => void;
  onOpenSession: (session: Session) => void;
}

export function SessionPicker(props: SessionPickerProps) {
  const { sessions, setCurrentProjectId, refetchSessions } = useSessions();
  const [searchQuery, setSearchQuery] = createSignal('');
  const [showAgents, setShowAgents] = createSignal(true);
  const [showMenu, setShowMenu] = createSignal(false);
  const [spawning, setSpawning] = createSignal(false);
  const [spawnError, setSpawnError] = createSignal<string | null>(null);

  createEffect(() => {
    setCurrentProjectId(props.project.id);
  });

  const handleSpawnSession = async (resume: boolean = false) => {
    setSpawning(true);
    setSpawnError(null);
    setShowMenu(false);
    try {
      const result = await spawnClaudeSession(props.project.path, resume);
      if (!result.success) {
        setSpawnError(result.message);
      }
    } catch (err) {
      setSpawnError(err instanceof Error ? err.message : 'Failed to spawn session');
    } finally {
      setSpawning(false);
    }
  };

  const handleOpenInFinder = async () => {
    setShowMenu(false);
    try {
      await openInFinder(props.project.path);
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  const mainSessions = () =>
    (sessions() || []).filter(s => !s.is_agent);

  const agentSessions = () =>
    (sessions() || []).filter(s => s.is_agent);

  const filteredMainSessions = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return mainSessions();
    return mainSessions().filter(s =>
      s.id.toLowerCase().includes(query) ||
      s.model?.toLowerCase().includes(query) ||
      s.git_branch?.toLowerCase().includes(query)
    );
  };

  const filteredAgentSessions = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return agentSessions();
    return agentSessions().filter(s =>
      s.id.toLowerCase().includes(query) ||
      s.model?.toLowerCase().includes(query)
    );
  };

  return (
    <div class="h-full flex flex-col bg-void">
      {/* Header */}
      <div class="flex items-center gap-4 p-6 border-b border-border">
        <button
          class="text-muted hover:text-text transition-colors p-1 -ml-1"
          onClick={props.onBack}
          title="Back to projects"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-display text-neon-cyan truncate">{props.project.name}</h1>
          <p class="text-muted text-sm truncate" title={props.project.path}>{props.project.path}</p>
        </div>

        <Button variant="secondary" size="sm" onClick={() => refetchSessions()}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>

        {/* New Session Dropdown */}
        <div class="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowMenu(!showMenu())}
            disabled={spawning()}
          >
            <Show when={spawning()} fallback={
              <>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                New Session
                <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            }>
              <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Launching...
            </Show>
          </Button>

          <Show when={showMenu()}>
            {/* Backdrop */}
            <div
              class="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div class="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                class="w-full px-4 py-3 text-left text-sm text-text hover:bg-neon-cyan/10 hover:text-neon-cyan transition-colors flex items-center gap-3"
                onClick={() => handleSpawnSession(false)}
              >
                <svg class="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <div>
                  <div class="font-medium">New Session</div>
                  <div class="text-xs text-muted">Start fresh Claude session</div>
                </div>
              </button>

              <button
                class="w-full px-4 py-3 text-left text-sm text-text hover:bg-neon-magenta/10 hover:text-neon-magenta transition-colors flex items-center gap-3 border-t border-border"
                onClick={() => handleSpawnSession(true)}
              >
                <svg class="w-4 h-4 text-neon-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div>
                  <div class="font-medium">Resume Last</div>
                  <div class="text-xs text-muted">Continue previous session</div>
                </div>
              </button>

              <div class="border-t border-border" />

              <button
                class="w-full px-4 py-3 text-left text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                onClick={handleOpenInFinder}
              >
                <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <div>
                  <div class="font-medium">Open in Finder</div>
                  <div class="text-xs text-muted">Show project folder</div>
                </div>
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Error Toast */}
      <Show when={spawnError()}>
        <div class="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm text-red-400 flex-1">{spawnError()}</span>
          <button
            class="text-red-400 hover:text-red-300 transition-colors"
            onClick={() => setSpawnError(null)}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Show>

      {/* Search & Filters */}
      <div class="flex items-center gap-4 p-4 border-b border-border">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search sessions..."
            class="input-field pl-10"
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>

        <label class="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={showAgents()}
            onChange={(e) => setShowAgents(e.currentTarget.checked)}
            class="w-4 h-4 rounded border-border bg-surface text-neon-cyan focus:ring-neon-cyan/50"
          />
          Show sub-agents
        </label>
      </div>

      {/* Session List */}
      <div class="flex-1 overflow-auto p-4 space-y-6">
        <Show when={sessions.loading}>
          <div class="flex items-center justify-center h-32">
            <div class="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full" />
          </div>
        </Show>

        <Show when={!sessions.loading}>
          {/* Main Sessions */}
          <div>
            <h2 class="text-sm font-display text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Sessions ({filteredMainSessions().length})
            </h2>

            <Show when={filteredMainSessions().length === 0}>
              <div class="panel p-8 text-center text-muted">
                <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No sessions found</p>
                <p class="text-sm mt-1">Start a new Claude session in this project</p>
              </div>
            </Show>

            <div class="space-y-2">
              <For each={filteredMainSessions()}>
                {(session) => (
                  <SessionRow
                    session={session}
                    onClick={() => props.onOpenSession(session)}
                  />
                )}
              </For>
            </div>
          </div>

          {/* Agent Sessions */}
          <Show when={showAgents() && filteredAgentSessions().length > 0}>
            <div>
              <h2 class="text-sm font-display text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Sub-Agents ({filteredAgentSessions().length})
              </h2>

              <div class="space-y-2">
                <For each={filteredAgentSessions()}>
                  {(session) => (
                    <SessionRow
                      session={session}
                      onClick={() => props.onOpenSession(session)}
                      isAgent
                    />
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>
      </div>

      {/* Footer Stats */}
      <div class="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted">
        <span>{(sessions() || []).length} total sessions</span>
        <span>{agentSessions().length} sub-agents</span>
      </div>
    </div>
  );
}

function SessionRow(props: { session: Session; onClick: () => void; isAgent?: boolean }) {
  const startTime = () => {
    if (!props.session.start_time) return null;
    return new Date(props.session.start_time * 1000).toISOString();
  };

  return (
    <div
      class={`
        panel flex items-center gap-4 p-4 cursor-pointer
        hover:border-neon-cyan/50 hover:shadow-lg hover:shadow-neon-cyan/5
        transition-all group
        ${props.isAgent ? 'border-l-2 border-l-neon-magenta/50' : ''}
      `}
      onClick={props.onClick}
    >
      {/* Icon */}
      <div class={`
        w-10 h-10 rounded-lg flex items-center justify-center transition-colors
        ${props.isAgent
          ? 'bg-neon-magenta/10 group-hover:bg-neon-magenta/20'
          : 'bg-neon-cyan/10 group-hover:bg-neon-cyan/20'
        }
      `}>
        {props.isAgent ? (
          <svg class="w-5 h-5 text-neon-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg class="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </div>

      {/* Main Info */}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="font-medium text-text group-hover:text-neon-cyan transition-colors font-mono text-sm">
            {props.isAgent ? props.session.id.replace('agent-', '').slice(0, 12) : props.session.id.slice(0, 12)}
          </h3>
          <Show when={props.session.model}>
            <span class="tag-primary text-xs">
              {formatModelName(props.session.model!)}
            </span>
          </Show>
        </div>

        <div class="flex items-center gap-3 mt-1 text-xs text-muted">
          <Show when={startTime()}>
            <span>{formatTimestamp(startTime()!)}</span>
          </Show>
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {props.session.message_count} messages
          </span>
          <Show when={props.session.git_branch}>
            <span class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {props.session.git_branch}
            </span>
          </Show>
        </div>
      </div>

      {/* Arrow */}
      <svg class="w-5 h-5 text-muted group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}
