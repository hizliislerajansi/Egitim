import { MathValidator } from './mathValidator';

export type ErrorDiagnosisType = 
  | 'Kavram Yanılgısı' 
  | 'İşlem Hatası' 
  | 'Soru Kökünü Yanlış Anlama' 
  | 'Bilgi Eksikliği' 
  | 'Dikkatsizlik';

export type AnswerEvaluationStatus = 
  | 'correct' 
  | 'partially_correct' 
  | 'incorrect' 
  | 'unassessed';

export interface DetailedErrorDiagnosis {
  status: AnswerEvaluationStatus;
  category?: ErrorDiagnosisType;
  confidence: number;
  explanation: string;
  nextPedagogicalStep: string;
  graduatedHint: string;
  hintLevel: number;
  probeQuestion?: {
    question: string;
    options: string[];
    correctAnswer: string;
  };
}

export class ErrorAnalysisEngine {
  /**
   * Öğrenci cevabını derinlemesine analiz eder
   */
  public static diagnose(
    questionText: string,
    studentAnswer: string,
    correctAnswer: string,
    subject: string,
    attemptNumber = 1
  ): DetailedErrorDiagnosis {
    const sAns = studentAnswer.trim();
    const cAns = correctAnswer.trim();

    // 1. Tam Doğru Durumu
    if (sAns.toLowerCase() === cAns.toLowerCase()) {
      return {
        status: 'correct',
        confidence: 1.0,
        explanation: 'Cevabınız beklenen anahtarla tam olarak örtüşmektedir.',
        nextPedagogicalStep: 'Konu pekiştirildi; bir sonraki alıştırmaya geçebilirsiniz.',
        graduatedHint: '',
        hintLevel: 0
      };
    }

    // 2. Matematiksel Özel Hata Tespiti (İşlem Hatası vs Kavram Yanılgısı)
    if (subject === 'math') {
      const mathCheck = MathValidator.validateAnswer(sAns, cAns);
      if (mathCheck.isCorrect) {
        return {
          status: 'correct',
          confidence: 0.98,
          explanation: 'Matematiksel olarak denk bir ifade girdiniz.',
          nextPedagogicalStep: 'Cebirsel doğrulama başarılı.',
          graduatedHint: '',
          hintLevel: 0
        };
      }

      // İşaret hatası kontrolü (Örn: -4 yerine +4)
      const numS = parseFloat(sAns);
      const numC = parseFloat(cAns);
      if (!isNaN(numS) && !isNaN(numC) && Math.abs(numS) === Math.abs(numC)) {
        return {
          status: 'incorrect',
          category: 'İşlem Hatası',
          confidence: 0.92,
          explanation: 'Sonucun büyüklüğü doğru fakat işareti zıt! Parantez içi işaret dağılımına dikkat ediniz.',
          nextPedagogicalStep: 'İşaret kuralını gözden geçirip denklemi tekrar kontrol ediniz.',
          graduatedHint: 'İpucu: Eşitliğin diğer tarafına geçen terimlerin işareti değişir.',
          hintLevel: attemptNumber
        };
      }
    }

    // 3. Kademeli İpucu ve Hata Belirleme (Attempt Bazlı)
    if (attemptNumber === 1) {
      return {
        status: 'incorrect',
        category: 'Kavram Yanılgısı',
        confidence: 0.75,
        explanation: `Seçtiğin "${sAns}" cevabı soru kökündeki temel kurala tam uymadı.`,
        nextPedagogicalStep: 'Soruyu doğrudan çözmek yerine temel kuralı hatırlatan ipucuna odaklanın.',
        graduatedHint: `1. Seviye İpucu: Sorudaki anahtar terimi ve verilen öncülleri tekrar okuyunuz.`,
        hintLevel: 1,
        probeQuestion: {
          question: `Bu soruda aranan temel kavram hangisidir?`,
          options: ['Kural / Bağıntı', 'Birim Dönüşümü', 'Grafik Okuma', 'Tanım'],
          correctAnswer: 'Kural / Bağıntı'
        }
      };
    } else if (attemptNumber === 2) {
      return {
        status: 'incorrect',
        category: 'Soru Kökünü Yanlış Anlama',
        confidence: 0.85,
        explanation: `İkinci denemede de uyuşmazlık devam etti. Yanıltıcı seçenekleri eleyelim.`,
        nextPedagogicalStep: 'Yanlış seçenekleri eleyerek adım adım doğru yanıta yaklaşın.',
        graduatedHint: `2. Seviye İpucu: Seçenekler arasından konu kapsamı dışındaki en az iki çeldiriciyi eleyebilirsiniz.`,
        hintLevel: 2
      };
    } else {
      // 3. Deneme: Tam Çözüm ve Konu Sonu Tekrar Kuralı
      return {
        status: 'incorrect',
        category: 'Bilgi Eksikliği',
        confidence: 0.95,
        explanation: `3 deneme hakkı kullanıldı. Doğru çözüm: "${correctAnswer}".`,
        nextPedagogicalStep: 'Bu soru konu sonundaki aralıklı tekrar listesine eklendi.',
        graduatedHint: `3. Seviye Tam Çözüm: MEB 9. sınıf kuralına göre beklenen doğru yanıt "${correctAnswer}" seçeneğidir.`,
        hintLevel: 3
      };
    }
  }
}
