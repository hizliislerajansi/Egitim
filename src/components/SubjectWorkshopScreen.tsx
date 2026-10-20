import {detailedLesson,detailedLessonUrl} from '../services/detailedLessons';
import {DetailedLessonPlayer} from './DetailedLessonPlayer';
import {requestAlternative,type AlternativeExplanation} from '../services/alternativeExplanation';
import './LessonDiscovery.css';
import {studentText} from '../services/studentExperience';
import {unitQuestions} from '../services/unitQuestionBank';
const EnglishModules=lazy(()=>import('./EnglishLabScreen').then(m=>({default:m.EnglishLabScreen})));
import {LessonTutor} from './LessonTutor';
import {CafePractice} from './CafePractice';
import {englishLocation} from '../services/englishRoutes';
import {UnitExam} from './UnitExam';
import {validateMathAnswer} from '../services/mathValidator';
import {getDb} from '../db/database';
import {FunctionGraph} from './FunctionGraph';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
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
  Award,
  Zap,
  FlaskConical,
  Dna,
  Landmark,
  Globe,
  Languages,
  HeartHandshake,
  ChevronLeft,
  ChevronDown,
  Download,
  Play,
  FileText,
  Cpu
} from 'lucide-react';
import {readSetting,writeSetting} from '../services/apiClient';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';
import { TOPIC_LECTURES, TopicLecture } from '../data/topicLectures';
import { MEB_SUBJECTS, MEB_TOPICS } from '../data/mebCurriculum';
import { Question, Subject } from '../types/database';
import { getVoiceService } from '../services/voiceService';
import { AiAdapter } from '../services/aiAdapter';
import { CrossCurricularProjectsModal } from './CrossCurricularProjectsModal';
import { LectureVisualStage } from './visuals/LectureVisualStage';
import { EDUCATIONAL_CATALOG, EducationalCatalogItem, CatalogSourceCategory } from '../data/educationalCatalog';

interface SubjectWorkshopScreenProps {
  initialSubjectId?: string;
  onSelectSubject?: (id:string)=>void;
  onBackToDashboard?: () => void;
}

