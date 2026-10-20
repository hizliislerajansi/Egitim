import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  BookOpen, 
  Bot, 
  HelpCircle, 
  Smartphone, 
  Calendar, 
  FlaskConical, 
  Layers, 
  Volume2, 
  Check, 
  Play,
  RotateCcw
} from 'lucide-react';
import { ScreenId } from './Sidebar';

export interface GuideStep {
  id: string;
  badge: string;
  title: string;
  screenTarget: ScreenId;
  description: string;
  bullets: string[];
  actionLabel: string;
  icon: React.ReactNode;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'step_welcome',
    badge: '1 / 6 • Başlangıç',
    title: 'DersPusulası’na Hoş Geldin! 🎉',
    screenTarget: 'dashboard',
    description: 'DersPusulası, 9. sınıf yerel içerikleri içeren, çevrimdışı öncelikli ve ders rehberi destekli kişisel çalışma rehberindir.',
    bullets: [
      'Yerel derslerin konu ve kazanım kayıtları yerel SQLite veritabanında saklanır.',
      'İnternet olmasa dahi konu anlatımları, soru bankası ve formüller yerel olarak çalışabilir.',
      'Akıllı aralıklı tekrar (Spaced Repetition) algoritması tekrarı planlamana yardımcı olur.'
    ],
    actionLabel: 'Dersler ve Atölyeleri İncele',
    icon: <BookOpen size={28} color="#2563eb" />
  },
  {
    id: 'step_subjects',
    badge: '2 / 6 • Ders Atölyeleri',
    title: 'Dersler, 3 Yanlış Kuralı & Basitleştirme',
    screenTarget: 'subject_workshop',
    description: 'Matematik, Fizik, Kimya, Biyoloji, Türkçe, Tarih ve Coğrafya atölyelerinde adım adım öğren.',
    bullets: [
      'Pedagojik Döngü: Yanlış cevap verdiğinde soru hemen geçilmez; sistem 3 yanlış bekler ve her yanlışta konuyu otomatik daha basit anlatır.',
      'Konu Bitince Tekrar: 3 kez yanlış yaptığın sorular konu sonunda pekiştirme için otomatik tekrar önüne gelir.',
      'Çift Dilli Ses: Türkçe ve İngilizce konu anlatımlarını yerel veya ders rehberi sesiyle dinleyebilirsin.'
    ],
    actionLabel: 'Soru Bankası & Sınav Moduna Geç',
    icon: <Layers size={28} color="#059669" />
  },
  {
    id: 'step_exam_practice',
    badge: '3 / 6 • Soru Bankası & Sınav Modu',
    title: 'Öğrenme Modu ve Gerçek Sınav Modu',
    screenTarget: 'question_bank',
    description: 'Soruları çözerken iki farklı modu kullanabilirsin:',
    bullets: [
      'Öğrenme Modu: Çözüm esnasında ipucu kademeleri (İpucu 1, İpucu 2) ve branş öğretmeninden dinamik rehberlik alabilirsin.',
      'Resmî Sınav Modu: 10 soruluk, geri sayımlı (10 dk) ve ipucusuz gerçek sınav simülasyonu. Sınav bitiminde detaylı MEB kazanım karnesi çıkar.',
      'Otomatik Aktarım: Sınavdaki tüm yanlışların analiz edilerek Kişisel Yanlışlar Defteri’ne işlenir.'
    ],
    actionLabel: 'Öğretmenni Keşfet',
    icon: <HelpCircle size={28} color="#d97706" />
  },
  {
    id: 'step_tutor_ladder',
    badge: '4 / 6 • Rehber Öğretmen',
    title: '8 Basamaklı Anlatım Merdiveni & 0 Token Matematik',
    screenTarget: 'tutor',
    description: 'ders rehberi sadece cevap vermez; seviyene göre anlatımını uyarlar.',
    bullets: [
      '8 Basamaklı Merdiven: "Daha Basit Anlat", "Günlük Yaşam Örneği", "Analoji / Benzetme", "Görsel / Şematik", "Sokratik Soru" butonlarıyla dilediğin tonda anlatım al.',
      'Deterministik Matematik: 2. dereceden denklemler ($ax^2 + bx + c = 0$) yerel JavaScript motoru ile 0 token harcayarak anında çözülür.',
      'Rol Ayrımı: Branş Öğretmeni, Sınıf Öğretmeni ve Rehberlik Koçu rolleri arasında geçiş yapabilirsin.'
    ],
    actionLabel: 'Telefon Mikrofonu Özelliğini Gör',
    icon: <Bot size={28} color="#7c3aed" />
  },
  {
    id: 'step_phone_mic',
    badge: '5 / 6 • Kablosuz Donanım',
    title: 'Telefonunu Kablosuz Mikrofon Yap (Sıfır Kurulum)',
    screenTarget: 'tutor',
    description: 'Bilgisayarında kaliteli mikrofon yoksa akıllı telefonunu anında kablosuz mikrofona dönüştür.',
    bullets: [
      'Tek Tıkla QR Kod: Mikrofon yanındaki telefon ikonuna tıkla, telefon kameranla QR kodu tara.',
      'Sıfır Ek Yazılım: Telefona uygulama yüklemen gerekmez; telefon tarayıcısından canlı VU-meter ile sesini bilgisayara iletir.',
      'Otomatik Geri Dönüş (Fallback): Telefonun şarjı biter veya bağlantısı kesilirse sistem kesintisiz bilgisayar mikrofonuna geri döner.'
    ],
    actionLabel: 'Öğrenme Merkezi & Yanlışlar Defteri',
    icon: <Smartphone size={28} color="#2563eb" />
  },
  {
    id: 'step_learning_hub',
    badge: '6 / 6 • Ustalık & Tekrar',
    title: 'Kişisel Yanlışlar Defteri & Benzer Soru Üretici',
    screenTarget: 'goals',
    description: 'Eksiklerini kalıcı kazanıma dönüştür.',
    bullets: [
      'Hata Sınıflandırma: Hataların "Kavram Yanılgısı", "İşlem Hatası", "Dikkatsizlik" olarak etiketlenir.',
      'Benzer Soru Üret: Yanlış yaptığın sorunun sayıları değiştirilmiş paralel varyantını tek tıkla üretip tekrar çöz.',
      'Aralıklı Tekrar Takvimi (SM-2): 1., 3., 7. ve 14. günlerde unutma eğrisine göre hatırlatma al.'
    ],
    actionLabel: 'Rehberi Tamamla ve Çalışmaya Başla 🚀',
    icon: <CheckCircle size={28} color="#059669" />
  }
];

