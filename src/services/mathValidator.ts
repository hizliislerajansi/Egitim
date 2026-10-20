/**
 * Yerel Matematik Doğrulayıcı (Local Math Validator)
 * Basit aritmetik, kesir, tam sayı, mantık ve cebirsel eşitlikleri
 * sunucuya veya AI API'sine ihtiyaç duymadan yerel kodla saniyesinde doğrular.
 */

export interface ValidationResult {
  isValid: boolean;
  normalizedInput: string;
  expectedNormalized: string;
  feedback?: string;
}

export function normalizeMathString(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '') // boşlukları sil
    .replace(/,/g, '.')  // virgüllü ondalığı noktaya çevir (ör. 3,5 -> 3.5)
    .replace(/^x=/, '')  // x=4 -> 4
    .replace(/^\{/, '')  // {4} -> 4
    .replace(/\}$/, '');
}

export function validateMathAnswer(studentAnswer: string, expectedAnswer: string): ValidationResult {
  const normStudent = normalizeMathString(studentAnswer);
  const normExpected = normalizeMathString(expectedAnswer);

  // 1. Doğrudan dize eşleşmesi
  if (normStudent === normExpected) {
    return {
      isValid: true,
      normalizedInput: normStudent,
      expectedNormalized: normExpected,
      feedback: 'Tebrikler! Doğru cevap.'
    };
  }

  // 2. Sayısal değer denkliği kontrolü (ör. 12/4 == 3, 0.5 == 1/2)
  const studentNum = parseFractionOrNumber(normStudent);
  const expectedNum = parseFractionOrNumber(normExpected);

  if (studentNum !== null && expectedNum !== null) {
    if (Math.abs(studentNum - expectedNum) < 1e-6) {
      return {
        isValid: true,
        normalizedInput: normStudent,
        expectedNormalized: normExpected,
        feedback: 'Tebrikler! Sayısal olarak doğru cevap.'
      };
    }
  }

  // 3. Küme veya çoklu kök denkliği (ör. "2, 4" veya "4, 2")
  if (normStudent.includes(';') || normStudent.includes('&')) {
    const studentParts = normStudent.split(/[;&]/).sort();
    const expectedParts = normExpected.split(/[;&]/).sort();
    if (studentParts.join(',') === expectedParts.join(',')) {
      return {
        isValid: true,
        normalizedInput: normStudent,
        expectedNormalized: normExpected,
        feedback: 'Tebrikler! Tüm kökler doğru bulundu.'
      };
    }
  }

  return {
    isValid: false,
    normalizedInput: normStudent,
    expectedNormalized: normExpected,
    feedback: 'Cevabınız uyuşmadı. İpuçlarını inceleyerek tekrar deneyebilirsiniz.'
  };
}

function parseFractionOrNumber(str: string): number | null {
  if (!str) return null;

  // Kesir kontrolü (ör. 3/4 veya -5/2)
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2) {
      const num = strictNumber(parts[0]);
      const den = strictNumber(parts[1]);
      if (num !== null && den !== null && den !== 0) {
        return num / den;
      }
    }
    return null;
  }

  return strictNumber(str);
}

export class MathValidator {
  public static validateAnswer(studentAnswer: string, expectedAnswer: string): { isCorrect: boolean; feedback?: string } {
    const res = validateMathAnswer(studentAnswer, expectedAnswer);
    return { isCorrect: res.isValid, feedback: res.feedback };
  }

  public static normalize(input: string): string {
    return normalizeMathString(input);
  }

  public static solveQuadratic(a: number, b: number, c: number): {
    discriminant: number;
    rootCount: number;
    roots: (number | string)[];
  } {
    const d = b * b - 4 * a * c;
    if (d < 0) {
      return { discriminant: d, rootCount: 0, roots: [] };
    } else if (d === 0) {
      const r = -b / (2 * a);
      return { discriminant: 0, rootCount: 1, roots: [Number(r.toFixed(4))] };
    } else {
      const r1 = (-b + Math.sqrt(d)) / (2 * a);
      const r2 = (-b - Math.sqrt(d)) / (2 * a);
      return {
        discriminant: d,
        rootCount: 2,
        roots: [Number(r1.toFixed(4)), Number(r2.toFixed(4))].sort((x, y) => Number(x) - Number(y))
      };
    }
  }
}

function strictNumber(value:string):number|null {if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value))return null;const n=Number(value);return Number.isFinite(n)?n:null;}

