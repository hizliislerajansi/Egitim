import { Subject, Topic, Question } from '../types/database';

export const MEB_SUBJECTS: Subject[] = [
  {
    id: 'subj_math',
    name: 'Matematik',
    code: 'MATH',
    icon: 'Calculator',
    description: 'MEB 9. Sınıf Matematik - Sayılar, Kümeler, Denklemler, Eşitsizlikler, Mutlak Değer, Üçgenler, Veri',
    sort_order: 1
  },
  {
    id: 'subj_turk',
    name: 'Türk Dili ve Edebiyatı',
    code: 'TURK',
    icon: 'BookOpen',
    description: 'MEB 9. Sınıf Edebiyat - İletişim, Hikaye, Şiir, Masal/Fabl, Yazım Kuralları ve Noktalama',
    sort_order: 2
  },
  {
    id: 'subj_fizik',
    name: 'Fizik',
    code: 'FIZIK',
    icon: 'Zap',
    description: 'MEB 9. Sınıf Fizik - Fizik Bilimine Giriş, Madde ve Özkütle, Hareket ve Kuvvet, Enerji, Isı',
    sort_order: 3
  },
  {
    id: 'subj_kimya',
    name: 'Kimya',
    code: 'KIMYA',
    icon: 'FlaskConical',
    description: 'MEB 9. Sınıf Kimya - Kimya Bilimi, Atom ve Periyodik Sistem, Kimyasal Türler, Maddenin Halleri',
    sort_order: 4
  },
  {
    id: 'subj_biyoloji',
    name: 'Biyoloji',
    code: 'BIYOLOJI',
    icon: 'Dna',
    description: 'MEB 9. Sınıf Biyoloji - Canlıların Ortak Özellikleri, Temel Bileşikler, Hücre ve Organeller',
    sort_order: 5
  },
  {
    id: 'subj_tarih',
    name: 'Tarih',
    code: 'TARIH',
    icon: 'Landmark',
    description: 'MEB 9. Sınıf Tarih - Tarih ve Zaman, İlk Çağ Uygarlıkları, Orta Çağ ve İlk Türk Devletleri',
    sort_order: 6
  },
  {
    id: 'subj_cografya',
    name: 'Coğrafya',
    code: 'COGRAFYA',
    icon: 'Globe',
    description: 'MEB 9. Sınıf Coğrafya - Doğa ve İnsan, Koordinat Sistemi, Harita Bilgisi, İklim ve Dünya',
    sort_order: 7
  },
  {
    id: 'subj_eng',
    name: 'İngilizce',
    code: 'ENG',
    icon: 'Languages',
    description: 'MEB 9. Sınıf İngilizce - Themes 1-6: Studying Abroad, Environment, Movies, Nature, Inspiring People',
    sort_order: 8
  },
  {
    id: 'subj_din',
    name: 'Din Kültürü ve Ahlak Bilgisi',
    code: 'DIN',
    icon: 'HeartHandshake',
    description: 'MEB 9. Sınıf Din Kültürü - Bilgi ve İnanç, Din ve İslam, İslam ve İbadet Hayatı',
    sort_order: 9
  },
  {
    id: 'subj_saglik',
    name: 'Sağlık Bilgisi ve Trafik Kültürü',
    code: 'SAGLIK',
    icon: 'Activity',
    description: 'EBA 9. Sınıf Sağlık Bilgisi ve Trafik Kültürü - Kişisel ve Toplum Sağlığı, İlkyardım, Trafik Adabı ve Güvenliği',
    sort_order: 10
  },
  {
    id: 'subj_almanca',
    name: 'İkinci Yabancı Dil (Almanca)',
    code: 'ALMANCA',
    icon: 'Languages',
    description: 'EBA 9. Sınıf Almanca A1.1 - Hallo!, Meine Schule, Mein Tag, Meine Hobbys',
    sort_order: 11
  },
  {
    id: 'subj_bilisim',
    name: 'Bilişim Teknolojileri ve Yazılım',
    code: 'BILISIM',
    icon: 'Laptop',
    description: 'EBA 9. Sınıf Bilişim - Algoritmalar, Problem Çözme, Dijital Güvenlik, Programlama Temelleri',
    sort_order: 12
  }
];

