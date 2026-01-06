use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SpawnResult {
    pub success: bool,
    pub message: String,
}

/// Spawn a new Claude Code session in the default terminal
/// Opens a new terminal window with `claude` running in the specified project directory
#[command]
pub async fn spawn_claude_session(project_path: String, resume: bool) -> Result<SpawnResult, String> {
    // Build the claude command
    let claude_cmd = if resume {
        "claude --resume".to_string()
    } else {
        "claude".to_string()
    };

    // On macOS, use osascript to open Terminal with the command
    #[cfg(target_os = "macos")]
    {
        let script = format!(
            r#"tell application "Terminal"
                activate
                do script "cd '{}' && {}"
            end tell"#,
            project_path.replace("'", "'\\''"),
            claude_cmd
        );

        let result = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output();

        match result {
            Ok(output) => {
                if output.status.success() {
                    Ok(SpawnResult {
                        success: true,
                        message: format!("Opened Claude in Terminal at {}", project_path),
                    })
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    Err(format!("Failed to open Terminal: {}", stderr))
                }
            }
            Err(e) => Err(format!("Failed to execute osascript: {}", e)),
        }
    }

    // On Linux, try common terminal emulators
    #[cfg(target_os = "linux")]
    {
        // Try gnome-terminal, konsole, xterm in order
        let terminals = [
            ("gnome-terminal", vec!["--working-directory", &project_path, "--", "bash", "-c", &format!("{} ; exec bash", claude_cmd)]),
            ("konsole", vec!["--workdir", &project_path, "-e", "bash", "-c", &format!("{} ; exec bash", claude_cmd)]),
            ("xterm", vec!["-e", "bash", "-c", &format!("cd '{}' && {} ; exec bash", project_path, claude_cmd)]),
        ];

        for (term, args) in &terminals {
            if let Ok(output) = Command::new("which").arg(term).output() {
                if output.status.success() {
                    let result = Command::new(term)
                        .args(args.iter().map(|s| s.as_str()))
                        .spawn();

                    match result {
                        Ok(_) => {
                            return Ok(SpawnResult {
                                success: true,
                                message: format!("Opened Claude in {} at {}", term, project_path),
                            });
                        }
                        Err(e) => {
                            return Err(format!("Failed to spawn {}: {}", term, e));
                        }
                    }
                }
            }
        }

        Err("No supported terminal emulator found (tried gnome-terminal, konsole, xterm)".to_string())
    }

    // On Windows, use cmd
    #[cfg(target_os = "windows")]
    {
        let result = Command::new("cmd")
            .args(["/C", "start", "cmd", "/K", &format!("cd /d \"{}\" && {}", project_path, claude_cmd)])
            .spawn();

        match result {
            Ok(_) => Ok(SpawnResult {
                success: true,
                message: format!("Opened Claude in Command Prompt at {}", project_path),
            }),
            Err(e) => Err(format!("Failed to open Command Prompt: {}", e)),
        }
    }
}

/// Open a project folder in the system file manager
#[command]
pub async fn open_in_finder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    }

    Ok(())
}
