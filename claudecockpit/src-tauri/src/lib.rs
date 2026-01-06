pub mod commands;

use commands::{
    list_projects, get_project, list_sessions, read_session,
    list_mcp_servers, toggle_mcp_server, list_installed_skills,
    spawn_claude_session, open_in_finder,
    terminal_spawn, terminal_write, terminal_resize, terminal_kill, terminal_list,
    init_terminal_state,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(init_terminal_state())
        .invoke_handler(tauri::generate_handler![
            list_projects,
            get_project,
            list_sessions,
            read_session,
            list_mcp_servers,
            toggle_mcp_server,
            list_installed_skills,
            spawn_claude_session,
            open_in_finder,
            terminal_spawn,
            terminal_write,
            terminal_resize,
            terminal_kill,
            terminal_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
