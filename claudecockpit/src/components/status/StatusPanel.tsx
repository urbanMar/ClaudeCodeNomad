import { Show, createMemo } from 'solid-js';
import { formatNumber, formatModelName } from '../../lib/formatters';
import { McpList } from './McpList';
import type { TabState, SessionMessage } from '../../lib/types';

interface StatusPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  session: TabState | undefined;
  messages: SessionMessage[];
}

export function StatusPanel(props: StatusPanelProps) {
  // Calculate stats from messages
  const stats = createMemo(() => {
    if (!props.messages.length) return null;

    const firstMsg = props.messages.find(m => m.timestamp);
    const lastMsg = [...props.messages].reverse().find(m => m.timestamp);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let cachedTokens = 0;
    const usedModels = new Set<string>();
    const usedTools = new Set<string>();

    for (const msg of props.messages) {
      if (msg.message?.usage) {
        totalInputTokens += msg.message.usage.input_tokens || 0;
        totalOutputTokens += msg.message.usage.output_tokens || 0;
        cachedTokens += (msg.message.usage.cache_read_input_tokens || 0) +
                       (msg.message.usage.cache_creation_input_tokens || 0);
      }
      if (msg.message?.model) {
        usedModels.add(msg.message.model);
      }
      // Count tool uses
      if (Array.isArray(msg.message?.content)) {
        for (const block of msg.message.content) {
          if (block.type === 'tool_use' && block.name) {
            usedTools.add(block.name);
          }
        }
      }
    }

    // Calculate duration
    let durationMs = 0;
    if (firstMsg?.timestamp && lastMsg?.timestamp) {
      durationMs = new Date(lastMsg.timestamp).getTime() - new Date(firstMsg.timestamp).getTime();
    }

    return {
      messageCount: props.messages.length,
      userMessages: props.messages.filter(m => m.type === 'user' || m.message?.role === 'user').length,
      assistantMessages: props.messages.filter(m => m.type === 'assistant' || m.message?.role === 'assistant').length,
      totalInputTokens,
      totalOutputTokens,
      cachedTokens,
      usedModels: Array.from(usedModels),
      usedTools: Array.from(usedTools),
      durationMs,
    };
  });

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h ${Math.round((ms % 3600000) / 60000)}m`;
  };

  return (
    <div class="h-full flex flex-col bg-deep">
      {/* Collapse toggle */}
      <button
        class="p-3 border-b border-border hover:bg-surface transition-colors flex items-center justify-center"
        onClick={props.onToggle}
        title={props.collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        <svg
          class={`w-5 h-5 text-muted transition-transform ${props.collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>

      <Show when={!props.collapsed}>
        <div class="flex-1 overflow-auto">
          {/* Session Info */}
          <Show when={props.session}>
            <div class="p-3 border-b border-border">
              <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Session Info
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Session ID</span>
                  <span class="text-text font-mono text-xs truncate max-w-[120px]" title={props.session!.sessionId}>
                    {props.session!.sessionId.slice(0, 12)}...
                  </span>
                </div>
              </div>
            </div>
          </Show>

          {/* Stats */}
          <Show when={stats()}>
            <div class="p-3 border-b border-border">
              <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistics
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Messages</span>
                  <span class="text-text">{stats()!.messageCount}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">User</span>
                  <span class="text-neon-magenta">{stats()!.userMessages}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Assistant</span>
                  <span class="text-neon-cyan">{stats()!.assistantMessages}</span>
                </div>
                <Show when={stats()!.durationMs > 0}>
                  <div class="flex justify-between">
                    <span class="text-muted">Duration</span>
                    <span class="text-text">{formatDuration(stats()!.durationMs)}</span>
                  </div>
                </Show>
              </div>
            </div>

            {/* Token Usage */}
            <div class="p-3 border-b border-border">
              <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Token Usage
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Input</span>
                  <span class="text-text">{formatNumber(stats()!.totalInputTokens)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Output</span>
                  <span class="text-text">{formatNumber(stats()!.totalOutputTokens)}</span>
                </div>
                <Show when={stats()!.cachedTokens > 0}>
                  <div class="flex justify-between">
                    <span class="text-muted">Cached</span>
                    <span class="text-neon-cyan">{formatNumber(stats()!.cachedTokens)}</span>
                  </div>
                </Show>
                <div class="flex justify-between font-medium border-t border-border pt-2 mt-2">
                  <span class="text-muted">Total</span>
                  <span class="text-text">
                    {formatNumber(stats()!.totalInputTokens + stats()!.totalOutputTokens)}
                  </span>
                </div>
              </div>
            </div>

            {/* Models Used */}
            <Show when={stats()!.usedModels.length > 0}>
              <div class="p-3 border-b border-border">
                <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3">
                  Models Used
                </h3>
                <div class="flex flex-wrap gap-1">
                  {stats()!.usedModels.map(model => (
                    <span class="tag-primary text-xs">{formatModelName(model)}</span>
                  ))}
                </div>
              </div>
            </Show>

            {/* Tools Used */}
            <Show when={stats()!.usedTools.length > 0}>
              <div class="p-3 border-b border-border">
                <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3">
                  Tools Used ({stats()!.usedTools.length})
                </h3>
                <div class="flex flex-wrap gap-1">
                  {stats()!.usedTools.slice(0, 10).map(tool => (
                    <span class="tag-muted text-xs">{tool}</span>
                  ))}
                  <Show when={stats()!.usedTools.length > 10}>
                    <span class="tag-muted text-xs">+{stats()!.usedTools.length - 10} more</span>
                  </Show>
                </div>
              </div>
            </Show>
          </Show>

          {/* MCP Servers */}
          <McpList />

          {/* Empty state */}
          <Show when={!stats()}>
            <div class="p-3 text-center text-muted text-sm">
              <p>No session data</p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
