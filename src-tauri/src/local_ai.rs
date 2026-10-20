use std::{path::PathBuf,process::{Child,Command,Stdio},sync::Mutex,time::Duration};
static WORKER:Mutex<Option<Child>>=Mutex::new(None);
fn root()->Option<PathBuf>{
 let exe=std::env::current_exe().ok()?;
 for base in exe.parent()?.ancestors().take(5){
  if base.join(".runtime/ollama/ollama.exe").is_file()&&base.join(".runtime/ollama-models").is_dir(){return Some(base.to_path_buf());}
 }
 None
}
fn start()->Result<(),String>{
 let mut guard=WORKER.lock().map_err(|_|"Yerel AI kilidi alınamadı")?;
 if let Some(child)=guard.as_mut(){if child.try_wait().map_err(|_|"Yerel AI kontrol edilemedi")?.is_none(){return Ok(());}}
 let root=root().ok_or("Yerel AI ek paketi kurulu değil")?;
 let mut command=Command::new(root.join(".runtime/ollama/ollama.exe"));
 command.arg("serve").env("OLLAMA_HOST","127.0.0.1:11434").env("OLLAMA_MODELS",root.join(".runtime/ollama-models")).env("OLLAMA_NO_CLOUD","1").env("OLLAMA_ORIGINS","http://localhost:*,http://127.0.0.1:*,http://tauri.localhost,https://tauri.localhost").stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
 #[cfg(target_os="windows")]{use std::os::windows::process::CommandExt;command.creation_flags(0x08000000);}
 *guard=Some(command.spawn().map_err(|_|"Yerel AI başlatılamadı")?);Ok(())
}
#[tauri::command]
pub async fn local_ai_start()->Result<bool,String>{
 let http=reqwest::Client::builder().redirect(reqwest::redirect::Policy::none()).timeout(Duration::from_secs(1)).build().map_err(|_|"Yerel AI bağlantısı açılamadı")?;
 if http.get("http://127.0.0.1:11434/api/tags").send().await.map(|r|r.status().is_success()).unwrap_or(false){return Ok(true);}
 tauri::async_runtime::spawn_blocking(start).await.map_err(|_|"Yerel AI başlatma görevi başarısız")??;
 for _ in 0..8{tauri::async_runtime::spawn_blocking(||std::thread::sleep(Duration::from_millis(250))).await.map_err(|_|"Yerel AI beklenemedi")?;if http.get("http://127.0.0.1:11434/api/tags").send().await.map(|r|r.status().is_success()).unwrap_or(false){return Ok(true);}}
 Err("Yerel AI servisi yanıt vermedi".into())
}
pub fn shutdown(){if let Ok(mut guard)=WORKER.lock(){if let Some(mut child)=guard.take(){
 if !matches!(child.try_wait(),Ok(None)){return;}
 #[cfg(target_os="windows")]{use std::os::windows::process::CommandExt;let shell=PathBuf::from(std::env::var("SystemRoot").unwrap_or_else(|_|"C:\\Windows".into())).join("System32/taskkill.exe");let _=Command::new(shell).args(["/PID",&child.id().to_string(),"/T","/F"]).creation_flags(0x08000000).stdout(Stdio::null()).stderr(Stdio::null()).status();}
 let _=child.kill();let _=child.wait();
}}}
#[cfg(test)] mod live_tests{
 use super::*;
 #[test] #[ignore="Requires the optional public local AI companion"]
 fn companion_starts_and_stops_its_own_server(){
  tauri::async_runtime::block_on(async{
   let http=reqwest::Client::builder().timeout(Duration::from_secs(1)).build().unwrap();
   let existed=http.get("http://127.0.0.1:11434/api/tags").send().await.is_ok();
   assert!(local_ai_start().await.unwrap());
   let text=http.get("http://127.0.0.1:11434/api/tags").send().await.unwrap().text().await.unwrap();assert!(text.contains("qwen2.5:1.5b"));
   if !existed{shutdown();std::thread::sleep(Duration::from_millis(500));assert!(http.get("http://127.0.0.1:11434/api/tags").send().await.is_err());}
  });
 }
}
