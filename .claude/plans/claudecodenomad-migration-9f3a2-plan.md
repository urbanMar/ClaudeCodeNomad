# ClaudeCodeNomad - Architectural Migration Plan

**Task:** Recreate CodeNomad (GUI for OpenCode CLI) as ClaudeCodeNomad to support Claude Code CLI with all Claude-specific features.

**Original Project:** `./CodeNomad/` - Electron + SolidJS desktop client for OpenCode CLI
**Target Project:** ClaudeCodeNomad - Electron + SolidJS desktop client for Claude Code CLI

---

## 1. Outcome Specification

### Success Criteria

1. **Full Feature Parity** - All CodeNomad features work with Claude Code CLI
2. **Claude-Specific Features** - Support for hooks, MCP servers, plugins, skills, subagents
3. **Multi-Instance Support** - Run multiple Claude Code sessions in tabs
4. **Session Management** - Create, resume, continue, and fork sessions
5. **Permission Handling** - Handle tool permission requests with allow/deny/always
6. **Real-time Updates** - SSE streaming for messages, tool calls, and status
7. **Command Palette** - Global command palette for navigation and actions
8. **Keyboard-First** - Full keyboard navigation support

### Expected Behavior

- Launch Claude Code instances for selected project folders
- Display real-time message streams with markdown rendering
- Show tool calls (Read, Write, Edit, Bash, Glob, Grep, etc.) with proper formatting
- Handle permission requests for tool execution
- Support MCP server integration
- Display hooks configuration and status
- Enable plugin and skill management
- Support multiple models (Sonnet, Opus, Haiku)

---

## 2. Key Differences: OpenCode vs Claude Code

| Aspect | OpenCode CLI | Claude Code CLI |
|--------|--------------|-----------------|
| **Binary** | `opencode` | `claude` |
| **SDK** | `@opencode-ai/sdk` | Custom HTTP/SSE (no published SDK) |
| **Server Mode** | `opencode serve --port 0` | `claude mcp serve` (different architecture) |
| **API Style** | REST + SSE | CLI-driven with `-p` print mode, JSON output |
| **Hooks** | Not available | PreToolUse, PostToolUse, SessionStart, etc. |
| **MCP** | Not available | Full MCP server support |
| **Plugins** | Not available | Plugin system with skills |
| **Subagents** | Tasks via SDK | `--agents` flag with custom definitions |

### Critical Architecture Decision

**Claude Code does NOT have a `serve` mode like OpenCode.**

Options:
1. **CLI Wrapper Approach** - Spawn `claude -p --output-format stream-json` for each interaction
2. **MCP Server Mode** - Use `claude mcp serve` but limited to MCP protocol
3. **Headless SDK** - Use Claude Code's Agent SDK (TypeScript/Python) for programmatic control

**Recommended: CLI Wrapper with Stream JSON** - Most direct mapping to current CodeNomad architecture.

---

## 3. Architectural Specification

### 3.1 Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron Main Process                     │
├─────────────────────────────────────────────────────────────────┤
│  process-manager.ts     │  Spawn/manage Claude CLI processes    │
│  ipc.ts                 │  IPC handlers for renderer             │
│  session-manager.ts     │  Track sessions, continuations         │
│  hook-manager.ts        │  Read/configure Claude Code hooks      │
│  mcp-manager.ts         │  Manage MCP server connections         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ IPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Electron Renderer (SolidJS)                │
├─────────────────────────────────────────────────────────────────┤
│  stores/                                                         │
│    instances.ts         │  Claude Code instance state            │
│    sessions.ts          │  Session management                    │
│    messages.ts          │  Message streaming & display           │
│    hooks.ts             │  Hooks configuration state             │
│    mcp.ts               │  MCP server state                      │
│    permissions.ts       │  Permission request queue              │
│                                                                  │
│  components/                                                     │
│    instance-shell.tsx   │  Main instance container               │
│    session-view.tsx     │  Session message display               │
│    tool-call.tsx        │  Tool call rendering                   │
│    permission-modal.tsx │  Permission request UI                 │
│    hooks-panel.tsx      │  Hooks configuration UI                │
│    mcp-panel.tsx        │  MCP server management UI              │
│    command-palette.tsx  │  Global command palette                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Process Manager Changes

**Current (OpenCode):**
```typescript
// Spawns: opencode serve --port 0 --print-logs
spawn("opencode", ["serve", "--port", "0", ...])
// Listens on http://localhost:{port} for SSE
```

