import { invoke } from '@tauri-apps/api/core';
import type { Project, Session, SessionMessage, McpServer } from './types';

// Project commands
export async function listProjects(): Promise<Project[]> {
  return invoke<Project[]>('list_projects');
}

export async function getProject(projectId: string): Promise<Project> {
  return invoke<Project>('get_project', { projectId });
}

// Session commands
export async function listSessions(projectId: string): Promise<Session[]> {
  return invoke<Session[]>('list_sessions', { projectId });
}

export async function readSession(
  projectId: string,
  sessionId: string
): Promise<SessionMessage[]> {
  return invoke<SessionMessage[]>('read_session', { projectId, sessionId });
}

// CLI commands
export interface SpawnResult {
  success: boolean;
  message: string;
}

export async function spawnClaudeSession(
  projectPath: string,
  resume: boolean = false
): Promise<SpawnResult> {
  return invoke<SpawnResult>('spawn_claude_session', { projectPath, resume });
}

export async function openInFinder(path: string): Promise<void> {
  return invoke('open_in_finder', { path });
}

// MCP commands
export async function listMcpServers(): Promise<McpServer[]> {
  return invoke<McpServer[]>('list_mcp_servers');
}

export async function toggleMcpServer(
  name: string,
  enabled: boolean
): Promise<void> {
  return invoke('toggle_mcp_server', { name, enabled });
}

// Skills commands
export interface ClaudeSkill {
  name: string;
  plugin: string;
  description?: string;
}

export async function listInstalledSkills(): Promise<ClaudeSkill[]> {
  return invoke<ClaudeSkill[]>('list_installed_skills');
}

// Terminal commands
export interface TerminalInfo {
  id: string;
  project_path: string;
  session_id: string | null;
  cols: number;
  rows: number;
}

export interface TerminalOutput {
  terminal_id: string;
  data: string;
}

export interface TerminalExit {
  terminal_id: string;
  exit_code: number | null;
}

export async function terminalSpawn(
  projectPath: string,
  sessionId: string | null,
  cols: number,
  rows: number
): Promise<TerminalInfo> {
  return invoke<TerminalInfo>('terminal_spawn', {
    projectPath,
    sessionId,
    cols,
    rows,
  });
}

export async function terminalWrite(
  terminalId: string,
  data: string
): Promise<void> {
  return invoke('terminal_write', { terminalId, data });
}

export async function terminalResize(
  terminalId: string,
  cols: number,
  rows: number
): Promise<void> {
  return invoke('terminal_resize', { terminalId, cols, rows });
}

export async function terminalKill(terminalId: string): Promise<void> {
  return invoke('terminal_kill', { terminalId });
}

export async function terminalList(): Promise<TerminalInfo[]> {
  return invoke<TerminalInfo[]>('terminal_list');
}

// Hooks commands
export async function installHooks(): Promise<string> {
  return invoke<string>('install_hooks');
}

export async function uninstallHooks(): Promise<string> {
  return invoke<string>('uninstall_hooks');
}

export async function checkHooksInstalled(): Promise<boolean> {
  return invoke<boolean>('check_hooks_installed');
}

export async function generateHooksConfig(): Promise<string> {
  return invoke<string>('generate_hooks_config');
}

// Hook event types
export interface HookEvent {
  type: string;
  session_id?: string;
  data: Record<string, unknown>;
}
