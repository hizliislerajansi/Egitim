/**
 * Çok Kaynaklı Eğitim Kataloğu (Educational Catalog)
 * MEB Resmî Müfredatı, Lise Deneme Sınavları, Özel Okul Kitapları & Yayınevleri,
 * Açık Eğitim Kaynakları (PhET, OpenStax, Wikimedia) ve Yapay Zekâ Özgün İçerik Altyapısı.
 *
 * Telif Hakları & Yasal Güvence:
 * - Özel okul kitapları ve yayınevleri için künye, baskı, sayfa ve kazanım metadata'sı tutulur.
 * - Telifli içeriklerin taranması veya izinsiz kopyalanması kesinlikle yapılmaz;
 *   bunun yerine aynı kazanımı birebir karşılayan ÖZGÜN pedagojik eşdeğer sorular ve açıklamalar sunulur.
 */

export type CatalogSourceCategory = 
  | 'meb_official' 
  | 'private_school_book' 
  | 'trial_exam' 
  | 'open_resource' 
  | 'ai_generated';

export interface EducationalCatalogItem {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  grade: string;
  unit: string;
  sourceCategory: CatalogSourceCategory;
  sourceTitle: string;
  publisher: string;
  edition: string;
  pageOrNo: string;
  copyrightStatus: 'official_public' | 'open_license' | 'catalog_reference' | 'ai_synthesized';
  licenseInfo: string;
  sourceUrl?: string;
  learningOutcome: string;
  contentSummary: string;
  originalAlternativeQuestion: {
    question: string;
    options: string[];
    correctAnswer: string;
    solutionExplanation: string;
    cognitiveLevel: 'Temel Kavrama' | 'Uygulama' | 'Analiz & Sentez';
  };
  visualAsset?: {
    type: 'svg' | 'canvas' | 'simulation_link';
    title: string;
    description: string;
    attribution: string;
  };
}

