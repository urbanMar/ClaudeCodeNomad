import { For, Show, createEffect, createSignal } from 'solid-js';
import { Message } from './Message';
import { terminalWrite } from '../../lib/tauri';
import { useTerminals } from '../../stores/terminals';
import type { SessionMessage } from '../../lib/types';

interface ConversationPanelProps {
  messages: SessionMessage[];
  loading: boolean;
  projectPath: string;
  sessionId?: string;
}

export function ConversationPanel(props: ConversationPanelProps) {
  let messagesContainer: HTMLDivElement | undefined;
  const [inputMessage, setInputMessage] = createSignal('');
  const [sending, setSending] = createSignal(false);
  const [sendError, setSendError] = createSignal<string | null>(null);

  const { activeTerminal, terminalVisible, setTerminalVisible } = useTerminals();

  const handleSend = async () => {
    const message = inputMessage().trim();
    if (!message || sending()) return;

    const terminal = activeTerminal();
    if (!terminal || !terminal.terminalId) {
      setSendError('No terminal connected. Open the terminal panel first.');
      // Show terminal if hidden
      if (!terminalVisible()) {
        setTerminalVisible(true);
      }
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      // Send message to the embedded terminal
      // Use carriage return to submit (like pressing Enter)
      await terminalWrite(terminal.terminalId, message + '\r');
      setInputMessage('');

      // Ensure terminal is visible
      if (!terminalVisible()) {
        setTerminalVisible(true);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd+Shift+Space to launch
    if (e.key === ' ' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter to displayable messages (user and assistant only)
  const displayMessages = () => props.messages.filter(m =>
    m.type === 'user' || m.type === 'assistant' ||
    m.message?.role === 'user' || m.message?.role === 'assistant'
  );

  // Auto-scroll to bottom on new messages
  createEffect(() => {
    const msgs = displayMessages();
    if (msgs.length > 0 && messagesContainer) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 50);
    }
  });

  return (
    <div class="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div
        ref={messagesContainer}
        class="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <Show when={props.loading}>
          <div class="flex items-center justify-center py-8">
            <div class="animate-spin w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full" />
          </div>
        </Show>

        <Show when={!props.loading && displayMessages().length === 0}>
          <div class="text-center text-muted py-8">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages in this session</p>
          </div>
        </Show>

        <For each={displayMessages()}>
          {(message) => (
            <Message message={message} />
          )}
        </For>
      </div>

      {/* Input area */}
      <div class="border-t border-border p-4">
        {/* Error message */}
        <Show when={sendError()}>
          <div class="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-center justify-between">
            <span>{sendError()}</span>
            <button onClick={() => setSendError(null)} class="text-red-400 hover:text-red-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </Show>

        <div class="relative">
          <textarea
            placeholder="Type your message..."
            class="input-field min-h-[80px] resize-none pr-24"
            rows={3}
            value={inputMessage()}
            onInput={(e) => setInputMessage(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            disabled={sending()}
          />

          {/* Launch button */}
          <button
            class={`absolute bottom-3 right-3 px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-2 ${
              !sending()
                ? 'bg-neon-cyan text-void hover:bg-neon-cyan/80 cursor-pointer'
                : 'bg-muted/30 text-muted cursor-not-allowed'
            }`}
            onClick={handleSend}
            disabled={sending()}
            title="Launch Claude session (Cmd+Shift+Space)"
          >
            <Show when={sending()} fallback={
              <>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Launch
              </>
            }>
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Starting...
            </Show>
          </button>
        </div>

        <div class="flex items-center justify-between mt-2">
          <p class="text-xs text-muted">
            <kbd class="px-1 py-0.5 bg-surface rounded text-xs">Cmd+Shift+Space</kbd> to launch in Terminal
          </p>
          <Show when={inputMessage().trim()}>
            <p class="text-xs text-neon-cyan">
              Ready to launch
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}
