mod lesson_media;
mod github_updates;
mod ema;
mod kitten;
mod local_ai;
mod api;
mod media;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![github_updates::open_github_release, lesson_media::lesson_media_path, local_ai::local_ai_start, api::open_notebooklm, api::save_api_key, api::has_api_key, api::delete_api_key, api::ai_request, api::dictionary_lookup, media::media_request])
    .on_window_event(|_,event|{if matches!(event,tauri::WindowEvent::Destroyed){ema::shutdown();kitten::shutdown();local_ai::shutdown();}})
    .setup(|app| {
      tauri::async_runtime::spawn(async { let _=local_ai::local_ai_start().await; });
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
