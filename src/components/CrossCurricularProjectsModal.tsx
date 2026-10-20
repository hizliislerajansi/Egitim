import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Layers, 
  Play, 
  Terminal, 
  CheckCircle, 
  BookOpen, 
  Code, 
  Cpu, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface ProjectTask {
  id: string;
  title: string;
  disciplines: string[];
  description: string;
  mebOutcomes: string[];
  problemStatement: string;
  initialCode: string;
  expectedOutput: string;
  solutionHint: string;
}

const CROSS_CURRICULAR_PROJECTS: ProjectTask[] = [
  {
    id: 'bio_eng_dna',
    title: 'DNA Transkripsiyon ve Uluslararası Biyoloji Terminolojisi',
    disciplines: ['Biyoloji', 'İngilizce', 'Algoritmik Düşünme'],
    description: 'Biyoloji dersindeki Nükleik Asitler (DNA -> mRNA transkripsiyonu) konusunu İngilizce bilimsel terimlerle birleştiren hesaplamalı biyoloji algoritması.',
    mebOutcomes: ['BİY-09: Nükleik asitlerin yapısını ve işlevlerini açıklar', 'İNG-09: Scientific terminology & process descriptions in CEFR A2/B1'],
    problemStatement: 'Bir DNA dizisindeki Adenin (A), Timin (T), Guanin (G) ve Sitozin (C) bazlarını alıp mRNA eşleniğine (A->U, T->A, C->G, G->C) dönüştüren ve kodon sayısını İngilizce raporlayan JavaScript algoritması yaz.',
    initialCode: `// Bio-English Cross Project: DNA to mRNA Transcription
function transcribeDNA(dnaSequence) {
  const map = { 'A': 'U', 'T': 'A', 'C': 'G', 'G': 'C' };
  let mrna = '';
  for (let base of dnaSequence.toUpperCase()) {
    mrna += map[base] || base;
  }
  return {
    originalDNA: dnaSequence,
    transcribedMRNA: mrna,
    codonCount: Math.floor(mrna.length / 3),
    scientificReport: \`Transcribed \${dnaSequence.length} bases into mRNA. Detected \${Math.floor(mrna.length / 3)} functional codons.\`
  };
}

console.log(transcribeDNA('ATGCGATCGATCGATCG'));
`,
    expectedOutput: 'Transcribed 17 bases into mRNA. Detected 5 functional codons.',
    solutionHint: 'mRNA dönüşümünde DNA Timin (T) nükleotidi RNA Urasil (U) ile eşlenir.'
  },
  {
    id: 'phys_math_kinematics',
    title: 'Fiziksel Hız-Zaman Fonksiyonu & 2. Dereceden Yol Denklemi',
    disciplines: ['Fizik', 'Matematik', 'Simülasyon'],
    description: 'Fizikteki Bir Boyutta Sabit İvmeli Hareket bağıntılarını (x = v0*t + 0.5*a*t^2) Matematikteki 2. Dereceden Fonksiyonlar ile modelleme.',
    mebOutcomes: ['FİZ-09: Düzgün doğrusal hareket ve ivme bağıntılarını hesaplar', 'MAT-09: İkinci dereceden fonksiyon grafiği ve tepe noktasını yorumlar'],
    problemStatement: 'İlk hızı v0 = 10 m/s ve ivmesi a = 2 m/s² olan bir aracın t = 0 ile t = 5 saniye arasındaki konumlarını saniye saniye hesaplayıp listele.',
    initialCode: `// Physics-Math Cross Project: Kinematics Function
function calculateTrajectory(v0, a, maxT) {
  const points = [];
  for (let t = 0; t <= maxT; t++) {
    const position = (v0 * t) + (0.5 * a * Math.pow(t, 2));
    points.push({ time: t, positionMeters: position });
  }
  return points;
}

const result = calculateTrajectory(10, 2, 5);
console.log(result);
`,
    expectedOutput: 't=5s için konum x = 75 metre',
    solutionHint: 'Sabit ivmeli harekette konum zamanın karesiyle doğru orantılı olarak parabolik artar.'
  },
  {
    id: 'hist_lit_epic',
    title: 'Tarihî Dönem Metin Analizi & Destan Terminolojisi',
    disciplines: ['Tarih', 'Türk Dili ve Edebiyatı', 'Doğal Dil İşleme'],
    description: 'İslamiyet Öncesi Türk Tarihi ve Edebiyatındaki destan metinleri (Oğuz Kağan, Ergenekon) üzerindeki anahtar motiflerin frekans analizi.',
    mebOutcomes: ['TAR-09: İlk ve Orta Çağlarda Avrasya bozkır kültürünü irdeler', 'TDE-09: İslamiyet öncesi Türk destanlarının motif ve yapısını inceler'],
    problemStatement: 'Bir destan pasajındaki kurt (börü), at, ok, yay ve çadır kelimelerinin sıklığını sayarak göçebe bozkır kültürüne ait baskın motif oranını belirle.',
    initialCode: `// History-Literature Cross Project: Epic Motif Analyzer
function analyzeEpicMotifs(text) {
  const bozkirKeywords = ['kurt', 'börü', 'at', 'ok', 'yay', 'çadır', 'kagan'];
  const words = text.toLowerCase().split(/[\\s,.]+/);
  const frequencies = {};
  
  bozkirKeywords.forEach(k => { frequencies[k] = 0; });
  words.forEach(w => {
    if (frequencies[w] !== undefined) frequencies[w]++;
  });

  return {
    totalWords: words.length,
    motifFrequencies: frequencies
  };
}

const sampleEpic = 'Oğuz Kagan at bindi, elinde yay ve ok ile bozkırda börü sesini duydu. Çadır kuruldu.';
console.log(analyzeEpicMotifs(sampleEpic));
`,
    expectedOutput: 'Bozkır kültür motifleri başarıyla frekans tablosuna çıkarıldı.',
    solutionHint: 'Destanlarda "börü/kurt" bağımsızlık ve yol göstericilik sembolüdür.'
  },
  {
    id: 'geo_math_scale',
    title: 'Harita Ölçek Hesaplama & Coğrafi Koordinat Dönüştürücü',
    disciplines: ['Coğrafya', 'Matematik', 'Harita Mühendisliği'],
    description: 'Coğrafyadaki Harita Ölçeği (Gerçek Uzunluk = Harita Uzunluğu * Ölçek Paydası) formülünü matematiksel oran-orantı ile çözen model.',
    mebOutcomes: ['COĞ-09: Harita ölçeklerini kullanarak gerçek uzaklık ve alan hesaplamaları yapar', 'MAT-09: Oran ve orantı problemlerini çözer'],
    problemStatement: '1/200.000 ölçekli bir MEB coğrafya atlasında iki ilçe arası 8 cm ölçülmüştür. Bu iki ilçe arasındaki gerçek mesafeyi kilometre cinsinden hesapla.',
    initialCode: `// Geography-Math Cross Project: Map Scale Calculator
function calculateRealDistance(mapCm, scaleDenominator) {
  const realCm = mapCm * scaleDenominator;
  const realKm = realCm / 100000; // 1 km = 100,000 cm
  return {
    mapDistanceCm: mapCm,
    scale: '1/' + scaleDenominator.toLocaleString(),
    realDistanceKm: realKm
  };
}

console.log(calculateRealDistance(8, 200000));
`,
    expectedOutput: '8 cm x 200.000 = 16 km',
    solutionHint: '1 metre = 100 cm, 1 kilometre = 1000 metre -> 1 km = 100.000 cm.'
  }
];

