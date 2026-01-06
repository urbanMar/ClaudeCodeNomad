use axum::{
    extract::State,
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{command, AppHandle, Emitter};
use tower_http::cors::{Any, CorsLayer};

/// Port for the hooks HTTP server
pub const HOOKS_PORT: u16 = 31545;

/// Hook event types from Claude Code
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum HookEvent {
    #[serde(rename = "tool_use")]
    ToolUse {
        session_id: Option<String>,
        tool_name: String,
        tool_input: serde_json::Value,
        #[serde(rename = "isAgent")]
        is_agent: Option<bool>,
    },
    #[serde(rename = "tool_result")]
    ToolResult {
        session_id: Option<String>,
        tool_name: String,
        result: Option<serde_json::Value>,
        error: Option<String>,
    },
    #[serde(rename = "assistant_message")]
    AssistantMessage {
        session_id: Option<String>,
        content: String,
        #[serde(rename = "isAgent")]
        is_agent: Option<bool>,
    },
    #[serde(rename = "user_message")]
    UserMessage {
        session_id: Option<String>,
        content: String,
    },
    #[serde(rename = "agent_start")]
    AgentStart {
        session_id: Option<String>,
        parent_session_id: Option<String>,
        agent_type: Option<String>,
        task: Option<String>,
    },
    #[serde(rename = "agent_end")]
    AgentEnd {
        session_id: Option<String>,
        parent_session_id: Option<String>,
        result: Option<String>,
    },
    #[serde(rename = "session_start")]
    SessionStart {
        session_id: Option<String>,
        project_path: Option<String>,
    },
    #[serde(rename = "session_end")]
    SessionEnd {
        session_id: Option<String>,
    },
    #[serde(rename = "notification")]
    Notification {
        session_id: Option<String>,
        message: String,
    },
}

/// Shared state for the hooks server
struct HooksState {
    app_handle: AppHandle,
}

/// Handle incoming hook events
async fn handle_hook_event(
    State(state): State<Arc<HooksState>>,
    Json(event): Json<HookEvent>,
) -> StatusCode {
    // Emit the event to the Tauri frontend
    if let Err(e) = state.app_handle.emit("claude:hook", &event) {
        eprintln!("Failed to emit hook event: {}", e);
        return StatusCode::INTERNAL_SERVER_ERROR;
    }

    StatusCode::OK
}

/// Generic hook payload for simpler hooks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenericHookPayload {
    #[serde(rename = "type")]
    pub event_type: String,
    pub session_id: Option<String>,
    pub data: serde_json::Value,
}

/// Handle generic hook events
async fn handle_generic_hook(
    State(state): State<Arc<HooksState>>,
    Json(payload): Json<GenericHookPayload>,
) -> StatusCode {
    if let Err(e) = state.app_handle.emit("claude:hook:generic", &payload) {
        eprintln!("Failed to emit generic hook event: {}", e);
        return StatusCode::INTERNAL_SERVER_ERROR;
    }

    StatusCode::OK
}

/// Health check endpoint
async fn health_check() -> &'static str {
    "ClaudeCockpit Hooks Server OK"
}

/// Start the hooks HTTP server
pub async fn start_hooks_server(app_handle: AppHandle) {
    let state = Arc::new(HooksState { app_handle });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/hook", post(handle_hook_event))
        .route("/hook/generic", post(handle_generic_hook))
        .route("/health", axum::routing::get(health_check))
        .layer(cors)
        .with_state(state);

    let addr = format!("127.0.0.1:{}", HOOKS_PORT);
    println!("Starting hooks server on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind hooks server");

    axum::serve(listener, app)
        .await
        .expect("Hooks server failed");
}

/// Generate Claude hooks configuration for ClaudeCockpit integration
#[command]
pub fn generate_hooks_config() -> String {
    let config = serde_json::json!({
        "hooks": {
            "PreToolUse": [{
                "matcher": ".*",
                "hooks": [{
                    "type": "command",
                    "command": format!(
                        "curl -s -X POST http://127.0.0.1:{}/hook/generic -H 'Content-Type: application/json' -d '{{\"type\":\"tool_use_start\",\"session_id\":\"'\"$SESSION_ID\"'\",\"data\":{{\"tool\":\"'\"$TOOL_NAME\"'\"}}}}'",
                        HOOKS_PORT
                    )
                }]
            }],
            "PostToolUse": [{
                "matcher": ".*",
                "hooks": [{
                    "type": "command",
                    "command": format!(
                        "curl -s -X POST http://127.0.0.1:{}/hook/generic -H 'Content-Type: application/json' -d '{{\"type\":\"tool_use_end\",\"session_id\":\"'\"$SESSION_ID\"'\",\"data\":{{\"tool\":\"'\"$TOOL_NAME\"'\"}}}}'",
                        HOOKS_PORT
                    )
                }]
            }],
            "Notification": [{
                "matcher": ".*",
                "hooks": [{
                    "type": "command",
                    "command": format!(
                        "curl -s -X POST http://127.0.0.1:{}/hook/generic -H 'Content-Type: application/json' -d '{{\"type\":\"notification\",\"session_id\":\"'\"$SESSION_ID\"'\",\"data\":{{\"message\":\"'\"$NOTIFICATION\"'\"}}}}'",
                        HOOKS_PORT
                    )
                }]
            }],
            "Stop": [{
                "matcher": ".*",
                "hooks": [{
                    "type": "command",
                    "command": format!(
                        "curl -s -X POST http://127.0.0.1:{}/hook/generic -H 'Content-Type: application/json' -d '{{\"type\":\"session_stop\",\"session_id\":\"'\"$SESSION_ID\"'\",\"data\":{{}}}}'",
                        HOOKS_PORT
                    )
                }]
            }]
        }
    });

    serde_json::to_string_pretty(&config).unwrap_or_default()
}

