use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::{json, Value};
use std::time::Duration;
use crate::api::credential;

#[derive(serde::Deserialize)]
pub struct MediaInput {
    route: String,
    #[serde(default)] payload: Value,
    #[serde(default)] id: String,
}
fn segment(id: &str) -> Result<&str, String> {
    if id.is_empty() || id.len() > 200 || !id.chars().all(|c| c.is_ascii_alphanumeric() || "_-".contains(c)) { return Err("Geçersiz iş kimliği".into()); }
    Ok(id)
}
fn google_operation(id: &str) -> Result<&str, String> {
    if id.len() > 300 || !id.contains("operations/") || id.contains("..") || !id.chars().all(|c| c.is_ascii_alphanumeric() || "_-./".contains(c)) { return Err("Geçersiz işlem kimliği".into()); }
    Ok(id)
}
#[cfg(target_os="windows")]
fn device_speech(text:&str,lang:&str)->Result<Value,String>{
    use std::os::windows::process::CommandExt;
    if text.trim().is_empty()||text.chars().count()>4000{return Err("Ses metni 1-4000 karakter olmali".into());}
    // Static script: student text is data in an environment variable, never PowerShell code.
    let script=r#"$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $m=New-Object System.IO.MemoryStream; try { try { $s.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::NotSet,[System.Speech.Synthesis.VoiceAge]::NotSet,0,[System.Globalization.CultureInfo]::GetCultureInfo($env:DP_SPEECH_LANG)) } catch { throw 'Requested language voice is not installed' } ; $s.SetOutputToWaveStream($m); $s.Speak($env:DP_SPEECH_TEXT); [Console]::Out.Write([Convert]::ToBase64String($m.ToArray())) } finally { $s.Dispose(); $m.Dispose() }"#;
    let system_root=std::env::var("SystemRoot").unwrap_or_else(|_|"C:\\Windows".into());
    let shell=std::path::Path::new(&system_root).join("System32/WindowsPowerShell/v1.0/powershell.exe");
    let output=std::process::Command::new(shell).args(["-NoLogo","-NoProfile","-NonInteractive","-Command",script]).env("DP_SPEECH_TEXT",text).env("DP_SPEECH_LANG",if lang.starts_with("en"){"en-US"}else{"tr-TR"}).creation_flags(0x08000000).output().map_err(|_|"Windows ses motoru baslatilamadi")?;
    if !output.status.success(){return Err("Windows ses motoru ses uretemedi. Windows konusma seslerini kontrol edin.".into());}
    let data=String::from_utf8(output.stdout).map_err(|_|"Gecersiz ses verisi")?;
    let bytes=STANDARD.decode(data.trim()).map_err(|_|"Gecersiz ses verisi")?;
    if bytes.len()<44||!bytes.starts_with(b"RIFF"){return Err("Bos Windows ses dosyasi".into());}
    Ok(json!({"kind":"binary","mime":"audio/wav","data":data.trim()}))
}
#[cfg(not(target_os="windows"))]
fn device_speech(_text:&str,_lang:&str)->Result<Value,String>{Err("Bu cihaz Windows degil".into())}

