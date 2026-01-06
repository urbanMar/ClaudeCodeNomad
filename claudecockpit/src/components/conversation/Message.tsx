import { Show, For, createSignal } from 'solid-js';
import { formatTimestamp, formatTokens, formatModelName } from '../../lib/formatters';
import { ToolUseBlock } from './ToolUseBlock';
import type { SessionMessage, MessageContent } from '../../lib/types';

interface MessageProps {
  message: SessionMessage;
}

export function Message(props: MessageProps) {
  const [expanded, setExpanded] = createSignal(false);

  const isUser = () => props.message.type === 'user' || props.message.message?.role === 'user';
  const content = () => props.message.message?.content;
  const usage = () => props.message.message?.usage;
  const model = () => props.message.message?.model;

  // Parse content
  const textContent = () => {
    const c = content();
    if (typeof c === 'string') {
      return c;
    }
    return null;
  };

  const contentBlocks = () => {
    const c = content();
    if (Array.isArray(c)) {
      return c as MessageContent[];
    }
    return [];
  };

  const textBlocks = () => contentBlocks().filter(b => b.type === 'text');
  const toolBlocks = () => contentBlocks().filter(b => b.type === 'tool_use');

  return (
    <div class={`flex gap-3 ${isUser() ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div class={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
        isUser() ? 'bg-neon-magenta/20' : 'bg-neon-cyan/20'
      }`}>
        <Show when={isUser()} fallback={
          <svg class="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }>
          <svg class="w-4 h-4 text-neon-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Show>
      </div>

      {/* Message content */}
      <div class={`flex-1 min-w-0 max-w-[85%] ${isUser() ? 'text-right' : ''}`}>
        {/* Header */}
        <div class={`flex items-center gap-2 mb-1 text-xs ${isUser() ? 'justify-end' : ''}`}>
          <span class={`font-medium ${isUser() ? 'text-neon-magenta' : 'text-neon-cyan'}`}>
            {isUser() ? 'You' : 'Claude'}
          </span>
          <Show when={model()}>
            <span class="px-1.5 py-0.5 rounded bg-surface text-muted">
              {formatModelName(model())}
            </span>
          </Show>
          <span class="text-muted">
            {formatTimestamp(props.message.timestamp)}
          </span>
        </div>

        {/* Content */}
        <div class={`panel p-3 text-left ${isUser() ? 'bg-neon-magenta/5 border-neon-magenta/20' : ''}`}>
          {/* Simple text content */}
          <Show when={textContent()}>
            <div class="text-sm text-text whitespace-pre-wrap break-words">
              {textContent()}
            </div>
          </Show>

          {/* Content blocks - text */}
          <For each={textBlocks()}>
            {(block) => (
              <div class="text-sm text-text whitespace-pre-wrap break-words">
                {block.text}
              </div>
            )}
          </For>

          {/* Tool use blocks */}
          <Show when={toolBlocks().length > 0}>
            <div class="mt-2 space-y-2">
              <For each={toolBlocks()}>
                {(block) => (
                  <ToolUseBlock block={block} />
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Expandable metadata */}
        <Show when={usage() || props.message.uuid}>
          <button
            class="mt-1 text-xs text-muted hover:text-neon-cyan transition-colors"
            onClick={() => setExpanded(!expanded())}
          >
            {expanded() ? '- Hide details' : '+ Show details'}
          </button>

          <Show when={expanded()}>
            <div class="mt-2 p-2 bg-deep rounded text-xs space-y-1 text-left">
              <Show when={usage()}>
                <div class="text-muted">
                  Tokens: {formatTokens(usage())}
                </div>
              </Show>
              <Show when={props.message.uuid}>
                <div class="text-muted font-mono truncate">
                  ID: {props.message.uuid}
                </div>
              </Show>
              <Show when={props.message.cwd}>
                <div class="text-muted font-mono truncate">
                  CWD: {props.message.cwd}
                </div>
              </Show>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}
