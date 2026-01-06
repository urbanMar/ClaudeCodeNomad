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
    pub msg_type: Option<String>,
    pub timestamp: Option<String>,
    pub message: Option<serde_json::Value>,
    #[serde(rename = "sessionId")]
    pub session_id: Option<String>,
    #[serde(rename = "gitBranch")]
    pub git_branch: Option<String>,
    pub uuid: Option<String>,
    #[serde(rename = "parentUuid")]
    pub parent_uuid: Option<String>,
    pub cwd: Option<String>,
    #[serde(rename = "toolUseResult")]
    pub tool_use_result: Option<serde_json::Value>,
    #[serde(rename = "isMeta")]
    pub is_meta: Option<bool>,
    #[serde(rename = "isSidechain")]
    pub is_sidechain: Option<bool>,
}

fn get_claude_dir() -> PathBuf {
    dirs::home_dir()
        .expect("Could not find home directory")
        .join(".claude")
}

/// Parse ISO timestamp to Unix timestamp
fn parse_timestamp(ts: &str) -> Option<u64> {
    chrono::DateTime::parse_from_rfc3339(ts)
        .ok()
        .map(|dt| dt.timestamp() as u64)
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

        // Skip directories
        if path.is_dir() {
            continue;
        }

        let file_name = path
            .file_stem()
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

            for line in reader.lines().take(100).map_while(Result::ok) {
                if let Ok(msg) = serde_json::from_str::<SessionMessage>(&line) {
                    // Only count user and assistant messages
                    if let Some(ref msg_type) = msg.msg_type {
                        if msg_type == "user" || msg_type == "assistant" {
                            count += 1;
                        }
                    }

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

/// Read full session transcript
#[command]
pub async fn read_session(
    project_id: String,
    session_id: String,
) -> Result<Vec<SessionMessage>, String> {
    let session_file = get_claude_dir()
        .join("projects")
        .join(&project_id)
        .join(format!("{}.jsonl", session_id));

    if !session_file.exists() {
        return Err(format!("Session file not found: {}", session_id));
    }

    let file =
        File::open(&session_file).map_err(|e| format!("Failed to open session file: {}", e))?;

    let reader = BufReader::new(file);
    let mut messages = Vec::new();

    for line in reader.lines().map_while(Result::ok) {
        if let Ok(msg) = serde_json::from_str::<SessionMessage>(&line) {
            messages.push(msg);
        }
    }

    Ok(messages)
}
