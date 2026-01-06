# ClaudeCockpit Implementation Plan

> **Mission Control GUI for Claude Code CLI**
>
> A Tauri 2.0 + SolidJS desktop application providing a visual interface for power users who prefer GUI over terminal.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Phase 1: Project Scaffolding](#2-phase-1-project-scaffolding)
3. [Phase 2: Tauri Backend - File System Access](#3-phase-2-tauri-backend---file-system-access)
4. [Phase 3: Data Parsing Layer](#4-phase-3-data-parsing-layer)
5. [Phase 4: Core UI Components](#5-phase-4-core-ui-components)
6. [Phase 5: Project & Session Pickers](#6-phase-5-project--session-pickers)
7. [Phase 6: Session Workspace](#7-phase-6-session-workspace)
8. [Phase 7: Sub-Agent Viewer](#8-phase-7-sub-agent-viewer)
9. [Phase 8: MCP Management](#9-phase-8-mcp-management)
10. [Phase 9: CLI Integration](#10-phase-9-cli-integration)
11. [Phase 10: Polish & Packaging](#11-phase-10-polish--packaging)

---

## 1. Project Overview

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Desktop Runtime | Tauri | 2.0+ |
| Backend Language | Rust | 1.75+ |
| Frontend Framework | SolidJS | 1.8+ |
| Build Tool | Vite | 5.0+ |
| Styling | TailwindCSS | 3.4+ |
| Language | TypeScript | 5.3+ |
| Package Manager | pnpm | 8.0+ |

### Directory Structure

```
claudecockpit/
├── src-tauri/                    # Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # Library root
│   │   ├── commands/             # Tauri commands
│   │   │   ├── mod.rs
│   │   │   ├── projects.rs       # Project listing
│   │   │   ├── sessions.rs       # Session operations
│   │   │   ├── mcp.rs            # MCP management
│   │   │   └── cli.rs            # CLI spawning
│   │   ├── parsers/              # JSONL parsing
│   │   │   ├── mod.rs
│   │   │   ├── session.rs        # Session transcript parsing
│   │   │   ├── history.rs        # History file parsing
│   │   │   └── settings.rs       # Settings parsing
│   │   └── watchers/             # File system watchers
│   │       ├── mod.rs
│   │       └── session_watcher.rs
│   └── icons/
├── src/                          # SolidJS frontend
│   ├── index.html
│   ├── index.tsx                 # App entry
│   ├── App.tsx                   # Root component
│   ├── styles/
│   │   ├── index.css             # Tailwind imports
│   │   └── cyberpunk.css         # Custom cyberpunk styles
│   ├── stores/                   # SolidJS stores
│   │   ├── projects.ts           # Project state
│   │   ├── sessions.ts           # Session state
│   │   ├── ui.ts                 # UI state (panels, tabs)
│   │   └── mcp.ts                # MCP state
│   ├── components/               # Reusable components
│   │   ├── ui/                   # Base UI elements
│   │   │   ├── Button.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Panel.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainContent.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── conversation/         # Conversation display
│   │   │   ├── MessageList.tsx
│   │   │   ├── Message.tsx
│   │   │   ├── ToolUseBlock.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   └── DiffViewer.tsx
│   │   ├── config/               # Configuration panel
│   │   │   ├── SubAgentTree.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── AgentSelector.tsx
│   │   │   └── CommandPicker.tsx
│   │   └── status/               # Status panel
│   │       ├── SessionInfo.tsx
│   │       ├── McpList.tsx
│   │       └── UsageStats.tsx
│   ├── views/                    # Full page views
│   │   ├── ProjectPicker.tsx
│   │   ├── SessionPicker.tsx
│   │   └── SessionWorkspace.tsx
│   ├── lib/                      # Utilities
│   │   ├── tauri.ts              # Tauri invoke wrappers
│   │   ├── types.ts              # TypeScript types
│   │   └── formatters.ts         # Data formatting
│   └── hooks/                    # SolidJS hooks
│       ├── useFileWatcher.ts
│       └── useSession.ts
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 2. Phase 1: Project Scaffolding

### Task 1.1: Initialize Tauri + SolidJS Project

**Commands to run:**

```bash
# Navigate to project directory
cd /Users/urban/Workspace/ClaudeCodeNomad

# Create new directory for ClaudeCockpit
mkdir claudecockpit
cd claudecockpit

# Initialize with pnpm
pnpm create tauri-app --template solid-ts

# When prompted:
# - Project name: claudecockpit
# - Package manager: pnpm
# - UI template: SolidJS
# - TypeScript: Yes
```

**Verification:**
```bash
# Should show tauri and solidjs dependencies
cat package.json | grep -E "tauri|solid"

# Should compile without errors
pnpm install
pnpm tauri dev
```

### Task 1.2: Configure TailwindCSS

**File: `claudecockpit/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk palette
        'void': '#0a0a0f',
        'deep': '#12121a',
        'surface': '#1a1a24',
        'border': '#2a2a3a',
        'muted': '#4a4a5a',
        'text': '#e0e0e0',
        'neon-cyan': '#00ffcc',
        'neon-magenta': '#ff00aa',
        'neon-yellow': '#ffcc00',
        'neon-red': '#ff3366',
        'neon-blue': '#00aaff',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'display': ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00ffcc, 0 0 20px #00ffcc33',
        'neon-magenta': '0 0 10px #ff00aa, 0 0 20px #ff00aa33',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00ffcc, 0 0 10px #00ffcc33' },
          '100%': { boxShadow: '0 0 10px #00ffcc, 0 0 25px #00ffcc55' },
        },
      },
    },
  },
  plugins: [],
}
```

**File: `claudecockpit/src/styles/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-void text-text font-mono antialiased;
    background-image:
      radial-gradient(ellipse at top, #12121a 0%, #0a0a0f 50%),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 204, 0.03) 2px,
        rgba(0, 255, 204, 0.03) 4px
      );
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }
  ::-webkit-scrollbar-track {
    @apply bg-deep;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded hover:bg-muted;
  }
}

@layer components {
  .panel {
    @apply bg-surface border border-border rounded-lg;
  }

  .panel-header {
    @apply px-4 py-2 border-b border-border font-display text-sm uppercase tracking-wider text-neon-cyan;
  }

  .btn-primary {
    @apply px-4 py-2 bg-neon-cyan text-void font-semibold rounded
           hover:shadow-neon-cyan transition-all duration-200;
  }

  .btn-secondary {
    @apply px-4 py-2 border border-neon-cyan text-neon-cyan rounded
           hover:bg-neon-cyan/10 transition-all duration-200;
  }

  .input-field {
    @apply w-full bg-deep border border-border rounded px-3 py-2
           text-text placeholder-muted focus:border-neon-cyan
           focus:outline-none focus:ring-1 focus:ring-neon-cyan/50;
  }

  .dropdown {
    @apply bg-deep border border-border rounded text-text;
  }
}
```

**Verification:**
```bash
# Tailwind should be processing
pnpm tauri dev
# Check browser devtools - elements should have Tailwind classes applied
```

### Task 1.3: Configure Tauri Permissions

**File: `claudecockpit/src-tauri/tauri.conf.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "ClaudeCockpit",
  "version": "0.1.0",
  "identifier": "com.claudecockpit.app",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "ClaudeCockpit",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "plugins": {
    "fs": {
      "scope": {
        "allow": [
          "$HOME/.claude/**",
          "$HOME/.claude"
        ]
      }
    },
    "shell": {
      "scope": [
        {
          "name": "claude",
          "cmd": "claude",
          "args": true
        }
      ]
    }
  }
}
```

**File: `claudecockpit/src-tauri/capabilities/default.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2/capability",
  "identifier": "default",
  "description": "Default capability for ClaudeCockpit",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    "fs:allow-read",
    "fs:allow-exists",
    "fs:allow-read-dir",
    "shell:allow-spawn",
    "shell:allow-execute"
  ]
}
```

**Verification:**
```bash
# App should start without permission errors
pnpm tauri dev
```

---

## 3. Phase 2: Tauri Backend - File System Access

### Task 2.1: Create Rust Command Structure

**File: `claudecockpit/src-tauri/src/commands/mod.rs`**

```rust
pub mod projects;
pub mod sessions;
pub mod mcp;
pub mod cli;

