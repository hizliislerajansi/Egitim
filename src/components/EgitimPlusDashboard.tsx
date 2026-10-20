import {studentText} from '../services/studentExperience';
import React, { useState } from 'react';
import { 
  Play, 
  ChevronRight, 
  BookOpen, 
  HelpCircle, 
  CalendarDays, 
  FileText, 
  RotateCcw, 
  Languages, 
  Calculator, 
  Bot, 
  TrendingUp, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { getDb } from '../db/database';
import { ScreenId } from './Sidebar';
import { getVoiceService } from '../services/voiceService';

interface EgitimPlusDashboardProps {
  onNavigate: (screen: ScreenId, subjectId?: string) => void;
  onOpenTutorial?: () => void;
}

export const EgitimPlusDashboard: React.FC<EgitimPlusDashboardProps> = ({
  onNavigate,
  onOpenTutorial
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'lesson_view' | 'ai_chat' | 'progress'>('overview');
  const [selectedGrade, setSelectedGrade] = useState('Lise 1');
  const [selectedCurriculum, setSelectedCurriculum] = useState('MEB');
  
  const db = getDb();
  const profile = db.queryOne<{ name: string; daily_goal_minutes: number }>('SELECT * FROM student_profile LIMIT 1');
  const studentName = profile?.name?.split(' ')[0] || 'Ahmet';

  // Demo sohbet mesajları (Görsel 2'deki gibi)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; audio?: boolean }>>([
    {
      sender: 'ai',
      text: `Merhaba ${studentName}! 👋\nBugün Present Simple Tense konusunu tekrar değerlendirmek ister misin? Sana örnek sorular, açıklamalar ve alıştırmalarla yardımcı olabilirim.`
    },
    {
      sender: 'user',
      text: 'Bu konuyla ilgili 5 örnek cümle verir misin?'
    },
    {
      sender: 'ai',
      text: `Tabii! İşte Present Simple Tense ile ilgili 5 örnek cümle:\n1. I play football every weekend.\n2. She goes to school by bus.\n3. We live in Istanbul.\n4. He watches TV in the evening.\n5. They study English at school.`
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Harika bir soru! "${userMsg}" üzerine çalışırken fiilin sonuna gelen ekleri ve zaman zarflarını unutma. Şimdi bu konuda küçük bir alıştırma çözelim mi?`
        }
      ]);
    }, 600);
  };

  const handleSpeakSample = () => {
    const vs = getVoiceService();
    vs.speakManually('Present Simple, günlük hayatta sıkça kullandığımız bir zaman yapısıdır.', 'tr-TR');
  };

  return (
    <div className="ep-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '50px' }}>
      
      {/* Üst Sekme Çubuğu: Görsel 2'deki 5 Ekran Arasında Geçiş Yapma İmkanı */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        padding: '8px 16px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'overview' ? '#2563eb' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🏠</span> Ana Sayfa & Günün Planı
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'catalog' ? '#2563eb' : 'transparent',
              color: activeTab === 'catalog' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📚</span> Ders Kataloğu
          </button>

          <button
            onClick={() => setActiveTab('lesson_view')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'lesson_view' ? '#2563eb' : 'transparent',
              color: activeTab === 'lesson_view' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📖</span> Konu Anlatımı (Present Simple)
          </button>

          <button
            onClick={() => setActiveTab('ai_chat')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'ai_chat' ? '#2563eb' : 'transparent',
              color: activeTab === 'ai_chat' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🤖</span> Öğretmen Sohbeti
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'progress' ? '#2563eb' : 'transparent',
              color: activeTab === 'progress' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📊</span> İlerlemem & Karne
          </button>
        </div>

        {/* Lise / Ders Seçim Hapı */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', padding: '4px 10px', background: '#f1f5f9', borderRadius: '8px', color: '#475569', fontWeight: 600 }}>
            Lise 1 • İngilizce + Matematik
          </span>
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Kurulum Sihirbazı
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EKRAN 1: ANA SAYFA & GÜNÜN ÇALIŞMA PLANI (Görsel 2 Sol Üst Ekran) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Üst Banner: Merhaba Ahmet + Günlük İlerleme Çemberi */}
          <div style={{
            background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 60%, #ffffff 100%)',
            borderRadius: '24px',
            padding: '28px 36px',
            border: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(186, 230, 253, 0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ fontSize: '4.5rem' }}>🧑‍🎓</div>
              <div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Merhaba {studentName}! 👋
                </h2>
                <p style={{ color: '#475569', fontSize: '0.92rem', margin: '0 0 14px 0' }}>
                  Bugün İngilizce'de harika bir gün seni bekliyor. Hedefine bir adım daha yaklaş!
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Günlük Hedefin: 2 / 4 ders tamamla</span>
                  <button 
                    onClick={() => onNavigate('subject_workshop', 'subj_eng')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Kaldığın derse devam et →
                  </button>
                </div>
              </div>
            </div>

            {/* %50 Günlük İlerleme Dairesi */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'conic-gradient(#2563eb 0% 50%, #e2e8f0 50% 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>%50</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Günlük İlerleme</span>
              </div>
            </div>
          </div>

          {/* İkili Bölüm: Bugünün Çalışma Planı (Sol) + İngilizce / Matematik Kartları (Sağ) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '20px' }}>
            
            {/* Bugünün Çalışma Planı */}
            <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Bugünün Çalışma Planı</h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Çarşamba, 25 Eylül 2026</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', marginRight: '10px' }}>09:00</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>İngilizce - Present Simple (Konu)</span>
                  </div>
                  <button onClick={() => { setActiveTab('lesson_view'); }} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Devam Et</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '10px' }}>11:00</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Matematik - Denklemler (Konu)</span>
                  </div>
                  <button onClick={() => onNavigate('subject_workshop', 'subj_math')} style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Başla</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '10px' }}>14:00</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>İngilizce - Kelime Çalışması</span>
                  </div>
                  <button onClick={() => onNavigate('english_lab')} style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Başla</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '10px' }}>16:00</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Matematik - Alıştırma Testi</span>
                  </div>
                  <button onClick={() => onNavigate('question_bank')} style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Başla</button>
                </div>
              </div>
            </div>

            {/* Sağ Kolon: Mavi İngilizce ve Yeşil Matematik Büyük Kartları */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* İngilizce Kartı */}
              <div style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                borderRadius: '20px',
                padding: '20px 24px',
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>İngilizce</h4>
                  <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '0 0 12px 0' }}>Son kaldığın konu: <strong>Present Simple Tense</strong></p>
                  <button 
                    onClick={() => setActiveTab('lesson_view')}
                    style={{ background: '#ffffff', color: '#1d4ed8', border: 'none', padding: '7px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Devam Et
                  </button>
                </div>
                <div style={{ fontSize: '2.5rem' }}>🇬🇧</div>
              </div>

              {/* Matematik Kartı */}
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                borderRadius: '20px',
                padding: '20px 24px',
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>Matematik</h4>
                  <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '0 0 12px 0' }}>Son kaldığın konu: <strong>Denklemler</strong></p>
                  <button 
                    onClick={() => onNavigate('subject_workshop', 'subj_math')}
                    style={{ background: '#ffffff', color: '#059669', border: 'none', padding: '7px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Devam Et
                  </button>
                </div>
                <div style={{ fontSize: '2.5rem' }}>📐</div>
              </div>
            </div>
          </div>

          {/* Alt 4 Aksiyon Çubuğu: Yapay Zekâ Sor, Hızlı Tekrar, Kelime Kartları, Kısa Test */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <button 
              onClick={() => setActiveTab('ai_chat')}
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <Bot size={22} color="#2563eb" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>Öğretmenne soru sor</span>
            </button>

            <button 
              onClick={() => onNavigate('question_bank')}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <RotateCcw size={22} color="#059669" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Hızlı tekrar yap</span>
            </button>

            <button 
              onClick={() => onNavigate('english_lab')}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <BookOpen size={22} color="#d97706" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Kelime kartlarını aç</span>
            </button>

            <button 
              onClick={() => onNavigate('question_bank')}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <FileText size={22} color="#7c3aed" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Kısa test başlat</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EKRAN 2: DERS KATALOĞU (Görsel 2 Sağ Üst Ekran) */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>Ders Kataloğu</h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>Kendi seviyene ve hedefine uygun konuları seç, öğrenmeye başla.</p>
          </div>

          {/* Filtre Butonları (Sınıf ve Müfredat) */}
          <div style={{ display: 'flex', gap: '32px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Sınıf</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['Lise 1', 'Lise 2', 'Lise 3', 'Lise 4'].map(gr => (
                  <button
                    key={gr}
                    onClick={() => setSelectedGrade(gr)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: selectedGrade === gr ? '#2563eb' : '#ffffff',
                      color: selectedGrade === gr ? '#ffffff' : '#0f172a',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {gr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Müfredat</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['MEB', 'Özel Okul', 'Diğer'].map(cur => (
                  <button
                    key={cur}
                    onClick={() => setSelectedCurriculum(cur)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: selectedCurriculum === cur ? '#2563eb' : '#ffffff',
                      color: selectedCurriculum === cur ? '#ffffff' : '#0f172a',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* İki Büyük Ünite Kartı: İngilizce & Matematik */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* İngilizce Kataloğu */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '2rem' }}>🇬🇧</div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>İngilizce</h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>Dil becerilerini geliştir, dünyayı keşfet.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Ünite 1 - Greetings and Introductions',
                  'Ünite 2 - Family and Friends',
                  'Ünite 3 - Daily Routines',
                  'Ünite 4 - School Life',
                  'Ünite 5 - Free Time'
                ].map((unit, i) => (
                  <div 
                    key={i}
                    onClick={() => setActiveTab('lesson_view')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>{unit}</span>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Matematik Kataloğu */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '2rem' }}>📐</div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Matematik</h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>Mantığı kullan, problemleri çöz.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Ünite 1 - Temel Kavramlar',
                  'Ünite 2 - Sayılar ve İşlemler',
                  'Ünite 3 - Denklem ve Eşitsizlikler',
                  'Ünite 4 - Geometri',
                  'Ünite 5 - Veri Analizi'
                ].map((unit, i) => (
                  <div 
                    key={i}
                    onClick={() => onNavigate('subject_workshop', 'subj_math')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>{unit}</span>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EKRAN 3: KONU ANLATIMI EKRANI (Görsel 2 Orta Sol Ekran - Present Simple) */}
      {/* ========================================================================= */}
      {activeTab === 'lesson_view' && (
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          {/* Breadcrumb ve İlerleme Çubuğu */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Derslerim &gt; İngilizce &gt; Ünite 1 &gt; Konu 2
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '120px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '30%', height: '100%', background: '#2563eb' }} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>3 / 10</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px 0' }}>
            Present Simple Tense <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px' }}>Konu</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
            
            {/* Sol Navigasyon Sekmeleri */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button style={{ padding: '12px 14px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', border: 'none', fontWeight: 700, fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer' }}>
                📘 Konu Anlatımı
              </button>
              <button style={{ padding: '12px 14px', borderRadius: '10px', background: 'transparent', color: '#64748b', border: 'none', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer' }}>
                💡 Örnekler
              </button>
              <button style={{ padding: '12px 14px', borderRadius: '10px', background: 'transparent', color: '#64748b', border: 'none', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer' }}>
                ✏️ Alıştırmalar
              </button>
              <button style={{ padding: '12px 14px', borderRadius: '10px', background: 'transparent', color: '#64748b', border: 'none', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer' }}>
                📝 Kısa Test
              </button>
            </div>

            {/* Sağ İçerik Alanı */}
            <div style={{ background: '#f8fafc', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
                Present Simple Tense Nedir?
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Present Simple, günlük hayatta sıkça kullandığımız bir zaman yapısıdır. Genellikle alışkanlıklar, düzenli olaylar ve genel gerçekler için kullanılır.
              </p>

              {/* Kısa Özet Kutusu */}
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #cbd5e1', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '8px' }}>Kısa Özet:</span>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.7 }}>
                  <li>Alışkanlıklar: <em>I play football every weekend.</em></li>
                  <li>Genel gerçekler: <em>The sun rises in the east.</em></li>
                  <li>Düzenli olaylar: <em>The train leaves at 7 o'clock.</em></li>
                </ul>
              </div>

              {/* Ses Çalar Çubuğu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <button 
                  onClick={handleSpeakSample}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563eb', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Play size={16} fill="white" />
                </button>
                <div style={{ flex: 1, height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
                  <div style={{ width: '25%', height: '100%', background: '#2563eb' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>0:08 / 1:24</span>
              </div>

              {/* İleri / Geri Butonları */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setActiveTab('overview')} style={{ padding: '8px 18px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>← Geri</button>
                <button onClick={() => setActiveTab('ai_chat')} style={{ padding: '8px 24px', borderRadius: '8px', background: '#2563eb', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Sonraki →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EKRAN 4: YAPAY ZEKÂ ÖĞRETMENİ SOHBETİ (Görsel 2 Orta Ekran) */}
      {/* ========================================================================= */}
      {activeTab === 'ai_chat' && (
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '620px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Bot size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Öğretmen</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Merak ettiğin her konuda sana yardımcı olmak için buradayım.</p>
            </div>
          </div>

          {/* Mesaj Akışı */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                {msg.sender === 'ai' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '14px 18px',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender === 'user' ? '#2563eb' : '#f1f5f9',
                  color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                  {msg.sender==='user'?msg.text:studentText(msg.text)}
                </div>
              </div>
            ))}
          </div>

          {/* Mesaj Yazma Kutusu */}
          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Mesajınızı yazın..."
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '0.88rem'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Gönder
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EKRAN 5: İLERLEMEM & KARNE (Görsel 2 Orta Sağ Ekran) */}
      {/* ========================================================================= */}
      {activeTab === 'progress' && (
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>İlerlemem</h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>Öğrenme yolculuğunda ne kadar ilerlediğini takip et.</p>
            </div>
            <span style={{ fontSize: '0.78rem', padding: '6px 12px', background: '#f1f5f9', borderRadius: '8px', color: '#475569', fontWeight: 600 }}>Son 30 gün</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>Temamlanan Dersler</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>12 / 20</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>%60</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>Doğru Cevap Oranı</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>%85</span>
              </div>
            </div>
          </div>

          {/* Ders Bazlı Başarı Çubukları */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Ders Bazlı Başarı</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                  <span>🇬🇧 İngilizce</span>
                  <span>%82</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '82%', height: '100%', background: '#2563eb' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                  <span>📐 Matematik</span>
                  <span>%78</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '78%', height: '100%', background: '#059669' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Güçlü Olduğun ve Tekrar Etmen Gereken Konular */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#f0fdf4', padding: '18px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#166534', margin: '0 0 10px 0' }}>Güçlü Olduğun Konular</h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#15803d', lineHeight: 1.7 }}>
                <li>Present Simple</li>
                <li>Temel İşlemler</li>
                <li>Kelime Bilgisi</li>
              </ul>
            </div>

            <div style={{ background: '#fff7ed', padding: '18px', borderRadius: '16px', border: '1px solid #fed7aa' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#9a3412', margin: '0 0 10px 0' }}>Tekrar Etmen Gereken Konular</h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#c2410c', lineHeight: 1.7 }}>
                <li>Present Continuous</li>
                <li>Kesirler</li>
                <li>Zamanlar</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