interface CrossCurricularProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrossCurricularProjectsModal: React.FC<CrossCurricularProjectsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedProject, setSelectedProject] = useState<ProjectTask>(CROSS_CURRICULAR_PROJECTS[0]);
  const [code, setCode] = useState<string>(CROSS_CURRICULAR_PROJECTS[0].initialCode);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleSelectProject = (proj: ProjectTask) => {
    setSelectedProject(proj);
    setCode(proj.initialCode);
    setConsoleOutput([]);
  };

  // Güvenli Sandboxed Çalıştırma (Function / Evaluation)
  const handleRunCode = () => {
    setIsRunning(true);
    const logs: string[] = [];

    // Yerel console.log yakalayıcı
    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('[WARN] ' + args.join(' '));
      },
      error: (...args: any[]) => {
        logs.push('[ERROR] ' + args.join(' '));
      }
    };

    try {
      // Güvenli sandbox kapsayıcı
      const runFn = new Function('console', code);
      runFn(customConsole);
      if (logs.length === 0) {
        logs.push('Kod hatasız çalıştı (Konsola çıktı yazdırılmadı).');
      }
    } catch (err: any) {
      logs.push(`Çalışma Zamanı Hatası: ${err.message}`);
    }

    setConsoleOutput(logs);
    setIsRunning(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '920px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Üst Başlık */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={18} color="#2563eb" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Disiplinlerarası Proje Atölyesi & Kodlama Sandbox
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                MEB 9. Sınıf Derslerini (Biyoloji-İngilizce, Fizik-Matematik, vb.) birleştiren hesaplamalı düşünme projeleri
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Proje Seçici Tabları */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
          {CROSS_CURRICULAR_PROJECTS.map(proj => (
            <button
              key={proj.id}
              onClick={() => handleSelectProject(proj)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: selectedProject.id === proj.id ? '2px solid #2563eb' : '1px solid var(--border-color)',
                backgroundColor: selectedProject.id === proj.id ? '#eff6ff' : 'var(--bg-secondary)',
                color: selectedProject.id === proj.id ? '#1d4ed8' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {proj.title.split('&')[0]}
            </button>
          ))}
        </div>

        {/* Proje Detay Başlığı & Kazanımları */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
              {selectedProject.title}
            </h4>
            <div style={{ display: 'flex', gap: '6px' }}>
              {selectedProject.disciplines.map((d, i) => (
                <span key={i} className="badge badge-ogreniliyor" style={{ fontSize: '0.72rem' }}>
                  {d}
                </span>
              ))}
            </div>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {selectedProject.description}
          </p>

          <div style={{ fontSize: '0.8rem', color: '#047857', backgroundColor: '#ecfdf5', padding: '8px 10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
            🎯 <strong>MEB Kazanım Hedefleri:</strong> {selectedProject.mebOutcomes.join(' • ')}
          </div>
        </div>

        {/* Problem ve Görev Yönergesi */}
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.86rem', color: '#92400e' }}>
          <strong>Görev / Problem:</strong> {selectedProject.problemStatement}
        </div>

        {/* Kod Düzenleyici & Çıktı Konsolu Alanı */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', marginBottom: '16px' }}>
          {/* Kod Editörü */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Code size={14} /> JavaScript Proje Kodu (Sandbox)
              </span>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleRunCode}
                disabled={isRunning}
              >
                <Play size={13} /> Kodu Çalıştır
              </button>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{
                width: '100%',
                height: '240px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.82rem',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                resize: 'none',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Konsol Çıktısı */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Terminal size={14} /> Çalışma Sonucu & Konsol
            </div>
            <div
              style={{
                width: '100%',
                height: '240px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.8rem',
                backgroundColor: '#020617',
                color: '#38bdf8',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5
              }}
            >
              {consoleOutput.length === 0 ? (
                <span style={{ color: '#64748b' }}>Kodu çalıştırmak için "Kodu Çalıştır" butonuna tıklayınız.</span>
              ) : (
                consoleOutput.map((out, idx) => (
                  <div key={idx} style={{ marginBottom: '4px' }}>{out}</div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* İpucu ve Beklenen Çözüm */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <div>💡 <strong>İpucu:</strong> {selectedProject.solutionHint}</div>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.84rem' }}>
            Projeyi Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
