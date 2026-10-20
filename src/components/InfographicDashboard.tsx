import React, { useState } from 'react';
import {
  Calculator,
  BookOpen,
  Zap,
  FlaskConical,
  Dna,
  Landmark,
  Globe,
  Languages,
  HeartHandshake,
  HelpCircle,
  Bot,
  CalendarDays,
  TrendingUp,
  Target,
  FileText,
  Volume2,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { getDb } from '../db/database';
import { ScreenId } from './Sidebar';
import { getVoiceService } from '../services/voiceService';
import { readSetting } from '../services/apiClient';
import { VoiceProvider, YOUNG_MALE_VOICE_PRESETS, getDefaultYoungMaleVoice } from '../types/settings';
import { MasteryEngine } from '../services/masteryEngine';
import { Cpu } from 'lucide-react';

export interface InfographicDashboardProps {
  onNavigate: (screen: ScreenId, subjectId?: string) => void;
  onOpenTutorial?: () => void;
}

interface CardItem {
  number: number;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  colorClass: string;
  screen: ScreenId;
  subjectId?: string;
  badgeText?: string;
}

export const InfographicDashboard: React.FC<InfographicDashboardProps> = ({
  onNavigate,
  onOpenTutorial
}) => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'modules'>('subjects');
  const [isSpeakingSample, setIsSpeakingSample] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticScore, setDiagnosticScore] = useState<number | null>(null);
  const [diagStep, setDiagStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);

  const diagnosticQuestions = [
    {
      q: 'p: "2 en küçük asal sayıdır." önermesinin doğruluk değeri nedir?',
      options: ['1 (Doğru)', '0 (Yanlış)'],
      correct: '1 (Doğru)'
    },
    {
      q: '2x - 4 = 10 denklemini sağlayan x değeri kaçtır?',
      options: ['5', '7', '8', '14'],
      correct: '7'
    },
    {
      q: '"Where _____ your teacher from?" cümlesinde boşluğa ne gelmelidir?',
      options: ['is', 'are', 'do', 'am'],
      correct: 'is'
    },
    {
      q: 'Hangisi doğru bir yön sorma ifadesidir?',
      options: ['How can I get to the museum?', 'What time is museum?', 'Where did museum go?'],
      correct: 'How can I get to the museum?'
    }
  ];

  const handleDiagnosticAnswer = (ans: string) => {
    const updated = [...selectedAnswers, ans];
    setSelectedAnswers(updated);

    if (diagStep < diagnosticQuestions.length - 1) {
      setDiagStep(prev => prev + 1);
    } else {
      let correct = 0;
      diagnosticQuestions.forEach((q, idx) => {
        if (updated[idx] === q.correct) correct++;
      });
      setDiagnosticScore(correct);
    }
  };

  const diagEval =
    diagnosticScore !== null
      ? MasteryEngine.evaluateDiagnosticLevel(diagnosticScore, diagnosticQuestions.length)
      : null;

  const db = getDb();
  const profile = db.queryOne<{ name: string; daily_goal_minutes: number }>('SELECT * FROM student_profile LIMIT 1');
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
  const successRate = attempts?.n ? Math.round(((attempts.correct || 0) * 100) / attempts.n) : 0;
  const goalMinutes = profile?.daily_goal_minutes || 45;
  const goalPercent = Math.min(100, Math.round((todayMinutes * 100) / goalMinutes));

  const activeVoiceProvider = readSetting<VoiceProvider>('voice_provider', 'gemini_speech');
  const activeVoiceId = readSetting<string>('voice_model_name', getDefaultYoungMaleVoice(activeVoiceProvider));
  const activeVoicePreset =
    (YOUNG_MALE_VOICE_PRESETS[activeVoiceProvider] || []).find(v => v.id === activeVoiceId) ||
    YOUNG_MALE_VOICE_PRESETS.gemini_speech[0];

  const handleQuickVoiceTest = () => {
    const vs = getVoiceService();
    if (isSpeakingSample) {
      vs.stopSpeaking();
      setIsSpeakingSample(false);
      return;
    }
    setIsSpeakingSample(true);
    vs.speakManually(
      `Merhaba ${profile?.name || 'arkadaşım'}! DersPusulası 9. Sınıf çalışma alanın hazır. İstediğin dersin kartına tıklayarak konuyu dinleyebilir ve soru çözebilirsin.`,
      'tr-TR',
      () => setIsSpeakingSample(false)
    );
  };

  // 1. MEB 9. SINIF 9 TEMEL DERSİ (Kullanıcı referans görselindeki 9 kart tarzı)
  const subjectCards: CardItem[] = [
    {
      number: 1,
      title: 'MATEMATİK',
      desc: 'Mantık, Kümeler, Denklem ve Eşitsizlikler, Mutlak Değer, Üçgenler ve Veri Analizi. MEB kazanımlarına tam uyumlu konu anlatımı ve sorular.',
      icon: Calculator,
      colorClass: 'strip-color-1',
      screen: 'subject_workshop',
      subjectId: 'subj_math',
      badgeText: 'Kümeler & Denklemler'
    },
    {
      number: 2,
      title: 'TÜRK DİLİ VE EDEBİYATI',
      desc: 'İletişim ve Dil, Hikâye, Şiir, Masal/Fabl, Roman Tahlili, Yazım Kuralları ve Noktalama. Detaylı metin incelemeleri ve dil bilgisi.',
      icon: BookOpen,
      colorClass: 'strip-color-2',
      screen: 'subject_workshop',
      subjectId: 'subj_turk',
      badgeText: 'Hikâye & Şiir'
    },
    {
      number: 3,
      title: 'FİZİK',
      desc: 'Fizik Bilimine Giriş, Madde ve Özkütle, Hareket ve Kuvvet, İş, Güç ve Enerji, Isı ve Sıcaklık. Formül ispatları ve görsel simülasyonlar.',
      icon: Zap,
      colorClass: 'strip-color-3',
      screen: 'subject_workshop',
      subjectId: 'subj_fizik',
      badgeText: 'Kuvvet & Hareket'
    },
    {
      number: 4,
      title: 'KİMYA',
      desc: 'Kimya Bilimi, Atom ve Periyodik Sistem, Kimyasal Türler Arası Etkileşimler ve Maddenin Halleri. Deney mantığı ve interaktif tablolar.',
      icon: FlaskConical,
      colorClass: 'strip-color-4',
      screen: 'subject_workshop',
      subjectId: 'subj_kimya',
      badgeText: 'Atom & Periyodik Sistem'
    },
    {
      number: 5,
      title: 'BİYOLOJİ',
      desc: 'Canlıların Ortak Özellikleri, İnorganik ve Organik Bileşikler, Hücre Zarından Madde Geçişleri ve Organeller. Renkli hücre anatomisi.',
      icon: Dna,
      colorClass: 'strip-color-5',
      screen: 'subject_workshop',
      subjectId: 'subj_biyoloji',
      badgeText: 'Hücre & Organeller'
    },
    {
      number: 6,
      title: 'TARİH',
      desc: 'Tarih ve Zaman, İnsanlığın İlk Dönemleri, Orta Çağ’da Dünya, İlk ve Orta Çağlarda Türk Dünyası. Kronolojik haritalar ve neden-sonuç analizleri.',
      icon: Landmark,
      colorClass: 'strip-color-6',
      screen: 'subject_workshop',
      subjectId: 'subj_tarih',
      badgeText: 'İlk Türk Devletleri'
    },
    {
      number: 7,
      title: 'COĞRAFYA',
      desc: 'Doğa ve İnsan, Coğrafi Koordinat Sistemi, Harita Bilgisi ve Projeksiyonlar, İklim Elemanları. Türkiye ve Dünya fiziki coğrafyası.',
      icon: Globe,
      colorClass: 'strip-color-7',
      screen: 'subject_workshop',
      subjectId: 'subj_cografya',
      badgeText: 'Harita & İklim'
    },
    {
      number: 8,
      title: 'İNGİLİZCE',
      desc: 'Studying Abroad, My Environment, Movies, Human in Nature, Inspiring People. CEFR A1-B2 kelime ezberleme, dinleme ve konuşma pratiği.',
      icon: Languages,
      colorClass: 'strip-color-8',
      screen: 'subject_workshop',
      subjectId: 'subj_eng',
      badgeText: 'Themes 1-6 & CEFR'
    },
    {
      number: 9,
      title: 'DİN KÜLTÜRÜ VE AHLAK',
      desc: 'Bilgi ve İnanç, Din ve İslam, İslam ve İbadet Hayatı, Gençlik ve Değerler, Gönül Coğrafyamız. Kavram analizleri ve ahlak ilkeleri.',
      icon: HeartHandshake,
      colorClass: 'strip-color-9',
      screen: 'subject_workshop',
      subjectId: 'subj_din',
      badgeText: 'Bilgi & İnanç'
    }
  ];

  // 2. 9 AKILLI ÇALIŞMA ALANI & SİSTEM MODÜLÜ
  const moduleCards: CardItem[] = [
    {
      number: 1,
      title: 'DERS ATÖLYESİ',
      desc: '9 MEB dersinin kapsamlı konu anlatımları, sesli rehber, interaktif görsel aşamalar ve adım adım çözümlü pratik alıştırmalar.',
      icon: BookOpen,
      colorClass: 'strip-color-1',
      screen: 'subject_workshop',
      badgeText: 'Etkileşimli Ders'
    },
    {
      number: 2,
      title: 'SORU BANKASI',
      desc: 'Kazanım ve zorluk bazlı yüzlerce yeni nesil soru havuzu. Anında çözüm açıklamaları, ipuçları ve hata analiz kaydı.',
      icon: HelpCircle,
      colorClass: 'strip-color-2',
      screen: 'question_bank',
      badgeText: 'Yeni Nesil Testler'
    },
    {
      number: 3,
      title: 'Öğretmen',
      desc: 'Birebir genç erkek sesli pedagojik rehberiniz. Anlamadığınız her noktayı basitleştiren sabırlı ve doğal akıllı eğitmen.',
      icon: Bot,
      colorClass: 'strip-color-3',
      screen: 'tutor',
      badgeText: 'Sesli & Doğal Sohbet'
    },
    {
      number: 4,
      title: 'DERS PROGRAMI',
      desc: 'Haftalık kişiselleştirilmiş çalışma takvimi, sınav geri sayımları ve yığılma önleyici aralıklı tekrar planlayıcısı.',
      icon: CalendarDays,
      colorClass: 'strip-color-4',
      screen: 'schedule',
      badgeText: 'Haftalık Çizelge'
    },
    {
      number: 5,
      title: 'SANAL LABORATUVAR',
      desc: 'PhET interaktif deneyleri, fizik hareket ve kimya çözünürlük simülasyonları ile dokunarak ve keşfederek öğrenin.',
      icon: FlaskConical,
      colorClass: 'strip-color-5',
      screen: 'virtual_lab',
      badgeText: 'Deney & Simülasyon'
    },
    {
      number: 6,
      title: 'İNGİLİZCE LABORATUVARI',
      desc: 'Oxford 3000 & MEB kelime kartları, mikrofonla konuşma simülatörü, açık dil bilimi sözlüğü ve CEFR seviye takibi.',
      icon: Languages,
      colorClass: 'strip-color-6',
      screen: 'english_lab',
      badgeText: 'CEFR A1-B2 & Konuşma'
    },
    {
      number: 7,
      title: 'İLERLEME RAPORU',
      desc: 'Kazanım doğruluk oranları, konu pekişme durumu, haftalık çalışma süreleri ve başarı grafikleriyle performans karnesi.',
      icon: TrendingUp,
      colorClass: 'strip-color-7',
      screen: 'progress_report',
      badgeText: 'Gelişim & Karne'
    },
    {
      number: 8,
      title: 'HEDEFLER & ODAK',
      desc: 'Göz yormayan sade çalışma modu, Pomodoro zamanlayıcı, mikro molalar ve günlük çalışma dakika hedefleri.',
      icon: Target,
      colorClass: 'strip-color-8',
      screen: 'goals',
      badgeText: 'Pomodoro & Disiplin'
    },
    {
      number: 9,
      title: 'NOTLARIM VE KAYNAKLAR',
      desc: 'Ders özetleri, sınav hazırlık notları, formül kağıtları, MEB ders kitapları ve açık eğitim arşivine tek tıkla erişim.',
      icon: FileText,
      colorClass: 'strip-color-9',
      screen: 'notes',
      badgeText: 'Özetler & Kitaplar'
    }
  ];

  const currentCards = activeTab === 'subjects' ? subjectCards : moduleCards;

  return (
    <div className="infographic-dashboard">
      {/* ÜST BİLGİ VE KONTROL PANELİ */}
      <section className="infographic-header" aria-label="Başlangıç Özeti">
        <div className="infographic-header-left">
          <div className="infographic-greeting-badge">
            <span className="badge-glow" />
            <span>MEB 9. Sınıf Başarı Pusulası</span>
          </div>
          <h1>Merhaba, {profile?.name || 'Öğrenci'} 👋</h1>
          <p>
            Bugün hedefine ulaşmak için ne çalışmak istersin? Aşağıdaki 9 karttan birini seçerek hemen başla.
          </p>
        </div>

        <div className="infographic-header-right">
          {/* Günlük Hedef Özeti */}
          <div className="infographic-goal-pill" onClick={() => onNavigate('goals')} title="Günlük hedeflere git">
            <div className="goal-pill-icon">
              <Clock size={16} color="#2563eb" />
            </div>
            <div className="goal-pill-text">
              <span className="goal-pill-title">Bugün: {todayMinutes} / {goalMinutes} dk</span>
              <div className="goal-mini-bar">
                <div className="goal-mini-fill" style={{ width: `${goalPercent}%` }} />
              </div>
            </div>
            <span className="goal-pill-percent">%{goalPercent}</span>
          </div>

          {/* Seviye Belirleme Sınavı Butonu */}
          <button
            type="button"
            className="infographic-voice-btn"
            style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
            onClick={() => {
              setDiagnosticScore(null);
              setDiagStep(0);
              setSelectedAnswers([]);
              setShowDiagnostic(true);
            }}
            title="9. Sınıf Başlangıç Seviye Belirleme Sınavını Başlat"
          >
            <Sparkles size={16} color="#2563eb" />
            <span>Seviye Belirleme</span>
          </button>

          {/* Hızlı Genç Erkek Ses Testi */}
          <button
            type="button"
            className="infographic-voice-btn"
            onClick={handleQuickVoiceTest}
            title="Genç erkek anlatıcı sesini test et"
          >
            <Volume2 size={16} />
            <span>{isSpeakingSample ? 'Sesi Durdur' : `Sesli Anlatım (${activeVoicePreset.name})`}</span>
          </button>

          {/* Rehber Butonu */}
          {onOpenTutorial && (
            <button
              type="button"
              className="infographic-tutorial-btn"
              onClick={onOpenTutorial}
              title="Kullanım Rehberi"
            >
              <Sparkles size={16} />
              <span>Rehber</span>
            </button>
          )}
        </div>
      </section>

      {/* SEKMELER (Görünüm Seçici): 9 Temel MEB Dersi | 9 Çalışma Alanı */}
      <div className="infographic-nav-strip">
        <div className="infographic-toggle-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'subjects'}
            className={`infographic-toggle-btn ${activeTab === 'subjects' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            <BookOpen size={17} />
            <span>9 Temel MEB Dersi</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'modules'}
            className={`infographic-toggle-btn ${activeTab === 'modules' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            <Sparkles size={17} />
            <span>9 Akıllı Çalışma Alanı</span>
          </button>
        </div>

        <div className="infographic-stats-pill">
          <span>Toplam Çalışma: <strong>{totalMinutes} dk</strong></span>
          <span className="dot-divider">•</span>
          <span>Çözülen Soru: <strong>{attempts?.n || 0} (%{successRate})</strong></span>
        </div>
      </div>

      {/* 3x3 İNFOGRAFİK KART IZGARASI (TAM REFERANS GÖRSELİNDEKİ TASARIM) */}
      <main className="infographic-grid-3x3" role="list">
        {currentCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.number}
              role="listitem"
              tabIndex={0}
              className="infographic-card"
              onClick={() => onNavigate(card.screen, card.subjectId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(card.screen, card.subjectId);
                }
              }}
              title={`${card.title} - Tıkla ve Başla`}
            >
              {/* Sol ve Orta İçerik Alanı */}
              <div className="infographic-card-body">
                {/* İnce daire çerçeveli minimalist çizgi simge (Referanstaki yuvarlak ikon tarzı) */}
                <div className="infographic-icon-circle">
                  <Icon size={18} />
                </div>

                {/* Büyük Kalın Başlık (Referanstaki LOREM IPSUM stili) */}
                <h2 className="infographic-card-title">{card.title}</h2>

                {/* 3-4 satırlık açıklama metni */}
                <p className="infographic-card-desc">{card.desc}</p>

                {/* Alt köşe hızlı aksiyon etiketi */}
                {card.badgeText && (
                  <div className="infographic-card-tag">
                    <span>{card.badgeText}</span>
                    <ChevronRight size={13} className="tag-arrow" />
                  </div>
                )}
              </div>

              {/* Sağ Kenar Renkli Şerit ve Numara (1-9) (Referanstaki dikey renkli şerit tarzı) */}
              <div className={`infographic-card-strip ${card.colorClass}`} aria-hidden="true">
                <span className="infographic-card-number">{card.number}</span>
              </div>
            </article>
          );
        })}
      </main>

      {/* Seviye Belirleme Sınavı Modalı */}
      {showDiagnostic && (
        <div className="modal-overlay" onClick={() => setShowDiagnostic(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#2563eb" /> Lise 1 Başlangıç Seviye Belirleme Sınavı
              </h3>
              <button
                onClick={() => setShowDiagnostic(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ×
              </button>
            </div>

            {diagEval ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', padding: '16px 0' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>
                  Öğrenme Seviyen: {diagEval.level}
                </h4>
                <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {diagEval.recommendation}
                </p>
                <div style={{ marginTop: '16px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowDiagnostic(false);
                      setDiagnosticScore(null);
                      setDiagStep(0);
                      setSelectedAnswers([]);
                      onNavigate('subject_workshop', 'subj_math');
                    }}
                  >
                    Önerilen Derse Başla
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Soru {diagStep + 1} / {diagnosticQuestions.length}
                </div>
                <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '16px', lineHeight: 1.6 }}>
                  {diagnosticQuestions[diagStep].q}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {diagnosticQuestions[diagStep].options.map((opt, i) => (
                    <button
                      key={i}
                      className="btn btn-secondary"
                      style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '12px 14px', fontSize: '0.98rem' }}
                      onClick={() => handleDiagnosticAnswer(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