pub use projects::*;
pub use sessions::*;
pub use mcp::*;
pub use cli::*;
```

### Task 2.2: Implement Project Listing

**File: `claudecockpit/src-tauri/src/commands/projects.rs`**

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub session_count: usize,
    pub last_activity: Option<u64>,
}

/// Get the Claude CLI data directory
fn get_claude_dir() -> PathBuf {
    dirs::home_dir()
        .expect("Could not find home directory")
        .join(".claude")
}

/// List all projects from ~/.claude/projects/
#[command]
pub async fn list_projects() -> Result<Vec<Project>, String> {
    let projects_dir = get_claude_dir().join("projects");

    if !projects_dir.exists() {
        return Ok(vec![]);
    }

    let mut projects = Vec::new();

    let entries = fs::read_dir(&projects_dir)
        .map_err(|e| format!("Failed to read projects directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let folder_name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        // Skip hidden folders
        if folder_name.starts_with('.') {
            continue;
        }

        // Convert folder name back to path (replace - with /)
        let project_path = folder_name.replace('-', "/");

        // Extract readable name (last component of path)
        let name = project_path
            .split('/')
            .filter(|s| !s.is_empty())
            .last()
            .unwrap_or(&folder_name)
            .to_string();

        // Count session files
        let session_count = fs::read_dir(&path)
            .map(|entries| {
                entries
                    .flatten()
                    .filter(|e| {
                        e.path()
                            .extension()
                            .map(|ext| ext == "jsonl")
                            .unwrap_or(false)
                    })
                    .count()
            })
            .unwrap_or(0);

        // Get last modification time
        let last_activity = fs::metadata(&path)
            .ok()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        projects.push(Project {
            id: folder_name.clone(),
            name,
            path: project_path,
            session_count,
            last_activity,
        });
    }

    // Sort by last activity (most recent first)
    projects.sort_by(|a, b| b.last_activity.cmp(&a.last_activity));

    Ok(projects)
}

/// Get details for a specific project
#[command]
pub async fn get_project(project_id: String) -> Result<Project, String> {
    let projects = list_projects().await?;
    projects
        .into_iter()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))
}
```

### Task 2.3: Implement Session Listing

**File: `claudecockpit/src-tauri/src/commands/sessions.rs`**

```rust
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: String,
    pub project_id: String,
    pub start_time: Option<u64>,
    pub message_count: usize,
    pub is_agent: bool,
    pub model: Option<String>,
    pub git_branch: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub timestamp: Option<String>,
    pub message: Option<serde_json::Value>,
    #[serde(rename = "sessionId")]
    pub session_id: Option<String>,
    #[serde(rename = "gitBranch")]
    pub git_branch: Option<String>,
    pub uuid: Option<String>,
    #[serde(rename = "toolUseResult")]
    pub tool_use_result: Option<serde_json::Value>,
}

fn get_claude_dir() -> PathBuf {
    dirs::home_dir()
        .expect("Could not find home directory")
        .join(".claude")
}

/// List all sessions for a project
#[command]
pub async fn list_sessions(project_id: String) -> Result<Vec<Session>, String> {
    let project_dir = get_claude_dir().join("projects").join(&project_id);

    if !project_dir.exists() {
        return Ok(vec![]);
    }

    let mut sessions = Vec::new();

    let entries = fs::read_dir(&project_dir)
        .map_err(|e| format!("Failed to read project directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();

        // Only process .jsonl files
        if path.extension().map(|e| e != "jsonl").unwrap_or(true) {
            continue;
        }

        let file_name = path.file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        // Check if it's an agent session
        let is_agent = file_name.starts_with("agent-");

        // Read first few lines to get metadata
        let file = File::open(&path).ok();
        let (message_count, start_time, model, git_branch) = if let Some(f) = file {
            let reader = BufReader::new(f);
            let mut count = 0;
            let mut first_timestamp: Option<u64> = None;
            let mut found_model: Option<String> = None;
            let mut found_branch: Option<String> = None;

            for line in reader.lines().take(50).flatten() {
                if let Ok(msg) = serde_json::from_str::<SessionMessage>(&line) {
                    count += 1;

                    if first_timestamp.is_none() {
                        if let Some(ts) = &msg.timestamp {
                            first_timestamp = parse_timestamp(ts);
                        }
                    }

                    if found_branch.is_none() {
                        found_branch = msg.git_branch.clone();
                    }

                    if found_model.is_none() {
                        if let Some(message) = &msg.message {
                            if let Some(model) = message.get("model").and_then(|m| m.as_str()) {
                                found_model = Some(model.to_string());
                            }
                        }
                    }
                }
            }

            (count, first_timestamp, found_model, found_branch)
        } else {
            (0, None, None, None)
        };

        sessions.push(Session {
            id: file_name,
            project_id: project_id.clone(),
            start_time,
            message_count,
            is_agent,
            model,
            git_branch,
        });
    }

    // Sort by start time (most recent first)
    sessions.sort_by(|a, b| b.start_time.cmp(&a.start_time));

    Ok(sessions)
}

/// Parse ISO timestamp to Unix timestamp
fn parse_timestamp(ts: &str) -> Option<u64> {
    chrono::DateTime::parse_from_rfc3339(ts)
        .ok()
        .map(|dt| dt.timestamp() as u64)
}

/// Read full session transcript
#[command]
pub async fn read_session(project_id: String, session_id: String) -> Result<Vec<SessionMessage>, String> {
    let session_file = get_claude_dir()
        .join("projects")
        .join(&project_id)
        .join(format!("{}.jsonl", session_id));

    if !session_file.exists() {
        return Err(format!("Session file not found: {}", session_id));
    }

    let file = File::open(&session_file)
        .map_err(|e| format!("Failed to open session file: {}", e))?;

    let reader = BufReader::new(file);
    let mut messages = Vec::new();

    for line in reader.lines().flatten() {
        if let Ok(msg) = serde_json::from_str::<SessionMessage>(&line) {
            messages.push(msg);
        }
    }

    Ok(messages)
}
```

### Task 2.4: Update Main Entry Point

**File: `claudecockpit/src-tauri/src/main.rs`**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{list_projects, get_project, list_sessions, read_session};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            list_projects,
            get_project,
            list_sessions,
            read_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Task 2.5: Add Required Dependencies

**File: `claudecockpit/src-tauri/Cargo.toml`** (add to dependencies)

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-fs = "2"
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
dirs = "5"
chrono = { version = "0.4", features = ["serde"] }
notify = "6"
tokio = { version = "1", features = ["full"] }
```

**Verification:**
```bash
cd src-tauri
cargo check
# Should compile without errors

pnpm tauri dev
# App should start
```

---

## 4. Phase 3: Data Parsing Layer

### Task 3.1: Create TypeScript Type Definitions

**File: `claudecockpit/src/lib/types.ts`**

```typescript
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
  type: MessageType;
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
  title: string;
}

