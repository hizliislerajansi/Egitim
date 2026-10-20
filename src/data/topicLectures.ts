export interface WorkedExample {
  question: string;
  solutionSteps: string[];
  finalAnswer: string;
}

export interface TopicLecture {
  topicId: string;
  subjectId: string;
  unit: string;
  title: string;
  outcome: string;
  summary: string;
  keyPoints: string[];
  workedExample: WorkedExample;
  formulasOrRules: { title: string; content: string }[];
  audioNarration: string;
}

export const TOPIC_LECTURES: Record<string, TopicLecture> = {
  // ==========================================
  // 1. MATEMATİK
  // ==========================================
  'topic_math_equations': {
    topicId: 'topic_math_equations',
    subjectId: 'subj_math',
    unit: 'Ünite 1: Denklem ve Eşitsizlikler',
    title: 'Birinci Dereceden Bir Bilinmeyenli Denklemler',
    outcome: 'MAT.9.3.2.1. Gerçek sayılar kümesinde birinci dereceden bir bilinmeyenli denklem çözer.',
    summary: 'a, b reel sayı ve a sıfırdan farklı olmak üzere ax + b = 0 biçimindeki denklemlerdir. Çözüm için x terimi eşitliğin bir tarafında yalnız bırakılır: ax = -b => x = -b / a.',
    keyPoints: [
      'Parantez varsa önce dağılma özelliği uygulanır.',
      'Bilinen sayılar bir tarafa, bilinmeyenler (x) diğer tarafa işaret değiştirerek geçer.',
      '0 · x = 0 çıkarsa çözüm kümesi tüm reel sayılardır (Ç = R).',
      '0 · x = k (k sıfırdan farklı) çıkarsa çözüm kümesi boş kümedir (Ç = boş küme).'
    ],
    formulasOrRules: [
      { title: 'Genel Denklem Formülü', content: 'ax + b = 0 => x = -b / a (a ≠ 0)' },
      { title: 'Dağılma Kuralı', content: 'a(b + c) = a·b + a·c' }
    ],
    workedExample: {
      question: '3(2x - 4) + 5 = 2x + 9 denklemini sağlayan x değeri kaçtır?',
      solutionSteps: [
        '1. Adım: Parantezi dağıtalım: 6x - 12 + 5 = 2x + 9',
        '2. Adım: Sabit terimleri toplayalım: 6x - 7 = 2x + 9',
        '3. Adım: 2x\'i sola, -7\'yi sağa geçirelim: 6x - 2x = 9 + 7',
        '4. Adım: 4x = 16 => x = 4 bulunur.'
      ],
      finalAnswer: '4'
    },
    audioNarration: 'Birinci dereceden denklemleri çözerken temel prensip, x bilinmeyenini eşitliğin bir tarafında yalnız bırakmaktır. Eşitliğin karşısına geçen sayının işareti değişir. Pozitifse negatif, çarpım durumundaysa bölüm olarak geçer.'
  },

  'topic_math_sets': {
    topicId: 'topic_math_sets',
    subjectId: 'subj_math',
    unit: 'Ünite 2: Kümeler',
    title: 'Kümelerde İşlemler ve Alt Küme',
    outcome: 'MAT.9.2.1.2. Kümelerde birleşim, kesişim, fark ve tümleme işlemlerini uygular.',
    summary: 'İyi tanımlanmış nesneler topluluğuna küme denir. A kümesinin eleman sayısı s(A) ile gösterilir. İki kümenin birleşimi, kesişimi ve farkı küme işlemlerinin temelini oluşturur.',
    keyPoints: [
      'n elemanlı bir kümenin alt küme sayısı 2ⁿ formülüyle hesaplanır.',
      'Öz alt küme sayısı 2ⁿ - 1 dir.',
      'Birleşim formülü: s(A ∪ B) = s(A) + s(B) - s(A ∩ B).'
    ],
    formulasOrRules: [
      { title: 'Birleşim Formülü', content: 's(A ∪ B) = s(A) + s(B) - s(A ∩ B)' },
      { title: 'Alt Küme Sayısı', content: '2ⁿ' }
    ],
    workedExample: {
      question: 's(A ∪ B) = 18, s(A ∩ B) = 4 ve s(A) = 10 ise s(B) kaçtır?',
      solutionSteps: [
        '1. Adım: Formülümüz: s(A ∪ B) = s(A) + s(B) - s(A ∩ B)',
        '2. Adım: Sayıları yazalım: 18 = 10 + s(B) - 4',
        '3. Adım: 18 = 6 + s(B) => s(B) = 12 bulunur.'
      ],
      finalAnswer: '12'
    },
    audioNarration: 'Kümeler konusunda en önemli kural birleşim eleman sayısıdır. Ortak elemanlar iki kez sayılmasın diye kesişimi bir kez çıkarırız.'
  },

  'topic_math_absolute': {
    topicId: 'topic_math_absolute',
    subjectId: 'subj_math',
    unit: 'Ünite 1: Denklem ve Eşitsizlikler',
    title: 'Mutlak Değerli Denklemler',
    outcome: 'MAT.9.3.2.3. Mutlak değer içeren birinci dereceden bir bilinmeyenli denklemleri çözer.',
    summary: 'Bir sayının sayı doğrusunda sıfıra olan uzaklığına mutlak değer denir ve |x| ile gösterilir. Uzaklık negatif olamayacağından mutlak değer daima sıfıra eşit veya büyüktür.',
    keyPoints: [
      '|f(x)| = a (a > 0) ise f(x) = a veya f(x) = -a olarak iki ayrı kök incelenir.',
      '|f(x)| = negatif bir sayı ise çözüm kümesi kesinlikle boş kümedir.'
    ],
    formulasOrRules: [
      { title: 'Açılım Kuralı', content: '|x| = a (a ≥ 0) => x = a veya x = -a' }
    ],
    workedExample: {
      question: '|2x - 6| = 10 denkleminin kökler toplamı kaçtır?',
      solutionSteps: [
        '1. Durum: 2x - 6 = 10 => 2x = 16 => x = 8',
        '2. Durum: 2x - 6 = -10 => 2x = -4 => x = -2',
        'Kökler toplamı: 8 + (-2) = 6.'
      ],
      finalAnswer: '6'
    },
    audioNarration: 'Mutlak değer bir sayının sıfıra olan uzaklığıdır. Mesafe asla eksi olamaz. Bir mutlak değer pozitif bir sayıya eşit olduğunda biri artı diğeri eksi olmak üzere iki durumu da çözmelisin.'
  },

  'topic_math_triangles': {
    topicId: 'topic_math_triangles',
    subjectId: 'subj_math',
    unit: 'Ünite 3: Üçgenler',
    title: 'Üçgende Açılar ve Kenar Bağıntıları',
    outcome: 'MAT.9.4.1.1. Üçgende açı özellikleri ile kenar uzunlukları arasındaki ilişkileri kurar.',
    summary: 'Bir üçgenin iç açıları toplamı 180°, dış açıları toplamı 360°dir. Bir dış açının ölçüsü, kendisine komşu olmayan iki iç açının ölçüleri toplamına eşittir.',
    keyPoints: [
      'İç açılar toplamı = 180 derece.',
      'Büyük açı karşısında büyük kenar, küçük açı karşısında küçük kenar bulunur.',
      'Üçgen Eşitsizliği: |b - c| < a < b + c.'
    ],
    formulasOrRules: [
      { title: 'Üçgen Eşitsizliği', content: '|b - c| < a < b + c' }
    ],
    workedExample: {
      question: 'İç açıları 65° ve 45° olan üçgenin üçüncü açısı kaç derecedir?',
      solutionSteps: [
        '1. Adım: İki açıyı topla: 65 + 45 = 110°',
        '2. Adım: 180\'den çıkar: 180 - 110 = 70°.'
      ],
      finalAnswer: '70'
    },
    audioNarration: 'Üçgenin iç açıları toplamı her zaman 180 derecedir. İki açıyı toplayıp 180 dereceden çıkardığında üçüncü açıyı kolayca bulabilirsin.'
  },

  'topic_math_logic': {
    topicId: 'topic_math_logic',
    subjectId: 'subj_math',
    unit: 'Ünite 5: Sembolik Mantık (Matematiksel Önermeler)',
    title: 'Önermeler ve Doğruluk Değerleri',
    outcome: 'MAT.9.1.1.1. Önermeyi, önermenin doğruluk değerini ve bileşik önermeleri açıklar.',
    summary: 'Doğru ya da yanlış kesin bir hüküm bildiren matematiksel ifadelere önerme denir. Önermeler p, q gibi küçük harflerle gösterilir. p önermesi doğru ise doğruluk değeri 1, yanlış ise 0\'dır. Bu konu sembolik cebir mantığıdır.',
    keyPoints: [
      'Kesin bir matematiksel hüküm bildirmelidir.',
      'p ∧ q (Ve): İkisi de 1 ise 1 olur.',
      'p ∨ q (Veya): En az biri 1 ise 1 olur.',
      'p ⇒ q (İse): Yalnızca 1 ise 0 iken 0 olur (100 kuralı).'
    ],
    formulasOrRules: [
      { title: 'De Morgan Kuralı', content: '(p ∧ q)\' ≡ p\' ∨ q\'' }
    ],
    workedExample: {
      question: 'p ≡ 1 ve q ≡ 0 ise (p ∧ q\') değeri nedir?',
      solutionSteps: [
        'q\' = 0\'ın değili = 1.',
        'p ∧ q\' = 1 ∧ 1 = 1.'
      ],
      finalAnswer: '1'
    },
    audioNarration: 'Matematiksel mantıkta önerme kesin bir hüküm bildirir. Ve bağlacında sonucun doğru olması için iki önermenin de doğru olması şarttır.'
  },

  // ==========================================
  // 2. TÜRK DİLİ VE EDEBİYATI
  // ==========================================
  'topic_turk_intro': {
    topicId: 'topic_turk_intro',
    subjectId: 'subj_turk',
    unit: 'Ünite 1: Giriş & İletişim',
    title: 'Edebiyatın Tanımı ve İletişim Ögeleri',
    outcome: 'TDE.9.1.1. İletişimin temel ögelerini kavrar.',
    summary: 'Duygu ve düşüncelerin dil aracılığıyla estetik biçimde ifade edilmesine edebiyat denir. İletişim ögeleri: Gönderici (kaynak), Alıcı, İleti (mesaj), Kanal (iletişim yolu), Dönüt (geri bildirim) ve Bağlam (ortam).',
    keyPoints: [
      'Gönderici: İletiyi başlatan kişi veya kurum.',
      'Kanal: İletinin aktarıldığı ortam (ses, yazı, görsel vb.).',
      'Dönüt: Alıcının göndericiye verdiği yanıt.'
    ],
    formulasOrRules: [
      { title: 'İletişim Şeması', content: 'Gönderici ➔ İleti (Kanal) ➔ Alıcı ➔ Dönüt' }
    ],
    workedExample: {
      question: 'Öğretmenin öğrencilerine sözlü olarak ödev vermesinde kanal nedir?',
      solutionSteps: [
        'Öğretmen: Gönderici, Öğrenciler: Alıcı, Ödev: İleti.',
        'Sözlü dil ve ses dalgaları: Kanal ögesidir.'
      ],
      finalAnswer: 'Ses dalgaları (Sözlü dil)'
    },
    audioNarration: 'Türk Dili ve Edebiyatı dersinde iletişimin ögeleri temel konudur. İleti yani mesaj, hava ve ses dalgaları gibi bir kanal üzerinden alıcıya ulaşır ve dönüt ile tamamlanır.'
  },

  'topic_turk_story': {
    topicId: 'topic_turk_story',
    subjectId: 'subj_turk',
    unit: 'Ünite 2: Hikâye (Öykü)',
    title: 'Olay ve Durum Hikâyeleri',
    outcome: 'TDE.9.2.1. Olay ve durum hikâyelerinin özelliklerini analiz eder.',
    summary: 'Hikâye yaşanmış ya da yaşanabilir olayları anlatan kısa edebî türdür. İki temel türü vardır: 1. Olay (Klasik/Maupassant) Hikâyesi: Serim, düğüm, çözüm planı vardır (Ömer Seyfettin). 2. Durum (Kesit/Çehov) Hikâyesi: Günlük yaşamdan bir anı anlatır (Sait Faik).',
    keyPoints: [
      'Olay hikâyesi: Merak ögesi ön plandadır, çarpıcı bir sonla biter.',
      'Durum hikâyesi: Merak ögesi geri plandadır, duygu ve atmosfer önemlidir.'
    ],
    formulasOrRules: [
      { title: 'Hikâye Unsurları', content: 'Olay + Kişi + Zaman + Mekân' }
    ],
    workedExample: {
      question: 'Türk edebiyatında durum hikâyesinin en önemli ustası kimdir?',
      solutionSteps: [
        'Klasik olay hikâyesinde Ömer Seyfettin öne çıkar.',
        'Durum ve kesit hikâyesinde ise Sait Faik Abasıyanık en önemli temsilcidir.'
      ],
      finalAnswer: 'Sait Faik Abasıyanık'
    },
    audioNarration: 'Hikâyede iki büyük tarz vardır. Merak ve heyecanın yüksek olduğu tür olay hikâyesidir. Günlük hayatın bir kesitini duygu dolu anlatan tür ise durum hikâyesidir.'
  },

  // ==========================================
  // 3. FİZİK
  // ==========================================
  'topic_fizik_intro': {
    topicId: 'topic_fizik_intro',
    subjectId: 'subj_fizik',
    unit: 'Ünite 1: Fizik Bilimine Giriş',
    title: 'Temel ve Türetilmiş Büyüklükler',
    outcome: 'FIZ.9.1.1. Temel ve türetilmiş büyüklükleri ayırt eder.',
    summary: 'Fizikte tek başına ifade edilebilen büyüklüklere temel büyüklük denir. KISAMUZ formülüyle kodlanır: Kütle (kg), Işık şiddeti (cd), Sıcaklık (K), Akım şiddeti (A), Madde miktarı (mol), Uzunluk (m), Zaman (s). Bunların dışındakiler (kuvvet, hız, enerji) türetilmiş büyüklüktür.',
    keyPoints: [
      'KISAMUZ: Kütle, Işık, Sıcaklık, Akım, Madde, Uzunluk, Zaman.',
      'Türetilmiş büyüklükler: Birden fazla temel büyüklüğün birleşimiyle oluşur (örn: Hız = m/s).'
    ],
    formulasOrRules: [
      { title: 'KISAMUZ Kuralı', content: 'K-I-S-A-M-U-Z temel büyüklüklerdir' }
    ],
    workedExample: {
      question: 'Kuvvet, Hız, Kütle ve İş arasından hangisi temel büyüklüktür?',
      solutionSteps: [
        'KISAMUZ kuralındaki K harfi Kütle\'dir.',
        'Kuvvet, hız ve iş ise türetilmiş büyüklüklerdir.'
      ],
      finalAnswer: 'Kütle'
    },
    audioNarration: 'Fizik bilimine girişte en kritik konu KISAMUZ kodlamasıdır. Kütle, ışık şiddeti, sıcaklık, akım, madde miktarı, uzunluk ve zaman temel büyüklüklerdir.'
  },

  'topic_fizik_matter': {
    topicId: 'topic_fizik_matter',
    subjectId: 'subj_fizik',
    unit: 'Ünite 2: Madde ve Özellikleri',
    title: 'Özkütle ve Hacim Hesaplamaları',
    outcome: 'FIZ.9.2.1. Maddelerin özkütlesini hesaplar.',
    summary: 'Birim hacimdeki madde miktarına özkütle (yoğunluk) denir. d = m / V formülüyle hesaplanır. Burada d özkütle (g/cm³), m kütle (gram), V hacimdir (cm³).',
    keyPoints: [
      'd = m / V (Dede muzu böl ver olarak da kodlanır).',
      'Sabit sıcaklık ve basınçta özkütle maddeler için ayırt edici özelliktir.'
    ],
    formulasOrRules: [
      { title: 'Özkütle Formülü', content: 'd = m / V' }
    ],
    workedExample: {
      question: 'Kütlesi 120 g, hacmi 40 cm³ olan cismin özkütlesi kaçtır?',
      solutionSteps: [
        'd = m / V = 120 / 40 = 3 g/cm³.'
      ],
      finalAnswer: '3'
    },
    audioNarration: 'Özkütle formülümüz: d eşittir m bölü V dir. Yani kütleyi hacme böldüğümüzde maddenin yoğunluğunu elde ederiz.'
  },

  // ==========================================
  // 4. KİMYA
  // ==========================================
  'topic_kimya_science': {
    topicId: 'topic_kimya_science',
    subjectId: 'subj_kimya',
    unit: 'Ünite 1: Kimya Bilimi',
    title: 'Simyadan Kimyaya ve Yaygın Bileşikler',
    outcome: 'KIM.9.1.1. Yaygın bileşiklerin geleneksel adlarını açıklar.',
    summary: 'Simya teorik temellere ve sistematik bilgi birikimine dayanmadığı için bilim sayılmaz. Kimya ise deney ve ölçümlere dayalı modern bir pozitif bilimdir.',
    keyPoints: [
      'H₂O: Su',
      'HCl: Tuz ruhu',
      'H₂SO₄: Zaç yağı (sülfürik asit)',
      'HNO₃: Kezzap',
      'NaCl: Yemek tuzu'
    ],
    formulasOrRules: [
      { title: 'Geleneksel Adlandırma', content: 'H₂SO₄ = Zaç Yağı, HCl = Tuz Ruhu, HNO₃ = Kezzap' }
    ],
    workedExample: {
      question: 'Formülü H₂SO₄ olan bileşiğin yaygın adı nedir?',
      solutionSteps: [
        'H₂SO₄ sülfürik asittir ve halk arasındaki geleneksel adı Zaç Yağı\'dır.'
      ],
      finalAnswer: 'H₂SO₄ (Zaç yağı)'
    },
    audioNarration: 'Kimya biliminde bileşiklerin geleneksel adları sınavların vazgeçilmezidir. H iki S O dört zaç yağı, H C L tuz ruhu, H N O üç ise kezzap olarak bilinir.'
  },

  // ==========================================
  // 5. BİYOLOJİ
  // ==========================================
  'topic_biyoloji_life': {
    topicId: 'topic_biyoloji_life',
    subjectId: 'subj_biyoloji',
    unit: 'Ünite 1: Yaşam Bilimi Biyoloji',
    title: 'Canlıların Ortak Özellikleri',
    outcome: 'BIY.9.1.1. Canlıların ortak özelliklerini açıklar.',
    summary: 'Tüm canlılar hücre veya hücrelerden oluşur. Beslenme, solunum (ATP üretimi), boşaltım, hareket, uyarılara tepki, metabolizma, homeostazi (iç denge), üreme ve adaptasyon tüm canlıların ortak özelliğidir.',
    keyPoints: [
      'Tüm canlılar zarsız bir organel olan Ribozom taşır ve protein sentezi yapar.',
      'Homeostazi: Değişen çevre şartlarına karşı vücut iç dengesinin sabit tutulmasıdır.'
    ],
    formulasOrRules: [
      { title: 'Ortak Organel', content: 'Ribozom tüm canlı hücrelerde ortaktır' }
    ],
    workedExample: {
      question: 'Protein sentezinden sorumlu ve tüm canlılarda bulunan organel hangisidir?',
      solutionSteps: [
        'Ribozom zarsızdır ve tüm prokaryot ve ökaryot hücrelerde ortaktır.'
      ],
      finalAnswer: 'Ribozom'
    },
    audioNarration: 'Biyolojide canlıların ortak özelliklerini incelerken en önemli kural ribozomdur. Bakteriden insana kadar tüm canlı hücreler ribozom organeline sahiptir ve protein sentezler.'
  },

  // ==========================================
  // 6. TARİH
  // ==========================================
  'topic_tarih_time': {
    topicId: 'topic_tarih_time',
    subjectId: 'subj_tarih',
    unit: 'Ünite 1: Tarih ve Zaman',
    title: 'Tarih Bilimi ve Takvim Sistemleri',
    outcome: 'TAR.9.1.1. Türklerin kullandığı takvimleri açıklar.',
    summary: 'Tarih geçmişteki insan topluluklarının faaliyetlerini yer ve zaman göstererek, belgelere dayalı, sebep-sonuç ilişkisi içinde inceleyen sosyal bir bilimdir. Türkler tarih boyunca 5 takvim kullanmıştır: 12 Hayvanlı Türk Takvimi, Hicri Takvim, Celali Takvim, Rumi Takvim, Miladi Takvim.',
    keyPoints: [
      'Hicri Takvim: Ay yılı esasına dayanan tek takvimdir (1 yıl = 354 gün).',
      'Diğer tüm takvimler Güneş yılı esasına dayanır (1 yıl = 365 gün 6 saat).'
    ],
    formulasOrRules: [
      { title: 'Türklerin Takvimleri', content: '12 Hayvanlı ➔ Hicri ➔ Celali ➔ Rumi ➔ Miladi' }
    ],
    workedExample: {
      question: 'Türklerin kullandığı takvimlerden hangisi Ay yılı esasına dayanır?',
      solutionSteps: [
        'Hicri takvim Ay\'ın Dünya etrafındaki dönüşünü esas alır ve 354 gündür.'
      ],
      finalAnswer: 'Hicri Takvim'
    },
    audioNarration: 'Tarih ve zaman ünitesinde takvimler büyük önem taşır. Türklerin kullandığı takvimlerden yalnızca Hicri takvim Ay yılına dayanır, diğer dördü Güneş yılı takvimidir.'
  },

  // ==========================================
  // 7. COĞRAFYA
  // ==========================================
  'topic_cografya_coordinates': {
    topicId: 'topic_cografya_coordinates',
    subjectId: 'subj_cografya',
    unit: 'Ünite 2: Coğrafi Koordinat Sistemi',
    title: 'Meridyenler ve Yerel Saat Hesaplamaları',
    outcome: 'COG.9.2.1. Yerel saat farklarını hesaplar.',
    summary: 'Kutup noktalarını birleştiren hayali yarım çemberlere meridyen denir. Başlangıç meridyeni Greenwich\'tir (0°). Dünya 24 saatte 360 meridyen döndüğü için ardışık iki meridyen arasındaki yerel saat farkı daima 4 dakikadır.',
    keyPoints: [
      '2 meridyen arası zaman farkı = 4 dakika.',
      'Dünya batıdan doğuya döndüğü için doğudaki boylamlarda yerel saat daima ileridir.'
    ],
    formulasOrRules: [
      { title: 'Zaman Farkı Kuralı', content: 'Meridyen Farkı x 4 dakika = Yerel Saat Farkı' }
    ],
    workedExample: {
      question: 'İki meridyen arasındaki zaman farkı kaç dakikadır?',
      solutionSteps: [
        '24 saat x 60 dakika = 1440 dakika. 1440 / 360 = 4 dakika bulunur.'
      ],
      finalAnswer: '4'
    },
    audioNarration: 'Coğrafyada meridyenler arası yerel saat farkı altın kuraldır. İki meridyen arası daima dört dakikadır ve doğuda saat daima daha ileridedir.'
  },

  // ==========================================
  // 8. İNGİLİZCE
  // ==========================================
  'topic_eng_theme1': {
    topicId: 'topic_eng_theme1',
    subjectId: 'subj_eng',
    unit: 'Theme 1: Studying Abroad',
    title: 'Greetings & Personal Information',
    outcome: 'E9.1.W1. Introduces oneself and asks for personal information.',
    summary: 'Theme 1 covers expressions for introducing yourself, asking origins (Where are you from?), nationality, and using the verb to be (am/is/are).',
    keyPoints: [
      'Formal greeting: "How do you do?" -> Response: "How do you do?"',
      'To be: I am, You/We/They are, He/She/It is.'
    ],
    formulasOrRules: [
      { title: 'To Be Structure', content: 'Subject + am/is/are + complement' }
    ],
    workedExample: {
      question: 'Where _____ your exchange student friends from?',
      solutionSteps: [
        '"Friends" is plural (they), so we use "are".'
      ],
      finalAnswer: 'are'
    },
    audioNarration: 'Theme 1 Studying Abroad covers greetings and personal information. Remember: when meeting someone formally, How do you do is answered with How do you do.'
  },

  'topic_eng_theme3': {
    topicId: 'topic_eng_theme3',
    subjectId: 'subj_eng',
    unit: 'Theme 3: Movies',
    title: 'Movie Genres & Preferences (Prefer)',
    outcome: 'E9.3.R1. Expresses movie preferences using prefer.',
    summary: 'Theme 3 introduces movie genres and expressing preferences using prefer. Golden rule: prefer + Noun + TO + Noun, or prefer + V-ing + TO + V-ing.',
    keyPoints: [
      'Always use TO with prefer, never THAN.',
      'Example: I prefer comedy to action films.'
    ],
    formulasOrRules: [
      { title: 'Prefer Rule', content: 'prefer + V_ing + TO + V_ing' }
    ],
    workedExample: {
      question: 'Which is correct? I prefer watching sci-fi movies _____ comedies.',
      solutionSteps: [
        'The preposition used with prefer is "to".'
      ],
      finalAnswer: 'to'
    },
    audioNarration: 'In Theme 3 Movies, the key grammar rule is the verb prefer. Always use the preposition to with prefer, never than.'
  },

  // ==========================================
  // 9. DİN KÜLTÜRÜ VE AHLAK BİLGİSİ
  // ==========================================
  'topic_din_faith': {
    topicId: 'topic_din_faith',
    subjectId: 'subj_din',
    unit: 'Ünite 1: Bilgi ve İnanç',
    title: 'İslam\'da Bilgi Kaynakları',
    outcome: 'DIN.9.1.1. İslam\'da bilginin kaynaklarını açıklar.',
    summary: 'İslam dininde doğru ve kesin bilginin üç ana kaynağı vardır: 1. Selim Akıl (önyargısız düşünebilen akıl), 2. Sadık Haber (vahiy ve peygamberlerin haberleri), 3. Salim Duyular (sağlam beş duyu organı). Rüya veya kehanet genel bağlayıcı bilgi kaynağı değildir.',
    keyPoints: [
      'Selim Akıl: İnsanın iyiyi kötüden ayırmasını sağlayan akıl.',
      'Sadık Haber: Kur\'an-ı Kerim ve sahih sünnet.',
      'Salim Duyular: Görme, işitme gibi sağlam duyu organları.'
    ],
    formulasOrRules: [
      { title: 'Bilgi Kaynakları', content: 'Selim Akıl + Sadık Haber + Salim Duyular' }
    ],
    workedExample: {
      question: 'İslam dininde kesin bilginin üç kaynağı hangileridir?',
      solutionSteps: [
        'Doğru cevap: Selim akıl, sadık haber ve salim duyulardır.'
      ],
      finalAnswer: 'Selim Akıl - Sadık Haber (Vahiy) - Salim Duyular'
    },
    audioNarration: 'Din kültürü ve ahlak bilgisi dersinde İslamda bilginin üç kaynağı esastır: Selim akıl, vahiy yani sadık haber ve salim duyu organları.'
  },

  // ==========================================
  // 10. SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ (EBA)
  // ==========================================
  'topic_saglik_health': {
    topicId: 'topic_saglik_health',
    subjectId: 'subj_saglik',
    unit: 'Ünite 1: Kişisel ve Toplum Sağlığı',
    title: 'Sağlık Kavramı ve Temel İlkyardım İlkeleri',
    outcome: 'SGT.9.1.1. Sağlığı etkileyen etmenleri sınıflandırır ve hayati acil durumlarda temel ilkyardım ilkelerini açıklar.',
    summary: 'Dünya Sağlık Örgütü\'ne göre sağlık; yalnızca hastalık veya sakatlığın olmayışı değil; bedensel, ruhsal ve sosyal yönden tam bir iyilik durumudur. Acil durumlarda ilkyardımın temel aşamaları: Koruma, Bildirme (112) ve Kurtarma (müdahale) adımlarıdır.',
    keyPoints: [
      'Sağlığın 3 Boyutu: Bedensel, Ruhsal ve Sosyal tam iyilik hali.',
      'İlkyardımın Temel İlkeleri: KBK (Koruma, Bildirme, Kurtarma).',
      'Hayati Fonksiyonlar: Solunum yolu açıklığı, solunum kontrolü ve dolaşım kontrolü.'
    ],
    formulasOrRules: [
      { title: 'İlkyardım Adımları', content: 'K-B-K: Koruma -> Bildirme (112) -> Kurtarma' }
    ],
    workedExample: {
      question: 'Kaza yerinde ilk yapılması gereken eylem nedir?',
      solutionSteps: [
        '1. Adım: Önce can güvenliğini sağlamak için KORUMA önlemleri alınır.',
        '2. Adım: Hemen 112 Acil Yardım hattı aranarak BİLDİRME yapılır.',
        '3. Adım: Bilgili personel tarafından KURTARMA / müdahale gerçekleştirilir.'
      ],
      finalAnswer: 'Koruma ve 112 Bildirme'
    },
    audioNarration: 'Sağlık bilgisi ve trafik kültürü dersinde sağlık; sadece bedensel değil, ruhsal ve sosyal tam bir iyilik durumudur. Kaza anında ilkyardımın üç temel aşaması koruma, bildirme ve kurtarmadır.'
  },

  // ==========================================
  // 11. ALMANCA (A1.1 EBA)
  // ==========================================
  'topic_almanca_greetings': {
    topicId: 'topic_almanca_greetings',
    subjectId: 'subj_almanca',
    unit: 'Modul 1: Hallo! (Tanışma)',
    title: 'Almanca Selamlaşma ve Kendini Tanıtma',
    outcome: 'ALM.9.1.1. Almanca temel selamlaşma ve kendini tanıtma ifadelerini (sein, heißen) kullanır.',
    summary: 'Almancada tanışma temel fiilleri: heißen (adı olmak), sein (olmak / to-be) ve kommen (gelmek). Selamlaşmalar: Hallo (Merhaba), Guten Morgen (Günaydın), Guten Tag (İyi günler), Auf Wiedersehen (Hoşça kalın / Görüşmek üzere).',
    keyPoints: [
      'Ich heiße Deniz. (Benim adım Deniz.)',
      'Wie heißt du? (Senin adın ne?)',
      'Ich komme aus der Türkei. (Türkiye\'den geliyorum.)',
      'Woher kommst du? (Nerelisin?)'
    ],
    formulasOrRules: [
      { title: 'Heißen Fiili Çekimi', content: 'Ich heiße, Du heißt, Er/Sie/Es heißt' },
      { title: 'Sein Fiili Çekimi', content: 'Ich bin, Du bist, Er/Sie/Es ist' }
    ],
    workedExample: {
      question: '"Wie heißt du?" sorusuna nasıl yanıt verilir?',
      solutionSteps: [
        'Almanca kendini tanıtma kalıbı: Ich heiße [İsim].'
      ],
      finalAnswer: 'Ich heiße Deniz.'
    },
    audioNarration: 'Almanca A bir nokta bir dersinde tanışırken ih hayse Deniz kalıbı kullanılır. Nerelisin diye sormak için voher komst du denir.'
  },

  // ==========================================
  // 12. BİLİŞİM TEKNOLOJİLERİ VE YAZILIM (EBA)
  // ==========================================
  'topic_bilisim_algo': {
    topicId: 'topic_bilisim_algo',
    subjectId: 'subj_bilisim',
    unit: 'Ünite 1: Problem Çözme ve Algoritmalar',
    title: 'Algoritmalar ve Akış Şeması Sembolleri',
    outcome: 'BTY.9.1.1. Bir problemin çözüm adımlarını algoritma ve akış şeması ile modeller.',
    summary: 'Algoritma, bir problemin çözümü için tasarlanan adım adım sonlu kurallar dizisidir. Akış şeması ise bu adımların evrensel geometrik şekillerle görselleştirilmesidir. Temel şekiller: Elips (Başla/Bitir), Dikdörtgen (İşlem/Hesaplama), Eşkenar Dörtgen (Karar/Koşul), Paralelkenar (Veri Girişi).',
    keyPoints: [
      'Algoritma özellikleri: Başlangıç ve bitişi bellidir, adımları kesindir, sonludur.',
      'Elips: Akış şemasını başlatır veya durdurur.',
      'Eşkenar Dörtgen (Baklava): Koşul/Karar denetimi yapar (Eğer / Değilse).'
    ],
    formulasOrRules: [
      { title: 'Temel Akış Sembolleri', content: 'Elips=Başla, Dikdörtgen=İşlem, Baklava=Koşul, Paralelkenar=Girdi' }
    ],
    workedExample: {
      question: 'Bir sayının pozitif mi negatif mi olduğunu kontrol etmek için akış şemasında hangi sembol kullanılır?',
      solutionSteps: [
        'Koşul ve karşılaştırma işlemleri için Eşkenar Dörtgen (Baklava Dilimi) kullanılır.'
      ],
      finalAnswer: 'Eşkenar Dörtgen (Karar Sembolü)'
    },
    audioNarration: 'Bilişim teknolojileri ve yazılım dersinde algoritma, problemin adım adım çözüm planıdır. Koşul ve karar kontrolleri için akış şemasında eşkenar dörtgen kullanılır.'
  },
  'topic_math_cartesian': {
    "topicId": "topic_math_cartesian",
    "subjectId": "subj_math",
    "unit": "Ünite 2: Kümeler",
    "title": "Kartezyen Çarpım ve Sıralı İkililer",
    "outcome": "MAT.9.2.2.1. İki kümenin kartezyen çarpımını açıklar ve grafik üzerinde gösterir.",
    "summary": "A ve B boş olmayan iki küme olmak üzere, birinci bileşeni A'dan, ikinci bileşeni B'den alınarak oluşturulan tüm (x, y) sıralı ikililerinin kümesine A ile B'nin kartezyen çarpımı denir ve A x B ile gösterilir.",
    "keyPoints": [
      "s(A x B) = s(A) · s(B)",
      "Kartezyen çarpımda değişme özelliği yoktur: A x B ≠ B x A (A = B hariç)",
      "Grafikte birinci küme yatay eksende (x), ikinci küme dikey eksende (y) gösterilir."
    ],
    "formulasOrRules": [
      {
        "title": "Eleman Sayısı Kuralı",
        "content": "s(A x B) = s(A) · s(B)"
      }
    ],
    "workedExample": {
      "question": "s(A) = 4 ve s(B) = 3 ise s(A x B) kaçtır?",
      "solutionSteps": [
        "1. Adım: Formül: s(A x B) = s(A) · s(B)",
        "2. Adım: 4 · 3 = 12 bulunur."
      ],
      "finalAnswer": "12"
    },
    "audioNarration": "Kartezyen çarpımda birinci eleman birinci kümeden, ikinci eleman ikinci kümeden seçilerek sıralı ikililer oluşturulur. Eleman sayısı kümelerin eleman sayılarının çarpımıdır."
  },

  'topic_math_inequalities': {
    "topicId": "topic_math_inequalities",
    "subjectId": "subj_math",
    "unit": "Ünite 1: Denklem ve Eşitsizlikler",
    "title": "Birinci Dereceden Bir Bilinmeyenli Eşitsizlikler",
    "outcome": "MAT.9.3.2.2. Birinci dereceden bir bilinmeyenli eşitsizliklerin çözüm kümesini bulur.",
    "summary": "Küçüktür, büyüktür, küçük eşit ve büyük eşit sembolleri içeren açık önermelerdir. Eşitsizliğin her iki tarafı negatif bir sayıyla çarpılır veya bölünürse eşitsizlik yön değiştirir.",
    "keyPoints": [
      "Negatif sayı ile çarpma veya bölmede yön değiştirme kuralı: a < b ve c < 0 ise a·c > b·c.",
      "Sayı doğrusunda dahil olan noktalar içi dolu, dahil olmayanlar içi boş gösterilir."
    ],
    "formulasOrRules": [
      {
        "title": "Yön Değiştirme Kuralı",
        "content": "x < y ve k < 0 ise k·x > k·y"
      }
    ],
    "workedExample": {
      "question": "-2x + 6 < 14 eşitsizliğinin çözüm kümesini bulunuz.",
      "solutionSteps": [
        "1. Adım: 6 sayısını sağa geçirelim: -2x < 14 - 6 => -2x < 8",
        "2. Adım: Her iki tarafı -2'ye bölelim (eşitsizlik yön değiştirir!): x > -4 bulunur."
      ],
      "finalAnswer": "(-4, ∞)"
    },
    "audioNarration": "Eşitsizlik çözerken en kritik nokta, her iki tarafı negatif bir sayıya böldüğünüzde büyüktür küçüktüre, küçüktür büyüktüre dönüşür."
  },

  'topic_math_data': {
    "topicId": "topic_math_data",
    "subjectId": "subj_math",
    "unit": "Ünite 4: Veri ve İstatistik",
    "title": "Merkezi Eğilim Ölçüleri (Aritmetik Ortalama, Medyan, Mod)",
    "outcome": "MAT.9.5.1.1. Aritmetik ortalama, ortanca ve tepe değer hesaplamaları yapar.",
    "summary": "Aritmetik ortalama verilerin toplamının veri sayısına bölümüdür. Medyan veriler küçükten büyüğe sıralandığında tam ortadaki değerdir. Mod ise en çok tekrar eden değerdir.",
    "keyPoints": [
      "Aritmetik Ortalama = Toplam / Eleman Sayısı",
      "Medyan için verileri mutlaka küçükten büyüğe sıralamalısınız.",
      "Mod en yüksek frekansa sahip değerdir; birden fazla mod olabilir veya hiç olmayabilir."
    ],
    "formulasOrRules": [
      {
        "title": "Aritmetik Ortalama",
        "content": "X̄ = (x₁ + x₂ + ... + xn) / n"
      }
    ],
    "workedExample": {
      "question": "3, 5, 5, 7, 10 veri grubunun modu ve medyanı nedir?",
      "solutionSteps": [
        "1. Adım: Sıralı liste: 3, 5, 5, 7, 10. Eleman sayısı 5 (tek).",
        "2. Adım: Ortadaki 3. eleman 5 olduğundan Medyan = 5.",
        "3. Adım: En çok tekrar eden sayı 5 (2 kez) olduğundan Mod = 5."
      ],
      "finalAnswer": "Mod = 5, Medyan = 5"
    },
    "audioNarration": "Veri analizinde ortalama tüm değerleri hesaba katar. Medyan aşırı uç değerlerden etkilenmez, mod ise en popüler olanı gösterir."
  },

  'topic_turk_poetry': {
    "topicId": "topic_turk_poetry",
    "subjectId": "subj_turk",
    "unit": "Ünite 3: Şiir Bilgisi",
    "title": "Şiirde Ahenk Unsurları, Kafiye ve Redif",
    "outcome": "TDE.9.3.1. Şiirde kafiye, redif ve nazım birimini analiz eder.",
    "summary": "Dize sonlarındaki ses benzerliklerine kafiye (uyak) denir. Kafiyeden sonra gelen, yazılışları ve görevleri aynı olan ek veya sözcüklere ise redif denir.",
    "keyPoints": [
      "Yarım Uyak: Tek ses benzerliği.",
      "Tam Uyak: İki ses benzerliği.",
      "Zengin Uyak: Üç veya daha fazla ses benzerliği.",
      "Tunç Uyak: Bir sözcüğün diğerinin içinde aynen yer alması.",
      "Önce redif bulunur, sonra kalan kısımda kafiye aranır."
    ],
    "formulasOrRules": [
      {
        "title": "Bulma Sırası",
        "content": "Dize Sonu -> Önce Redif (aynı görev) -> Kalan kökte Kafiye"
      }
    ],
    "workedExample": {
      "question": "Yollarda kaldım ağlarım / Yüreğimden yaralarım dizelerindeki kafiye ve redif nedir?",
      "solutionSteps": [
        "1. Adım: Dizelerin kökleri: ağla- / yara-",
        "2. Adım: Ekler: -rım (geniş zaman + 1. tekil şahıs) görevce aynıdır, REDİF'tir.",
        "3. Adım: Kalan köklerdeki \"-a\" sesleri tek ses benzerliği olduğundan YARIM UYAK'tır."
      ],
      "finalAnswer": "Redif: -rım, Kafiye: -a (Yarım Kafiye)"
    },
    "audioNarration": "Şiirde kafiye ve redif ararken altın kural şudur: Önce aynı anlama gelen veya aynı görevdeki ekleri ayırıp redif yapın, geriye kalan köklerde ses benzerliğini sayın."
  },

  'topic_turk_spelling': {
    "topicId": "topic_turk_spelling",
    "subjectId": "subj_turk",
    "unit": "Ünite 4: Dil Bilgisi",
    "title": "Yazım Kuralları (de/da, ki ve mi'nin Yazımı)",
    "outcome": "TDE.9.4.1. Metinlerde yazım ve noktalama kurallarını doğru uygular.",
    "summary": "Bağlaç olan \"de/da\" ve \"ki\" ayrı yazılır ve cümleden çıkarıldığında anlam bozulmaz. Ek olan \"-de/-da\" (bulunma hali) ve \"-ki\" (aitlik eki) ise bitişik yazılır.",
    "keyPoints": [
      "\"de\"yi cümleden çıkar; anlam bozulmuyorsa bağlaçtır (ayrı), bozuluyorsa ektir (bitişik).",
      "\"ki\"den sonra \"-ler\" eki getir; anlamlı oluyorsa ektir (bitişik), anlamsız oluyorsa bağlaçtır (ayrı).",
      "Soru eki \"mi/mı/mu/mü\" her zaman ayrı yazılır."
    ],
    "formulasOrRules": [
      {
        "title": "Ki Pratik Kuralı",
        "content": "Kelimeye \"-ler\" ekle: Anlamlıysa bitişik, anlamsızsa ayrı"
      }
    ],
    "workedExample": {
      "question": "Evde ki hesap çarşıya uymaz cümlesindeki yazım hatası nedir?",
      "solutionSteps": [
        "1. Adım: \"Evdeki\" sözcüğüne bakalım. \"-ler\" getirelim: \"Evdekiler\" anlamlıdır.",
        "2. Adım: Anlamlı olduğuna göre sıfat yapan ki'dir ve bitişik yazılmalıdır."
      ],
      "finalAnswer": "\"Evdeki\" şeklinde bitişik yazılmalıdır."
    },
    "audioNarration": "Türkçede bağlaçlar ayrı sözcüklerdir ve ayrı yazılır. Ekler ise sözcüğün bir parçasıdır ve bitişik yazılır."
  },

  'topic_fizik_motion': {
    "topicId": "topic_fizik_motion",
    "subjectId": "subj_fizik",
    "unit": "Ünite 3: Hareket ve Kuvvet",
    "title": "Düzgün Doğrusal Hareket ve Newton'un Hareket Yasaları",
    "outcome": "FIZ.9.3.1. Düzgün doğrusal hareketi ve Newton yasalarını açıklar.",
    "summary": "Hızı zamanla değişmeyen harekete düzgün doğrusal hareket denir (x = v·t). Newton'un 1. Yasası Eylemsizlik, 2. Yasası Dinamiğin Temel Prensibi (F = m·a), 3. Yasası Etki-Tepki Prensibidir.",
    "keyPoints": [
      "x = v · t (Alınan Yol = Hız · Zaman)",
      "F = m · a (Net Kuvvet = Kütle · İvme)",
      "Net kuvvet sıfırsa duran cisim durur, hareketli cisim sabit hızla yoluna devam eder."
    ],
    "formulasOrRules": [
      {
        "title": "Temel Formül",
        "content": "F_net = m · a ve x = v · t"
      }
    ],
    "workedExample": {
      "question": "4 kg kütleli bir cisme 20 N net kuvvet uygulanırsa ivmesi kaç m/s² olur?",
      "solutionSteps": [
        "1. Adım: Formülümüz: F = m · a",
        "2. Adım: 20 = 4 · a => a = 5 m/s² bulunur."
      ],
      "finalAnswer": "5 m/s²"
    },
    "audioNarration": "Fizikte kuvvet ivmenin, yani hız değişiminin kaynağıdır. Kuvvet kütle ile ivmenin çarpımına eşittir."
  },

  'topic_fizik_energy': {
    "topicId": "topic_fizik_energy",
    "subjectId": "subj_fizik",
    "unit": "Ünite 4: Enerji",
    "title": "Mekanik İş, Güç, Kinetik ve Potansiyel Enerji",
    "outcome": "FIZ.9.4.1. İş, güç ve enerji kavramlarını açıklar; mekanik enerjinin korunumunu irdeler.",
    "summary": "Fiziksel anlamda iş yapılabilmesi için bir cisme kuvvet uygulanmalı ve cisim bu kuvvet doğrultusunda yer değiştirmelidir (W = F · x). Birim zamanda yapılan işe güç denir (P = W / t).",
    "keyPoints": [
      "İş: W = F · x (Joule)",
      "Kinetik Enerji: Ek = 1/2 · m · v²",
      "Yer Çekimi Potansiyel Enerjisi: Ep = m · g · h",
      "Sürtünmesiz ortamda Mekanik Enerji (Ek + Ep) daima korunur."
    ],
    "formulasOrRules": [
      {
        "title": "İş ve Enerji",
        "content": "W = F · Δx, Ek = 1/2 m v², Ep = m g h"
      }
    ],
    "workedExample": {
      "question": "2 kg kütleli bir cisim yerden 5 metre yüksekte iken potansiyel enerjisi kaç Joule olur? (g = 10 m/s²)",
      "solutionSteps": [
        "1. Adım: Ep = m · g · h formülü kullanılır.",
        "2. Adım: Ep = 2 · 10 · 5 = 100 Joule bulunur."
      ],
      "finalAnswer": "100 Joule"
    },
    "audioNarration": "Enerji yoktan var edilemez, vardan yok edilemez; sadece bir türden diğerine dönüşür. Yükseklik potansiyel, hız ise kinetik enerji demektir."
  },

  'topic_kimya_atom': {
    "topicId": "topic_kimya_atom",
    "subjectId": "subj_kimya",
    "unit": "Ünite 2: Atom ve Periyodik Sistem",
    "title": "Atom Modelleri ve Periyodik Tablo",
    "outcome": "KIM.9.2.1. Atom altı parçacıkları kavrar ve periyodik sistemde yer bulur.",
    "summary": "Atom çekirdeğinde pozitif yüklü protonlar ve yüksüz nötronlar bulunur; çekirdek etrafındaki katmanlarda ise negatif elektronlar dolanır. Nötr atomda Proton Sayısı = Elektron Sayısıdır. Katman elektron dağılımında son katmandaki elektron sayısı grup numarasını, katman sayısı periyot numarasını verir.",
    "keyPoints": [
      "Kütle Numarası = Proton + Nötron",
      "Katman sayısı = Periyot numarası",
      "Değerlik elektron sayısı = A Grubu numarası"
    ],
    "formulasOrRules": [
      {
        "title": "Kütle Bağıntısı",
        "content": "A (Kütle No) = Z (Proton) + N (Nötron)"
      }
    ],
    "workedExample": {
      "question": "Atom numarası 12 olan Magnezyum (Mg) elementinin periyot ve grubunu bulunuz.",
      "solutionSteps": [
        "1. Adım: Katman dağılımı: 2 ) 8 ) 2",
        "2. Adım: 3 katman olduğu için 3. Periyot.",
        "3. Adım: Son katmanda 2 elektron olduğu için 2A Grubu (Toprak Alkali Metal)."
      ],
      "finalAnswer": "3. Periyot, 2A Grubu"
    },
    "audioNarration": "Atomun kimliğini proton sayısı belirler. Periyodik cetvelde benzer kimyasal özellik gösteren elementler aynı düşey sütunda yani grupta yer alır."
  },

  'topic_kimya_bonds': {
    "topicId": "topic_kimya_bonds",
    "subjectId": "subj_kimya",
    "unit": "Ünite 3: Kimyasal Türler Arası Etkileşimler",
    "title": "Güçlü Etkileşimler (İyonik, Kovalent ve Metalik Bağ)",
    "outcome": "KIM.9.3.1. Kimyasal türler arası güçlü etkileşimleri açıklar.",
    "summary": "Metal ve ametal arasında elektron alışverişi ile oluşan bağa İyonik Bağ denir. Ametal atomlarının elektronlarını ortaklaşa kullanmasıyla Kovalent Bağ oluşur. Metal atomları arasında elektron denizi ile pozitif iyonlar arasındaki çekime Metalik Bağ denir.",
    "keyPoints": [
      "İyonik Bağ: Metal + Ametal (Elektron Alışverişi)",
      "Kovalent Bağ: Ametal + Ametal (Elektron Ortaklaşması)",
      "Metalik Bağ: Metal + Metal (Elektron Denizi Modeli)"
    ],
    "formulasOrRules": [
      {
        "title": "Bağ Türleri",
        "content": "Elektron Alışverişi = İyonik, Elektron Ortaklaşması = Kovalent"
      }
    ],
    "workedExample": {
      "question": "NaCl ve H2O bileşiklerindeki kimyasal bağ türleri nelerdir?",
      "solutionSteps": [
        "1. Adım: Na metal, Cl ametaldir -> Elektron alışverişi ile İYONİK BAĞ oluşur.",
        "2. Adım: H ve O ametaldir -> Elektron ortaklaşması ile KOVALENT BAĞ oluşur."
      ],
      "finalAnswer": "NaCl: İyonik Bağ, H2O: Kovalent Bağ"
    },
    "audioNarration": "Kimyasal bağlar atomların kararlı soygaz düzenine ulaşma arzusudur. Ya elektron alıp verirler ya da ortaklaşa kullanırlar."
  },

  'topic_biyoloji_compounds': {
    "topicId": "topic_biyoloji_compounds",
    "subjectId": "subj_biyoloji",
    "unit": "Ünite 1: Yaşam Bilimi Biyoloji",
    "title": "Canlıların Temel Bileşikleri (İnorganik ve Organik Maddeler)",
    "outcome": "BIY.9.1.2. Canlıların yapısını oluşturan organik ve inorganik bileşikleri açıklar.",
    "summary": "İnorganik bileşikler (su, mineraller, asitler, bazlar) canlılar tarafından üretilemez, dışarıdan hazır alınır. Organik bileşikler (karbonhidratlar, lipidler, proteinler, enzimler, nükleik asitler) karbon ve hidrojen atomlarını bir arada içerir.",
    "keyPoints": [
      "Hücrede ilk enerji kaynağı: Karbonhidratlar",
      "En çok enerji veren ve ısı yalıtımı sağlayan: Yağlar (Lipitler)",
      "Hücrenin ana yapı maddesi ve onarıcı: Proteinler",
      "Biyolojik katalizörler: Enzimler"
    ],
    "formulasOrRules": [
      {
        "title": "Enerji Kullanım Sırası",
        "content": "1. Karbonhidrat -> 2. Yağ -> 3. Protein"
      }
    ],
    "workedExample": {
      "question": "Vücudumuzda enerji elde etmek için sırasıyla hangi organik bileşikler kullanılır?",
      "solutionSteps": [
        "1. Adım: İlk olarak kolay yıkılan Karbonhidratlar yakılır.",
        "2. Adım: İkinci olarak zengin enerjili Yağlar devreye girer.",
        "3. Adım: En son çare olarak yapı taşı olan Proteinler kullanılır."
      ],
      "finalAnswer": "Karbonhidrat -> Yağ -> Protein"
    },
    "audioNarration": "Biyolojide temel organik moleküller karbonhidrat, yağ ve proteindir. Hücrelerimiz hızlı enerji için karbonhidratı, uzun vadeli depo için yağı, yapı için proteini tercih eder."
  },

  'topic_biyoloji_cell': {
    "topicId": "topic_biyoloji_cell",
    "subjectId": "subj_biyoloji",
    "unit": "Ünite 2: Hücre",
    "title": "Hücre Teorisi, Prokaryot/Ökaryot Hücre ve Organeller",
    "outcome": "BIY.9.2.1. Hücre organellerinin yapı ve görevlerini açıklar.",
    "summary": "Çekirdeği ve zarlı organeli olmayan ilkel hücrelere Prokaryot (bakteriler), zarla çevrili çekirdeği ve zarlı organelleri olan hücrelere Ökaryot (bitki, hayvan, mantar) denir. Mitokondri enerji (ATP) üretir, ribozom protein sentezler, kloroplast fotosentez yapar.",
    "keyPoints": [
      "Tüm canlı hücrelerde ortak olan: Ribozom, Hücre Zarı, Sitoplazma, DNA/RNA.",
      "Mitokondri: Hücresel solunum ve ATP santrali.",
      "Kloroplast: Bitkilerde fotosentez merkezi."
    ],
    "formulasOrRules": [
      {
        "title": "Organel Görevleri",
        "content": "Mitokondri=ATP, Ribozom=Protein, Kloroplast=Glikoz"
      }
    ],
    "workedExample": {
      "question": "Hücrede protein sentezinden sorumlu zarsız organel hangisidir?",
      "solutionSteps": [
        "Tüm canlı hücrelerde ortak bulunan ve protein sentezleyen zarsız organel Ribozom'dur."
      ],
      "finalAnswer": "Ribozom"
    },
    "audioNarration": "Hücre canlılığın temel yapı birimidir. Ökaryot hücrelerde iş bölümü organeller aracılığıyla kusursuz bir uyumla gerçekleşir."
  },

  'topic_tarih_ancient': {
    "topicId": "topic_tarih_ancient",
    "subjectId": "subj_tarih",
    "unit": "Ünite 2: İnsanlığın İlk Dönemleri",
    "title": "İlk Çağ Uygarlıkları (Mezopotamya, Anadolu, Mısır)",
    "outcome": "TAR.9.2.1. İlk Çağ uygarlıklarının insanlık mirasına katkılarını değerlendirir.",
    "summary": "Sümerler yazıyı (çivi yazısı) bularak Tarih Çağlarını başlatmıştır. Hititler tarihin ilk yazılı barış antlaşması olan Kadeş Antlaşmasını imzalamıştır. Lidyalılar parayı bulmuş, İyonyalılar felsefe ve bilimin temelini atmıştır.",
    "keyPoints": [
      "Tarih Sümerlerin yazıyı bulmasıyla başlar (M.Ö. 3200).",
      "Hititler: Pankuş meclisi ve Anal (tarafsız yıllıklar).",
      "Mısır: Nil nehri taşkınları sayesinde geometri ve Güneş takvimi gelişmiştir."
    ],
    "formulasOrRules": [
      {
        "title": "Tarihi Dönüm Noktası",
        "content": "Yazının İcadı = Tarih Öncesi Çağların Sonu, Tarih Çağlarının Başlangıcı"
      }
    ],
    "workedExample": {
      "question": "Tarihte parayı ilk bularak takas usulüne son veren Anadolu uygarlığı hangisidir?",
      "solutionSteps": [
        "Kral Yolu üzerinde ticaret yapan ve parayı icat eden uygarlık Lidyalılar'dır."
      ],
      "finalAnswer": "Lidyalılar"
    },
    "audioNarration": "İlk Çağda insanlık yazıyı, parayı ve takvimi geliştirerek bugünkü modern medeniyetin temellerini atmıştır."
  },

  'topic_tarih_turks': {
    "topicId": "topic_tarih_turks",
    "subjectId": "subj_tarih",
    "unit": "Ünite 3: İlk ve Orta Çağlarda Türk Dünyası",
    "title": "Orta Asya İlk Türk Devletleri (Asya Hun, Kök Türk, Uygurlar)",
    "outcome": "TAR.9.3.1. İlk Türk devletlerinin siyasi ve kültürel yapısını kavrar.",
    "summary": "Orta Asya'da kurulan ilk Türk devleti Asya Hun Devleti'dir (Mete Han, Onlu Teşkilat). Türk adını ilk kez resmi devlet adı olarak kullanan Kök Türklerdir (Orhun Abideleri). Uygurlar ise yerleşik hayata geçen ilk Türk devletidir.",
    "keyPoints": [
      "Mete Han: Düzenli ordunun ve Onlu Teşkilatın kurucusu.",
      "Orhun Yazıtları (Kök Türkler): Türk tarihinin ilk Türkçe yazılı belgeleri.",
      "Uygurlar: Maniheizm dinini kabul edip tarım ve mimariyle yerleşik hayata geçtiler."
    ],
    "formulasOrRules": [
      {
        "title": "Devlet Özellikleri",
        "content": "Asya Hun=Teşkilat, Kök Türk=Yazı, Uygur=Yerleşik Hayat"
      }
    ],
    "workedExample": {
      "question": "Türk adıyla kurulan ilk devlet ve diktikleri ilk Türkçe yazılı anıtlar hangisidir?",
      "solutionSteps": [
        "Devlet: Kök Türk Devleti. Anıtlar: Bilge Kağan, Kül Tigin ve Tonyukuk adına dikilen Orhun Yazıtları."
      ],
      "finalAnswer": "Kök Türk Devleti ve Orhun Yazıtları"
    },
    "audioNarration": "İlk Türk devletleri atlı göçebe kültürünün getirdiği yüksek askeri disiplin ve bağımsızlık tutkusu ile tarihe damga vurmuştur."
  },

  'topic_cografya_nature': {
    "topicId": "topic_cografya_nature",
    "subjectId": "subj_cografya",
    "unit": "Ünite 1: Doğa ve İnsan",
    "title": "Coğrafyanın Konusu, Bölümleri ve İnsan-Doğa Etkileşimi",
    "outcome": "COG.9.1.1. Coğrafya biliminin alt dallarını ve doğal sistemleri açıklar.",
    "summary": "Coğrafya, doğal ortam ile insan arasındaki karşılıklı etkileşimi dağılış, nedensellik ve karşılıklı ilgi prensipleriyle inceleyen bilimdir. Dört temel doğal ortam (Muhteşem Dörtlü): Atmosfer (Hava küre), Litosfer (Taş küre), Hidrosfer (Su küre), Biyosfer (Canlılar küresi).",
    "keyPoints": [
      "Fiziki Coğrafya: Jeomorfoloji (yer şekilleri), Klimatoloji (iklim), Hidrografya (sular).",
      "Beşeri Coğrafya: Nüfus, yerleşme, tarım, sanayi, ulaşım.",
      "Coğrafyanın en temel ilkesi Dağılış İlkesidir (Harita kullanımı)."
    ],
    "formulasOrRules": [
      {
        "title": "Muhteşem Dörtlü",
        "content": "Atmosfer + Litosfer + Hidrosfer = Biyosfer"
      }
    ],
    "workedExample": {
      "question": "İklim tiplerini ve hava olaylarını inceleyen fiziki coğrafya alt dalı hangisidir?",
      "solutionSteps": [
        "İklim bilimi anlamına gelen ve atmosfer olaylarını inceleyen dal Klimatoloji'dir."
      ],
      "finalAnswer": "Klimatoloji"
    },
    "audioNarration": "Coğrafya sadece yer isimlerini ezberlemek değildir; insanın yeryüzüyle kurduğu uyumun ve yaşam mücadelesinin bilimidir."
  },

  'topic_cografya_earth': {
    "topicId": "topic_cografya_earth",
    "subjectId": "subj_cografya",
    "unit": "Ünite 1: Doğa ve İnsan",
    "title": "Dünya'nın Şekli (Geoit) ve Hareketlerinin Sonuçları",
    "outcome": "COG.9.1.2. Dünyanın şekli ve hareketlerinin coğrafi sonuçlarını analiz eder.",
    "summary": "Dünya kutuplardan basık, ekvatordan şişkin kendine has GEOİT şekle sahiptir. Kendi ekseni etrafında dönmesiyle (Günlük Hareket) gece-gündüz oluşur ve yerel saat farkları doğar. Güneş etrafında dönmesi ve eksen eğikliği (23° 27') ile Mevsimler oluşur.",
    "keyPoints": [
      "Geoit şeklin sonucu: Ekvatorda yerçekimi az, kutuplarda fazladır.",
      "Günlük hareketin sonucu: Gece-gündüz ardalanması ve Coriolis (sapma) kuvveti.",
      "Yıllık hareket + Eksen Eğikliği: Mevsimlerin oluşumu ve gece-gündüz süre değişimi."
    ],
    "formulasOrRules": [
      {
        "title": "Eksen Eğikliği",
        "content": "23° 27' eğiklik = Mevsimler ve Dönenceler"
      }
    ],
    "workedExample": {
      "question": "Mevsimlerin oluşmasının iki temel sebebi nedir?",
      "solutionSteps": [
        "1. Sebep: Dünya'nın Güneş etrafındaki yıllık hareketi (elips yörünge).",
        "2. Sebep: 23 derece 27 dakikalık eksen eğikliği."
      ],
      "finalAnswer": "Yıllık Hareket ve Eksen Eğikliği"
    },
    "audioNarration": "Dünyamızın hafif eğik duruşu hayatın kaynağıdır; bu eğiklik sayesinde mevsimler döner ve yeryüzü zengin bir iklim çeşitliliğine kavuşur."
  },

  'topic_eng_theme2': {
    "topicId": "topic_eng_theme2",
    "subjectId": "subj_eng",
    "unit": "Theme 2: My Environment",
    "title": "Talking about Locations, Prepositions of Place & There is / There are",
    "outcome": "ENG.9.2.1. Describes neighbourhoods, rooms and locations using prepositions of place.",
    "summary": "In this theme, we learn how to describe our house, neighbourhood, and environment. We use There is (singular) and There are (plural), alongside prepositions of place: in, on, under, next to, between, opposite, behind.",
    "keyPoints": [
      "There is + a/an + singular noun (There is a library next to the park).",
      "There are + plural noun (There are three bedrooms in our flat).",
      "Asking directions: Excuse me, where is the pharmacy? It is opposite the school."
    ],
    "formulasOrRules": [
      {
        "title": "There is / There are",
        "content": "There is a + Tekil isim | There are + Çoğul isim"
      }
    ],
    "workedExample": {
      "question": "Complete the sentence: \"_____ two supermarkets on my street.\"",
      "solutionSteps": [
        "Two supermarkets is plural, so we use \"There are\"."
      ],
      "finalAnswer": "There are"
    },
    "audioNarration": "In Theme 2, we describe our living environment and give directions using There is, There are and prepositions of place."
  },

  'topic_eng_theme4': {
    "topicId": "topic_eng_theme4",
    "subjectId": "subj_eng",
    "unit": "Theme 4: Human in Nature",
    "title": "Present Continuous Tense & Describing Natural Disasters",
    "outcome": "ENG.9.4.1. Expresses ongoing actions in nature and discusses environmental issues.",
    "summary": "We use the Present Continuous Tense (am/is/are + verb-ing) to describe actions happening right now at the moment of speaking, and to talk about changing natural events and weather conditions.",
    "keyPoints": [
      "Subject + am/is/are + Verb(-ing): He is climbing a mountain.",
      "Time expressions: now, right now, at the moment, currently.",
      "Environmental vocabulary: global warming, deforestation, drought, flood."
    ],
    "formulasOrRules": [
      {
        "title": "Şimdiki Zaman Formülü",
        "content": "am/is/are + V-ing (She is studying now)"
      }
    ],
    "workedExample": {
      "question": "Make a sentence with Look! It rain heavily at the moment.",
      "solutionSteps": [
        "At the moment indicates Present Continuous, subject is \"It\", so we write: It is raining."
      ],
      "finalAnswer": "It is raining"
    },
    "audioNarration": "Theme 4 explores our relationship with nature. We use the present continuous tense to talk about what is happening around us right now."
  },

  'topic_eng_theme5': {
    "topicId": "topic_eng_theme5",
    "subjectId": "subj_eng",
    "unit": "Theme 5: Inspiring People",
    "title": "Simple Past Tense (was/were & Regular/Irregular Verbs)",
    "outcome": "ENG.9.5.1. Narrates past biographies of inspirational historical figures.",
    "summary": "In this theme, we learn how to talk about past achievements, historical scientists, and inventors using the Simple Past Tense. Regular verbs take -ed, while irregular verbs change form (go -> went, have -> had).",
    "keyPoints": [
      "To be in the past: I/He/She/It was, We/You/They were.",
      "Regular: invent -> invented, discover -> discovered.",
      "Irregular: see -> saw, write -> wrote, make -> made.",
      "Questions and negatives use did: Did he win the Nobel prize? He didn't give up."
    ],
    "formulasOrRules": [
      {
        "title": "Geçmiş Zaman Kuralı",
        "content": "Olumlu: V2 | Olumsuz: didn't + V1 | Soru: Did + özne + V1"
      }
    ],
    "workedExample": {
      "question": "Change into past tense: Marie Curie win two Nobel Prizes.",
      "solutionSteps": [
        "The past form (V2) of \"win\" is irregular: \"won\"."
      ],
      "finalAnswer": "Marie Curie won two Nobel Prizes."
    },
    "audioNarration": "Theme 5 celebrates inspirational figures like Aziz Sancar and Nikola Tesla. We use the simple past tense to describe their lives and discoveries."
  },

  'topic_eng_theme6': {
    "topicId": "topic_eng_theme6",
    "subjectId": "subj_eng",
    "unit": "Theme 6: Bridging Cultures",
    "title": "Future Plans: Be Going To vs. Will & Expressing Intentions",
    "outcome": "ENG.9.6.1. Expresses future plans, cultural exchanges and predictions.",
    "summary": "We use \"be going to\" for planned and decided future intentions, and \"will\" for sudden decisions, promises and predictions based on beliefs.",
    "keyPoints": [
      "Be going to: I am going to visit Japan next summer (Plan made).",
      "Will: The phone is ringing, I will answer it (Instant decision).",
      "Cultural vocabulary: heritage, traditional festival, cuisine, custom."
    ],
    "formulasOrRules": [
      {
        "title": "Gelecek Zaman",
        "content": "Planlı: be going to + V1 | Anlık/Tahmin: will + V1"
      }
    ],
    "workedExample": {
      "question": "Choose the correct form: Look at those black clouds! It is going to rain.",
      "solutionSteps": [
        "There is strong visible evidence (black clouds), so we use \"is going to rain\"."
      ],
      "finalAnswer": "is going to rain"
    },
    "audioNarration": "Theme 6 bridges world cultures. Learn how to plan cultural journeys and express your future intentions in fluent English."
  },

  'topic_din_worship': {
    "topicId": "topic_din_worship",
    "subjectId": "subj_din",
    "unit": "Ünite 2: İslam ve İbadet",
    "title": "İslam'da İbadetin Amacı ve Temel İlkeleri",
    "outcome": "DIN.9.2.1. İslam'da ibadetlerin anlamını, hedefini ve temel ilkelerini açıklar.",
    "summary": "İslam'da ibadet, Allah'a olan sevgi, saygı ve şükrü eyleme dönüştürmektir. İbadetlerin temel ilkeleri: İhlas (samimiyet ve yalnızca Allah rızası için yapılması) ve Sünnete uygunluktur.",
    "keyPoints": [
      "İhlas: Gösterişten (riya) uzak, sadece Allah rızasını gözetmek.",
      "İbadet türleri: Bedenî (Namaz, Oruç), Malî (Zekât), Hem bedenî hem malî (Hac).",
      "İbadetler kişiyi kötülüklerden alıkoyar ve ahlakı güzelleştirir."
    ],
    "formulasOrRules": [
      {
        "title": "İbadetin İki Şartı",
        "content": "1. İhlas (Allah Rızası) + 2. Sünnete Uygunluk"
      }
    ],
    "workedExample": {
      "question": "Yalnızca mal ile yapılan temel İslam ibadeti hangisidir?",
      "solutionSteps": [
        "Zenginlik ölçüsüne (nisap) ulaşan Müslümanların yerine getirdiği malî ibadet Zekât'tır."
      ],
      "finalAnswer": "Zekât"
    },
    "audioNarration": "Din kültürü ve ahlak bilgisi dersinde ibadetler, insanın yaratıcısıyla kurduğu samimi ve manevi bağın en güzel ifadesidir."
  },

  'topic_saglik_traffic': {
    "topicId": "topic_saglik_traffic",
    "subjectId": "subj_saglik",
    "unit": "Ünite 2: Trafik Kültürü ve İlkyardım",
    "title": "Trafik Güvenliği, Emniyet Kemeri ve Temel İlkyardım İlkeleri",
    "outcome": "SAG.9.2.1. Trafik güvenliği kurallarını ve temel ilkyardım basamaklarını (KBK) açıklar.",
    "summary": "Trafik kazalarında can kaybını ve ağır yaralanmaları önleyen en önemli pasif güvenlik donanımı emniyet kemeridir. Olay yerinde ilkyardımın temel basamakları: Koruma, Bildirme (112 Acil Çağrı), Kurtarma (KBK) zinciridir.",
    "keyPoints": [
      "Koruma: Olay yerinde önce kendi ve çevre güvenliğini sağla.",
      "Bildirme: 112 Acil Çağrı merkezine sakin, net adres bilgisi ver.",
      "Kurtarma: Bilinci ve solunumu (Bak-Dinle-Hisset) kontrol et, temel yaşam desteği sağla."
    ],
    "formulasOrRules": [
      {
        "title": "İlkyardım Zinciri",
        "content": "Koruma -> Bildirme (112) -> Kurtarma"
      }
    ],
    "workedExample": {
      "question": "Bir kaza anında ilk yapılması gereken ve can güvenliğini sağlayan ilk adım nedir?",
      "solutionSteps": [
        "Kaza yerinde yeni bir kazayı önlemek ve emniyeti sağlamak için ilk adım KORUMA'dır."
      ],
      "finalAnswer": "Koruma"
    },
    "audioNarration": "Sağlık bilgisi ve trafik kültüründe emniyet kemeri hayat kurtarır. İlkyardımda ise önce kendi güvenliğinizi korumak temel kuraldır."
  },

  'topic_almanca_school': {
    "topicId": "topic_almanca_school",
    "subjectId": "subj_almanca",
    "unit": "Modul 2: Meine Schule",
    "title": "Schulsachen (Okul Eşyaları) & Artikel (der, die, das)",
    "outcome": "ALM.9.2.1. Okul araç gereçlerini artikelleriyle söyler ve tanıtır.",
    "summary": "Almancada her ismin bir cinsiyeti (artikeli) vardır: der (eril), die (dişil), das (nötr). Okul eşyaları: der Kuli (tükenmez kalem), das Buch (kitap), die Schultasche (okul çantası). Çoğul artikeli her zaman \"die\"dir.",
    "keyPoints": [
      "der Bleistift (kurşun kalem) - Eril",
      "die Schere (makas) - Dişil",
      "das Lineal (cetvel) - Nötr",
      "Belirsiz artikel: ein (der/das için), eine (die için)"
    ],
    "formulasOrRules": [
      {
        "title": "Artikel Tablosu",
        "content": "Eril: der (ein) | Dişil: die (eine) | Nötr: das (ein)"
      }
    ],
    "workedExample": {
      "question": "das Buch (kitap) sözcüğünün belirsiz (ein/eine) kullanımı nasıldır?",
      "solutionSteps": [
        "das artikeline sahip nötr isimlerin belirsiz artikeli \"ein\"dir -> ein Buch."
      ],
      "finalAnswer": "ein Buch"
    },
    "audioNarration": "Almanca öğrenirken kelimeleri mutlaka artikelleriyle birlikte ezberlemelisiniz. Der, die ve das kelimenin ayrılmaz parçasıdır."
  },

  'topic_bilisim_cyber': {
    "topicId": "topic_bilisim_cyber",
    "subjectId": "subj_bilisim",
    "unit": "Ünite 2: Dijital Güvenlik ve Etik",
    "title": "Güçlü Parola, Siber Zorbalık ve Dijital Ayak İzi",
    "outcome": "BTY.9.2.1. Bilişim teknolojilerini güvenli, etik ve sorumlu şekilde kullanır.",
    "summary": "İnternette yaptığımız her arama, paylaştığımız her fotoğraf silinmeyen bir dijital ayak izi bırakır. Güvenliğimiz için güçlü parola oluşturulmalı (en az 8 karakter, büyük/küçük harf, rakam, özel sembol), iki adımlı doğrulama (2FA) açılmalı ve siber zorbalığa karşı bilinçli olunmalıdır.",
    "keyPoints": [
      "Güçlü parola: Tahmin edilemez, ad/doğum tarihi içermez, özel karakter barındırır.",
      "Oltalama (Phishing): Sahte e-posta veya linklerle şifre çalma tuzağı.",
      "Dijital ayak izi: İnternette geride bıraktığımız kalıcı izler."
    ],
    "formulasOrRules": [
      {
        "title": "Güçlü Parola Kuralı",
        "content": "Büyük Harf + Küçük Harf + Rakam + Sembol (!?#*) >= 8 Karakter"
      }
    ],
    "workedExample": {
      "question": "Aşağıdakilerden hangisi en güvenli parola örneğidir: 123456 mı, Deniz2026 mı, Tr!m9#kL mi?",
      "solutionSteps": [
        "Tr!m9#kL; büyük harf, küçük harf, özel karakter ve rakam içerdiği için en güçlü paroladır."
      ],
      "finalAnswer": "Tr!m9#kL"
    },
    "audioNarration": "Bilişim güvenliğinde en zayıf halka insan faktörüdür. Güçlü parolalar kullanın ve şüpheli linklere asla tıklamayın."
  },

};
