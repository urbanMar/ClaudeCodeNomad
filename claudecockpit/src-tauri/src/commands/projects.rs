use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
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

/// Convert Claude's encoded folder name back to the actual filesystem path.
/// Claude encodes paths like `/Users/foo/bar-baz` as `-Users-foo-bar-baz`.
/// We need to find the correct path by checking which combinations exist.
fn decode_project_path(encoded: &str) -> Option<String> {
    // Remove leading dash which represents root /
    let encoded = encoded.strip_prefix('-').unwrap_or(encoded);

    // Split by dashes
    let parts: Vec<&str> = encoded.split('-').collect();
    if parts.is_empty() {
        return None;
    }

    // Recursively find valid path by trying different dash combinations
    fn find_valid_path(parts: &[&str], current_path: &Path) -> Option<PathBuf> {
        if parts.is_empty() {
            return if current_path.exists() {
                Some(current_path.to_path_buf())
            } else {
                None
            };
        }

        // Try progressively longer combinations of parts joined with dashes
        for end in 1..=parts.len() {
            let segment = parts[..end].join("-");
            let new_path = current_path.join(&segment);

            // If this is the last segment, check if path exists
            if end == parts.len() {
                if new_path.exists() {
                    return Some(new_path);
                }
            } else {
                // Try to continue from this path
                if new_path.exists() && new_path.is_dir() {
                    if let Some(result) = find_valid_path(&parts[end..], &new_path) {
                        return Some(result);
                    }
                }
            }
        }
        None
    }

    find_valid_path(&parts, Path::new("/")).map(|p| p.to_string_lossy().to_string())
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

        // Convert folder name back to actual filesystem path
        let project_path = match decode_project_path(&folder_name) {
            Some(p) => p,
            None => {
                // Fallback: simple replacement if decoding fails
                folder_name.replace('-', "/")
            }
        };

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