export const MEB_TOPICS: Topic[] = [
  // ==========================================
  // 1. MATEMATİK (9. SINIF MEB MÜFREDATI)
  // ==========================================
  {
    id: 'topic_math_equations',
    subject_id: 'subj_math',
    unit: 'Ünite 1: Denklem ve Eşitsizlikler',
    name: 'Birinci Dereceden Bir Bilinmeyenli Denklemler',
    learning_outcome: 'MAT.9.3.2.1. Gerçek sayılar kümesinde birinci dereceden bir bilinmeyenli denklem çözer.',
    meb_code: 'MAT.9.3.2.1',
    difficulty: 3,
    order_index: 1
  },
  {
    id: 'topic_math_sets',
    subject_id: 'subj_math',
    unit: 'Ünite 2: Kümeler',
    name: 'Kümelerde İşlemler ve Alt Küme',
    learning_outcome: 'MAT.9.2.1.2. Kümelerde birleşim, kesişim, fark ve tümleme işlemlerini uygular.',
    meb_code: 'MAT.9.2.1.2',
    difficulty: 3,
    order_index: 2
  },
  {
    id: 'topic_math_cartesian',
    subject_id: 'subj_math',
    unit: 'Ünite 2: Kümeler',
    name: 'Kartezyen Çarpım ve Küme Problemleri',
    learning_outcome: 'MAT.9.2.2.1. İki kümenin kartezyen çarpımını ve gerçek hayat problemlerini çözer.',
    meb_code: 'MAT.9.2.2.1',
    difficulty: 3,
    order_index: 3
  },
  {
    id: 'topic_math_inequalities',
    subject_id: 'subj_math',
    unit: 'Ünite 1: Denklem ve Eşitsizlikler',
    name: 'Birinci Dereceden Bir Bilinmeyenli Eşitsizlikler',
    learning_outcome: 'MAT.9.3.2.2. Birinci dereceden bir bilinmeyenli eşitsizliklerin çözüm kümesini bulur ve gösterir.',
    meb_code: 'MAT.9.3.2.2',
    difficulty: 3,
    order_index: 4
  },
  {
    id: 'topic_math_absolute',
    subject_id: 'subj_math',
    unit: 'Ünite 1: Denklem ve Eşitsizlikler',
    name: 'Mutlak Değerli Denklemler ve Eşitsizlikler',
    learning_outcome: 'MAT.9.3.2.3. Mutlak değer içeren birinci dereceden bir bilinmeyenli denklemleri çözer.',
    meb_code: 'MAT.9.3.2.3',
    difficulty: 4,
    order_index: 5
  },
  {
    id: 'topic_math_triangles',
    subject_id: 'subj_math',
    unit: 'Ünite 3: Üçgenler',
    name: 'Üçgende Açılar ve Açı-Kenar Bağıntıları',
    learning_outcome: 'MAT.9.4.1.1. Üçgende açı özellikleri ile kenar uzunlukları arasındaki ilişkileri kurar.',
    meb_code: 'MAT.9.4.1.1',
    difficulty: 3,
    order_index: 6
  },
  {
    id: 'topic_math_data',
    subject_id: 'subj_math',
    unit: 'Ünite 4: Veri ve İstatistik',
    name: 'Merkezi Eğilim ve Yayılım Ölçüleri (Ortalama, Medyan, Mod)',
    learning_outcome: 'MAT.9.5.1.1. Aritmetik ortalama, ortanca (medyan), tepe değer (mod) ve standart sapmayı hesaplar.',
    meb_code: 'MAT.9.5.1.1',
    difficulty: 2,
    order_index: 7
  },
  {
    id: 'topic_math_logic',
    subject_id: 'subj_math',
    unit: 'Ünite 5: Sembolik Mantık (Matematiksel Önermeler)',
    name: 'Önermeler ve Doğruluk Değerleri (p, q, totoloji)',
    learning_outcome: 'MAT.9.1.1.1. Önermeyi, önermenin doğruluk değerini ve bileşik önermeleri matematiksel sembollerle açıklar.',
    meb_code: 'MAT.9.1.1.1',
    difficulty: 2,
    order_index: 8
  },

  // ==========================================
  // 2. TÜRK DİLİ VE EDEBİYATI (9. SINIF)
  // ==========================================
  {
    id: 'topic_turk_intro',
    subject_id: 'subj_turk',
    unit: 'Ünite 1: Giriş & İletişim',
    name: 'Edebiyatın Tanımı ve İletişim Ögeleri (Gönderici, Alıcı, Kanal)',
    learning_outcome: 'TDE.9.1.1. Edebiyat ile güzel sanatlar arasındaki ilişkiyi ve iletişimin temel ögelerini kavrar.',
    meb_code: 'TDE.9.1.1',
    difficulty: 2,
    order_index: 10
  },
  {
    id: 'topic_turk_story',
    subject_id: 'subj_turk',
    unit: 'Ünite 2: Hikâye (Öykü)',
    name: 'Olay (Maupassant) ve Durum (Çehov) Hikâyeleri',
    learning_outcome: 'TDE.9.2.1. Olay ve durum hikâyelerinin özelliklerini, yapı unsurlarını (olay, kişi, zaman, mekân) analiz eder.',
    meb_code: 'TDE.9.2.1',
    difficulty: 3,
    order_index: 11
  },
  {
    id: 'topic_turk_poetry',
    subject_id: 'subj_turk',
    unit: 'Ünite 3: Şiir Bilgisi',
    name: 'Nazım Birimi, Ölçü, Kafiye (Uyak) ve Redif',
    learning_outcome: 'TDE.9.3.1. Şiirde ahenk unsurlarını (kafiye türleri, redif, hece ve aruz ölçüsü) belirler.',
    meb_code: 'TDE.9.3.1',
    difficulty: 3,
    order_index: 12
  },
  {
    id: 'topic_turk_spelling',
    subject_id: 'subj_turk',
    unit: 'Ünite 4: Dil Bilgisi',
    name: 'Yazım Kuralları (de/da, ki ve mi\'nin yazımı) ve Noktalama',
    learning_outcome: 'TDE.9.4.1. Metinlerdeki yazım ve noktalama kurallarını doğru uygular.',
    meb_code: 'TDE.9.4.1',
    difficulty: 2,
    order_index: 13
  },

  // ==========================================
  // 3. FİZİK (9. SINIF)
  // ==========================================
  {
    id: 'topic_fizik_intro',
    subject_id: 'subj_fizik',
    unit: 'Ünite 1: Fizik Bilimine Giriş',
    name: 'Fiziğin Alt Dalları ve Temel / Türetilmiş Büyüklükler (KISAMUZ)',
    learning_outcome: 'FIZ.9.1.1. Fiziğin alt dallarını açıklar, temel ve türetilmiş büyüklükleri ayırt eder.',
    meb_code: 'FIZ.9.1.1',
    difficulty: 2,
    order_index: 20
  },
  {
    id: 'topic_fizik_matter',
    subject_id: 'subj_fizik',
    unit: 'Ünite 2: Madde ve Özellikleri',
    name: 'Kütle, Hacim, Özkütle (d = m/V) ve Yüzey Gerilimi',
    learning_outcome: 'FIZ.9.2.1. Maddelerin ortak ve ayırt edici özelliklerini açıklar; özkütle hesaplamaları yapar.',
    meb_code: 'FIZ.9.2.1',
    difficulty: 3,
    order_index: 21
  },
  {
    id: 'topic_fizik_motion',
    subject_id: 'subj_fizik',
    unit: 'Ünite 3: Hareket ve Kuvvet',
    name: 'Düzgün Doğrusal Hareket, Hız, Sürat ve Newton Yasaları (F = m·a)',
    learning_outcome: 'FIZ.9.3.1. Hareket kavramlarını açıklar; Newton\'un hareket yasalarını problem çözümlerinde uygular.',
    meb_code: 'FIZ.9.3.1',
    difficulty: 3,
    order_index: 22
  },
  {
    id: 'topic_fizik_energy',
    subject_id: 'subj_fizik',
    unit: 'Ünite 4: Enerji',
    name: 'Mekanik İş (W = F·x), Kinetik ve Potansiyel Enerji',
    learning_outcome: 'FIZ.9.4.1. İş, güç ve enerji kavramları arasındaki ilişkiyi kurar.',
    meb_code: 'FIZ.9.4.1',
    difficulty: 3,
    order_index: 23
  },

  // ==========================================
  // 4. KİMYA (9. SINIF)
  // ==========================================
  {
    id: 'topic_kimya_science',
    subject_id: 'subj_kimya',
    unit: 'Ünite 1: Kimya Bilimi',
    name: 'Simyadan Kimyaya, Element ve Bileşiklerin Sembol ve Formülleri',
    learning_outcome: 'KIM.9.1.1. Kimyanın bilim olma sürecini ve yaygın bileşiklerin adlarını açıklar.',
    meb_code: 'KIM.9.1.1',
    difficulty: 2,
    order_index: 30
  },
  {
    id: 'topic_kimya_atom',
    subject_id: 'subj_kimya',
    unit: 'Ünite 2: Atom ve Periyodik Sistem',
    name: 'Atom Modelleri, Proton, Nötron, Elektron ve Periyodik Tablo',
    learning_outcome: 'KIM.9.2.1. Atom altı tanecikleri ve periyodik sistemdeki grup/periyot bulma kurallarını açıklar.',
    meb_code: 'KIM.9.2.1',
    difficulty: 3,
    order_index: 31
  },
  {
    id: 'topic_kimya_bonds',
    subject_id: 'subj_kimya',
    unit: 'Ünite 3: Kimyasal Türler Arası Etkileşimler',
    name: 'Güçlü Etkileşimler (İyonik, Kovalent, Metalik Bağ)',
    learning_outcome: 'KIM.9.3.1. Kimyasal türler arasındaki güçlü ve zayıf etkileşimleri ayırt eder.',
    meb_code: 'KIM.9.3.1',
    difficulty: 3,
    order_index: 32
  },

  // ==========================================
  // 5. BİYOLOJİ (9. SINIF)
  // ==========================================
  {
    id: 'topic_biyoloji_life',
    subject_id: 'subj_biyoloji',
    unit: 'Ünite 1: Yaşam Bilimi Biyoloji',
    name: 'Canlıların Ortak Özellikleri (Hücresel yapı, Beslenme, Solunum, Homeostazi)',
    learning_outcome: 'BIY.9.1.1. Canlıların ortak özelliklerini açıklar.',
    meb_code: 'BIY.9.1.1',
    difficulty: 2,
    order_index: 40
  },
  {
    id: 'topic_biyoloji_compounds',
    subject_id: 'subj_biyoloji',
    unit: 'Ünite 1: Yaşam Bilimi Biyoloji',
    name: 'Canlıların Temel Bileşikleri (Karbonhidratlar, Yağlar, Proteinler, Enzimler)',
    learning_outcome: 'BIY.9.1.2. İnorganik ve organik bileşiklerin canlılar için önemini açıklar.',
    meb_code: 'BIY.9.1.2',
    difficulty: 3,
    order_index: 41
  },
  {
    id: 'topic_biyoloji_cell',
    subject_id: 'subj_biyoloji',
    unit: 'Ünite 2: Hücre',
    name: 'Hücre Teorisi, Prokaryot / Ökaryot Hücre ve Organeller',
    learning_outcome: 'BIY.9.2.1. Hücre organellerinin yapı ve görevlerini karşılaştırır.',
    meb_code: 'BIY.9.2.1',
    difficulty: 3,
    order_index: 42
  },

  // ==========================================
  // 6. TARİH (9. SINIF)
  // ==========================================
  {
    id: 'topic_tarih_time',
    subject_id: 'subj_tarih',
    unit: 'Ünite 1: Tarih ve Zaman',
    name: 'Tarih Biliminin Yöntemi, Kaynaklar ve Takvim Sistemleri',
    learning_outcome: 'TAR.9.1.1. Tarih biliminin konusunu, yöntemini ve Türklerin kullandığı takvimleri açıklar.',
    meb_code: 'TAR.9.1.1',
    difficulty: 2,
    order_index: 50
  },
  {
    id: 'topic_tarih_ancient',
    subject_id: 'subj_tarih',
    unit: 'Ünite 2: İnsanlığın İlk Dönemleri',
    name: 'İlk Çağ Uygarlıkları (Mezopotamya, Mısır, Anadolu ve Çin)',
    learning_outcome: 'TAR.9.2.1. İlk Çağ uygarlıklarının insanlık tarihine katkılarını değerlendirir.',
    meb_code: 'TAR.9.2.1',
    difficulty: 3,
    order_index: 51
  },
  {
    id: 'topic_tarih_turks',
    subject_id: 'subj_tarih',
    unit: 'Ünite 3: İlk ve Orta Çağlarda Türk Dünyası',
    name: 'Orta Asya İlk Türk Devletleri (Asya Hun, Kök Türk, Uygurlar)',
    learning_outcome: 'TAR.9.3.1. İlk Türk devletlerinin siyasi, askeri ve kültürel özelliklerini kavrar.',
    meb_code: 'TAR.9.3.1',
    difficulty: 3,
    order_index: 52
  },

  // ==========================================
  // 7. COĞRAFYA (9. SINIF)
  // ==========================================
  {
    id: 'topic_cografya_nature',
    subject_id: 'subj_cografya',
    unit: 'Ünite 1: Doğa ve İnsan',
    name: 'Coğrafyanın Konusu, Bölümleri ve İnsan-Doğa Etkileşimi',
    learning_outcome: 'COG.9.1.1. Coğrafya biliminin inceleme alanlarını ve doğa-insan ilişkisini açıklar.',
    meb_code: 'COG.9.1.1',
    difficulty: 2,
    order_index: 60
  },
  {
    id: 'topic_cografya_coordinates',
    subject_id: 'subj_cografya',
    unit: 'Ünite 2: Coğrafi Koordinat Sistemi',
    name: 'Paraleller, Meridyenler, Yerel Saat Hesaplamaları ve Harita Bilgisi',
    learning_outcome: 'COG.9.2.1. Koordinat sistemini kullanarak yer belirler ve yerel saat hesaplar.',
    meb_code: 'COG.9.2.1',
    difficulty: 3,
    order_index: 61
  },
  {
    id: 'topic_cografya_earth',
    subject_id: 'subj_cografya',
    unit: 'Ünite 3: Dünyanın Şekli ve Hareketleri',
    name: 'Geoit Şeklin Sonuçları, Günlük ve Yıllık Hareket (Mevsimler)',
    learning_outcome: 'COG.9.3.1. Dünyanın şekli ve hareketlerinin coğrafi sonuçlarını analiz eder.',
    meb_code: 'COG.9.3.1',
    difficulty: 3,
    order_index: 62
  },

  // ==========================================
  // 8. İNGİLİZCE (9. SINIF)
  // ==========================================
  {
    id: 'topic_eng_theme1',
    subject_id: 'subj_eng',
    unit: 'Theme 1: Studying Abroad',
    name: 'Greetings & Personal Information (To Be, Countries, Nationalities)',
    learning_outcome: 'E9.1.W1. Öğrenciler kişisel bilgilerini, ülkelerini ve meslekleri tanıtan cümleler kurar.',
    meb_code: 'E9.1.W1',
    difficulty: 2,
    order_index: 70
  },
  {
    id: 'topic_eng_theme2',
    subject_id: 'subj_eng',
    unit: 'Theme 2: My Environment',
    name: 'Neighborhood & Giving Directions (Prepositions of Place, Imperatives)',
    learning_outcome: 'E9.2.S1. Öğrenciler çevrelerindeki mekanları sorar ve basit yön tarifleri verir.',
    meb_code: 'E9.2.S1',
    difficulty: 2,
    order_index: 71
  },
  {
    id: 'topic_eng_theme3',
    subject_id: 'subj_eng',
    unit: 'Theme 3: Movies',
    name: 'Movie Genres & Expressing Preferences (Prefer + to)',
    learning_outcome: 'E9.3.R1. Film özetlerini okuyarak türleri ve kişisel tercihleri (prefer) ifade eder.',
    meb_code: 'E9.3.R1',
    difficulty: 3,
    order_index: 72
  },
  {
    id: 'topic_eng_theme4',
    subject_id: 'subj_eng',
    unit: 'Theme 4: Human in Nature',
    name: 'Daily Routines & Natural World (Simple Present Tense)',
    learning_outcome: 'E9.4.R1. Doğa, hava olayları ve geniş zamanda günlük alışkanlıklar üzerine okuduğunu anlar.',
    meb_code: 'E9.4.R1',
    difficulty: 3,
    order_index: 73
  },
  {
    id: 'topic_eng_theme5',
    subject_id: 'subj_eng',
    unit: 'Theme 5: Inspiring People',
    name: 'Biographies & Past Events (Simple Past Tense - Regular/Irregular)',
    learning_outcome: 'E9.5.W1. Tarihi veya ilham veren kişilerin hayatını geçmiş zaman kalıplarıyla anlatır.',
    meb_code: 'E9.5.W1',
    difficulty: 3,
    order_index: 74
  },
  {
    id: 'topic_eng_theme6',
    subject_id: 'subj_eng',
    unit: 'Theme 6: Bridging Cultures',
    name: 'Customs, Traditions & Comparisons (Comparative & Superlative)',
    learning_outcome: 'E9.6.S1. Farklı kültürlerin geleneklerini comparative/superlative yapılarıyla karşılaştırır.',
    meb_code: 'E9.6.S1',
    difficulty: 4,
    order_index: 75
  },

  // ==========================================
  // 9. DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (9. SINIF)
  // ==========================================
  {
    id: 'topic_din_faith',
    subject_id: 'subj_din',
    unit: 'Ünite 1: Bilgi ve İnanç',
    name: 'İslam\'da Bilgi Kaynakları (Selim Akıl, Sadık Haber, Salim Duyular)',
    learning_outcome: 'DIN.9.1.1. İslam\'da bilginin kaynaklarını açıklar ve inançla ilişkisini kurar.',
    meb_code: 'DIN.9.1.1',
    difficulty: 2,
    order_index: 80
  },
  {
    id: 'topic_din_worship',
    subject_id: 'subj_din',
    unit: 'Ünite 2: Din ve İslam',
    name: 'İslam\'ın İnanç Esasları ve İbadetlerin Bireysel/Toplumsal Faydaları',
    learning_outcome: 'DIN.9.2.1. İbadetlerin bireyin ahlakı ve toplum düzeni üzerindeki etkilerini açıklar.',
    meb_code: 'DIN.9.2.1',
    difficulty: 2,
    order_index: 81
  },

  // ==========================================
  // 10. SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ (9. SINIF EBA)
  // ==========================================
  {
    id: 'topic_saglik_health',
    subject_id: 'subj_saglik',
    unit: 'Ünite 1: Kişisel ve Toplum Sağlığı',
    name: 'Sağlık Kavramı, Sağlığı Etkileyen Faktörler ve Temel İlkyardım İlkeleri',
    learning_outcome: 'SGT.9.1.1. Sağlığı etkileyen etmenleri sınıflandırır ve hayati acil durumlarda temel ilkyardım ilkelerini açıklar.',
    meb_code: 'SGT.9.1.1',
    difficulty: 2,
    order_index: 90
  },
  {
    id: 'topic_saglik_traffic',
    subject_id: 'subj_saglik',
    unit: 'Ünite 2: Trafik Kültürü ve Güvenliği',
    name: 'Trafik Kuralları, Saygı, Trafik Adabı ve Güvenli Sürüş/Yaya Bilinci',
    learning_outcome: 'SGT.9.2.1. Trafik kurallarına uymanın birey ve toplum hayatı açısından önemini analiz eder.',
    meb_code: 'SGT.9.2.1',
    difficulty: 2,
    order_index: 91
  },

  // ==========================================
  // 11. İKİNCİ YABANCI DİL (ALMANCA A1.1 EBA)
  // ==========================================
  {
    id: 'topic_almanca_greetings',
    subject_id: 'subj_almanca',
    unit: 'Modul 1: Hallo! (Tanışma ve Selamlaşma)',
    name: 'Begrüßung & Sich Vorstellen (Hallo, Name, Herkunft, Zahlen 1-20)',
    learning_outcome: 'ALM.9.1.1. Almanca temel selamlaşma ve kendini tanıtma ifadelerini (sein, heißen) kullanır.',
    meb_code: 'ALM.9.1.1',
    difficulty: 2,
    order_index: 100
  },
  {
    id: 'topic_almanca_school',
    subject_id: 'subj_almanca',
    unit: 'Modul 2: Meine Schule (Okul ve Eşyalar)',
    name: 'Schulsachen & Bestimmte/Unbestimmte Artikel (der, die, das / ein, eine)',
    learning_outcome: 'ALM.9.2.1. Okul eşyalarını ve belirli/belirsiz artikelleri doğru kullanarak cümle kurar.',
    meb_code: 'ALM.9.2.1',
    difficulty: 3,
    order_index: 101
  },

  // ==========================================
  // 12. BİLİŞİM TEKNOLOJİLERİ VE YAZILIM (9. SINIF EBA)
  // ==========================================
  {
    id: 'topic_bilisim_algo',
    subject_id: 'subj_bilisim',
    unit: 'Ünite 1: Problem Çözme ve Algoritmalar',
    name: 'Algoritma Kavramı, Akış Şeması Sembolleri ve Sözde Kod (Pseudocode)',
    learning_outcome: 'BTY.9.1.1. Bir problemin çözüm adımlarını algoritma ve akış şeması ile modeller.',
    meb_code: 'BTY.9.1.1',
    difficulty: 3,
    order_index: 110
  },
  {
    id: 'topic_bilisim_cyber',
    subject_id: 'subj_bilisim',
    unit: 'Ünite 2: Bilişim Etiği ve Dijital Güvenlik',
    name: 'Siber Zorbalık, Güçlü Parola, Telif Hakları ve Zararlı Yazılımlar',
    learning_outcome: 'BTY.9.2.1. Dijital ortamda etik kurallara uyar ve kişisel veri güvenliği tedbirlerini açıklar.',
    meb_code: 'BTY.9.2.1',
    difficulty: 2,
    order_index: 111
  }
];

