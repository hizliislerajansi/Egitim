import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Layers, 
  Sparkles, 
  ExternalLink,
  PlusCircle,
  Volume2
} from 'lucide-react';
import { EnglishCorpusEngine, SourceRegistryItem, CorpusStats } from '../services/englishCorpusEngine';
import { EnglishAiGenerator, GeneratedReadingPassage, GeneratedClozeTest } from '../services/englishAiGenerator';
import { getVoiceService } from '../services/voiceService';

interface EnglishAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnglishAdminModal: React.FC<EnglishAdminModalProps> = ({ isOpen, onClose }) => {
  const [sources, setSources] = useState<SourceRegistryItem[]>([]);
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sources' | 'vocab_ingest' | 'ai_studio'>('sources');

  // Yeni Kelime Ekleme Formu
  const [newWord, setNewWord] = useState('');
  const [newCefr, setNewCefr] = useState<'A1' | 'A2' | 'B1' | 'B2'>('A2');
  const [newTr, setNewTr] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [ingestMessage, setIngestMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // AI Sandbox Durumları
  const [selectedTheme, setSelectedTheme] = useState('topic_eng_theme1');
  const [generatedReading, setGeneratedReading] = useState<GeneratedReadingPassage | null>(null);
  const [generatedCloze, setGeneratedCloze] = useState<GeneratedClozeTest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    EnglishCorpusEngine.initEngine();
    setSources(EnglishCorpusEngine.getSourceRegistry());
    setStats(EnglishCorpusEngine.getCorpusStats());
  };

