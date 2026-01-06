pub mod commands;

use commands::{
    list_projects, get_project, list_sessions, read_session,
    list_mcp_servers, toggle_mcp_server, list_installed_skills,
    spawn_claude_session, open_in_finder,
    terminal_spawn, terminal_write, terminal_resize, terminal_kill, terminal_list,
    init_terminal_state,
    install_hooks, uninstall_hooks, check_hooks_installed, generate_hooks_config,
    start_hooks_server,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(init_terminal_state())
        .setup(|app| {
            // Start the hooks HTTP server in background
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_hooks_server(app_handle).await;
            });
            Ok(())
        })
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
            install_hooks,
            uninstall_hooks,
            check_hooks_installed,
            generate_hooks_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
