import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Play, 
  Star, 
  CheckCircle, 
  HelpCircle,
  BookOpen,
  Timer
} from 'lucide-react';
import { MEB_QUESTIONS, MEB_SUBJECTS, MEB_TOPICS } from '../data/mebCurriculum';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';
import { getDb } from '../db/database';
import { Question } from '../types/database';
import { ScreenId } from './Sidebar';
import { ExamModeModal } from './ExamModeModal';

interface QuestionBankScreenProps {
  initialSearch?: string;
  onNavigate: (screen: ScreenId) => void;
}

export const QuestionBankScreen: React.FC<QuestionBankScreenProps> = ({ onNavigate, initialSearch = '' }) => {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [activeTab, setActiveTab] = useState<'all' | 'solved' | 'favorites'>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => { try { return JSON.parse(getDb().queryOne<{value: string}>("SELECT value FROM app_settings WHERE key = 'bookmarked_questions'")?.value || '[]'); } catch { return []; } });
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = bookmarkedIds.includes(id) ? bookmarkedIds.filter(x => x !== id) : [...bookmarkedIds, id];
    setBookmarkedIds(next);
    getDb().execute('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)', ['bookmarked_questions', JSON.stringify(next), new Date().toISOString()]);
  };

  const solvedIds = new Set(getDb().query<{question_id: string}>('SELECT DISTINCT question_id FROM answer_attempts').map(r => r.question_id));
  const filteredQuestions = MEB_QUESTIONS.filter(q => {
    const topic = MEB_TOPICS.find(t => t.id === q.topic_id);
    if (selectedTopic !== 'all' && q.topic_id !== selectedTopic) return false;
    if (selectedSubject !== 'all' && topic?.subject_id !== selectedSubject) return false;
    if (selectedDifficulty !== 'all') {
      const diffNum = selectedDifficulty === 'easy' ? 1 : selectedDifficulty === 'medium' ? 2 : 3;
      if (q.difficulty !== diffNum) return false;
    }
    if (searchQuery.trim() !== '') {
      const matchText = [q.question_text, topic?.name, topic?.learning_outcome, MEB_SUBJECTS.find(s => s.id === topic?.subject_id)?.name].join(' ').toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'));
      if (!matchText) return false;
    }
    if (activeTab === 'solved' && !solvedIds.has(q.id)) return false;
    if (activeTab === 'favorites') {
      return bookmarkedIds.includes(q.id);
    }
    return true;
  });

  const getDifficultyLabel = (diff: number) => {
    if (diff === 1) return { label: 'Kolay', color: '#10b981', bg: '#ecfdf5' };
    if (diff === 2) return { label: 'Orta', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'Zor', color: '#ef4444', bg: '#fef2f2' };
  };

  const getSubjectAndOutcome = (topicId: string) => {
    const t = MEB_TOPICS.find(x => x.id === topicId);
    const s = t ? MEB_SUBJECTS.find(x => x.id === t.subject_id) : null;
    return {
      subjectName: s?.name || 'Ders',
      outcome: t?.learning_outcome || 'MEB Kazanımı',
      topicName: t?.name || 'Konu'
    };
  };

  return (
    <div className="dp-question-bank-page">
      {/* Arama ve Filtre Çubuğu */}
      <div className="dp-card dp-filter-card">
        <div className="dp-search-input-wrap">
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Soru ara, konu veya kazanım..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="dp-filter-selects">
          <div className="dp-select-group">
            <label>Ders</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="all">Tüm Dersler ({MEB_SUBJECTS.length} Ders)</option>
              {MEB_SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="dp-select-group">
            <label>Konu</label>
            <select aria-label="Konu" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
              <option value="all">Tümü</option>
              {MEB_TOPICS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="dp-select-group">
            <label>Zorluk</label>
            <select value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)}>
              <option value="all">Tümü</option>
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sekmeler (Tüm Sorular, Çözülenler, Favorilerim) + Sınav Modu Başlat Butonu */}
      <div className="dp-qb-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`dp-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tüm Sorular ({MEB_QUESTIONS.length})
          </button>
          <button 
            className={`dp-tab-btn ${activeTab === 'solved' ? 'active' : ''}`}
            onClick={() => setActiveTab('solved')}
          >
            Çözülenler ({solvedIds.size})
          </button>
          <button 
            className={`dp-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorilerim ({bookmarkedIds.length})
          </button>
        </div>

        <button 
          className="btn btn-primary"
          style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', padding: '7px 14px' }}
          onClick={() => setIsExamModalOpen(true)}
          title="Süreli, ipucusuz gerçek MEB sınav simülasyonu başlat"
        >
          <Timer size={16} /> Resmî Sınav Modunu Başlat
        </button>
      </div>

      {/* Soru Listesi Kartları */}
      <div className="dp-qb-list">
        {filteredQuestions.map((q, idx) => {
          const diff = getDifficultyLabel(q.difficulty);
          const meta = getSubjectAndOutcome(q.topic_id);
          const isStarred = bookmarkedIds.includes(q.id);

          return (
            <div key={q.id} className="dp-qb-row-item" onClick={() => { setActiveQuestion(q); setAnswer(''); setFeedback(''); }}>
              <div className="dp-qb-icon-col">
                <div className="dp-qb-icon-bullet">
                  <HelpCircle size={18} color="#2563eb" />
                </div>
              </div>

              <div className="dp-qb-content-col">
                <h4 className="dp-qb-question-title">{q.question_text}</h4>
                <div className="dp-qb-tags">
                  <span className="dp-tag-subject">{meta.subjectName}</span>
                  <span className="dp-tag-dot">•</span>
                  <span className="dp-tag-unit">{meta.outcome}</span>
                  <span className="dp-tag-dot">•</span>
                  <span className="dp-tag-difficulty" style={{ color: diff.color, backgroundColor: diff.bg }}>
                    {diff.label}
                  </span>
                </div>
              </div>

              <div className="dp-qb-actions-col">
                <button 
                  className="dp-btn-solve" 
                  onClick={(e) => { e.stopPropagation(); setActiveQuestion(q); setAnswer(''); setFeedback(''); }}
                >
                  <Play size={13} fill="currentColor" /> Çöz
                </button>
                <button 
                  className={`dp-btn-star ${isStarred ? 'starred' : ''}`}
                  onClick={(e) => toggleBookmark(q.id, e)}
                  title="Favorilere Ekle"
                >
                  <Star size={18} fill={isStarred ? '#f59e0b' : 'none'} color={isStarred ? '#f59e0b' : '#94a3b8'} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!filteredQuestions.length && <p role="status">Bu filtrelerle eşleşen soru yok. Aramanızı veya filtreleri değiştirin.</p>}
      <p>{filteredQuestions.length} soru gösteriliyor.</p>
      {activeQuestion && <div className="modal-overlay"><section className="modal-content" role="dialog" aria-modal="true" aria-label="Soru çözümü">
        <button className="btn btn-secondary" onClick={() => setActiveQuestion(null)}>Kapat</button>
        <h2>{activeQuestion.question_text}</h2>
        <form onSubmit={e => {
          e.preventDefault();
          if (!answer.trim() || feedback) return;
          const topic = MEB_TOPICS.find(t => t.id === activeQuestion.topic_id);
          if (!topic) return;
          const sessionId = OfflineQuestionEngine.startSession(topic.subject_id, 'offline_practice');
          const result = OfflineQuestionEngine.submitAnswer({sessionId, questionId: activeQuestion.id, studentAnswer: answer, hintsUsed: 0, timeSpentSeconds: 0});
          OfflineQuestionEngine.endSession(sessionId, 0);
          setFeedback((result.isCorrect ? 'Doğru cevap. ' : 'Yanlış cevap. ') + (activeQuestion.explanation || ''));
        }}>
          <label htmlFor="question-answer">Cevabın</label><input id="question-answer" className="chat-input" value={answer} onChange={e => setAnswer(e.target.value)} disabled={!!feedback} required />
          <button className="btn btn-primary" disabled={!!feedback || !answer.trim()}>Cevabı kontrol et</button>
        </form>
        {feedback && <p role="status">{feedback}</p>}
      </section></div>}

      <ExamModeModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        selectedSubjectId={selectedSubject}
      />
    </div>
  );
};