  const handleRefreshSources = async () => {
    setIsRefreshing(true);
    try {
      const updated = await EnglishCorpusEngine.refreshSourceHealth();
      setSources(updated);
      setStats(EnglishCorpusEngine.getCorpusStats());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    setIngestMessage(null);

    const result = EnglishCorpusEngine.ingestVocab({
      word: newWord,
      cefr: newCefr,
      phonetic: newPhonetic || undefined,
      turkishMeaning: newTr,
      meanings: [{ partOfSpeech: 'noun', definition: `Direct curriculum entry for ${newWord}` }],
      sourceId: 'src_local_examples',
      themeId: selectedTheme
    });

    if (result.success) {
      setIngestMessage({ text: `"${newWord}" kelimesi başarıyla korpusa eklendi.`, isError: false });
      setNewWord('');
      setNewTr('');
      setNewPhonetic('');
      setStats(EnglishCorpusEngine.getCorpusStats());
    } else {
      setIngestMessage({ text: `Hata: ${result.reason || 'Karantinaya alındı'}`, isError: true });
    }
  };

  const handleTestGenerateReading = async () => {
    setIsGenerating(true);
    try {
      const passage = await EnglishAiGenerator.generateReadingPassage(selectedTheme);
      setGeneratedReading(passage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestGenerateCloze = async () => {
    setIsGenerating(true);
    try {
      const cloze = await EnglishAiGenerator.generateClozeTest(selectedTheme);
      setGeneratedCloze(cloze);
    } finally {
      setIsGenerating(false);
    }
  };

  const speakText = (text: string) => {
    getVoiceService().speakManually(text, 'en-US');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">İngilizce Veri & Lisans Stüdyosu</h2>
              <p className="text-xs text-slate-400">10 Açık Kaynak, CEFR Standartları ve Otomatik Veri Yönetimi</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-slate-950/40 border-b border-slate-800 text-xs">
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 block">Aktif Kelime Sayısı</span>
              <span className="text-base font-bold text-indigo-400">{stats.totalVocab} Kelime</span>
            </div>
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 block">Tatoeba Cümleleri</span>
              <span className="text-base font-bold text-emerald-400">{stats.totalSentences} Cümle</span>
            </div>
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 block">Gramer & Materyal</span>
              <span className="text-base font-bold text-amber-400">{stats.totalGrammarRules + stats.totalMaterials} Kayıt</span>
            </div>
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 block">Kaynak Durumu</span>
              <span className="text-base font-bold text-cyan-400">{stats.sourcesOnline} / {stats.sourceCount} Aktif</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 gap-2 bg-slate-900/80">
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sources'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            10 Kaynak ve Lisans Denetimi
          </button>
          <button
            onClick={() => setActiveTab('vocab_ingest')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'vocab_ingest'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Kelime & Veri Ekleme
          </button>
          <button
            onClick={() => setActiveTab('ai_studio')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ai_studio'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Rehber & Kademeli İçerik Testi
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'sources' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">
                  Kaynak sicili bir lisans onayı değildir. Bağlantıların erişimi ile içerik hakları ayrı değerlendirilir. Yerel başlangıç örnekleri için harici kaynak kimliği ve lisans eşleşmesi doğrulanmadıkça kaynak atfı kesin kabul edilmemelidir. Telifli kaynaklar referans bağlantısı olarak sunulur.
                </span>
                <button
                  onClick={handleRefreshSources}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Canlı Denetle
                </button>
              </div>

              <div className="space-y-2.5">
                {sources.map(src => (
                  <div key={src.id} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-200">{src.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          src.status === 'online' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {src.status === 'online' ? 'Erişilebilir & Aktif' : 'Kısıtlı / Çevrimdışı'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {src.license}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{src.notes}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">
                        {src.item_count > 0 ? `${src.item_count} Kayıt` : 'Derin Bağlantı'}
                      </span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Kaynağı Ziyaret Et"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vocab_ingest' && (
            <div className="space-y-4">
              <form onSubmit={handleAddWord} className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-indigo-400" />
                  Müfredata Özel Yeni Kelime Ekle
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">İngilizce Kelime</label>
                    <input
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="Örn: sustainable"
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">CEFR Seviyesi</label>
                    <select
                      value={newCefr}
                      onChange={(e) => setNewCefr(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="A1">A1 (Başlangıç)</option>
                      <option value="A2">A2 (Temel 9. Sınıf)</option>
                      <option value="B1">B1 (Orta Seviye)</option>
                      <option value="B2">B2 (İleri)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Türkçe Anlamı</label>
                    <input
                      type="text"
                      value={newTr}
                      onChange={(e) => setNewTr(e.target.value)}
                      placeholder="Örn: sürdürülebilir, devam ettirilebilir"
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fonetik Yazım (IPA - İsteğe Bağlı)</label>
                    <input
                      type="text"
                      value={newPhonetic}
                      onChange={(e) => setNewPhonetic(e.target.value)}
                      placeholder="Örn: /səˈsteɪnəbl/"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {ingestMessage && (
                  <div className={`p-3 rounded-lg text-xs ${
                    ingestMessage.isError 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {ingestMessage.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Korpusa Kaydet
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'ai_studio' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">Kademeli İçerik ve Okuma / Boşluk Doldurma Testi</h3>
                    <p className="text-xs text-slate-400">Üretilen metinler yerel veritabanında saklanır; gereksiz API harcaması yapılmaz.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestGenerateReading}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? 'Hazırlanıyor...' : 'Okuma Metni Üret'}
                    </button>
                    <button
                      onClick={handleTestGenerateCloze}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Boşluk Doldurma Üret
                    </button>
                  </div>
                </div>
              </div>

              {generatedReading && (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {generatedReading.title} ({generatedReading.cefrLevel})
                    </h4>
                    <button 
                      onClick={() => speakText(generatedReading.passageText)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800"
                      title="Sesli Dinle"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {generatedReading.passageText}
                  </p>
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-400">Anlama Soruları:</span>
                    {generatedReading.questions.map((q, idx) => (
                      <div key={q.id || idx} className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="font-semibold text-indigo-300">{idx + 1}. {q.question}</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-slate-400">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-1 rounded ${opt === q.correctAnswer ? 'text-emerald-400 font-semibold' : ''}`}>
                              • {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedCloze && (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-emerald-500/30 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {generatedCloze.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {generatedCloze.passageWithBlanks}
                  </p>
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-400">Boşluklar ve Seçenekler:</span>
                    {generatedCloze.blanks.map((b, idx) => (
                      <div key={b.id || idx} className="text-xs text-slate-300 bg-slate-900/40 p-2 rounded-lg flex items-center justify-between border border-slate-800">
                        <span><strong>[{b.id}]:</strong> Doğru: <span className="text-emerald-400">{b.correct}</span> ({b.hint})</span>
                        <span className="text-slate-400">Şıklar: {b.options.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Yazılımcı: M. SENCER EKŞİOĞLU (Tired Warrior Jr)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
