// Project types
export interface Project {
  id: string;
  name: string;
  path: string;
  session_count: number;
  last_activity: number | null;
}

// Session types
export interface Session {
  id: string;
  project_id: string;
  start_time: number | null;
  message_count: number;
  is_agent: boolean;
  model: string | null;
  git_branch: string | null;
}

// Message types from JSONL
export type MessageType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool_use'
  | 'tool_result'
  | 'file-history-snapshot';

export interface SessionMessage {
  type?: MessageType;
  timestamp?: string;
  message?: {
    role?: string;
    content?: string | MessageContent[];
    model?: string;
    id?: string;
    usage?: TokenUsage;
  };
  sessionId?: string;
  gitBranch?: string;
  uuid?: string;
  parentUuid?: string;
  cwd?: string;
  toolUseResult?: ToolUseResult;
  isMeta?: boolean;
  isSidechain?: boolean;
}

export interface MessageContent {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string;
  tool_use_id?: string;
  is_error?: boolean;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ToolUseResult {
  success?: boolean;
  stdout?: string;
  stderr?: string;
  interrupted?: boolean;
  isImage?: boolean;
  commandName?: string;
  bytes?: number;
  code?: number;
  result?: string;
  durationMs?: number;
  url?: string;
}

// MCP types
export interface McpServer {
  name: string;
  enabled: boolean;
  connected: boolean;
  tools: McpTool[];
  command?: string;
}

export interface McpTool {
  name: string;
  description?: string;
}

// Settings types
export interface ClaudeSettings {
  enabledPlugins: Record<string, boolean>;
  hooks: Record<string, unknown>;
}

// UI State types
export interface TabState {
  id: string;
  sessionId: string;
  projectId: string;
  projectPath: string;
  title: string;
}

export interface PanelState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
}