export interface PanelState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
}
```

### Task 3.2: Create Tauri Invoke Wrappers

**File: `claudecockpit/src/lib/tauri.ts`**

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Project, Session, SessionMessage } from './types';

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

// CLI commands (to be implemented in Phase 9)
export async function spawnCli(
  projectPath: string,
  args?: string[]
): Promise<void> {
  return invoke('spawn_cli', { projectPath, args });
}

// MCP commands (to be implemented in Phase 8)
export async function listMcpServers(): Promise<McpServer[]> {
  return invoke('list_mcp_servers');
}

export async function toggleMcpServer(
  name: string,
  enabled: boolean
): Promise<void> {
  return invoke('toggle_mcp_server', { name, enabled });
}
```

### Task 3.3: Create Data Formatters

**File: `claudecockpit/src/lib/formatters.ts`**

```typescript
import type { SessionMessage, TokenUsage } from './types';

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return 'just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Different year
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format token usage for display
 */
export function formatTokens(usage: TokenUsage | undefined): string {
  if (!usage) return '';

  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;
  const cached = (usage.cache_read_input_tokens || 0) +
                 (usage.cache_creation_input_tokens || 0);

  let result = `${formatNumber(input)} in / ${formatNumber(output)} out`;
  if (cached > 0) {
    result += ` (${formatNumber(cached)} cached)`;
  }

  return result;
}

/**
 * Format numbers with K/M suffixes
 */
export function formatNumber(n: number): string {
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K';
  }
  return n.toString();
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Extract display text from message content
 */
export function extractMessageText(message: SessionMessage): string {
  if (!message.message) return '';

  const content = message.message.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(c => c.type === 'text')
      .map(c => c.text || '')
      .join('\n');
  }

  return '';
}

/**
 * Get model display name
 */
export function formatModelName(model: string | undefined): string {
  if (!model) return 'Unknown';

  const modelMap: Record<string, string> = {
    'claude-opus-4-5-20251101': 'Opus 4.5',
    'claude-sonnet-4-20250514': 'Sonnet 4',
    'claude-3-5-sonnet-20241022': 'Sonnet 3.5',
    'claude-3-5-haiku-20241022': 'Haiku 3.5',
  };

  return modelMap[model] || model.split('-').slice(-1)[0];
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
```

**Verification:**
```bash
# TypeScript should compile without errors
pnpm tsc --noEmit
```

---

## 5. Phase 4: Core UI Components

### Task 4.1: Create Base UI Components

**File: `claudecockpit/src/components/ui/Button.tsx`**

