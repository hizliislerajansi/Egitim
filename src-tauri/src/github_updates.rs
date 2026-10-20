fn checked_release_url(value: &str) -> Result<String, String> {
    let url = reqwest::Url::parse(value).map_err(|_| "Geçersiz sürüm adresi")?;
    let parts: Vec<_> = url.path().split('/').filter(|p| !p.is_empty()).collect();
    if url.scheme() != "https" || url.host_str() != Some("github.com") || !url.username().is_empty() || url.password().is_some() || url.port().is_some() || url.query().is_some() || url.fragment().is_some() || parts.len() != 5 || parts[2] != "releases" || parts[3] != "tag" || !parts.iter().all(|p| p.bytes().all(|c| c.is_ascii_alphanumeric() || b"._-".contains(&c))) {
        return Err("Yalnız GitHub sürüm sayfası açılabilir".into());
    }
    Ok(url.to_string())
}

#[tauri::command]
pub fn open_github_release(url: String) -> Result<(), String> {
    let checked = checked_release_url(&url)?;
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        let shell = std::path::Path::new(&std::env::var("SystemRoot").unwrap_or_else(|_| "C:\\Windows".into())).join("System32/rundll32.exe");
        std::process::Command::new(shell).args(["url.dll,FileProtocolHandler", &checked]).creation_flags(0x08000000).spawn().map_err(|_| "Tarayıcı başlatılamadı")?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    { let _ = checked; Err("Sürüm bağlantısını tarayıcınızda açın".into()) }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn limits_external_navigation() {
        assert!(checked_release_url("https://github.com/owner/repo/releases/tag/v0.11.0").is_ok());
        for url in ["https://evil.test/o/r/releases/tag/v1", "https://github.com/o/r/releases/tag/v1?token=x", "file:///C:/Windows/cmd.exe", "https://u:p@github.com/o/r/releases/tag/v1", "https://github.com/o/r/releases/tag/v1%22"] {
            assert!(checked_release_url(url).is_err());
        }
    }
}
