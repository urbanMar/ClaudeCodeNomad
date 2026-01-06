import { For, Show, createMemo } from 'solid-js';
import { useSessions } from '../../stores/sessions';
import type { Session } from '../../lib/types';

interface SubAgentTreeProps {
  projectId: string;
  projectPath: string;
}

export function SubAgentTree(props: SubAgentTreeProps) {
  const { sessions, openSession } = useSessions();

  const agentSessions = createMemo(() =>
    (sessions() || []).filter(s => s.is_agent)
  );

  return (
    <div class="p-3">
      <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Sub-Agents ({agentSessions().length})
      </h3>

      <Show when={agentSessions().length === 0}>
        <div class="text-xs text-muted italic py-2">
          No active sub-agents
        </div>
      </Show>

      <div class="space-y-1">
        <For each={agentSessions()}>
          {(agent) => (
            <AgentNode
              agent={agent}
              onClick={() => openSession(props.projectId, props.projectPath, agent)}
            />
          )}
        </For>
      </div>
    </div>
  );
}

function AgentNode(props: { agent: Session; onClick: () => void }) {
  const agentId = () => props.agent.id.replace('agent-', '').slice(0, 12);

  return (
    <button
      class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-surface transition-colors group"
      onClick={props.onClick}
    >
      <div class="w-6 h-6 rounded bg-neon-magenta/20 flex items-center justify-center flex-shrink-0">
        <svg class="w-3 h-3 text-neon-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <div class="text-sm font-mono text-text group-hover:text-neon-magenta transition-colors truncate">
          {agentId()}
        </div>
        <div class="text-xs text-muted">
          {props.agent.message_count} msgs
        </div>
      </div>

      {/* Status indicator */}
      <div class="w-2 h-2 rounded-full bg-neon-cyan animate-pulse flex-shrink-0" />
    </button>
  );
}
