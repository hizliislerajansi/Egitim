import {parsePronunciationDictionary} from '../services/pronunciation';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Cpu, 
  Mic, 
  DollarSign, 
  Download, 
  Upload, 
  Trash2, 
  Sun, 
  Moon, 
  Check,
  ShieldAlert,
  Volume2,
  Play,
  Database,
  Sparkles,
  RotateCcw,
  HardDrive,
  Settings as SettingsIcon
} from 'lucide-react';
import {useDialogFocus} from './useDialogFocus';
import { ApiSettingsPanel } from './ApiSettingsPanel';
import { StorageManagementPanel } from './StorageManagementPanel';
import { getDb } from '../db/database';
import { exportDatabaseToJson, importDatabaseFromJson, exportTableToCsv } from '../db/backup';
import { AIProvider, VoiceMode, VoiceProvider, AppTheme } from '../types/settings';
import { getVoiceService } from '../services/voiceService';
import { saveCredential, writeSetting, readSetting } from '../services/apiClient';
import { EnglishAdminModal } from './EnglishAdminModal';
import { DemoDataManager } from '../services/demoDataManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChange: (theme: AppTheme) => void;
  currentTheme: AppTheme;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onThemeChange,
  currentTheme
}) => {
  const dialogRef=useDialogFocus(isOpen,onClose);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('economic');
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>('ema_local');
  const [voiceApiKey, setVoiceApiKey] = useState('');
  const [voiceModelName, setVoiceModelName] = useState('EMA');
  const [emaFallback,setEmaFallback]=useState(true);
  const [fallbackProvider,setFallbackProvider]=useState('gemini_speech');
  const [pronunciation,setPronunciation]=useState('');
  const [voiceTestText,setVoiceTestText]=useState('Google, ChatGPT ve Einstein. İki artı üç eşittir beş.');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [englishSpeechRate, setEnglishSpeechRate] = useState(0.9);
  const [dailyBudget, setDailyBudget] = useState(0.50);
  const [monthlyBudget, setMonthlyBudget] = useState(10.00);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isEnglishAdminOpen, setIsEnglishAdminOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'api' | 'storage' | 'general'>('voice');

  useEffect(() => {
    if (!isOpen) return;
    const db = getDb();
    setEmaFallback(readSetting('ema_api_fallback',true));setFallbackProvider(readSetting('ema_fallback_provider','gemini_speech'));
    setPronunciation(Object.entries(readSetting<Record<string,string>>('pronunciation_dictionary',{})).map(([a,b])=>a+'='+b).join('\n'));

    const vRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'voice_mode'");
    if (vRow) setVoiceMode(JSON.parse(vRow.value));

    const vpRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'voice_provider'");
    if (vpRow) setVoiceProvider(JSON.parse(vpRow.value));
    else setVoiceProvider('ema_local');

    setVoiceApiKey(''); // Credentials stay in the vault.

    const vModelRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'voice_model_name'");
    if (vModelRow) setVoiceModelName(JSON.parse(vModelRow.value));
    else setVoiceModelName('Puck');

    const rateRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'speech_rate'");
    if (rateRow) setSpeechRate(JSON.parse(rateRow.value));
    else setSpeechRate(1.0);

    const engRateRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'english_speech_rate'");
    if (engRateRow) setEnglishSpeechRate(JSON.parse(engRateRow.value));
    else setEnglishSpeechRate(0.9);

    const dRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'daily_budget_usd'");
    if (dRow) setDailyBudget(JSON.parse(dRow.value));

    const mRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'monthly_budget_usd'");
    if (mRow) setMonthlyBudget(JSON.parse(mRow.value));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    let dictionary:Record<string,string>;
    try{dictionary=parsePronunciationDictionary(pronunciation);}catch(error){setStatusMsg({text:error instanceof Error?error.message:'Telaffuz sözlüğü geçersiz',type:'error'});return;}
    writeSetting('pronunciation_dictionary',dictionary);writeSetting('ema_api_fallback',emaFallback);writeSetting('ema_fallback_provider',fallbackProvider);
    const db = getDb();
    if (![dailyBudget, monthlyBudget].every(v => Number.isFinite(v) && v > 0)) {
      setStatusMsg({text: 'Bütçe sınırları sıfırdan büyük olmalı.', type: 'error'}); return;
    }
    const now = new Date().toISOString();

    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", ['voice_mode', JSON.stringify(voiceMode), now]);
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", ['voice_provider', JSON.stringify(voiceProvider), now]);

    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", ['voice_model_name', JSON.stringify(voiceProvider==='ema_local'?'EMA':voiceModelName==='EMA'?'Puck':voiceModelName), now]);
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", ['speech_rate', JSON.stringify(Number(speechRate)), now]);
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", ['daily_budget_usd', JSON.stringify(Number(dailyBudget)), now]);
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", ['monthly_budget_usd', JSON.stringify(Number(monthlyBudget)), now]);

    if (voiceApiKey.trim()) {
      try {
        const provider = voiceProvider === 'gemini_speech' ? 'gemini' : voiceProvider === 'openai_tts' ? 'openai' : voiceProvider === 'elevenlabs' ? 'elevenlabs' : voiceProvider === 'cartesia_tts' ? 'cartesia' : null;
        if (!provider) throw new Error('Bu servis anahtar kullanmiyor.');
        await saveCredential(provider, voiceApiKey.trim());
        setVoiceApiKey('');
      } catch { setStatusMsg({text:'Anahtar kaydedilemedi. Saglayici ayarlarini kontrol edin.',type:'error'}); return; }
    }

    writeSetting('audio_feedback_enabled', voiceMode === 'live');
    writeSetting('speech_rate', Number(speechRate));
    writeSetting('voice_tts_model','gemini-3.8-flash-tts');
    writeSetting('media_default_speech', null); // This screen now owns the selected teacher voice.

    // VoiceService ayarlarını güncelle
    const voiceService = getVoiceService();
    voiceService.setSpeechRate(Number(speechRate), true);
    window.dispatchEvent(new Event('dp-voice-settings'));

    setStatusMsg({ text: 'Ayarlar ve ses sağlayıcısı başarıyla kaydedildi.', type: 'success' });
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 1000);
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    setStatusMsg({text:'Ses hazirlaniyor…',type:'success'});
    const service=getVoiceService();
    let failed=false;
    service.setOptions({rate:speechRate,onError:(text)=>{failed=true;setStatusMsg({text,type:'error'});setIsTestingVoice(false);}});
    const optionId=voiceProvider==='gemini_speech'?'gemini_tts':voiceProvider==='google_tts'?'google_tts':voiceProvider==='web_speech'?'web_speech':voiceProvider==='elevenlabs'?'elevenlabs_tts':voiceProvider;
    try {
      await service.speakManually(voiceTestText,'tr-TR',()=>{setIsTestingVoice(false);if(!failed)setStatusMsg({text:'Ses denemesi tamamlandi. Ses duymadiysaniz Windows ses cikisini kontrol edin.',type:'success'});},{optionId,model:optionId==='gemini_tts'?'gemini-3.8-flash-tts':'',voice:voiceModelName});
    } catch {setIsTestingVoice(false);setStatusMsg({text:'Ses denemesi baslatilamadi.',type:'error'});}
  };

  const handleExportJson = () => {
    const json = exportDatabaseToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ders_companion_yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csv = exportTableToCsv('answer_attempts');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cevap_denemeleri_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseFromJson(content);
      if (res.success) {
        setStatusMsg({ text: res.message, type: 'success' });
      } else {
        setStatusMsg({ text: res.message, type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (confirm('Tüm veritabanı sıfırlanacaktır. Devam etmek istiyor musunuz?')) {
      const db = getDb();
      await db.resetDatabase();
      alert('Veritabanı sıfırlandı. Uygulama yeniden başlatılıyor.');
      window.location.reload();
    }
  };

  const handleLoadDemo = async () => {
    const res = await DemoDataManager.loadDemoData();
    if (res.success) {
      setStatusMsg({ text: res.message, type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setStatusMsg({ text: res.message, type: 'error' });
    }
  };

  const handleClearDemo = () => {
    if (confirm('Yalnızca demo işaretli kayıtlar silinecek. Gerçek kayıtlar ve ortak ustalık puanları korunacak. Onaylıyor musunuz?')) {
      const res = DemoDataManager.clearDemoData();
      if (res.success) {
        setStatusMsg({ text: res.message, type: 'success' });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setStatusMsg({ text: res.message, type: 'error' });
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Uygulama ve ses ayarları" className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Uygulama ve Ses Ayarları</h3>
          <button aria-label="Ayarları kapat" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {statusMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', backgroundColor: statusMsg.type === 'success' ? 'var(--accent-light)' : 'var(--danger-light)', color: statusMsg.type === 'success' ? 'var(--accent)' : 'var(--danger)', fontSize: '0.88rem' }}>
            {statusMsg.text}
          </div>
        )}

        {/* Ayarlar Sekme Seçicisi */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', overflowX: 'auto', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'voice' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('voice')}
          >
            <Volume2 size={15} /> Ses & Konuşma
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'api' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('api')}
          >
            <Cpu size={15} /> Bağlantılar
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'storage' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('storage')}
          >
            <HardDrive size={15} /> Depolama & Dosya Konumu
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('general')}
          >
            <SettingsIcon size={15} /> Genel & Bütçe
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* SEKME 1: SES & KONUŞMA */}
          {activeTab === 'voice' && (
            <div className="dp-card" style={{ padding: 18, border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Volume2 size={20} color="#2563eb" />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    Ses ve Konuşma Motoru (Ders Anlatıcısı TTS)
                  </h4>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  {voiceProvider==='ema_local'?'Yerel EMA Lightning':'Seçili ses sağlayıcısı'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label htmlFor="settings-voice-provider" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>
                    Önizleme ses sağlayıcısı
                  </label>
                  <select 
                    id="settings-voice-provider" 
                    className="chat-input" 
                    value={voiceProvider} 
                    onChange={e => {setVoiceProvider(e.target.value as VoiceProvider);setVoiceModelName(e.target.value==='ema_local'?'EMA':e.target.value==='openai_tts'?'alloy':'Puck');}}
                    style={{ width: '100%', fontWeight: 600 }}
                  >
                    <option value="ema_local">EMA Lightning · Yerel Türkçe (varsayılan, API gerekmez)</option>
                    <option value="gemini_speech">Google Gemini · Doğal ses</option>
                    <option value="google_tts">🌐 Ücretsiz Google sesi (İnternet gerekir, API anahtarı gerekmez)</option>
                    <option value="web_speech">💻 Windows cihaz sesi (Mekanik yerel alternatif)</option>
                    <option value="openai_tts">💳 OpenAI TTS (Ücretli API)</option>
                    <option value="elevenlabs">💳 ElevenLabs (Ücretli API)</option>
                  </select>
                </div>

                <section className="product-card"><h3>Dile göre öğretmen sesi</h3><label htmlFor="voice-test-text">Ses deneme metni</label><textarea id="voice-test-text" maxLength={4000} value={voiceTestText} onChange={e=>setVoiceTestText(e.target.value)} style={{width:'100%'}}/><p>Derslerde Türkçe yalnız yerel Deniz öğretmen sesiyle okunur. İngilizce sırası: Emre (Gemini Charon), Elif (Gemini Lite Kore), Mert (OpenAI Echo), Kerem (ElevenLabs Josh). Yalnız güvenli kaydedilmiş anahtarı olan API denenir. Başarısız ses beş dakika atlanır. Gemini modelleri aynı hesap kotasını paylaşabilir; bağımsız yedek için diğer sağlayıcı anahtarını da kaydedin. Önizleme seçiminiz yalnız ses denemelerini etkiler.</p><label htmlFor="pronunciation-dictionary">Özel telaffuz sözlüğü</label><textarea id="pronunciation-dictionary" value={pronunciation} onChange={e=>setPronunciation(e.target.value)} placeholder={'ÖzelAd=Okunuşu'} rows={4} style={{width:'100%'}}/><p>Her satıra Yazılış=Okunuş yazın. Yalnız Türkçe seslendirme değişir; ders metni ve İngilizce korunur.</p></section>
                {voiceProvider === 'gemini_speech' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                      <label htmlFor="settings-voice-model" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        Gemini ses karakteri (varsayılan: Puck erkek sesi)
                      </label>
                      <a
                        href="https://aistudio.google.com/apps/bundled/voice-library?showPreview=true&showAssistant=true"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        🎙️ Google Voice Library'de Dinle & Önizle ↗
                      </a>
                    </div>
                    <select 
                      id="settings-voice-model" 
                      className="chat-input" 
                      value={voiceModelName} 
                      onChange={e => setVoiceModelName(e.target.value)}
                      style={{ width: '100%', fontWeight: 600 }}
                    >
                      <option value="Kore">Kore — Sakin ses</option><option value="Aoede">Aoede — Berrak ses</option><option value="Puck">👨 Puck — Google ses paneli (Doğal, Samimi Genç Erkek Sesi - Önerilen)</option>
                      <option value="Charon">👨 Charon — Google ses paneli (Sakin, Derin & Güven Veren Erkek Sesi)</option>
                      <option value="Fenrir">👨 Fenrir — Google ses paneli (Enerjik, Güçlü & Tok Erkek Sesi)</option>
                      <option value="Orus">👨 Orus — Google ses paneli (Dengeli, Kararlı & Net Erkek Sesi)</option>
                    </select>
                  </div>
                )}

                {/* API Anahtarı Alanı (Gemini / OpenAI / ElevenLabs) */}
                {['gemini_speech', 'openai_tts', 'elevenlabs'].includes(voiceProvider) && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label htmlFor="settings-voice-key" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {voiceProvider === 'gemini_speech' ? 'Google Gemini API Anahtarı' : 'TTS API Anahtarı'}
                      </label>
                      {voiceProvider === 'gemini_speech' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>
                            🔑 Anahtar al
                          </a>
                          <a href="https://ai.google.dev/gemini-api/docs/speech-generation" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'underline' }}>
                            📖 Doküman
                          </a>
                        </div>
                      )}
                    </div>
                    <input 
                      id="settings-voice-key"
                      type="password"
                      className="chat-input"
                      placeholder={voiceProvider === 'gemini_speech' ? 'Boşsa kayıtlı Gemini anahtarı kullanılır' : 'API Anahtarı'}
                      value={voiceApiKey}
                      onChange={e => setVoiceApiKey(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                {/* Konuşma Hızı & Etkileşim Modu */}
                <div className="grid-2">
                  <div>
                    <label htmlFor="settings-voice-mode" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>
                      Konuşma Etkileşim Modu
                    </label>
                    <select 
                    id="settings-voice-mode" 
                    className="chat-input" 
                    value={voiceMode} 
                    onChange={e => setVoiceMode(e.target.value as VoiceMode)}
                    style={{ width: '100%' }}
                  >
                    <option value="economic">Bas-konuş (Önerilen)</option>
                    <option value="live">Otomatik konuşma</option>
                    <option value="text_only">Yalnızca yazılı</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="settings-voice-rate" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>
                    Genel Konuşma Hızı: {speechRate}x
                  </label>
                  <input 
                    id="settings-voice-rate"
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.01"
                    value={speechRate}
                    onChange={e => {const rate=parseFloat(e.target.value);setSpeechRate(rate);getVoiceService().setSpeechRate(rate,false);}}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </div>
              </div>

              {/* Test Butonu */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  disabled={isTestingVoice}
                  onClick={handleTestVoice}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 14px' }}
                >
                  <Play size={14} />
                  <span>{isTestingVoice ? 'Ses Çalınıyor…' : '🔊 Seçili Sesi Test Et'}</span>
                </button>
              </div>
            </div>
          </div>
          )}

          {/* SEKME 2: YAPAY ZEKÂ & API MERKEZİ */}
          {activeTab === 'api' && <ApiSettingsPanel />}

          {/* SEKME 3: DEPOLAMA VE DOSYA KONUMU (BÖLÜM 8) */}
          {activeTab === 'storage' && <StorageManagementPanel />}

          {/* SEKME 4: GENEL & BÜTÇE */}
          {activeTab === 'general' && (
            <>

          {/* Bütçe Sınırları */}
          <div className="grid-2">
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                <DollarSign size={15} color="#d97706" /> Günlük Yerel Takip Sınırı ($)
              </label>
              <input 
                type="number"
                step="0.10"
                min="0.10"
                className="chat-input"
                style={{ width: '100%' }}
                value={dailyBudget}
                onChange={e => setDailyBudget(parseFloat(e.target.value) || 0.50)}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                <DollarSign size={15} color="#d97706" /> Aylık Yerel Takip Sınırı ($)
              </label>
              <input 
                type="number"
                step="1.00"
                min="1.00"
                className="chat-input"
                style={{ width: '100%' }}
                value={monthlyBudget}
                onChange={e => setMonthlyBudget(parseFloat(e.target.value) || 10.00)}
              />
            </div>
          </div>

          {/* Tema Seçimi */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '8px', display: 'block' }}>
              Görsel Tema:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`btn ${currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onThemeChange('light')}
                style={{ flex: 1 }}
              >
                <Sun size={16} /> Açık Tema
              </button>
              <button 
                className={`btn ${currentTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onThemeChange('dark')}
                style={{ flex: 1 }}
              >
                <Moon size={16} /> Koyu Tema
              </button>
            </div>
          </div>

          {/* Geliştirici & Uygulama Bilgisi */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Yazılımcı</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>M. SENCER EKŞİOĞLU</div>
              <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>(Tired Warrior Jr)</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div>DersPusulası v1.0</div>
              <div>MEB Lise 1 Edition</div>
            </div>
          </div>

            {/* Veri Yedekleme ve Dışa Aktarma */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                  Öğrenci Verisi, Demo & Yedekleme
                </h4>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.78rem', padding: '4px 9px', backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                    onClick={handleLoadDemo}
                    title="Uygulamayı hemen test etmek için gerçekçi demo çalışma geçmişi, oturumlar ve ustalık verisi yükler"
                  >
                    <Sparkles size={13} /> Demo Verileri Yükle
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.78rem', padding: '4px 9px', backgroundColor: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' }}
                    onClick={handleClearDemo}
                    title="Müfredatı bozmadan tüm çalışma geçmişini, çözülen soruları ve demo kayıtlarını sıfırlar"
                  >
                    <RotateCcw size={13} /> Demo Verileri Sil
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={handleExportJson}>
                  <Download size={15} /> JSON Yedek İndir
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={handleExportCsv}>
                  <Download size={15} /> CSV Dışa Aktar
                </button>
                <label className="btn btn-secondary" style={{ fontSize: '0.82rem', cursor: 'pointer' }}>
                  <Upload size={15} /> Yedek Yükle
                  <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
                </label>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }} 
                  onClick={() => setIsEnglishAdminOpen(true)}
                >
                  <Database size={15} /> İngilizce Veri & Lisans Stüdyosu
                </button>
                <button className="btn btn-danger" style={{ fontSize: '0.82rem' }} onClick={handleResetData}>
                  <Trash2 size={15} /> Veritabanını Sıfırla
                </button>
              </div>
            </div>
            </>
          )}
        </div>

        {/* Alt Kaydet Butonu */}
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={16} /> Ayarları Kaydet
          </button>
        </div>
      </div>

      {/* İngilizce Veri & Lisans Stüdyosu */}
      <EnglishAdminModal isOpen={isEnglishAdminOpen} onClose={() => setIsEnglishAdminOpen(false)} />
    </div>
  );
};

