import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  ExternalLink,
  BookOpen,
  Atom,
  Globe,
  Landmark,
  Palette,
  HelpCircle
} from 'lucide-react';
import { UnifiedEducationEngine, EngineResponse } from '../services/provider/UnifiedEducationEngine';
import { ProviderDescriptor, SubjectType } from '../services/provider/types';
import { AuditLogger } from '../services/provider/AuditLogger';

interface UnifiedProviderStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedProviderStudioModal: React.FC<UnifiedProviderStudioModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'test_lab' | 'metrics'>('matrix');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [dashboardData, setDashboardData] = useState<{
    providers: ProviderDescriptor[];
    cacheStats: { totalItems: number; subjectBreakdown: Record<string, number> };
    metrics: { totalRequests: number; cacheHitCount: number; fallbackCount: number; totalTokensSaved: number; totalCostSavedUsd: number; avgLatencyMs: number };
    totalHealthyProviders: number;
    totalProviders: number;
  } | null>(null);

  // Test Laboratuvarı Durumları
  const [testSubject, setTestSubject] = useState<SubjectType>('math');
  const [testQuery, setTestQuery] = useState('x^2 - 5x + 6 = 0');
  const [testResult, setTestResult] = useState<EngineResponse | null>(null);
  const [isLoadingTest, setIsLoadingTest] = useState(false);

  // Denetim Logları
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const data = UnifiedEducationEngine.getDashboardStatus();
    setDashboardData(data);
    setRecentLogs(AuditLogger.getRecentLogs(20));
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim() || isLoadingTest) return;

    setIsLoadingTest(true);
    setTestResult(null);

    try {
      const res = await UnifiedEducationEngine.executeQuery({
        subject: testSubject,
        text: testQuery,
        queryType: testSubject === 'math' ? 'math_solve' : testSubject === 'science' ? 'chemistry_element' : 'word_lookup'
      });
      setTestResult(res);
      loadData();
    } finally {
      setIsLoadingTest(false);
    }
  };

  if (!isOpen) return null;

  const filteredProviders = dashboardData?.providers.filter(p => {
    if (selectedSubjectFilter === 'all') return true;
    return p.subject === selectedSubjectFilter;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Merkezi Eğitim Veri & Sağlayıcı Mimarisi</h2>
              <p className="text-xs text-slate-400">19 Çok Dersli Açık Kaynak, Lisans Sicili ve Deterministik Doğrulama</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Stats Overview */}
        {dashboardData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-slate-950/40 border-b border-slate-800 text-xs">
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 block">Kayıtlı Sağlayıcı</span>
              <span className="text-base font-bold text-blue-400">{dashboardData.totalHealthyProviders} / {dashboardData.totalProviders} Sağlıklı</span>
            </div>
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 block">Önbellek Kaydı</span>
              <span className="text-base font-bold text-emerald-400">{dashboardData.cacheStats.totalItems} İçerik</span>
            </div>
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 block">Kazanılan Token</span>
              <span className="text-base font-bold text-amber-400">+{dashboardData.metrics.totalTokensSaved.toLocaleString('tr-TR')} Token</span>
            </div>
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 block">Tahmini Tasarruf</span>
              <span className="text-base font-bold text-cyan-400">${dashboardData.metrics.totalCostSavedUsd} USD</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 gap-2 bg-slate-900/80">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'matrix' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Kaynak & Lisans Sicil Matrisi
          </button>
          <button
            onClick={() => setActiveTab('test_lab')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'test_lab' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Çok Dersli Sorgu & Doğrulama Testi
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'metrics' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Performans & Denetim Logları
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'matrix' && (
            <div>
              {/* Subject Filter Bar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'Tüm Dersler' },
                    { id: 'math', label: 'Matematik' },
                    { id: 'science', label: 'Fen & Kimya' },
                    { id: 'geography', label: 'Coğrafya' },
                    { id: 'history', label: 'Tarih' },
                    { id: 'literature', label: 'Edebiyat & Sanat' },
                    { id: 'english', label: 'İngilizce' },
                    { id: 'trivia', label: 'Sınav & Trivia' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedSubjectFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedSubjectFilter === f.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400">
                  {filteredProviders.length} Sağlayıcı Listelendi
                </span>
              </div>

              {/* Providers Grid */}
              <div className="space-y-2.5">
                {filteredProviders.map(p => (
                  <div key={p.id} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-200">{p.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                          {p.subject}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'healthy' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.status === 'healthy' ? 'Sağlıklı' : 'Kısıtlı / Devre Kesici'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {p.licenseName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{p.notes}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">
                        {p.totalRequests} İstek / {p.avgLatencyMs} ms
                      </span>
                      <a
                        href={p.endpointUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Uç Noktayı Görüntüle"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'test_lab' && (
            <div className="space-y-5">
              <form onSubmit={handleRunTest} className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Çok Dersli Canlı İstek ve Doğrulama Laboratuvarı
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Ders Seçiniz</label>
                    <select
                      value={testSubject}
                      onChange={(e) => {
                        const s = e.target.value as SubjectType;
                        setTestSubject(s);
                        if (s === 'math') setTestQuery('x^2 - 5x + 6 = 0');
                        if (s === 'science') setTestQuery('H2O');
                        if (s === 'geography') setTestQuery('Turkey');
                        if (s === 'history') setTestQuery('1071');
                        if (s === 'literature') setTestQuery('Yunus Emre');
                        if (s === 'english') setTestQuery('environment');
                        if (s === 'trivia') setTestQuery('science');
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="math">Matematik (Newton & Deterministik)</option>
                      <option value="science">Fen & Kimya & Astronomi (PubChem, Periyodik Tablo, Gezegenler)</option>
                      <option value="geography">Coğrafya (REST Countries & İklim)</option>
                      <option value="history">Tarih (Wikimedia & TTK Kronolojisi)</option>
                      <option value="literature">Edebiyat & Sanat (Klasikler, Şiir, Met Museum)</option>
                      <option value="english">İngilizce (FreeDict & CEFR-J)</option>
                      <option value="trivia">Sınav & Trivia (Open Trivia DB)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Sorgu / Konu / İfade</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        placeholder="Örn: x^2 - 5x + 6 = 0 veya H2O veya Turkey"
                        required
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={isLoadingTest}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {isLoadingTest ? 'Sorgulanıyor...' : 'Çalıştır & Doğrula'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap text-[11px] text-slate-400 pt-1">
                  <span>Örnekler:</span>
                  <button type="button" onClick={() => { setTestSubject('math'); setTestQuery('x^2 - 4 = 0'); }} className="underline hover:text-blue-300">x² - 4 = 0</button>
                  <button type="button" onClick={() => { setTestSubject('science'); setTestQuery('H'); }} className="underline hover:text-blue-300">Hidrojen (H)</button>
                  <button type="button" onClick={() => { setTestSubject('science'); setTestQuery('Mars'); }} className="underline hover:text-blue-300">Mars Gezegeni</button>
                  <button type="button" onClick={() => { setTestSubject('geography'); setTestQuery('Turkey'); }} className="underline hover:text-blue-300">Türkiye Demografisi</button>
                  <button type="button" onClick={() => { setTestSubject('history'); setTestQuery('1453'); }} className="underline hover:text-blue-300">1453 İstanbul</button>
                  <button type="button" onClick={() => { setTestSubject('literature'); setTestQuery('Dede Korkut'); }} className="underline hover:text-blue-300">Dede Korkut</button>
                </div>
              </form>

              {/* Test Sonuç Kartı */}
              {testResult && (
                <div className="p-5 bg-slate-950/60 rounded-xl border border-blue-500/30 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full uppercase bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                        {testResult.content.subject}
                      </span>
                      <h4 className="text-base font-bold text-slate-100">
                        {testResult.content.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        testResult.fromCache ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {testResult.fromCache ? '⚡ Önbellekten Geldi (0 Token)' : '🌐 Canlı Sorgu'}
                      </span>
                      <span className="text-slate-400">{testResult.latencyMs} ms</span>
                      <span className="text-emerald-400 font-semibold">+{testResult.savings.tokens} Token Tasarrufu</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-lg text-sm text-slate-200 leading-relaxed whitespace-pre-line border border-slate-800">
                    {testResult.content.content}
                  </div>

                  {testResult.content.answerExplanation && (
                    <div className="bg-slate-900/50 p-3 rounded-lg text-xs text-slate-300 border border-slate-800/80">
                      <strong className="text-blue-400 block mb-1">Çözüm ve Doğrulama Adımları:</strong>
                      {testResult.content.answerExplanation}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>{testResult.content.attribution}</span>
                    <span className="text-emerald-400 font-medium">
                      ✓ Doğrulama Yöntemi: {testResult.verification.method} (Güven: {(testResult.verification.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Canlı Denetim ve Telemetri Günlüğü</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Sistemdeki deterministik hesaplamalar, önbellek isabetleri ve API çağrıları teknik denetim için SQLite veritabanında saklanır.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[11px] uppercase bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Zaman</th>
                        <th className="py-2 px-3">Ders</th>
                        <th className="py-2 px-3">Sorgu</th>
                        <th className="py-2 px-3">Durum</th>
                        <th className="py-2 px-3">Gecikme</th>
                        <th className="py-2 px-3">Token Tasarrufu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {recentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                          </td>
                          <td className="py-2 px-3 uppercase font-semibold text-blue-400">{log.subject}</td>
                          <td className="py-2 px-3 truncate max-w-[200px]">{log.query}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              log.status === 'cache_hit' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : log.status === 'success' 
                                ? 'bg-blue-500/10 text-blue-400' 
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2 px-3">{log.latencyMs} ms</td>
                          <td className="py-2 px-3 text-emerald-400 font-semibold">+{log.tokensSaved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
