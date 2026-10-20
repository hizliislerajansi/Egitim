export interface PrerequisiteNode {
  outcomeCode: string;
  title: string;
  prerequisiteCodes: string[];
  prerequisiteTitles: string[];
  diagnosticQuestions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    diagnosticClue: string;
  }>;
}

export const KNOWLEDGE_GRAPH: Record<string, PrerequisiteNode> = {
  // Matematik: İkinci Dereceden Denklemler
  'MAT-09.02': {
    outcomeCode: 'MAT-09.02',
    title: 'İkinci Dereceden Bir Bilinmeyenli Denklemler',
    prerequisiteCodes: ['MAT-08.01', 'MAT-08.02'],
    prerequisiteTitles: ['Birinci Dereceden Denklemler', 'Özdeşlikler ve Çarpanlara Ayırma'],
    diagnosticQuestions: [
      {
        id: 'diag_mat_01',
        question: '2x + 6 = 14 denkleminde x kaçtır?',
        options: ['2', '4', '6', '8'],
        correctAnswer: '4',
        diagnosticClue: 'Birinci dereceden denklem çözme becerisi eksik; önce terazi mantığıyla sabit terim karşıya atılmalıdır.'
      },
      {
        id: 'diag_mat_02',
        question: 'x² - 9 ifadesinin çarpanlarına ayrılmış hali nedir?',
        options: ['(x - 3)(x + 3)', '(x - 3)²', '(x + 3)²', '(x - 9)(x + 1)'],
        correctAnswer: '(x - 3)(x + 3)',
        diagnosticClue: 'İki kare farkı özdeşliği (a² - b² = (a-b)(a+b)) hatırlanmalıdır.'
      }
    ]
  },

  // Fizik: Dinamik ve Newton Yasaları
  'FIZ-09.02': {
    outcomeCode: 'FIZ-09.02',
    title: 'Kuvvet, İvme ve Newton’un Hareket Yasaları',
    prerequisiteCodes: ['FIZ-09.01', 'MAT-09.01'],
    prerequisiteTitles: ['Vektörler ve Skaler Büyüklükler', 'Oran-Orantı ve Doğru Denklemleri'],
    diagnosticQuestions: [
      {
        id: 'diag_fiz_01',
        question: 'Aşağıdakilerden hangisi vektörel bir büyüklüktür?',
        options: ['Kütle', 'Zaman', 'Kuvvet', 'Sıcaklık'],
        correctAnswer: 'Kuvvet',
        diagnosticClue: 'Vektörel büyüklükler yön ve doğrultu içerir; kuvvet yönlü bir büyüklüktür.'
      }
    ]
  },

  // Kimya: Kimyasal Türler Arası Etkileşimler
  'KIM-09.02': {
    outcomeCode: 'KIM-09.02',
    title: 'Kimyasal Türler Arası Zayıf ve Güçlü Etkileşimler',
    prerequisiteCodes: ['KIM-09.01'],
    prerequisiteTitles: ['Atom Modelleri ve Periyodik Sistem'],
    diagnosticQuestions: [
      {
        id: 'diag_kim_01',
        question: '11Na (Sodyum) elementinin periyot ve grubu nedir?',
        options: ['2. Periyot 1A', '3. Periyot 1A', '3. Periyot 2A', '1. Periyot 1A'],
        correctAnswer: '3. Periyot 1A',
        diagnosticClue: 'Katman elektron dizilimi (2-8-1) kuralı hatırlanmalıdır.'
      }
    ]
  },

  // İngilizce: Karşılaştırma Cümleleri (Comparatives)
  'ENG-09.02': {
    outcomeCode: 'ENG-09.02',
    title: 'Comparatives & Describing Environment',
    prerequisiteCodes: ['ENG-09.01'],
    prerequisiteTitles: ['Basic Adjectives & Present Simple Be'],
    diagnosticQuestions: [
      {
        id: 'diag_eng_01',
        question: 'Which sentence is grammatically correct?',
        options: ['He is more tall than me', 'He is taller than me', 'He is tall than me', 'He is tallest than me'],
        correctAnswer: 'He is taller than me',
        diagnosticClue: 'Tek heceli sıfatlar sonuna "-er + than" alır.'
      }
    ]
  }
};

export class KnowledgeGraphEngine {
  /**
   * Konunun ön koşullarını getirir
   */
  public static getPrerequisites(outcomeCode: string): PrerequisiteNode | null {
    return KNOWLEDGE_GRAPH[outcomeCode] || null;
  }

  /**
   * Öğrenci bir konuda zorlandığında ön koşul tanılama testini döner
   */
  public static getDiagnosticQuestions(outcomeCode: string) {
    const node = this.getPrerequisites(outcomeCode);
    return node ? node.diagnosticQuestions : [];
  }

  /**
   * Tanılama cevabını analiz ederek eksik ön koşul tespitini yapar
   */
  public static analyzeDiagnostic(outcomeCode: string, questionId: string, studentAnswer: string): {
    isPrerequisiteMissing: boolean;
    clue: string;
    recommendedTopic: string;
  } {
    const node = this.getPrerequisites(outcomeCode);
    if (!node) return { isPrerequisiteMissing: false, clue: 'Ön koşul haritası bulunamadı.', recommendedTopic: '' };

    const q = node.diagnosticQuestions.find(item => item.id === questionId);
    if (!q) return { isPrerequisiteMissing: false, clue: 'Tanılama sorusu bulunamadı.', recommendedTopic: '' };

    const isCorrect = q.correctAnswer.toLowerCase() === studentAnswer.trim().toLowerCase();
    return {
      isPrerequisiteMissing: !isCorrect,
      clue: isCorrect ? 'Ön koşul bilgisi sağlam.' : q.diagnosticClue,
      recommendedTopic: isCorrect ? node.title : (node.prerequisiteTitles[0] || 'Temel Kavramlar')
    };
  }
}
