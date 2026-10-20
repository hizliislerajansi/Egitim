import {studentText} from '../services/studentExperience';
import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowRight, 
  RotateCcw, 
  Volume2, 
  Mic, 
  MicOff, 
  Sparkles,
  BarChart2,
  Calendar,
  Send,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { getDb } from '../db/database';
import { Question } from '../types/database';
import { MEB_SUBJECTS } from '../data/mebCurriculum';
import { getVoiceService } from '../services/voiceService';
import { AiAdapter, AiResponse } from '../services/aiAdapter';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';

interface ExamQuestionItem {
  question: Question;
  subjectName: string;
  studentAnswer?: string;
  isCorrect?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface SubjectStat {
  name: string;
  code: string;
  total: number;
  successRate: number;
}

export const HomeroomTeacherScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exam' | 'chat'>('overview');
  
  // Karma Sınav State
  const [isExamActive, setIsExamActive] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExamQuestionItem[]>([]);
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const [examInputAnswer, setExamInputAnswer] = useState('');
  const [examReport, setExamReport] = useState<{
    totalQuestions: number;
    correctCount: number;
    breakdown: { subject: string; correct: number; total: number }[];
    evaluationText: string;
  } | null>(null);

  // Sınıf Öğretmeni Sohbet & Sesli Diyalog
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Merhaba sevgili öğrencim! Ben senin 9. Sınıf Öğretmenin ve Akademik Danışmanınım. Tüm 9 dersindeki (Matematik, Türk Dili ve Edebiyatı, Fizik, Kimya, Biyoloji, Tarih, Coğrafya, İngilizce, Din Kültürü) çalışmalarını bütünsel olarak takip ediyorum. İstersen tüm dersleri kapsayan Karma bir Deneme Sınavı yapalım veya genel durumunu birlikte değerlendirelim!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const voiceService = useRef(getVoiceService());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      voiceService.current.stopSpeaking();
      voiceService.current.stopListening();
    };
  }, []);

  // Tüm 9 dersin özet durumunu SQLite'tan çek
  const getAllSubjectStats = (): SubjectStat[] => {
    try {
      const db = getDb();
      return MEB_SUBJECTS.map(sub => {
        const attempts = db.query<{ is_correct: number }>(`
          SELECT a.is_correct FROM answer_attempts a
          JOIN questions q ON a.question_id = q.id
          JOIN topics t ON q.topic_id = t.id
          WHERE t.subject_id = ?
        `, [sub.id]);

        const total = attempts.length;
        const correct = attempts.filter(x => x.is_correct === 1).length;
        const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;

        return {
          name: sub.name,
          code: sub.code,
          total,
          successRate
        };
      });
    } catch {
      return MEB_SUBJECTS.map(sub => ({ name: sub.name, code: sub.code, total: 0, successRate: 0 }));
    }
  };

  const subjectStats = getAllSubjectStats();

  // Karma Deneme Sınavı Başlat (9 MEB Dersinden dengeli karma soru seçimi)
  const handleStartExam = () => {
    const combined: ExamQuestionItem[] = [];

    // Her dersten en az birer soru al
    for (const sub of MEB_SUBJECTS) {
      const qs = OfflineQuestionEngine.getQuestionsBySubject(sub.id);
      if (qs.length > 0) {
        const randQ = qs[Math.floor(Math.random() * qs.length)];
        combined.push({ question: randQ, subjectName: sub.name });
      }
    }

    // Soruları karıştır
    combined.sort(() => Math.random() - 0.5);

    setExamQuestions(combined);
    setCurrentExamIndex(0);
    setExamInputAnswer('');
    setExamReport(null);
    setIsExamActive(true);
    setActiveTab('exam');

    const startMsg = `9 dersin tamamını kapsayan ${combined.length} soruluk Karma Deneme Sınavın başladı. Başarılar dilerim!`;
    voiceService.current.speak(startMsg, 'tr-TR');
  };

  const handleExamSubmitAnswer = () => {
    if (!examInputAnswer.trim()) return;
    const current = examQuestions[currentExamIndex];
    if (!current) return;

    const normStudent = examInputAnswer.trim().toLowerCase();
    const normCorrect = current.question.correct_answer.trim().toLowerCase();
    const isCorrect = normStudent === normCorrect || (current.question.question_type === 'open_math' && normStudent.includes(normCorrect));

    const updated = [...examQuestions];
    updated[currentExamIndex] = {
      ...current,
      studentAnswer: examInputAnswer.trim(),
      isCorrect
    };
    setExamQuestions(updated);
    setExamInputAnswer('');

    if (currentExamIndex < examQuestions.length - 1) {
      setCurrentExamIndex(prev => prev + 1);
    } else {
      finishExam(updated);
    }
  };

  const finishExam = (completedQuestions: ExamQuestionItem[]) => {
    setIsExamActive(false);
    const total = completedQuestions.length;
    const corrects = completedQuestions.filter(q => q.isCorrect).length;

    // Branş bazında karne hesapla
    const breakdownMap: Record<string, { correct: number; total: number }> = {};
    completedQuestions.forEach(q => {
      if (!breakdownMap[q.subjectName]) {
        breakdownMap[q.subjectName] = { correct: 0, total: 0 };
      }
      breakdownMap[q.subjectName].total++;
      if (q.isCorrect) breakdownMap[q.subjectName].correct++;
    });

    const breakdown = Object.entries(breakdownMap).map(([subject, val]) => ({
      subject,
      correct: val.correct,
      total: val.total
    }));

    const generalSuccessRate = total > 0 ? Math.round((corrects / total) * 100) : 0;

    const evaluationText = `Sınıf Öğretmeni 9 Ders Karnesi & Değerlendirmesi:\n` +
      `Toplam ${total} sorudan ${corrects} tanesini doğru yanıtladın (Genel Başarı: %${generalSuccessRate}).\n\n` +
      breakdown.map(b => `• ${b.subject}: ${b.correct}/${b.total} doğru`).join('\n') +
      `\n\n` +
      (generalSuccessRate >= 75
        ? 'Tebrikler! Dersler arasındaki dengen ve akademik temelin çok güçlü. Bu disiplini korumaya devam et.'
        : 'Gayet güzel bir tarama oldu. Eksik kaldığın dersleri ve konuları Ders Koçumuzla birlikte inceleyip haftalık bir çalışma reçetesi hazırlamanı tavsiye ederim.');

    setExamReport({
      totalQuestions: total,
      correctCount: corrects,
      breakdown,
      evaluationText
    });

    voiceService.current.speak(`Sınav tamamlandı. ${total} soruda ${corrects} doğru yaptın. Sonuçlarını karne üzerinde inceleyebilirsin.`, 'tr-TR');
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoadingChat) return;

    const userText = textToSend.trim();
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoadingChat(true);

    try {
      const summaryContext = subjectStats.map(s => `${s.name}: %${s.successRate}`).join(', ');
      const response: AiResponse = await AiAdapter.request({
        role: 'homeroom_teacher',
        taskType: 'chat',
        userMessage: userText,
        contextSummary: `9 Ders Başarı Durumu: ${summaryContext}`
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
          text: `Sevgili öğrencim, bağlantı sırasında küçük bir aksaklık oldu ama ben yanındayım. Derslerine odaklanmaya devam et!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleToggleVoiceInput = () => {
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

  const currentExamQ = examQuestions[currentExamIndex];
  const examOptions: string[] = currentExamQ?.question?.options_json ? JSON.parse(currentExamQ.question.options_json) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                9. SINIF ŞUBE REHBERİ
              </span>
              <span className="badge" style={{ backgroundColor: '#10b981', color: 'white' }}>
                9 MEB Dersi Koordinasyonu
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>
              Sınıf Öğretmeni & Genel Akademik Danışman
            </h2>
            <p style={{ opacity: 0.9, maxWidth: '650px', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Tüm 9 dersini bütünsel olarak özetler, karma tarama sınavları uygular, karneni düzenler ve genel okul başarını takip ederim.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn" 
              style={{ backgroundColor: 'white', color: '#1e3a8a', fontWeight: 700, padding: '10px 18px', borderRadius: '8px' }}
              onClick={handleStartExam}
            >
              <Award size={18} fill="#1e3a8a" />
              <span>9 Ders Karma Deneme Sınavı</span>
            </button>
          </div>
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeTab === 'overview' ? { backgroundColor: 'white', color: '#1e3a8a' } : { color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart2 size={16} /> 9 Ders Genel Tablosu
          </button>
          <button 
            className={`btn ${activeTab === 'exam' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeTab === 'exam' ? { backgroundColor: 'white', color: '#1e3a8a' } : { color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={() => setActiveTab('exam')}
          >
            <Award size={16} /> Karma Deneme Sınavı {isExamActive && `(Soru ${currentExamIndex + 1}/${examQuestions.length})`}
          </button>
          <button 
            className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeTab === 'chat' ? { backgroundColor: 'white', color: '#1e3a8a' } : { color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} /> Sınıf Öğretmeni ile Sesli Görüş
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SEKMESİ: 9 DERS GENEL TABLOSU */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-3">
            {subjectStats.map((sub, i) => (
              <div key={i} className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>
                    {sub.name}
                  </h4>
                  <span className="badge badge-yeni" style={{ fontSize: '0.72rem' }}>
                    {sub.code}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Çözülen Soru</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{sub.total}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Başarı Oranı</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: sub.successRate >= 70 ? '#10b981' : '#f59e0b' }}>
                      %{sub.successRate}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} /> Sınıf Öğretmeninizin Tavsiyesi
            </h4>
            <p style={{ marginTop: '8px', fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
              Lise 1'de 9 dersin her birinin kendine özgü çalışma yöntemi vardır: Matematik ve Fizikte işlem adımlarını yazarak çalışmalı, Kimya ve Biyolojide kavram haritaları çıkarmalı, Edebiyat ve Tarihte neden-sonuç bağlamı kurmalı, İngilizcede ise kelimeleri sesli tekrar etmelisin. İstediğin an yukarıdan <strong>"Karma Deneme Sınavı"</strong> başlatabilirsin.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SEKMESİ: KARMA DENEME SINAVI */}
      {/* ======================================================== */}
      {activeTab === 'exam' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isExamActive && !examReport && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Award size={48} color="#3b82f6" style={{ margin: '0 auto 14px auto' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>9 Ders Kapsamlı Karma Deneme Sınavı</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '8px auto 20px auto', fontSize: '0.92rem' }}>
                Sınıf öğretmenin senin için tüm 9 MEB dersinden (Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya, İngilizce, Din Kültürü) dengeli karma bir tarama sınavı hazırladı.
              </p>
              <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 700 }} onClick={handleStartExam}>
                Sınava Başla (9 Ders)
              </button>
            </div>
          )}

          {isExamActive && currentExamQ && (
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="card-title">
                    Soru {currentExamIndex + 1} / {examQuestions.length}
                  </span>
                  <span className="badge" style={{ marginLeft: '8px', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                    {currentExamQ.subjectName}
                  </span>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px' }}
                  onClick={() => voiceService.current.speakManually(currentExamQ.question.question_text, currentExamQ.subjectName === 'İngilizce' ? 'en-US' : 'tr-TR')}
                >
                  <Volume2 size={16} /> Soruyu Dinle
                </button>
              </div>

              <div style={{ fontSize: '1.08rem', fontWeight: 500, margin: '18px 0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {currentExamQ.question.question_text}
              </div>

              {currentExamQ.question.question_type === 'multiple_choice' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {examOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setExamInputAnswer(opt)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: examInputAnswer === opt ? '2px solid #2563eb' : '1px solid var(--border-color)',
                        backgroundColor: examInputAnswer === opt ? 'var(--primary-light)' : 'var(--bg-primary)',
                        textAlign: 'left',
                        fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                    Cevabınız:
                  </label>
                  <input
                    type="text"
                    className="chat-input"
                    style={{ width: '240px', fontSize: '1rem', fontWeight: 600 }}
                    placeholder="Yanıtınızı yazın"
                    value={examInputAnswer}
                    onChange={e => setExamInputAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleExamSubmitAnswer()}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-primary" 
                  disabled={!examInputAnswer.trim()}
                  onClick={handleExamSubmitAnswer}
                >
                  {currentExamIndex < examQuestions.length - 1 ? 'Cevapla ve Sonraki Soruya Geç' : 'Sınavı Bitir ve Karnemi Göster'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {examReport && (
            <div className="card" style={{ border: '2px solid #3b82f6' }}>
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a' }}>
                  <Award size={22} color="#2563eb" /> 9 Ders Genel Değerlendirme Karnesi
                </span>
                <span className="badge badge-pekisiyor">Sınav Tamamlandı</span>
              </div>

              <div className="grid-3" style={{ margin: '16px 0' }}>
                <div className="card" style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Toplam Başarı</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>
                    {examReport.correctCount} / {examReport.totalQuestions}
                  </div>
                </div>

                <div className="card" style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Başarı Yüzdesi</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                    %{Math.round((examReport.correctCount / examReport.totalQuestions) * 100)}
                  </div>
                </div>

                <div className="card" style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kapsanan Ders</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed' }}>
                    {examReport.breakdown.length} Ders
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', fontSize: '0.92rem', lineHeight: 1.7, color: '#1e3a8a', whiteSpace: 'pre-wrap' }}>
                {examReport.evaluationText}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={handleStartExam}>
                  <RotateCcw size={16} /> Yeni Bir Deneme Sınavı Başlat
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveTab('chat');
                    handleSendMessage('Öğretmenim, 9 ders karma deneme sınavımı tamamladım. Sonuçlarımı birlikte değerlendirebilir miyiz?');
                  }}
                >
                  <MessageSquare size={16} /> Sınıf Öğretmenimle Sınavı Değerlendir
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SEKMESİ: SINIF ÖĞRETMENİ İLE SESLİ / YAZILI GÖRÜŞME */}
      {/* ======================================================== */}
      {activeTab === 'chat' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Sınıf Öğretmeni Odası (Sesli & Yazılı)</span>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              9 MEB Dersi Bütünsel Danışmanlık
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  lineHeight: 1.6,
                  fontSize: '0.95rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600 }}>
                    {msg.sender === 'user' ? 'Sen' : 'Sınıf Öğretmeni'}
                  </span>
                  {msg.sender === 'ai' && (
                    <button 
                      onClick={() => voiceService.current.speakManually(studentText(msg.text), 'tr-TR')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.8 }}
                      title="Seslendir"
                    >
                      <Volume2 size={15} />
                    </button>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.sender==='user'?msg.text:studentText(msg.text)}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.6, textAlign: 'right', marginTop: '4px' }}>
                  {msg.timestamp}
                </div>
              </div>
            ))}
            {isLoadingChat && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Sınıf öğretmeni yanıtlıyor...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
              onClick={handleToggleVoiceInput}
              title="Sesli Konuş (Mikrofon)"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{isListening ? 'Dinleniyor...' : 'Sesle Konuş'}</span>
            </button>

            <input
              type="text"
              className="chat-input"
              placeholder="Sınıf öğretmenine 9 ders hakkında danış veya durumunu anlat..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoadingChat}
              style={{ flex: 1 }}
            />

            <button
              className="btn btn-primary"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoadingChat}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
