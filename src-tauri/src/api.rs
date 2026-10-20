use serde_json::{json, Value};
use std::time::Duration;

const SUPPORTED_PROVIDERS: &[&str] = &[
    "gemini",
    "openai",
    "mistral",
    "anthropic",
    "openrouter",
    "zai",
    "groq",
    "cerebras",
    "together",
    "fireworks",
    "deepseek",
    "huggingface",
    "cloudflare",
    "evren",
    "openai_tts",
    "elevenlabs",
    "cartesia",
];

pub(crate) fn credential(provider: &str) -> Result<keyring::Entry, String> {
    if !SUPPORTED_PROVIDERS.contains(&provider) {
        return Err("Desteklenmeyen sağlayıcı".into());
    }
    keyring::Entry::new("com.studycompanion.lise1", provider)
        .map_err(|_| "Windows kimlik kasasına erişilemedi".into())
}

#[tauri::command]
pub fn save_api_key(provider: String, key: String) -> Result<(), String> {
    if key.trim().is_empty() || key.len() > 4096 {
        return Err("Geçersiz anahtar".into());
    }
    credential(&provider)?
        .set_password(key.trim())
        .map_err(|_| "Anahtar kaydedilemedi".into())
}

#[tauri::command]
pub fn has_api_key(provider: String) -> Result<bool, String> {
    match credential(&provider)?.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(_) => Err("Windows kimlik kasası okunamadı".into()),
    }
}

#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<(), String> {
    match credential(&provider)?.delete_credential() {
        Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err("Anahtar silinemedi".into()),
    }
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessageInput {
    pub role: String,
    pub content: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiInput {
    provider: String,
    model: String,
    system: String,
    message: String,
    max_tokens: u32,
    #[serde(default)]
    history: Vec<ChatMessageInput>,
    #[serde(default)]
    account_id: Option<String>,
}

pub(crate) fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| "Bağlantı başlatılamadı".into())
}

