import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { getDb } from '../db/database';
import { MasteryEngine } from '../services/masteryEngine';
import { ReviewScheduleItem, AnswerAttempt } from '../types/database';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';

export const LearningHubScreen: React.FC = () => {
  const [masteries, setMasteries] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [selectedMistake, setSelectedMistake] = useState<any | null>(null);
  const [retryAnswer, setRetryAnswer] = useState('');
  const [retryResult, setRetryResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'pending'>('all');

  const loadData = () => {
    const db = getDb();
    setMasteries(MasteryEngine.getAllMasteries());

    const reviewItems = db.query<ReviewScheduleItem & { topic_name: string; unit: string }>(`
      SELECT r.*, t.name as topic_name, t.unit
      FROM review_schedule r
      JOIN topics t ON r.topic_id = t.id
      ORDER BY r.scheduled_date ASC
    `);
    setReviews(reviewItems);

    const mistakeItems = db.query<AnswerAttempt & { question_text: string; correct_answer: string; topic_id: string }>(`
      SELECT a.*, q.question_text, q.correct_answer, q.topic_id
      FROM answer_attempts a
      JOIN questions q ON a.question_id = q.id
      WHERE a.is_correct = 0
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    setMistakes(mistakeItems);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteReview = (reviewId: string) => {
    const db = getDb();
    db.execute("UPDATE review_schedule SET status = 'completed' WHERE id = ?", [reviewId]);
    loadData();
  };

  const handleRetrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMistake || !retryAnswer.trim()) return;

    const sessionId = OfflineQuestionEngine.startSession('subj_math', 'review');
    const res = OfflineQuestionEngine.submitAnswer({
      sessionId,
      questionId: selectedMistake.question_id,
      studentAnswer: retryAnswer.trim(),
      hintsUsed: 1,
      timeSpentSeconds: 20
    });

    setRetryResult(res);
    if (res.isCorrect) {
      setTimeout(() => {
        setSelectedMistake(null);
        setRetryAnswer('');
        setRetryResult(null);
        loadData();
      }, 1500);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filterPriority === 'high') return r.priority === 'high' && r.status === 'pending';
    if (filterPriority === 'pending') return r.status === 'pending';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Konu Başarı Tablosu */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Layers size={18} color="#2563eb" /> MEB Lise 1 Konu Ustalık Durumu
          </span>
          <span className="badge badge-yeni">{masteries.length} Konu Kayıtlı</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {masteries.map(m => {
            let badgeClass = 'badge-yeni';
            if (m.status === 'Öğreniliyor') badgeClass = 'badge-ogreniliyor';
            if (m.status === 'Pekişiyor') badgeClass = 'badge-pekisiyor';
            if (m.status === 'Hatırlatma Gerekli') badgeClass = 'badge-hatirlatma';

            return (
              <div 
                key={m.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.unit}</span>
                    <span className={`badge ${badgeClass}`}>{m.status}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', marginTop: '4px' }}>{m.topic_name}</div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span>Kavrama Puanı</span>
                    <strong>%{m.mastery_score}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${m.mastery_score}%`, height: '100%', background: m.mastery_score >= 70 ? '#10b981' : '#2563eb' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        {/* Yanlışlar Defteri */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <AlertTriangle size={18} color="#dc2626" /> Yanlışlar Defteri & Yeniden Çözüm
            </span>
            <span className="badge badge-hatirlatma">{mistakes.length} Hata Kayıtlı</span>
          </div>

          {mistakes.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Harika! Şu anda kaydedilmiş bir hata bulunmuyor.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mistakes.map(att => (
                <div 
                  key={att.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    borderLeft: '4px solid #dc2626',
                    fontSize: '0.88rem'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>{att.question_text}</div>
                  <div style={{ color: '#dc2626', fontSize: '0.82rem' }}>Önceki cevabın: {att.student_answer}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="badge badge-ogreniliyor" style={{ fontSize: '0.72rem' }}>
                      {att.error_category || 'Dikkatsizlik'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        onClick={() => { 
                          setSelectedMistake(att); 
                          setRetryAnswer(''); 
                          setRetryResult(null); 
                        }}
                      >
                        <RotateCcw size={12} /> Tekrar Çöz
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                        onClick={() => {
                          // Benzer paralel soru varyantı türetme
                          const variantText = `[BENZER VARYANT] ${att.question_text.replace(/\d+/g, (m: string) => String(parseInt(m, 10) * 2))}`;
                          setSelectedMistake({
                            ...att,
                            question_text: variantText,
                            isVariant: true
                          });
                          setRetryAnswer('');
                          setRetryResult(null);
                        }}
                      >
                        <Sparkles size={12} /> Benzer Soru Üret
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hata Yeniden Çözme Alanı */}
          {selectedMistake && (
            <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', color: '#1d4ed8' }}>
                {selectedMistake.isVariant ? '✨ Benzer Paralel Soru Çözüyorsun:' : 'Soruyu Tekrar Çözüyorsun:'}
              </div>
              <div style={{ fontSize: '0.88rem', marginBottom: '10px' }}>{selectedMistake.question_text}</div>

              <form onSubmit={handleRetrySubmit} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="chat-input"
                  placeholder="Doğru cevabı girin..."
                  value={retryAnswer}
                  onChange={e => setRetryAnswer(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 14px' }}>
                  Kontrol Et
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedMistake(null)}>
                  İptal
                </button>
              </form>

              {retryResult && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: retryResult.isCorrect ? '#059669' : '#dc2626' }}>
                  {retryResult.isCorrect ? <Check size={16} /> : <X size={16} />}
                  <strong>{retryResult.feedback}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kişisel Aralıklı Tekrar Planı */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Calendar size={18} color="#059669" /> Aralıklı Tekrar Takvimi
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className={`btn ${filterPriority === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                onClick={() => setFilterPriority('all')}
              >
                Tümü
              </button>
              <button 
                className={`btn ${filterPriority === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                onClick={() => setFilterPriority('pending')}
              >
                Bekleyenler
              </button>
              <button 
                className={`btn ${filterPriority === 'high' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                onClick={() => setFilterPriority('high')}
              >
                Yüksek Öncelik
              </button>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Seçilen filtrede tekrar maddesi bulunmuyor.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredReviews.map(rev => {
                const isPending = rev.status === 'pending';
                return (
                  <div 
                    key={rev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      opacity: isPending ? 1 : 0.6
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{rev.topic_name}</span>
                        {rev.priority === 'high' && (
                          <span className="badge badge-hatirlatma" style={{ fontSize: '0.65rem' }}>Öncelikli</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Planlanan Tarih: {rev.scheduled_date} • {rev.reason || 'Pekiştirme'}
                      </div>
                    </div>

                    {isPending ? (
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                        onClick={() => handleCompleteReview(rev.id)}
                      >
                        <CheckCircle2 size={14} color="#059669" /> Tamamla
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Tamamlandı</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
