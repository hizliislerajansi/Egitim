import React, { useState, useEffect } from 'react';
import { 
  X, 
  Timer, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Award, 
  RotateCcw,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import { MEB_QUESTIONS, MEB_SUBJECTS, MEB_TOPICS } from '../data/mebCurriculum';
import { Question } from '../types/database';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';
import { MasteryEngine } from '../services/masteryEngine';
import { getDb } from '../db/database';

interface ExamModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubjectId?: string;
}

export const ExamModeModal: React.FC<ExamModeModalProps> = ({
  isOpen,
  onClose,
  selectedSubjectId = 'all'
}) => {
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(600); // 10 dakika
  const [isExamActive, setIsExamActive] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [scoreReport, setScoreReport] = useState<{
    total: number;
    correct: number;
    incorrect: number;
    empty: number;
    percentage: number;
    durationSeconds: number;
    outcomeBreakdown: Record<string, { topicName: string; correct: number; total: number }>;
  } | null>(null);

  // Sınavı Başlat
  const handleStartExam = () => {
    let pool = MEB_QUESTIONS;
    if (selectedSubjectId !== 'all') {
      const topicIds = MEB_TOPICS.filter(t => t.subject_id === selectedSubjectId).map(t => t.id);
      pool = MEB_QUESTIONS.filter(q => topicIds.includes(q.topic_id));
    }
    // Karışık 10 soru seç
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    setExamQuestions(shuffled);
    setCurrentIndex(0);
    setUserAnswers({});
    setTimeRemainingSeconds(shuffled.length * 60); // Soru başı 1 dakika
    setIsExamActive(true);
    setIsExamCompleted(false);
    setScoreReport(null);
  };

  // Zamanlayıcı
  useEffect(() => {
    if (!isExamActive || isExamCompleted) return;

    if (timeRemainingSeconds <= 0) {
      handleFinishExam();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemainingSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamActive, isExamCompleted, timeRemainingSeconds]);

  // Sınavı Tamamla ve Sonuç Raporu Üret
  const handleFinishExam = () => {
    setIsExamActive(false);
    setIsExamCompleted(true);

    let correct = 0;
    let incorrect = 0;
    let empty = 0;
    const outcomeBreakdown: Record<string, { topicName: string; correct: number; total: number }> = {};
    const sessionId = OfflineQuestionEngine.startSession(selectedSubjectId === 'all' ? 'subj_math' : selectedSubjectId, 'offline_practice');

    examQuestions.forEach(q => {
      const topic = MEB_TOPICS.find(t => t.id === q.topic_id);
      const topicName = topic?.name || 'Genel Konu';

      if (!outcomeBreakdown[q.topic_id]) {
        outcomeBreakdown[q.topic_id] = { topicName, correct: 0, total: 0 };
      }
      outcomeBreakdown[q.topic_id].total += 1;

      const ans = userAnswers[q.id];
      if (!ans) {
        empty += 1;
      } else {
        const isCorr = ans.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
        if (isCorr) {
          correct += 1;
          outcomeBreakdown[q.topic_id].correct += 1;
        } else {
          incorrect += 1;
        }

        // Veritabanına ve Ustalık Motoruna Gerçek Kayıt (Exam modunda ipucu 0)
        OfflineQuestionEngine.submitAnswer({
          sessionId,
          questionId: q.id,
          studentAnswer: ans,
          hintsUsed: 0,
          timeSpentSeconds: 60
        });
      }
    });

    const total = examQuestions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const durationSeconds = (total * 60) - Math.max(0, timeRemainingSeconds);

    setScoreReport({
      total,
      correct,
      incorrect,
      empty,
      percentage,
      durationSeconds,
      outcomeBreakdown
    });
  };

  if (!isOpen) return null;

  const currentQ = examQuestions[currentIndex];
  let options: string[] = [];
  if (currentQ?.options_json) {
    try {
      options = JSON.parse(currentQ.options_json);
    } catch {
      options = [];
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '780px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Başlığı */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Timer size={18} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Resmî MEB Sınav Modu (Süreli & İpucusuz)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Öğrenme Modundan Farklı: İpucu kapalı, süre akışkan, sonuç karnesi ve yanlışlar defteri entegreli</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* 1. BAŞLANGIÇ EKRANI */}
        {!isExamActive && !isExamCompleted && (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>📝</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              Hazır mısın? Gerçek Sınav Ortamı Simülasyonu
            </h4>
            <p style={{ maxWidth: '520px', margin: '0 auto 20px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Bu modda <strong>ipucu verilmez</strong>, ders rehberi ipucu desteği devre dışıdır. 
              Sınav süreniz başlar, sınav sonunda detaylı MEB kazanım karneniz çıkarılır ve hatalarınız otomatik olarak 
              <strong> Kişisel Yanlışlar Defteri</strong>'ne aktarılır.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px', fontSize: '0.85rem' }}>
              <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                ⏱️ <strong>Süre:</strong> 10 Dakika
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                ❓ <strong>Soru Sayısı:</strong> 10 Soru
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                🚫 <strong>İpucu:</strong> Tamamen Kapalı
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ fontSize: '1rem', padding: '10px 28px', backgroundColor: '#dc2626', borderColor: '#b91c1c' }}
              onClick={handleStartExam}
            >
              Sınavı Başlat 🚀
            </button>
          </div>
        )}

        {/* 2. AKTİF SINAV ÇÖZME EKRANI */}
        {isExamActive && currentQ && (
          <div>
            {/* Üst Bilgi Barı: Kalan Süre + Soru Sayacı */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: timeRemainingSeconds < 60 ? '#fee2e2' : 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: timeRemainingSeconds < 60 ? '#dc2626' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                <Timer size={18} />
                <span>Kalan Süre: {formatTime(timeRemainingSeconds)}</span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Soru {currentIndex + 1} / {examQuestions.length}
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.78rem', padding: '4px 10px', color: '#dc2626' }}
                onClick={() => {
                  if (confirm('Sınavı şimdi bitirmek istediğinize emin misiniz?')) {
                    handleFinishExam();
                  }
                }}
              >
                Sınavı Bitir
              </button>
            </div>

            {/* Soru Metni */}
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, marginBottom: '6px' }}>
                {MEB_TOPICS.find(t => t.id === currentQ.topic_id)?.name}
              </div>
              <p style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                {currentQ.question_text}
              </p>
            </div>

            {/* Şıklar (Çoktan Seçmeli) VEYA Açık Uçlu Cevap Girişi */}
            {options.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {options.map((opt, i) => {
                  const isSelected = userAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => setUserAnswers(prev => ({ ...prev, [currentQ.id]: opt }))}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? '#eff6ff' : 'var(--bg-secondary)',
                        color: isSelected ? '#1d4ed8' : 'var(--text-primary)',
                        textAlign: 'left',
                        fontSize: '0.92rem',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ marginRight: '8px', fontWeight: 700 }}>
                        {String.fromCharCode(65 + i)})
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Açık Uçlu Cevabınızı Yazınız:
                </label>
                <input
                  type="text"
                  className="chat-input"
                  style={{ width: '100%', padding: '12px 14px', fontSize: '0.95rem' }}
                  placeholder="Cevabınızı buraya yazın (Örn: x = 2 veya kısa tanım)..."
                  value={userAnswers[currentQ.id] || ''}
                  onChange={e => setUserAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                />
              </div>
            )}

            {/* Navigasyon Butonları */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="btn btn-secondary" 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
              >
                <ArrowLeft size={16} /> Önceki Soru
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {examQuestions.map((q, idx) => (
                  <div 
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: currentIndex === idx ? '#2563eb' : userAnswers[q.id] ? '#dcfce7' : 'var(--bg-secondary)',
                      color: currentIndex === idx ? '#fff' : userAnswers[q.id] ? '#166534' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              {currentIndex < examQuestions.length - 1 ? (
                <button 
                  className="btn btn-primary" 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                >
                  Sonraki Soru <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  style={{ backgroundColor: '#059669', borderColor: '#047857' }}
                  onClick={handleFinishExam}
                >
                  Sınavı Tamamla ve Sonuçları Gör ✅
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. SONUÇ VE KAZANIM KARNESİ */}
        {isExamCompleted && scoreReport && (
          <div>
            <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                {scoreReport.percentage >= 70 ? '🏆' : '📈'}
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800 }}>
                Sınav Tamamlandı! Başarı Oranın: %{scoreReport.percentage}
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Çözüm Süresi: {Math.floor(scoreReport.durationSeconds / 60)} dk {scoreReport.durationSeconds % 60} sn
              </p>
            </div>

            {/* Puan İstatistik Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '18px 0' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                <CheckCircle size={20} color="#059669" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46' }}>{scoreReport.correct}</div>
                <div style={{ fontSize: '0.78rem', color: '#047857' }}>Doğru Sayısı</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                <XCircle size={20} color="#dc2626" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>{scoreReport.incorrect}</div>
                <div style={{ fontSize: '0.78rem', color: '#b91c1c' }}>Yanlış Sayısı</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <HelpCircle size={20} color="#64748b" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155' }}>{scoreReport.empty}</div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>Boş Soru</div>
              </div>
            </div>

            {/* MEB Kazanım Bazlı Performans Karnesi */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} color="#2563eb" /> MEB Kazanım ve Konu Karnesi:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(scoreReport.outcomeBreakdown).map(([tId, stat]) => {
                  const perc = Math.round((stat.correct / stat.total) * 100);
                  return (
                    <div key={tId} style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{stat.topicName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {stat.correct} / {stat.total} Doğru
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${perc}%`, height: '100%', backgroundColor: perc >= 70 ? '#059669' : '#eab308' }} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>%{perc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e3a8a', marginBottom: '20px' }}>
              💡 <strong>Otomatik Takip:</strong> Bu sınavdaki yanlışlarınız <strong>Kişisel Yanlışlar Defteri</strong>'ne aktarıldı ve aralıklı tekrar algoritmasına dahil edildi.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={handleStartExam}>
                <RotateCcw size={15} /> Yeni Sınav Başlat
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Tamamla ve Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
