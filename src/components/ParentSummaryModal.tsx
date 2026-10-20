import React, { useState, useEffect } from 'react';
import { X, Users, Award, BookCheck } from 'lucide-react';
import { getDb } from '../db/database';
import { MasteryEngine } from '../services/masteryEngine';

interface ParentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParentSummaryModal: React.FC<ParentSummaryModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState({
    studentName: 'Öğrenci',
    totalMinutes: 0,
    weeklyTargetMinutes: 225,
    completedTopicsCount: 0,
    learningTopicsCount: 0,
    totalTopicsCount: 0,
    totalAttempts: 0,
    accuracyRate: 0,
    recentStudyDate: ''
  });

  useEffect(() => {
    if (!isOpen) return;
    const db = getDb();
    const profile = db.queryOne<{ name: string; weekly_goal_minutes: number }>('SELECT name, weekly_goal_minutes FROM student_profile LIMIT 1');
    const masteries = MasteryEngine.getAllMasteries();
    const completed = masteries.filter(m => m.status === 'Pekişiyor').length;
    const learning = masteries.filter(m => m.status === 'Öğreniliyor').length;

    const sessionRow = db.queryOne<{ total_sec: number }>('SELECT COALESCE(SUM(duration_seconds), 0) as total_sec FROM study_sessions');
    const realMinutes = Math.floor((sessionRow?.total_sec || 0) / 60);

    const attempts = db.queryOne<{ total: number; correct: number }>(`
      SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END), 0) as correct
      FROM answer_attempts
    `);

    const totalAtt = attempts?.total || 0;
    const accuracy = totalAtt > 0 ? Math.round((attempts!.correct / totalAtt) * 100) : 0;

    setData({
      studentName: profile?.name || 'Öğrenci',
      totalMinutes: realMinutes,
      weeklyTargetMinutes: profile?.weekly_goal_minutes || 225,
      completedTopicsCount: completed,
      learningTopicsCount: learning,
      totalTopicsCount: masteries.length,
      totalAttempts: totalAtt,
      accuracyRate: accuracy,
      recentStudyDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#2563eb" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Haftalık Veli Bilgilendirme Özeti</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          <strong>{data.studentName}</strong> adlı öğrencinin MEB Lise 1 müfredatında gerçekleştirdiği gerçek çalışma ve soru çözümü kayıtları ({data.recentStudyDate}).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Kayıtlı Çalışma Süresi</span>
              <strong style={{ color: '#2563eb' }}>
                {data.totalMinutes} / {data.weeklyTargetMinutes} dk
              </strong>
            </div>
            <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (data.totalMinutes / Math.max(1, data.weeklyTargetMinutes)) * 100)}%`,
                  height: '100%',
                  background: '#2563eb'
                }}
              />
            </div>
          </div>

          <div className="grid-2">
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <BookCheck size={16} color="#059669" /> Pekiştirilen Kazanım
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
                {data.completedTopicsCount} / {data.totalTopicsCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669' }}>
                {data.learningTopicsCount} konu aktif öğreniliyor
              </span>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <Award size={16} color="#d97706" /> Soru Başarı Ortalaması
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
                %{data.accuracyRate}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669' }}>
                Toplam {data.totalAttempts} soru denemesi
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--accent-light)',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: 'var(--accent)'
            }}
          >
            <strong>Eğitmen Değerlendirmesi:</strong>{' '}
            {data.totalAttempts === 0
              ? 'Henüz soru denemesi kaydedilmedi. Öğrenci Dersler veya Soru Bankası ekranından çalışmaya başladığında veriler burada gerçek zamanlı güncellenir.'
              : data.accuracyRate >= 70
              ? `Öğrenci ${data.totalAttempts} soruda %${data.accuracyRate} doğruluk oranıyla güçlü bir kavrayış sergiliyor.`
              : `Öğrenci ${data.totalAttempts} soru çözdü (%${data.accuracyRate} başarı). Yanlışlar Defteri üzerinden yapılan hataların tekrar edilmesi önerilir.`}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