**New (Claude Code):**
```typescript
// For each message, spawn:
// claude -p --output-format stream-json --session-id {uuid} "user prompt"
// Parse streaming JSON output for messages, tool calls, permissions

interface ClaudeProcess {
  sessionId: string
  cwd: string
  model: string  // sonnet, opus, haiku
  agent?: string
  hooks?: HooksConfig
}

async function sendMessage(process: ClaudeProcess, message: string): Promise<StreamingResponse> {
  const args = [
    "-p",
    "--output-format", "stream-json",
    "--session-id", process.sessionId,
    "--model", process.model,
  ]

  if (process.agent) {
    args.push("--agent", process.agent)
  }

  args.push(message)

  return spawnAndStream("claude", args, { cwd: process.cwd })
}
```

### 3.3 Session Management

**Session Operations:**
```typescript
interface SessionManager {
  // Start new session
  create(cwd: string, model?: string): Session

  // Resume by session ID
  resume(sessionId: string, query?: string): Session

  // Continue most recent
  continue(query?: string): Session

  // Fork existing session
  fork(sessionId: string): Session

  // List sessions for a folder
  list(cwd: string): Session[]
}
```

**CLI Mappings:**
- `create`: `claude --session-id {uuid} "prompt"`
- `resume`: `claude --resume {id} "prompt"`
- `continue`: `claude -c "prompt"`
- `fork`: `claude --resume {id} --fork-session "prompt"`

### 3.4 Streaming JSON Protocol

Claude Code with `--output-format stream-json` emits NDJSON:

```jsonl
{"type":"message_start","message":{"id":"msg_xxx","role":"assistant"}}
{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}
{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}
{"type":"tool_use","id":"tu_xxx","name":"Read","input":{"file_path":"/path/to/file"}}
{"type":"tool_result","tool_use_id":"tu_xxx","content":"file contents..."}
{"type":"permission_request","id":"perm_xxx","tool":"Bash","command":"npm install"}
{"type":"message_stop","stop_reason":"end_turn"}
```

### 3.5 Permission Handling

When Claude needs permission:
1. Emit `permission_request` event
2. GUI shows modal with tool details
3. User selects: Allow Once / Allow Always / Deny
4. Response sent back (mechanism TBD - may need IPC to running process)

**Challenge:** Claude CLI in `-p` mode may not support mid-execution permission input.

**Solution Options:**
1. Use `--permission-prompt-tool` to route permissions to custom MCP tool
2. Use `--dangerously-skip-permissions` with pre-configured `--allowedTools`
3. Build custom permission flow using hooks

### 3.6 Hooks Integration

**Read Hooks Configuration:**
```typescript
interface HooksManager {
  // Get hooks from all sources
  getHooks(cwd: string): HooksConfig

  // Read from specific files
  readUserHooks(): HooksConfig      // ~/.claude/settings.json
  readProjectHooks(cwd: string): HooksConfig  // .claude/settings.json
  readLocalHooks(cwd: string): HooksConfig    // .claude/settings.local.json

  // Update hooks
  updateHook(scope: 'user' | 'project' | 'local', hook: Hook): void
}
```

**Hooks Events to Monitor:**
- `PreToolUse` - Before tool execution
- `PostToolUse` - After tool execution
- `UserPromptSubmit` - Before processing user input
- `SessionStart` - When session begins
- `SessionEnd` - When session ends
- `Notification` - When Claude sends notifications

### 3.7 MCP Server Integration

**MCP Configuration:**
```typescript
interface MCPManager {
  // List configured servers
  list(): MCPServer[]

  // Add server
  add(name: string, config: MCPServerConfig): void

  // Remove server
  remove(name: string): void

  // Get server status
  status(name: string): 'connected' | 'disconnected' | 'error'
}

// CLI: claude mcp list
// CLI: claude mcp add --transport http <name> <url>
// CLI: claude mcp remove <name>
```

### 3.8 Tool Call Rendering

Reuse CodeNomad's tool call rendering with updated tool names:

| Tool | Title Format | Body Content |
|------|--------------|--------------|
| `Read` | `Read {filename}` | File preview |
| `Write` | `Write {filename}` | Content written |
| `Edit` | `Edit {filename}` | Diff/patch |
| `Bash` | `Shell {description}` | Command + output |
| `Glob` | `Glob {pattern}` | Matching files |
| `Grep` | `Grep "{pattern}"` | Search results |
| `WebFetch` | `Fetch {url}` | Page content |
| `WebSearch` | `Search "{query}"` | Search results |
| `Task` | `Task[{agent}] {desc}` | Subagent actions |
| `TodoWrite` | Plan status | Todo list |
| `mcp__*` | MCP tool name | Tool output |

---

## 4. Implementation Steps

### Phase 1: Core Infrastructure (Files to Create/Modify)

