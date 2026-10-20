import React, { useState } from 'react';
import { Target, CheckCircle2, Clock, Plus, Flame, Trash2 } from 'lucide-react';
import { readSetting, writeSetting } from '../services/apiClient';

interface GoalItem {
  id: number;
  title: string;
  desc: string;
  progress: number;
  total: number;
  completed: number;
  deadline: string;
  isDone: boolean;
}

const DEFAULT_GOALS: GoalItem[] = [];

export const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<GoalItem[]>(() => readSetting<GoalItem[]>('student_goals_v1', DEFAULT_GOALS));
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTotal, setNewTotal] = useState(10);
  const [newDeadline, setNewDeadline] = useState('Bugün');

  const persistGoals = (next: GoalItem[]) => {
    setGoals(next);
    writeSetting('student_goals_v1', next);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const totalCount = Math.max(1, Number(newTotal) || 10);
    const created: GoalItem = {
      id: Date.now(),
      title: newTitle.trim(),
      desc: newDesc.trim() || `${totalCount} adımlık çalışma hedefi`,
      progress: 0,
      total: totalCount,
      completed: 0,
      deadline: newDeadline.trim() || 'Bu Hafta',
      isDone: false
    };
    persistGoals([created, ...goals]);
    setNewTitle('');
    setNewDesc('');
    setNewTotal(10);
    setShowAddForm(false);
  };

  const handleIncrementGoal = (id: number) => {
    const next = goals.map(g => {
      if (g.id !== id) return g;
      const completed = Math.min(g.total, g.completed + 1);
      const progress = Math.round((completed / Math.max(1, g.total)) * 100);
      return { ...g, completed, progress, isDone: completed >= g.total };
    });
    persistGoals(next);
  };

  const handleToggleDone = (id: number) => {
    const next = goals.map(g => {
      if (g.id !== id) return g;
      const nextDone = !g.isDone;
      return {
        ...g,
        isDone: nextDone,
        completed: nextDone ? g.total : 0,
        progress: nextDone ? 100 : 0
      };
    });
    persistGoals(next);
  };

  const handleDeleteGoal = (id: number) => {
    persistGoals(goals.filter(g => g.id !== id));
  };

  const doneCount = goals.filter(g => g.isDone).length;

  return (
    <div className="dp-goals-page">
      {/* Üst İlerleme ve Seri Özeti */}
      <div className="dp-hero-row">
        <div className="dp-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="dp-stat-icon-wrapper purple" style={{ width: '56px', height: '56px' }}>
            <Target size={28} color="#7c3aed" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Haftalık Hedef Durumu</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
              Belirlediğin {goals.length} ana hedefin {doneCount} tanesini başarıyla tamamladın!
            </p>
          </div>
        </div>

        <div className="dp-card" style={{ width: '280px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="dp-stat-icon-wrapper red" style={{ width: '50px', height: '50px' }}>
            <Flame size={26} color="#ea580c" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tamamlanma Oranı</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
              %{goals.length ? Math.round((doneCount * 100) / goals.length) : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Hedef Listesi */}
      <div className="dp-card mt-16">
        <div className="dp-card-head">
          <h3 className="dp-card-title">Aktif Hedeflerim</h3>
          <button
            type="button"
            className="dp-btn-primary"
            onClick={() => setShowAddForm(prev => !prev)}
          >
            <Plus size={16} /> {showAddForm ? 'Formu Kapat' : 'Yeni Hedef Belirle'}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddGoal}
            style={{
              padding: '14px',
              marginBottom: '16px',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px'
            }}
          >
            <input
              type="text"
              className="chat-input"
              placeholder="Hedef başlığı (Örn: Biyoloji Hücre 15 Soru)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
            <input
              type="text"
              className="chat-input"
              placeholder="Açıklama (Örn: Konu tekrarı + test)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <input
              type="number"
              className="chat-input"
              min="1"
              max="500"
              placeholder="Hedef soru/adım sayısı"
              value={newTotal}
              onChange={e => setNewTotal(parseInt(e.target.value, 10) || 10)}
            />
            <select
              className="chat-input"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
            >
              <option value="Bugün">Bugün</option>
              <option value="Yarın">Yarın</option>
              <option value="Bu Hafta">Bu Hafta</option>
              <option value="Pazar">Pazar</option>
            </select>
            <button type="submit" className="btn btn-primary">
              Hedefi Ekle
            </button>
          </form>
        )}

        <div className="dp-goals-list">
          {goals.map(g => (
            <div key={g.id} className={`dp-goal-row-card ${g.isDone ? 'completed-goal' : ''}`}>
              <div className="dp-goal-icon-col" style={{ cursor: 'pointer' }} onClick={() => handleToggleDone(g.id)}>
                {g.isDone ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : (
                  <div className="dp-goal-circle-icon">
                    <Target size={18} color="#2563eb" />
                  </div>
                )}
              </div>

              <div className="dp-goal-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 className="dp-goal-item-title">{g.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="dp-goal-deadline">
                      <Clock size={13} /> {g.deadline}
                    </span>
                    {!g.isDone && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '0.74rem' }}
                        onClick={() => handleIncrementGoal(g.id)}
                      >
                        +1 İlerlet
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.74rem' }}
                      onClick={() => handleToggleDone(g.id)}
                    >
                      {g.isDone ? 'Geri Al' : 'Tamamla'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '0.74rem', color: '#dc2626' }}
                      onClick={() => handleDeleteGoal(g.id)}
                      title="Hedefi Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="dp-goal-item-desc">{g.desc}</p>

                <div className="dp-goal-progress-row">
                  <div className="dp-goal-progress-bar">
                    <div
                      className="dp-goal-progress-fill"
                      style={{ width: `${g.progress}%`, backgroundColor: g.isDone ? '#10b981' : '#2563eb' }}
                    />
                  </div>
                  <span className="dp-goal-progress-text">
                    %{g.progress} ({g.completed}/{g.total})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
