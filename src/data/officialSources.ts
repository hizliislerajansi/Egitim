export interface OfficialEducationSource {
  id: string;
  name: string;
  shortDesc: string;
  url: string;
  category: 'books' | 'questions' | 'portal' | 'curriculum' | 'support';
  grade: string;
}

export const OFFICIAL_EDUCATION_SOURCES: OfficialEducationSource[] = [
  {
    id: 'src_ogm_materyal',
    name: 'OGM Materyal',
    shortDesc: 'Ortaöğretim Genel Müdürlüğü Etkileşimli Ders Kitapları, Beceri Temelli Etkinlikler ve Konu Anlatımları',
    url: 'https://ogmmateryal.eba.gov.tr/',
    category: 'curriculum',
    grade: '9. Sınıf'
  },
  {
    id: 'src_ogm_soru',
    name: 'OGM Soru Bankası',
    shortDesc: '9. Sınıf Ünite Değerlendirme Soruları, Çözümlü Denemeler ve Kazanım Kavrama Testleri',
    url: 'https://ogmmateryal.eba.gov.tr/',
    category: 'questions',
    grade: '9. Sınıf'
  },
  {
    id: 'src_tymm_kitaplar',
    name: 'MEB Ders Kitapları',
    shortDesc: 'Türkiye Yüzyılı Maarif Modeli ve Güncel Lise 1 Ders Kitapları Havuzu',
    url: 'https://tymm.meb.gov.tr/ders-kitaplari',
    category: 'books',
    grade: '9. Sınıf'
  },
  {
    id: 'src_yardimci_kaynaklar',
    name: 'MEB Yardımcı Kaynaklar',
    shortDesc: 'Çalışma Fasikülleri, Tekrar Testleri, Çalışma Defterleri ve Beceri Temelli Sorular',
    url: 'https://yardimcikaynaklar.meb.gov.tr/',
    category: 'support',
    grade: '9. Sınıf'
  },
  {
    id: 'src_eba',
    name: 'Eğitim Bilişim Ağı (EBA)',
    shortDesc: 'Milli Eğitim Bakanlığı Dijital Eğitim Portalı ve Video Ders Arşivi',
    url: 'https://www.eba.gov.tr/',
    category: 'portal',
    grade: 'Lise 1'
  },
  {
    id: 'src_meb',
    name: 'T.C. Millî Eğitim Bakanlığı',
    shortDesc: 'Milli Eğitim Bakanlığı Resmi Portalı ve Güncel Ortaöğretim Müfredatları',
    url: 'https://www.meb.gov.tr/',
    category: 'portal',
    grade: 'Genel'
  }
];
