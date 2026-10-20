import {useState} from 'react';
import {readSetting, writeSetting} from '../services/apiClient';
import {APP_VERSION, DEFAULT_GITHUB_REPOSITORY, checkGithubUpdate, githubRepository} from '../services/githubUpdates';
import type {GithubUpdate} from '../services/githubUpdates';
import {isNativeApp, nativeInvoke} from '../services/apiClient';

export function GithubUpdates() {
  const [repo, setRepo] = useState(() => readSetting('github_update_repository', DEFAULT_GITHUB_REPOSITORY));
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<GithubUpdate | null>(null);
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true); setResult(null); setMessage('Hazırlanıyor… Güncel sürüm kontrol ediliyor.');
    try {
      const normalized = githubRepository(repo);
      writeSetting('github_update_repository', normalized); setRepo(normalized);
      const update = await checkGithubUpdate(normalized); setResult(update);
      setMessage(update.available ? `Yeni sürüm: ${update.version}.` : `Daha yeni bir kararlı sürüm bulunamadı. GitHub sürümü: ${update.version}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Kontrol tamamlanamadı.'); }
    finally { setBusy(false); }
  }
  return <div className="product-card"><h2>GitHub güncellemeleri</h2><p>Yüklü sürüm: {APP_VERSION}. Herkese açık deponun son kararlı sürümünü kontrol edin. API anahtarı gerekmez.</p>
    <label>GitHub deposu<input value={repo} disabled={busy} maxLength={180} placeholder="sahip/depo" onChange={e=>{setRepo(e.target.value);setResult(null);setMessage('');}}/></label>
    <button className="btn btn-primary" disabled={busy || !repo.trim()} onClick={()=>void check()}>{busy?'Hazırlanıyor…':'Kaydet ve güncellemeyi kontrol et'}</button>
    <p role="status" aria-live="polite">{message}</p>
    {result?.available && <><p>{result.installers ? 'Kurulum dosyasını GitHub sürüm sayfasından indirin.' : 'Bu sürümde Windows kurulum dosyası bulunamadı; yayıncıdan kurulum paketini isteyin.'} Kurulumdan önce Depolama bölümünden öğrenci yedeğini alın, uygulamayı kapatın ve mevcut klasöre kurun. Yerel ses paketlerini silmeyin.</p><a className="btn btn-secondary" href={result.url} target="_blank" rel="noopener noreferrer" onClick={e=>{if(isNativeApp()){e.preventDefault();void nativeInvoke('open_github_release',{url:result.url}).catch(()=>setMessage('Tarayıcı açılamadı. GitHub sürüm adresi: '+result.url));}}}>GitHub sürümünü aç</a></>}
    <p>Kontrol yalnız bu düğmeyle yapılır. Kurulum otomatik başlatılmaz.</p>
  </div>;
}