export const MEB_QUESTIONS: Question[] = [
  // ==========================================
  // 1. MATEMATİK SORULARI
  // ==========================================
  {
    id: 'q_math_eq_1',
    topic_id: 'topic_math_equations',
    question_text: '3(2x - 4) + 5 = 2x + 9 denklemini sağlayan x değeri kaçtır?',
    question_type: 'open_math',
    correct_answer: '4',
    hint_1: 'Önce parantezi dağıt: 3*(2x) - 3*4 + 5 = 6x - 12 + 5.',
    hint_2: '6x - 7 = 2x + 9. Bilinenleri bir tarafa, bilinmeyenleri diğer tarafa topla: 4x = 16.',
    explanation: '3(2x - 4) + 5 = 2x + 9\n6x - 12 + 5 = 2x + 9\n6x - 7 = 2x + 9\n6x - 2x = 9 + 7\n4x = 16 => x = 4.',
    difficulty: 3,
    meb_aligned: 1
  },
  {
    id: 'q_math_sets_1',
    topic_id: 'topic_math_sets',
    question_text: 'A ve B iki kümedir.\ns(A ∪ B) = 18\ns(A ∩ B) = 4\ns(A) = 10\nolduğuna göre B kümesinin eleman sayısı s(B) kaçtır?',
    question_type: 'open_math',
    correct_answer: '12',
    hint_1: 'Temel birleşim formülü: s(A ∪ B) = s(A) + s(B) - s(A ∩ B).',
    hint_2: '18 = 10 + s(B) - 4 eşitliğinde s(B)\'yi yalnız bırak.',
    explanation: '18 = 10 + s(B) - 4 => 18 = 6 + s(B) => s(B) = 12.',
    difficulty: 3,
    meb_aligned: 1
  },
  {
    id: 'q_math_abs_1',
    topic_id: 'topic_math_absolute',
    question_text: '|2x - 6| = 10 denkleminin çözüm kümesindeki x değerlerinin toplamı kaçtır?',
    question_type: 'open_math',
    correct_answer: '6',
    hint_1: '|A| = 10 ise 2x - 6 = 10 veya 2x - 6 = -10 olur.',
    hint_2: '1. durum: 2x = 16 => x = 8. 2. durum: 2x = -4 => x = -2.',
    explanation: 'x1 = 8, x2 = -2. Toplam: 8 + (-2) = 6.',
    difficulty: 3,
    meb_aligned: 1
  },
  {
    id: 'q_math_triangles_1',
    topic_id: 'topic_math_triangles',
    question_text: 'Bir ABC üçgeninde m(A) = 65° ve m(B) = 45° olduğuna göre C açısının ölçüsü kaç derecedir?',
    question_type: 'open_math',
    correct_answer: '70',
    hint_1: 'Üçgenin iç açıları toplamı 180 derecedir.',
    hint_2: '65 + 45 = 110. 180 - 110 = ?',
    explanation: '180 - (65 + 45) = 180 - 110 = 70°.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_math_logic_1',
    topic_id: 'topic_math_logic',
    question_text: 'p ≡ 1 ve q ≡ 0 olduğuna göre (p ∧ q\') önermesinin doğruluk değeri kaçtır?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['0', '1']),
    correct_answer: '1',
    hint_1: 'q = 0 olduğuna göre q\' = 1 olur.',
    hint_2: '1 ve 1 bağlacı 1 verir.',
    explanation: 'q\' = 1 olur. p ∧ q\' = 1 ∧ 1 = 1.',
    difficulty: 2,
    meb_aligned: 1
  },

  // ==========================================
  // 2. TÜRK DİLİ VE EDEBİYATI SORULARI
  // ==========================================
  {
    id: 'q_turk_1',
    topic_id: 'topic_turk_intro',
    question_text: 'Bir sınıfta öğretmenin öğrencilerine "Yarın ödevlerinizi teslim ediniz." demesi durumunda, bu iletişimin "kanal" ögesi aşağıdakilerden hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['Öğretmen', 'Öğrenciler', 'Ses dalgaları (Sözlü dil)', 'Ödev teslimi']),
    correct_answer: 'Ses dalgaları (Sözlü dil)',
    hint_1: 'Gönderici: Öğretmen, Alıcı: Öğrenciler, İleti: Ödev teslimi.',
    hint_2: 'İletinin alıcıya ulaştırıldığı fiziksel yol veya araç kanaldır.',
    explanation: 'İletişimde mesajın iletildiği yol (hava, ses dalgaları, yazı) "kanal" ögesidir.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_turk_2',
    topic_id: 'topic_turk_story',
    question_text: 'Türk edebiyatında durum (kesit) hikâyeciliğinin (Çehov tarzı) en önemli temsilcisi aşağıdakilerden hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['Ömer Seyfettin', 'Sait Faik Abasıyanık', 'Refik Halid Karay', 'Reşat Nuri Güntekin']),
    correct_answer: 'Sait Faik Abasıyanık',
    hint_1: 'Ömer Seyfettin olay hikâyecisidir.',
    hint_2: 'İstanbul hikâyecisi olarak bilinen ve durum hikâyesinin ustası olan yazarı düşün.',
    explanation: 'Edebiyatımızda durum hikâyesinin öncüleri Sait Faik Abasıyanık ve Memduh Şevket Esendal\'dır.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_turk_3',
    topic_id: 'topic_turk_poetry',
    question_text: '"Gözlerin gözlerime değince\nFelaketim olurdu ağlardım"\ndizelerindeki ölçü türü aşağıdakilerden hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['Hece Ölçüsü', 'Serbest Ölçü', 'Aruz Ölçüsü', 'Nazım Birimi']),
    correct_answer: 'Serbest Ölçü',
    hint_1: 'Dizelerin hece sayılarını say: 1. dize 9 hece, 2. dize 10 hece.',
    hint_2: 'Hece sayıları eşit değil ve aruz kalıbı yoksa şiir serbest ölçülüdür.',
    explanation: 'Dizelerdeki hece sayılarında eşitlik veya klasik kalıp aranmayan modern şiirler serbest ölçüyle yazılır.',
    difficulty: 3,
    meb_aligned: 1
  },

  // ==========================================
  // 3. FİZİK SORULARI
  // ==========================================
  {
    id: 'q_fizik_1',
    topic_id: 'topic_fizik_intro',
    question_text: 'Aşağıdaki fiziksel büyüklüklerden hangisi "temel büyüklük"tür?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['Kuvvet', 'Hız', 'Kütle', 'İş']),
    correct_answer: 'Kütle',
    hint_1: 'KISAMUZ kodlamasını hatırla (Kütle, Işık şiddeti, Sıcaklık, Akım şiddeti, Madde miktarı, Uzunluk, Zaman).',
    hint_2: 'Kuvvet (N), Hız (m/s) ve İş (J) türetilmiş büyüklüklerdir.',
    explanation: 'SI birim sistemindeki 7 temel büyüklükten biri Kütle\'dir (birimi kilogram).',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_fizik_2',
    topic_id: 'topic_fizik_matter',
    question_text: 'Kütlesi 120 gram olan homojen bir katı cismin hacmi 40 cm³ olduğuna göre bu maddenin özkütlesi (d) kaç g/cm³\'tür?',
    question_type: 'open_math',
    correct_answer: '3',
    hint_1: 'Özkütle formülü: d = m / V (Kütle bölü hacim).',
    hint_2: '120 sayısını 40 sayısına böl.',
    explanation: 'd = m / V = 120 g / 40 cm³ = 3 g/cm³ bulunur.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_fizik_3',
    topic_id: 'topic_fizik_motion',
    question_text: 'Kütlesi 4 kg olan bir cisme 20 Newton büyüklüğünde net bir kuvvet uygulandığında cismin ivmesi kaç m/s² olur?',
    question_type: 'open_math',
    correct_answer: '5',
    hint_1: 'Newton\'un 2. temel yasası: F = m · a.',
    hint_2: '20 = 4 · a eşitliğinden ivmeyi (a) bul.',
    explanation: 'F = m · a => 20 = 4 · a => a = 5 m/s² bulunur.',
    difficulty: 2,
    meb_aligned: 1
  },

  // ==========================================
  // 4. KİMYA SORULARI
  // ==========================================
  {
    id: 'q_kimya_1',
    topic_id: 'topic_kimya_science',
    question_text: 'Yaygın adı "Zaç yağı" olan kimyasal bileşiğin formülü aşağıdakilerden hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['H₂SO₄ (Sülfürik asit)', 'HCl (Tuz ruhu)', 'HNO₃ (Kezzap)', 'NaCl (Yemek tuzu)']),
    correct_answer: 'H₂SO₄ (Sülfürik asit)',
    hint_1: 'Simyacı Cabir bin Hayyan tarafından keşfedilen çok güçlü bir asittir.',
    hint_2: 'HCl tuz ruhu, HNO₃ ise kezzaptır.',
    explanation: 'Simyadan günümüze kalan yaygın adlandırmada H₂SO₄ zaç yağıdır.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_kimya_2',
    topic_id: 'topic_kimya_atom',
    question_text: 'Nötr bir atomda proton sayısı 11, nötron sayısı 12 olduğuna göre bu atomun kütle numarası kaçtır?',
    question_type: 'open_math',
    correct_answer: '23',
    hint_1: 'Kütle Numarası = Proton Sayısı + Nötron Sayısı.',
    hint_2: '11 + 12 işlemini yap.',
    explanation: 'Kütle No = Proton + Nötron = 11 + 12 = 23 (Sodyum - Na).',
    difficulty: 2,
    meb_aligned: 1
  },

  // ==========================================
  // 5. BİYOLOJİ SORULARI
  // ==========================================
  {
    id: 'q_biyoloji_1',
    topic_id: 'topic_biyoloji_life',
    question_text: 'Tüm canlılarda ortak olarak bulunan ve protein sentezinden sorumlu olan zarsız organel aşağıdakilerden hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['Ribozom', 'Mitokondri', 'Kloroplast', 'Golgi cisimciği']),
    correct_answer: 'Ribozom',
    hint_1: 'Hem prokaryot (bakteri) hem ökaryot tüm hücrelerde bulunur.',
    hint_2: 'Zarsızdır ve görevi amino asitleri birleştirip protein üretmektir.',
    explanation: 'Ribozom istisnasız tüm hücresel canlılarda ortak bulunan tek organeldir.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_biyoloji_2',
    topic_id: 'topic_biyoloji_compounds',
    question_text: 'İnsan vücudunda açlık anında enerji ihtiyacı için tüketilen besinlerin kullanım sırası aşağıdakilerden hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'Karbonhidrat -> Yağ -> Protein',
      'Yağ -> Karbonhidrat -> Protein',
      'Protein -> Yağ -> Karbonhidrat',
      'Karbonhidrat -> Protein -> Yağ'
    ]),
    correct_answer: 'Karbonhidrat -> Yağ -> Protein',
    hint_1: 'İlk olarak en kolay parçalanan glikoz (karbonhidrat) yakılır.',
    hint_2: 'Proteinler yapıcı-onarıcı olduğu için en son çare olarak kullanılır.',
    explanation: 'Kullanım sırası: 1. Karbonhidratlar, 2. Yağlar, 3. Proteinler.',
    difficulty: 2,
    meb_aligned: 1
  },

  // ==========================================
  // 6. TARİH SORULARI
  // ==========================================
  {
    id: 'q_tarih_1',
    topic_id: 'topic_tarih_time',
    question_text: 'Türklerin tarih boyunca kullandığı aşağıdaki takvimlerden hangisi Güneş yılı değil, Ay yılı esasına dayanır?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['Hicri Takvim', '12 Hayvanlı Türk Takvimi', 'Celali Takvim', 'Miladi Takvim']),
    correct_answer: 'Hicri Takvim',
    hint_1: 'İslamiyet\'in kabulünden sonra kullanılmaya başlanan dini takvimdir.',
    hint_2: 'Bir yılı 354 gün olan ve hilalin hareketlerine göre düzenlenen takvimdir.',
    explanation: 'Türklerin kullandığı takvimler içinde yalnızca Hicri Takvim Ay yılı esasına dayanır.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_tarih_2',
    topic_id: 'topic_tarih_turks',
    question_text: 'Tarihte Türk adıyla kurulan ilk devlet aşağıdakilerden hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['Kök Türk Devleti', 'Asya Hun Devleti', 'Uygur Devleti', 'Avarlar']),
    correct_answer: 'Kök Türk Devleti',
    hint_1: 'Bumin Kağan tarafından 552 yılında kurulmuştur.',
    hint_2: 'Devletin adında bizzat "Türk" kelimesi geçer.',
    explanation: 'Asya Hun ilk Türk devleti olsa da devletin adında "Türk" kelimesini ilk kullanan Kök Türklerdir.',
    difficulty: 2,
    meb_aligned: 1
  },

  // ==========================================
  // 7. COĞRAFYA SORULARI
  // ==========================================
  {
    id: 'q_cografya_1',
    topic_id: 'topic_cografya_coordinates',
    question_text: 'Ardışık iki meridyen arasındaki yerel saat farkı kaç dakikadır?',
    question_type: 'open_math',
    correct_answer: '4',
    hint_1: 'Dünya 24 saatte 360 meridyen döner: (24*60) / 360.',
    hint_2: '1440 / 360 işleminin sonucunu bul.',
    explanation: 'Dünya kendi ekseni etrafındaki bir dönüşünü 24 saatte tamamlar. 1440 dk / 360° = 4 dakika.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_cografya_2',
    topic_id: 'topic_cografya_earth',
    question_text: 'Dünyanın kendi ekseni etrafında batıdan doğuya doğru dönmesinin bir sonucu aşağıdakilerden hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'Doğuda yerel saatin batıdan daha ileri olması',
      'Mevsimlerin oluşması',
      'Kutuplarda 6 ay gündüz yaşanması',
      'Ekinoks tarihlerinin yaşanması'
    ]),
    correct_answer: 'Doğuda yerel saatin batıdan daha ileri olması',
    hint_1: 'Güneşin doğudan daha önce doğup batmasının sebebini düşün.',
    hint_2: 'Mevsimler eksen eğikliği ve yıllık hareketin sonucudur.',
    explanation: 'Dünya batıdan doğuya döndüğü için doğudaki boylamlar güneşi daha önce görür ve yerel saat daima ileridir.',
    difficulty: 3,
    meb_aligned: 1
  },

  // ==========================================
  // 8. İNGİLİZCE SORULARI
  // ==========================================
  {
    id: 'q_eng_theme1_1',
    topic_id: 'topic_eng_theme1',
    question_text: 'Complete the sentence:\n"Where _____ your exchange student friends from?"',
    question_type: 'multiple_choice',
    options_json: JSON.stringify(['is', 'are', 'do', 'does']),
    correct_answer: 'are',
    hint_1: '"Friends" çoğul öznedir.',
    hint_2: 'They öznesi ile "are" to-be fiili kullanılır.',
    explanation: '"Friends" çoğul isimdir. Geniş zamanda durum cümlelerinde "They are" kullanılır.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_eng_theme3_1',
    topic_id: 'topic_eng_theme3',
    question_text: 'Which sentence expresses a movie preference correctly?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'I prefer watching sci-fi movies to watching comedies.',
      'I prefer watching sci-fi than comedies.',
      'I prefer to watch sci-fi over comedies.',
      'I prefer watch sci-fi to comedy.'
    ]),
    correct_answer: 'I prefer watching sci-fi movies to watching comedies.',
    hint_1: '"Prefer doing something TO doing something else" kalıbını hatırla.',
    hint_2: 'Prefer yapısında "than" değil "to" kullanılır.',
    explanation: '"Prefer V-ing to V-ing" kuralı geçerlidir.',
    difficulty: 3,
    meb_aligned: 1
  },

  // ==========================================
  // 9. DİN KÜLTÜRÜ VE AHLAK BİLGİSİ SORULARI
  // ==========================================
  {
    id: 'q_din_1',
    topic_id: 'topic_din_faith',
    question_text: 'İslam dininde doğru ve kesin bilginin üç temel kaynağı aşağıdakilerden hangisinde birlikte verilmiştir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'Selim Akıl - Sadık Haber (Vahiy) - Salim Duyular',
      'Rüya - Sezgi - İlham',
      'Gelenekler - Felsefe - Deney',
      'Efsaneler - Akıl - Duygular'
    ]),
    correct_answer: 'Selim Akıl - Sadık Haber (Vahiy) - Salim Duyular',
    hint_1: 'İslam\'da rüya veya şahsi sezgiler herkesi bağlayan dini bilgi kaynağı sayılmaz.',
    hint_2: 'Akıl, sağlam duyu organları ve peygamberlerin getirdiği doğru haber üçlüsüdür.',
    explanation: 'İslam epistemolojisinde bilginin 3 muteber kaynağı selim akıl, sadık haber ve salim duyulardır.',
    difficulty: 2,
    meb_aligned: 1
  },

  // ==========================================
  // 10. SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ SORULARI
  // ==========================================
  {
    id: 'q_saglik_1',
    topic_id: 'topic_saglik_health',
    question_text: 'Dünya Sağlık Örgütü\'ne (WHO) göre "Sağlık" tanımı aşağıdakilerden hangisini tam olarak kapsar?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'Yalnızca hastalık ve sakatlığın olmayışı değil; bedensel, ruhsal ve sosyal yönden tam bir iyilik hali',
      'Yalnızca spor yapmak ve dengeli beslenmek',
      'Vücutta hiçbir mikrop veya virüs bulunmaması',
      'Hastaneye gitmeye ihtiyaç duymayacak kadar güçlü olmak'
    ]),
    correct_answer: 'Yalnızca hastalık ve sakatlığın olmayışı değil; bedensel, ruhsal ve sosyal yönden tam bir iyilik hali',
    hint_1: 'Sağlık sadece fiziksel güç ile sınırlı değildir; ruhsal ve sosyal boyutları da vardır.',
    hint_2: 'WHO\'nun resmi tanımı 3 temel unsuru (bedensel, ruhsal, sosyal) içerir.',
    explanation: 'DSÖ\'ye göre sağlık; sadece hastalık veya sakatlığın bulunmayışı değil, bedensel, ruhsal ve sosyal yönden tam bir iyilik durumudur.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_saglik_2',
    topic_id: 'topic_saglik_traffic',
    question_text: 'Trafikte geçiş üstünlüğüne sahip araçların doğru sıralaması (kavşakta karşılaşma durumunda) hangisidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'Ambulans (Cankurtaran) > İtfaiye > Polis / Güvenlik > Yol Bakım Araçları',
      'Polis > İtfaiye > Ambulans > Sivil Araçlar',
      'İtfaiye > Polis > Ambulans > Otobüsler',
      'Yol Bakım > Ambulans > İtfaiye > Polis'
    ]),
    correct_answer: 'Ambulans (Cankurtaran) > İtfaiye > Polis / Güvenlik > Yol Bakım Araçları',
    hint_1: 'Öncelik her zaman can kurtarmaya çalışan sağlık ekiplerindedir.',
    hint_2: 'Ambulansı yangın söndürme ekipleri (itfaiye) ve asayiş (polis) takip eder.',
    explanation: 'Geçiş üstünlüğü sıralaması: 1. Cankurtaran (Ambulans), 2. İtfaiye, 3. Güvenlik/Zabıta/Polis, 4. Afet ve acil durum araçlarıdır.',
    difficulty: 2,
    meb_aligned: 1
  },

  // ==========================================
  // 11. ALMANCA (A1.1) SORULARI
  // ==========================================
  {
    id: 'q_almanca_1',
    topic_id: 'topic_almanca_greetings',
    question_text: '"Hallo! Ich _____ Deniz. Und wie _____ du?" cümlesindeki boşluklara sırasıyla hangi fiil çekimleri gelmelidir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'heiße / heißt',
      'heißt / heiße',
      'bin / bist',
      'wohne / kommst'
    ]),
    correct_answer: 'heiße / heißt',
    hint_1: '"Ich" öznesi için heißen fiili "-e", "du" öznesi için ise "-t" veya "-st" takısı alır.',
    hint_2: 'Ich heiße ..., Wie heißt du?',
    explanation: 'Almancada "heißen" fiilinin çekimi: Ich heiße, Du heißt, Er/Sie/Es heißt şeklindedir.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_almanca_2',
    topic_id: 'topic_almanca_school',
    question_text: 'Almancada "Buch" (kitap) ve "Schule" (okul) kelimelerinin belirli artikelleri sırasıyla hangileridir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'das Buch / die Schule',
      'der Buch / das Schule',
      'die Buch / der Schule',
      'das Buch / der Schule'
    ]),
    correct_answer: 'das Buch / die Schule',
    hint_1: 'Almancada kelimeler der (eril), die (dişil) veya das (nötr) artikel alır.',
    hint_2: 'Kitap nötrdür (das), okul ise dişildir (die).',
    explanation: 'Almanca 9. sınıf müfredatında okul eşyaları: das Buch (kitap), die Schule (okul), der Bleistift (kurşun kalem).',
    difficulty: 2,
    meb_aligned: 1
  },

  // ==========================================
  // 12. BİLİŞİM TEKNOLOJİLERİ VE YAZILIM SORULARI
  // ==========================================
  {
    id: 'q_bilisim_1',
    topic_id: 'topic_bilisim_algo',
    question_text: 'Akış şemalarında (flowchart) bir "Karar / Koşul" (örneğin: sayı > 0 mı?) belirtmek için hangi geometrik şekil kullanılır?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'Eşkenar Dörtgen (Baklava Dilimi / Romp)',
      'Dikdörtgen',
      'Elips',
      'Paralelkenar'
    ]),
    correct_answer: 'Eşkenar Dörtgen (Baklava Dilimi / Romp)',
    hint_1: 'Elips başla/bitir içindir, dikdörtgen ise işlem (hesaplama) içindir.',
    hint_2: 'Evet/Hayır şeklinde ikiye ayrılan karar mekanizması baklava dilimi ile çizilir.',
    explanation: 'Akış şemalarında: Elips = Başla/Dur, Dikdörtgen = İşlem, Paralelkenar = Veri Girişi, Eşkenar Dörtgen (Baklava) = Karar/Koşul.',
    difficulty: 2,
    meb_aligned: 1
  },
  {
    id: 'q_bilisim_2',
    topic_id: 'topic_bilisim_cyber',
    question_text: 'Aşağıdakilerden hangisi siber güvenlik standartlarına göre "güçlü bir parola" oluşturma kuralı değildir?',
    question_type: 'multiple_choice',
    options_json: JSON.stringify([
      'Doğum tarihi, isim ve tutulan takım gibi kişisel bilgileri içermesi',
      'En az 8-12 karakter uzunluğunda olması',
      'Büyük harf, küçük harf, rakam ve özel karakter (!, ?, @) kombinasyonu barındırması',
      'Farklı platformlar için aynı parolanın tekrar kullanılmaması'
    ]),
    correct_answer: 'Doğum tarihi, isim ve tutulan takım gibi kişisel bilgileri içermesi',
    hint_1: 'Kişisel bilgiler saldırganlar tarafından sosyal mühendislikle en kolay tahmin edilen bilgilerdir.',
    hint_2: 'Doğum tarihi ve isim parola içinde ASLA yer almamalıdır.',
    explanation: 'Güçlü parola kişisel ve tahmin edilebilir bilgiler (doğum yılı, isim, 123456 vb.) İÇERMEMELİDİR.',
    difficulty: 2,
    meb_aligned: 1
  }
];
