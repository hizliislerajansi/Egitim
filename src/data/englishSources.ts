export interface EnglishLanguageSource {
  id: string;
  name: string;
  url: string;
  category: 'cefr' | 'dictionary' | 'sentences' | 'learning_content' | 'linguistics';
  categoryLabel: string;
  shortDesc: string;
  integrationNote: string;
  tag: string;
}

export const ENGLISH_LANGUAGE_SOURCES: EnglishLanguageSource[] = [
  {
    id: 'src_openjam',
    name: 'Openjam',
    url: 'https://github.com/amirj4m/openjam',
    category: 'cefr',
    categoryLabel: 'Kelime & CEFR',
    shortDesc: 'Açık kaynaklı İngilizce kelime veritabanı ve CEFR seviye derecelendirmeleri.',
    integrationNote: '9. sınıf kelimelerinin A1, A2, B1 seviye etiketlemesinde ve kelime listelerinde referans alınır.',
    tag: 'Açık Veri & CEFR'
  },
  {
    id: 'src_cefr_j',
    name: 'Open Language Profiles – CEFR-J',
    url: 'https://github.com/openlanguageprofiles/olp-en-cefrj',
    category: 'cefr',
    categoryLabel: 'Dil Seviyeleri',
    shortDesc: 'Seviyelendirilmiş kelime ve dil bilgisi (gramer) yeterlilik profili verileri.',
    integrationNote: 'Lise hazırlık ve 9. sınıf müfredatındaki gramer kalıplarının pedagojik zorluk derecelerinde kullanılır.',
    tag: 'Gramer & Standart'
  },
  {
    id: 'src_free_dict_api',
    name: 'Free Dictionary API',
    url: 'https://dictionaryapi.dev/',
    category: 'dictionary',
    categoryLabel: 'API & Telaffuz',
    shortDesc: 'Kelime anlamları, fonetik yazım (IPA) ve sesli telaffuz sunan ücretsiz REST API.',
    integrationNote: 'İngilizce Laboratuvarında canlı kelime sorgulama, IPA fonetik gösterimi ve sesli telaffuzda aktif olarak bağlanır.',
    tag: 'Canlı REST API'
  },
  {
    id: 'src_tatoeba',
    name: 'Tatoeba',
    url: 'https://tatoeba.org/en/downloads',
    category: 'sentences',
    categoryLabel: 'Örnek Cümleler',
    shortDesc: 'Çok dilli, açık lisanslı İngilizce örnek cümleler ve Türkçe karşılıkları.',
    integrationNote: 'Kelime kartlarındaki ve soru çözümlerindeki bağlamsal gerçek hayat cümlelerinde referans verilir.',
    tag: 'Cümle Veritabanı'
  },
  {
    id: 'src_wordnet',
    name: 'Princeton WordNet',
    url: 'https://wordnet.princeton.edu/',
    category: 'linguistics',
    categoryLabel: 'Eş Anlam & İlişki',
    shortDesc: 'Princeton Üniversitesi semantik kelime ağı; eş anlamlılar (synsets) ve anlam ilişkileri.',
    integrationNote: 'Öğretmen eş anlamlı / zıt anlamlı kelime analizlerinde ve kavram eşleştirmede bağlanır.',
    tag: 'Semantik Ağ'
  },
  {
    id: 'src_voa_learning',
    name: 'VOA Learning English',
    url: 'https://learningenglish.voanews.com/',
    category: 'learning_content',
    categoryLabel: 'Dinleme & Okuma',
    shortDesc: 'Seviyelere göre uyarlanmış İngilizce haber metinleri, yavaş tempolu dinleme ve video içerikleri.',
    integrationNote: 'Lise 1 dinleme ve okuma anlama çalışmalarında ek açık içerik kaynağı olarak sunulur.',
    tag: 'Sesli Medya'
  },
  {
    id: 'src_british_council_teens',
    name: 'British Council LearnEnglish Teens',
    url: 'https://learnenglishteens.britishcouncil.org/',
    category: 'learning_content',
    categoryLabel: 'Gençler İçin Etkinlik',
    shortDesc: 'Genç öğrencilere yönelik interaktif dil bilgisi, kelime, okuma ve dinleme etkinlikleri.',
    integrationNote: '9. sınıf öğrencilerinin yaş grubuna özel interaktif dil alıştırmaları ve beceri etkinlikleri.',
    tag: 'Eğitsel Portal'
  },
  {
    id: 'src_cambridge_dict',
    name: 'Cambridge Dictionary',
    url: 'https://dictionary.cambridge.org/',
    category: 'dictionary',
    categoryLabel: 'Sözlük & Fonetik',
    shortDesc: 'Kapsamlı İngilizce-Türkçe akademik sözlük, ayrıntılı tanımlar ve telaffuz rehberi.',
    integrationNote: 'Detaylı kelime analizi ve çift dilli (EN-TR) arama için doğrudan derin bağlantı sağlanır.',
    tag: 'Akademik Sözlük'
  },
  {
    id: 'src_wiktionary',
    name: 'Wiktionary',
    url: 'https://en.wiktionary.org/wiki/Wiktionary:Copyrights',
    category: 'dictionary',
    categoryLabel: 'Açık Sözlük',
    shortDesc: 'Wikimedia açık sözlüğü; kelime kökenleri (etimoloji), açıklamalar ve fonetik veriler.',
    integrationNote: 'Geniş açık lisanslı kelime kökeni, fiil çekimleri ve morfolojik detaylara bağlantı sağlar.',
    tag: 'Açık Lisans'
  },
  {
    id: 'src_cefr_coe',
    name: 'CEFR – Council of Europe',
    url: 'https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors',
    category: 'cefr',
    categoryLabel: 'CEFR Çerçevesi',
    shortDesc: 'Avrupa Dilleri Ortak Başvuru Metni yeterlilik tanımlayıcıları ve küresel öğrenme hedefleri.',
    integrationNote: 'Lise 1 (A1 - A2+) dil yeterlilik göstergelerinin ve seviye hedeflerinin resmi temelidir.',
    tag: 'Resmi Standart'
  }
];