#[tauri::command]
pub async fn media_request(input: MediaInput) -> Result<Value, String> {
    if input.payload.to_string().len() > 512_000 { return Err("İstek boyutu sınırı aşıldı".into()); }
    if input.route != "comfy_create" && input.payload.to_string().len() > 64_000 { return Err("İçerik boyutu sınırı aşıldı".into()); }
    if input.route=="kitten_speech" {return crate::kitten::speech(&input.payload).await;}
    if input.route=="ema_speech" {return crate::ema::speech(&input.payload).await;}
    if input.route=="device_speech" {
        let text=input.payload["text"].as_str().unwrap_or("").to_string();
        let lang=input.payload["lang"].as_str().unwrap_or("tr-TR").to_string();
        return tauri::async_runtime::spawn_blocking(move||device_speech(&text,&lang)).await.map_err(|_|"Ses gorevi tamamlanamadi")?;
    }
    let http = reqwest::Client::builder().timeout(Duration::from_secs(120)).redirect(reqwest::redirect::Policy::none()).build().map_err(|_| "Bağlantı başlatılamadı")?;
    let (mut req, provider, binary) = match input.route.as_str() {
        "google_tts" => {
            let text=input.payload["text"].as_str().ok_or("Ses metni gerekli")?;
            if text.trim().is_empty()||text.chars().count()>180{return Err("Ses parcasi cok uzun".into());}
            let lang=if input.payload["lang"].as_str().unwrap_or("tr").starts_with("en"){"en"}else{"tr"};
            (http.get("https://translate.google.com/translate_tts").query(&[("ie","UTF-8"),("client","tw-ob"),("tl",lang),("q",text)]),"",true)
        },
        "gemini_speech" => {
            let model = input.payload["model"].as_str().unwrap_or("gemini-2.5-flash");
            if model.len() > 150 || !model.chars().all(|c| c.is_ascii_alphanumeric() || "-_.".contains(c)) { return Err("Geçersiz model".into()); }
            (http.post(format!("https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent", model)).json(&input.payload["body"]), "gemini", false)
        },
        "gemini_interaction" => (http.post("https://generativelanguage.googleapis.com/v1beta/interactions").json(&input.payload), "gemini", false),
        "cartesia_speech" => (http.post("https://api.cartesia.ai/tts/bytes").header("Cartesia-Version", "2025-04-16").json(&input.payload), "cartesia", true),
        "openai_speech" => (http.post("https://api.openai.com/v1/audio/speech").json(&input.payload), "openai", true),
        "mistral_speech" => (http.post("https://api.mistral.ai/v1/audio/speech").json(&input.payload), "mistral", false),
        "elevenlabs_speech" => (http.post(format!("https://api.elevenlabs.io/v1/text-to-speech/{}", segment(&input.id)?)).json(&input.payload), "elevenlabs", true),
        "together_image" => (http.post("https://api.together.ai/v1/images/generations").json(&input.payload), "together", false),
        "openai_image" => (http.post("https://api.openai.com/v1/images/generations").json(&input.payload), "openai", false),
        "openrouter_image" => (http.post("https://openrouter.ai/api/v1/chat/completions").json(&input.payload), "openrouter", false),
        "openrouter_models" => (http.get("https://openrouter.ai/api/v1/models"), "", false),
        "openai_video_create" => {
            let model = input.payload["model"].as_str().ok_or("Model gerekli")?;
            let prompt = input.payload["prompt"].as_str().ok_or("Açıklama gerekli")?;
            let form = reqwest::multipart::Form::new().text("model", model.to_string()).text("prompt", prompt.to_string()).text("seconds", "4").text("size", "1280x720");
            (http.post("https://api.openai.com/v1/videos").multipart(form), "openai", false)
        },
        "openai_video_status" => (http.get(format!("https://api.openai.com/v1/videos/{}", segment(&input.id)?)), "openai", false),
        "openai_video_file" => (http.get(format!("https://api.openai.com/v1/videos/{}/content", segment(&input.id)?)), "openai", true),
        "gemini_video_create" => {
            let model = input.payload["model"].as_str().ok_or("Model gerekli")?;
            if model.len() > 150 || !model.chars().all(|c| c.is_ascii_alphanumeric() || "-_.".contains(c)) { return Err("Geçersiz model".into()); }
            (http.post(format!("https://generativelanguage.googleapis.com/v1beta/models/{}:predictLongRunning", model)).json(&json!({"instances":[{"prompt":input.payload["prompt"]}], "parameters":{"aspectRatio":"16:9","durationSeconds":8}})), "gemini", false)
        },
        "gemini_video_status" => (http.get(format!("https://generativelanguage.googleapis.com/v1beta/{}", google_operation(&input.id)?)), "gemini", false),
        "gemini_video_file" => {
            let mut url = reqwest::Url::parse(&input.id).map_err(|_| "Geçersiz medya adresi")?;
            if url.scheme() != "https" || url.host_str() != Some("generativelanguage.googleapis.com") || url.port().is_some() || !url.username().is_empty() || !url.path().starts_with("/v1beta/files/") { return Err("İzin verilmeyen medya adresi".into()); }
            url.set_query(Some("alt=media"));
            (http.get(url), "gemini", true)
        },
        "kokoro_speech" => (http.post("http://127.0.0.1:8880/v1/audio/speech").json(&input.payload), "", true),
        "sd_image" => (http.post("http://127.0.0.1:7860/sdapi/v1/txt2img").json(&input.payload), "", false),
        "comfy_create" => (http.post("http://127.0.0.1:8188/prompt").json(&input.payload), "", false),
        "comfy_status" => (http.get(format!("http://127.0.0.1:8188/history/{}", segment(&input.id)?)), "", false),
        "comfy_file" => {
            let filename = input.payload["filename"].as_str().ok_or("Dosya adı gerekli")?;
            let subfolder = input.payload["subfolder"].as_str().unwrap_or("");
            if filename.contains(['/', '\\']) || filename.contains("..") || subfolder.contains("..") || subfolder.starts_with(['/', '\\']) || subfolder.contains(':') { return Err("Geçersiz dosya yolu".into()); }
            (http.get("http://127.0.0.1:8188/view").query(&[("filename",filename),("subfolder",subfolder),("type","output")]), "", true)
        },
        _ => return Err("Desteklenmeyen medya işlemi".into()),
    };
    if !provider.is_empty() {
        let key = credential(provider)?.get_password().map_err(|_| "Bu sağlayıcının API anahtarı gerekli")?;
        req = match provider { "gemini" => req.header("x-goog-api-key", key), "elevenlabs" => req.header("xi-api-key", key), "cartesia" => req.header("X-API-Key", key), _ => req.bearer_auth(key) };
    }
    let mut response = req.send().await.map_err(|e| if e.is_timeout() {"Medya zaman aşımı"} else {"Medya servisine bağlanılamadı"})?;
    if !response.status().is_success() { return Err(format!("HTTP {}", response.status().as_u16())); }
    let mime = response.headers().get("content-type").and_then(|v| v.to_str().ok()).unwrap_or("application/octet-stream").split(';').next().unwrap_or("").to_string();
    let limit = if binary {128 * 1024 * 1024} else {48 * 1024 * 1024};
    let mut data = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| "Medya alınamadı")? {
        if data.len() + chunk.len() > limit { return Err("Medya boyutu sınırı aşıldı".into()); }
        data.extend_from_slice(&chunk);
    }
    if binary { Ok(json!({"kind":"binary","mime":mime,"data":STANDARD.encode(data)})) }
    else { let body: Value = serde_json::from_slice(&data).map_err(|_| "Geçersiz servis yanıtı")?; Ok(json!({"kind":"json","body":body})) }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_os="windows")]
    #[test] fn windows_device_generates_real_wave_without_api_key(){
        let output=device_speech("Merhaba. Ses denemesi.","tr-TR").expect("Windows voice");
        let bytes=STANDARD.decode(output["data"].as_str().unwrap()).unwrap();
        assert!(bytes.starts_with(b"RIFF"));assert!(bytes.len()>1000);
    }
    #[cfg(target_os="windows")]
    #[test] fn windows_english_generates_real_wave_without_api_key(){
        let output=device_speech("Hello. My name is Ada. I am a student.","en-US").expect("Windows English voice");
        let bytes=STANDARD.decode(output["data"].as_str().unwrap()).unwrap();
        assert!(bytes.starts_with(b"RIFF"));assert!(bytes.len()>10000);
        std::fs::write(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../docs/distribution-english-device.wav"),bytes).unwrap();
    }
    #[test] fn rejects_job_path_injection() { assert!(segment("../models").is_err()); assert!(google_operation("operations/../../secrets").is_err()); }
    #[test] fn allows_real_operation_shape() { assert!(google_operation("models/veo-3.1-generate-preview/operations/abc123").is_ok()); }
    #[test] fn rejects_unknown_route_before_credentials() {
        let input = MediaInput {route:"https://evil.test".into(), payload:json!({}),id:String::new()};
        assert!(tauri::async_runtime::block_on(media_request(input)).is_err());
    }
}
#[cfg(test)] mod calm_gemini_test {
 use super::*;
 #[test] #[ignore="Explicit Gemini audio test using the existing Windows credential; never exports it"]
 fn configured_calm_gemini_audio(){
 let path=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../docs/admin-notebook-gemini-audio.json");
 if !crate::api::has_api_key("gemini".into()).unwrap_or(false){std::fs::write(path,r#"{"status":"not_configured"}"#).unwrap();return;}
 let result=tauri::async_runtime::block_on(media_request(MediaInput{route:"gemini_interaction".into(),id:String::new(),payload:json!({"model":"gemini-3.8-flash-tts","input":[{"type":"user_input","content":[{"type":"text","text":"Birlikte, adım adım öğrenebiliriz.","annotations":[{"type":"speech_metadata","style":"Calm, reassuring, patient teacher; measured pace, clear articulation, natural pauses, warm supportive tone."}]}]}],"response_format":{"type":"audio"},"generation_config":{"speech_config":[{"voice":"Charon"}]}})}));
 let report=match result {Ok(output)=>{let body=&output["body"];let data=body["steps"].as_array().and_then(|steps|steps.iter().filter_map(|step|step["content"].as_array()).flatten().filter(|part|part["type"]=="audio").filter_map(|part|part["data"].as_str()).last());match data.and_then(|s|STANDARD.decode(s).ok()){Some(bytes) if bytes.starts_with(b"RIFF")&&bytes.len()>44=>{std::fs::write(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../docs/admin-notebook-gemini-sample.wav"),&bytes).unwrap();json!({"status":"passed","bytes":bytes.len(),"voice":"Charon","model":"gemini-3.8-flash-tts"})},_=>json!({"status":"failed","error":"No valid WAV in provider response"})}},Err(error)=>json!({"status":"failed","error":error})};
 std::fs::write(path,serde_json::to_vec_pretty(&report).unwrap()).unwrap();assert_eq!(report["status"],"passed","Gemini audio did not pass; see sanitized report");
 }
}
