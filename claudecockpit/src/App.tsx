import { createSignal, Match, Switch } from 'solid-js';
import { ProjectPicker } from './views/ProjectPicker';
import { SessionPicker } from './views/SessionPicker';
import { SessionWorkspace } from './views/SessionWorkspace';
import { useSessions } from './stores/sessions';
import type { Project, Session } from './lib/types';

type View = 'projects' | 'sessions' | 'workspace';

export function App() {
  const [currentView, setCurrentView] = createSignal<View>('projects');
  const [selectedProject, setSelectedProject] = createSignal<Project | null>(null);

  const { openSession, closeAllTabs } = useSessions();

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('sessions');
  };

  const handleBackFromSessions = () => {
    setSelectedProject(null);
    closeAllTabs();
    setCurrentView('projects');
  };

  const handleOpenSession = (session: Session) => {
    const project = selectedProject();
    if (!project) return;

    openSession(project.id, project.path, session);
    setCurrentView('workspace');
  };

  const handleBackFromWorkspace = () => {
    setCurrentView('sessions');
  };

  return (
    <div class="h-screen overflow-hidden bg-void">
      <Switch>
        <Match when={currentView() === 'projects'}>
          <ProjectPicker onSelectProject={handleSelectProject} />
        </Match>

        <Match when={currentView() === 'sessions' && selectedProject()}>
          <SessionPicker
            project={selectedProject()!}
            onBack={handleBackFromSessions}
            onOpenSession={handleOpenSession}
          />
        </Match>

        <Match when={currentView() === 'workspace'}>
          <SessionWorkspace onBack={handleBackFromWorkspace} />
        </Match>
      </Switch>
    </div>
  );
}