#### Step 1.1: Initialize Project Structure
```bash
# Copy CodeNomad as starting point
cp -r ./CodeNomad ./src

# Update package.json
- Change name to "@urban/claudecodenomad"
- Remove @opencode-ai/sdk dependency
- Keep all other dependencies
```

**Files:**
- `package.json` - Update project metadata
- `electron.vite.config.ts` - Keep as-is

#### Step 1.2: Create Claude Process Manager
**File:** `electron/main/claude-process-manager.ts`

```typescript
import { spawn, ChildProcess } from "child_process"
import { EventEmitter } from "events"

interface ClaudeSession {
  id: string
  cwd: string
  model: string
  process?: ChildProcess
  status: 'idle' | 'running' | 'error'
}

interface StreamEvent {
  type: string
  [key: string]: any
}

export class ClaudeProcessManager extends EventEmitter {
  private sessions = new Map<string, ClaudeSession>()

  async sendMessage(sessionId: string, prompt: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    const args = this.buildArgs(session, prompt)
    const child = spawn("claude", args, { cwd: session.cwd })

    session.process = child
    session.status = 'running'

    let buffer = ''

    child.stdout.on('data', (data: Buffer) => {
      buffer += data.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event: StreamEvent = JSON.parse(line)
          this.emit('stream-event', sessionId, event)
        } catch (e) {
          // Non-JSON output
          this.emit('raw-output', sessionId, line)
        }
      }
    })

    child.stderr.on('data', (data: Buffer) => {
      this.emit('error-output', sessionId, data.toString())
    })

    child.on('exit', (code) => {
      session.status = code === 0 ? 'idle' : 'error'
      session.process = undefined
      this.emit('session-complete', sessionId, code)
    })
  }

  private buildArgs(session: ClaudeSession, prompt: string): string[] {
    return [
      "-p",
      "--output-format", "stream-json",
      "--session-id", session.id,
      "--model", session.model,
      prompt
    ]
  }
}
```

#### Step 1.3: Update IPC Handlers
**File:** `electron/main/ipc.ts`

Replace OpenCode SDK calls with Claude CLI invocations:
- `createInstance` → `createSession` (just creates session state, no server)
- `sendMessage` → Spawns `claude -p` process
- `abortSession` → Kills running process
- `resumeSession` → Uses `--resume` flag

#### Step 1.4: Create Hooks Manager
**File:** `electron/main/hooks-manager.ts`

```typescript
import { readFileSync, existsSync, writeFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"

interface Hook {
  type: 'command' | 'prompt'
  command?: string
  prompt?: string
  timeout?: number
}

interface HookMatcher {
  matcher: string
  hooks: Hook[]
}

interface HooksConfig {
  PreToolUse?: HookMatcher[]
  PostToolUse?: HookMatcher[]
  UserPromptSubmit?: HookMatcher[]
  SessionStart?: HookMatcher[]
  SessionEnd?: HookMatcher[]
  Notification?: HookMatcher[]
}

export class HooksManager {
  getUserHooksPath(): string {
    return join(homedir(), ".claude", "settings.json")
  }

  getProjectHooksPath(cwd: string): string {
    return join(cwd, ".claude", "settings.json")
  }

  getLocalHooksPath(cwd: string): string {
    return join(cwd, ".claude", "settings.local.json")
  }

  readHooks(path: string): HooksConfig | null {
    if (!existsSync(path)) return null
    try {
      const content = readFileSync(path, 'utf-8')
      const settings = JSON.parse(content)
      return settings.hooks || null
    } catch {
      return null
    }
  }

  getMergedHooks(cwd: string): HooksConfig {
    const user = this.readHooks(this.getUserHooksPath()) || {}
    const project = this.readHooks(this.getProjectHooksPath(cwd)) || {}
    const local = this.readHooks(this.getLocalHooksPath(cwd)) || {}

    // Merge: local > project > user
    return this.mergeHooks(user, project, local)
  }

  private mergeHooks(...configs: HooksConfig[]): HooksConfig {
    const result: HooksConfig = {}
    for (const config of configs) {
      for (const [event, matchers] of Object.entries(config)) {
        if (!result[event]) result[event] = []
        result[event].push(...(matchers || []))
      }
    }
    return result
  }
}
```

#### Step 1.5: Create MCP Manager
**File:** `electron/main/mcp-manager.ts`

