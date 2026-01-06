import { Show, createSignal } from 'solid-js';
import { Tabs } from '../components/ui/Tabs';
import { useSessions } from '../stores/sessions';
import { useTerminals } from '../stores/terminals';
import { ConfigSidebar } from '../components/config/ConfigSidebar';
import { ConversationPanel } from '../components/conversation/ConversationPanel';
import { StatusPanel } from '../components/status/StatusPanel';
import { TerminalPanel } from '../components/terminal';

interface SessionWorkspaceProps {
  onBack: () => void;
}

export function SessionWorkspace(props: SessionWorkspaceProps) {
  const { tabs, activeTabId, activeTab, activeMessages, closeTab, setActiveTabId } = useSessions();
  const { terminalVisible, toggleTerminal } = useTerminals();

  const [leftCollapsed, setLeftCollapsed] = createSignal(false);
  const [rightCollapsed, setRightCollapsed] = createSignal(false);
  const [terminalHeight, setTerminalHeight] = createSignal(300); // Default height in pixels

  const tabItems = () => tabs().map(t => ({
    id: t.id,
    label: t.title,
    closable: true,
  }));

  return (
    <div class="h-full flex flex-col bg-void">
      {/* Header with tabs */}
      <div class="flex items-center border-b border-border bg-deep">
        <button
          class="px-4 py-3 text-muted hover:text-text transition-colors border-r border-border"
          onClick={props.onBack}
          title="Back to sessions"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1 overflow-hidden">
          <Show when={tabs().length > 0} fallback={
            <div class="px-4 py-3 text-muted text-sm">No sessions open</div>
          }>
            <Tabs
              tabs={tabItems()}
              activeTab={activeTabId() || ''}
              onTabChange={setActiveTabId}
              onTabClose={closeTab}
            />
          </Show>
        </div>

        {/* Workspace actions */}
        <div class="flex items-center border-l border-border">
          <button
            class={`px-3 py-3 transition-colors ${
              terminalVisible() ? 'text-neon-cyan' : 'text-muted hover:text-neon-cyan'
            }`}
            title={terminalVisible() ? 'Hide terminal' : 'Show terminal'}
            onClick={toggleTerminal}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            class="px-3 py-3 text-muted hover:text-neon-cyan transition-colors"
            title="Refresh session"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area - 3 panel layout */}
      <div class="flex-1 flex overflow-hidden">
        {/* Left sidebar - Configuration */}
        <div
          class={`border-r border-border transition-all duration-200 ${
            leftCollapsed() ? 'w-12' : 'w-64'
          }`}
        >
          <ConfigSidebar
            collapsed={leftCollapsed()}
            onToggle={() => setLeftCollapsed(!leftCollapsed())}
          />
        </div>

        {/* Center - Conversation + Terminal (split view) */}
        <div class="flex-1 flex flex-col min-w-0">
          {/* Conversation area */}
          <div class={`flex-1 flex flex-col min-h-0 ${terminalVisible() ? '' : ''}`}>
            <Show when={activeTab()} fallback={
              <div class="flex-1 flex items-center justify-center text-muted">
                <div class="text-center">
                  <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p class="text-lg">Select a session to view</p>
                  <p class="text-sm mt-1">Open a session from the session picker</p>
                </div>
              </div>
            }>
              <ConversationPanel
                messages={activeMessages() || []}
                loading={activeMessages.loading}
                projectPath={activeTab()!.projectPath}
              />
            </Show>
          </div>

          {/* Terminal panel (split view) */}
          <Show when={terminalVisible() && activeTab()}>
            <div
              class="border-t border-border"
              style={{ height: `${terminalHeight()}px`, 'min-height': '150px' }}
            >
              {/* Resize handle */}
              <div
                class="h-1 bg-border hover:bg-neon-cyan/50 cursor-row-resize transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startHeight = terminalHeight();

                  const onMouseMove = (moveEvent: MouseEvent) => {
                    const delta = startY - moveEvent.clientY;
                    const newHeight = Math.max(150, Math.min(600, startHeight + delta));
                    setTerminalHeight(newHeight);
                  };

                  const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };

                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
              />
              <div class="h-full" style={{ height: 'calc(100% - 4px)' }}>
                <TerminalPanel />
              </div>
            </div>
          </Show>
        </div>

        {/* Right sidebar - Status */}
        <div
          class={`border-l border-border transition-all duration-200 ${
            rightCollapsed() ? 'w-12' : 'w-72'
          }`}
        >
          <StatusPanel
            collapsed={rightCollapsed()}
            onToggle={() => setRightCollapsed(!rightCollapsed())}
            session={activeTab()}
            messages={activeMessages() || []}
          />
        </div>
      </div>
    </div>
  );
}
