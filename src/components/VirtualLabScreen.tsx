import React, { useState } from 'react';
import { 
  FlaskConical, 
  Atom, 
  Compass, 
  BookOpen, 
  Layers, 
  ExternalLink, 
  CheckCircle, 
  Play, 
  RotateCcw,
  Sliders,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { PHET_SIMULATIONS, PhetSimulation } from '../data/phetSimulations';

export const VirtualLabScreen: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'physics' | 'chemistry' | 'math' | 'biology'>('all');
  const [activeSim, setActiveSim] = useState<PhetSimulation>(PHET_SIMULATIONS[0]);
  const [studentHypothesis, setStudentHypothesis] = useState('');
  const [experimentLogs, setExperimentLogs] = useState<Array<{ id: string; time: string; note: string }>>([]);

  const filteredSims = PHET_SIMULATIONS.filter(s => {
    if (selectedSubject === 'all') return true;
    return s.subject === selectedSubject;
  });

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentHypothesis.trim()) return;

    setExperimentLogs(prev => [
      {
        id: `log_${Date.now()}`,
        time: new Date().toLocaleTimeString('tr-TR'),
        note: studentHypothesis.trim()
      },
      ...prev
    ]);
    setStudentHypothesis('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Hero Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#3b82f620', border: '1px solid #3b82f640', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={26} color="#60a5fa" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                Sanal Laboratuvar & İnteraktif Simülasyonlar
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                PhET Interactive Simulations (University of Colorado Boulder) lisanslı deney ortamı.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#10b98120', color: '#10b981', border: '1px solid #10b98140', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600 }}>
              CC-BY 4.0 Lisanslı
            </span>
          </div>
        </div>

        {/* Ders Filtreleri */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Tüm Deneyler' },
            { id: 'physics', label: 'Fizik (Kuvvet, Ohm, Hooke)' },
            { id: 'chemistry', label: 'Kimya (Atom, pH)' },
            { id: 'math', label: 'Matematik (Doğru Grafikleri, Eşitlik)' },
            { id: 'biology', label: 'Biyoloji (Doğal Seçilim)' }
          ].map(f => (
            <button
              key={f.id}
              className={`btn ${selectedSubject === f.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setSelectedSubject(f.id as any)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ana Simülasyon Alanı ve Kontroller */}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 340px', gap: '18px' }}>
        {/* Sol Taraf: Simülasyon Ekranı (iFrame) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-ogreniliyor" style={{ fontSize: '0.75rem' }}>
                {activeSim.mebCode}
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {activeSim.title}
              </h3>
            </div>
            <a
              href={activeSim.webUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="PhET Resmi Sayfasında Aç"
            >
              <ExternalLink size={13} />
              <span>Tam Ekran</span>
            </a>
          </div>

          {/* iFrame Simülasyon Gömücüsü */}
          <div style={{ width: '100%', height: '540px', backgroundColor: '#000000', position: 'relative' }}>
            <iframe
              src={activeSim.embedUrl}
              title={activeSim.title}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Alt Bilgi & Atıf */}
          <div style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
            {activeSim.attribution}
          </div>
        </div>

        {/* Sağ Taraf: Deney Hedefleri, Değişkenler ve Öğrenci Not Defteri */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Deney Hedefleri */}
          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6' }}>
              <Compass size={16} />
              Deneyin Hedefleri
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeSim.experimentGoals.map((g, idx) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '14px 0 6px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <Sliders size={15} />
              Kontrol Edilebilir Değişkenler
            </h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {activeSim.variables.map((v, idx) => (
                <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Öğrenci Hipotez & Gözlem Kayıt Defteri */}
          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6' }}>
              <FileText size={16} />
              Deney Gözlem & Not Defteri
            </h4>
            <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={studentHypothesis}
                onChange={(e) => setStudentHypothesis(e.target.value)}
                placeholder="Örn: Yay sabiti arttığında aynı kuvvet altında uzama miktarı yarıya düştü..."
                rows={3}
                className="chat-input"
                style={{ width: '100%', fontSize: '0.82rem', padding: '8px' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', alignSelf: 'flex-end' }}
              >
                Gözlemi Kaydet
              </button>
            </form>

            {/* Kaydedilen Gözlemler */}
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {experimentLogs.length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Henüz bir gözlem kaydedilmedi. Simülasyonda değişkenleri değiştirip sonucunu buraya yazabilirsiniz.
                </span>
              ) : (
                experimentLogs.map(log => (
                  <div key={log.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>{log.time}</div>
                    <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{log.note}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diğer Simülasyonlar Listesi */}
          <div className="card">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
              Diğer Simülasyonlar ({filteredSims.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {filteredSims.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSim(s)}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: activeSim.id === s.id ? '#3b82f620' : 'var(--bg-secondary)',
                    color: activeSim.id === s.id ? '#3b82f6' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s.subjectTitle}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
