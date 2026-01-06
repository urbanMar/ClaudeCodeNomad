import { onMount, onCleanup, createSignal } from 'solid-js';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  terminalSpawn,
  terminalWrite,
  terminalResize,
  terminalKill,
  TerminalOutput,
  TerminalExit,
} from '../../lib/tauri';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  projectPath: string;
  sessionId?: string;
  tabId?: string;
  onConnect?: (terminalId: string) => void;
  onExit?: (exitCode: number | null) => void;
}

export function Terminal(props: TerminalProps) {
  let containerRef: HTMLDivElement | undefined;
  let xterm: XTerm | undefined;
  let fitAddon: FitAddon | undefined;
  let unlistenOutput: UnlistenFn | undefined;
  let unlistenExit: UnlistenFn | undefined;
  let resizeObserver: ResizeObserver | undefined;

  const [terminalId, setTerminalId] = createSignal<string | null>(null);
  const [connected, setConnected] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Cyberpunk theme colors
  const theme = {
    background: '#0a0a0f',
    foreground: '#e0e0e0',
    cursor: '#00ffcc',
    cursorAccent: '#0a0a0f',
    selectionBackground: '#00ffcc33',
    selectionForeground: '#ffffff',
    black: '#1a1a2e',
    red: '#ff6b6b',
    green: '#00ffcc',
    yellow: '#ffd93d',
    blue: '#6c5ce7',
    magenta: '#ff00aa',
    cyan: '#00ffcc',
    white: '#e0e0e0',
    brightBlack: '#4a4a6a',
    brightRed: '#ff8787',
    brightGreen: '#00ffdd',
    brightYellow: '#ffe066',
    brightBlue: '#8b7cf7',
    brightMagenta: '#ff44bb',
    brightCyan: '#44ffdd',
    brightWhite: '#ffffff',
  };

  onMount(async () => {
    if (!containerRef) return;

    // Initialize xterm.js
    xterm = new XTerm({
      theme,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
      scrollback: 10000,
    });

    // Initialize addons
    fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());

    // Try WebGL renderer for performance
    try {
      xterm.loadAddon(new WebglAddon());
    } catch (e) {
      console.warn('WebGL addon failed to load, using canvas renderer');
    }

    // Open terminal in container
    xterm.open(containerRef);
    fitAddon.fit();

    // Get initial dimensions
    const cols = xterm.cols;
    const rows = xterm.rows;

    // Setup event listeners before spawning
    unlistenOutput = await listen<TerminalOutput>('terminal:output', (event) => {
      const tid = terminalId();
      if (tid && event.payload.terminal_id === tid) {
        xterm?.write(event.payload.data);
      }
    });

    unlistenExit = await listen<TerminalExit>('terminal:exit', (event) => {
      const tid = terminalId();
      if (tid && event.payload.terminal_id === tid) {
        setConnected(false);
        xterm?.write('\r\n\x1b[33m[Process exited]\x1b[0m\r\n');
        props.onExit?.(event.payload.exit_code);
      }
    });

    // Spawn terminal process
    try {
      const info = await terminalSpawn(
        props.projectPath,
        props.sessionId || null,
        cols,
        rows
      );
      setTerminalId(info.id);
      setConnected(true);

      // Notify parent that terminal is connected
      props.onConnect?.(info.id);

      // Handle user input
      xterm.onData((data) => {
        if (connected()) {
          terminalWrite(info.id, data);
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to spawn terminal');
      xterm.write(`\x1b[31mError: ${e}\x1b[0m\r\n`);
    }

    // Handle resize
    resizeObserver = new ResizeObserver(() => {
      if (fitAddon && xterm) {
        fitAddon.fit();
        const tid = terminalId();
        if (tid && connected()) {
          terminalResize(tid, xterm.cols, xterm.rows);
        }
      }
    });
    resizeObserver.observe(containerRef);

    // Focus terminal
    xterm.focus();
  });

  // Cleanup on unmount
  onCleanup(async () => {
    const tid = terminalId();
    if (tid) {
      try {
        await terminalKill(tid);
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    unlistenOutput?.();
    unlistenExit?.();
    resizeObserver?.disconnect();
    xterm?.dispose();
  });

  return (
    <div class="h-full flex flex-col bg-void">
      {/* Terminal header */}
      <div class="flex items-center justify-between px-3 py-2 border-b border-border bg-deep">
        <div class="flex items-center gap-2">
          <div class={`w-2 h-2 rounded-full ${connected() ? 'bg-neon-cyan' : 'bg-red-500'}`} />
          <span class="text-xs text-muted font-mono">
            {connected() ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-xs text-muted truncate max-w-[200px]" title={props.projectPath}>
            {props.projectPath.split('/').pop()}
          </span>
        </div>
      </div>

      {/* Terminal container */}
      <div
        ref={containerRef}
        class="flex-1 p-2"
        style={{ 'min-height': '200px' }}
      />

      {/* Error message */}
      {error() && (
        <div class="px-3 py-2 bg-red-500/10 border-t border-red-500/30 text-xs text-red-400">
          {error()}
        </div>
      )}
    </div>
  );
}
