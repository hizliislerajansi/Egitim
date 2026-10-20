import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Settings, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Award, 
  CheckCircle,
  HelpCircle,
  Compass,
  Smile,
  GraduationCap
} from 'lucide-react';
import { StudentProfileEngine, AdaptiveProfile, GradeLevel, AddressStyle, ModalityPreference, VerbosityPreference } from '../services/studentProfileEngine';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: AdaptiveProfile) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, onProfileUpdated }) => {
  const [profile, setProfile] = useState<AdaptiveProfile | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState(15);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('lise_1');
  const [addressStyle, setAddressStyle] = useState<AddressStyle>('samimi');
  const [preferredModality, setPreferredModality] = useState<ModalityPreference>('balanced');
  const [verbosityPreference, setVerbosityPreference] = useState<VerbosityPreference>('orta');
  const [dailyTimeMinutes, setDailyTimeMinutes] = useState(45);
  const [goalsText, setGoalsText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const p = StudentProfileEngine.getProfile();
      setProfile(p);
      setName(p.name);
      setAge(p.age);
      setGradeLevel(p.gradeLevel);
      setAddressStyle(p.addressStyle);
      setPreferredModality(p.preferredModality);
      setVerbosityPreference(p.verbosityPreference);
      setDailyTimeMinutes(p.dailyTimeMinutes);
      setGoalsText(p.goalsText);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !profile) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StudentProfileEngine.updateProfile({
      name,
      age,
      gradeLevel,
      addressStyle,
      preferredModality,
      verbosityPreference,
      dailyTimeMinutes,
      goalsText
    });

    setSaveSuccess(true);
    if (onProfileUpdated) onProfileUpdated(updated);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#3b82f620', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
              <User size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Kişisel Öğrenme Profili</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Öğretmenniz anlatım tarzını, hızını ve zorluğunu bu ayarlara göre uyarlar.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ad ve Yaş */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Öğrenci Adı / Takma Adı</label>
              <input 
                type="text" 
                className="chat-input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Yaş</label>
              <input 
                type="number" 
                min={10} 
                max={20} 
                className="chat-input" 
                value={age} 
                onChange={e => setAge(parseInt(e.target.value) || 15)} 
                required 
              />
            </div>
          </div>

          {/* Sınıf Seviyesi */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Eğitim ve Gelişim Düzeyi
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {[
                { id: 'temel', label: 'Temel Düzey' },
                { id: 'ortaokul', label: 'Ortaokul' },
                { id: 'lise_1', label: 'Lise 1 (9. Sınıf)' },
                { id: 'lise_ileri', label: 'Lise İleri Düzey' }
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`btn ${gradeLevel === item.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                  onClick={() => setGradeLevel(item.id as GradeLevel)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hitap Biçimi */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Tercih Edilen Hitap Biçimi
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'samimi', label: '😊 Samimi', desc: 'Sevgili Deniz, gel bakalım' },
                { id: 'tesvik_edici', label: '🌟 Teşvik Edici', desc: 'Harikasın, birlikte çözelim' },
                { id: 'akademik', label: '🎓 Akademik', desc: 'Sayın Deniz, konunun analizi' }
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`btn ${addressStyle === item.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '8px 10px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}
                  onClick={() => setAddressStyle(item.id as AddressStyle)}
                >
                  <strong>{item.label}</strong>
                  <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Öğrenme Yöntemi / Modality */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              En İyi Nasıl Öğrenirsin? (Öğrenme Tercihi)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { id: 'balanced', label: '⚖️ Dengeli (Tümü)' },
                { id: 'visual', label: '📊 Görsel / Şematik' },
                { id: 'interactive', label: '🔬 Deney & Simülasyon' },
                { id: 'text', label: '📖 Metin & Adım Adım' }
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`btn ${preferredModality === item.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                  onClick={() => setPreferredModality(item.id as ModalityPreference)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Açıklama Uzunluğu ve Günlük Süre */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Açıklama Ayrıntı Düzeyi</label>
              <select 
                className="chat-input" 
                value={verbosityPreference} 
                onChange={e => setVerbosityPreference(e.target.value as VerbosityPreference)}
              >
                <option value="ozet">Özet & Net (Kısa)</option>
                <option value="orta">Dengeli / Orta Düzey</option>
                <option value="detayli">Detaylı & Derinlemesine</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Günlük Ayırabileceğin Süre</label>
              <select 
                className="chat-input" 
                value={dailyTimeMinutes} 
                onChange={e => setDailyTimeMinutes(parseInt(e.target.value))}
              >
                <option value={20}>20 Dakika (Hızlı Tekrar)</option>
                <option value={45}>45 Dakika (Önerilen MEB Oturumu)</option>
                <option value={60}>60 Dakika (Kapsamlı Çalışma)</option>
                <option value={90}>90 Dakika (Yoğun Sınav Kampı)</option>
              </select>
            </div>
          </div>

          {/* Hedef Notu */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Öğrenme Hedefin</label>
            <input 
              type="text" 
              className="chat-input" 
              value={goalsText} 
              onChange={e => setGoalsText(e.target.value)} 
              placeholder="Örn: Fonksiyonları tam anlamak, İngilizce konuşma özgüveni kazanmak..." 
            />
          </div>

          {/* Kaydet Butonu */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {saveSuccess ? <CheckCircle size={16} /> : <Sparkles size={16} />}
              <span>{saveSuccess ? 'Kaydedildi!' : 'Profili Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
