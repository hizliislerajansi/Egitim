import {studentText} from '../services/studentExperience';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  BookOpen, 
  HelpCircle, 
  Check, 
  X, 
  ArrowRight, 
  Lightbulb, 
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  ChevronRight,
  Play,
  Pause,
  Award
} from 'lucide-react';
import {FunctionGraph} from './FunctionGraph';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';
import { TOPIC_LECTURES, TopicLecture } from '../data/topicLectures';
import { MEB_TOPICS } from '../data/mebCurriculum';
import { Question } from '../types/database';
import { getVoiceService } from '../services/voiceService';
import { AiAdapter } from '../services/aiAdapter';
import { LectureVisualStage } from './visuals/LectureVisualStage';

export const MathWorkshopScreen: React.FC = () => {
  const mathTopics = MEB_TOPICS.filter(t => t.subject_id === 'subj_math');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(mathTopics[0]?.id || 'topic_math_logic');
  // 'lecture' = Önce Konu Anlatımı, 'practice' = Sonra Soru Çözümü
  const [phase, setPhase] = useState<'lecture' | 'practice'>('lecture');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string; explanation: string } | null>(null);
  const [sessionId] = useState(() => OfflineQuestionEngine.startSession('subj_math', 'math_workshop'));
  
  // Sesli Anlatım & Diyalog durumları
  const [isSpeakingLecture, setIsSpeakingLecture] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiTeacherHint, setAiTeacherHint] = useState<string | null>(null);
  const [isLoadingAiHint, setIsLoadingAiHint] = useState(false);
  
  const voiceService = useRef(getVoiceService());
  const currentLecture: TopicLecture | undefined = TOPIC_LECTURES[selectedTopicId];

  // Konu değiştiğinde soruları yükle ve Konu Anlatımına dön
  useEffect(() => {
    const qList = OfflineQuestionEngine.getQuestionsByTopic(selectedTopicId);
    setQuestions(qList);
    setCurrentIndex(0);
    setInputAnswer('');
    setHintLevel(0);
    setResult(null);
    setAiTeacherHint(null);
    setPhase('lecture'); // Her yeni konuda ÖNCE konu anlatımı!
    stopAudio();
  }, [selectedTopicId]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    voiceService.current.stopSpeaking();
    voiceService.current.stopListening();
    setIsSpeakingLecture(false);
    setIsListening(false);
  };

  const currentQ = questions[currentIndex];
  const isMultipleChoice = currentQ?.question_type === 'multiple_choice';
  const options: string[] = currentQ?.options_json ? JSON.parse(currentQ.options_json) : [];

  // Sesli Konu Anlatımını Başlat / Durdur
  const handleToggleLectureAudio = () => {
    if (isSpeakingLecture) {
      voiceService.current.stopSpeaking();
      setIsSpeakingLecture(false);
    } else if (currentLecture) {
      setIsSpeakingLecture(true);
      voiceService.current.speakManually(currentLecture.audioNarration, 'tr-TR', () => {
        setIsSpeakingLecture(false);
      });
    }
  };

  // Sesli Soru Dinleme
  const handleSpeakQuestion = () => {
    if (!currentQ) return;
    voiceService.current.speakManually(currentQ.question_text, 'tr-TR');
  };

  // Sesle Cevaplama (Mikrofon)
  const handleToggleMic = () => {
    if (isListening) {
      voiceService.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceService.current.setOptions({
        lang: 'tr-TR',
        onTranscript: (text) => {
          setInputAnswer(text);
          setIsListening(false);
        },
        onError: () => setIsListening(false)
      });
      voiceService.current.startListening('tr-TR');
    }
  };

  // Soru Kontrolü
  const handleCheckAnswer = () => {
    if (!inputAnswer.trim() || !currentQ) return;

    const res = OfflineQuestionEngine.submitAnswer({
      sessionId,
      questionId: currentQ.id,
      studentAnswer: inputAnswer.trim(),
      hintsUsed: hintLevel,
      timeSpentSeconds: 25,
      errorCategory: 'İşlem Hatası'
    });

    setResult(res);

    // Sonucu seslendir
    const feedbackSpeech = res.isCorrect 
      ? 'Tebrikler! Doğru cevap.' 
      : 'Cevabın tam doğru değil. Çözüm adımlarını inceleyelim.';
    voiceService.current.speak(feedbackSpeech, 'tr-TR');
  };

  const handleNextQuestion = () => {
    setInputAnswer('');
    setHintLevel(0);
    setResult(null);
    setAiTeacherHint(null);
    stopAudio();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // AI Matematik Öğretmeninden Özel İpucu İste (Sadece Matematik Branş Öğretmeni!)
  const handleAskAiTeacherForHint = async () => {
    if (!currentQ || isLoadingAiHint) return;
    setIsLoadingAiHint(true);
    try {
      const response = await AiAdapter.request({
        role: 'subject_teacher',
        subjectCode: 'MATH',
        taskType: 'hint',
        topicName: currentLecture?.title,
        userMessage: `Şu matematik sorusunu çözmeye çalışıyorum ama takıldım: "${currentQ.question_text}". Bana doğrudan cevabı vermeden düşündürücü bir matematik ipucu verir misin?`
      });
      setAiTeacherHint(response.text);
      voiceService.current.speak(studentText(response.text), 'tr-TR');
    } catch (e: any) {
      setAiTeacherHint('Matematik öğretmeni yerel ipucu: Verilen değişkenleri bir tarafa toplayıp işlem adımlarını sırayla yaz.');
    } finally {
      setIsLoadingAiHint(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <FunctionGraph/>
      {/* Üst Konu Seçici Bar */}
      <div className="card" style={{ padding: '14px 18px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '8px', borderRadius: '8px', color: 'white' }}>
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Matematik Atölyesi (9. Sınıf)</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Pedagojik Akış: <strong>1. Önce Konu Anlatımı</strong> ➔ <strong>2. İlgili Soru Alıştırması</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ünite / Konu:</label>
            <select
              className="chat-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
            >
              {mathTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.unit} - {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aşama Sekmeleri (Konu Anlatımı ➔ Soru Çözümü) */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <button 
            className={`btn ${phase === 'lecture' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setPhase('lecture'); stopAudio(); }}
          >
            <BookOpen size={16} /> 1. Konu Anlatımı & Formüller
          </button>
          <button 
            className={`btn ${phase === 'practice' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setPhase('practice'); stopAudio(); }}
          >
            <Calculator size={16} /> 2. Konu Soruları ({questions.length} Soru)
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. AŞAMA: ÖNCE KONU ANLATIMI */}
      {/* ======================================================== */}
      {phase === 'lecture' && currentLecture && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Anlatım Başlık & Sesli Dinleme Kartı */}
          <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge badge-ogreniliyor" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  {currentLecture.unit}
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '4px 0' }}>
                  {currentLecture.title}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>MEB Kazanımı:</strong> {currentLecture.outcome}
                </p>
              </div>

              {/* Sesli Anlatım Butonu */}
              <button 
                className={`btn ${isSpeakingLecture ? 'btn-danger' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={handleToggleLectureAudio}
              >
                {isSpeakingLecture ? <Pause size={18} /> : <Volume2 size={18} />}
                <span>{isSpeakingLecture ? 'Anlatımı Duraklat' : 'Dersi Sesli Dinle'}</span>
              </button>
            </div>

            {/* Konu Özeti */}
            <div style={{ marginTop: '16px', lineHeight: 1.7, fontSize: '0.98rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
              {currentLecture.summary}
            </div>

            {/* Önemli Püf Noktaları */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Önemli Püf Noktaları
              </h4>
              <ul style={{ paddingLeft: '22px', fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                {currentLecture.keyPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* İnteraktif Görsel ve Animasyonlu Simülatör Sahnesi */}
          <LectureVisualStage topicId={selectedTopicId} lecture={currentLecture} />

          {/* Formül ve Kural Kartları */}
          <div className="grid-2">
            {currentLecture.formulasOrRules.map((f, i) => (
              <div key={i} className="card" style={{ backgroundColor: 'var(--bg-card)' }}>
                <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.95rem', marginBottom: '6px' }}>
                  {f.title}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '6px' }}>
                  {f.content}
                </div>
              </div>
            ))}
          </div>

          {/* Çözümlü Örnek */}
          <div className="card" style={{ border: '1px solid #93c5fd', backgroundColor: 'var(--bg-card)' }}>
            <div className="card-header" style={{ marginBottom: '8px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8' }}>
                <Award size={18} /> Çözümlü Model Soru
              </span>
              <span className="badge badge-pekisiyor">Öğretmen Çözümü</span>
            </div>

            <p style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: '12px' }}>
              {currentLecture.workedExample.question}
            </p>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.92rem', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: '#2563eb' }}>Adım Adım Çözüm:</div>
              {currentLecture.workedExample.solutionSteps.map((step, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>{step}</div>
              ))}
              <div style={{ marginTop: '8px', fontWeight: 700, color: 'var(--accent)' }}>
                Doğru Sonuç: {currentLecture.workedExample.finalAnswer}
              </div>
            </div>
          </div>

          {/* Sorulara Geçiş Butonu */}
          <div style={{ textAlign: 'center', margin: '10px 0 20px 0' }}>
            <button 
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '10px', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
              onClick={() => { setPhase('practice'); stopAudio(); }}
            >
              Konuyu Anladım, Soruları Çözmeye Başla <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AŞAMA: KONU HAKKINDA SORU ALIŞTIRMASI */}
      {/* ======================================================== */}
      {phase === 'practice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <BookOpen size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
              <h4>Bu konu için soru hazırlanıyor</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                Lütfen konu anlatımını inceleyip diğer konulara göz atınız.
              </p>
              <button className="btn btn-secondary" style={{ marginTop: '14px' }} onClick={() => setPhase('lecture')}>
                Konu Anlatımına Dön
              </button>
            </div>
          ) : currentQ ? (
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="card-title">
                    Soru {currentIndex + 1} / {questions.length} (Zorluk: {currentQ.difficulty}/5)
                  </span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Konu: {currentLecture?.title}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 10px' }}
                    onClick={handleSpeakQuestion}
                    title="Soruyu Seslendir"
                  >
                    <Volume2 size={16} /> Soruyu Dinle
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px' }}
                    onClick={() => { setPhase('lecture'); stopAudio(); }}
                    title="Konu Anlatımına Dön"
                  >
                    <BookOpen size={16} /> Anlatımı Gör
                  </button>
                </div>
              </div>

              {/* Soru Metni */}
              <div style={{ fontSize: '1.08rem', fontWeight: 500, margin: '16px 0 20px 0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {currentQ.question_text}
              </div>

              {/* Çoktan Seçmeli Şıklar */}
              {isMultipleChoice ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {options.map((opt, i) => {
                    const isSelected = inputAnswer === opt;
                    let bg = 'var(--bg-primary)';
                    let border = '1px solid var(--border-color)';
                    if (result) {
                      if (opt === currentQ.correct_answer) {
                        bg = 'var(--accent-light)';
                        border = '1px solid var(--accent)';
                      } else if (isSelected && !result.isCorrect) {
                        bg = 'var(--danger-light)';
                        border = '1px solid var(--danger)';
                      }
                    } else if (isSelected) {
                      bg = 'var(--primary-light)';
                      border = '1px solid var(--primary)';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => !result && setInputAnswer(opt)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border,
                          backgroundColor: bg,
                          color: 'var(--text-primary)',
                          cursor: result ? 'default' : 'pointer',
                          textAlign: 'left',
                          fontSize: '0.95rem'
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                    Cevabınız (Örnek: 7, -2, {`{-2, 5}`}):
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="chat-input"
                      style={{ width: '220px', fontSize: '1.05rem', fontWeight: 600 }}
                      placeholder="Sonucu yazın"
                      disabled={!!result}
                      value={inputAnswer}
                      onChange={e => setInputAnswer(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCheckAnswer()}
                    />
                    {/* Sesle Cevaplama Butonu */}
                    <button
                      className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={handleToggleMic}
                      title="Sesli Cevap Söyle (Bas-Konuş)"
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      <span>{isListening ? 'Dinleniyor...' : 'Sesle Söyle'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* İpucu Kutusu */}
              {hintLevel > 0 && (
                <div style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={15} /> İpucu {hintLevel}
                  </div>
                  <p style={{ fontSize: '0.92rem', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                    {hintLevel === 1 ? currentQ.hint_1 : currentQ.hint_2}
                  </p>
                </div>
              )}

              {/* AI Branş Öğretmeninden Dinamik İpucu Kutusu */}
              {aiTeacherHint && (
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, color: '#1d4ed8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={15} /> Rehber Matematik Öğretmeni Rehberliği
                  </div>
                  <p style={{ fontSize: '0.92rem', marginTop: '4px', whiteSpace: 'pre-wrap', color: '#1e3a8a' }}>
                    {studentText(aiTeacherHint)}
                  </p>
                </div>
              )}

              {/* Sonuç Kartı */}
              {result && (
                <div style={{ backgroundColor: result.isCorrect ? 'var(--accent-light)' : 'var(--danger-light)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {result.isCorrect ? <Check size={18} color="#059669" /> : <X size={18} color="#dc2626" />}
                    <strong style={{ color: result.isCorrect ? 'var(--accent)' : 'var(--danger)' }}>
                      {result.feedback}
                    </strong>
                  </div>
                  <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    <strong>Çözüm Adımları:</strong><br />{result.explanation}
                  </p>
                </div>
              )}

              {/* Aksiyon Butonları */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!result && (
                    <>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setHintLevel(prev => Math.min(2, prev + 1))}
                        disabled={hintLevel >= 2}
                      >
                        <HelpCircle size={15} /> {hintLevel === 0 ? 'Adım İpucu Al' : 'İkinci İpucu'}
                      </button>

                      <button 
                        className="btn btn-secondary" 
                        onClick={handleAskAiTeacherForHint}
                        disabled={isLoadingAiHint}
                        title="Yalnızca Matematik Branş Öğretmeninden Dinamik İpucu Al"
                      >
                        <Sparkles size={15} /> {isLoadingAiHint ? 'Hazırlanıyor…' : 'Öğretmenden İpucu'}
                      </button>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {!result ? (
                    <button 
                      className="btn btn-primary" 
                      disabled={!inputAnswer.trim()}
                      onClick={handleCheckAnswer}
                    >
                      Cevabı Kontrol Et
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleNextQuestion}>
                      {currentIndex < questions.length - 1 ? 'Sonraki Soru' : 'Soruları Baştan Tekrar Et'} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
