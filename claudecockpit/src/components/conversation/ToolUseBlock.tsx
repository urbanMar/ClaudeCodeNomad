import { Show, createSignal } from 'solid-js';
import type { MessageContent } from '../../lib/types';

interface ToolUseBlockProps {
  block: MessageContent;
}

export function ToolUseBlock(props: ToolUseBlockProps) {
  const [expanded, setExpanded] = createSignal(false);

  const toolName = () => props.block.name || 'Unknown tool';
  const input = () => props.block.input || {};

  // Truncate large input for preview
  const inputPreview = () => {
    const str = JSON.stringify(input());
    if (str.length > 100) {
      return str.slice(0, 100) + '...';
    }
    return str;
  };

  return (
    <div class="border border-border rounded overflow-hidden">
      <button
        class="w-full flex items-center gap-2 px-3 py-2 bg-deep hover:bg-surface transition-colors text-left"
        onClick={() => setExpanded(!expanded())}
      >
        <svg
          class={`w-4 h-4 text-neon-yellow transition-transform ${expanded() ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <svg class="w-4 h-4 text-neon-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-sm font-medium text-neon-yellow">{toolName()}</span>
        <Show when={!expanded()}>
          <span class="text-xs text-muted truncate flex-1">{inputPreview()}</span>
        </Show>
      </button>

      <Show when={expanded()}>
        <div class="p-3 bg-void/50 border-t border-border max-h-64 overflow-auto">
          <pre class="text-xs text-muted font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(input(), null, 2)}
          </pre>
        </div>
      </Show>
    </div>
  );
}
