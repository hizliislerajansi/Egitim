import { NormalizedContent, ValidationResult, VerificationTier, VerificationMethod } from './types';
import { MathValidator } from '../mathValidator';

export class ContentValidator {
  /**
   * Risk seviyesini ve içerik doğrulamasını belirler
   */
  public static validateContent(content: NormalizedContent): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let method: VerificationMethod = content.verificationMethod;
    let tier: VerificationTier = 'low_risk';
    let confidence = content.confidence;

    // 1. Temel Yapısal Doğrulama
    if (!content.title || content.title.length < 2) {
      errors.push('İçerik başlığı geçersiz veya çok kısa.');
    }
    if (!content.content || content.content.length < 5) {
      errors.push('İçerik gövdesi boş veya yetersiz.');
    }
    if (!content.attribution) {
      warnings.push('Kaynak atıf bilgisi eksik.');
    }

    // 2. Ders Bazında Alan Doğrulamaları
    switch (content.subject) {
      case 'math': {
        tier = 'medium_risk';
        if (content.contentType === 'math_solution' && content.answer) {
          // Deterministik kontrol
          const cleanAnswer = content.answer.replace(/[^0-9\-\+\/\.\,\=]/g, '').trim();
          if (!cleanAnswer && !content.answer.includes('x')) {
            warnings.push('Matematik cevabı sayısal veya sembolik doğrulanamadı.');
          } else {
            method = 'deterministic_math';
            confidence = 0.98;
          }
        }
        break;
      }

      case 'science': {
        if (content.contentType === 'element' && content.metadata?.atomic_number) {
          const num = Number(content.metadata.atomic_number);
          if (isNaN(num) || num < 1 || num > 118) {
            errors.push(`Geçersiz atom numarası: ${num}. 1 ile 118 arasında olmalıdır.`);
          } else {
            method = 'deterministic_math';
          }
        }
        if (content.contentType === 'compound' && content.metadata?.molecular_formula) {
          const formula = String(content.metadata.molecular_formula);
          if (!/^[A-Za-z0-9\(\)\[\]\.\+\-]+$/.test(formula)) {
            warnings.push(`Olağan dışı kimyasal formül yapısı: ${formula}`);
          }
        }
        break;
      }

      case 'geography': {
        if (content.metadata?.coordinates) {
          const [lat, lng] = content.metadata.coordinates;
          if (typeof lat === 'number' && typeof lng === 'number') {
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              errors.push(`Geçersiz coğrafi koordinatlar: lat ${lat}, lng ${lng}`);
            }
          }
        }
        break;
      }

      case 'history': {
        tier = 'medium_risk';
        if (content.metadata?.year) {
          const year = Number(content.metadata.year);
          if (isNaN(year) || year > new Date().getFullYear()) {
            warnings.push(`Tarihsel yıl bilgisi mantık sınırları dışında: ${year}`);
          }
        }
        break;
      }

      case 'english': {
        if (content.cefrLevel && !['A1', 'A2', 'B1', 'B2'].includes(content.cefrLevel)) {
          warnings.push(`Tanımsız CEFR seviyesi: ${content.cefrLevel}`);
        }
        break;
      }
    }

    const isValid = errors.length === 0;
    return {
      isValid,
      tier,
      confidence: isValid ? confidence : Math.min(confidence, 0.4),
      method,
      errors,
      warnings,
      crossReferenceMatch: isValid && warnings.length === 0
    };
  }

  /**
   * Öğrencinin verdiği cevabın doğruluğunu bağımsız yöntemle denetler
   */
  public static verifyStudentAnswer(
    questionText: string,
    studentAnswer: string,
    expectedAnswer: string,
    subject: string
  ): { isCorrect: boolean; feedback: string; explanation: string } {
    const sNorm = studentAnswer.trim().toLowerCase();
    const eNorm = expectedAnswer.trim().toLowerCase();

    // 1. Doğrudan Eşleşme
    if (sNorm === eNorm) {
      return {
        isCorrect: true,
        feedback: 'Tebrikler! Doğru cevap.',
        explanation: `Seçtiğin "${studentAnswer}" cevabı beklenen çözümle tam uyuşmaktadır.`
      };
    }

    // 2. Matematiksel Eşitlik Kontrolü
    if (subject === 'math') {
      const mathCheck = MathValidator.validateAnswer(studentAnswer, expectedAnswer);
      if (mathCheck.isCorrect) {
        return {
          isCorrect: true,
          feedback: 'Doğru! Matematiksel denk çözüm.',
          explanation: mathCheck.feedback || 'Matematiksel çözüm doğrulandı.'
        };
      }
    }

    // 3. Yanlış Cevap
    return {
      isCorrect: false,
      feedback: 'Cevap beklenen çözümle uyuşmadı.',
      explanation: `Doğru cevap "${expectedAnswer}" olmalıdır.`
    };
  }
}