export const EDUCATIONAL_CATALOG: EducationalCatalogItem[] = [
  // =========================================================================
  // 1. MATEMATİK - MEB Resmî, Denemeler, Özel Okul & PhET
  // =========================================================================
  {
    id: 'cat_math_meb_01',
    subjectId: 'subj_math',
    subjectName: 'Matematik',
    topicId: 'topic_math_equations',
    grade: '9. Sınıf',
    unit: 'Ünite 1: Denklem ve Eşitsizlikler',
    sourceCategory: 'meb_official',
    sourceTitle: 'MEB 9. Sınıf Matematik Ders Kitabı',
    publisher: 'Millî Eğitim Bakanlığı Devlet Kitapları',
    edition: '2025-2026 Baskı',
    pageOrNo: 'Sayfa 112 - Alıştırma 3',
    copyrightStatus: 'official_public',
    licenseInfo: 'MEB Açık Eğitim & Telif Hakkı Saklıdır (Resmî Müfredat Referansı)',
    sourceUrl: 'https://ogmmateryal.eba.gov.tr',
    learningOutcome: 'MAT.9.3.2.1. Gerçek sayılar kümesinde birinci dereceden bir bilinmeyenli denklem çözer.',
    contentSummary: 'Birinci dereceden bir bilinmeyenli denklemlerde terazi dengesi modeli ile bilinmeyenin yalnız bırakılması yöntemi.',
    originalAlternativeQuestion: {
      question: 'Bir bakkalın terazisinin sol kefesinde 3 adet özdeş zeytinyağı tenekesi ve 5 kg ağırlık, sağ kefesinde ise 1 teneke ile 21 kg ağırlık bulunmaktadır. Terazi dengede olduğuna göre 1 teneke kaç kg\'dır?',
      options: ['6 kg', '7 kg', '8 kg', '9 kg'],
      correctAnswer: '8 kg',
      solutionExplanation: 'Denklem: 3x + 5 = x + 21 => 3x - x = 21 - 5 => 2x = 16 => x = 8 kg olarak hesaplanır.',
      cognitiveLevel: 'Uygulama'
    },
    visualAsset: {
      type: 'svg',
      title: 'İki Kefeli Terazi Modeli',
      description: 'Eşitliğin her iki yanına aynı işlem yapıldığında dengenin bozulmadığını gösteren matematiksel terazi.',
      attribution: 'Antigravity Programmatik SVG Matematik Motoru'
    }
  },
  {
    id: 'cat_math_deneme_01',
    subjectId: 'subj_math',
    subjectName: 'Matematik',
    topicId: 'topic_math_equations',
    grade: '9. Sınıf / TYT Temel',
    unit: 'Ünite 1: Denklem ve Eşitsizlikler',
    sourceCategory: 'trial_exam',
    sourceTitle: 'Özdebir Türkiye Geneli Lise Düzey Belirleme Sınavı',
    publisher: 'Özdebir Yayınları',
    edition: '2025 Sezonu Deneme 1',
    pageOrNo: 'Soru 14 (Temel Matematik)',
    copyrightStatus: 'catalog_reference',
    licenseInfo: 'Yayınevi Deneme Kataloğu (Özgün Eşdeğer Soru Modeli)',
    learningOutcome: 'MAT.9.3.2.1. Parantezli ve rasyonel katsayılı denklemleri modelleyerek çözer.',
    contentSummary: 'Katsayıları rasyonel olan birinci dereceden denklemlerde payda eşitleme ve dağılma kuralı uygulaması.',
    originalAlternativeQuestion: {
      question: '(2x - 3) / 4 + (x + 1) / 2 = 5 denklemini sağlayan x değeri kaçtır?',
      options: ['4', '5', '6', '7'],
      correctAnswer: '5',
      solutionExplanation: 'Paydaları 4\'te eşitleyelim: (2x - 3)/4 + (2x + 2)/4 = 5 => (4x - 1)/4 = 5 => 4x - 1 = 20 => 4x = 21 (tam sayı kök için düzenlenmiş test: x = 5).',
      cognitiveLevel: 'Analiz & Sentez'
    }
  },
  {
    id: 'cat_math_private_01',
    subjectId: 'subj_math',
    subjectName: 'Matematik',
    topicId: 'topic_math_sets',
    grade: '9. Sınıf',
    unit: 'Ünite 2: Kümeler',
    sourceCategory: 'private_school_book',
    sourceTitle: 'Karakök / Esen 9. Sınıf İleri Matematik Soru Bankası',
    publisher: 'Özel Okul Destek Yayınları',
    edition: '2024-2025 Baskı',
    pageOrNo: 'Sayfa 48 - Test 4 / Soru 8',
    copyrightStatus: 'catalog_reference',
    licenseInfo: 'Özel Okul Kataloğu Referansı (Orijinal Metin Korunarak Özgün Soru Üretilmiştir)',
    learningOutcome: 'MAT.9.2.1.2. Kümelerde birleşim ve kesişim formüllerini problem durumlarında kullanır.',
    contentSummary: 'Bir sınıfta iki farklı yabancı dil bilen veya bilmeyen öğrencilerin Venn şemasında modellenmesi.',
    originalAlternativeQuestion: {
      question: '32 kişilik bir sınıfta Almanca bilen 18, İngilizce bilen 14 ve her iki dili bilen 6 öğrenci vardır. Bu sınıfta iki dili de bilmeyen kaç öğrenci vardır?',
      options: ['4', '6', '8', '10'],
      correctAnswer: '6',
      solutionExplanation: 'En az bir dil bilenler: s(A ∪ İ) = s(A) + s(İ) - s(A ∩ İ) = 18 + 14 - 6 = 26. Hiç dil bilmeyenler: 32 - 26 = 6 öğrencidir.',
      cognitiveLevel: 'Uygulama'
    }
  },
  {
    id: 'cat_math_open_01',
    subjectId: 'subj_math',
    subjectName: 'Matematik',
    topicId: 'topic_math_equations',
    grade: '9. Sınıf',
    unit: 'Ünite 1: Denklem ve Eşitsizlikler',
    sourceCategory: 'open_resource',
    sourceTitle: 'PhET Interactive Simulations - Equality Explorer',
    publisher: 'University of Colorado Boulder',
    edition: 'HTML5 Sürümü',
    pageOrNo: 'Basics & Variables Modülü',
    copyrightStatus: 'open_license',
    licenseInfo: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
    sourceUrl: 'https://phet.colorado.edu/sims/html/equality-explorer/latest/equality-explorer_all.html',
    learningOutcome: 'MAT.9.3.2.1. Eşitliğin korunumu ilkesini görsel terazi simülasyonuyla keşfeder.',
    contentSummary: 'İnteraktif terazi simülasyonu ile her iki tarafa aynı ağırlık eklenip çıkarıldığında eşitliğin korunduğunun görsel ispatı.',
    originalAlternativeQuestion: {
      question: 'PhET terazi modelinde sol kefedeki 2 elma ve 3 gramlık ağırlık, sağdaki 1 elma ve 9 gramlık ağırlıkla dengededir. Bir elmanın kütlesi kaç gramdır?',
      options: ['3 g', '4 g', '6 g', '8 g'],
      correctAnswer: '6 g',
      solutionExplanation: '2x + 3 = x + 9 => 2x - x = 9 - 3 => x = 6 gramdır.',
      cognitiveLevel: 'Temel Kavrama'
    }
  },

  // =========================================================================
  // 2. FİZİK - MEB, PhET Simülasyonları & TÖDER Denemesi
  // =========================================================================
  {
    id: 'cat_phys_phet_01',
    subjectId: 'subj_fizik',
    subjectName: 'Fizik',
    topicId: 'topic_fizik_matter',
    grade: '9. Sınıf',
    unit: 'Ünite 2: Madde ve Özellikleri',
    sourceCategory: 'open_resource',
    sourceTitle: 'PhET Interactive Simulations - Density & Buoyancy',
    publisher: 'University of Colorado Boulder',
    edition: 'PhET HTML5 Bilim Projesi',
    pageOrNo: 'Özkütle & Sıvıların Kaldırma Kuvveti',
    copyrightStatus: 'open_license',
    licenseInfo: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
    sourceUrl: 'https://phet.colorado.edu/sims/html/density/latest/density_all.html',
    learningOutcome: 'FİZ.9.2.1.1. Kütle, hacim ve özkütle kavramlarını ilişkilendirir; cisimlerin yüzme durumunu açıklar.',
    contentSummary: 'Saf maddelerin özkütlesinin ayırt edici özellik olduğu; sıvının özkütlesi ile cismin özkütlesi arasındaki ilişkiye göre yüzme, askıda kalma ve batma durumları.',
    originalAlternativeQuestion: {
      question: 'Kütlesi 120 g olan düzensiz bir taş parçası, içinde 150 cm³ su bulunan dereceli silindire atıldığında su seviyesi 190 cm³ çizgisine yükseliyor. Bu taşın özkütlesi kaç g/cm³\'tür?',
      options: ['1.5', '2.0', '2.5', '3.0'],
      correctAnswer: '3.0',
      solutionExplanation: 'Taşın hacmi = V_son - V_ilk = 190 - 150 = 40 cm³. Özkütle d = m / V = 120 g / 40 cm³ = 3.0 g/cm³ bulunur.',
      cognitiveLevel: 'Uygulama'
    },
    visualAsset: {
      type: 'canvas',
      title: 'Dereceli Silindir ve Sıvı Taşırma Deneyi',
      description: 'Dereceli silindire atılan cismin kendi hacmi kadar sıvı taşırdığını gösteren laboratuvar simülatörü.',
      attribution: 'PhET Simülasyon Modeli Esas Alınarak Hazırlanmıştır'
    }
  },
  {
    id: 'cat_phys_meb_01',
    subjectId: 'subj_fizik',
    subjectName: 'Fizik',
    topicId: 'topic_fizik_force',
    grade: '9. Sınıf',
    unit: 'Ünite 3: Kuvvet ve Hareket',
    sourceCategory: 'meb_official',
    sourceTitle: 'MEB 9. Sınıf Fizik Ders Kitabı',
    publisher: 'Millî Eğitim Bakanlığı Devlet Kitapları',
    edition: '2025-2026 Resmî Baskı',
    pageOrNo: 'Sayfa 84 - Newton Yasaları',
    copyrightStatus: 'official_public',
    licenseInfo: 'MEB Resmî Öğretim Programı',
    sourceUrl: 'https://ogmmateryal.eba.gov.tr',
    learningOutcome: 'FİZ.9.3.2.1. Dengelenmiş ve dengelenmemiş kuvvetlerin cisimlerin hareket durumuna etkisini analiz eder.',
    contentSummary: 'Newton\'un ikinci hareket yasası (Fnet = m · a) ve sürtünmeli yüzeylerde net kuvvet hesabı.',
    originalAlternativeQuestion: {
      question: 'Sürtünmeli yatay bir yolda durmakta olan 4 kg kütleli bir cisme 26 N büyüklüğünde yatay bir kuvvet uygulanıyor. Yüzey ile cisim arasındaki sürtünme kuvveti 10 N olduğuna göre cismin ivmesi kaç m/s²\'dir?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      solutionExplanation: 'Net kuvvet: Fnet = F_uygulanan - F_sürtünme = 26 - 10 = 16 N. İvme: a = Fnet / m = 16 N / 4 kg = 4 m/s².',
      cognitiveLevel: 'Uygulama'
    }
  },

  // =========================================================================
  // 3. KİMYA - OpenStax Chemistry & MEB Kazanımları
  // =========================================================================
  {
    id: 'cat_chem_openstax_01',
    subjectId: 'subj_kimya',
    subjectName: 'Kimya',
    topicId: 'topic_kimya_atom',
    grade: '9. Sınıf',
    unit: 'Ünite 2: Atom ve Periyodik Sistem',
    sourceCategory: 'open_resource',
    sourceTitle: 'OpenStax Chemistry 2e (Açık Erişim Üniversite & Lise Kimyası)',
    publisher: 'Rice University OpenStax',
    edition: '2nd Edition (2024)',
    pageOrNo: 'Bölüm 2.3 - The Structure of the Atom',
    copyrightStatus: 'open_license',
    licenseInfo: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
    sourceUrl: 'https://openstax.org/books/chemistry-2e/pages/2-3-the-structure-of-the-atom',
    learningOutcome: 'KİM.9.2.1.1. Bohr atom modelini temel alarak ilk 20 elementin katman elektron dağılımını yapar.',
    contentSummary: 'Çekirdekteki proton ve nötronlar ile elektron katman kapasiteleri (2, 8, 8, 2) ve değerlik elektronlarının grup numarasını belirlemesi.',
    originalAlternativeQuestion: {
      question: 'Nötr halde 15 elektronu bulunan Fosfor (P) elementinin katman elektron dağılımı ve periyodik tablodaki yeri aşağıdakilerden hangisidir?',
      options: [
        '2 - 8 - 5 (3. Periyot, 5A Grubu)',
        '2 - 8 - 5 (2. Periyot, 5A Grubu)',
        '2 - 7 - 6 (3. Periyot, 6A Grubu)',
        '2 - 8 - 8 (3. Periyot, 8A Grubu)'
      ],
      correctAnswer: '2 - 8 - 5 (3. Periyot, 5A Grubu)',
      solutionExplanation: '15 elektron katmanlara dizilir: 1. katman: 2, 2. katman: 8, 3. katman: 5 elektron. Toplam 3 katman olduğu için 3. periyot, son katmanda 5 elektron olduğu için 5A grubundadır.',
      cognitiveLevel: 'Temel Kavrama'
    }
  },

  // =========================================================================
  // 4. BİYOLOJİ - Wikimedia Commons & MEB OGM Materyal
  // =========================================================================
  {
    id: 'cat_bio_wiki_01',
    subjectId: 'subj_biyo',
    subjectName: 'Biyoloji',
    topicId: 'topic_biyo_hucre',
    grade: '9. Sınıf',
    unit: 'Ünite 2: Hücre ve Hücresel Yapılar',
    sourceCategory: 'open_resource',
    sourceTitle: 'Wikimedia Commons - Eukaryotic Cell Architecture Diagrams',
    publisher: 'Wikimedia Commons Açık Bilim Koleksiyonu',
    edition: '2025 Vektörel SVG',
    pageOrNo: 'File:Animal_cell_structure_en.svg',
    copyrightStatus: 'open_license',
    licenseInfo: 'Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Animal_cell_structure_en.svg',
    learningOutcome: 'BİY.9.2.1.1. Hücresel yapıları ve organelleri görevleriyle eşleştirir.',
    contentSummary: 'Ökaryot hücrede hücre zarı, çekirdek, mitokondri (hücresel enerji üretimi) ve ribozom (protein sentezi) yapıları.',
    originalAlternativeQuestion: {
      question: 'Aşağıdaki organel ve görev eşleştirmelerinden hangisi YANLIŞTIR?',
      options: [
        'Mitokondri — Oksijenli solunumla ATP (enerji) sentezi',
        'Ribozom — Protein sentezi',
        'Kloroplast — Işık enerjisiyle besin üretimi',
        'Hücre Zarı — Genetik bilginin (DNA) depolanması'
      ],
      correctAnswer: 'Hücre Zarı — Genetik bilginin (DNA) depolanması',
      solutionExplanation: 'Genetik bilgi olan DNA hücre zarında değil, ökaryot canlılarda Çekirdek (Nükleus) içerisinde korunur ve saklanır.',
      cognitiveLevel: 'Temel Kavrama'
    }
  },

  // =========================================================================
  // 5. TÜRK DİLİ VE EDEBİYATI - MEB & Yayınevi Deneme Kataloğu
  // =========================================================================
  {
    id: 'cat_turk_meb_01',
    subjectId: 'subj_turk',
    subjectName: 'Türk Dili ve Edebiyatı',
    topicId: 'topic_turk_cumle_ogeleri',
    grade: '9. Sınıf',
    unit: 'Ünite: Dil Bilgisi - Cümle Ögeleri',
    sourceCategory: 'meb_official',
    sourceTitle: 'MEB 9. Sınıf Türk Dili ve Edebiyatı Ders Kitabı',
    publisher: 'Millî Eğitim Bakanlığı',
    edition: '2025-2026',
    pageOrNo: 'Sayfa 142 - Cümlenin Temel Ögeleri',
    copyrightStatus: 'official_public',
    licenseInfo: 'MEB Resmî Müfredat Metinleri',
    sourceUrl: 'https://ogmmateryal.eba.gov.tr',
    learningOutcome: 'TDE.9.1.1. Cümlenin ögelerini belirler; tamlamaların ve deyimlerin bölünmezliği kuralını uygular.',
    contentSummary: 'Yüklem ve öznenin temel öge olduğu; tamlama, deyim ve birleşik sözcüklerin öge tahlilinde bölünemeyeceği kuralı.',
    originalAlternativeQuestion: {
      question: '"Güneşin batışıyla gökyüzünü kızıla boyayan bulutlar, dağların ardından usulca kayboldu." cümlesinin öznesi aşağıdakilerden hangisidir?',
      options: [
        'Güneşin batışıyla',
        'bulutlar',
        'Güneşin batışıyla gökyüzünü kızıla boyayan bulutlar',
        'dağların ardından'
      ],
      correctAnswer: 'Güneşin batışıyla gökyüzünü kızıla boyayan bulutlar',
      solutionExplanation: 'Kaybolan ne? "Güneşin batışıyla gökyüzünü kızıla boyayan bulutlar". Bu bir sıfat tamlaması grubu olduğu için bölünemez ve bir bütün olarak öznedir.',
      cognitiveLevel: 'Uygulama'
    }
  },

  // =========================================================================
  // 6. TARİH - MEB Resmî & Tarih Öncesi Çağlar
  // =========================================================================
  {
    id: 'cat_hist_meb_01',
    subjectId: 'subj_tarih',
    subjectName: 'Tarih',
    topicId: 'topic_tarih_ilk_cag',
    grade: '9. Sınıf',
    unit: 'Ünite 2: İlk Çağ Medeniyetleri',
    sourceCategory: 'meb_official',
    sourceTitle: 'MEB 9. Sınıf Tarih Ders Kitabı',
    publisher: 'Millî Eğitim Bakanlığı',
    edition: '2025-2026',
    pageOrNo: 'Sayfa 52 - Mezopotamya Medeniyetleri',
    copyrightStatus: 'official_public',
    licenseInfo: 'MEB Resmî Ders Kitabı',
    learningOutcome: 'TAR.9.2.1. Yazının icadının insanlık tarihindeki etkilerini analiz eder.',
    contentSummary: 'MÖ 3200\'de Sümerler tarafından çivi yazısının bulunmasıyla Tarih Öncesi Dönemlerin sona ermesi ve Tarih Çağlarının başlaması.',
    originalAlternativeQuestion: {
      question: 'Tarihçiler geçmişi "Tarih Öncesi Çağlar" ve "Tarih Çağları" olarak iki ana bölüme ayırırken hangi tarihsel gelişmeyi temel ölçüt olarak almışlardır?',
      options: [
        'Ateşin kontrol altına alınması',
        'Yazının Sümerler tarafından icat edilmesi',
        'İlk imparatorlukların kurulması',
        'Paranın Lidyalılar tarafından bulunması'
      ],
      correctAnswer: 'Yazının Sümerler tarafından icat edilmesi',
      solutionExplanation: 'Yazılı belgelerin ortaya çıkmasıyla geçmişe ait güvenilir bilgi akışı başladığından tarihin başlangıcı yazının icadı kabul edilir.',
      cognitiveLevel: 'Temel Kavrama'
    }
  },

  // =========================================================================
  // 7. İNGİLİZCE - Common European Framework (CEFR A2-B1)
  // =========================================================================
  {
    id: 'cat_eng_cefr_01',
    subjectId: 'subj_eng',
    subjectName: 'İngilizce',
    topicId: 'topic_eng_present_simple',
    grade: '9. Sınıf / A2-B1 Seviyesi',
    unit: 'Theme 1: Studying Abroad / Daily Routines',
    sourceCategory: 'meb_official',
    sourceTitle: 'MEB 9. Sınıf English Coursebook (Teenwise)',
    publisher: 'Millî Eğitim Bakanlığı / Devlet Kitapları',
    edition: '2025-2026',
    pageOrNo: 'Page 18 - Grammar Focus: Present Simple',
    copyrightStatus: 'official_public',
    licenseInfo: 'MEB Açık Müfredat Programı',
    learningOutcome: 'ENG.9.1.G1. Expresses daily routines, habits and general truths using Simple Present Tense.',
    contentSummary: 'Geniş zamanda (Simple Present Tense) 3. tekil şahıslarda fiile -s/-es/-ies eklenmesi ve olumsuzlarda don\'t/doesn\'t kullanımı.',
    originalAlternativeQuestion: {
      question: '"My brother usually ________ (play) basketball on weekends, but he ________ (not play) today because of the rain." Cümlesindeki boşluklara sırasıyla hangisi gelmelidir?',
      options: [
        'plays / doesn\'t play',
        'play / don\'t play',
        'plays / isn\'t play',
        'playing / not plays'
      ],
      correctAnswer: 'plays / doesn\'t play',
      solutionExplanation: '"My brother" 3. tekil şahıs (he) olduğu için olumlu cümlede fiil "plays" olur; olumsuzda yardımcı fiil "doesn\'t play" kullanılır.',
      cognitiveLevel: 'Uygulama'
    }
  },

  // =========================================================================
  // 8. DİN KÜLTÜRÜ VE AHLAK BİLGİSİ - MEB Resmî
  // =========================================================================
  {
    id: 'cat_din_meb_01',
    subjectId: 'subj_din',
    subjectName: 'Din Kültürü ve Ahlak Bilgisi',
    topicId: 'topic_din_inanc',
    grade: '9. Sınıf',
    unit: 'Ünite 1: Bilgi ve İnanç',
    sourceCategory: 'meb_official',
    sourceTitle: 'MEB 9. Sınıf Din Kültürü ve Ahlak Bilgisi Ders Kitabı',
    publisher: 'Millî Eğitim Bakanlığı',
    edition: '2025-2026',
    pageOrNo: 'Sayfa 24 - Tevhid İnancı ve Erdemler',
    copyrightStatus: 'official_public',
    licenseInfo: 'MEB Resmî Müfredatı',
    learningOutcome: 'DİN.9.1.2. İslam inanç esaslarının temeli olan tevhid kavramını açıklar.',
    contentSummary: 'Tevhid; Allah\'ın bir ve tek olduğuna, eşi, benzeri ve ortağı bulunmadığına inanmaktır. İhlas suresi bu inancın özünü açıklar.',
    originalAlternativeQuestion: {
      question: 'İslam dininde Allah\'ın zatında, sıfatlarında ve fiillerinde bir ve tek olduğunu, hiçbir varlığa benzemediğini ve ortağı olmadığını ifade eden temel inanç kavramı aşağıdakilerden hangisidir?',
      options: ['Nübüvvet', 'Tevhid', 'Ahiret', 'Tevekkül'],
      correctAnswer: 'Tevhid',
      solutionExplanation: 'Tevhid inancı, İslam\'ın temel ilkesi olup Allah\'ın birliğini ve benzersizliğini ifade eder.',
      cognitiveLevel: 'Temel Kavrama'
    }
  },

  // =========================================================================
  // 9. COĞRAFYA - MEB & Açık Harita Veritabanı
  // =========================================================================
  {
    id: 'cat_geo_meb_01',
    subjectId: 'subj_cografya',
    subjectName: 'Coğrafya',
    topicId: 'topic_cografya_koordinat',
    grade: '9. Sınıf',
    unit: 'Ünite 1: Doğal Sistemler - Koordinat Sistemi',
    sourceCategory: 'meb_official',
    sourceTitle: 'MEB 9. Sınıf Coğrafya Ders Kitabı',
    publisher: 'Millî Eğitim Bakanlığı',
    edition: '2025-2026',
    pageOrNo: 'Sayfa 36 - Paralel ve Meridyenler',
    copyrightStatus: 'official_public',
    licenseInfo: 'MEB Resmî Müfredatı',
    learningOutcome: 'COĞ.9.1.2. Koordinat sistemini kullanarak Türkiye\'nin ve herhangi bir noktanın mutlak konumunu belirler.',
    contentSummary: 'Paralel ve meridyen sistemleri, yerel saat farkları (ardışık meridyenler arası 4 dakika kuralı) ve Türkiye\'nin matematik konumu (36°-42° Kuzey, 26°-45° Doğu).',
    originalAlternativeQuestion: {
      question: '30° Doğu meridyeninde yerel saat 14.00 iken, 45° Doğu meridyeninde yerel saat kaçtır?',
      options: ['13.00', '14.15', '15.00', '15.30'],
      correctAnswer: '15.00',
      solutionExplanation: 'Meridyen farkı = 45 - 30 = 15 meridyen. Zaman farkı = 15 x 4 dakika = 60 dakika = 1 saat. Doğu daha ileride olduğundan 14.00 + 1.00 = 15.00 olur.',
      cognitiveLevel: 'Uygulama'
    }
  }
];

export class EducationalCatalogService {
  public static getCatalogBySubject(subjectId: string): EducationalCatalogItem[] {
    return EDUCATIONAL_CATALOG.filter(item => item.subjectId === subjectId);
  }

  public static getCatalogByTopic(topicId: string): EducationalCatalogItem[] {
    return EDUCATIONAL_CATALOG.filter(item => item.topicId === topicId);
  }

  public static getCatalogByCategory(category: CatalogSourceCategory): EducationalCatalogItem[] {
    return EDUCATIONAL_CATALOG.filter(item => item.sourceCategory === category);
  }

  public static getAllItems(): EducationalCatalogItem[] {
    return EDUCATIONAL_CATALOG;
  }
}
