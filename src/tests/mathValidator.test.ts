import { describe, it, expect } from 'vitest';
import { validateMathAnswer, normalizeMathString } from '../services/mathValidator';

describe('Yerel Matematik Doğrulayıcı (Local Math Validator)', () => {
  it('boşluk ve x= öneklerini doğru normalize etmeli', () => {
    expect(normalizeMathString('  x = 4  ')).toBe('4');
    expect(normalizeMathString('3,5')).toBe('3.5');
    expect(normalizeMathString('{ 12 }')).toBe('12');
  });

  it('tam sayı ve denklem köklerini doğrulamalı', () => {
    const res1 = validateMathAnswer('4', '4');
    expect(res1.isValid).toBe(true);

    const res2 = validateMathAnswer('x = 4', '4');
    expect(res2.isValid).toBe(true);

    const res3 = validateMathAnswer('5', '4');
    expect(res3.isValid).toBe(false);
  });

  it('kesirli ve sayısal denklik durumlarını doğrulamalı', () => {
    // 12/4 == 3
    const res1 = validateMathAnswer('12/4', '3');
    expect(res1.isValid).toBe(true);

    // 0.5 == 1/2
    const res2 = validateMathAnswer('1/2', '0.5');
    expect(res2.isValid).toBe(true);
  });

  it('virgüllü ondalık girişleri kabul etmeli', () => {
    const res = validateMathAnswer('3,5', '3.5');
    expect(res.isValid).toBe(true);
  });
});
