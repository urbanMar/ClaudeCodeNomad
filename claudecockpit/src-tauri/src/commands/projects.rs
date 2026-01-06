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

        let folder_name = path
            .file_name()
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

        // Count session files (both main sessions and agent sessions)
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