/// Install hooks to Claude settings
#[command]
pub async fn install_hooks() -> Result<String, String> {
    let claude_dir = dirs::home_dir()
        .ok_or("Could not find home directory")?
        .join(".claude");

    let settings_path = claude_dir.join("settings.json");

    // Read existing settings or create new
    let mut settings: serde_json::Value = if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path)
            .map_err(|e| format!("Failed to read settings: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Add or update hooks
    let hooks = serde_json::json!({
        "PreToolUse": [{
            "matcher": ".*",
            "hooks": [{
                "type": "command",
                "command": format!(
                    "curl -s -X POST http://127.0.0.1:{}/hook/generic -H 'Content-Type: application/json' -d '{{\"type\":\"tool_use_start\",\"session_id\":\"'\"$SESSION_ID\"'\",\"data\":{{\"tool\":\"'\"$TOOL_NAME\"'\"}}}}'",
                    HOOKS_PORT
                )
            }]
        }],
        "PostToolUse": [{
            "matcher": ".*",
            "hooks": [{
                "type": "command",
                "command": format!(
                    "curl -s -X POST http://127.0.0.1:{}/hook/generic -H 'Content-Type: application/json' -d '{{\"type\":\"tool_use_end\",\"session_id\":\"'\"$SESSION_ID\"'\",\"data\":{{\"tool\":\"'\"$TOOL_NAME\"'\"}}}}'",
                    HOOKS_PORT
                )
            }]
        }],
        "Notification": [{
            "matcher": ".*",
            "hooks": [{
                "type": "command",
                "command": format!(
                    "curl -s -X POST http://127.0.0.1:{}/hook/generic -H 'Content-Type: application/json' -d '{{\"type\":\"notification\",\"session_id\":\"'\"$SESSION_ID\"'\",\"data\":{{\"message\":\"'\"$NOTIFICATION\"'\"}}}}'",
                    HOOKS_PORT
                )
            }]
        }],
        "Stop": [{
            "matcher": ".*",
            "hooks": [{
                "type": "command",
                "command": format!(
                    "curl -s -X POST http://127.0.0.1:{}/hook/generic -H 'Content-Type: application/json' -d '{{\"type\":\"session_stop\",\"session_id\":\"'\"$SESSION_ID\"'\",\"data\":{{}}}}'",
                    HOOKS_PORT
                )
            }]
        }]
    });

    settings["hooks"] = hooks;

    // Write back
    std::fs::write(
        &settings_path,
        serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(format!(
        "Hooks installed successfully. Restart Claude Code sessions to activate.\nHooks server listening on port {}",
        HOOKS_PORT
    ))
}

/// Check if hooks are installed
#[command]
pub async fn check_hooks_installed() -> Result<bool, String> {
    let settings_path = dirs::home_dir()
        .ok_or("Could not find home directory")?
        .join(".claude")
        .join("settings.json");

    if !settings_path.exists() {
        return Ok(false);
    }

    let content = std::fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let settings: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse settings: {}", e))?;

    // Check if hooks are configured for our port
    let has_hooks = settings
        .get("hooks")
        .and_then(|h| h.as_object())
        .map(|hooks| {
            hooks.values().any(|v| {
                v.to_string()
                    .contains(&format!("127.0.0.1:{}", HOOKS_PORT))
            })
        })
        .unwrap_or(false);

    Ok(has_hooks)
}

/// Uninstall hooks from Claude settings
#[command]
pub async fn uninstall_hooks() -> Result<String, String> {
    let settings_path = dirs::home_dir()
        .ok_or("Could not find home directory")?
        .join(".claude")
        .join("settings.json");

    if !settings_path.exists() {
        return Ok("No settings file found".to_string());
    }

    let content = std::fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let mut settings: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse settings: {}", e))?;

    // Remove hooks
    if let Some(obj) = settings.as_object_mut() {
        obj.remove("hooks");
    }

    std::fs::write(
        &settings_path,
        serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok("Hooks uninstalled successfully".to_string())
}
