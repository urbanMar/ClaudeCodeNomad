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
    pub command: Option<String>,
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

/// Read MCP configuration from settings.json and settings.local.json
#[command]
pub async fn list_mcp_servers() -> Result<Vec<McpServer>, String> {
    let claude_dir = get_claude_dir();
    let mut servers = Vec::new();

    // Check multiple possible config locations
    let config_files = vec![
        claude_dir.join("settings.json"),
        claude_dir.join("settings.local.json"),
    ];

    for config_path in config_files {
        if !config_path.exists() {
            continue;
        }

        let content = match fs::read_to_string(&config_path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let settings: serde_json::Value = match serde_json::from_str(&content) {
            Ok(s) => s,
            Err(_) => continue,
        };

        // Parse mcpServers configuration
        if let Some(mcp_servers) = settings.get("mcpServers").and_then(|v| v.as_object()) {
            for (name, config) in mcp_servers {
                // Skip if already added
                if servers.iter().any(|s: &McpServer| s.name == *name) {
                    continue;
                }

                let command = config.get("command")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                servers.push(McpServer {
                    name: name.clone(),
                    enabled: true,
                    connected: false, // Would need runtime check
                    tools: vec![],
                    command,
                });
            }
        }

        // Also check enabledPlugins for MCP-related entries
        if let Some(plugins) = settings.get("enabledPlugins").and_then(|v| v.as_object()) {
            for (name, enabled) in plugins {
                if name.to_lowercase().contains("mcp") {
                    // Skip if already added from mcpServers
                    if servers.iter().any(|s: &McpServer| s.name == *name) {
                        // Update enabled state
                        if let Some(server) = servers.iter_mut().find(|s| s.name == *name) {
                            server.enabled = enabled.as_bool().unwrap_or(true);
                        }
                        continue;
                    }

                    servers.push(McpServer {
                        name: name.clone(),
                        enabled: enabled.as_bool().unwrap_or(false),
                        connected: false,
                        tools: vec![],
                        command: None,
                    });
                }
            }
        }
    }

    // Sort by name
    servers.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(servers)
}

/// A Claude skill/command from an installed plugin
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClaudeSkill {
    pub name: String,
    pub plugin: String,
    pub description: Option<String>,
}

/// Read all installed skills/commands from Claude plugins
#[command]
pub async fn list_installed_skills() -> Result<Vec<ClaudeSkill>, String> {
    let plugins_json = get_claude_dir().join("plugins").join("installed_plugins.json");

    if !plugins_json.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&plugins_json)
        .map_err(|e| format!("Failed to read plugins: {}", e))?;

    let plugins_data: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse plugins: {}", e))?;

    let mut skills = Vec::new();

    // Get the plugins object
    if let Some(plugins) = plugins_data.get("plugins").and_then(|v| v.as_object()) {
        for (plugin_key, versions) in plugins {
            // Get the first (usually only) version entry
            if let Some(version_array) = versions.as_array() {
                if let Some(version_info) = version_array.first() {
                    if let Some(install_path) = version_info.get("installPath").and_then(|v| v.as_str()) {
                        // Look for commands folder
                        let commands_dir = PathBuf::from(install_path).join("commands");

                        if commands_dir.exists() {
                            if let Ok(entries) = fs::read_dir(&commands_dir) {
                                for entry in entries.flatten() {
                                    let path = entry.path();
                                    if path.extension().map(|e| e == "md").unwrap_or(false) {
                                        // Read the markdown file to extract frontmatter
                                        if let Ok(md_content) = fs::read_to_string(&path) {
                                            let skill_name = path
                                                .file_stem()
                                                .and_then(|n| n.to_str())
                                                .unwrap_or("")
                                                .to_string();

                                            let description = extract_frontmatter_description(&md_content);

                                            // Extract plugin name from key (e.g., "code-review@claude-plugins-official" -> "code-review")
                                            let plugin_name = plugin_key
                                                .split('@')
                                                .next()
                                                .unwrap_or(plugin_key)
                                                .to_string();

                                            skills.push(ClaudeSkill {
                                                name: skill_name,
                                                plugin: plugin_name,
                                                description,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Sort by name
    skills.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(skills)
}

/// Extract description from markdown frontmatter
fn extract_frontmatter_description(content: &str) -> Option<String> {
    // Look for YAML frontmatter between --- markers
    if !content.starts_with("---") {
        return None;
    }

    let parts: Vec<&str> = content.splitn(3, "---").collect();
    if parts.len() < 3 {
        return None;
    }

    let frontmatter = parts[1];

    // Simple parsing for description field
    for line in frontmatter.lines() {
        let line = line.trim();
        if line.starts_with("description:") {
            return Some(line.trim_start_matches("description:").trim().to_string());
        }
    }

    None
}

/// Toggle MCP server enabled state
#[command]
pub async fn toggle_mcp_server(name: String, enabled: bool) -> Result<(), String> {
    let settings_path = get_claude_dir().join("settings.json");

    // Read existing settings or create empty object
    let content = if settings_path.exists() {
        fs::read_to_string(&settings_path)
            .map_err(|e| format!("Failed to read settings: {}", e))?
    } else {
        "{}".to_string()
    };

    let mut settings: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    // Ensure enabledPlugins exists
    if settings.get("enabledPlugins").is_none() {
        settings["enabledPlugins"] = serde_json::json!({});
    }

    // Update enabledPlugins
    if let Some(plugins) = settings.get_mut("enabledPlugins").and_then(|v| v.as_object_mut()) {
        plugins.insert(name.clone(), serde_json::Value::Bool(enabled));
    }

    // Write back
    let new_content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, new_content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(())
}
