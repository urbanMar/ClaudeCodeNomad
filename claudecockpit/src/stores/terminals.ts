import { createSignal, createMemo } from 'solid-js';

export interface TerminalTab {
  id: string;
  terminalId: string | null;
  projectPath: string;
  sessionId: string | null;
  title: string;
  connected: boolean;
}

// Terminal tabs state
const [terminalTabs, setTerminalTabs] = createSignal<TerminalTab[]>([]);
const [activeTerminalId, setActiveTerminalId] = createSignal<string | null>(null);

// View mode: 'tab' | 'split' | 'floating'
const [viewMode, setViewMode] = createSignal<'tab' | 'split' | 'floating'>('split');

// Show/hide terminal panel
const [terminalVisible, setTerminalVisible] = createSignal(true);

export function useTerminals() {
  const activeTerminal = createMemo(() => {
    const id = activeTerminalId();
    return terminalTabs().find(t => t.id === id);
  });

  const openTerminal = (projectPath: string, sessionId: string | null, title?: string) => {
    const tabId = `terminal:${sessionId || projectPath}`;

    // Check if already exists
    const existing = terminalTabs().find(t => t.id === tabId);
    if (existing) {
      setActiveTerminalId(tabId);
      return existing;
    }

    // Create new terminal tab
    const newTab: TerminalTab = {
      id: tabId,
      terminalId: null, // Will be set when Terminal component spawns
      projectPath,
      sessionId,
      title: title || (sessionId ? `Claude: ${sessionId.slice(0, 8)}` : 'Terminal'),
      connected: false,
    };

    setTerminalTabs([...terminalTabs(), newTab]);
    setActiveTerminalId(tabId);

    return newTab;
  };

  const closeTerminal = (tabId: string) => {
    const newTabs = terminalTabs().filter(t => t.id !== tabId);
    setTerminalTabs(newTabs);

    if (activeTerminalId() === tabId) {
      setActiveTerminalId(newTabs[newTabs.length - 1]?.id || null);
    }
  };

  const updateTerminalConnection = (tabId: string, terminalId: string, connected: boolean) => {
    setTerminalTabs(tabs =>
      tabs.map(t =>
        t.id === tabId ? { ...t, terminalId, connected } : t
      )
    );
  };

  const toggleTerminal = () => {
    setTerminalVisible(!terminalVisible());
  };

  return {
    terminalTabs,
    activeTerminalId,
    activeTerminal,
    viewMode,
    terminalVisible,
    setViewMode,
    setActiveTerminalId,
    openTerminal,
    closeTerminal,
    updateTerminalConnection,
    toggleTerminal,
    setTerminalVisible,
  };
}
