import { For, Show, createResource } from 'solid-js';
import { listMcpServers, toggleMcpServer } from '../../lib/tauri';

export function McpList() {
  const [mcpServers, { refetch }] = createResource(listMcpServers);

  return (
    <div class="p-3 border-b border-border">
      <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
        MCP Servers
      </h3>

      <Show when={mcpServers.loading}>
        <div class="flex items-center gap-2 text-xs text-muted">
          <div class="animate-spin w-3 h-3 border border-neon-cyan border-t-transparent rounded-full" />
          Loading...
        </div>
      </Show>

      <Show when={!mcpServers.loading && (mcpServers()?.length || 0) === 0}>
        <div class="text-xs text-muted italic py-2">
          No MCP servers configured
        </div>
      </Show>

      <Show when={!mcpServers.loading && (mcpServers()?.length || 0) > 0}>
        <div class="space-y-2">
          <For each={mcpServers()}>
            {(server) => (
              <div class="flex items-center justify-between p-2 bg-surface rounded group">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div class={`w-2 h-2 rounded-full flex-shrink-0 ${
                    server.connected
                      ? 'bg-neon-cyan animate-pulse'
                      : server.enabled
                        ? 'bg-neon-yellow'
                        : 'bg-muted'
                  }`} />
                  <div class="min-w-0">
                    <span class="text-sm text-text truncate block">{server.name}</span>
                    <Show when={server.command}>
                      <span class="text-xs text-muted truncate block">{server.command}</span>
                    </Show>
                  </div>
                </div>

                <label class="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={server.enabled}
                    onChange={async (e) => {
                      try {
                        await toggleMcpServer(server.name, e.currentTarget.checked);
                        refetch();
                      } catch (err) {
                        console.error('Failed to toggle MCP server:', err);
                      }
                    }}
                    class="sr-only peer"
                  />
                  <div class="w-9 h-5 bg-border rounded-full peer peer-checked:bg-neon-cyan/30 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-muted after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-neon-cyan" />
                </label>
              </div>
            )}
          </For>
        </div>

        {/* Refresh button */}
        <button
          class="mt-2 text-xs text-muted hover:text-neon-cyan transition-colors flex items-center gap-1"
          onClick={() => refetch()}
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </Show>
    </div>
  );
}