interface TutorialWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToScreen?: (screen: ScreenId) => void;
}

export const TutorialWizardModal: React.FC<TutorialWizardModalProps> = ({
  isOpen,
  onClose,
  onNavigateToScreen
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const currentStep = GUIDE_STEPS[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === GUIDE_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      if (onNavigateToScreen) {
        onNavigateToScreen(GUIDE_STEPS[nextIdx].screenTarget);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      if (onNavigateToScreen) {
        onNavigateToScreen(GUIDE_STEPS[prevIdx].screenTarget);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '680px', width: '92%', borderRadius: '14px', padding: '24px 28px' }}
      >
        {/* Üst Başlık & Kapat Butonu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              {currentStep.badge}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Uygulama Kullanım Sihirbazı
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Adım Gösterge Çizgileri */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '22px' }}>
          {GUIDE_STEPS.map((step, idx) => (
            <div 
              key={step.id} 
              onClick={() => {
                setCurrentStepIdx(idx);
                if (onNavigateToScreen) onNavigateToScreen(step.screenTarget);
              }}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '3px',
                backgroundColor: idx <= currentStepIdx ? '#2563eb' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              title={step.title}
            />
          ))}
        </div>

        {/* Adım İçerik Kutusu */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', minWidth: '56px', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentStep.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {currentStep.title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Maddeler (Bullets) */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentStep.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                <div style={{ width: '18px', height: '18px', minWidth: '18px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, marginTop: '2px' }}>
                  ✓
                </div>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alt Navigasyon ve Butonlar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handlePrev}
            disabled={isFirst}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: isFirst ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} /> Önceki
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ fontSize: '0.85rem' }}
            >
              Rehberi Atla
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleNext}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}
            >
              <span>{isLast ? 'Tamamla ve Başla 🚀' : currentStep.actionLabel}</span>
              {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
