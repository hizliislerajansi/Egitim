use tauri::Manager;
use std::io::Read;
fn valid_topic(topic:&str)->bool{topic.starts_with("topic_")&&topic.len()<100&&topic.bytes().all(|c|c.is_ascii_lowercase()||c.is_ascii_digit()||c==b'_')}
fn checked_media(root:&std::path::Path,topic:&str)->Result<String,String>{
 if !valid_topic(topic){return Err("Geçersiz ders konusu".into());}
 let base=root.canonicalize().map_err(|_|"Ders videoları bu kurulumda yok")?;
 let file=base.join(format!("{}.mp4",topic)).canonicalize().map_err(|_|"Bu konu için video bulunamadı")?;
 if !file.starts_with(&base){return Err("Ders dosyası kapsam dışında".into());}
 let mut header=[0u8;12];std::fs::File::open(&file).and_then(|mut f|f.read_exact(&mut header)).map_err(|_|"Video okunamadı")?;
 if &header[4..8]!=b"ftyp"{return Err("Geçerli MP4 bulunamadı".into());}
 Ok(file.to_string_lossy().into_owned())
}
#[tauri::command]
pub fn lesson_media_path(app:tauri::AppHandle,topic_id:String)->Result<String,String>{let root=app.path().resource_dir().map_err(|_|"Ders klasörü bulunamadı")?.join("lesson-media");checked_media(&root,&topic_id)}
#[cfg(test)]mod tests{use super::*;#[test]fn rejects_paths_and_urls(){for topic in ["../secret","topic_math/secret","https://evil.test","topic_X","topic_math.mp4"]{assert!(!valid_topic(topic));}assert!(valid_topic("topic_math_equations"));}}