export const SubjectWorkshopScreen: React.FC<SubjectWorkshopScreenProps> = ({
  initialSubjectId = 'subj_math',
  onSelectSubject,
  onBackToDashboard
}) => {
  const [alternative,setAlternative]=useState<(AlternativeExplanation & {topicId:string})|null>(null);
  const alternativeAttempt=useRef(0);
  const [detailUrl,setDetailUrl]=useState<string|null>(null),[detailOpen,setDetailOpen]=useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const subjects: Subject[] = MEB_SUBJECTS;
  
  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectTopics = MEB_TOPICS.filter(t => t.subject_id === selectedSubjectId);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(()=>readSetting<string>('lesson_topic_'+initialSubjectId,subjectTopics[0]?.id || ''));
  
  // Seçili konunun seçili derse ait olduğunu doğrula (ders karışmasını %100 önler)
  const activeTopicId = subjectTopics.some(t => t.id === selectedTopicId)
    ? selectedTopicId
    : (subjectTopics[0]?.id || '');
  useEffect(()=>{alternativeAttempt.current+=100;setAlternative(null);},[activeTopicId]);

  // 5 Sekme: 'lecture' (Konu Anlatımı), 'exercises' (Alıştırmalar), 'solutions' (Soru Çözümü), 'catalog' (Eğitim Kataloğu & Kitaplar), 'notes' (Notlarım)
  const [activeTab, setActiveTab] = useState<'lecture' | 'exercises' | 'solutions' | 'catalog' | 'notes' | 'english_tools' | 'cafe'>('lecture');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<CatalogSourceCategory | 'all'>('all');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string; explanation: string } | null>(null);
  const [sessionId] = useState(() => {
    const previous=readSetting<string>('lesson_session_'+initialSubjectId,'');
    if(previous&&getDb().queryOne('SELECT id FROM study_sessions WHERE id=? AND subject_id=? AND end_time IS NULL',[previous,initialSubjectId]))return previous;
    const id=OfflineQuestionEngine.startSession(initialSubjectId,'subject_workshop');writeSetting('lesson_session_'+initialSubjectId,id);return id;
  });
  const [lessonNote,setLessonNote]=useState('');
  const [cafeContext,setCafeContext]=useState({question:'',answer:''});
  const [saveStatus,setSaveStatus]=useState('Kaydedildi');
  const [focused,setFocused]=useState(()=>readSetting('lesson_focus',false));
  const hydrated=useRef('');
  const requestVersion=useRef(0);
  const mounted=useRef(true);
  useEffect(()=>{if(selectedSubjectId!=='subj_eng')return;const pop=()=>{setActiveTab(englishLocation(window.location.search).panel?'english_tools':'lecture');};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[selectedSubjectId]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;requestVersion.current++;};},[]);
  useEffect(()=>{document.querySelector('.app-container')?.classList.toggle('lesson-focused',focused);writeSetting('lesson_focus',focused);return()=>document.querySelector('.app-container')?.classList.remove('lesson-focused');},[focused]);

  // 3 Yanlış Bekleme, Otomatik Basit Anlatım & Konu Sonu Tekrar Sistemi
  const [wrongCount, setWrongCount] = useState(0);
  const [failedQuestionsQueue, setFailedQuestionsQueue] = useState<Question[]>([]);
  const [simplifiedExplanation, setSimplifiedExplanation] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isTopicCompleted, setIsTopicCompleted] = useState(false);

  // Sesli Anlatım & STT mikrofon
  const [isListening, setIsListening] = useState(false);
  const [aiTeacherHint, setAiTeacherHint] = useState<string | null>(null);
  const [isLoadingAiHint, setIsLoadingAiHint] = useState(false);
  const [isCrossProjectOpen, setIsCrossProjectOpen] = useState(false);

  const voiceService = useRef(getVoiceService());
  const currentLecture: TopicLecture | undefined = TOPIC_LECTURES[activeTopicId] || TOPIC_LECTURES[subjectTopics[0]?.id];
  useEffect(()=>{let alive=true;let ownedUrl:string|null=null;setDetailOpen(false);setDetailUrl(null);void detailedLessonUrl(activeTopicId).then(url=>{if(!alive){if(url?.startsWith('blob:'))URL.revokeObjectURL(url);return;}ownedUrl=url;setDetailUrl(url);});return()=>{alive=false;if(ownedUrl?.startsWith('blob:'))URL.revokeObjectURL(ownedUrl);};},[activeTopicId]);
  const openDetailed=()=>{if(!detailUrl)return;getVoiceService().stopSpeaking();setActiveTab('lecture');setDetailOpen(true);};

  // Ders değiştiğinde ilk konuyu güvenli şekilde seç
  const handleSelectSubject = (subjId: string) => {
    if(onSelectSubject){onSelectSubject(subjId);return;}
    setSelectedSubjectId(subjId);
    const newTopics = MEB_TOPICS.filter(t => t.subject_id === subjId);
    if (newTopics.length > 0) {
      setSelectedTopicId(readSetting<string>('lesson_topic_'+subjId,newTopics[0].id));
    }
    setActiveTab('lecture');
    stopAudio();
  };

  // initialSubjectId değiştiğinde dersi güncelle (ana sayfadan ders seçildiğinde)
  useEffect(() => {
    if (initialSubjectId && initialSubjectId !== selectedSubjectId) {
      setSelectedSubjectId(initialSubjectId);
      const newTopics = MEB_TOPICS.filter(t => t.subject_id === initialSubjectId);
      if (newTopics.length > 0) {
        setSelectedTopicId(readSetting<string>('lesson_topic_'+initialSubjectId,newTopics[0].id));
      }
      setActiveTab('lecture');
      stopAudio();
    }
  }, [initialSubjectId]);

  // Konu veya ders değiştiğinde soruları yükle ve ÖNCE Konu Anlatımına geç
  useEffect(() => {
    if (!activeTopicId) return;
    const qList = OfflineQuestionEngine.getQuestionsByTopic(activeTopicId);
    requestVersion.current++;
    setIsLoadingAiHint(false);
    const saved=readSetting<{questionId?:string;answer?:string;hint?:number;tab?:typeof activeTab;result?:typeof result;wrong?:number;queue?:string[];review?:boolean;completed?:boolean;note?:string}>('lesson_draft_'+activeTopicId,{});
    const reviewList=saved.review?qList.filter(q=>saved.queue?.includes(q.id)||q.id===saved.questionId):qList;
    setQuestions(reviewList.length?reviewList:qList);
    setLessonNote(saved.note||'');
    setCurrentIndex(Math.max(0,(reviewList.length?reviewList:qList).findIndex(q=>q.id===saved.questionId)));
    setInputAnswer(saved.answer||'');
    setHintLevel(Math.min(2,Math.max(0,saved.hint||0)));
    setResult(saved.result||null);
    setAiTeacherHint(null);
    setSimplifiedExplanation(null);
    setWrongCount(saved.wrong||0);
    setFailedQuestionsQueue(qList.filter(q=>saved.queue?.includes(q.id)));
    setIsReviewMode(saved.review||false);
    setIsTopicCompleted(saved.completed||false);
    setActiveTab(selectedSubjectId==='subj_eng'&&englishLocation(window.location.search).panel?'english_tools':saved.tab||'lecture');
    hydrated.current=activeTopicId;
    stopAudio();
  }, [activeTopicId, selectedSubjectId]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    voiceService.current.stopSpeaking();
    voiceService.current.stopListening();
    setIsListening(false);
  };

  const questionStart=useRef(Date.now());
  useEffect(()=>{questionStart.current=Date.now();},[activeTopicId,currentIndex]);
  const currentQ = questions[currentIndex];
  useEffect(()=>{
    if(!currentQ||hydrated.current!==activeTopicId||currentQ.topic_id!==activeTopicId)return;
    setSaveStatus('Kaydediliyor');
    let saved=false;
    const flush=()=>{if(saved)return;try{
      writeSetting('lesson_draft_'+activeTopicId,{questionId:currentQ.id,answer:inputAnswer,hint:hintLevel,tab:activeTab,result,wrong:wrongCount,queue:failedQuestionsQueue.map(q=>q.id),review:isReviewMode,completed:isTopicCompleted,note:lessonNote});
      // Confirm durable export; database writes otherwise swallow capacity failures.
      if(getDb().getPersistenceError())throw new Error('Depolama hatası');
      saved=true;setSaveStatus('Kaydedildi');
    }catch{setSaveStatus('Kayıt hatası: cihaz depolamasını kontrol edin');}};
    const timer=window.setTimeout(flush,250);window.addEventListener('pagehide',flush);
    return()=>{window.clearTimeout(timer);window.removeEventListener('pagehide',flush);flush();};
  },[activeTopicId,currentQ,inputAnswer,hintLevel,activeTab,result,wrongCount,failedQuestionsQueue,isReviewMode,isTopicCompleted,lessonNote]);
  const isMultipleChoice = currentQ?.question_type === 'multiple_choice';
  const options: string[] = currentQ?.options_json ? JSON.parse(currentQ.options_json) : [];

  // Sesli Soru Dinleme
  const handleSpeakQuestion = () => {
    if (!currentQ) return;
    const lang = selectedSubjectId === 'subj_eng' ? 'en-US' : 'tr-TR';
    voiceService.current.speakManually(currentQ.question_text, lang);
  };

  // Mikrofonla Sesli Cevap
  const handleToggleMic = () => {
    if (isListening) {
      voiceService.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      const lang = selectedSubjectId === 'subj_eng' ? 'en-US' : 'tr-TR';
      voiceService.current.setOptions({
        lang,
        onTranscript: (text) => {
          if (isMultipleChoice && options.length > 0) {
            const matched = options.find(o => o.toLowerCase() === text.trim().toLowerCase());
            setInputAnswer(matched || text.trim());
          } else {
            setInputAnswer(text.trim());
          }
          setIsListening(false);
        },
        onError: () => setIsListening(false)
      });
      voiceService.current.startListening(lang);
    }
  };

  const handleCheckAnswer = () => {
    if (!inputAnswer.trim() || !currentQ || result?.isCorrect || wrongCount>=3) return;
    const lang = selectedSubjectId === 'subj_eng' ? 'en-US' : 'tr-TR';
    const isCorrect = currentQ.question_type==='open_math' ? validateMathAnswer(inputAnswer,currentQ.correct_answer).isValid : inputAnswer.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();

    if (isCorrect) {
      const res = OfflineQuestionEngine.submitAnswer({
        sessionId,
        questionId: currentQ.id,
        studentAnswer: inputAnswer.trim(),
        hintsUsed: hintLevel,
        timeSpentSeconds: Math.max(0,Math.round((Date.now()-questionStart.current)/1000)),
        errorCategory: 'Kavram Yanılgısı'
      });

      setResult({
        isCorrect: true,
        feedback: 'Tebrikler! Doğru cevap.',
        explanation: currentQ.solution_explanation || res.explanation
      });
      setSimplifiedExplanation(null);
      // Tekrar modundaysa veya daha önce yanlış yapıldıysa kuyruktan temizle
      setFailedQuestionsQueue(prev => prev.filter(q => q.id !== currentQ.id));
      voiceService.current.speak('Tebrikler! Doğru cevap.', lang);
    } else {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);

      if (newWrong < 3) {
        // 1. veya 2. Yanlış: Daha basit anlatım otomatik oluşturulur, diğer soruya geçilemez!
        let simpleText = '';
        if (newWrong === 1) {
          const keyPt = currentLecture?.keyPoints?.[0] || 'Konunun ana kuralını göz önünde bulundur.';
          simpleText = `1. Basitleştirilmiş Anlatım (Temel Mantık): ${keyPt} Soruda verilen temel ifadelere ve senden istenene odaklan.`;
        } else {
          const hint = currentQ.hint_1 || currentQ.hint_2 || 'Şıkları tek tek inceleyerek mantık yürüt.';
          const rule = currentLecture?.formulasOrRules?.[0]?.content ? ` Hatırlatma Kuralı: ${currentLecture.formulasOrRules[0].content}` : '';
          simpleText = `2. Süper Basit Adım Adım İpucu: ${hint}${rule} Sakin ol, bir şıkkı eleyerek tekrar dene.`;
        }

        setSimplifiedExplanation(simpleText);
        setResult({
          isCorrect: false,
          feedback: `Yanıtın tam doğru değil. (${newWrong}. Yanlış — Diğer soruya geçmek için 3 yanlış beklenir. Kalan hak: ${3 - newWrong})`,
          explanation: ''
        });
        voiceService.current.speak(`Yanıt doğru değil. İşte senin için daha basit bir anlatım: ${simpleText}`, lang);
      } else {
        // 3. Yanlış yapıldı: Artık sonraki soruya geçilebilir, soru konu sonu tekrarına kaydedilir!
        const res = OfflineQuestionEngine.submitAnswer({
          sessionId,
          questionId: currentQ.id,
          studentAnswer: inputAnswer.trim(),
          hintsUsed: hintLevel,
          timeSpentSeconds: Math.max(0,Math.round((Date.now()-questionStart.current)/1000)),
          errorCategory: 'Kavram Yanılgısı'
        });

        setFailedQuestionsQueue(prev => prev.some(q => q.id === currentQ.id) ? prev : [...prev, currentQ]);
        setSimplifiedExplanation('3. Çözüm Analizi: Bu soruda 3 kez hata yapıldı. Konuyu tam kavraman için bu soru ünite/konu bittiğinde tekrar karşına çıkacak!');
        setResult({
          isCorrect: false,
          feedback: `3 Yanlış Yapıldı! Doğru Cevap: ${currentQ.correct_answer}`,
          explanation: `Doğru Çözüm:\n${currentQ.solution_explanation || res.explanation}`
        });
        voiceService.current.speak(`3 yanlış yapıldı. Doğru cevap: ${currentQ.correct_answer}. Bu soru konu sonunda tekrar çözülecektir.`, lang);
      }
    }
  };

  const handleRetryQuestion = () => {
    setInputAnswer('');
    setResult(null);
  };

  const handleNextQuestion = () => {
    setInputAnswer('');
    setHintLevel(0);
    setResult(null);
    setAiTeacherHint(null);
    setSimplifiedExplanation(null);
    setWrongCount(0);
    stopAudio();

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Konudaki tüm sorular bitti! Yanlış havuzunu kontrol et:
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

  // PDF Ders Özeti İndirme / Yazdırma Fonksiyonu
  const handleDownloadPdf = () => {
    if (!currentLecture) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Yazdırma penceresi açılamadı. Lütfen açılır pencerelere izin verin.');
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>${currentSubject.name} - ${currentLecture.title} Ders Özeti</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 820px; margin: auto; }
          h1 { color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 10px; }
          h2 { color: #0f172a; margin-top: 24px; font-size: 1.25rem; border-left: 4px solid #2563eb; padding-left: 10px; }
          .badge { background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 0.85rem; }
          .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 16px 0; border-radius: 8px; line-height: 1.7; }
          ul { line-height: 1.8; }
          .formula-box { background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-weight: bold; margin: 12px 0; color: #1d4ed8; }
          .q-box { margin: 14px 0; padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fafafa; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 0.8rem; color: #64748b; text-align: center; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <span class="badge">${currentSubject.name} • ${currentLecture.unit}</span>
        <h1>${currentLecture.title}</h1>
        <p><strong>Kazanım Hedefi:</strong> ${currentLecture.outcome}</p>
        
        <h2>1. Konu Özeti</h2>
        <div class="summary-box">${currentLecture.summary}</div>

        <h2>2. Kritik Püf Noktaları</h2>
        <ul>
          ${currentLecture.keyPoints.map(p => `<li>${p}</li>`).join('')}
        </ul>

        ${currentLecture.formulasOrRules.length > 0 ? `
          <h2>3. Temel Kurallar ve Formüller</h2>
          ${currentLecture.formulasOrRules.map(f => `
            <div class="formula-box">
              <div><strong>${f.title}</strong></div>
              <div style="font-size: 1.05rem; margin-top: 4px;">${f.content}</div>
            </div>
          `).join('')}
        ` : ''}

        <h2>4. Alıştırma Soruları</h2>
        ${questions.slice(0, 5).map((q, idx) => `
          <div class="q-box">
            <strong>Soru ${idx + 1}:</strong> ${q.question_text}<br/>
            <div style="margin-top: 8px; color: #059669;"><strong>Doğru Cevap:</strong> ${q.correct_answer}</div>
            ${q.solution_explanation ? `<div style="margin-top: 4px; font-size: 0.9rem; color: #475569;">${q.solution_explanation}</div>` : ''}
          </div>
        `).join('')}

        <div class="footer">
          DersPusulası Lise 1 • Yazılımcı: M. SENCER EKŞİOĞLU (Tired Warrior Jr)
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Yalnızca o dersin branş öğretmeninden ipucu iste
  const handleAskAiTeacherForHint = async () => {
    if (!currentQ || isLoadingAiHint) return;
    setIsLoadingAiHint(true);
    const version=++requestVersion.current;
    try {
      const response = await AiAdapter.request({
        role: 'subject_teacher',
        subjectCode: currentSubject.code as any,
        taskType: 'hint',
        topicName: currentLecture?.title,
        contextSummary: JSON.stringify({subject:currentSubject.name,topic:activeTopicId,goal:currentLecture?.outcome,level:'9. sınıf',answer:inputAnswer,hints:hintLevel,wrongAttempts:wrongCount}),
        userMessage: `${currentSubject.name} dersinde şu soruyu çözüyorum: "${currentQ.question_text}". Cevabı vermeden bana yönlendirici bir ipucu verir misin?`
      });
      if(!mounted.current||version!==requestVersion.current)return;
      setAiTeacherHint((String(response.provider)==='mock'?'Yerel rehber (bulut Yanıt değil): ':'')+response.text);
      voiceService.current.speak(studentText(response.text), 'tr-TR');
    } catch (e: any) {
      if(mounted.current&&version===requestVersion.current)setAiTeacherHint('Rehber bağlantısı kurulamadı. Yerel ipucu: '+(currentQ.hint_1||'Konunun temel tanımını incele.'));
    } finally {
      if(mounted.current&&version===requestVersion.current)setIsLoadingAiHint(false);
    }
  };

  return (
    <div className="dp-lesson-detail-page lesson-discovery">
      <aside className="discovery-rail" aria-label="Konu akışı">
        <button className="discovery-home" onClick={onBackToDashboard}><ChevronLeft size={16}/> Derslerime dön</button>
        <div className="discovery-brand"><Sparkles size={22}/><span>Keşif alanı</span></div>
        <label className="discovery-course">Ders seçimi<select aria-label="Ders seçimi" value={selectedSubjectId} onChange={e=>handleSelectSubject(e.target.value)}>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <h2>Öğrenme yolun</h2>
        <p className="discovery-rail-caption">Her konu, yeni bir keşif.</p>
        <ol className="discovery-topics">{subjectTopics.map((topic,index)=><li key={topic.id}><button aria-current={topic.id===activeTopicId?'step':undefined} onClick={()=>{stopAudio();setSelectedTopicId(topic.id);writeSetting('lesson_topic_'+selectedSubjectId,topic.id);setActiveTab('lecture');}}><span className="discovery-topic-number">{topic.id===activeTopicId?<Sparkles size={19}/>:index+1}</span><span><strong>{topic.name}</strong><small>{topic.id===activeTopicId?'Şimdi keşfediyorsun':'Konuyu aç'}</small></span></button></li>)}</ol>
        <div className="product-actions discovery-topic-paging"><button className="btn btn-secondary" disabled={subjectTopics.findIndex(t=>t.id===activeTopicId)<=0} onClick={()=>{const i=subjectTopics.findIndex(t=>t.id===activeTopicId);stopAudio();setSelectedTopicId(subjectTopics[i-1].id);writeSetting('lesson_topic_'+selectedSubjectId,subjectTopics[i-1].id);setActiveTab('lecture');}}>Önceki konu</button><button className="btn btn-secondary" disabled={subjectTopics.findIndex(t=>t.id===activeTopicId)>=subjectTopics.length-1} onClick={()=>{const i=subjectTopics.findIndex(t=>t.id===activeTopicId);stopAudio();setSelectedTopicId(subjectTopics[i+1].id);writeSetting('lesson_topic_'+selectedSubjectId,subjectTopics[i+1].id);setActiveTab('lecture');}}>Sonraki konu</button></div>
        <div className="discovery-position"><BookOpen size={20}/><div><strong>Konu {subjectTopics.findIndex(t=>t.id===activeTopicId)+1} / {subjectTopics.length}</strong><span>{currentSubject.name}</span></div></div>
      </aside>
      <section className="discovery-workspace" aria-label="Ders çalışma alanı">
      <div className="discovery-utility-bar">
      <div className="lesson-controls"><button className="btn btn-secondary" aria-pressed={focused} onClick={()=>setFocused(!focused)}>{focused?'Odak modundan çık':'Odak modu'}</button><span role="status">{saveStatus}</span></div>
      {selectedSubjectId==='subj_math'&&activeTab==='lecture'&&<details><summary>Fonksiyonu keşfet: değişkenleri değiştir</summary><FunctionGraph/></details>}
      <LessonTutor onDetailedExplanation={detailUrl?openDetailed:undefined} onExplainDifferently={currentLecture?async()=>{const attempt=++alternativeAttempt.current;const next=await requestAlternative(currentLecture,attempt,alternative?.topicId===activeTopicId?alternative:undefined);if(attempt===alternativeAttempt.current){setAlternative({...next,topicId:activeTopicId});setActiveTab('lecture');}return next.narration;}:undefined} subject={currentSubject.name} code={currentSubject.code} topic={activeTab==='cafe'?'A2 · Kafede sipariş verme':currentLecture?.title||activeTopicId} goal={activeTab==='cafe'?'Kibarca sipariş ver ve servis tercihini belirt':currentLecture?.outcome||''} question={activeTab==='cafe'?cafeContext.question:currentQ?.question_text||''} answer={activeTab==='cafe'?cafeContext.answer:inputAnswer} mistakes={wrongCount}/>
      {detailUrl&&<button className="btn btn-primary" onClick={openDetailed}>Daha detaylı anlat</button>}
      </div>
      {selectedSubjectId==='subj_eng'&&activeTab==='cafe'&&<CafePractice onContext={setCafeContext}/>}
      {selectedSubjectId==='subj_eng'&&<button className="btn btn-secondary" onClick={()=>{stopAudio();setActiveTab('cafe');}}>Konuşma: kafede sipariş verme</button>}
      {selectedSubjectId==='subj_eng'&&<button className="btn btn-secondary" onClick={()=>{stopAudio();setActiveTab(activeTab==='english_tools'?'lecture':'english_tools');}}>{activeTab==='english_tools'?'Konuya dön':'İngilizce modülleri: kelime, okuma ve dilbilgisi'}</button>}
      {selectedSubjectId==='subj_eng'&&activeTab==='english_tools'&&<Suspense fallback={<p role="status">Dil araçları yükleniyor…</p>}><EnglishModules/></Suspense>}
      {/* 1. Üst Bar: Geri Butonu + Tek Ders/Konu Başlığı + Sayfa/Konu Sayacı */}
      <div className="dp-lesson-topbar">
        <div className="dp-topbar-left">
          {onBackToDashboard && (
            <button className="dp-back-button" onClick={onBackToDashboard} title="Ders Seçimine Geri Dön">
              <ChevronLeft size={18} />
              <span>Ders Seçimine Dön</span>
            </button>
          )}

          <div className="dp-lesson-badge-icon">
            <span>{currentSubject.code === 'MATH' ? 'π' : currentSubject.code === 'ENG' ? '🇬🇧' : '📖'}</span>
          </div>

          <div className="dp-lesson-titles">
            <span className="dp-lesson-subject-name">{currentSubject.name}</span>
            <h1 className="dp-lesson-topic-title">{activeTab==='cafe'?'A2 · Kafede sipariş verme':currentLecture?.title || 'Konu'}</h1>
          </div>
        </div>

        <div className="dp-topbar-right">
          <div className="dp-topic-counter-badge">
            <span>{subjectTopics.findIndex(t => t.id === activeTopicId) + 1} / {subjectTopics.length}</span>
          </div>

          <div className="dp-topic-select-wrap">
            <select 
              value={activeTopicId} 
              onChange={e => {setSelectedTopicId(e.target.value);writeSetting('lesson_topic_'+selectedSubjectId,e.target.value);}}
              aria-label="Konu seçimi" className="dp-topic-select"
            >
              {subjectTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Yatay Sekmeler: Konu Anlatımı | Alıştırmalar | Soru Çözümü | Çok Kaynaklı Eğitim Kataloğu | Notlarım */}
      <div className="dp-lesson-tabs-bar">
        <button 
          className={`dp-lesson-tab ${activeTab === 'lecture' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('lecture'); stopAudio(); }}
        >
          Konu Anlatımı
        </button>

        <button 
          className={`dp-lesson-tab ${activeTab === 'exercises' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('exercises'); stopAudio(); }}
        >
          Alıştırmalar
        </button>

        <button 
          className={`dp-lesson-tab ${activeTab === 'solutions' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('solutions'); stopAudio(); }}
        >
          Soru Çözümü ({questions.length})
        </button>


        <button 
          className={`dp-lesson-tab ${activeTab === 'notes' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('notes'); stopAudio(); }}
        >
          Notlarım
        </button>

        <button 
          className="dp-lesson-tab"
          style={{ marginLeft: 'auto', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => { stopAudio(); setIsCrossProjectOpen(true); }}
          title="MEB 9. Sınıf Disiplinlerarası Proje ve Kodlama Atölyesi"
        >
          <Cpu size={15} /> Disiplinlerarası Projeler (Sandbox)
        </button>
      </div>

      {/* 3. ANA İÇERİK BÖLÜMÜ */}
      {activeTab === 'lecture' && currentLecture && (
        <div className="dp-lecture-layout">
          {/* Sol Kolon: Video & İnteraktif Kart */}
          <div className="dp-lecture-video-card">
            <div className="dp-video-header">
              <h3 className="dp-video-title">{currentLecture.title}</h3>
              <div className="dp-video-actions">
                <span className="dp-badge-meb" style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>
                  Görsel ve sesli anlatım
                </span>
              </div>
            </div>

            {/* Görsel ve Animasyonlu Konu Simülatörü */}
            <div id="detailed-lesson-stage">{detailOpen&&detailUrl?<DetailedLessonPlayer url={detailUrl} title={detailedLesson(activeTopicId)?.title||currentLecture.title} onClose={()=>setDetailOpen(false)}/>:<LectureVisualStage topicId={activeTopicId} lecture={currentLecture} alternative={alternative?.topicId===activeTopicId?alternative:undefined} />}</div>

            {/* Şimdi Sıra Sende! Çağrı Kartı */}
            <div className="dp-callout-card">
              <div className="dp-callout-icon-col">
                <div className="dp-callout-star">🎯</div>
              </div>
              <div className="dp-callout-content">
                <h4>Şimdi Sıra Sende!</h4>
                <p>Konuya uygun {questions.length} soruluk bir alıştırma seni bekliyor.</p>
                <button 
                  className="dp-btn-primary mt-8"
                  onClick={() => { setActiveTab('solutions'); stopAudio(); }}
                >
                  Alıştırmayı Başlat
                </button>
              </div>
              <div className="dp-callout-mascot">⭐</div>
            </div>
          </div>

          {/* Sağ Kolon: Konu Özeti & PDF İndir */}
          <div className="dp-lecture-summary-sidebar">
            <div className="dp-card">
              <div className="dp-summary-head">
                <h4 className="dp-card-title">Sana özel kaynaklar</h4>
              </div>

              <ul className="dp-summary-checklist">
                {currentLecture.keyPoints.map((kp, idx) => (
                  <li key={idx} className="dp-checklist-item">
                    <Check size={16} color="#10b981" />
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>

              {currentLecture.formulasOrRules.length > 0 && (
                <div className="dp-formula-box">
                  <span className="dp-formula-label">Temel Formül:</span>
                  <p className="dp-formula-code">{currentLecture.formulasOrRules[0].content}</p>
                </div>
              )}

              <button className="dp-btn-pdf-download" onClick={handleDownloadPdf}>
                <Download size={15} /> Özet PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soru Çözümü / Alıştırmalar Sekmesi */}
      {(activeTab === 'solutions' || activeTab === 'exercises') && (
        <div className="dp-card dp-practice-pane">
          {isTopicCompleted ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', margin: 0 }}>
                Konu Başarıyla Tamamlandı!
              </h3>
              <p style={{ maxWidth: '540px', margin: '12px auto 20px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                "{currentLecture?.title}" konusundaki tüm soruları ve 3 yanlış yaptığın tekrar sorularını başarıyla tamamladın. Ustalık seviyen kaydedildi!
              </p>
              <button 
                className="dp-btn-primary" 
                onClick={() => {
                  setIsTopicCompleted(false);
                  const qList = OfflineQuestionEngine.getQuestionsByTopic(activeTopicId);
                  setQuestions(qList);
                  setCurrentIndex(0);
                  setWrongCount(0);
                  setFailedQuestionsQueue([]);
                }}
              >
                Konu Sorularını Baştan Tekrar Çöz
              </button>
            </div>
          ) : currentQ ? (
            <div>
              {/* Yanlış Sorular Tekrar Modu Bilgilendirmesi */}
              {isReviewMode && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎯</span>
                  <span><strong>Yanlış Sorular Tekrarı:</strong> Konu içinde 3 yanlış yaptığın sorular pekiştirilmek üzere tekrar soruluyor!</span>
                </div>
              )}

              <div className="dp-card-head">
                <div>
                  <h3 className="dp-card-title">
                    Soru {currentIndex + 1} / {questions.length}
                  </h3>
                  <span className="dp-question-topic-badge">
                    {currentSubject.name} • {currentLecture?.title}
                  </span>
                  {wrongCount > 0 && !result?.isCorrect && (
                    <span style={{ marginLeft: '10px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '6px' }}>
                      Yanlış Deneme: {wrongCount} / 3
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" onClick={handleSpeakQuestion}>
                    <Volume2 size={16} /> Soruyu Dinle
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('lecture')}>
                    Konu Anlatımına Dön
                  </button>
                </div>
              </div>

              <div className="dp-question-text">
                {currentQ.question_text}
              </div>

              {/* Seçenekler */}
              {isMultipleChoice ? (
                <div className="dp-options-container">
                  {options.map((opt, i) => {
                    const isSelected = inputAnswer === opt;
                    let styleClass = '';
                    if (result) {
                      if (opt === currentQ.correct_answer && (result.isCorrect || wrongCount >= 3)) styleClass = 'correct';
                      else if (isSelected && !result.isCorrect) styleClass = 'wrong';
                    } else if (isSelected) {
                      styleClass = 'selected';
                    }

                    return (
                      <button
                        key={i}
                        className={`dp-option-btn ${styleClass}`}
                        onClick={() => !result && setInputAnswer(opt)}
                      >
                        <span className="dp-opt-bullet">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ margin: '20px 0' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      aria-label="Sorunun cevabı" type="text"
                      className="chat-input"
                      placeholder="Cevabınızı yazın veya sesle söyleyin..."
                      value={inputAnswer}
                      onChange={e => setInputAnswer(e.target.value)}
                    />
                    <button className="btn btn-secondary" onClick={handleToggleMic}>
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      <span>{isListening ? 'Dinleniyor...' : 'Sesle Cevapla'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* İpuçları */}
              {hintLevel > 0 && (
                <div className="dp-hint-box">
                  <div className="dp-hint-head">
                    <Lightbulb size={16} /> İpucu {hintLevel}
                  </div>
                  <p>{hintLevel === 1 ? currentQ.hint_1 : currentQ.hint_2}</p>
                </div>
              )}

              {/* Dinamik AI İpucu */}
              {aiTeacherHint && (
                <div className="dp-ai-hint-box">
                  <div className="dp-ai-hint-head">
                    <Sparkles size={16} /> Rehber {currentSubject.name} Öğretmeni İpucu
                  </div>
                  <p>{studentText(aiTeacherHint)}</p>
                </div>
              )}

              {/* Otomatik Basitleştirilmiş Anlatım Kutusu */}
              {simplifiedExplanation && (
                <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #2563eb', padding: '12px 14px', borderRadius: '8px', margin: '14px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1d4ed8', fontSize: '0.88rem', marginBottom: '4px' }}>
                    <Sparkles size={16} />
                    <span>Otomatik Daha Basit Anlatım:</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.5 }}>
                    {simplifiedExplanation}
                  </div>
                </div>
              )}

              {/* Sonuç & Çözüm */}
              {result && (
                <div className={`dp-result-banner ${result.isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="dp-result-title">
                    {result.isCorrect ? <Check size={18} /> : <X size={18} />}
                    <span>{result.feedback}</span>
                  </div>
                  {result.explanation && (
                    <div className="dp-result-explanation">
                      <strong>Çözüm Adımları:</strong><br />{result.explanation}
                    </div>
                  )}
                </div>
              )}

              {/* Alt Butonlar */}
              <div className="dp-practice-footer">
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!result && (
                    <>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setHintLevel(prev => Math.min(2, prev + 1))}
                        disabled={hintLevel >= 2}
                      >
                        <HelpCircle size={15} /> İpucu Al
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={handleAskAiTeacherForHint}
                        disabled={isLoadingAiHint}
                      >
                        <Sparkles size={15} /> {isLoadingAiHint ? 'Hazırlanıyor…' : 'Öğretmenden İpucu'}
                      </button>
                    </>
                  )}
                </div>

                <div>
                  {!result ? (
                    <button 
                      className="dp-btn-primary" 
                      disabled={!inputAnswer.trim()} 
                      onClick={handleCheckAnswer}
                    >
                      {wrongCount > 0 ? 'Tekrar Kontrol Et' : 'Cevabı Kontrol Et'}
                    </button>
                  ) : !result.isCorrect && wrongCount < 3 ? (
                    // 3 yanlış tamamlanana kadar diğer soruya geçilemez! Tekrar denetilir.
                    <button 
                      className="dp-btn-primary" 
                      style={{ backgroundColor: '#d97706', borderColor: '#b45309' }}
                      onClick={handleRetryQuestion}
                    >
                      <span>Tekrar Dene (Kalan Hak: {3 - wrongCount})</span>
                      <RotateCcw size={15} />
                    </button>
                  ) : (
                    <button className="dp-btn-primary" onClick={handleNextQuestion}>
                      <span>{wrongCount >= 3 ? 'Sonraki Soru (Soru Konu Sonunda Tekrar Gelecek)' : 'Sonraki Soru'}</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>Bu konu için soru yüklenemedi.</p>
          )}
        </div>
      )}

      {/* 4. Çok Kaynaklı Eğitim Kataloğu Sekmesi */}
      {activeTab === 'catalog' && (
        <div className="dp-catalog-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Kaynak Filtreleme Butonları */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>KAYNAK TÜRÜ:</span>
            {[
              { id: 'all', label: 'Tüm Kaynaklar' },
              { id: 'meb_official', label: '🏛️ MEB Resmî Müfredat' },
              { id: 'trial_exam', label: '📝 Deneme Sınavları' },
              { id: 'private_school_book', label: '🏫 Özel Okul / Yayınevi' },
              { id: 'open_resource', label: '🌐 Açık Eğitim & PhET' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`dp-vis-pill-btn ${selectedCatalogCategory === cat.id ? 'active' : ''}`}
                style={selectedCatalogCategory === cat.id ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb' } : {}}
                onClick={() => setSelectedCatalogCategory(cat.id as any)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Katalog Kartları Listesi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {EDUCATIONAL_CATALOG
              .filter(item => selectedSubjectId === 'all' || item.subjectId === selectedSubjectId)
              .filter(item => selectedCatalogCategory === 'all' || item.sourceCategory === selectedCatalogCategory)
              .map(item => (
                <div 
                  key={item.id} 
                  className="dp-card" 
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        background: item.sourceCategory === 'meb_official' ? 'rgba(37, 99, 235, 0.12)' : 
                                    item.sourceCategory === 'trial_exam' ? 'rgba(234, 88, 12, 0.12)' :
                                    item.sourceCategory === 'private_school_book' ? 'rgba(147, 51, 234, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: item.sourceCategory === 'meb_official' ? '#1d4ed8' : 
                               item.sourceCategory === 'trial_exam' ? '#c2410c' :
                               item.sourceCategory === 'private_school_book' ? '#7e22ce' : '#047857'
                      }}
                    >
                      {item.sourceCategory === 'meb_official' ? '🏛️ MEB Resmî Ders Kitabı' :
                       item.sourceCategory === 'trial_exam' ? '📝 Lise Deneme Sınavı' :
                       item.sourceCategory === 'private_school_book' ? '🏫 Özel Okul / Yayınevi Kataloğu' : '🌐 Açık Eğitim & Bilimsel Model'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.grade}</span>
                  </div>

                  <div>
                    <h4 style={{ margin: '2px 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.sourceTitle}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <strong>Yayın / Künye:</strong> {item.publisher} ({item.edition}) — {item.pageOrNo}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>MEB Kazanımı:</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{item.learningOutcome}</div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {item.contentSummary}
                  </p>

                  {/* Özgün Pedagojik Eşdeğer Soru */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb' }}>
                        💡 Özgün Eşdeğer Soru ({item.originalAlternativeQuestion.cognitiveLevel}):
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>Telifli asıl metin yerine pedagojik alternatif</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.originalAlternativeQuestion.question}
                    </p>
                    {item.originalAlternativeQuestion.options && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                        {item.originalAlternativeQuestion.options.map((opt, i) => (
                          <div 
                            key={i} 
                            style={{ 
                              padding: '6px 8px', 
                              borderRadius: '6px', 
                              background: opt === item.originalAlternativeQuestion.correctAnswer ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)', 
                              border: opt === item.originalAlternativeQuestion.correctAnswer ? '1px solid #10b981' : '1px solid var(--border-color)',
                              fontSize: '0.78rem',
                              fontWeight: opt === item.originalAlternativeQuestion.correctAnswer ? 700 : 500,
                              color: opt === item.originalAlternativeQuestion.correctAnswer ? '#047857' : 'var(--text-primary)'
                            }}
                          >
                            {opt} {opt === item.originalAlternativeQuestion.correctAnswer && '✓ (Doğru)'}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#475569', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px' }}>
                      <strong>Çözüm Yolu:</strong> {item.originalAlternativeQuestion.solutionExplanation}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      Lisans: {item.licenseInfo}
                    </span>
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      onClick={() => {
                        setSelectedTopicId(item.topicId);
                        setActiveTab('lecture');
                      }}
                    >
                      Konu Anlatımına Git ↗
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Notlarım Sekmesi */}
      {activeTab === 'notes' && (
        <div className="dp-card">
          <h3 className="dp-card-title mb-12">{currentLecture?.title} Notları</h3>
          <textarea 
            className="dp-editor-textarea" 
            placeholder="Bu derste öğrendiklerinizi buraya not alın..."
            aria-label="Konu notun" value={lessonNote} onChange={e=>setLessonNote(e.target.value)}
          />
          <button className="dp-btn-primary mt-12" onClick={() => {try{writeSetting('lesson_draft_'+activeTopicId,{...readSetting('lesson_draft_'+activeTopicId,{}),note:lessonNote});setSaveStatus(getDb().getPersistenceError()?'Kayıt hatası: cihaz depolamasını kontrol edin':'Kaydedildi');}catch{setSaveStatus('Kayıt hatası');}}}>
            Notu Kaydet
          </button>
        </div>
      )}

      {activeTab!=='english_tools'&&activeTab!=='cafe'&&<details open={isTopicCompleted||undefined}><summary>Ünite sonu sınavı</summary><UnitExam key={activeTopicId} profile={getDb().queryOne<{id:string}>('SELECT id FROM student_profile ORDER BY created_at,id LIMIT 1')?.id||'profile_default'} unit={selectedSubjectId+':'+(subjectTopics.find(t=>t.id===activeTopicId)?.unit||activeTopicId)} title={subjectTopics.find(t=>t.id===activeTopicId)?.unit||currentLecture?.title||'Ünite'} questions={unitQuestions(subjectTopics.filter(t=>t.unit===subjectTopics.find(a=>a.id===activeTopicId)?.unit))}/></details>}
      </section>
      <CrossCurricularProjectsModal
        isOpen={isCrossProjectOpen}
        onClose={() => setIsCrossProjectOpen(false)}
      />

    </div>
  );
};

