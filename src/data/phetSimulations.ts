export interface PhetSimulation {
  id: string;
  title: string;
  subject: 'math' | 'physics' | 'chemistry' | 'biology';
  subjectTitle: string;
  topic: string;
  mebCode: string;
  embedUrl: string;
  webUrl: string;
  shortDesc: string;
  variables: string[];
  experimentGoals: string[];
  license: string;
  attribution: string;
}

export const PHET_SIMULATIONS: PhetSimulation[] = [
  // 1. Fizik: Hooke Yasası (Yay Sabiti ve Kuvvet)
  {
    id: 'phet_hookes_law',
    title: 'Hooke Yasası (Yaylar ve Kuvvet)',
    subject: 'physics',
    subjectTitle: 'Fizik (9. Sınıf)',
    topic: 'Kuvvet ve Hareket / Esneklik Potansiyel Enerjisi',
    mebCode: 'FIZ-09.03',
    embedUrl: 'https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law_all.html',
    webUrl: 'https://phet.colorado.edu/tr/simulations/hookes-law',
    shortDesc: 'Uygulanan kuvvet ile yayın uzama miktarı arasındaki doğru orantıyı (F = -k·x) interaktif olarak keşfedin.',
    variables: ['Yay Sabiti (k, N/m)', 'Uygulanan Kuvvet (F, N)', 'Uzama Miktarı (x, m)'],
    experimentGoals: [
      'Kuvvet arttıkça uzama miktarının doğrusal arttığını gözlemleme.',
      'Farklı yay sabitlerine (sert ve yumuşak yaylar) sahip sistemleri karşılaştırma.',
      'Seri ve paralel bağlı yaylardaki eşdeğer yay sabitini hesaplama.'
    ],
    license: 'CC-BY 4.0',
    attribution: 'PhET Interactive Simulations, University of Colorado Boulder (https://phet.colorado.edu)'
  },

  // 2. Fizik: Ohm Yasası (Direnç, Gerilim, Akım)
  {
    id: 'phet_ohms_law',
    title: 'Ohm Yasası (V = I · R)',
    subject: 'physics',
    subjectTitle: 'Fizik (9. Sınıf)',
    topic: 'Elektrik ve Manyetizma',
    mebCode: 'FIZ-09.05',
    embedUrl: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html',
    webUrl: 'https://phet.colorado.edu/tr/simulations/ohms-law',
    shortDesc: 'Bir iletkenin uçları arasındaki gerilim (V), geçen akım (I) ve iletkenin direnci (R) arasındaki temel ilişkiyi gözlemleyin.',
    variables: ['Gerilim (Voltaj, V)', 'Direnç (Ohm, Ω)', 'Akım Şiddeti (Amper, A)'],
    experimentGoals: [
      'Sabit dirençte voltaj arttıkça akımın nasıl değiştiğini inceleme.',
      'Direnç arttırıldığında akımdaki düşüşü gözlemleme.',
      'Grafikte eğimin dirence eşit olduğunu doğrulama.'
    ],
    license: 'CC-BY 4.0',
    attribution: 'PhET Interactive Simulations, University of Colorado Boulder (https://phet.colorado.edu)'
  },

  // 3. Fizik: Kuvvetler ve Hareket (Newton Hareket Yasaları)
  {
    id: 'phet_forces_motion',
    title: 'Kuvvetler ve Hareket: Temel Kavramlar',
    subject: 'physics',
    subjectTitle: 'Fizik (9. Sınıf)',
    topic: 'Dinamik ve Sürtünme Kuvveti',
    mebCode: 'FIZ-09.02',
    embedUrl: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html',
    webUrl: 'https://phet.colorado.edu/tr/simulations/forces-and-motion-basics',
    shortDesc: 'Net kuvvet, ivme, kütle ve sürtünme arasındaki bağıntıyı simüle edin (Fnet = m · a).',
    variables: ['Uygulanan İtme Kuvveti (N)', 'Kütle (kg)', 'Sürtünme Katsayısı', 'Hız (m/s)'],
    experimentGoals: [
      'Net kuvvet sıfır olduğunda cismin sabit hızla hareketini (eylemsizlik) test etme.',
      'Sürtünmeli ve sürtünmesiz yüzeylerde ivmelenmeyi karşılaştırma.'
    ],
    license: 'CC-BY 4.0',
    attribution: 'PhET Interactive Simulations, University of Colorado Boulder'
  },

  // 4. Kimya: Atom Oluşturma (Proton, Nötron, Elektron)
  {
    id: 'phet_build_atom',
    title: 'Atom Oluşturma (Build an Atom)',
    subject: 'chemistry',
    subjectTitle: 'Kimya (9. Sınıf)',
    topic: 'Atomun Yapısı ve Periyodik Sistem',
    mebCode: 'KIM-09.01',
    embedUrl: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html',
    webUrl: 'https://phet.colorado.edu/tr/simulations/build-an-atom',
    shortDesc: 'Çekirdeğe proton ve nötron, katmanlara elektron ekleyerek izotopları, iyon yükünü ve element türünü keşfedin.',
    variables: ['Proton Sayısı (Atom Numarası)', 'Nötron Sayısı', 'Elektron Sayısı (İyon Yükü)'],
    experimentGoals: [
      'Proton sayısının elementin kimliğini belirlediğini keşfetme.',
      'Kütle numarasının proton + nötron toplamına eşit olduğunu doğrulama.',
      'Katyon, anyon ve nötr atom dengesini oluşturma.'
    ],
    license: 'CC-BY 4.0',
    attribution: 'PhET Interactive Simulations, University of Colorado Boulder'
  },

  // 5. Kimya: pH Ölçeği (Asitler ve Bazlar)
  {
    id: 'phet_ph_scale',
    title: 'pH Ölçeği ve Çözeltiler',
    subject: 'chemistry',
    subjectTitle: 'Kimya (9. Sınıf)',
    topic: 'Kimyasal Türler ve Sulu Çözeltiler',
    mebCode: 'KIM-09.03',
    embedUrl: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_all.html',
    webUrl: 'https://phet.colorado.edu/tr/simulations/ph-scale',
    shortDesc: 'Kahve, süt, su, sabun ve asit çözeltilerinin pH değerini, seyreltme etkilerini ve iyon derişimini ölçün.',
    variables: ['Çözelti Türü', 'Su Hacmi (Seyreltme)', 'H3O+ / OH- Derişimi'],
    experimentGoals: [
      'Nötr (pH 7), asidik (pH < 7) ve bazik (pH > 7) çözeltileri ayırt etme.',
      'Su ilave ederek derişim ve pH değişimini gözlemleme.'
    ],
    license: 'CC-BY 4.0',
    attribution: 'PhET Interactive Simulations, University of Colorado Boulder'
  },

  // 6. Matematik: Doğru Grafikleri (Eğim ve Kesim Noktası)
  {
    id: 'phet_graphing_lines',
    title: 'Doğru Grafikleri (y = mx + b)',
    subject: 'math',
    subjectTitle: 'Matematik (9. Sınıf)',
    topic: 'Fonksiyonlar ve Doğrusal Denklemler',
    mebCode: 'MAT-09.04',
    embedUrl: 'https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines_all.html',
    webUrl: 'https://phet.colorado.edu/tr/simulations/graphing-lines',
    shortDesc: 'Doğrunun eğimini (m) ve y-eksenini kestiği noktayı (b) değiştirerek koordinat düzlemindeki yönelimini inceleyin.',
    variables: ['Eğim (m = Δy/Δx)', 'Y-Eksen Kesim Noktası (b)', 'Nokta Koordinatları (x, y)'],
    experimentGoals: [
      'Pozitif, negatif ve sıfır eğimli doğruların yönünü görselleştirme.',
      'Paralel doğruların eğimlerinin eşit olduğunu doğrulama.'
    ],
    license: 'CC-BY 4.0',
    attribution: 'PhET Interactive Simulations, University of Colorado Boulder'
  },

  // 7. Matematik: Eşitlik Kaşifi (Denklem ve Terazi Dengesi)
  {
    id: 'phet_equality_explorer',
    title: 'Eşitlik Kaşifi (Birinci Dereceden Denklemler)',
    subject: 'math',
    subjectTitle: 'Matematik (9. Sınıf)',
    topic: 'Denklemler ve Eşitsizlikler',
    mebCode: 'MAT-09.02',
    embedUrl: 'https://phet.colorado.edu/sims/html/equality-explorer/latest/equality-explorer_all.html',
    webUrl: 'https://phet.colorado.edu/tr/simulations/equality-explorer',
    shortDesc: 'Eşit kollu terazi modeliyle her iki tarafa aynı işlemi uygulayarak bilinmeyeni (x) yalnız bırakmayı öğrenin.',
    variables: ['Bilinmeyen Değişken (x)', 'Sabit Terimler', 'İki Tarafa Eklenen/Çıkarılan Değerler'],
    experimentGoals: [
      'Eşitliğin her iki tarafına aynı sayıyı ekleme/çıkarmanın dengeyi bozmadığını kavrama.',
      'Denklem çözme mantığını terazi dengesiyle somutlaştırma.'
    ],
    license: 'CC-BY 4.0',
    attribution: 'PhET Interactive Simulations, University of Colorado Boulder'
  },

  // 8. Biyoloji: Doğal Seçilim ve Gen İfadesi
  {
    id: 'phet_natural_selection',
    title: 'Doğal Seçilim ve Popülasyon Genetiği',
    subject: 'biology',
    subjectTitle: 'Biyoloji (9. Sınıf)',
    topic: 'Canlılar Dünyası ve Ekoloji',
    mebCode: 'BIY-09.03',
    embedUrl: 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_all.html',
    webUrl: 'https://phet.colorado.edu/tr/simulations/natural-selection',
    shortDesc: 'Çevre koşulları (avcılar, besin kıtlığı, kürk rengi mutasyonları) altında popülasyon frekans değişimlerini gözlemleyin.',
    variables: ['Baskın/Çekinik Mutasyon', 'Çevre Faktörü (Kurtlar / Besin)', 'İklim (Ekvatoral / Kutup)'],
    experimentGoals: [
      'Kamufle olan bireylerin hayatta kalma şansını test etme.',
      'Genetik çeşitliliğin çevreye uyumdaki rolünü analiz etme.'
    ],
    license: 'CC-BY 4.0',
    attribution: 'PhET Interactive Simulations, University of Colorado Boulder'
  }
];
