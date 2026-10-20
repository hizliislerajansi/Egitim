import React, { useState, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  Compass
} from 'lucide-react';
import { REAL_LIFE_SCENARIOS, ScenarioDefinition, SpeakingSimulator, SpeechEvaluationResult } from '../services/speakingSimulator';
import { getVoiceService } from '../services/voiceService';

interface SpeakingSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpeakingSimulatorModal: React.FC<SpeakingSimulatorModalProps> = ({ isOpen, onClose }) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition>(REAL_LIFE_SCENARIOS[0]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<SpeechEvaluationResult | null>(null);

  const voiceService = useRef(getVoiceService());
  const currentTurn = selectedScenario.turns[currentTurnIndex];

  if (!isOpen) return null;

  const playBotAudio = (text: string) => {
    voiceService.current.speakManually(text, 'en-US');
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      voiceService.current.stopListening();
      setIsRecording(false);
    } else {
      setTranscript('');
      setEvaluation(null);
      setIsRecording(true);

      voiceService.current.setOptions({
        lang: 'en-US',
        onTranscript: (text) => {
          setTranscript(text);
          setIsRecording(false);

          // Ses tanıma doğruluğu ile dil bilgisi hatasını ayıran değerlendirme
          const result = SpeakingSimulator.evaluateSpeech(text, currentTurn, 0.88);
          setEvaluation(result);
        },
        onError: () => {
          setIsRecording(false);
          setEvaluation({
            isRecognized: false,
            needsRetry: true,
            retryReason: 'Mikrofon sinyali alınamadı. Lütfen tarayıcı mikrofon izinlerini kontrol edip tekrar deneyiniz.',
            isGrammaticallyAcceptable: false,
            confidenceScore: 0.0,
            feedback: 'Ses algılanamadı.',
            grammarTip: 'Mikrofonunuza yaklaşarak tekrar konuşunuz.'
          });
        }
      });

      voiceService.current.startListening('en-US');
    }
  };

  const handleNextTurn = () => {
    setTranscript('');
    setEvaluation(null);
    if (currentTurnIndex < selectedScenario.turns.length - 1) {
      setCurrentTurnIndex(prev => prev + 1);
    } else {
      setCurrentTurnIndex(0); // Başa sar
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">İngilizce Konuşma Simülatörü</h2>
              <p className="text-xs text-slate-400">Günlük Hayat Senaryoları & Akustik Gürültü Ayrıştırmalı Değerlendirme</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Senaryo Seçici */}
        <div className="flex gap-2 p-4 bg-slate-950/40 border-b border-slate-800 overflow-x-auto text-xs">
          {REAL_LIFE_SCENARIOS.map(sc => (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenario(sc);
                setCurrentTurnIndex(0);
                setTranscript('');
                setEvaluation(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedScenario.id === sc.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sc.titleTr} ({sc.cefrLevel})
            </button>
          ))}
        </div>

        {/* Diyalog Alanı */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Bot Konuşması */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Diyalog Partneri ({currentTurnIndex + 1} / {selectedScenario.turns.length}):
              </span>
              <button
                onClick={() => playBotAudio(currentTurn.botPromptEn)}
                className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition-colors"
                title="Sesli Dinle"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-100 font-medium leading-relaxed">
              "{currentTurn.botPromptEn}"
            </p>
            <p className="text-xs text-slate-400 italic">
              {currentTurn.botPromptTr}
            </p>
          </div>

          {/* Öğrenci Mikrofon & Cevap Alanı */}
          <div className="p-5 bg-slate-950/40 rounded-xl border border-slate-800 text-center space-y-4">
            <span className="text-xs text-slate-400 block">
              Mikrofon butonuna tıklayıp İngilizce olarak partnerinize cevap veriniz:
            </span>

            <div className="flex justify-center">
              <button
                onClick={handleToggleRecord}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-rose-600 animate-pulse text-white shadow-lg shadow-rose-600/30' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                }`}
                title={isRecording ? 'Dinlemeyi Durdur' : 'Konuşmaya Başla'}
              >
                {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
            </div>

            {isRecording && (
              <span className="text-xs text-rose-400 font-medium block animate-pulse">
                Sizi dinliyor... Lütfen konuşunuz.
              </span>
            )}

            {transcript && (
              <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-200 border border-slate-700 text-left">
                <strong>Söylediğiniz:</strong> "{transcript}"
              </div>
            )}

            {/* Değerlendirme Çıktısı */}
            {evaluation && (
              <div className={`p-4 rounded-xl text-left space-y-2 border ${
                evaluation.needsRetry
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : evaluation.isGrammaticallyAcceptable
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  {evaluation.needsRetry ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Ses Algılama Uyarısı (Dil Hatası Değil)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Pedagojik Değerlendirme</span>
                    </>
                  )}
                </div>

                <p className="text-xs leading-relaxed">
                  {evaluation.needsRetry ? evaluation.retryReason : evaluation.feedback}
                </p>

                <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                  {evaluation.grammarTip}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Yazılımcı: M. SENCER EKŞİOĞLU (Tired Warrior Jr)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNextTurn}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Sonraki Diyalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