```tsx
import { JSX, splitProps } from 'solid-js';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'loading',
    'children',
    'class',
    'disabled',
  ]);

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50';

  const variants = {
    primary: 'bg-neon-cyan text-void hover:shadow-neon-cyan',
    secondary: 'border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10',
    ghost: 'text-text hover:text-neon-cyan hover:bg-surface',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs rounded',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
  };

  return (
    <button
      class={`${baseStyles} ${variants[local.variant || 'primary']} ${sizes[local.size || 'md']} ${local.class || ''} ${local.disabled || local.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={local.disabled || local.loading}
      {...rest}
    >
      {local.loading && (
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {local.children}
    </button>
  );
}
```

**File: `claudecockpit/src/components/ui/Panel.tsx`**

```tsx
import { JSX, Show } from 'solid-js';

interface PanelProps {
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  children: JSX.Element;
  class?: string;
  headerActions?: JSX.Element;
}

export function Panel(props: PanelProps) {
  return (
    <div class={`panel flex flex-col ${props.class || ''}`}>
      <Show when={props.title}>
        <div class="panel-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Show when={props.collapsible}>
              <button
                onClick={props.onToggle}
                class="text-muted hover:text-neon-cyan transition-colors"
              >
                <svg
                  class={`w-4 h-4 transition-transform ${props.collapsed ? '-rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </Show>
            <span>{props.title}</span>
          </div>
          <Show when={props.headerActions}>
            {props.headerActions}
          </Show>
        </div>
      </Show>
      <Show when={!props.collapsed}>
        <div class="flex-1 overflow-auto">
          {props.children}
        </div>
      </Show>
    </div>
  );
}
```

**File: `claudecockpit/src/components/ui/Tabs.tsx`**

```tsx
import { For, createSignal, JSX } from 'solid-js';

interface Tab {
  id: string;
  label: string;
  closable?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabClose?: (id: string) => void;
  children: JSX.Element;
}

export function Tabs(props: TabsProps) {
  return (
    <div class="flex flex-col h-full">
      <div class="flex border-b border-border bg-deep overflow-x-auto">
        <For each={props.tabs}>
          {(tab) => (
            <div
              class={`group flex items-center gap-2 px-4 py-2 cursor-pointer border-b-2 transition-colors ${
                props.activeTab === tab.id
                  ? 'border-neon-cyan text-neon-cyan bg-surface/50'
                  : 'border-transparent text-muted hover:text-text hover:bg-surface/30'
              }`}
              onClick={() => props.onTabChange(tab.id)}
            >
              <span class="text-sm whitespace-nowrap">{tab.label}</span>
              {tab.closable && (
                <button
                  class="opacity-0 group-hover:opacity-100 hover:text-neon-red transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onTabClose?.(tab.id);
                  }}
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </For>
      </div>
      <div class="flex-1 overflow-hidden">
        {props.children}
      </div>
    </div>
  );
}
```

**File: `claudecockpit/src/components/ui/Dropdown.tsx`**

```tsx
import { For, Show, createSignal } from 'solid-js';

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function Dropdown(props: DropdownProps) {
  const [isOpen, setIsOpen] = createSignal(false);

  const selectedOption = () =>
    props.options.find(o => o.value === props.value);

  return (
    <div class="relative">
      <Show when={props.label}>
        <label class="block text-xs text-muted mb-1 uppercase tracking-wider">
          {props.label}
        </label>
      </Show>

      <button
        class="w-full flex items-center justify-between input-field"
        onClick={() => setIsOpen(!isOpen())}
      >
        <span class={selectedOption() ? 'text-text' : 'text-muted'}>
          {selectedOption()?.label || props.placeholder || 'Select...'}
        </span>
        <svg
          class={`w-4 h-4 text-muted transition-transform ${isOpen() ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Show when={isOpen()}>
        <div class="absolute z-50 w-full mt-1 bg-deep border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          <For each={props.options}>
            {(option) => (
              <div
                class={`px-3 py-2 cursor-pointer hover:bg-surface ${
                  option.value === props.value ? 'bg-surface text-neon-cyan' : 'text-text'
                }`}
                onClick={() => {
                  props.onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <div class="text-sm">{option.label}</div>
                <Show when={option.description}>
                  <div class="text-xs text-muted mt-0.5">{option.description}</div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
```

**Verification:**
```bash
pnpm tauri dev
# Components should render without errors
```

---

## 6. Phase 5: Project & Session Pickers

### Task 5.1: Create Project Store

**File: `claudecockpit/src/stores/projects.ts`**

```typescript
import { createSignal, createResource } from 'solid-js';
import { listProjects, getProject } from '../lib/tauri';
import type { Project } from '../lib/types';

// Current selected project
const [selectedProjectId, setSelectedProjectId] = createSignal<string | null>(null);

// Projects resource (auto-fetches)
const [projects, { refetch: refetchProjects }] = createResource(listProjects);

// Selected project details
const [selectedProject] = createResource(
  selectedProjectId,
  async (id) => {
    if (!id) return null;
    return getProject(id);
  }
);

export function useProjects() {
  return {
    projects,
    selectedProjectId,
    selectedProject,
    selectProject: setSelectedProjectId,
    refetch: refetchProjects,
  };
}
```

### Task 5.2: Create Session Store

**File: `claudecockpit/src/stores/sessions.ts`**

```typescript
import { createSignal, createResource, createMemo } from 'solid-js';
import { listSessions, readSession } from '../lib/tauri';
import type { Session, SessionMessage, TabState } from '../lib/types';

// Open tabs
const [tabs, setTabs] = createSignal<TabState[]>([]);
const [activeTabId, setActiveTabId] = createSignal<string | null>(null);

// Sessions for current project
const [currentProjectId, setCurrentProjectId] = createSignal<string | null>(null);
const [sessions] = createResource(currentProjectId, async (id) => {
  if (!id) return [];
  return listSessions(id);
});

// Active session messages
const activeTab = createMemo(() => {
  const id = activeTabId();
  return tabs().find(t => t.id === id);
});

const [activeMessages] = createResource(
  activeTab,
  async (tab) => {
    if (!tab) return [];
    return readSession(tab.projectId, tab.sessionId);
  }
);

export function useSessions() {
  const openSession = (projectId: string, session: Session) => {
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
      title: session.is_agent
        ? `Agent: ${session.id.replace('agent-', '')}`
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

  return {
    sessions,
    tabs,
    activeTabId,
    activeTab,
    activeMessages,
    setCurrentProjectId,
    openSession,
    closeTab,
    setActiveTabId,
  };
}
```

### Task 5.3: Create Project Picker View

**File: `claudecockpit/src/views/ProjectPicker.tsx`**

```tsx
import { For, Show, createSignal } from 'solid-js';
import { Button } from '../components/ui/Button';
import { useProjects } from '../stores/projects';
import { formatTimestamp } from '../lib/formatters';
import type { Project } from '../lib/types';

interface ProjectPickerProps {
  onSelectProject: (project: Project) => void;
}

export function ProjectPicker(props: ProjectPickerProps) {
  const { projects, refetch } = useProjects();
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = createSignal('');

  const filteredProjects = () => {
    const query = searchQuery().toLowerCase();
    return (projects() || []).filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.path.toLowerCase().includes(query)
    );
  };

  return (
    <div class="h-full flex flex-col bg-void">
      {/* Header */}
      <div class="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 class="text-2xl font-display text-neon-cyan">ClaudeCockpit</h1>
          <p class="text-muted text-sm mt-1">Select a project to begin</p>
        </div>
        <div class="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={refetch}>
            Refresh
          </Button>
          <Button variant="primary" size="sm">
            + New Session
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div class="flex items-center gap-4 p-4 border-b border-border">
        <div class="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            class="input-field"
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>
        <div class="flex border border-border rounded overflow-hidden">
          <button
            class={`px-3 py-1.5 ${viewMode() === 'grid' ? 'bg-surface text-neon-cyan' : 'text-muted'}`}
            onClick={() => setViewMode('grid')}
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            class={`px-3 py-1.5 ${viewMode() === 'list' ? 'bg-surface text-neon-cyan' : 'text-muted'}`}
            onClick={() => setViewMode('list')}
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Project Grid/List */}
      <div class="flex-1 overflow-auto p-4">
        <Show when={projects.loading}>
          <div class="flex items-center justify-center h-full">
            <div class="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full" />
          </div>
        </Show>

        <Show when={!projects.loading && filteredProjects().length === 0}>
          <div class="flex flex-col items-center justify-center h-full text-muted">
            <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p>No projects found</p>
            <p class="text-sm mt-1">Start a Claude session to create one</p>
          </div>
        </Show>

        <Show when={!projects.loading && viewMode() === 'grid'}>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <For each={filteredProjects()}>
              {(project) => (
                <ProjectCard
                  project={project}
                  onClick={() => props.onSelectProject(project)}
                />
              )}
            </For>
          </div>
        </Show>

        <Show when={!projects.loading && viewMode() === 'list'}>
          <div class="space-y-2">
            <For each={filteredProjects()}>
              {(project) => (
                <ProjectRow
                  project={project}
                  onClick={() => props.onSelectProject(project)}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}

function ProjectCard(props: { project: Project; onClick: () => void }) {
  return (
    <div
      class="panel p-4 cursor-pointer hover:border-neon-cyan/50 hover:shadow-neon-cyan/20 transition-all group"
      onClick={props.onClick}
    >
      <div class="flex items-start justify-between mb-3">
        <div class="w-10 h-10 rounded bg-neon-cyan/10 flex items-center justify-center group-hover:bg-neon-cyan/20 transition-colors">
          <svg class="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <span class="text-xs text-muted">
          {props.project.session_count} sessions
        </span>
      </div>

      <h3 class="font-semibold text-text group-hover:text-neon-cyan transition-colors">
        {props.project.name}
      </h3>

      <p class="text-xs text-muted mt-1 truncate" title={props.project.path}>
        {props.project.path}
      </p>

      <Show when={props.project.last_activity}>
        <p class="text-xs text-muted mt-2">
          Last active: {formatTimestamp(new Date(props.project.last_activity! * 1000).toISOString())}
        </p>
      </Show>
    </div>
  );
}

function ProjectRow(props: { project: Project; onClick: () => void }) {
  return (
    <div
      class="panel flex items-center gap-4 p-3 cursor-pointer hover:border-neon-cyan/50 transition-all"
      onClick={props.onClick}
    >
      <div class="w-8 h-8 rounded bg-neon-cyan/10 flex items-center justify-center">
        <svg class="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-text">{props.project.name}</h3>
        <p class="text-xs text-muted truncate">{props.project.path}</p>
      </div>

      <div class="text-sm text-muted">
        {props.project.session_count} sessions
      </div>

      <Show when={props.project.last_activity}>
        <div class="text-sm text-muted">
          {formatTimestamp(new Date(props.project.last_activity! * 1000).toISOString())}
        </div>
      </Show>
    </div>
  );
}
```

### Task 5.4: Create Session Picker View

**File: `claudecockpit/src/views/SessionPicker.tsx`**

```tsx
import { For, Show, createEffect } from 'solid-js';
import { Button } from '../components/ui/Button';
import { useSessions } from '../stores/sessions';
import { formatTimestamp, formatModelName } from '../lib/formatters';
import type { Project, Session } from '../lib/types';

interface SessionPickerProps {
  project: Project;
  onBack: () => void;
  onOpenSession: (session: Session) => void;
}

export function SessionPicker(props: SessionPickerProps) {
  const { sessions, setCurrentProjectId } = useSessions();

  createEffect(() => {
    setCurrentProjectId(props.project.id);
  });

  const mainSessions = () =>
    (sessions() || []).filter(s => !s.is_agent);

  const agentSessions = () =>
    (sessions() || []).filter(s => s.is_agent);

  return (
    <div class="h-full flex flex-col bg-void">
      {/* Header */}
      <div class="flex items-center gap-4 p-6 border-b border-border">
        <button
          class="text-muted hover:text-text transition-colors"
          onClick={props.onBack}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1">
          <h1 class="text-xl font-display text-neon-cyan">{props.project.name}</h1>
          <p class="text-muted text-sm">{props.project.path}</p>
        </div>

        <Button variant="primary" size="sm">
          + New Session
        </Button>
      </div>

      {/* Session List */}
      <div class="flex-1 overflow-auto p-4 space-y-6">
        <Show when={sessions.loading}>
          <div class="flex items-center justify-center h-32">
            <div class="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full" />
          </div>
        </Show>

        <Show when={!sessions.loading}>
          {/* Main Sessions */}
          <div>
            <h2 class="text-sm font-display text-muted uppercase tracking-wider mb-3">
              Sessions ({mainSessions().length})
            </h2>

            <Show when={mainSessions().length === 0}>
              <div class="panel p-8 text-center text-muted">
                <p>No sessions found</p>
              </div>
            </Show>

            <div class="space-y-2">
              <For each={mainSessions()}>
                {(session) => (
                  <SessionRow
                    session={session}
                    onClick={() => props.onOpenSession(session)}
                  />
                )}
              </For>
            </div>
          </div>

          {/* Agent Sessions */}
          <Show when={agentSessions().length > 0}>
            <div>
              <h2 class="text-sm font-display text-muted uppercase tracking-wider mb-3">
                Sub-Agents ({agentSessions().length})
              </h2>

              <div class="space-y-2">
                <For each={agentSessions()}>
                  {(session) => (
                    <SessionRow
                      session={session}
                      onClick={() => props.onOpenSession(session)}
                      isAgent
                    />
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}

function SessionRow(props: { session: Session; onClick: () => void; isAgent?: boolean }) {
  return (
    <div
      class="panel flex items-center gap-4 p-3 cursor-pointer hover:border-neon-cyan/50 transition-all"
      onClick={props.onClick}
    >
      <div class={`w-8 h-8 rounded flex items-center justify-center ${
        props.isAgent ? 'bg-neon-magenta/10' : 'bg-neon-cyan/10'
      }`}>
        <Show when={props.isAgent} fallback={
          <svg class="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        }>
          <svg class="w-4 h-4 text-neon-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </Show>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-mono text-sm text-text">
            {props.session.id.slice(0, 12)}
          </span>
          <Show when={props.session.git_branch}>
            <span class="text-xs px-2 py-0.5 rounded bg-surface text-muted">
              {props.session.git_branch}
            </span>
          </Show>
        </div>
        <p class="text-xs text-muted">
          {props.session.message_count} messages
        </p>
      </div>

      <Show when={props.session.model}>
        <div class="text-sm text-muted">
          {formatModelName(props.session.model)}
        </div>
      </Show>

      <Show when={props.session.start_time}>
        <div class="text-sm text-muted">
          {formatTimestamp(new Date(props.session.start_time! * 1000).toISOString())}
        </div>
      </Show>

      <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}
```

**Verification:**
```bash
pnpm tauri dev
# Should display projects from ~/.claude/projects/
# Clicking a project should show its sessions
```

---

## 7. Phase 6: Session Workspace

### Task 6.1: Create Session Workspace Layout

**File: `claudecockpit/src/views/SessionWorkspace.tsx`**

```tsx
import { Show, createSignal } from 'solid-js';
import { Tabs } from '../components/ui/Tabs';
import { Panel } from '../components/ui/Panel';
import { useSessions } from '../stores/sessions';
import { ConfigSidebar } from '../components/config/ConfigSidebar';
import { ConversationPanel } from '../components/conversation/ConversationPanel';
import { StatusPanel } from '../components/status/StatusPanel';

interface SessionWorkspaceProps {
  onBack: () => void;
}

export function SessionWorkspace(props: SessionWorkspaceProps) {
  const { tabs, activeTabId, activeTab, activeMessages, closeTab, setActiveTabId } = useSessions();

  const [leftCollapsed, setLeftCollapsed] = createSignal(false);
  const [rightCollapsed, setRightCollapsed] = createSignal(false);

  const tabItems = () => tabs().map(t => ({
    id: t.id,
    label: t.title,
    closable: true,
  }));

  return (
    <div class="h-full flex flex-col bg-void">
      {/* Header with tabs */}
      <div class="flex items-center border-b border-border bg-deep">
        <button
          class="px-4 py-3 text-muted hover:text-text transition-colors border-r border-border"
          onClick={props.onBack}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1">
          <Show when={tabs().length > 0} fallback={
            <div class="px-4 py-3 text-muted">No sessions open</div>
          }>
            <Tabs
              tabs={tabItems()}
              activeTab={activeTabId() || ''}
              onTabChange={setActiveTabId}
              onTabClose={closeTab}
            >
              <></>
            </Tabs>
          </Show>
        </div>
      </div>

      {/* Main content area */}
      <div class="flex-1 flex overflow-hidden">
        {/* Left sidebar - Configuration */}
        <div class={`border-r border-border transition-all ${leftCollapsed() ? 'w-12' : 'w-64'}`}>
          <ConfigSidebar
            collapsed={leftCollapsed()}
            onToggle={() => setLeftCollapsed(!leftCollapsed())}
          />
        </div>

        {/* Center - Conversation */}
        <div class="flex-1 flex flex-col min-w-0">
          <Show when={activeTab()} fallback={
            <div class="flex-1 flex items-center justify-center text-muted">
              <div class="text-center">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Select a session to view</p>
              </div>
            </div>
          }>
            <ConversationPanel
              messages={activeMessages() || []}
              loading={activeMessages.loading}
            />
          </Show>
        </div>

        {/* Right sidebar - Status */}
        <div class={`border-l border-border transition-all ${rightCollapsed() ? 'w-12' : 'w-72'}`}>
          <StatusPanel
            collapsed={rightCollapsed()}
            onToggle={() => setRightCollapsed(!rightCollapsed())}
            session={activeTab()}
            messages={activeMessages() || []}
          />
        </div>
      </div>
    </div>
  );
}
```

### Task 6.2: Create Conversation Panel

**File: `claudecockpit/src/components/conversation/ConversationPanel.tsx`**

```tsx
import { For, Show, createSignal, createEffect } from 'solid-js';
import { Message } from './Message';
import { PromptInput } from './PromptInput';
import type { SessionMessage } from '../../lib/types';

interface ConversationPanelProps {
  messages: SessionMessage[];
  loading: boolean;
}

export function ConversationPanel(props: ConversationPanelProps) {
  let messagesContainer: HTMLDivElement | undefined;

  // Filter to displayable messages
  const displayMessages = () => props.messages.filter(m =>
    m.type === 'user' || m.type === 'assistant'
  );

  // Auto-scroll to bottom on new messages
  createEffect(() => {
    const msgs = displayMessages();
    if (msgs.length > 0 && messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
            <p>No messages in this session</p>
          </div>
        </Show>

        <For each={displayMessages()}>
          {(message) => (
            <Message message={message} />
          )}
        </For>
      </div>

      {/* Input */}
      <div class="border-t border-border p-4">
        <PromptInput />
      </div>
    </div>
  );
}
```

### Task 6.3: Create Message Component

**File: `claudecockpit/src/components/conversation/Message.tsx`**

```tsx
import { Show, For, createSignal } from 'solid-js';
import { formatTimestamp, formatTokens, extractMessageText } from '../../lib/formatters';
import { CodeBlock } from './CodeBlock';
import { ToolUseBlock } from './ToolUseBlock';
import type { SessionMessage, MessageContent } from '../../lib/types';

interface MessageProps {
  message: SessionMessage;
}

export function Message(props: MessageProps) {
  const [expanded, setExpanded] = createSignal(false);

  const isUser = () => props.message.type === 'user';
  const content = () => props.message.message?.content;
  const usage = () => props.message.message?.usage;
  const model = () => props.message.message?.model;

  // Parse content
  const textContent = () => {
    if (typeof content() === 'string') {
      return content() as string;
    }
    return null;
  };

  const contentBlocks = () => {
    if (Array.isArray(content())) {
      return content() as MessageContent[];
    }
    return [];
  };

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
      <div class={`flex-1 min-w-0 ${isUser() ? 'text-right' : ''}`}>
        {/* Header */}
        <div class={`flex items-center gap-2 mb-1 ${isUser() ? 'justify-end' : ''}`}>
          <span class={`text-sm font-medium ${isUser() ? 'text-neon-magenta' : 'text-neon-cyan'}`}>
            {isUser() ? 'You' : 'Claude'}
          </span>
          <Show when={model()}>
            <span class="text-xs px-1.5 py-0.5 rounded bg-surface text-muted">
              {model()}
            </span>
          </Show>
          <span class="text-xs text-muted">
            {formatTimestamp(props.message.timestamp)}
          </span>
        </div>

        {/* Content */}
        <div class={`panel p-3 ${isUser() ? 'bg-neon-magenta/5 border-neon-magenta/20' : ''}`}>
          {/* Text content */}
          <Show when={textContent()}>
            <div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
              {textContent()}
            </div>
          </Show>

          {/* Content blocks */}
          <For each={contentBlocks()}>
            {(block) => (
              <Show when={block.type === 'text'}>
                <div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                  {block.text}
                </div>
              </Show>
            )}
          </For>

          {/* Tool use blocks */}
          <For each={contentBlocks().filter(b => b.type === 'tool_use')}>
            {(block) => (
              <ToolUseBlock block={block} />
            )}
          </For>
        </div>

        {/* Expandable metadata */}
        <Show when={usage() || !isUser()}>
          <button
            class="mt-1 text-xs text-muted hover:text-neon-cyan transition-colors"
            onClick={() => setExpanded(!expanded())}
          >
            {expanded() ? '▼ Hide details' : '▶ Show details'}
          </button>

          <Show when={expanded()}>
            <div class="mt-2 p-2 bg-deep rounded text-xs space-y-1">
              <Show when={usage()}>
                <div class="text-muted">
                  Tokens: {formatTokens(usage())}
                </div>
              </Show>
              <Show when={props.message.uuid}>
                <div class="text-muted font-mono">
                  ID: {props.message.uuid}
                </div>
              </Show>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}
```

### Task 6.4: Create Tool Use Block

**File: `claudecockpit/src/components/conversation/ToolUseBlock.tsx`**

```tsx
import { Show, createSignal } from 'solid-js';
import type { MessageContent } from '../../lib/types';

interface ToolUseBlockProps {
  block: MessageContent;
}

export function ToolUseBlock(props: ToolUseBlockProps) {
  const [expanded, setExpanded] = createSignal(false);

  const toolName = () => props.block.name || 'Unknown tool';
  const input = () => props.block.input || {};

  return (
    <div class="mt-2 border border-border rounded overflow-hidden">
      <button
        class="w-full flex items-center gap-2 px-3 py-2 bg-deep hover:bg-surface transition-colors text-left"
        onClick={() => setExpanded(!expanded())}
      >
        <svg class={`w-4 h-4 text-neon-yellow transition-transform ${expanded() ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-sm font-medium text-neon-yellow">{toolName()}</span>
      </button>

      <Show when={expanded()}>
        <div class="p-3 bg-void/50 border-t border-border">
          <pre class="text-xs text-muted overflow-x-auto">
            {JSON.stringify(input(), null, 2)}
          </pre>
        </div>
      </Show>
    </div>
  );
}
```

### Task 6.5: Create Prompt Input

**File: `claudecockpit/src/components/conversation/PromptInput.tsx`**

```tsx
import { createSignal, Show } from 'solid-js';

export function PromptInput() {
  const [input, setInput] = createSignal('');
  const [showFullPrompt, setShowFullPrompt] = createSignal(false);

  // These would come from config store
  const selectedCommand = () => '/code';
  const selectedAgent = () => '';

  const fullPrompt = () => {
    let prompt = '';
    if (selectedCommand()) {
      prompt += selectedCommand() + ' ';
    }
    if (selectedAgent()) {
      prompt += '@' + selectedAgent() + ' ';
    }
    prompt += input();
    return prompt;
  };

  return (
    <div class="space-y-2">
      {/* Toggle */}
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={showFullPrompt()}
            onChange={(e) => setShowFullPrompt(e.currentTarget.checked)}
            class="rounded border-border bg-deep text-neon-cyan focus:ring-neon-cyan"
          />
          Show full prompt
        </label>

        <Show when={selectedCommand() || selectedAgent()}>
          <div class="text-xs text-muted">
            <Show when={selectedCommand()}>
              <span class="text-neon-yellow">{selectedCommand()}</span>
            </Show>
            <Show when={selectedAgent()}>
              {' '}<span class="text-neon-magenta">@{selectedAgent()}</span>
            </Show>
          </div>
        </Show>
      </div>

      {/* Input area */}
      <div class="relative">
        <textarea
          value={showFullPrompt() ? fullPrompt() : input()}
          onInput={(e) => {
            if (showFullPrompt()) {
              // Parse out the command/agent prefix
              // For now, just set the raw value
            }
            setInput(e.currentTarget.value);
          }}
          placeholder="Type your message..."
          class="input-field min-h-[80px] resize-none pr-12"
          rows={3}
        />

        <button
          class="absolute bottom-3 right-3 p-2 rounded bg-neon-cyan text-void hover:shadow-neon-cyan transition-all disabled:opacity-50"
          disabled={!input().trim()}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

**Verification:**
```bash
pnpm tauri dev
# Open a session - should see 3-panel layout
# Messages should render with expandable details
```

---

## 8. Phase 7: Sub-Agent Viewer

### Task 7.1: Create Sub-Agent Tree Component

**File: `claudecockpit/src/components/config/SubAgentTree.tsx`**

```tsx
import { For, Show, createMemo } from 'solid-js';
import { useSessions } from '../../stores/sessions';
import type { Session } from '../../lib/types';

interface SubAgentTreeProps {
  projectId: string;
}

export function SubAgentTree(props: SubAgentTreeProps) {
  const { sessions, openSession } = useSessions();

  const agentSessions = createMemo(() =>
    (sessions() || []).filter(s => s.is_agent)
  );

  return (
    <div class="p-3">
      <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3">
        Sub-Agents
      </h3>

      <Show when={agentSessions().length === 0}>
        <div class="text-xs text-muted italic">
          No active sub-agents
        </div>
      </Show>

      <div class="space-y-1">
        <For each={agentSessions()}>
          {(agent) => (
            <AgentNode
              agent={agent}
              onClick={() => openSession(props.projectId, agent)}
            />
          )}
        </For>
      </div>
    </div>
  );
}

function AgentNode(props: { agent: Session; onClick: () => void }) {
  const agentId = () => props.agent.id.replace('agent-', '');

  return (
    <button
      class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-surface transition-colors group"
      onClick={props.onClick}
    >
      <div class="w-5 h-5 rounded bg-neon-magenta/20 flex items-center justify-center">
        <svg class="w-3 h-3 text-neon-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <div class="text-sm font-mono text-text group-hover:text-neon-magenta transition-colors truncate">
          {agentId()}
        </div>
        <div class="text-xs text-muted">
          {props.agent.message_count} messages
        </div>
      </div>

      {/* Status indicator */}
      <div class="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
    </button>
  );
}
```

### Task 7.2: Create Config Sidebar

**File: `claudecockpit/src/components/config/ConfigSidebar.tsx`**

```tsx
import { Show } from 'solid-js';
import { Panel } from '../ui/Panel';
import { Dropdown } from '../ui/Dropdown';
import { SubAgentTree } from './SubAgentTree';
import { useSessions } from '../../stores/sessions';

interface ConfigSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ConfigSidebar(props: ConfigSidebarProps) {
  const { activeTab } = useSessions();

  // Model options
  const modelOptions = [
    { value: 'claude-opus-4-5-20251101', label: 'Opus 4.5', description: 'Most capable' },
    { value: 'claude-sonnet-4-20250514', label: 'Sonnet 4', description: 'Balanced' },
    { value: 'claude-3-5-haiku-20241022', label: 'Haiku 3.5', description: 'Fast' },
  ];

  // Command options
  const commandOptions = [
    { value: '', label: 'No command' },
    { value: '/code', label: '/code', description: 'Write code' },
    { value: '/review', label: '/review', description: 'Review PR' },
    { value: '/bug', label: '/bug', description: 'Report bug' },
  ];

  return (
    <div class="h-full flex flex-col bg-deep">
      {/* Collapse toggle */}
      <button
        class="p-3 border-b border-border hover:bg-surface transition-colors"
        onClick={props.onToggle}
      >
        <svg
          class={`w-5 h-5 text-muted transition-transform ${props.collapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <Show when={!props.collapsed}>
        <div class="flex-1 overflow-auto">
          {/* Sub-agents */}
          <Show when={activeTab()}>
            <div class="border-b border-border">
              <SubAgentTree projectId={activeTab()!.projectId} />
            </div>
          </Show>

          {/* Configuration */}
          <div class="p-3 space-y-4">
            <h3 class="text-xs font-display text-muted uppercase tracking-wider">
              Configuration
            </h3>

            <Dropdown
              label="Model"
              options={modelOptions}
              value="claude-opus-4-5-20251101"
              onChange={(v) => console.log('Model:', v)}
            />

            <Dropdown
              label="Command"
              options={commandOptions}
              value=""
              onChange={(v) => console.log('Command:', v)}
              placeholder="Select command..."
            />

            <Dropdown
              label="Agent"
              options={[{ value: '', label: 'Main agent' }]}
              value=""
              onChange={(v) => console.log('Agent:', v)}
            />
          </div>
        </div>
      </Show>
    </div>
  );
}
```

**Verification:**
```bash
pnpm tauri dev
# Left sidebar should show sub-agents and dropdowns
# Collapsing should work
```

---

## 9. Phase 8: MCP Management

### Task 8.1: Create MCP Rust Commands

**File: `claudecockpit/src-tauri/src/commands/mcp.rs`**

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpServer {
    pub name: String,
    pub enabled: bool,
    pub connected: bool,
    pub tools: Vec<McpTool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpTool {
    pub name: String,
    pub description: Option<String>,
}

fn get_claude_dir() -> PathBuf {
    dirs::home_dir()
        .expect("Could not find home directory")
        .join(".claude")
}

/// Read MCP configuration from settings.json
#[command]
pub async fn list_mcp_servers() -> Result<Vec<McpServer>, String> {
    let settings_path = get_claude_dir().join("settings.json");

    if !settings_path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let settings: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    let mut servers = Vec::new();

    // Parse enabled plugins (which include MCPs)
    if let Some(plugins) = settings.get("enabledPlugins").and_then(|v| v.as_object()) {
        for (name, enabled) in plugins {
            if name.contains("mcp") || name.contains("MCP") {
                servers.push(McpServer {
                    name: name.clone(),
                    enabled: enabled.as_bool().unwrap_or(false),
                    connected: false, // Would need runtime check
                    tools: vec![], // Would need to query MCP
                });
            }
        }
    }

    // Also check mcpServers configuration
    if let Some(mcp_servers) = settings.get("mcpServers").and_then(|v| v.as_object()) {
        for (name, _config) in mcp_servers {
            // Check if not already added from plugins
            if !servers.iter().any(|s| s.name == *name) {
                servers.push(McpServer {
                    name: name.clone(),
                    enabled: true,
                    connected: false,
                    tools: vec![],
                });
            }
        }
    }

    Ok(servers)
}

/// Toggle MCP server enabled state
#[command]
pub async fn toggle_mcp_server(name: String, enabled: bool) -> Result<(), String> {
    let settings_path = get_claude_dir().join("settings.json");

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let mut settings: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    // Update enabledPlugins
    if let Some(plugins) = settings.get_mut("enabledPlugins").and_then(|v| v.as_object_mut()) {
        plugins.insert(name, serde_json::Value::Bool(enabled));
    }

    // Write back
    let new_content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, new_content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(())
}
```

### Task 8.2: Create MCP List Component

**File: `claudecockpit/src/components/status/McpList.tsx`**

```tsx
import { For, Show, createResource } from 'solid-js';
import { listMcpServers, toggleMcpServer } from '../../lib/tauri';

export function McpList() {
  const [mcpServers, { refetch }] = createResource(listMcpServers);

  return (
    <div class="p-3">
      <h3 class="text-xs font-display text-muted uppercase tracking-wider mb-3">
        MCP Servers
      </h3>

      <Show when={mcpServers.loading}>
        <div class="text-xs text-muted">Loading...</div>
      </Show>

      <Show when={!mcpServers.loading && (mcpServers()?.length || 0) === 0}>
        <div class="text-xs text-muted italic">
          No MCP servers configured
        </div>
      </Show>

      <div class="space-y-2">
        <For each={mcpServers()}>
          {(server) => (
            <div class="flex items-center justify-between p-2 bg-deep rounded">
              <div class="flex items-center gap-2">
                <div class={`w-2 h-2 rounded-full ${
                  server.connected ? 'bg-neon-cyan' : 'bg-muted'
                }`} />
                <span class="text-sm text-text">{server.name}</span>
              </div>

              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={server.enabled}
                  onChange={async (e) => {
                    await toggleMcpServer(server.name, e.currentTarget.checked);
                    refetch();
                  }}
                  class="sr-only peer"
                />
                <div class="w-9 h-5 bg-border rounded-full peer peer-checked:bg-neon-cyan/30 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-muted after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-neon-cyan" />
              </label>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
```

### Task 8.3: Create Status Panel

**File: `claudecockpit/src/components/status/StatusPanel.tsx`**

```tsx
import { Show, createMemo } from 'solid-js';
import { Panel } from '../ui/Panel';
import { McpList } from './McpList';
import { formatDuration, formatModelName, formatNumber } from '../../lib/formatters';
import type { TabState, SessionMessage } from '../../lib/types';

interface StatusPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  session: TabState | undefined;
  messages: SessionMessage[];
}

export function StatusPanel(props: StatusPanelProps) {
  // Calculate stats
  const stats = createMemo(() => {
    if (!props.messages.length) return null;

    const firstMsg = props.messages.find(m => m.timestamp);
    const lastMsg = [...props.messages].reverse().find(m => m.timestamp);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const usedModels = new Set<string>();
    const usedTools = new Set<string>();

    for (const msg of props.messages) {
      if (msg.message?.usage) {
        totalInputTokens += msg.message.usage.input_tokens || 0;
        totalOutputTokens += msg.message.usage.output_tokens || 0;
      }
      if (msg.message?.model) {
        usedModels.add(msg.message.model);
      }
      // Extract tool names
      if (Array.isArray(msg.message?.content)) {
        for (const block of msg.message.content) {
          if (block.type === 'tool_use' && block.name) {
            usedTools.add(block.name);
          }
        }
      }
    }

    const startTime = firstMsg?.timestamp ? new Date(firstMsg.timestamp) : null;
    const endTime = lastMsg?.timestamp ? new Date(lastMsg.timestamp) : null;
    const duration = startTime && endTime
      ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      : 0;

    return {
      messageCount: props.messages.filter(m => m.type === 'user' || m.type === 'assistant').length,
      totalInputTokens,
      totalOutputTokens,
      usedModels: Array.from(usedModels),
      usedTools: Array.from(usedTools),
      startTime,
      duration,
    };
  });

  return (
    <div class="h-full flex flex-col bg-deep">
      {/* Collapse toggle */}
      <button
        class="p-3 border-b border-border hover:bg-surface transition-colors"
        onClick={props.onToggle}
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
          <Show when={props.session && stats()}>
            <div class="p-3 border-b border-border space-y-3">
              <h3 class="text-xs font-display text-muted uppercase tracking-wider">
                Session Info
              </h3>

              <div class="space-y-2 text-sm">
                <InfoRow label="Session ID" value={props.session!.sessionId.slice(0, 12)} mono />
                <InfoRow label="Project" value={props.session!.projectId.split('-').pop() || ''} />
                <InfoRow label="Messages" value={stats()!.messageCount.toString()} />
                <InfoRow label="Duration" value={formatDuration(stats()!.duration)} />

                <Show when={stats()!.usedModels.length > 0}>
                  <InfoRow
                    label="Models"
                    value={stats()!.usedModels.map(formatModelName).join(', ')}
                  />
                </Show>
              </div>
            </div>

            {/* Token Usage */}
            <div class="p-3 border-b border-border space-y-3">
              <h3 class="text-xs font-display text-muted uppercase tracking-wider">
                Token Usage
              </h3>

              <div class="grid grid-cols-2 gap-2">
                <div class="p-2 bg-surface rounded text-center">
                  <div class="text-lg font-mono text-neon-cyan">
                    {formatNumber(stats()!.totalInputTokens)}
                  </div>
                  <div class="text-xs text-muted">Input</div>
                </div>
                <div class="p-2 bg-surface rounded text-center">
                  <div class="text-lg font-mono text-neon-magenta">
                    {formatNumber(stats()!.totalOutputTokens)}
                  </div>
                  <div class="text-xs text-muted">Output</div>
                </div>
              </div>
            </div>

            {/* Tools Used */}
            <Show when={stats()!.usedTools.length > 0}>
              <div class="p-3 border-b border-border space-y-3">
                <h3 class="text-xs font-display text-muted uppercase tracking-wider">
                  Tools Used ({stats()!.usedTools.length})
                </h3>

                <div class="flex flex-wrap gap-1">
                  {stats()!.usedTools.slice(0, 10).map(tool => (
                    <span class="px-2 py-0.5 text-xs bg-neon-yellow/10 text-neon-yellow rounded">
                      {tool}
                    </span>
                  ))}
                  <Show when={stats()!.usedTools.length > 10}>
                    <span class="px-2 py-0.5 text-xs text-muted">
                      +{stats()!.usedTools.length - 10} more
                    </span>
                  </Show>
                </div>
              </div>
            </Show>
          </Show>

          {/* MCP Servers */}
          <McpList />
        </div>
      </Show>
    </div>
  );
}

function InfoRow(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div class="flex justify-between">
      <span class="text-muted">{props.label}</span>
      <span class={`text-text ${props.mono ? 'font-mono' : ''}`}>{props.value}</span>
    </div>
  );
}
```

**Verification:**
```bash
pnpm tauri dev
# Right panel should show session stats and MCP list
# MCP toggles should update settings.json
```

---

## 10. Phase 9: CLI Integration

### Task 9.1: Create CLI Spawn Command

**File: `claudecockpit/src-tauri/src/commands/cli.rs`**

```rust
use std::process::Stdio;
use tauri::command;
use tokio::process::Command;
use tokio::io::{AsyncBufReadExt, BufReader};

#[command]
pub async fn spawn_cli(
    project_path: String,
    args: Option<Vec<String>>,
) -> Result<String, String> {
    let mut cmd = Command::new("claude");

    // Set working directory
    cmd.current_dir(&project_path);

    // Add any additional args
    if let Some(extra_args) = args {
        cmd.args(extra_args);
    }

    // Configure for interactive mode
    cmd.stdin(Stdio::piped())
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());

    let child = cmd.spawn()
        .map_err(|e| format!("Failed to spawn claude CLI: {}", e))?;

    // Return the PID for tracking
    Ok(child.id().map(|id| id.to_string()).unwrap_or_default())
}

#[command]
pub async fn check_cli_installed() -> Result<bool, String> {
    let output = Command::new("which")
        .arg("claude")
        .output()
        .await
        .map_err(|e| format!("Failed to check claude installation: {}", e))?;

    Ok(output.status.success())
}
```

### Task 9.2: Update Main with CLI Commands

**File: `claudecockpit/src-tauri/src/main.rs`** (updated)

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{
    list_projects, get_project,
    list_sessions, read_session,
    list_mcp_servers, toggle_mcp_server,
    spawn_cli, check_cli_installed,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Projects
            list_projects,
            get_project,
            // Sessions
            list_sessions,
            read_session,
            // MCP
            list_mcp_servers,
            toggle_mcp_server,
            // CLI
            spawn_cli,
            check_cli_installed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Verification:**
```bash
cargo check
pnpm tauri dev
# CLI spawn should work (test via dev console)
```

---

## 11. Phase 10: Polish & Packaging

### Task 10.1: Create App Entry Point

**File: `claudecockpit/src/App.tsx`**

```tsx
import { createSignal, Show, Match, Switch } from 'solid-js';
import { ProjectPicker } from './views/ProjectPicker';
import { SessionPicker } from './views/SessionPicker';
import { SessionWorkspace } from './views/SessionWorkspace';
import type { Project, Session } from './lib/types';
import { useSessions } from './stores/sessions';

type View = 'projects' | 'sessions' | 'workspace';

export function App() {
  const [currentView, setCurrentView] = createSignal<View>('projects');
  const [selectedProject, setSelectedProject] = createSignal<Project | null>(null);
  const { openSession, tabs } = useSessions();

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('sessions');
  };

  const handleOpenSession = (session: Session) => {
    openSession(selectedProject()!.id, session);
    setCurrentView('workspace');
  };

  const handleBackFromSessions = () => {
    setSelectedProject(null);
    setCurrentView('projects');
  };

  const handleBackFromWorkspace = () => {
    if (tabs().length === 0) {
      setCurrentView('sessions');
    }
  };

  return (
    <div class="h-screen overflow-hidden">
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
```

### Task 10.2: Create Index Entry

**File: `claudecockpit/src/index.tsx`**

```tsx
import { render } from 'solid-js/web';
import { App } from './App';
import './styles/index.css';

render(() => <App />, document.getElementById('root')!);
```

**File: `claudecockpit/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClaudeCockpit</title>
    <style>
      /* Prevent flash of unstyled content */
      html { background: #0a0a0f; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

### Task 10.3: Build Configuration

**File: `claudecockpit/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
```

### Task 10.4: Package.json Scripts

**File: `claudecockpit/package.json`**

```json
{
  "name": "claudecockpit",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-fs": "^2",
    "@tauri-apps/plugin-shell": "^2",
    "solid-js": "^1.8"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3.4",
    "typescript": "^5.3",
    "vite": "^5",
    "vite-plugin-solid": "^2.8"
  }
}
```

### Task 10.5: Final Verification Checklist

```bash
# 1. Install dependencies
cd claudecockpit
pnpm install

# 2. Type check
pnpm typecheck

# 3. Rust check
cd src-tauri && cargo check && cd ..

# 4. Development mode
pnpm tauri dev

# 5. Verify features:
# [ ] Projects load from ~/.claude/projects/
# [ ] Sessions list correctly
# [ ] Conversation renders messages
# [ ] Sub-agent tree shows agents
# [ ] MCP list displays and toggles work
# [ ] 3-panel layout collapses correctly
# [ ] Tabs open/close properly

# 6. Production build
pnpm tauri build

# 7. Check bundle size (should be ~10-20MB)
ls -la src-tauri/target/release/bundle/
```

---

## Summary

This plan creates **ClaudeCockpit** in 10 phases:

1. **Scaffolding** - Tauri + SolidJS + TailwindCSS setup
2. **Backend** - Rust file system access
3. **Parsing** - TypeScript types and formatters
4. **UI Components** - Button, Panel, Tabs, Dropdown
5. **Pickers** - Project and Session selection views
6. **Workspace** - 3-panel session layout
7. **Sub-Agents** - Agent tree viewer
8. **MCP** - Server management
9. **CLI** - Process spawning
10. **Polish** - Final assembly and packaging

Each phase has:
- Exact file paths
- Complete code examples
- Verification steps

Total estimated files: ~35
Total estimated lines of code: ~3,500

