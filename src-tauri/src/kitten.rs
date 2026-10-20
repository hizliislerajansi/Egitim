use base64::{engine::general_purpose::STANDARD,Engine};
use serde_json::{json,Value};
use std::{process::{Command,Child,Stdio},sync::Mutex,time::Duration,path::PathBuf};
static WORKER:Mutex<Option<Child>>=Mutex::new(None);
fn roots()->Vec<PathBuf>{
 let mut roots=vec![];
 if let Ok(exe)=std::env::current_exe(){if let Some(parent)=exe.parent(){
  roots.push(parent.to_path_buf());
  // Workspace deliveries may reuse an existing local installation without a compiled-in host path.
  for ancestor in parent.ancestors().take(4){
   if ancestor.join("package.json").is_file()&&ancestor.join("src-tauri/tauri.conf.json").is_file(){roots.push(ancestor.to_path_buf());break;}
  }
 }}
 #[cfg(any(debug_assertions,test))]
 roots.push(PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf());roots
}
fn start()->Result<(),String>{
 let mut guard=WORKER.lock().map_err(|_|"Yerel İngilizce kilidi alınamadı")?;
 if let Some(worker)=guard.as_mut(){if worker.try_wait().map_err(|_|"Yerel İngilizce kontrol edilemedi")?.is_none(){return Ok(());}}
 let root=roots().into_iter().find(|r|r.join(".runtime/kitten/Scripts/python.exe").exists()&&r.join("scripts/kitten_server.py").exists()).ok_or("Yerel İngilizce kurulumu bulunamadı. Tam kurulum paketini yeniden çalıştırın.")?;
 let mut command=Command::new(root.join(".runtime/kitten/Scripts/python.exe"));
 command.arg("-I").arg(root.join("scripts/kitten_server.py")).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
 #[cfg(target_os="windows")]{use std::os::windows::process::CommandExt;command.creation_flags(0x08000000);}
 *guard=Some(command.spawn().map_err(|_|"Yerel İngilizce yerel yardımcısı başlatılamadı")?);Ok(())
}
async fn healthy(http:&reqwest::Client)->bool{
 match http.get("http://127.0.0.1:17185/health").timeout(Duration::from_secs(1)).send().await{Ok(response)=>response.json::<Value>().await.map(|v|v["service"]=="derspusulasi-kitten").unwrap_or(false),Err(_)=>false}
}
pub async fn speech(payload:&Value)->Result<Value,String>{
 let text=payload["text"].as_str().ok_or("Yerel İngilizce ses metni gerekli")?;
 if text.trim().is_empty()||text.chars().count()>4000||payload["lang"]!="en-US"||!matches!(payload["voice"].as_str().unwrap_or("Jasper"),"Jasper"|"Bella"|"Bruno"|"Luna"|"Hugo"|"Rosie"|"Leo"|"Kiki"){return Err("Yerel İngilizce yalnız 1-4000 karakter İngilizce metin destekler".into());}
 let http=reqwest::Client::builder().no_proxy().redirect(reqwest::redirect::Policy::none()).timeout(Duration::from_secs(180)).build().map_err(|_|"Yerel İngilizce bağlantısı açılamadı")?;
 if !healthy(&http).await{
  tauri::async_runtime::spawn_blocking(start).await.map_err(|_|"Yerel İngilizce başlatma görevi başarısız")??;
  tauri::async_runtime::spawn_blocking(||std::thread::sleep(Duration::from_millis(1200))).await.map_err(|_|"Yerel İngilizce beklenemedi")?;
  if !healthy(&http).await{return Err("Yerel İngilizce yerel servisi kullanılamıyor".into());}
 }
 let response=http.post("http://127.0.0.1:17185/synthesize").header("X-LocalSpeech-Client","DersPusulasi").json(&json!({"text":text,"lang":"en-US","voice":payload["voice"].as_str().unwrap_or("Jasper")})).send().await.map_err(|_|"Yerel İngilizce ses isteği başarısız")?;
 if !response.status().is_success(){return Err(format!("Yerel İngilizce yerel servis HTTP {}",response.status().as_u16()));}
 if response.content_length().unwrap_or(0)>24*1024*1024{return Err("Yerel İngilizce ses sınırı aşıldı".into());}
 let data=response.bytes().await.map_err(|_|"Yerel İngilizce sesi alınamadı")?;
 if data.len()<44||data.len()>24*1024*1024||!data.starts_with(b"RIFF"){return Err("Geçersiz Yerel İngilizce WAV".into());}
 Ok(json!({"kind":"binary","mime":"audio/wav","data":STANDARD.encode(data)}))
}
pub fn shutdown(){if let Ok(mut guard)=WORKER.lock(){if let Some(mut child)=guard.take(){let _=child.kill();let _=child.wait();}}}
#[cfg(test)]mod tests{
 use super::*;
 #[test]fn rejects_invalid_language_voice_and_text(){for payload in [json!({"text":"Hello","lang":"tr-TR"}),json!({"text":"","lang":"en-US"}),json!({"text":"Hello","lang":"en-US","voice":"../bad"})]{assert!(tauri::async_runtime::block_on(speech(&payload)).is_err());}}
 #[test]#[ignore="Requires installed local English runtime"]fn local_english_real_wav(){let result=tauri::async_runtime::block_on(speech(&json!({"text":"Hello. We learn step by step.","lang":"en-US","voice":"Jasper"})));shutdown();let bytes=STANDARD.decode(result.unwrap()["data"].as_str().unwrap()).unwrap();assert!(bytes.starts_with(b"RIFF"));assert!(bytes.len()>10000);}
}
