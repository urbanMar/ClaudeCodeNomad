import { createSignal, createResource, createMemo } from 'solid-js';
import { listSessions, readSession } from '../lib/tauri';
import type { Session, TabState } from '../lib/types';

// Open tabs
const [tabs, setTabs] = createSignal<TabState[]>([]);
const [activeTabId, setActiveTabId] = createSignal<string | null>(null);

// Sessions for current project
const [currentProjectId, setCurrentProjectId] = createSignal<string | null>(null);
const [sessions, { refetch: refetchSessions }] = createResource(currentProjectId, async (id) => {
  if (!id) return [];
  return listSessions(id);
});

// Active session messages
const activeTab = createMemo(() => {
  const id = activeTabId();
  return tabs().find(t => t.id === id);
});

const [activeMessages, { refetch: refetchMessages }] = createResource(
  activeTab,
  async (tab) => {
    if (!tab) return [];
    return readSession(tab.projectId, tab.sessionId);
  }
);

export function useSessions() {
  const openSession = (projectId: string, projectPath: string, session: Session) => {
    const tabId = `${projectId}:${session.id}`;

    // Check if already open
    const existing = tabs().find(t => t.id === tabId);
    if (existing) {
      setActiveTabId(tabId);
      return;
    }

    // Add new tab
    const newTab: TabState = {
      id: tabId,
      sessionId: session.id,
      projectId,
      projectPath,
      title: session.is_agent
        ? `Agent: ${session.id.replace('agent-', '').slice(0, 8)}`
        : session.id.slice(0, 8),
    };

    setTabs([...tabs(), newTab]);
    setActiveTabId(tabId);
  };

  const closeTab = (tabId: string) => {
    const newTabs = tabs().filter(t => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId() === tabId) {
      setActiveTabId(newTabs[newTabs.length - 1]?.id || null);
    }
  };

  const closeAllTabs = () => {
    setTabs([]);
    setActiveTabId(null);
  };

  return {
    sessions,
    tabs,
    activeTabId,
    activeTab,
    activeMessages,
    currentProjectId,
    setCurrentProjectId,
    openSession,
    closeTab,
    closeAllTabs,
    setActiveTabId,
    refetchSessions,
    refetchMessages,
  };
}
