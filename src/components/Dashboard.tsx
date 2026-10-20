import React, { useState } from 'react';
import {
  Play,
  Clock,
  CheckCircle2,
  Award,
  Flame,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Bot,
  FileText,
  Target,
  BarChart3,
  Sparkles,
  Volume2,
  Cpu
} from 'lucide-react';
import { getDb } from '../db/database';
import { ScreenId } from './Sidebar';
import { TopicMastery } from '../types/database';
import { MasteryEngine } from '../services/masteryEngine';
import { getVoiceService } from '../services/voiceService';
import { readSetting } from '../services/apiClient';
import { VoiceProvider, YOUNG_MALE_VOICE_PRESETS, getDefaultYoungMaleVoice } from '../types/settings';

interface DashboardProps {
  onNavigate: (screen: ScreenId) => void;
  masteries: (TopicMastery & { topic_name: string; unit: string; subject_id: string })[];
  pendingReviewsCount: number;
  onOpenTutorial?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  masteries,
  pendingReviewsCount,
  onOpenTutorial
}) => {
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticScore, setDiagnosticScore] = useState<number | null>(null);
  const [diagStep, setDiagStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isSpeakingSample, setIsSpeakingSample] = useState(false);

  const db = getDb();
  const profile = db.queryOne<{ name: string; daily_goal_minutes: number }>('SELECT * FROM student_profile LIMIT 1');
  const totalMinutes = Math.floor(
    (db.queryOne<{ n: number }>('SELECT SUM(duration_seconds) n FROM study_sessions')?.n || 0) / 60
  );
  const attempts = db.queryOne<{ n: number; correct: number }>(
    'SELECT COUNT(*) n, SUM(is_correct) correct FROM answer_attempts'
  );
  const successRate = attempts?.n ? Math.round(((attempts.correct || 0) * 100) / attempts.n) : 0;
  const today = new Date().toLocaleDateString('en-CA');
  const todayMinutes = Math.floor(
    (db.queryOne<{ n: number }>('SELECT SUM(duration_seconds) n FROM study_sessions WHERE start_time LIKE ?', [
      today + '%'
    ])?.n || 0) / 60
  );
  const goalMinutes = profile?.daily_goal_minutes || 45;
  const goalPercent = Math.min(100, Math.round((todayMinutes * 100) / goalMinutes));
  const reviews = db.query<{ id: string; name: string; scheduled_date: string }>(
    `SELECT r.id, t.name, r.scheduled_date FROM review_schedule r JOIN topics t ON t.id = r.topic_id WHERE r.status = 'pending' ORDER BY r.scheduled_date LIMIT 4`
  );

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
      `Selam ${profile?.name || 'arkadaşım'}! Ben senin çalışma rehberinim. Dikkat dağıtmayan sakin okuma ekranın ve gerçekçi genç erkek sesim hazır. Hemen derse başlayabiliriz.`,
      'tr-TR',
      () => setIsSpeakingSample(false)
    );
  };

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

  return (
    <div className="dp-dashboard-container">
      {/* 1. ÜST BÖLÜM: Dikkat Dağıtmayan Sakin Odak Alanı + Günlük Hedef */}
      <div className="dp-hero-row">
        <div className="dp-greeting-card">
          <div className="dp-greeting-content" style={{ maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 className="dp-greeting-title">Merhaba {profile?.name || 'Öğrenci'}</h1>
                <p className="dp-greeting-desc">
                  Göz yormayan okuma görünümü ve doğal genç erkek sesli anlatım hazır. Bugün hangi konudan devam edelim?
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.9rem', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleQuickVoiceTest}
                >
                  <Volume2 size={16} color="#2563eb" />
                  <span>{isSpeakingSample ? 'Sesi Durdur' : `Genç Erkek Sesini Dinle (${activeVoicePreset.name})`}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.9rem', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => onNavigate('api_hub')}
                >
                  <Cpu size={16} color="#2563eb" />
                  <span>Rehber & Ses API Merkezi</span>
                </button>
                {onOpenTutorial && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={onOpenTutorial}
                  >
                    <Sparkles size={15} color="#2563eb" />
                    <span>Rehber</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sağ: Bugünün Hedefi Kartı */}
        <div className="dp-daily-goal-card">
          <div className="dp-goal-header">
            <div className="dp-goal-label">
              <Target size={18} color="#2563eb" />
              <span>Günlük Çalışma Hedefi</span>
            </div>
            <button className="dp-icon-link" onClick={() => onNavigate('goals')} aria-label="Hedeflere git">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="dp-goal-body">
            <h3 className="dp-goal-subject">
              {todayMinutes} / {goalMinutes} dakika tamamlandı
            </h3>
            <span className="dp-goal-subtext">Odaklanarak kısa oturumlarla ilerle</span>

            <div className="dp-goal-progress-wrap">
              <div className="dp-goal-progress-bar">
                <div className="dp-goal-progress-fill" style={{ width: `${goalPercent}%` }} />
              </div>
              <span className="dp-goal-percent">%{goalPercent}</span>
            </div>

            <button className="dp-btn-primary dp-btn-full" onClick={() => onNavigate('subject_workshop')}>
              <Play size={16} fill="white" /> Derse Başla
            </button>
          </div>
        </div>
      </div>

      {/* 2. SADE VE KOLAY OKUNUR 4'LÜ ÖZET KARTLARI */}
      <div className="dp-stats-grid">
        <div className="dp-stat-card">
          <div className="dp-stat-icon-wrapper purple">
            <Clock size={20} color="#2563eb" />
          </div>
          <div className="dp-stat-content">
            <span className="dp-stat-title">Çalışma Süresi</span>
            <div className="dp-stat-value">{totalMinutes} dk</div>
            <span className="dp-stat-trend positive">Kayıtlı oturumlar</span>
          </div>
        </div>

        <div className="dp-stat-card">
          <div className="dp-stat-icon-wrapper green">
            <CheckCircle2 size={20} color="#059669" />
          </div>
          <div className="dp-stat-content">
            <span className="dp-stat-title">Çözülen Soru</span>
            <div className="dp-stat-value">
              {attempts?.n || 0} soru (%{successRate})
            </div>
            <span className="dp-stat-trend positive">Doğruluk oranı</span>
          </div>
        </div>

        <div className="dp-stat-card">
          <div className="dp-stat-icon-wrapper yellow">
            <Award size={20} color="#0284c7" />
          </div>
          <div className="dp-stat-content">
            <span className="dp-stat-title">Pekişen Konular</span>
            <div className="dp-stat-value">{masteries.filter(m => m.status === 'Pekişiyor').length} konu</div>
            <span className="dp-stat-sub-info">Öğrenme merkezinde</span>
          </div>
        </div>

        <div className="dp-stat-card">
          <div className="dp-stat-icon-wrapper red">
            <Flame size={20} color="#d97706" />
          </div>
          <div className="dp-stat-content">
            <span className="dp-stat-title">Bekleyen Tekrar</span>
            <div className="dp-stat-value">{pendingReviewsCount} konu</div>
            <span className="dp-stat-sub-info">Aralıklı tekrar planı</span>
          </div>
        </div>
      </div>

      {/* 3. İKİLİ ANA BÖLÜM: Yaklaşan Tekrarlar + Temel Çalışma Modülleri */}
      <div className="dp-main-split">
        <div className="dp-card dp-schedule-column">
          <div className="dp-card-head">
            <div className="dp-card-title-group">
              <div className="dp-icon-pill">
                <BookOpen size={18} color="#2563eb" />
              </div>
              <h3 className="dp-card-title">Bugünkü Tekrar ve Çalışma Listesi</h3>
            </div>
            <div className="dp-head-meta">
              <button className="dp-link-btn" onClick={() => onNavigate('schedule')}>
                Ders Programını Aç →
              </button>
            </div>
          </div>

          <div className="dp-schedule-list">
            {reviews.length ? (
              reviews.map(review => (
                <button
                  key={review.id}
                  className="dp-schedule-item"
                  onClick={() => onNavigate('learning_hub')}
                >
                  <BookOpen size={20} color="#2563eb" />
                  <div className="dp-item-info" style={{ flex: 1, textAlign: 'left' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{review.name}</h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Planlanan tarih: {review.scheduled_date}</p>
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2563eb' }}>Tekrar Çöz →</span>
                </button>
              ))
            ) : (
              <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Bekleyen tekrar bulunmuyor. Dersler veya soru bankasından yeni bir konu seçerek çalışmaya başlayabilirsin.
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate('tutor')}
              >
                <Bot size={16} /> Genç Erkek Sesli Rehber Öğretmenle Çalış
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setDiagnosticScore(null);
                  setDiagStep(0);
                  setSelectedAnswers([]);
                  setShowDiagnostic(true);
                }}
              >
                Seviye Belirleme Testini Başlat
              </button>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Sadeleştirilmiş Çalışma Modülleri */}
        <div className="dp-right-column">
          <div className="dp-card dp-quick-access-card">
            <h3 className="dp-card-title" style={{ marginBottom: '14px' }}>Çalışma Alanları</h3>
            <div className="dp-quick-grid">
              <button className="dp-quick-tile" onClick={() => onNavigate('subject_workshop')}>
                <div className="dp-tile-icon blue">
                  <BookOpen size={20} color="#2563eb" />
                </div>
                <span>Ders Atölyesi</span>
              </button>

              <button className="dp-quick-tile" onClick={() => onNavigate('question_bank')}>
                <div className="dp-tile-icon orange">
                  <HelpCircle size={20} color="#d97706" />
                </div>
                <span>Soru Bankası</span>
              </button>

              <button className="dp-quick-tile" onClick={() => onNavigate('tutor')}>
                <div className="dp-tile-icon purple">
                  <Bot size={20} color="#2563eb" />
                </div>
                <span>Rehber Öğretmen</span>
              </button>

              <button className="dp-quick-tile" onClick={() => onNavigate('notes')}>
                <div className="dp-tile-icon teal">
                  <FileText size={20} color="#0d9488" />
                </div>
                <span>Notlarım</span>
              </button>

              <button className="dp-quick-tile" onClick={() => onNavigate('goals')}>
                <div className="dp-tile-icon red">
                  <Target size={20} color="#e11d48" />
                </div>
                <span>Hedeflerim</span>
              </button>

              <button className="dp-quick-tile" onClick={() => onNavigate('progress_report')}>
                <div className="dp-tile-icon indigo">
                  <BarChart3 size={20} color="#4f46e5" />
                </div>
                <span>İlerleme Raporu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seviye Belirleme Modalı */}
      {showDiagnostic && (
        <div className="modal-overlay" onClick={() => setShowDiagnostic(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#2563eb" /> Lise 1 Başlangıç Seviye Belirleme
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
                    }}
                  >
                    Tamam, Derse Başla
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
