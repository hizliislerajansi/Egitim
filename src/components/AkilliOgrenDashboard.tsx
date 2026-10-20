import React from 'react';
import { 
  Play, 
  Clock, 
  CheckCircle2, 
  Award, 
  ChevronRight, 
  BookOpen, 
  Bot, 
  Target, 
  BarChart3, 
  Sparkles, 
  Volume2, 
  Calculator, 
  Zap, 
  FlaskConical, 
  FileText, 
  HelpCircle, 
  Compass, 
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Video,
  Check,
  CalendarDays
} from 'lucide-react';
import { getDb } from '../db/database';
import { ScreenId } from './Sidebar';
import { getVoiceService } from '../services/voiceService';
import { readSetting } from '../services/apiClient';
import { VoiceProvider, YOUNG_MALE_VOICE_PRESETS, getDefaultYoungMaleVoice } from '../types/settings';

interface AkilliOgrenDashboardProps {
  onNavigate: (screen: ScreenId, subjectId?: string) => void;
  onOpenTutorial?: () => void;
}

export const AkilliOgrenDashboard: React.FC<AkilliOgrenDashboardProps> = ({
  onNavigate,
  onOpenTutorial
}) => {
  const db = getDb();
  const profile = db.queryOne<{ name: string; daily_goal_minutes: number }>('SELECT * FROM student_profile LIMIT 1');
  const studentName = profile?.name?.split(' ')[0] || 'Ahmet';
  
  const today = new Date().toLocaleDateString('en-CA');
  const todayMinutes = Math.floor(
    (db.queryOne<{ n: number }>('SELECT SUM(duration_seconds) n FROM study_sessions WHERE start_time LIKE ?', [
      today + '%'
    ])?.n || 0) / 60
  );
  const totalMinutes = Math.floor(
    (db.queryOne<{ n: number }>('SELECT SUM(duration_seconds) n FROM study_sessions')?.n || 0) / 60
  );
  const attempts = db.queryOne<{ n: number; correct: number }>(
    'SELECT COUNT(*) n, SUM(is_correct) correct FROM answer_attempts'
  );
  const successRate = attempts?.n ? Math.round(((attempts.correct || 0) * 100) / attempts.n) : 86;
  const goalMinutes = profile?.daily_goal_minutes || 45;
  const goalPercent = Math.min(100, Math.round((todayMinutes * 100) / goalMinutes)) || 63;

  const activeVoiceProvider = readSetting<VoiceProvider>('voice_provider', 'gemini_speech');
  const activeVoiceId = readSetting<string>('voice_model_name', getDefaultYoungMaleVoice(activeVoiceProvider));
  const activeVoicePreset =
    (YOUNG_MALE_VOICE_PRESETS[activeVoiceProvider] || []).find(v => v.id === activeVoiceId) ||
    YOUNG_MALE_VOICE_PRESETS.gemini_speech[0];

  const handleQuickVoiceTest = () => {
    const vs = getVoiceService();
    vs.speakManually(
      `Merhaba ${studentName}! Akıllı Öğren platformuna hoş geldin. Bugün de hedeflerine bir adım daha yaklaşıyorsun.`,
      'tr-TR'
    );
  };

  return (
    <div className="ao-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* 1. Üst İkili Bölüm: Büyük Hero Karşılama Kartı + Sağdaki "Bugünün Hedefi" Kartı */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '20px', alignItems: 'stretch' }}>
        
        {/* Sol Hero Karşılama Kartı (Görsel 1 ile Birebir) */}
        <div style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #ffffff 100%)',
          borderRadius: '24px',
          padding: '32px 36px',
          border: '1px solid #bae6fd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(186, 230, 253, 0.4)'
        }}>
          <div style={{ maxWidth: '420px', zIndex: 2 }}>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Merhaba {studentName} 👋
            </h1>
            <p style={{ color: '#475569', fontSize: '0.98rem', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Bugün de harika bir gün! Hedeflerine bir adım daha yaklaşıyorsun. Hadi derslerine devam edelim.
            </p>

            {/* Haftalık Tamamlanma Göstergesi */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'conic-gradient(#059669 0% 68%, #e2e8f0 68% 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(5, 150, 105, 0.2)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: '#0f172a'
                }}>
                  %68
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Haftalık Tamamlanma</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>24 / 35 ders tamamlandı</div>
                <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '68%', height: '100%', background: '#059669', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* İllüstrasyon ve İlham Balonu */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{
              background: '#ffffff',
              padding: '8px 14px',
              borderRadius: '16px',
              border: '1px solid #e0f2fe',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#0284c7',
              marginBottom: '10px',
              textAlign: 'center',
              lineHeight: 1.3
            }}>
              Başarı, planlı çalışmayla gelir. 💙
            </div>
            <div style={{ fontSize: '5rem', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>
              🧑‍💻
            </div>
          </div>
        </div>

        {/* Sağ: Bugünün Hedefi Kartı (Görsel 1 ile Birebir) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🎯</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Bugünün Hedefi</h3>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>26 Eylül 2026, Cumartesi</span>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                🎯
              </div>
            </div>

            {/* Görev 1 */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '14px',
              padding: '14px',
              border: '1px solid #e2e8f0',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#2563eb" fill="#dbeafe" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Matematik - Fonksiyonlar</span>
              </div>
              <p style={{ margin: '4px 0 10px 28px', fontSize: '0.78rem', color: '#64748b' }}>5 soru çöz, 1 konu çalış</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '28px' }}>
                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '40%', height: '100%', background: '#2563eb' }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>2 / 5</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('goals')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            Hedefi Tamamla
          </button>
        </div>
      </div>

      {/* 2. Derslerim ve Son Aktivitelerim Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '20px' }}>
        
        {/* Sol Kolon: Derslerim & Yapay Zekâ Asistanın */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Derslerim Kart Bloğu */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px 28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Derslerim</h3>
              </div>
              <button 
                onClick={() => onNavigate('subject_workshop')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Tüm Dersler →
              </button>
            </div>

            {/* 4 Ders Kartı Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              
              {/* Matematik */}
              <div 
                onClick={() => onNavigate('subject_workshop', 'subj_math')}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: '#ffffff'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
                    Σ
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Matematik</h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>12 konu / 18 tamamlandı</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '67%', height: '100%', background: '#4f46e5' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>%67</span>
                </div>
              </div>

              {/* Fizik */}
              <div 
                onClick={() => onNavigate('subject_workshop', 'subj_fizik')}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: '#ffffff'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                    ⚛️
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Fizik</h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>8 konu / 12 tamamlandı</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '58%', height: '100%', background: '#ea580c' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>%58</span>
                </div>
              </div>

              {/* Kimya */}
              <div 
                onClick={() => onNavigate('subject_workshop', 'subj_kimya')}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: '#ffffff'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                    🧪
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Kimya</h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>6 konu / 10 tamamlandı</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: '#059669' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>%60</span>
                </div>
              </div>

              {/* Türk Dili ve Edebiyatı */}
              <div 
                onClick={() => onNavigate('subject_workshop', 'subj_turk')}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: '#ffffff'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                    📖
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Türk Dili</h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>7 konu / 10 tamamlandı</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '70%', height: '100%', background: '#e11d48' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>%70</span>
                </div>
              </div>
            </div>
          </div>

          {/* Yapay Zekâ Asistanın Bloğu (Görsel 1 ile Birebir) */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px 28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>ders rehberi Asistanın</h3>
              </div>
              <button 
                onClick={() => onNavigate('tutor')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Asistanı Aç →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              {/* Soru Çözümü */}
              <div style={{ background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '12px' }}>
                    <Bot size={20} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>Soru Çözümü</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                    Sorularını rehberine sor, anında çözümlerini al.
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('tutor')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Soru Sor →
                </button>
              </div>

              {/* Konu Anlatımı */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '12px' }}>
                    <BookOpen size={20} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>Konu Anlatımı</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                    Konu özetleri ve detaylı anlatımlar hazırla.
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('subject_workshop')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', background: '#059669', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Konu Açıklaması İste →
                </button>
              </div>

              {/* Çalışma Planı */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '12px' }}>
                    <Target size={20} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>Çalışma Planı</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                    Hedeflerine göre size özel plan oluştur.
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('schedule')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', background: '#ea580c', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Plan Oluştur →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Son Aktivitelerim & Motivasyon Kartı */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Son Aktivitelerim Kartı */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#0f172a" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Son Aktivitelerim</h3>
              </div>
              <button 
                onClick={() => onNavigate('progress_report')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Tümünü Gör →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Matematik - Fonksiyonlar</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Soru çözdün</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>2 saat önce</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Fizik - Elektrik ve Manyetizma</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Konu çalıştın</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>4 saat önce</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                    <Video size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Kimya - Asitler ve Bazlar</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Görsel simülasyon izledin</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>6 saat önce</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Türk Dili - Paragraf</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Test tamamladın</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>8 saat önce</span>
              </div>
            </div>
          </div>

          {/* Harika Gidiyorsun! Rozet Kartı */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '22px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: '1.2rem' }}>
                🏆
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Harika gidiyorsun!</h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>Bu hafta 24 ders tamamladın. Hedeflerine çok yaklaştın.</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '24px' }}>
                <div style={{ width: '6px', height: '10px', background: '#059669', borderRadius: '2px' }} />
                <div style={{ width: '6px', height: '16px', background: '#059669', borderRadius: '2px' }} />
                <div style={{ width: '6px', height: '14px', background: '#059669', borderRadius: '2px' }} />
                <div style={{ width: '6px', height: '20px', background: '#059669', borderRadius: '2px' }} />
                <div style={{ width: '6px', height: '24px', background: '#059669', borderRadius: '2px' }} />
              </div>
              <button 
                onClick={() => onNavigate('progress_report')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Detayları Gör →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Alt Üçlü Satır: Yaklaşan Dersler | Başarı İstatistiklerin | Hızlı Erişim */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        
        {/* Yaklaşan Dersler */}
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={18} color="#2563eb" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Yaklaşan Dersler</h3>
            </div>
            <button 
              onClick={() => onNavigate('schedule')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Tüm Takvim →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>14:00</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>🔵 Matematik - Fonksiyonlar</span>
              <button onClick={() => onNavigate('subject_workshop', 'subj_math')} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Derse Katıl</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>16:00</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>🟠 Fizik - Elektrik</span>
              <button onClick={() => onNavigate('subject_workshop', 'subj_fizik')} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Derse Katıl</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>18:00</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>🟢 Kimya - Asitler</span>
              <button onClick={() => onNavigate('subject_workshop', 'subj_kimya')} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Derse Katıl</button>
            </div>
          </div>
        </div>

        {/* Başarı İstatistiklerin */}
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#2563eb" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Başarı İstatistiklerin</h3>
            </div>
            <button 
              onClick={() => onNavigate('progress_report')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Tüm Rapor →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Toplam Ders</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>142</span>
              <span style={{ fontSize: '0.68rem', color: '#059669', display: 'block' }}>+12 bu hafta</span>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Doğru Oranı</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>%{successRate}</span>
              <span style={{ fontSize: '0.68rem', color: '#059669', display: 'block' }}>+5% bu hafta</span>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Ortalama Süre</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>1s 45dk</span>
              <span style={{ fontSize: '0.68rem', color: '#059669', display: 'block' }}>+20dk bu hafta</span>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Sıralaman</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>12 / 245</span>
              <span style={{ fontSize: '0.68rem', color: '#2563eb', display: 'block' }}>+8 sıra</span>
            </div>
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Zap size={18} color="#2563eb" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Hızlı Erişim</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            
            <button 
              onClick={() => onNavigate('question_bank')}
              style={{ background: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <FileText size={20} color="#9333ea" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>Sınavlar</span>
            </button>

            <button 
              onClick={() => onNavigate('notes')}
              style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <BookOpen size={20} color="#16a34a" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>Notlarım</span>
            </button>

            <button 
              onClick={() => onNavigate('resources')}
              style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Compass size={20} color="#2563eb" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>Kaynaklar</span>
            </button>

            <button 
              onClick={() => onNavigate('tutor')}
              style={{ background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <HelpCircle size={20} color="#e11d48" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>Destek</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
