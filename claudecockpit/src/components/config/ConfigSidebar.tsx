import { Show, createResource, createMemo, createSignal } from 'solid-js';
import { Dropdown } from '../ui/Dropdown';
import { SubAgentTree } from './SubAgentTree';
import { useSessions } from '../../stores/sessions';
import { listInstalledSkills } from '../../lib/tauri';

interface ConfigSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ConfigSidebar(props: ConfigSidebarProps) {
  const { activeTab, sessions } = useSessions();
  const [selectedCommand, setSelectedCommand] = createSignal('');
  const [selectedAgent, setSelectedAgent] = createSignal('');

  // Load installed skills
  const [skills] = createResource(listInstalledSkills);

  // Model options
  const modelOptions = [
    { value: 'claude-opus-4-5-20251101', label: 'Opus 4.5', description: 'Most capable' },
    { value: 'claude-sonnet-4-20250514', label: 'Sonnet 4', description: 'Balanced' },
    { value: 'claude-3-5-haiku-20241022', label: 'Haiku 3.5', description: 'Fast' },
  ];

  // Build command options from loaded skills
  const commandOptions = createMemo(() => {
    const options = [{ value: '', label: 'No command', description: 'Run without a slash command' }];

    const loadedSkills = skills();
    if (loadedSkills) {
      for (const skill of loadedSkills) {
        options.push({
          value: `/${skill.name}`,
          label: `/${skill.name}`,
          description: skill.description || `From ${skill.plugin}`,
        });
      }
    }

    return options;
  });

  // Build target agent options from sub-agents in current session
  const agentOptions = createMemo(() => {
    const options = [{ value: '', label: 'Main session', description: 'Send to main Claude session' }];

    const sessionList = sessions();
    if (sessionList) {
      const agents = sessionList.filter(s => s.is_agent);
      for (const agent of agents) {
        const agentId = agent.id.replace('agent-', '').slice(0, 12);
        options.push({
          value: agent.id,
          label: `Agent: ${agentId}`,
          description: `${agent.message_count} messages`,
        });
      }
    }

    return options;
  });

  return (
    <div class="h-full flex flex-col bg-deep">
      {/* Collapse toggle */}
      <button
        class="p-3 border-b border-border hover:bg-surface transition-colors flex items-center justify-center"
        onClick={props.onToggle}
        title={props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          class={`w-5 h-5 text-muted transition-transform ${props.collapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <Show when={!props.collapsed}>
        <div class="flex-1 overflow-auto">
          {/* Sub-agents */}
          <Show when={activeTab()}>
            <div class="border-b border-border">
              <SubAgentTree
                projectId={activeTab()!.projectId}
                projectPath={activeTab()!.projectPath}
              />
            </div>
          </Show>

          {/* Configuration */}
          <div class="p-3 space-y-4">
            <h3 class="text-xs font-display text-muted uppercase tracking-wider flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuration
            </h3>

            <Dropdown
              label="Model"
              options={modelOptions}
              value="claude-opus-4-5-20251101"
              onChange={(v) => console.log('Model:', v)}
            />

            <Dropdown
              label="Command"
              options={commandOptions()}
              value={selectedCommand()}
              onChange={(v) => setSelectedCommand(v)}
              placeholder="Select command..."
            />

            <Dropdown
              label="Target Agent"
              options={agentOptions()}
              value={selectedAgent()}
              onChange={(v) => setSelectedAgent(v)}
            />

            {/* Skills loading indicator */}
            <Show when={skills.loading}>
              <p class="text-xs text-muted italic">Loading skills...</p>
            </Show>
          </div>

          {/* Quick actions */}
          <div class="p-3 border-t border-border">
            <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div class="space-y-2">
              <button class="w-full text-left text-sm text-muted hover:text-neon-cyan transition-colors py-1">
                Clear conversation
              </button>
              <button class="w-full text-left text-sm text-muted hover:text-neon-cyan transition-colors py-1">
                Export session
              </button>
              <button class="w-full text-left text-sm text-muted hover:text-neon-cyan transition-colors py-1">
                Copy session ID
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
