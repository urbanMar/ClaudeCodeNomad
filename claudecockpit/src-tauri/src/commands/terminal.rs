use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{command, AppHandle, Emitter, Manager};
use uuid::Uuid;

/// Terminal session info returned to frontend
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TerminalInfo {
    pub id: String,
    pub project_path: String,
    pub session_id: Option<String>,
    pub cols: u16,
    pub rows: u16,
}

/// Terminal output event payload
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TerminalOutput {
    pub terminal_id: String,
    pub data: String,
}

/// Terminal exit event payload
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TerminalExit {
    pub terminal_id: String,
    pub exit_code: Option<i32>,
}

/// Internal terminal session state
struct TerminalSession {
    info: TerminalInfo,
    pty_pair: PtyPair,
    writer: Box<dyn Write + Send>,
}

/// Global terminal manager
pub struct TerminalManager {
    sessions: HashMap<String, TerminalSession>,
}

impl TerminalManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }
}

/// Thread-safe terminal manager state
pub type TerminalState = Arc<Mutex<TerminalManager>>;

/// Initialize terminal manager in Tauri state
pub fn init_terminal_state() -> TerminalState {
    Arc::new(Mutex::new(TerminalManager::new()))
}

/// Spawn a new terminal session with Claude CLI
#[command]
pub async fn terminal_spawn(
    app: AppHandle,
    project_path: String,
    session_id: Option<String>,
    cols: u16,
    rows: u16,
) -> Result<TerminalInfo, String> {
    let state = app.state::<TerminalState>();

    let terminal_id = Uuid::new_v4().to_string();

    // Create PTY system
    let pty_system = native_pty_system();

    // Configure PTY size
    let pty_size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };

    // Open PTY pair
    let pty_pair = pty_system
        .openpty(pty_size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    // Build command - use shell to run claude
    let mut cmd = CommandBuilder::new("bash");
    cmd.arg("-l"); // Login shell for proper PATH
    cmd.arg("-c");

    // Build claude command
    let claude_cmd = if session_id.is_some() {
        "claude --resume".to_string()
    } else {
        "claude".to_string()
    };
    cmd.arg(&claude_cmd);

    // Set working directory
    cmd.cwd(&project_path);

    // Set TERM environment variable
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");

    // Spawn child process
    let mut child = pty_pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    // Get writer for stdin
    let writer = pty_pair
        .master
        .take_writer()
        .map_err(|e| format!("Failed to get PTY writer: {}", e))?;

    // Get reader for stdout
    let mut reader = pty_pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("Failed to get PTY reader: {}", e))?;

    let info = TerminalInfo {
        id: terminal_id.clone(),
        project_path: project_path.clone(),
        session_id,
        cols,
        rows,
    };

    // Store session
    {
        let mut manager = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        manager.sessions.insert(
            terminal_id.clone(),
            TerminalSession {
                info: info.clone(),
                pty_pair,
                writer,
            },
        );
    }

    // Spawn reader thread to stream output
    let app_handle = app.clone();
    let tid = terminal_id.clone();
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break, // EOF
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_handle.emit(
                        "terminal:output",
                        TerminalOutput {
                            terminal_id: tid.clone(),
                            data,
                        },
                    );
                }
                Err(_) => break,
            }
        }
    });

    // Spawn thread to wait for process exit
    let app_handle = app.clone();
    let tid = terminal_id.clone();
    let state_clone = state.inner().clone();
    thread::spawn(move || {
        let exit_status = child.wait();
        let exit_code = exit_status.ok().and_then(|_| {
            // portable-pty ExitStatus doesn't have code() directly
            // We'll just indicate completion
            Some(0)
        });

        // Emit exit event
        let _ = app_handle.emit(
            "terminal:exit",
            TerminalExit {
                terminal_id: tid.clone(),
                exit_code,
            },
        );

        // Clean up session
        if let Ok(mut manager) = state_clone.lock() {
            manager.sessions.remove(&tid);
        }
    });

    Ok(info)
}

/// Write data to terminal stdin
#[command]
pub async fn terminal_write(
    app: AppHandle,
    terminal_id: String,
    data: String,
) -> Result<(), String> {
    let state = app.state::<TerminalState>();
    let mut manager = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    let session = manager
        .sessions
        .get_mut(&terminal_id)
        .ok_or_else(|| format!("Terminal not found: {}", terminal_id))?;

    session
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("Write error: {}", e))?;

    session
        .writer
        .flush()
        .map_err(|e| format!("Flush error: {}", e))?;

    Ok(())
}

/// Resize terminal
#[command]
pub async fn terminal_resize(
    app: AppHandle,
    terminal_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let state = app.state::<TerminalState>();
    let mut manager = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    let session = manager
        .sessions
        .get_mut(&terminal_id)
        .ok_or_else(|| format!("Terminal not found: {}", terminal_id))?;

    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };

    session
        .pty_pair
        .master
        .resize(size)
        .map_err(|e| format!("Resize error: {}", e))?;

    // Update stored info
    session.info.cols = cols;
    session.info.rows = rows;

    Ok(())
}

/// Kill terminal session
#[command]
pub async fn terminal_kill(app: AppHandle, terminal_id: String) -> Result<(), String> {
    let state = app.state::<TerminalState>();
    let mut manager = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Remove session - this will drop the PTY and kill the process
    manager.sessions.remove(&terminal_id);

    Ok(())
}

/// List active terminal sessions
#[command]
pub async fn terminal_list(app: AppHandle) -> Result<Vec<TerminalInfo>, String> {
    let state = app.state::<TerminalState>();
    let manager = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    let terminals: Vec<TerminalInfo> = manager
        .sessions
        .values()
        .map(|s| s.info.clone())
        .collect();

    Ok(terminals)
}