```typescript
import { execSync, spawn } from "child_process"

interface MCPServer {
  name: string
  type: 'http' | 'sse' | 'stdio'
  url?: string
  command?: string
  args?: string[]
  scope: 'user' | 'project' | 'local'
  status: 'active' | 'inactive' | 'error'
}

export class MCPManager {
  listServers(): MCPServer[] {
    try {
      const output = execSync("claude mcp list --json", { encoding: 'utf-8' })
      return JSON.parse(output)
    } catch {
      return []
    }
  }

  addServer(name: string, transport: string, url: string, scope: string = 'local'): void {
    execSync(`claude mcp add --transport ${transport} --scope ${scope} ${name} ${url}`)
  }

  removeServer(name: string): void {
    execSync(`claude mcp remove ${name}`)
  }

  getServerDetails(name: string): MCPServer | null {
    try {
      const output = execSync(`claude mcp get ${name} --json`, { encoding: 'utf-8' })
      return JSON.parse(output)
    } catch {
      return null
    }
  }
}
```

### Phase 2: Renderer Stores (Files to Modify)

#### Step 2.1: Update Instance Store
**File:** `src/stores/instances.ts`

Remove SDK client creation, replace with session tracking:
```typescript
interface Instance {
  id: string
  folder: string
  sessions: Map<string, Session>
  activeSessionId: string | null
  status: 'ready' | 'error'
}

// Remove: sdkManager.createClient(port)
// Remove: sseManager.connect(id, port)
// Add: IPC-based communication with main process
```

#### Step 2.2: Update Session Store
**File:** `src/stores/sessions.ts`

Replace SDK session operations with IPC calls:
```typescript
async function createSession(instanceId: string): Promise<Session> {
  const sessionId = crypto.randomUUID()
  const session = await window.electronAPI.createSession(instanceId, sessionId)
  // ...
}

async function sendMessage(instanceId: string, sessionId: string, message: string): Promise<void> {
  await window.electronAPI.sendMessage(instanceId, sessionId, message)
  // Messages arrive via IPC events
}
```

#### Step 2.3: Create Hooks Store
**File:** `src/stores/hooks.ts`

```typescript
import { createSignal } from "solid-js"

const [hooks, setHooks] = createSignal<HooksConfig>({})
const [hooksLoading, setHooksLoading] = createSignal(false)

async function loadHooks(instanceId: string): Promise<void> {
  setHooksLoading(true)
  try {
    const config = await window.electronAPI.getHooks(instanceId)
    setHooks(config)
  } finally {
    setHooksLoading(false)
  }
}

export { hooks, hooksLoading, loadHooks }
```

#### Step 2.4: Create MCP Store
**File:** `src/stores/mcp.ts`

```typescript
import { createSignal } from "solid-js"

const [mcpServers, setMCPServers] = createSignal<MCPServer[]>([])
const [mcpLoading, setMCPLoading] = createSignal(false)

async function loadMCPServers(): Promise<void> {
  setMCPLoading(true)
  try {
    const servers = await window.electronAPI.getMCPServers()
    setMCPServers(servers)
  } finally {
    setMCPLoading(false)
  }
}

async function addMCPServer(name: string, transport: string, url: string): Promise<void> {
  await window.electronAPI.addMCPServer(name, transport, url)
  await loadMCPServers()
}

export { mcpServers, mcpLoading, loadMCPServers, addMCPServer }
```

### Phase 3: UI Components (Files to Modify/Create)

#### Step 3.1: Update Tool Call Component
**File:** `src/components/tool-call.tsx`

Update tool type detection for Claude Code tools:
- Add `WebSearch` rendering
- Add `mcp__*` tool rendering (MCP tools)
- Update icon mappings

#### Step 3.2: Create Hooks Panel
**File:** `src/components/hooks-panel.tsx`

```typescript
// Display configured hooks
// Allow enabling/disabling hooks
// Show hook execution history
```

#### Step 3.3: Create MCP Panel
**File:** `src/components/mcp-panel.tsx`

```typescript
// List MCP servers
// Add/remove servers
// Show connection status
// Trigger authentication for OAuth servers
```

#### Step 3.4: Update Advanced Settings Modal
**File:** `src/components/advanced-settings-modal.tsx`

Add sections for:
- Claude binary path (instead of OpenCode)
- Default model selection
- Hooks configuration
- MCP server management

#### Step 3.5: Update Command Palette
**File:** `src/components/command-palette.tsx`

Add commands:
- `/hooks` - Open hooks configuration
- `/mcp` - Open MCP server panel
- `/model {name}` - Switch model
- `/agent {name}` - Switch agent
- `/plugin {name}` - Run plugin command

### Phase 4: Additional Features

#### Step 4.1: Model Selection
**File:** `src/components/model-selector.tsx`

