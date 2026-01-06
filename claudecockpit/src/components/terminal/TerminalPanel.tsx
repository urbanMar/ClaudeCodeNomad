import { For, Show, createEffect } from 'solid-js';
import { Terminal } from './Terminal';
import { useTerminals } from '../../stores/terminals';
import { useSessions } from '../../stores/sessions';

export function TerminalPanel() {
  const {
    terminalTabs,
    activeTerminalId,
    activeTerminal,
    setActiveTerminalId,
    closeTerminal,
    openTerminal,
    toggleTerminal,
    terminalVisible,
  } = useTerminals();

  const { activeTab } = useSessions();

  // Auto-open terminal when session tab changes
  createEffect(() => {
    const tab = activeTab();
    if (tab && terminalVisible()) {
      openTerminal(tab.projectPath, tab.sessionId, `Claude: ${tab.title}`);
    }
  });

  return (
    <div class="h-full flex flex-col bg-void border-l border-border">
      {/* Terminal tab bar */}
      <div class="flex items-center bg-deep border-b border-border">
        <div class="flex-1 flex items-center overflow-x-auto">
          <For each={terminalTabs()}>
            {(tab) => (
              <div
                class={`
                  flex items-center gap-2 px-3 py-2 text-sm border-r border-border
                  transition-colors whitespace-nowrap cursor-pointer
                  ${activeTerminalId() === tab.id
                    ? 'bg-surface text-neon-cyan'
                    : 'text-muted hover:text-text hover:bg-surface/50'
                  }
                `}
                onClick={() => setActiveTerminalId(tab.id)}
              >
                <div class={`w-2 h-2 rounded-full ${tab.connected ? 'bg-neon-cyan' : 'bg-muted'}`} />
                <span class="max-w-[120px] truncate">{tab.title}</span>
                <button
                  class="ml-1 p-0.5 rounded hover:bg-border transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTerminal(tab.id);
                  }}
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </For>
        </div>

        {/* Panel controls */}
        <div class="flex items-center px-2 gap-1">
          <button
            class="p-1.5 text-muted hover:text-neon-cyan transition-colors rounded"
            onClick={toggleTerminal}
            title="Hide terminal"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active terminal */}
      <div class="flex-1 overflow-hidden">
        <Show when={activeTerminal()} fallback={
          <div class="h-full flex items-center justify-center text-muted">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No terminal open</p>
              <p class="text-xs mt-1">Select a session to start</p>
            </div>
          </div>
        }>
          <Terminal
            projectPath={activeTerminal()!.projectPath}
            sessionId={activeTerminal()!.sessionId || undefined}
            onExit={(code) => {
              console.log('Terminal exited with code:', code);
            }}
          />
        </Show>
      </div>
    </div>
  );
}
