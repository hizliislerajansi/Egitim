import { useEffect, useState } from 'react';
import { AiAdapter } from '../services/aiAdapter';
import { DictionaryService } from '../services/dictionaryService';
import { AI_PROVIDERS, PROVIDER_DEFAULTS, PROVIDER_INFO, listOpenRouterModels, deleteProviderKey, getProviderProfile, hasProviderKey, isNativeApp, readSetting, saveProviderProfile, writeSetting, type ManagedProvider } from '../services/apiClient';

export function ApiSettingsPanel() {
  const initial = readSetting<ManagedProvider>('ai_provider', 'gemini');
  const [provider, setProvider] = useState<ManagedProvider>(AI_PROVIDERS.includes(initial) ? initial : 'gemini');
  const [modelList, setModelList] = useState<{id:string;name:string;free:boolean}[]>([]);
  const [autoFallback, setAutoFallback] = useState(()=>readSetting('ai_auto_fallback', true));
  const [onlyFree, setOnlyFree] = useState(false);
  const [model, setModel] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [key, setKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [inputRate, setInputRate] = useState('');
  const [outputRate, setOutputRate] = useState('');
  useEffect(() => {
    let active = true;
    const profile = getProviderProfile(provider);
    setModel(profile.model); setEnabled(profile.enabled); setKey(''); setConfigured(false);
    const last = readSetting<{message: string; checkedAt: string} | null>(`api_test_${provider}`, null);
    setMessage(last ? `${last.message} (${new Date(last.checkedAt).toLocaleString('tr-TR')})` : 'Bağlantı henüz test edilmedi.');
    hasProviderKey(provider).then(value => {if (active) setConfigured(value);}).catch(() => {if (active) setMessage('Anahtar kasasına erişilemedi.');});
    const tariff = readSetting<{input: number; output: number} | null>(`ai_tariff_${provider}_${profile.model}`, null);
    setInputRate(tariff ? String(tariff.input) : ''); setOutputRate(tariff ? String(tariff.output) : '');
    return () => {active = false;};
  }, [provider]);
  async function save() {
    if ((inputRate !== '' || outputRate !== '') && (inputRate === '' || outputRate === '' || ![Number(inputRate), Number(outputRate)].every(n => Number.isFinite(n) && n >= 0))) throw new Error('Her iki tarife alanını da sıfır veya pozitif sayı olarak girin.');
    await saveProviderProfile(provider, {model: model.trim(), enabled}, key);
    writeSetting(`ai_tariff_${provider}_${model.trim()}`, inputRate === '' ? null : {input: Number(inputRate), output: Number(outputRate)});
    setKey(''); setConfigured(await hasProviderKey(provider));
  }
  async function run(action: () => Promise<void>) {
    setBusy(true); try {await action();} catch (error) {setMessage(error instanceof Error ? error.message : 'İşlem tamamlanamadı.');} finally {setBusy(false);}
  }
  const info = PROVIDER_INFO[provider];

  const getCategoryBadge = (cat: 'free_tier' | 'mixed' | 'paid' | 'local') => {
    switch (cat) {
      case 'mixed':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>🎁 Ücretsiz Kota & Ücretli</span>;
      case 'free_tier':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>✨ Geniş Ücretsiz Katman</span>;
      case 'paid':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>💳 Ücretli / Ön Ödemeli API</span>;
      case 'local':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>💻 Yerel Kurulum (İsteğe Bağlı)</span>;
    }
  };

  return <section className="api-settings-panel" aria-labelledby="api-panel-title">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <h3 id="api-panel-title" style={{ margin: 0 }}>ders rehberi ve API Yönetim Merkezi</h3>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '6px' }}>
        ⚡ Yalnızca Uzak Resmî API (Yerel model indirme zorunluluğu yoktur)
      </span>
    </div>
    
    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '4px 0 16px' }}>
      {isNativeApp() ? '🔒 API anahtarları Windows Kimlik Kasasında (Credential Manager) güvenle saklanır. Uygulama kodunda veya herkese açık dosyalarda tutulmaz.' : '🌐 Tarayıcı oturumunda anahtarlar yalnızca sekme belleğinde korunur.'}
    </p>

    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <label htmlFor="api-provider" style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
            Sağlayıcı Seçin
          </label>
          <select id="api-provider" className="chat-input" value={provider} disabled={busy} onChange={e => setProvider(e.target.value as ManagedProvider)} style={{ minWidth: '280px', fontWeight: 600 }}>
            {AI_PROVIDERS.map(id => <option key={id} value={id}>{PROVIDER_INFO[id].name}</option>)}
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          {getCategoryBadge(info.category)}
        </div>
      </div>

      {/* 4 Resmî Tıklanabilir Bağlantı (Bölüm 13) */}
      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          🔗 {info.name} Resmî Kaynakları ve API Bağlantıları (Yeni Sekmede Açılır):
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#3b82f6', color: '#fff', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
            🔑 1. API Platformu & Anahtar Al
          </a>
          <a href={info.docsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
            📖 2. API Dokümantasyonu
          </a>
          <a href={info.pricingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
            🏷️ 3. Fiyatlandırma & Kota Bilgisi
          </a>
          <a href={info.modelsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fff', border: '1px solid #cbd5e1', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
            🤖 4. Desteklenen Model Listesi
          </a>
        </div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
        <div><strong>Kota & Fiyatlandırma:</strong> {info.pricing}</div>
        <div style={{ marginTop: '4px', color: '#64748b' }}>💡 <em>{info.freeTierNote}</em></div>
      </div>
    </div>

    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.88rem' }}>
      <input type="checkbox" checked={autoFallback} onChange={e=>{setAutoFallback(e.target.checked);writeSetting('ai_auto_fallback',e.target.checked);}}/>
      <span>Birincil sağlayıcı kota veya ağ hatası verirse, alternatif sağlayıcıya otomatik geç (Yedek: EVREN/Gemini)</span>
    </label>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
      <div>
        <label htmlFor="api-model" style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '4px' }}>
          Model Kimliği (Dinamik & Sürüm Bağımsız)
        </label>
        <input list="provider-model-presets" id="api-model" className="chat-input" value={model} disabled={busy} onChange={e => {setModel(e.target.value); setInputRate(''); setOutputRate('');}} placeholder="Örn: gemini-2.5-flash, llama-3.3-70b..." />
        <datalist id="provider-model-presets">{info.presets.map(m=><option value={m} key={m}/>)}</datalist>
        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
          Önerilen test edilmiş modeller yukarıdaki listededir. Sağlayıcının desteklediği herhangi bir modeli de doğrudan yazabilirsiniz.
        </small>
      </div>

      {provider !== 'ollama' && (
        <div>
          <label htmlFor="provider-api-key" style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '4px' }}>
            {configured ? '✅ API Anahtarı Kayıtlı (Değiştirmek için yeni anahtar girin)' : '🔑 API Anahtarı'}
          </label>
          <input id="provider-api-key" type="password" autoComplete="off" spellCheck={false} className="chat-input" value={key} disabled={busy} placeholder={configured ? '•••••••••••••••• (Kayıtlı anahtar korunuyor)' : 'API anahtarınızı buraya yapıştırın'} onChange={e => setKey(e.target.value)} />
          <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
            Anahtar doğrudan sağlayıcının resmî sunucusuna HTTPS ile gönderilir; asla üçüncü tarafa iletilmez.
          </small>
        </div>
      )}
    </div>

    {provider==='openrouter'&&<div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
        <button className="btn btn-secondary" disabled={busy} onClick={()=>void run(async()=>{const list=await listOpenRouterModels();setModelList(list);setMessage(`${list.length} güncel metin modeli alındı; ${list.filter(m=>m.free).length} modelde metin girdi/çıktı tarifesi sıfır.`);})}>
          🔄 Güncel OpenRouter Model Kataloğunu Getir
        </button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={onlyFree} onChange={e=>setOnlyFree(e.target.checked)}/> 
          Yalnızca ücretsiz (:free) modelleri göster
        </label>
      </div>
      {modelList.length>0&&<select aria-label="OpenRouter model kataloğu" className="chat-input" value={modelList.some(m=>m.id===model)?model:''} onChange={e=>{setModel(e.target.value);setInputRate('');setOutputRate('');}}><option value="" disabled>Model seçin</option>{modelList.filter(m=>!onlyFree||m.free).map(m=><option key={m.id} value={m.id}>{m.name}{m.free?' — 🎁 ÜCRETSİZ':''}</option>)}</select>}
    </div>}

    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 600 }}>
      <input type="checkbox" checked={enabled} disabled={busy} onChange={e => setEnabled(e.target.checked)} /> 
      Bu sağlayıcıyı projede aktif kullan
    </label>

    {provider !== 'ollama' && <>
      <div className="grid-2" style={{ marginBottom: '12px' }}>
        <label>Girdi / 1 milyon token ($)<input className="chat-input" type="number" min="0" step="any" placeholder="Bilinmiyor / Ücretsiz" value={inputRate} onChange={e => setInputRate(e.target.value)} /></label>
        <label>Çıktı / 1 milyon token ($)<input className="chat-input" type="number" min="0" step="any" placeholder="Bilinmiyor / Ücretsiz" value={outputRate} onChange={e => setOutputRate(e.target.value)} /></label>
      </div>
      <small style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '16px' }}>
        Güncel tarifeyi sağlayıcının resmi Fiyatlandırma sayfasından kontrol edin. Tarife girilmezse gerçek kullanım kaydedilir ancak tahmini maliyet bilinmiyor olarak işaretlenir.
      </small>
    </>}

    {provider === 'ollama' && <div style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fde68a', color: '#92400e', marginBottom: '16px', fontSize: '0.85rem' }}>
      ⚠️ Ollama yerel bir seçenektir ve bilgisayarınıza ayrı kurulmalıdır. Uygulamayı kullanmak için Ollama kurmak zorunlu DEĞİLDİR; Gemini, Groq veya OpenRouter gibi ücretsiz kotalı uzaktaki API'leri doğrudan kullanabilirsiniz.
    </div>}

    <div className="api-settings-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <button className="btn btn-primary" disabled={busy} onClick={() => void run(async () => {await save(); setMessage('API ayarları kaydedildi; canlı bağlantı henüz doğrulanmadı.');})}>
        💾 API Ayarlarını Kaydet
      </button>
      <button className="btn btn-secondary" disabled={busy} onClick={() => void run(async () => {await save(); setMessage('Servis yanıtı bekleniyor…'); const result = await AiAdapter.testConnection(provider); setMessage(result.message);})}>
        🧪 Kaydet ve Bağlantıyı Canlı Test Et
      </button>
      {provider !== 'ollama' && <button className="btn btn-secondary" disabled={busy || !configured} onClick={() => void run(async () => {if (!confirm('Bu sağlayıcının kayıtlı anahtarı silinsin mi?')) return; await deleteProviderKey(provider); setConfigured(false); setKey(''); setMessage('Anahtar kimlik kasasından silindi.');})}>
        🗑️ Anahtarı Sil
      </button>}
      <button className="btn btn-secondary" disabled={busy} onClick={() => void run(async () => { const result = await DictionaryService.lookupWord('hello', {timeoutMs: 10000}); setMessage(result.source === 'free_dictionary_api' ? 'Ücretsiz sözlük: gerçek yanıt doğrulandı.' : 'Ücretsiz sözlük: canlı bağlantı doğrulanamadı; yerel kaynak kullanıldı.');})}>
        📚 Sözlük Servisini Test Et
      </button>
    </div>
    <p role="status" aria-live="polite" style={{ marginTop: '14px', fontWeight: 600, color: message.includes('doğrulandı') ? '#059669' : message.includes('hata') || message.includes('ulaşılamadı') ? '#dc2626' : 'var(--text-primary)' }}>
      {busy ? '⏳ İşlem sürüyor… ' : ''}{message}
    </p>
  </section>;
}
