import {studentText} from '../services/studentExperience';
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  BookOpen,
  GraduationCap,
  Target,
  Bot,
  SlidersHorizontal,
  Lightbulb,
  Smartphone
} from 'lucide-react';
import { AiAdapter, AiResponse, AiRole, SubjectCode } from '../services/aiAdapter';
import { getVoiceService, VoiceStatus } from '../services/voiceService';
import { phoneMicService } from '../services/phoneMicService';
import { PhoneMicModal } from './PhoneMicModal';
import { VoiceMode, ConversationStyle, VoiceProvider, GeminiTtsModel, YOUNG_MALE_VOICE_PRESETS } from '../types/settings';
import { getDb } from '../db/database';
import { PROVIDER_INFO, readSetting, writeSetting, type ManagedProvider } from '../services/apiClient';
import { MEB_SUBJECTS } from '../data/mebCurriculum';
import { StudentProfileEngine, AdaptiveProfile } from '../services/studentProfileEngine';
import { AdaptivePedagogyEngine, PedagogicalDecision } from '../services/adaptivePedagogyEngine';
import { SimplificationStep } from '../services/simplificationLadder';
import { StudentProfileModal } from './StudentProfileModal';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isFallback?: boolean;
  providerName?: string;
  stepName?: string;
  tokensSaved?: number;
}

interface TutorScreenProps {
  initialRole?: AiRole;
  initialSubject?: SubjectCode;
}

const QUICK_YOUNG_MALE_VOICES: Array<{
  key: string;
  provider: VoiceProvider;
  voiceId: string;
  ttsModel?: GeminiTtsModel;
  label: string;
}> = [
  {
    key: 'gemini38:Puck',
    provider: 'gemini_speech',
    voiceId: 'Puck',
    ttsModel: 'gemini-3.8-flash-tts',
    label: '👦 Ana Ses: Gemini 3.8 Flash TTS — Puck (Genç Erkek)'
  },
  {
    key: 'gemini38:Fenrir',
    provider: 'gemini_speech',
    voiceId: 'Fenrir',
    ttsModel: 'gemini-3.8-flash-tts',
    label: '👦 Gemini 3.8 Flash TTS — Fenrir (Enerjik Genç Erkek)'
  },
  {
    key: 'gemini38:Orus',
    provider: 'gemini_speech',
    voiceId: 'Orus',
    ttsModel: 'gemini-3.8-flash-tts',
    label: '👦 Gemini 3.8 Flash TTS — Orus (Berrak Genç Erkek)'
  },
  {
    key: 'gemini38lite:Puck',
    provider: 'gemini_speech',
    voiceId: 'Puck',
    ttsModel: 'gemini-3.8-flash-lite-tts',
    label: '⚡ Gemini 3.8 Flash-Lite TTS — Puck (Hızlı Genç Erkek)'
  },
  {
    key: 'edge:Ahmet',
    provider: 'edge_natural',
    voiceId: 'tr-TR-AhmetNeural',
    label: '👦 Ahmet Neural (Ücretsiz Doğal Genç Erkek)'
  },
  {
    key: 'openai:ash',
    provider: 'openai_tts',
    voiceId: 'ash',
    label: '👦 Ash (OpenAI GPT-4o Genç Erkek)'
  },
  {
    key: 'elevenlabs:Josh',
    provider: 'elevenlabs',
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    label: '👦 Josh (ElevenLabs Stüdyo Genç Erkek)'
  },
  {
    key: 'cartesia:Sonic',
    provider: 'cartesia_tts',
    voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091',
    label: '👦 Sonic-2 (Cartesia Düşük Gecikmeli Genç Erkek)'
  }
];

