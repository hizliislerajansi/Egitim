export interface GeneratedLessonPlan {
  id: string;
  subjectCode: string;
  subjectName: string;
  themeTitle: string;
  outcomeCode: string;
  targetOutcome: string;
  prerequisites: string[];
  conceptExplanation: string;
  keyFormulas: string[];
  workedExample: {
    problemStatement: string;
    stepByStepSolution: string[];
    finalAnswer: string;
    verificationMethod: string;
  };
  independentPractice: {
    problemStatement: string;
    hint: string;
    correctAnswer: string;
  };
  miniQuiz: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export class LessonGenerator {
  /**
   * Müfredat koduna veya ders konusuna göre eksiksiz 6 bileşenli ders planı üretir
   */
  public static generateLesson(subjectCode: string, themeTitle?: string): GeneratedLessonPlan {
    const sCode = subjectCode.toUpperCase();

    // 1. Matematik Dersi
    if (sCode === 'MATH' || sCode === 'MAT') {
      return {
        id: `lesson_math_${Date.now()}`,
        subjectCode: 'MATH',
        subjectName: 'Matematik (9. Sınıf)',
        themeTitle: themeTitle || 'İkinci Dereceden Bir Bilinmeyenli Denklemler',
        outcomeCode: 'MAT-09.02',
        targetOutcome: 'İkinci dereceden bir bilinmeyenli denklemleri çarpanlara ayırma ve diskriminant yöntemiyle çözer.',
        prerequisites: [
          'Birinci dereceden bir bilinmeyenli denklemler (MAT-08.01)',
          'Özdeşlikler ve iki kare farkı açılımı (MAT-08.02)',
          'Rasyonel sayılarda dört işlem ve karekök hesabı'
        ],
        conceptExplanation: `İkinci dereceden bir bilinmeyenli denklemler genel olarak $ax^2 + bx + c = 0$ ($a \\neq 0$) biçiminde ifade edilir.\n\n` +
          `1. Diskriminant (Delta): $\\Delta = b^2 - 4ac$\n` +
          `- $\\Delta > 0$ ise iki farklı gerçek kök vardır: $x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$\n` +
          `- $\\Delta = 0$ ise çakışık (çift katlı) tek gerçek kök vardır: $x = \\frac{-b}{2a}$\n` +
          `- $\\Delta < 0$ ise gerçek sayılarda kök yoktur (çözüm kümesi $\\emptyset$).`,
        keyFormulas: ['ax^2 + bx + c = 0', '\\Delta = b^2 - 4ac', 'x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}'],
        workedExample: {
          problemStatement: '$x^2 - 5x + 6 = 0$ denkleminin gerçek sayılardaki çözüm kümesini bulunuz.',
          stepByStepSolution: [
            'Adım 1: Katsayıları belirleyelim: a = 1, b = -5, c = 6',
            'Adım 2: Çarpanlara ayırma yöntemiyle inceleyelim: Çarpımları 6, toplamları -5 olan sayılar -2 ve -3’tür.',
            'Adım 3: Denklemi (x - 2)(x - 3) = 0 şeklinde yazabiliriz.',
            'Adım 4: Kökleri eşitleyelim: x - 2 = 0 => x1 = 2; x - 3 = 0 => x2 = 3',
            'Adım 5: Sağlama: x = 2 için 2² - 5(2) + 6 = 4 - 10 + 6 = 0 (Doğrulandı).'
          ],
          finalAnswer: 'Çözüm Kümesi = {2, 3}',
          verificationMethod: 'Deterministik kök yerine koyma ve diskriminant kontrolü'
        },
        independentPractice: {
          problemStatement: '$x^2 - 4x + 4 = 0$ denkleminin köklerini bulunuz.',
          hint: 'Bu bir tam kare açılımıdır: (x - 2)² = 0.',
          correctAnswer: '2'
        },
        miniQuiz: [
          {
            id: 'mq_1',
            question: '$x^2 - 9 = 0$ denkleminin pozitif kökü kaçtır?',
            options: ['1', '3', '6', '9'],
            correctAnswer: '3',
            explanation: 'x² = 9 => x = 3 veya x = -3. Pozitif kök 3’tür.'
          },
          {
            id: 'mq_2',
            question: '$\\Delta < 0$ olduğunda denklemin gerçek kök sayısı kaçtır?',
            options: ['0', '1', '2', 'Sonsuz'],
            correctAnswer: '0',
            explanation: 'Diskriminant sıfırdan küçükse reel sayılarda kök bulunmaz.'
          },
          {
            id: 'mq_3',
            question: '$x^2 - 6x + 9 = 0$ denkleminin diskriminantı (Delta) kaçtır?',
            options: ['0', '4', '9', '36'],
            correctAnswer: '0',
            explanation: 'Δ = (-6)² - 4(1)(9) = 36 - 36 = 0.'
          }
        ]
      };
    }

    // 2. Fizik Dersi
    if (sCode === 'PHYSICS' || sCode === 'FIZIK' || sCode === 'FIZ') {
      return {
        id: `lesson_physics_${Date.now()}`,
        subjectCode: 'PHYSICS',
        subjectName: 'Fizik (9. Sınıf)',
        themeTitle: themeTitle || 'Kuvvet, Kütle ve Newton’un Temel Dinamik Yasası',
        outcomeCode: 'FIZ-09.02',
        targetOutcome: 'Net kuvvet, kütle ve ivme arasındaki matematiksel ilişkiyi modeller (F_net = m · a).',
        prerequisites: ['Vektörler ve bileşke kuvvet', 'Düzgün doğrusal hareket ve ivme tanımı'],
        conceptExplanation: `Bir cisme etki eden net kuvvet sıfırdan farklı ise cisim ivmeli hareket yapar.\n\n` +
          `Temel Dinamik Prensibi: $\\vec{F}_{net} = m \\cdot \\vec{a}$\n` +
          `- $F$: Net kuvvet (Newton, N)\n` +
          `- $m$: Kütle (Kilogram, kg)\n` +
          `- $a$: İvme ($m/s^2$)\n\n` +
          `Sürtünmeli yüzeylerde net kuvvet: $F_{net} = F_{uygulanan} - f_s$ olarak hesaplanır.`,
        keyFormulas: ['F_{net} = m \\cdot a', 'f_s = k \\cdot N', 'W = F \\cdot x'],
        workedExample: {
          problemStatement: 'Sürtünmesiz yatay bir yolda durmakta olan 4 kg kütleli bir cisme 20 N büyüklüğünde yatay bir kuvvet uygulanıyor. Cismin kazanacağı ivme kaç m/s²’dir?',
          stepByStepSolution: [
            'Adım 1: Verilenler: m = 4 kg, F_net = 20 N',
            'Adım 2: Newton’un ikinci yasası formülü: F_net = m · a',
            'Adım 3: İvmeyi yalnız bırakalım: a = F_net / m',
            'Adım 4: Değerleri yerine koyalım: a = 20 N / 4 kg = 5 m/s²'
          ],
          finalAnswer: '5 m/s²',
          verificationMethod: 'Birim ve boyut analizi (N / kg = (kg·m/s²) / kg = m/s²)'
        },
        independentPractice: {
          problemStatement: '2 kg kütleli bir cisme 12 N kuvvet uygulandığında ivmesi ne olur?',
          hint: 'a = F / m formülünü kullanın.',
          correctAnswer: '6'
        },
        miniQuiz: [
          {
            id: 'fiz_q1',
            question: 'Kuvvetin SI birim sistemindeki karşılığı nedir?',
            options: ['Joule', 'Newton', 'Pascal', 'Watt'],
            correctAnswer: 'Newton',
            explanation: 'Kuvvet birimi Newton (N)’dur.'
          },
          {
            id: 'fiz_q2',
            question: 'Net kuvvet sıfır olan bir cisim için hangisi kesinlikle doğrudur?',
            options: ['İvmesi sıfırdır', 'Hızı sürekli artar', 'Dairesel döner', 'Kütlesi azalır'],
            correctAnswer: 'İvmesi sıfırdır',
            explanation: 'F_net = 0 ise cismin ivmesi sıfırdır (Eylemsizlik prensibi).'
          },
          {
            id: 'fiz_q3',
            question: '10 kg kütleli bir cismin ivmesi 3 m/s² ise cisme etki eden net kuvvet kaç N’dur?',
            options: ['13 N', '30 N', '3.3 N', '300 N'],
            correctAnswer: '30 N',
            explanation: 'F = m · a = 10 · 3 = 30 N.'
          }
        ]
      };
    }

    // 3. Varsayılan / İngilizce / Fen Planı
    return {
      id: `lesson_general_${Date.now()}`,
      subjectCode: sCode,
      subjectName: `${subjectCode} (9. Sınıf)`,
      themeTitle: themeTitle || 'Müfredat Ünitesi',
      outcomeCode: `${sCode}-09.01`,
      targetOutcome: 'Konuya ilişkin temel kavramları ve kazanım çıktılarını açıklar.',
      prerequisites: ['Temel kavram ve terim bilgisi'],
      conceptExplanation: `Bu ünite, MEB 9. sınıf standartları çerçevesinde temel prensipleri ve kuralları ele almaktadır.`,
      keyFormulas: ['Kavram Haritası', 'Özet'],
      workedExample: {
        problemStatement: 'Örnek soru ve uygulama adımı.',
        stepByStepSolution: ['Adım 1: Soru kökünü oku.', 'Adım 2: Formülü uygula.', 'Adım 3: Sonucu kontrol et.'],
        finalAnswer: 'Doğru Uygulama',
        verificationMethod: 'Müfredat kontrolü'
      },
      independentPractice: {
        problemStatement: 'Kavramı özetleyen bir cümle kurunuz.',
        hint: 'Anahtar kelimeyi kullanınız.',
        correctAnswer: 'Doğru'
      },
      miniQuiz: [
        {
          id: 'gen_q1',
          question: 'Bu ünitedeki temel hedef nedir?',
          options: ['Kazanımı kavramak', 'Formülü ezberlemek', 'Testi geçmek', 'Boş bırakmak'],
          correctAnswer: 'Kazanımı kavramak',
          explanation: 'Öğrenmede amaç kazanımı içselleştirmektir.'
        }
      ]
    };
  }
}
