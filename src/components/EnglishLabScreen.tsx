import {studentText} from '../services/studentExperience';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Languages, 
  BookOpen, 
  Volume2, 
  VolumeX,
  Check, 
  X, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  MessageSquare,
  Mic,
  MicOff,
  Pause,
  Award,
  Search,
  ExternalLink,
  Globe,
  Compass,
  BookMarked,
  FileText,
  Database
} from 'lucide-react';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';
import { TOPIC_LECTURES, TopicLecture } from '../data/topicLectures';
import { MEB_TOPICS } from '../data/mebCurriculum';
import { Question } from '../types/database';
import { getVoiceService } from '../services/voiceService';
import { AiAdapter } from '../services/aiAdapter';
import { DictionaryService, DictionaryEntry } from '../services/dictionaryService';
import { ENGLISH_LANGUAGE_SOURCES, EnglishLanguageSource } from '../data/englishSources';

import { EnglishCorpusEngine, CorpusVocabItem } from '../services/englishCorpusEngine';
import { EnglishAiGenerator, GeneratedReadingPassage, GeneratedClozeTest } from '../services/englishAiGenerator';
import { LectureVisualStage } from './visuals/LectureVisualStage';
import { EnglishLearningPath } from './EnglishLearningPath';

export const EnglishLabScreen: React.FC = () => {
  const [showLegacy, setShowLegacy] = useState(false);
  const engTopics = MEB_TOPICS.filter(t => t.subject_id === 'subj_eng');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(engTopics[0]?.id || 'topic_eng_theme1');
  // 'lecture' = Önce Tema/Konu Anlatımı, 'practice' = Sonra Soru Çözümü, 'vocabulary' = Kelime Kartları, 'dictionary' = Açık Dil & CEFR, 'reading_cloze' = Okuma & Boşluk Doldurma
  const [phase, setPhase] = useState<'lecture' | 'practice' | 'vocabulary' | 'dictionary' | 'reading_cloze'>('lecture');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string; explanation: string } | null>(null);
  const [sessionId] = useState(() => OfflineQuestionEngine.startSession('subj_eng', 'english_lab'));

  // Sesli Anlatım & Diyalog
  const [isSpeakingLecture, setIsSpeakingLecture] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiTeacherHint, setAiTeacherHint] = useState<string | null>(null);
  const [isLoadingAiHint, setIsLoadingAiHint] = useState(false);

  // 3 Yanlış Bekleme, Otomatik Basit Anlatım & Konu Sonu Tekrar Sistemi
  const [wrongCount, setWrongCount] = useState(0);
  const [failedQuestionsQueue, setFailedQuestionsQueue] = useState<Question[]>([]);
  const [simplifiedExplanation, setSimplifiedExplanation] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isTopicCompleted, setIsTopicCompleted] = useState(false);

  // Açık Sözlük & CEFR Arama Durumları
  const [searchWord, setSearchWord] = useState('exchange');
  const [dictEntry, setDictEntry] = useState<DictionaryEntry | null>(null);
  const [isLoadingDict, setIsLoadingDict] = useState(false);
  const [dictFilterCat, setDictFilterCat] = useState<string>('all');

  // Admin & Kaynak Stüdyosu Modal Durumu


  // Kademeli Okuma ve Boşluk Doldurma Durumları
  const [readingPassage, setReadingPassage] = useState<GeneratedReadingPassage | null>(null);
  const [clozeTest, setClozeTest] = useState<GeneratedClozeTest | null>(null);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [readingFeedback, setReadingFeedback] = useState<Record<string, { isCorrect: boolean; exp: string }>>({});
  const [clozeSelections, setClozeSelections] = useState<Record<string, string>>({});
  const [clozeFeedback, setClozeFeedback] = useState<Record<string, boolean>>({});
  const [corpusVocab, setCorpusVocab] = useState<CorpusVocabItem[]>([]);

  const voiceService = useRef(getVoiceService());
  const currentLecture: TopicLecture | undefined = TOPIC_LECTURES[selectedTopicId];

  // Tema değiştiğinde soruları yükle ve Konu Anlatımına dön
  useEffect(() => {
    const qList = OfflineQuestionEngine.getQuestionsByTopic(selectedTopicId);
    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHintLevel(0);
    setResult(null);
    setAiTeacherHint(null);
    setSimplifiedExplanation(null);
    setWrongCount(0);
    setFailedQuestionsQueue([]);
    setIsReviewMode(false);
    setIsTopicCompleted(false);
    setPhase('lecture'); // Her yeni temada ÖNCE konu anlatımı!
    stopAudio();

    // Kademeli Okuma, Boşluk Doldurma ve Korpustaki Kelimeleri Yükle
    EnglishCorpusEngine.initEngine();
    const vocabResults = EnglishCorpusEngine.searchVocab('', selectedTopicId);
    setCorpusVocab(vocabResults);

    EnglishAiGenerator.generateReadingPassage(selectedTopicId).then(res => setReadingPassage(res));
    EnglishAiGenerator.generateClozeTest(selectedTopicId).then(res => setClozeTest(res));
    setReadingAnswers({});
    setReadingFeedback({});
    setClozeSelections({});
    setClozeFeedback({});
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
  const options: string[] = currentQ?.options_json ? JSON.parse(currentQ.options_json) : [];

  // Sesli Tema Anlatımını Başlat / Durdur
  const handleToggleLectureAudio = () => {
    if (isSpeakingLecture) {
      voiceService.current.stopSpeaking();
      setIsSpeakingLecture(false);
    } else if (currentLecture) {
      setIsSpeakingLecture(true);
      voiceService.current.speakManually(currentLecture.audioNarration, 'en-US', () => {
        setIsSpeakingLecture(false);
      });
    }
  };

  // İngilizce Metin / Telaffuz Seslendirme
  const handleSpeak = (text: string, lang: 'en-US' | 'tr-TR' = 'en-US') => {
    voiceService.current.speakManually(text, lang);
  };

  // Sesle Cevap Verme (Mikrofon)
  const handleToggleMic = () => {
    if (isListening) {
      voiceService.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceService.current.setOptions({
        lang: 'en-US',
        onTranscript: (text) => {
          // Öğrencinin söylediği seçenekle eşleşeni bul
          const matched = options.find(o => o.toLowerCase() === text.trim().toLowerCase());
          if (matched) {
            setSelectedOption(matched);
          } else if (options.length > 0) {
            setSelectedOption(text.trim());
          }
          setIsListening(false);
        },
        onError: () => setIsListening(false)
      });
      voiceService.current.startListening('en-US');
    }
  };

  const handleSelectOption = (opt: string) => {
    if (result) return;
    setSelectedOption(opt);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || !currentQ) return;
    const isCorrect = selectedOption.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();

    if (isCorrect) {
      const res = OfflineQuestionEngine.submitAnswer({
        sessionId,
        questionId: currentQ.id,
        studentAnswer: selectedOption,
        hintsUsed: hintLevel,
        timeSpentSeconds: 15,
        errorCategory: 'Kelime/Dilbilgisi Eksikliği'
      });
      setResult({
        isCorrect: true,
        feedback: 'Well done! That is correct.',
        explanation: currentQ.solution_explanation || res.explanation
      });
      setSimplifiedExplanation(null);
      setFailedQuestionsQueue(prev => prev.filter(q => q.id !== currentQ.id));
      voiceService.current.speak('Well done! That is correct.', 'en-US');
    } else {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);

      if (newWrong < 3) {
        let simpleText = '';
        if (newWrong === 1) {
          const rule = currentLecture?.keyPoints?.[0] || 'Pay attention to grammar and tense.';
          simpleText = `1. Simplified Explanation: Look at the core rule: ${rule} Check the subject and time expression.`;
        } else {
          const hint = currentQ.hint_1 || currentQ.hint_2 || 'Rule out options that do not match the subject.';
          simpleText = `2. Step-by-Step Clue: ${hint} Take a breath and eliminate wrong options.`;
        }
        setSimplifiedExplanation(simpleText);
        setResult({
          isCorrect: false,
          feedback: `Not quite. (Attempt ${newWrong}/3 — You must try again before advancing. Remaining: ${3 - newWrong})`,
          explanation: ''
        });
        voiceService.current.speak(`That is not correct. Here is a simpler hint: ${simpleText}`, 'en-US');
      } else {
        const res = OfflineQuestionEngine.submitAnswer({
          sessionId,
          questionId: currentQ.id,
          studentAnswer: selectedOption,
          hintsUsed: hintLevel,
          timeSpentSeconds: 15,
          errorCategory: 'Kelime/Dilbilgisi Eksikliği'
        });
        setFailedQuestionsQueue(prev => prev.some(q => q.id === currentQ.id) ? prev : [...prev, currentQ]);
        setSimplifiedExplanation('3. Solution Breakdown: 3 attempts used. This question will be reviewed again at the end of the theme!');
        setResult({
          isCorrect: false,
          feedback: `3 Wrong Attempts. The correct answer is: ${currentQ.correct_answer}`,
          explanation: `Solution:\n${currentQ.solution_explanation || res.explanation}`
        });
        voiceService.current.speak(`3 attempts made. The correct answer is: ${currentQ.correct_answer}. This question will repeat at the end.`, 'en-US');
      }
    }
  };

  const handleRetryQuestion = () => {
    setSelectedOption(null);
    setResult(null);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setHintLevel(0);
    setResult(null);
    setAiTeacherHint(null);
    setSimplifiedExplanation(null);
    setWrongCount(0);
    stopAudio();

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (failedQuestionsQueue.length > 0) {
        setIsReviewMode(true);
        setQuestions([...failedQuestionsQueue]);
        setFailedQuestionsQueue([]);
        setCurrentIndex(0);
      } else {
        setIsTopicCompleted(true);
        setIsReviewMode(false);
      }
    }
  };

  // AI İngilizce Branş Öğretmeninden Dinamik İpucu İste (Sadece İngilizce Dersi)
  const handleAskAiTeacherForHint = async () => {
    if (!currentQ || isLoadingAiHint) return;
    setIsLoadingAiHint(true);
    try {
      const response = await AiAdapter.request({
        role: 'subject_teacher',
        subjectCode: 'ENG',
        taskType: 'hint',
        topicName: currentLecture?.title,
        userMessage: `İngilizce 9. sınıf sorusunu çözüyorum: "${currentQ.question_text}". Doğrudan cevabı söylemeden bir gramer/kelime ipucu verir misin?`
      });
      setAiTeacherHint(response.text);
      voiceService.current.speak(studentText(response.text), 'tr-TR');
    } catch (e: any) {
      setAiTeacherHint('İngilizce öğretmeni ipucu: Cümlenin öznesine ve zaman zarfına (yesterday, usually vb.) dikkat et.');
    } finally {
      setIsLoadingAiHint(false);
    }
  };

  // Sözlük ve Açık Dil Kaynakları Arama Fonksiyonu
  const handleLookup = async (w: string) => {
    if (!w || !w.trim()) return;
    setIsLoadingDict(true);
    try {
      const entry = await DictionaryService.lookupWord(w);
      setDictEntry(entry);
    } catch (e) {
      console.error('Sözlük arama hatası:', e);
    } finally {
      setIsLoadingDict(false);
    }
  };

  const handleOpenExternalUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 9. Sınıf MEB Kelime Kartları
  const vocabList = [
    { word: 'Exchange student', tr: 'Değişim öğrencisi', sentence: 'Merve is an exchange student in London.' },
    { word: 'Neighborhood', tr: 'Mahalle / Çevre', sentence: 'Our neighborhood has a big public library.' },
    { word: 'Turn left / right', tr: 'Sola / Sağa dön', sentence: 'Go straight and turn right at the corner.' },
    { word: 'Sci-fi movie', tr: 'Bilim kurgu filmi', sentence: 'I prefer watching sci-fi movies to comedies.' },
    { word: 'Natural world', tr: 'Doğal dünya / Doğa', sentence: 'Protecting the natural world is our duty.' },
    { word: 'Inspiring leader', tr: 'İlham verici lider', sentence: 'Atatürk was an inspiring leader.' },
    { word: 'Tradition / Custom', tr: 'Gelenek / Görenek', sentence: 'Turkish hospitality is an ancient tradition.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <EnglishLearningPath />
      <button className="btn btn-secondary" aria-expanded={showLegacy} onClick={()=>{stopAudio();setShowLegacy(!showLegacy);}}>{showLegacy?'MEB tema araçlarını gizle':'Mevcut MEB tema, sözlük ve kaynak araçlarını aç'}</button>
      {showLegacy && <>
      {/* Üst Tema Seçici Bar */}
      <div className="card" style={{ padding: '14px 18px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#10b981', padding: '8px', borderRadius: '8px', color: 'white' }}>
              <Languages size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>İngilizce Laboratuvarı (9. Sınıf)</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Pedagojik Akış: <strong>1. Önce Tema Anlatımı</strong> ➔ <strong>2. İlgili Soru Alıştırması</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tema (Theme):</label>
            <select
              className="chat-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
            >
              {engTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.unit} - {t.name}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* Sekmeler (Tema Anlatımı ➔ Sorular ➔ Kelimeler ➔ Sözlük & CEFR ➔ Okuma & Boşluk Doldurma) */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${phase === 'lecture' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setPhase('lecture'); stopAudio(); }}
          >
            <BookOpen size={16} /> 1. Tema Anlatımı & Kalıplar
          </button>
          <button 
            className={`btn ${phase === 'practice' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setPhase('practice'); stopAudio(); }}
          >
            <Languages size={16} /> 2. Tema Soruları ({questions.length} Soru)
          </button>
          <button 
            className={`btn ${phase === 'vocabulary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setPhase('vocabulary'); stopAudio(); }}
          >
            <Sparkles size={16} /> 3. Kelime Hazinesi & Örnekler
          </button>
          <button 
            className={`btn ${phase === 'dictionary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { 
              setPhase('dictionary'); 
              stopAudio(); 
              if (!dictEntry) {
                handleLookup(searchWord || 'exchange');
              }
            }}
          >
            <Globe size={16} /> 4. Açık Dil & Sözlük
          </button>
          <button 
            className={`btn ${phase === 'reading_cloze' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setPhase('reading_cloze'); stopAudio(); }}
          >
            <FileText size={16} /> 5. Kademeli Okuma & Boşluk Doldurma
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. AŞAMA: ÖNCE TEMA ANLATIMI */}
      {/* ======================================================== */}
      {phase === 'lecture' && currentLecture && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
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

              {/* Sesli Dinleme Butonu */}
              <button 
                className={`btn ${isSpeakingLecture ? 'btn-danger' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={handleToggleLectureAudio}
              >
                {isSpeakingLecture ? <Pause size={18} /> : <Volume2 size={18} />}
                <span>{isSpeakingLecture ? 'Anlatımı Duraklat' : 'Temayı Sesli Dinle'}</span>
              </button>
            </div>

            {/* Tema Özeti */}
            <div style={{ marginTop: '16px', lineHeight: 1.7, fontSize: '0.98rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
              {currentLecture.summary}
            </div>

            {/* Önemli Kalıplar ve Püf Noktaları */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Dilbilgisi & Kalıp Püf Noktaları
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

          {/* Gramer & Kural Kartları */}
          <div className="grid-2">
            {currentLecture.formulasOrRules.map((f, i) => (
              <div key={i} className="card" style={{ backgroundColor: 'var(--bg-card)' }}>
                <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem', marginBottom: '6px' }}>
                  {f.title}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '6px' }}>
                  {f.content}
                </div>
              </div>
            ))}
          </div>

          {/* Çözümlü Model Örnek */}
          <div className="card" style={{ border: '1px solid #a7f3d0', backgroundColor: 'var(--bg-card)' }}>
            <div className="card-header" style={{ marginBottom: '8px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857' }}>
                <Award size={18} /> Model Soru & Çözüm İncelemesi
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px' }}
                onClick={() => handleSpeak(currentLecture.workedExample.question)}
              >
                <Volume2 size={16} /> Dinle
              </button>
            </div>

            <p style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
              {currentLecture.workedExample.question}
            </p>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.92rem', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: '#059669' }}>Açıklamalı Çözüm:</div>
              {currentLecture.workedExample.solutionSteps.map((step, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>{step}</div>
              ))}
              <div style={{ marginTop: '8px', fontWeight: 700, color: 'var(--accent)' }}>
                Doğru Seçenek / Cevap: {currentLecture.workedExample.finalAnswer}
              </div>
            </div>
          </div>

          {/* Sorulara Geçiş Butonu */}
          <div style={{ textAlign: 'center', margin: '10px 0 20px 0' }}>
            <button 
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '10px', boxShadow: '0 4px 12px rgba(16,185,129,0.25)', backgroundColor: '#10b981', borderColor: '#059669' }}
              onClick={() => { setPhase('practice'); stopAudio(); }}
            >
              Temayı Anladım, Soruları Çözmeye Başla <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AŞAMA: TEMA SORULARI ALIŞTIRMASI */}
      {/* ======================================================== */}
      {phase === 'practice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <BookOpen size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
              <h4>Bu tema için soru hazırlanıyor</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                Lütfen tema anlatımını inceleyip diğer temalara göz atınız.
              </p>
              <button className="btn btn-secondary" style={{ marginTop: '14px' }} onClick={() => setPhase('lecture')}>
                Tema Anlatımına Dön
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
                    Tema: {currentLecture?.title}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 10px' }}
                    onClick={() => handleSpeak(currentQ.question_text)}
                    title="İngilizce Soruyu Sesli Dinle"
                  >
                    <Volume2 size={16} /> Dinle
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px' }}
                    onClick={() => { setPhase('lecture'); stopAudio(); }}
                    title="Tema Anlatımına Dön"
                  >
                    <BookOpen size={16} /> Anlatımı Gör
                  </button>
                </div>
              </div>

              {/* Soru Metni */}
              <div style={{ fontSize: '1.08rem', fontWeight: 500, margin: '16px 0 20px 0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {currentQ.question_text}
              </div>

              {/* Sesle Söyle / Cevaplama Seçeneği */}
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={handleToggleMic}
                  title="İngilizce Telaffuzla Cevap Ver"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isListening ? 'Dinleniyor (Speak now)...' : 'Sesle Cevapla'}</span>
                </button>
                {selectedOption && (
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Seçilen: <strong>{selectedOption}</strong>
                  </span>
                )}
              </div>

              {/* Şıklar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {options.map((opt, i) => {
                  const isSelected = selectedOption === opt;
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
                      onClick={() => handleSelectOption(opt)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
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
                      <span>{opt}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(opt);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        title="Telaffuzu Dinle"
                      >
                        <Volume2 size={16} />
                      </button>
                    </button>
                  );
                })}
              </div>

              {/* İpucu Kutusu */}
              {hintLevel > 0 && (
                <div style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={15} /> İpucu {hintLevel}
                  </div>
                  <p style={{ fontSize: '0.92rem', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                    {hintLevel === 1 ? currentQ.hint_1 : currentQ.hint_2}
                  </p>
                </div>
              )}

              {/* AI İngilizce Branş Öğretmeninden Dinamik İpucu */}
              {aiTeacherHint && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, color: '#047857', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={15} /> Rehber İngilizce Öğretmeni Rehberliği
                  </div>
                  <p style={{ fontSize: '0.92rem', marginTop: '4px', whiteSpace: 'pre-wrap', color: '#064e3b' }}>
                    {studentText(aiTeacherHint)}
                  </p>
                </div>
              )}

              {/* Otomatik Basitleştirilmiş Anlatım Kutusu */}
              {simplifiedExplanation && (
                <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #2563eb', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1d4ed8', fontSize: '0.88rem', marginBottom: '4px' }}>
                    <Sparkles size={16} />
                    <span>Automatic Simpler Explanation:</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.5 }}>
                    {simplifiedExplanation}
                  </div>
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
                  {result.explanation && (
                    <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Açıklama:</strong> {result.explanation}
                    </p>
                  )}
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
                        <HelpCircle size={15} /> {hintLevel === 0 ? 'İpucu İste' : 'İkinci İpucu'}
                      </button>

                      <button 
                        className="btn btn-secondary" 
                        onClick={handleAskAiTeacherForHint}
                        disabled={isLoadingAiHint}
                        title="Yalnızca İngilizce Branş Öğretmeninden Dinamik İpucu Al"
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
                      disabled={!selectedOption}
                      onClick={handleCheckAnswer}
                    >
                      {wrongCount > 0 ? 'Tekrar Kontrol Et' : 'Cevabı Gönder'}
                    </button>
                  ) : !result.isCorrect && wrongCount < 3 ? (
                    // 3 yanlış tamamlanana kadar diğer soruya geçilemez!
                    <button 
                      className="btn btn-primary" 
                      style={{ backgroundColor: '#d97706', borderColor: '#b45309' }}
                      onClick={handleRetryQuestion}
                    >
                      Tekrar Dene (Kalan Hak: {3 - wrongCount})
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleNextQuestion}>
                      {wrongCount >= 3 ? 'Sonraki Soru (Konu Sonunda Tekrar Edecek)' : 'Sonraki Soru'} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : isTopicCompleted ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', margin: 0 }}>
                Theme Completed! (Tema Başarıyla Tamamlandı)
              </h3>
              <p style={{ maxWidth: '540px', margin: '12px auto 20px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                "{currentLecture?.title}" konusundaki tüm soruları ve 3 yanlış yaptığın soruları başarıyla tamamladın!
              </p>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setIsTopicCompleted(false);
                  const qList = OfflineQuestionEngine.getQuestionsByTopic(selectedTopicId);
                  setQuestions(qList);
                  setCurrentIndex(0);
                  setWrongCount(0);
                  setFailedQuestionsQueue([]);
                }}
              >
                Soruları Baştan Tekrar Çöz
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. AŞAMA: KELİME HAZİNESİ KARTLARI */}
      {/* ======================================================== */}
      {phase === 'vocabulary' && (
        <div className="grid-2">
          {/* Çekirdek Müfredat Kelimeleri */}
          {vocabList.map((item, idx) => (
            <div key={`static_${idx}`} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {item.word}
                    </h4>
                    <span className="badge badge-ogreniliyor" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      CEFR A2
                    </span>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px' }}
                    onClick={() => handleSpeak(item.word)}
                    title="Telaffuzu Dinle"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
                <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.92rem', marginBottom: '8px' }}>
                  {item.tr}
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
                  "{item.sentence}"
                </p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setSearchWord(item.word);
                      setPhase('dictionary');
                      handleLookup(item.word);
                    }}
                  >
                    <Search size={13} />
                    <span>Sözlük & CEFR Analizi</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Korpustan Gelen Açık Veri & Tatoeba Kelimeleri */}
          {corpusVocab.map((cItem) => {
            const sentences = EnglishCorpusEngine.getSentencesForWord(cItem.id);
            const firstSent = sentences[0];
            return (
              <div key={cItem.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '3px solid #10b981' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {cItem.word}
                      </h4>
                      <span className="badge badge-tamamlandi" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                        CEFR {cItem.cefr_level}
                      </span>
                      {cItem.phonetic && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {cItem.phonetic}
                        </span>
                      )}
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleSpeak(cItem.word)}
                      title="Telaffuzu Dinle"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                  <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.92rem', marginBottom: '8px' }}>
                    {cItem.turkish_meaning}
                  </div>
                  {firstSent && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontStyle: 'italic', margin: 0 }}>
                        "{firstSent.en_sentence}"
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        {firstSent.tr_sentence}
                      </p>
                    </div>
                  )}
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Yerel eğitim örnekleri
                    </span>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        setSearchWord(cItem.word);
                        setPhase('dictionary');
                        handleLookup(cItem.word);
                      }}
                    >
                      <Search size={13} />
                      <span>Sözlük & Analiz</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. AŞAMA: AÇIK DİL BİLİMİ & SÖZLÜK (10 KAYNAK & CEFR) */}
      {/* ======================================================== */}
      {phase === 'dictionary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Canlı Arama ve Free Dictionary API Motoru */}
          <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={20} color="#2563eb" />
                  <span>Canlı İngilizce Sözlük & CEFR Seviye Sorgusu</span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  Sözlük API bağlantısı ve yerel eğitim örnekleri. Yerel CEFR etiketleri yaklaşık çalışma düzeyidir; canlı seviye ölçümü değildir.
                </p>
              </div>

              {/* Hızlı Kelime Seçiciler */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['exchange', 'neighborhood', 'tradition', 'explore', 'environment', 'inspire'].map(kw => (
                  <button
                    key={kw}
                    className="dp-official-link-pill"
                    style={{ cursor: 'pointer', border: '1px solid #cbd5e1', fontSize: '0.76rem', padding: '3px 8px' }}
                    onClick={() => {
                      setSearchWord(kw);
                      handleLookup(kw);
                    }}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Arama Input Çubuğu */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleLookup(searchWord); }}
              style={{ display: 'flex', gap: '10px' }}
            >
              <input
                type="text"
                className="chat-input"
                placeholder="İngilizce bir kelime yazın (Örn: neighborhood, discover, achievement)..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', fontSize: '0.95rem' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoadingDict || !searchWord.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                {isLoadingDict ? (
                  <span>Sorgulanıyor...</span>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Sözlükte Ara</span>
                  </>
                )}
              </button>
            </form>

            {/* Sorgu Sonuç Kartı */}
            {dictEntry && (
              <div style={{ marginTop: '18px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>
                      {dictEntry.word}
                    </h2>
                    {dictEntry.phonetic && (
                      <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace', backgroundColor: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        {dictEntry.phonetic}
                      </span>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        if (dictEntry.audioUrl) {
                          const audio = new Audio(dictEntry.audioUrl);
                          audio.play().catch(() => handleSpeak(dictEntry.word));
                        } else {
                          handleSpeak(dictEntry.word);
                        }
                      }}
                      title="Fonetik Sesli Telaffuzu Dinle"
                    >
                      <Volume2 size={16} color="#2563eb" />
                      <span style={{ fontSize: '0.8rem' }}>Telaffuz</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* CEFR Seviye Rozeti */}
                    {(() => {
                      const cefrInfo = DictionaryService.getCefrBadge(dictEntry.cefrLevel);
                      return (
                        <span 
                          style={{ 
                            fontSize: '0.78rem', 
                            fontWeight: 700, 
                            color: cefrInfo.color, 
                            backgroundColor: cefrInfo.bg, 
                            padding: '4px 10px', 
                            borderRadius: '9999px',
                            border: `1px solid ${cefrInfo.color}33`
                          }}
                        >
                          CEFR: {cefrInfo.label}
                        </span>
                      );
                    })()}

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      Fonetik & Anlam Analizi
                    </span>
                  </div>
                </div>

                {/* Türkçe Karşılık */}
                {dictEntry.turkishMeaning && (
                  <div style={{ marginBottom: '14px', fontSize: '0.95rem', color: '#059669', fontWeight: 600 }}>
                    Türkçe Karşılığı: <span>{dictEntry.turkishMeaning}</span>
                  </div>
                )}

                {/* Anlamlar ve Tanımlar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dictEntry.meanings.map((meaning, mIdx) => (
                    <div key={mIdx} style={{ backgroundColor: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#2563eb', marginBottom: '8px', letterSpacing: '0.04em' }}>
                        {meaning.partOfSpeech}
                      </span>
                      <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {meaning.definitions.map((def, dIdx) => (
                          <li key={dIdx} style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                            <div>{def.definition}</div>
                            {def.example && (
                              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '3px' }}>
                                Örnek: "{def.example}"
                              </div>
                            )}
                            {def.synonyms && def.synonyms.length > 0 && (
                              <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px' }}>
                                <strong>Eş Anlamlılar:</strong> {def.synonyms.join(', ')}
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. AŞAMA: KADEMELİ OKUMA & BOŞLUK DOLDURMA (CLOZE & READING) */}
      {/* ======================================================== */}
      {phase === 'reading_cloze' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Kademeli Okuma Parçası ve Anlama Soruları */}
          {readingPassage ? (
            <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-ogreniliyor" style={{ fontSize: '0.78rem' }}>
                    CEFR {readingPassage.cefrLevel}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {readingPassage.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                    onClick={() => handleSpeak(readingPassage.passageText)}
                    title="Okuma Parçasını Sesli Dinle"
                  >
                    <Volume2 size={16} />
                    <span>Metni Dinle</span>
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '6px' }}>
                    Yerel kademeli okuma
                  </span>
                </div>
              </div>

              {/* Okuma Metni */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 18px', borderRadius: '10px', fontSize: '0.94rem', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
                {readingPassage.passageText}
              </div>

              {/* Okuma Anlama Soruları */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#8b5cf6', margin: 0 }}>
                  Reading Comprehension Questions (Okuduğunu Anlama)
                </h4>

                {readingPassage.questions.map((q, qIdx) => {
                  const currentAns = readingAnswers[q.id];
                  const fb = readingFeedback[q.id];
                  return (
                    <div key={q.id || qIdx} style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '10px' }}>
                        {qIdx + 1}. {q.question}
                      </div>

                      <div className="grid-2" style={{ gap: '8px' }}>
                        {q.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            className={`btn ${currentAns === opt ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.85rem' }}
                            onClick={() => {
                              setReadingAnswers(prev => ({ ...prev, [q.id]: opt }));
                              const isCorrect = opt === q.correctAnswer;
                              setReadingFeedback(prev => ({
                                ...prev,
                                [q.id]: {
                                  isCorrect,
                                  exp: isCorrect ? 'Harika! Doğru cevap.' : (q.explanation || 'Seçtiğin cevap metindeki bilgiyle uyuşmuyor.')
                                }
                              }));
                              if (isCorrect) {
                                voiceService.current.speak('Correct answer!', 'en-US');
                              } else {
                                voiceService.current.speak('Incorrect. Review the passage details.', 'en-US');
                              }
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {fb && (
                        <div style={{
                          marginTop: '10px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          backgroundColor: fb.isCorrect ? '#10b98120' : '#ef444420',
                          color: fb.isCorrect ? '#10b981' : '#ef4444',
                          border: `1px solid ${fb.isCorrect ? '#10b98140' : '#ef444440'}`
                        }}>
                          {fb.exp}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Boşluk Doldurma Alıştırması (Cloze Test) */}
          {clozeTest ? (
            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {clozeTest.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Yerel boşluk doldurma ve bağlamsal kelime alıştırması.
                  </p>
                </div>
                <span className="badge badge-tamamlandi" style={{ fontSize: '0.75rem' }}>
                  Boşluk Doldurma
                </span>
              </div>

              {/* Boşluklu Metin */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px', fontSize: '0.95rem', lineHeight: 2.2, color: 'var(--text-primary)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                {clozeTest.blanks.map((b) => (
                  <span key={b.id} style={{ display: 'inline-block', margin: '0 4px' }}>
                    <select
                      className="chat-input"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        borderColor: clozeFeedback[b.id] === undefined ? 'var(--border-color)' : clozeFeedback[b.id] ? '#10b981' : '#ef4444',
                        backgroundColor: clozeFeedback[b.id] === undefined ? 'var(--bg-card)' : clozeFeedback[b.id] ? '#10b98115' : '#ef444415'
                      }}
                      value={clozeSelections[b.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClozeSelections(prev => ({ ...prev, [b.id]: val }));
                        setClozeFeedback(prev => ({ ...prev, [b.id]: val === b.correct }));
                        if (val === b.correct) {
                          voiceService.current.speakManually(val, 'en-US');
                        }
                      }}
                    >
                      <option value="">(Seçiniz: {b.hint})</option>
                      {b.options.map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </span>
                ))}
              </div>

              {/* İpuçları */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Kelime İpuçları:</strong>
                {clozeTest.blanks.map(b => (
                  <div key={b.id}>
                    • <strong>[{b.id}]:</strong> {b.hint}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      </>}
      {/* Geliştirici İmzası & Alt Bilgi */}
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', marginTop: '20px' }}>
        Yazılımcı: M. SENCER EKŞİOĞLU (Tired Warrior Jr)
      </div>

      {/* Açık Veri & Lisans Stüdyosu Modal */}

    </div>
  );
};