#[tauri::command]
pub async fn ai_request(input: AiInput) -> Result<Value, String> {
    if input.model.is_empty()
        || input.model.len() > 150
        || !input
            .model
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || ".:_-/@".contains(c))
        || input.model.contains("..")
        || input.message.len() > 32000
        || input.system.len() > 16000
    {
        return Err("Geçersiz istek".into());
    }
    if input.provider == "gemini" && (input.model.contains('/') || input.model.contains('@')) {
        return Err("Geçersiz model".into());
    }
    let max_tokens = input.max_tokens.clamp(1, 4096);
    let http = client()?;
    let mut messages = vec![json!({"role": "system", "content": input.system})];
    for h in &input.history {
        let role = if h.role == "assistant" || h.role == "model" {
            "assistant"
        } else {
            "user"
        };
        messages.push(json!({"role": role, "content": h.content}));
    }
    messages.push(json!({"role": "user", "content": input.message}));
    let body = json!({"model": input.model, "messages": messages, "max_tokens": max_tokens, "stream": false});

    let request = if input.provider == "ollama" {
        http.post("http://127.0.0.1:11434/api/generate").json(&json!({
            "model": input.model,
            "system": input.system,
            "prompt": input.history.iter().rev().take(8).collect::<Vec<_>>().into_iter().rev().map(|h|format!("{}: {}",h.role,h.content)).chain(std::iter::once(format!("user: {}",input.message))).collect::<Vec<_>>().join("\n"),
            "stream": false,
            "options": {"num_predict": max_tokens, "num_ctx": 2048}
        }))
    } else {
        let key = credential(&input.provider)?
            .get_password()
            .map_err(|_| "API anahtarı gerekli".to_string())?;
        match input.provider.as_str() {
            "gemini" => {
                let mut contents = Vec::new();
                for h in &input.history {
                    let role = if h.role == "assistant" || h.role == "model" {
                        "model"
                    } else {
                        "user"
                    };
                    contents.push(json!({"role": role, "parts": [{"text": h.content}]}));
                }
                contents.push(json!({"role": "user", "parts": [{"text": input.message}]}));
                http.post(format!(
                    "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
                    input.model
                ))
                .header("x-goog-api-key", key)
                .json(&json!({
                    "systemInstruction": {"parts": [{"text": input.system}]},
                    "contents": contents,
                    "generationConfig": {"maxOutputTokens": max_tokens}
                }))
            }
            "openai" => http
                .post("https://api.openai.com/v1/chat/completions")
                .bearer_auth(key)
                .json(&json!({
                    "model": input.model,
                    "messages": body["messages"],
                    "max_completion_tokens": max_tokens
                })),
            "openrouter" => http
                .post("https://openrouter.ai/api/v1/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "mistral" => http
                .post("https://api.mistral.ai/v1/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "zai" => http
                .post("https://api.z.ai/api/paas/v4/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "groq" => http
                .post("https://api.groq.com/openai/v1/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "cerebras" => http
                .post("https://api.cerebras.ai/v1/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "together" => http
                .post("https://api.together.xyz/v1/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "fireworks" => http
                .post("https://api.fireworks.ai/inference/v1/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "deepseek" => http
                .post("https://api.deepseek.com/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "huggingface" => http
                .post("https://router.huggingface.co/v1/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "cloudflare" => {
                let acct = input.account_id.unwrap_or_default();
                if acct.is_empty()
                    || acct.len() > 64
                    || !acct.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
                {
                    return Err("Cloudflare Account ID gerekli".into());
                }
                http.post(format!(
                    "https://api.cloudflare.com/client/v4/accounts/{}/ai/v1/chat/completions",
                    acct
                ))
                .bearer_auth(key)
                .json(&body)
            }
            "evren" => http
                .post("https://evren-llmapi.ssyz.org.tr/v1/chat/completions")
                .bearer_auth(key)
                .json(&body),
            "anthropic" => {
                let mut anthropic_messages = Vec::new();
                for h in &input.history {
                    let role = if h.role == "assistant" || h.role == "model" {
                        "assistant"
                    } else {
                        "user"
                    };
                    anthropic_messages.push(json!({"role": role, "content": h.content}));
                }
                anthropic_messages.push(json!({"role": "user", "content": input.message}));
                http.post("https://api.anthropic.com/v1/messages")
                    .header("x-api-key", key)
                    .header("anthropic-version", "2023-06-01")
                    .json(&json!({
                        "model": input.model,
                        "system": input.system,
                        "messages": anthropic_messages,
                        "max_tokens": max_tokens
                    }))
            }
            _ => return Err("Desteklenmeyen sağlayıcı".into()),
        }
    };
    let response = request.send().await.map_err(|e| {
        if e.is_timeout() {
            "Bağlantı zaman aşımı".to_string()
        } else {
            "Servise bağlanılamadı".to_string()
        }
    })?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }
    response
        .json::<Value>()
        .await
        .map_err(|_| "Geçersiz servis yanıtı".into())
}

#[tauri::command]
pub async fn dictionary_lookup(word: String) -> Result<Value, String> {
    if word.is_empty()
        || word.len() > 80
        || !word.chars().all(|c| c.is_ascii_alphabetic() || c == '-')
    {
        return Err("Geçersiz kelime".into());
    }
    let response = client()?
        .get(format!(
            "https://api.dictionaryapi.dev/api/v2/entries/en/{}",
            word
        ))
        .send()
        .await
        .map_err(|_| "Sözlüğe bağlanılamadı".to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }
    response
        .json::<Value>()
        .await
        .map_err(|_| "Geçersiz sözlük yanıtı".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    #[ignore = "Explicit provider connection test; uses configured Windows credentials without exporting them"]
    fn configured_cloud_smoke() {
        let mut report=Vec::new();
        for provider in ["gemini","openai"] {
            let configured=has_api_key(provider.into()).unwrap_or(false);
            if !configured { report.push(json!({"provider":provider,"status":"not_configured"}));continue; }
            let result=tauri::async_runtime::block_on(async {
                let key=credential(provider)?.get_password().map_err(|_|"Credential unavailable".to_string())?;
                let http=client()?;
                let request=if provider=="gemini" {http.get("https://generativelanguage.googleapis.com/v1beta/models").header("x-goog-api-key",key)} else {http.get("https://api.openai.com/v1/models").bearer_auth(key)};
                let response=request.send().await.map_err(|_|"Model discovery failed".to_string())?;
                if !response.status().is_success(){return Err(format!("Discovery HTTP {}",response.status().as_u16()));}
                let data=response.json::<Value>().await.map_err(|_|"Invalid discovery response".to_string())?;
                let model=if provider=="gemini" {
                    ["gemini-3.5-flash-lite","gemini-3.8-flash","gemini-3.1-flash-lite","gemini-2.5-flash"].into_iter().find(|name|data["models"].as_array().map(|models|models.iter().any(|m|m["name"].as_str().unwrap_or("").trim_start_matches("models/")==*name)).unwrap_or(false)).map(str::to_string)
                } else {
                    ["gpt-4o-mini","gpt-4.1-mini"].into_iter().find(|name|data["data"].as_array().map(|items|items.iter().any(|m|m["id"]==*name)).unwrap_or(false)).map(str::to_string)
                }.ok_or("No supported smoke-test model".to_string())?;
                let input=AiInput{provider:provider.into(),model:model.clone(),system:"English tutor connection test. Reply with one short English sentence.".into(),message:"Say hello.".into(),max_tokens:64,history:vec![],account_id:None};
                let answer=ai_request(input).await.map_err(|e|format!("Generation model={model}: {e}"))?;
                let has_text=if provider=="gemini" {answer["candidates"][0]["content"]["parts"].as_array().map(|a|a.iter().any(|p|p["text"].as_str().map(|s|!s.is_empty()).unwrap_or(false))).unwrap_or(false)} else {answer["choices"][0]["message"]["content"].as_str().map(|s|!s.is_empty()).unwrap_or(false)};
                if !has_text{return Err("No text returned".into());} Ok::<_,String>(model)
            });
            report.push(match result {Ok(model)=>json!({"provider":provider,"status":"passed","model":model}),Err(error)=>json!({"provider":provider,"status":"failed","error":error})});
        }
        let path=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../docs/distribution-provider-smoke.json");
        std::fs::write(path,serde_json::to_vec_pretty(&report).unwrap()).unwrap();
        assert!(!report.iter().any(|r|r["status"]=="failed"),"Provider connection failed; see sanitized status report");
    }
    #[test]
    fn rejects_unknown_credential_provider() {
        assert!(credential("https://example.com").is_err());
    }
    #[test]
    fn supports_all_14_plus_providers() {
        for p in &[
            "gemini",
            "openai",
            "mistral",
            "anthropic",
            "openrouter",
            "zai",
            "groq",
            "cerebras",
            "together",
            "fireworks",
            "deepseek",
            "huggingface",
            "cloudflare",
            "evren",
        ] {
            assert!(SUPPORTED_PROVIDERS.contains(p));
        }
    }
    #[test]
    fn rejects_dictionary_path_injection() {
        let result = tauri::async_runtime::block_on(dictionary_lookup("../secret".into()));
        assert!(result.is_err());
    }
}
fn checked_notebook_url(value:&str)->Result<String,String>{let url=reqwest::Url::parse(value).map_err(|_|"Geçersiz NotebookLM adresi")?;let path=url.path();let valid_path=path=="/"||path.strip_prefix("/notebook/").map(|id|!id.trim_matches('/').is_empty()&&id.trim_end_matches('/').chars().all(|c|c.is_ascii_alphanumeric()||"_-".contains(c))).unwrap_or(false);if url.scheme()!="https"||!matches!(url.host_str(),Some("notebooklm.google.com")|Some("notebook.google.com"))||url.port().is_some()||!url.username().is_empty()||url.password().is_some()||url.query().is_some()||url.fragment().is_some()||!valid_path{return Err("Yalnız resmi NotebookLM bağlantıları açılabilir".into());}Ok(url.to_string())}
#[tauri::command]
pub fn open_notebooklm(url:String)->Result<(),String>{let checked=checked_notebook_url(&url)?;#[cfg(target_os="windows")]{use std::os::windows::process::CommandExt;let shell=std::path::Path::new(&std::env::var("SystemRoot").unwrap_or_else(|_|"C:\\Windows".into())).join("System32/rundll32.exe");std::process::Command::new(shell).args(["url.dll,FileProtocolHandler",&checked]).creation_flags(0x08000000).spawn().map_err(|_|"Tarayıcı başlatılamadı")?;Ok(())}#[cfg(not(target_os="windows"))]{let _=checked;Err("NotebookLM bağlantısını tarayıcınızda açın".into())}}
#[cfg(test)]mod notebook_url_tests{use super::*;#[test]fn external_browser_is_limited_to_notebooklm(){assert!(checked_notebook_url("https://notebooklm.google.com/notebook/test-id").is_ok());for url in ["file:///C:/Windows/system32/cmd.exe","https://evil.test/","https://notebooklm.google.com.evil.test/","https://u:p@notebooklm.google.com/","https://notebooklm.google.com/?secret=value","https://notebooklm.google.com/notebook/a/b"]{assert!(checked_notebook_url(url).is_err());}}}