Support models:
- `claude-sonnet-4-5-20250929` (alias: `sonnet`)
- `claude-opus-4-5-20251101` (alias: `opus`)
- `claude-haiku-3-5-20240307` (alias: `haiku`)

#### Step 4.2: Plugin Support
**File:** `src/stores/plugins.ts`

Read installed plugins:
```typescript
// Plugins stored in ~/.claude/plugins/
// Each plugin has plugin.json with commands, skills, hooks
```

#### Step 4.3: Subagent Support
**File:** `src/stores/subagents.ts`

Track subagent invocations from `Task` tool calls:
```typescript
interface Subagent {
  id: string
  type: string
  description: string
  parentSessionId: string
  status: 'running' | 'completed' | 'error'
}
```

---

## 5. Exit Criteria & Verification

### Functional Tests

```bash
# 1. Launch application and create new instance
# Expected: Folder selection dialog opens

# 2. Select folder and start session
# Expected: Claude Code session starts, welcome message appears

# 3. Send message: "What files are in this directory?"
# Expected: Claude uses Glob tool, displays file list

# 4. Send message: "Read the package.json file"
# Expected: Tool call shows file content

# 5. Send message: "Create a new file called test.txt with 'Hello World'"
# Expected: Permission request appears, after approval file is created

# 6. Check MCP panel
# Expected: Lists configured MCP servers

# 7. Check Hooks panel
# Expected: Shows hooks from ~/.claude/settings.json

# 8. Switch models
# Expected: Model selector changes model, next message uses new model

# 9. Resume session
# Expected: Previous conversation context is restored

# 10. Run in multiple instances
# Expected: Multiple tabs work independently
```

### Build Verification

```bash
# Development
bun install
bun run dev

# Production build
bun run build:mac
bun run build:win
bun run build:linux

# All builds complete without errors
```

### Performance Criteria

- Message rendering: < 16ms per frame
- Tool call expansion: < 100ms
- Session creation: < 2s
- Instance tab switching: < 50ms

---

## 6. Dependencies

### To Remove
- `@opencode-ai/sdk` - OpenCode SDK

### To Add
- None (Claude Code is CLI-based)

### To Keep
- `electron` - Desktop runtime
- `solid-js` - UI framework
- `@kobalte/core` - UI components
- `shiki` - Syntax highlighting
- `marked` - Markdown rendering
- `@git-diff-view/solid` - Diff visualization
- `tailwindcss` - Styling

---

## 7. File Mapping Summary

| Original (CodeNomad) | New (ClaudeCodeNomad) | Changes |
|---------------------|----------------------|---------|
| `electron/main/process-manager.ts` | `electron/main/claude-process-manager.ts` | Complete rewrite |
| `electron/main/ipc.ts` | `electron/main/ipc.ts` | Update handlers |
| - | `electron/main/hooks-manager.ts` | New file |
| - | `electron/main/mcp-manager.ts` | New file |
| `src/lib/sdk-manager.ts` | Remove | Not needed |
| `src/lib/sse-manager.ts` | `src/lib/stream-parser.ts` | Rewrite for NDJSON |
| `src/stores/instances.ts` | `src/stores/instances.ts` | Remove SDK refs |
| `src/stores/sessions.ts` | `src/stores/sessions.ts` | IPC-based |
| - | `src/stores/hooks.ts` | New file |
| - | `src/stores/mcp.ts` | New file |
| `src/components/tool-call.tsx` | `src/components/tool-call.tsx` | Add Claude tools |
| - | `src/components/hooks-panel.tsx` | New file |
| - | `src/components/mcp-panel.tsx` | New file |

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Permission handling in `-p` mode | High | High | Investigate `--permission-prompt-tool` or hooks |
| Session persistence format unknown | Medium | Medium | Reverse engineer session files in `~/.claude/` |
| Stream JSON format changes | Low | Medium | Abstract parsing layer |
| MCP authentication flow | Medium | Medium | Use `/mcp` command, open browser |

---

## 9. Open Questions

1. **Permission Flow:** How does Claude CLI handle permission requests in `-p` mode?
   - Need to test `--permission-prompt-tool` option
   - May need custom MCP tool for permission handling

2. **Session Storage:** Where does Claude store session transcripts?
   - Check `~/.claude/` directory structure
   - May need to read transcript files directly

3. **Subagent Communication:** How are subagent results streamed?
   - Test with `Task` tool to see output format
   - May need special handling for nested streams

4. **Plugin Discovery:** How to enumerate installed plugins and their commands?
   - Check `~/.claude/plugins/` structure
   - Read `plugin.json` files

---

*Plan created: 2026-01-05*
*Source: CodeNomad analysis + Claude Code CLI documentation*