export const TutorScreen: React.FC<TutorScreenProps> = ({
  initialRole = 'subject_teacher',
  initialSubject = 'MATH'
}) => {
  const [selectedRole, setSelectedRole] = useState<AiRole>(initialRole);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCode>(initialSubject);
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle>(() =>
    readSetting<ConversationStyle>('conversation_style', 'supportive')
  );
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>(() =>
    readSetting<VoiceProvider>('voice_provider', 'gemini_speech')
  );
  const [geminiTtsModel, setGeminiTtsModel] = useState<GeminiTtsModel>(() =>
    readSetting<GeminiTtsModel>('voice_tts_model', 'gemini-3.8-flash-tts')
  );
  const [voiceModelName, setVoiceModelName] = useState<string>(() => {
    const saved = readSetting<string>('voice_model_name', 'Puck');
    return saved || 'Puck';
  });
  const [profile, setProfile] = useState<AdaptiveProfile>(() => StudentProfileEngine.getProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentSimplificationStep, setCurrentSimplificationStep] = useState<SimplificationStep>('normal');
  const [totalTokensSaved, setTotalTokensSaved] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(()=>readSetting<ChatMessage[]>('tutor_history_v1',[
    {
      id: 'welcome_msg',
      sender: 'ai',
      text: `Merhaba ${StudentProfileEngine.getProfile().name}! Ben senin kişisel ders rehberi eğitim asistanınım.\n\nAna ses olarak Google Gemini 3.8 Flash TTS (Puck — Genç Erkek) ile konuşuyorum. İster günlük doğal sohbet edelim, ister 9. sınıf derslerinde takıldığın bir konuyu birlikte adım adım çözelim. Bugün nereden başlayalım?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]));
  useEffect(()=>{writeSetting('tutor_history_v1',messages.slice(-100));},[messages]);

  const [inputText, setInputText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('economic');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [isPhoneMicOpen, setIsPhoneMicOpen] = useState(false);

  const voiceService = useRef(getVoiceService());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: readSetting('reduced_motion',true)?'instant':'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const db = getDb();
    const vModeRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'voice_mode'");
    if (vModeRow) setVoiceMode(JSON.parse(vModeRow.value));

    voiceService.current.setOptions({
      onStatusChange: status => {
        setVoiceStatus(status);
        if (status !== 'listening') setInterimTranscript('');
      },
      onTranscript: (transcript, isFinal) => {
        if (!isFinal) {
          setInterimTranscript(transcript);
          return;
        }
        setInterimTranscript('');
        if (transcript.trim()) {
          handleSend(transcript);
        }
      },
      onError: errMsg => {
        setVoiceError(errMsg);
      }
    });

    phoneMicService.onTranscript(text => {
      if (text.trim()) {
        handleSend(text);
      }
    });

    return () => {
      voiceService.current.stopSpeaking();
      voiceService.current.stopListening();
    };
  }, [selectedSubject, selectedRole]);

  const handleQuickVoiceChange = (provider: VoiceProvider, voiceId: string, ttsModel?: GeminiTtsModel) => {
    setVoiceProvider(provider);
    setVoiceModelName(voiceId);
    writeSetting('voice_provider', provider);
    writeSetting('voice_model_name', voiceId);
    if (ttsModel) {
      setGeminiTtsModel(ttsModel);
      writeSetting('voice_tts_model', ttsModel);
    }
    const preset = (YOUNG_MALE_VOICE_PRESETS[provider] || []).find(p => p.id === voiceId);
    voiceService.current.stopSpeaking();
    voiceService.current.speakManually(
      `Merhaba! Şu anda Gemini 3.8 TTS ve ${preset ? preset.name : voiceId} gerçekçi genç erkek sesiyle konuşuyorum.`,
      'tr-TR'
    );
  };

  const handleSend = async (messageText?: string, explicitStep?: SimplificationStep) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || isLoading) return;

    voiceService.current.stopSpeaking();
    setVoiceError(null);

    const userText = textToSend.trim();
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const decision: PedagogicalDecision = AdaptivePedagogyEngine.processStudentQuery({
        userMessage: userText,
        subjectCode: selectedSubject,
        currentStep: explicitStep || currentSimplificationStep
      });

      setCurrentSimplificationStep(decision.step);

      if (decision.deterministicAnswer || explicitStep) {
        if (decision.tokensSaved > 0) {
          setTotalTokensSaved(prev => prev + decision.tokensSaved);
        }
        const aiMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'ai',
          text: decision.responseContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stepName: decision.step,
          tokensSaved: decision.tokensSaved
        };

        setMessages(prev => [...prev, aiMsg]);
        if (voiceMode !== 'text_only') {
          const lang = selectedRole === 'subject_teacher' && selectedSubject === 'ENG' ? 'en-US' : 'tr-TR';
          voiceService.current.speak(studentText(decision.responseContent), lang);
        }
      } else {
        const history = messages
          .filter(m => m.id !== 'welcome_msg')
          .slice(-10)
          .map(m => ({
            role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.text
          }));

        const response: AiResponse = await AiAdapter.request({
          role: selectedRole,
          taskType: voiceMode === 'live' ? 'live_voice' : 'chat',
          userMessage: userText,
          subjectCode: selectedRole === 'subject_teacher' ? selectedSubject : undefined,
          contextSummary: `Öğrenci: ${profile.name} (${profile.age} yaş, ${profile.gradeLevel}), Hitap: ${profile.addressStyle}, Ayrıntı: ${profile.verbosityPreference}`,
          conversationStyle,
          history
        });

        const pName =
          response.provider && (response.provider as string) in PROVIDER_INFO
            ? PROVIDER_INFO[response.provider as ManagedProvider].name
            : response.isFallback
            ? 'Yerel Doğal İletişim Motoru'
            : String(response.provider);

        const aiMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'ai',
          text:
            response.text +
            (response.connectionMessage ? `\n\nℹ️ ${response.connectionMessage}` : '') +
            (!response.isFallback && response.costKnown === false
              ? '\n\n(Not: Bu yanıtın kesin maliyeti sağlayıcı tarafından raporlanmadı.)'
              : ''),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFallback: response.isFallback,
          providerName: pName
        };

        setMessages(prev => [...prev, aiMsg]);
        if (voiceMode !== 'text_only') {
          const lang = selectedRole === 'subject_teacher' && selectedSubject === 'ENG' ? 'en-US' : 'tr-TR';
          voiceService.current.speak(studentText(response.text), lang);
        }
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'ai',
        text: `Bilgi: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMic = () => {
    setVoiceError(null);
    if (voiceStatus === 'listening') {
      voiceService.current.stopListening();
    } else {
      const lang = selectedRole === 'subject_teacher' && selectedSubject === 'ENG' ? 'en-US' : 'tr-TR';
      voiceService.current.startListening(lang);
    }
  };

  const simplificationLadderButtons: Array<{ step: SimplificationStep; label: string; icon: string }> = [
    { step: 'simpler', label: 'Daha Basit Anlat', icon: '🪜' },
    { step: 'analogy', label: 'Günlük Örnek', icon: '🌍' },
    { step: 'visual', label: 'Şematik Özeti', icon: '📊' },
    { step: 'step_by_step', label: 'Adım Adım Çöz', icon: '🐾' },
    { step: 'prerequisite_check', label: 'Ön Bilgi', icon: '🔍' },
    { step: 'alternative_method', label: 'Farklı Yoldan', icon: '💡' },
    { step: 'quick_check', label: 'Mini Kontrol', icon: '🎯' }
  ];

  const styleOptions: Array<{ id: ConversationStyle; label: string }> = [
    { id: 'supportive', label: 'Sıcak ve Destekleyici' },
    { id: 'casual_friend', label: 'Günlük ve Arkadaşça' },
    { id: 'energetic', label: 'Enerjik ve Neşeli' },
    { id: 'concise', label: 'Kısa ve Doğrudan' },
    { id: 'teacher', label: 'Öğretmen ve Rehber' },
    { id: 'professional', label: 'Profesyonel Danışman' },
    { id: 'technical', label: 'Teknik Uzman' },
    { id: 'formal', label: 'Resmî İletişim' }
  ];

  const selectedQuickVoiceValue =
    QUICK_YOUNG_MALE_VOICES.find(
      v => v.provider === voiceProvider && v.voiceId === voiceModelName && (!v.ttsModel || v.ttsModel === geminiTtsModel)
    )?.key || 'gemini38:Puck';

  return (
    <div className="dp-tutor-container">
      {/* Sadeleştirilmiş, Dikkat Dağıtmayan Tek Satır Üst Kontrol Çubuğu */}
      <div className="dp-tutor-calm-toolbar">
        <div className="dp-tutor-header-tabs">
          <button
            type="button"
            className={`dp-role-tab ${selectedRole === 'subject_teacher' ? 'active' : ''}`}
            onClick={() => setSelectedRole('subject_teacher')}
          >
            <BookOpen size={16} /> Branş Öğretmeni ({MEB_SUBJECTS.find(s => s.code === selectedSubject)?.name})
          </button>
          <button
            type="button"
            className={`dp-role-tab ${selectedRole === 'homeroom_teacher' ? 'active' : ''}`}
            onClick={() => setSelectedRole('homeroom_teacher')}
          >
            <GraduationCap size={16} /> Sınıf Rehberi
          </button>
          <button
            type="button"
            className={`dp-role-tab ${selectedRole === 'study_coach' ? 'active' : ''}`}
            onClick={() => setSelectedRole('study_coach')}
          >
            <Target size={16} /> Ders Koçu
          </button>
        </div>

        <div className="dp-tutor-calm-meta">
          {voiceStatus === 'speaking' && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ fontSize: '0.86rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              onClick={() => voiceService.current.stopSpeaking()}
              title="Rehberin konuşmasını hemen durdur (Söz Kes)"
            >
              <VolumeX size={15} /> Sesi Durdur
            </button>
          )}

        </div>
      </div>

      {/* Branş Öğretmeni İçin Ders Seçim Barı */}
      {selectedRole === 'subject_teacher' && (
        <div className="dp-subject-pills-bar">
          {MEB_SUBJECTS.map(sub => (
            <button
              type="button"
              key={sub.code}
              className={`dp-sub-pill ${selectedSubject === sub.code ? 'selected' : ''}`}
              onClick={() => setSelectedSubject(sub.code as SubjectCode)}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Kolay Okunur, Yüksek Kontrastlı ve Dikkat Dağıtmayan Sohbet Alanı */}
      <div className="dp-card dp-tutor-chat-box">
        <div className="dp-chat-scroll-area">
          {messages.map(msg => (
            <div key={msg.id} className={`dp-chat-bubble-row ${msg.sender}`}>
              {msg.sender === 'ai' && (
                <div className="dp-ai-avatar-circle">
                  <Bot size={18} color="#2563eb" />
                </div>
              )}

              <div className={`dp-chat-bubble ${msg.sender}`}>
                <div className="dp-bubble-header">
                  <span className="dp-bubble-sender">
                    {msg.sender === 'user' ? profile.name : 'Ders rehberi'}
                  </span>
                  {msg.providerName && (
                    <span className="dp-bubble-provider-tag">
                      {msg.providerName}
                    </span>
                  )}
                  {msg.tokensSaved && msg.tokensSaved > 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#059669', marginLeft: '6px', fontWeight: 600 }}>
                      • Yerel Çözüm
                    </span>
                  )}
                  {msg.sender === 'ai' && (
                    <button
                      type="button"
                      className="dp-bubble-speak-btn"
                      onClick={() => voiceService.current.speakManually(studentText(msg.text), 'tr-TR')}
                      title="Bu yanıtı seslendir"
                      aria-label="Bu yanıtı seslendir"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>

                <div className="dp-bubble-body" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.sender==='user'?msg.text:studentText(msg.text)}
                </div>

                <div className="dp-bubble-time">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="dp-chat-bubble-row ai">
              <div className="dp-ai-avatar-circle">
                <Bot size={18} color="#2563eb" />
              </div>
              <div className="dp-chat-bubble ai loading">
                Yanıt hazırlanıyor…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sadeleştirilmiş Anlatım Basitleştirme Merdiveni */}
        <div className="dp-ladder-bar">
          <span className="dp-ladder-label">
            <Lightbulb size={15} color="#d97706" /> Anlatım:
          </span>
          {simplificationLadderButtons.map(btn => (
            <button
              type="button"
              key={btn.step}
              className={`dp-ladder-pill ${currentSimplificationStep === btn.step ? 'active' : ''}`}
              onClick={() =>
                handleSend(
                  `${MEB_SUBJECTS.find(s => s.code === selectedSubject)?.name} konusunda ${btn.label.toLowerCase()}`,
                  btn.step
                )
              }
              title={`${btn.label} basamağını etkinleştir`}
            >
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Canlı Dinleme & Söz Kesme (Barge-In) Bilgilendirmesi */}
        {voiceStatus === 'listening' && (
          <div
            style={{
              fontSize: '0.9rem',
              color: '#1d4ed8',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              background: '#eff6ff',
              borderTop: '1px solid #bfdbfe'
            }}
          >
            <span>
              🎙️ Dinleniyor:{' '}
              {interimTranscript ? `"${interimTranscript}..."` : 'Konuşmanızı tamamladığınızda yanıt üretilir (Söz kesme aktif).'}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.82rem' }}
              onClick={() => voiceService.current.stopListening()}
            >
              Durdur
            </button>
          </div>
        )}

        {voiceError && (
          <div
            role="alert"
            style={{
              fontSize: '0.9rem',
              color: '#b91c1c',
              padding: '8px 16px',
              background: '#fef2f2',
              borderTop: '1px solid #fecaca'
            }}
          >
            ⚠️ {voiceError}
          </div>
        )}

        {/* Mesaj Yazma ve Gönderme Çubuğu */}
        <div className="dp-chat-input-row">
          <input
            type="text"
            aria-label="Öğretmenne mesaj" className="dp-chat-text-input"
            placeholder="Sorunuzu, konuyu veya denklemi yazın (Örn: x^2 - 5x + 6 = 0)..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />

          <button
            type="button"
            className={`dp-chat-mic-btn ${voiceStatus === 'listening' ? 'active' : ''}`}
            onClick={toggleMic}
            title="Bilgisayar Mikrofonu ile sesli konuş"
          >
            {voiceStatus === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            type="button"
            className="dp-chat-mic-btn"
            style={{ backgroundColor: 'var(--bg-primary)', color: '#2563eb', border: '1px solid var(--border-color)' }}
            onClick={() => setIsPhoneMicOpen(true)}
            title="Akıllı Telefonunu Kablosuz Mikrofon Olarak Bağla"
          >
            <Smartphone size={18} />
          </button>

          <button
            type="button"
            className="dp-chat-send-btn"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            aria-label="Mesajı gönder"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={updated => setProfile(updated)}
      />

      <PhoneMicModal isOpen={isPhoneMicOpen} onClose={() => setIsPhoneMicOpen(false)} />
    </div>
  );
};
