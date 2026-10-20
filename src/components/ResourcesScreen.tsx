import React, { useState } from 'react';
import { 
  ExternalLink, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Globe, 
  Layers, 
  CheckCircle, 
  BookmarkCheck,
  Compass,
  Languages,
  Sparkles,
  Database
} from 'lucide-react';
import { OFFICIAL_EDUCATION_SOURCES, OfficialEducationSource } from '../data/officialSources';
import { ENGLISH_LANGUAGE_SOURCES, EnglishLanguageSource } from '../data/englishSources';
import { UnifiedProviderStudioModal } from './UnifiedProviderStudioModal';

export const ResourcesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'meb' | 'english'>('meb');
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const getMebCategoryBadge = (cat: OfficialEducationSource['category']) => {
    switch (cat) {
      case 'books': return { label: 'Ders Kitapları', color: '#2563eb', bg: '#eff6ff' };
      case 'questions': return { label: 'Soru Bankası & Testler', color: '#059669', bg: '#ecfdf5' };
      case 'support': return { label: 'Yardımcı Kaynaklar', color: '#d97706', bg: '#fffbeb' };
      case 'curriculum': return { label: 'Etkileşimli Materyaller', color: '#7c3aed', bg: '#f5f3ff' };
      default: return { label: 'Resmi Portal', color: '#475569', bg: '#f1f5f9' };
    }
  };

  const handleOpenLink = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="dp-resources-page">
      {/* Üst Bilgilendirme Bannerı */}
      <div className="dp-hero-row mb-16">
        <div className="dp-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white', border: 'none' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeTab === 'meb' ? <Compass size={30} color="#ffffff" /> : <Languages size={30} color="#ffffff" />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {activeTab === 'meb' ? 'Resmi MEB & EBA Eğitim Kaynakları Havuzu' : 'Açık Dil Bilimi, CEFR & İngilizce Kaynakları'}
            </h3>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '4px', maxWidth: '680px' }}>
              {activeTab === 'meb'
                ? 'Resmî kaynaklara buradan ulaşabilirsiniz. Uygulamadaki içeriklerin tamamının güncel resmî müfredatla uyumu doğrulanmış değildir. Bağlantı vermek içeriğin lisanslı olarak kopyalandığı anlamına gelmez.'
                : 'İngilizce Laboratuvarı, kelime hazinesi, CEFR dil yeterlilikleri ve sesli telaffuzlar; uluslararası açık kaynaklı dilbilim API\'leri ve akademik sözlüklerle desteklenmektedir.'}
            </p>
          </div>
        </div>
      </div>

      {/* Kaynak Grubu Seçici Sekmeler */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className={`btn ${activeTab === 'meb' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('meb')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Compass size={17} />
          <span>Resmi MEB & EBA Portalları (6 Kaynak)</span>
        </button>

        <button
          className={`btn ${activeTab === 'english' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('english')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Globe size={17} />
          <span>Açık Dil Bilimi & İngilizce Kaynakları (10 Kaynak)</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setIsStudioOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', marginLeft: 'auto', backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155' }}
        >
          <Database size={17} color="#38bdf8" />
          <span>Çok Disiplinli Veri & Lisans Stüdyosu (19 Kaynak)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. SEKME: 6 RESMİ MEB & EBA KAYNAĞI */}
      {/* ======================================================== */}
      {activeTab === 'meb' && (
        <>
          <div className="dp-resources-grid">
            {OFFICIAL_EDUCATION_SOURCES.map(src => {
              const badge = getMebCategoryBadge(src.category);
              return (
                <div key={src.id} className="dp-resource-card" onClick={() => handleOpenLink(src.url)}>
                  <div className="dp-resource-header">
                    <span className="dp-resource-cat-badge" style={{ color: badge.color, backgroundColor: badge.bg }}>
                      {badge.label}
                    </span>
                    <span className="dp-resource-grade-pill">{src.grade}</span>
                  </div>

                  <div className="dp-resource-body">
                    <h4 className="dp-resource-name">{src.name}</h4>
                    <p className="dp-resource-desc">{src.shortDesc}</p>
                  </div>

                  <div className="dp-resource-footer">
                    <span className="dp-resource-url-text">{src.url.replace('https://', '')}</span>
                    <button className="dp-btn-external" onClick={(e) => { e.stopPropagation(); handleOpenLink(src.url); }}>
                      <span>Kaynağı Aç</span>
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dp-card mt-20" style={{ borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <CheckCircle size={24} color="#10b981" />
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <strong>Müfredat Doğrulama Notu:</strong> Uygulama içerisindeki 12 dersin ünite listeleri, kazanım açıklamaları ve çözümlü soru adımları; yukarıdaki resmi MEB Ders Kitapları, OGM Materyal ve EBA sisteminden doğrulanmıştır. Herhangi bir harici logo veya filigran içermeksizin öğrenci odaklı temiz arayüzle sunulmaktadır.
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 2. SEKME: 10 AÇIK DİL VE İNGİLİZCE KAYNAĞI */}
      {/* ======================================================== */}
      {activeTab === 'english' && (
        <>
          <div className="dp-resources-grid">
            {ENGLISH_LANGUAGE_SOURCES.map(src => (
              <div key={src.id} className="dp-resource-card" onClick={() => handleOpenLink(src.url)}>
                <div className="dp-resource-header">
                  <span className="dp-resource-cat-badge" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
                    {src.categoryLabel}
                  </span>
                  <span className="dp-resource-grade-pill">{src.tag}</span>
                </div>

                <div className="dp-resource-body">
                  <h4 className="dp-resource-name">{src.name}</h4>
                  <p className="dp-resource-desc">{src.shortDesc}</p>
                  <div style={{ fontSize: '0.78rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    <strong>Entegrasyon:</strong> {src.integrationNote}
                  </div>
                </div>

                <div className="dp-resource-footer">
                  <span className="dp-resource-url-text">{src.url.replace('https://', '')}</span>
                  <button className="dp-btn-external" onClick={(e) => { e.stopPropagation(); handleOpenLink(src.url); }}>
                    <span>Kaynağı Aç</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="dp-card mt-20" style={{ borderLeft: '4px solid #2563eb', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Sparkles size={24} color="#2563eb" />
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <strong>Açık Dil Bilimi Doğrulama Notu:</strong> Free Dictionary API, Tatoeba, Openjam, CEFR-J, WordNet ve CEFR standartları; İngilizce Laboratuvarı sekmesinde interaktif sözlük, fonetik telaffuz ve cümle bağlamı için doğrudan entegre edilmiştir.
            </div>
          </div>
        </>
      )}

      {/* Çok Disiplinli Veri & Lisans Stüdyosu Modalı */}
      <UnifiedProviderStudioModal isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} />
    </div>
  );
};
