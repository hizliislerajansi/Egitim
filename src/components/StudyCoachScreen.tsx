import {studentText} from '../services/studentExperience';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Target, 
  Sparkles, 
  HeartHandshake, 
  AlertTriangle, 
  Clock, 
  Send, 
  Volume2, 
  Mic, 
  MicOff, 
  TrendingUp,
  Brain,
  CheckCircle2,
  ListTodo,
  Smile,
  Compass
} from 'lucide-react';
import { getDb } from '../db/database';
import { getVoiceService } from '../services/voiceService';
import { AiAdapter, AiResponse } from '../services/aiAdapter';

interface MistakeSummary {
  topic_name: string;
  unit: string;
  error_category: string;
  error_count: number;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const StudyCoachScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coach_chat' | 'weaknesses' | 'strategy'>('coach_chat');
  const [mistakes, setMistakes] = useState<MistakeSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Selam! Ben senin 9. Sınıf Kişisel Ders Koçunum. Nasıl hissediyorsun? İster ders stresini ve kaygılarını paylaş, ister son çözdüğün sorulardaki eksiklerine göre sana özel bir çalışma stratejisi ve moral taktiği belirleyelim. Unutma, sen bu yolda asla yalnız değilsin!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const voiceService = useRef(getVoiceService());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadMistakeAnalytics();
    return () => {
      voiceService.current.stopSpeaking();
      voiceService.current.stopListening();
    };
  }, []);

  // SQLite'tan öğrencinin eksiklerini ve hatalarını dinamik olarak çek
  const loadMistakeAnalytics = () => {
    try {
      const db = getDb();
      const rows = db.query<MistakeSummary>(`
        SELECT 
          t.name as topic_name,
          t.unit as unit,
          COALESCE(a.error_category, 'Genel Hata') as error_category,
          COUNT(*) as error_count
        FROM answer_attempts a
        JOIN questions q ON a.question_id = q.id
        JOIN topics t ON q.topic_id = t.id
        WHERE a.is_correct = 0
        GROUP BY t.id, a.error_category
        ORDER BY error_count DESC
        LIMIT 6
      `);
      setMistakes(rows);
    } catch (e) {
      console.warn('Could not load mistake analytics:', e);
    }
  };

  // Koç ile Sohbet
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userText = text.trim();
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const mistakeContext = mistakes.length > 0 
        ? mistakes.map(m => `${m.topic_name} (${m.error_category}: ${m.error_count} hata)`).join(', ')
        : 'Henüz belirgin bir hata kaydı yok.';

      const response: AiResponse = await AiAdapter.request({
        role: 'study_coach',
        taskType: 'coaching',
        userMessage: userText,
        contextSummary: `Öğrencinin En Çok Zorlandığı Alanlar: ${mistakeContext}`,
        recentMistakes: mistakes.map(m => m.topic_name)
      });

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      voiceService.current.speak(studentText(response.text), 'tr-TR');
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: `Sevgili dostum, küçük bir bağlantı aksaklığı oldu ama ben her zaman yanındayım. Derin bir nefes al ve hedefine odaklan!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sesli Konuşma (Mikrofon)
  const handleToggleVoice = () => {
    if (isListening) {
      voiceService.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceService.current.setOptions({
        lang: 'tr-TR',
        onTranscript: (transcript, isFinal) => {
          setInputText(transcript);
          if (isFinal) {
            setIsListening(false);
            handleSendMessage(transcript);
          }
        },
        onError: () => setIsListening(false)
      });
      voiceService.current.startListening('tr-TR');
    }
  };

  // Hızlı Moral ve Strateji Şablonları
  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                9. SINIF REHBERLİK & MENTORLUK
              </span>
              <span className="badge" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                Moral & Çözüm Stratejisi
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>
              Kişisel Ders Koçun & Motivasyon Odası
            </h2>
            <p style={{ opacity: 0.9, maxWidth: '650px', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Hatalarını analiz eder, eksik olduğun konulara özel çalışma taktiği üretir ve moralin bozulduğunda seni ayağa kaldırırım.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn" 
              style={{ backgroundColor: 'white', color: '#059669', fontWeight: 700, padding: '8px 14px', borderRadius: '8px', fontSize: '0.88rem' }}
              onClick={() => handleQuickPrompt('Koçum, bugün ders çalışmakta zorlanıyorum, bana biraz moral ve motivasyon verir misin?')}
            >
              <HeartHandshake size={16} /> Moral Al
            </button>
            <button 
              className="btn" 
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, padding: '8px 14px', borderRadius: '8px', fontSize: '0.88rem', border: '1px solid rgba(255,255,255,0.4)' }}
              onClick={() => handleQuickPrompt('Hatalarıma ve eksiklerime göre bana bu hafta için nokta atışı bir çalışma reçetesi çıkarır mısın?')}
            >
              <Compass size={16} /> Çözüm Reçetesi İste
            </button>
          </div>
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
          <button 
            className={`btn ${activeTab === 'coach_chat' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeTab === 'coach_chat' ? { backgroundColor: 'white', color: '#059669' } : { color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={() => setActiveTab('coach_chat')}
          >
            <Smile size={16} /> Koçla Moral & Strateji Sohbeti
          </button>
          <button 
            className={`btn ${activeTab === 'weaknesses' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeTab === 'weaknesses' ? { backgroundColor: 'white', color: '#059669' } : { color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={() => setActiveTab('weaknesses')}
          >
            <AlertTriangle size={16} /> Eksik Takibi ({mistakes.length} Alan)
          </button>
          <button 
            className={`btn ${activeTab === 'strategy' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeTab === 'strategy' ? { backgroundColor: 'white', color: '#059669' } : { color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={() => setActiveTab('strategy')}
          >
            <Target size={16} /> Kişisel Çalışma Taktikleri
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SEKMESİ: KOÇLA MORAL VE STRATEJİ SOHBETİ (SESLİ + YAZILI) */}
      {/* ======================================================== */}
      {activeTab === 'coach_chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Hızlı Destek Butonları */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.82rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
              onClick={() => handleQuickPrompt('Matematik sorularını çözerken çok dikkatsizlik yapıyorum, bunu nasıl çözerim?')}
            >
              🧠 Dikkatsizlik Hatalarını Önleme
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.82rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
              onClick={() => handleQuickPrompt('İngilizce kelimeleri aklımda tutamıyorum, nasıl ezber yapmalıyım?')}
            >
              📚 Kelime Hafıza Taktiği
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.82rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
              onClick={() => handleQuickPrompt('Sınav stresi ve kaygısını kontrol altına almak için ne yapabilirim?')}
            >
              🌱 Sınav Kaygısı İle Başa Çıkma
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.82rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
              onClick={() => handleQuickPrompt('Günde kaç saat ve nasıl bir mola düzeniyle çalışmalıyım?')}
            >
              ⏱️ Pomodoro ve Mola Dengesi
            </button>
          </div>

          {/* Sohbet Kutusu */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Rehberlik & Moral Seansı (Sesli Diyalog Açık)</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ders Koçun Seni Dinliyor
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    backgroundColor: msg.sender === 'user' ? '#059669' : 'var(--bg-secondary)',
                    color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    lineHeight: 1.6,
                    fontSize: '0.94rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>
                      {msg.sender === 'user' ? 'Sen' : '🎯 Ders Koçu'}
                    </span>
                    {msg.sender === 'ai' && (
                      <button 
                        onClick={() => voiceService.current.speakManually(studentText(msg.text), 'tr-TR')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.8 }}
                        title="Koçun Sesini Dinle"
                      >
                        <Volume2 size={15} />
                      </button>
                    )}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.sender==='user'?msg.text:studentText(msg.text)}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6, textAlign: 'right', marginTop: '4px' }}>
                    {msg.timestamp}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Koçun sana özel tavsiye hazırlıyor...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleToggleVoice}
                title="Sesle Konuş (Mikrofon)"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                <span>{isListening ? 'Dinleniyor...' : 'Sesle Dertleş'}</span>
              </button>

              <input
                type="text"
                className="chat-input"
                placeholder="Ders koçuna hissettiklerini yaz veya taktik iste..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                style={{ flex: 1 }}
              />

              <button
                className="btn btn-primary"
                style={{ backgroundColor: '#059669', borderColor: '#047857' }}
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SEKMESİ: EKSİK TAKİBİ (SQLITE ANALİTİĞİ) */}
      {/* ======================================================== */}
      {activeTab === 'weaknesses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
              Öğrencinin Eksik ve Hata Haritası
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Bu liste çözdüğün MEB sorularındaki yanlışlardan otomatik derlenir. Koçun bu eksikleri telafi etmen için strateji geliştirir.
            </p>

            {mistakes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                <p>Harika! Henüz birikmiş belirgin bir hata kaydın yok. Matematik veya İngilizce derslerinden soru çözdükçe burası güncellenir.</p>
              </div>
            ) : (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mistakes.map((m, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 16px', 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderRadius: '8px',
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.topic_name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {m.unit} • Hata Türü: <strong>{m.error_category}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="badge badge-hatirlatma">
                        {m.error_count} Hata Kaydı
                      </span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                        onClick={() => {
                          setActiveTab('coach_chat');
                          handleSendMessage(`Koçum, "${m.topic_name}" konusunda ${m.error_category} türünde ${m.error_count} kez hata yapmışım. Bunu nasıl telafi edebilirim?`);
                        }}
                      >
                        Çözüm İste
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SEKMESİ: KİŞİSEL ÇALIŞMA TAKTİKLERİ VE REÇETE */}
      {/* ======================================================== */}
      {activeTab === 'strategy' && (
        <div className="grid-2">
          <div className="card">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} /> 25+5 Pomodoro & Odaklanma Tekniği
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              25 dakika boyunca telefon ve tüm bildirimlerden uzak, yalnızca tek bir konuya (örneğin Mutlak Değer veya İngilizce Theme 3) odaklan. Ardından 5 dakika zihnini dinlendir. 4 turdan sonra 20 dakika uzun mola ver.
            </p>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} /> 3 Adımlı Yanlış Defteri Metodu
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Yanlış yaptığın sorularda doğrudan doğru cevabı ezberleme. <br />
              1. <em>Nerede hata yaptım?</em> (İşlem hatası mı, kuralı mı unuttum?)<br />
              2. <em>Sorunun püf noktası neydi?</em><br />
              3. Soruyu 2 gün sonra tekrar çözmeyi dene.
            </p>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListTodo size={18} /> İngilizce Sesli Tekrar Stratejisi
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Kelimeleri asla sadece gözünle okuma. Uygulamanın <strong>"Dinle"</strong> butonuna basarak telaffuzunu duy ve ardından <strong>"Sesle Cevapla"</strong> mikrofonuna basarak sesli tekrar et. Beyin sesli tekrar edilen kelimeleri 3 kat daha kalıcı saklar.
            </p>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} /> Mental Dayanıklılık & Pozitif Özgüven
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Lise 1'de yeni konuların zor gelmesi çok doğaldır. Başarısızlık bir son değil, öğrenmenin ilk basamağıdır. Her gün düzenli 20 soru çözen bir öğrenci, sınav döneminde strese girmeden zirveye çıkar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
