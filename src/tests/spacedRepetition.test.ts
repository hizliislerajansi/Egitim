import { describe, it, expect } from 'vitest';
import { MasteryEngine } from '../services/masteryEngine';

describe('Aşama 5: Aralıklı Tekrar (Spaced Repetition) ve Seviye Testleri', () => {
  it('hata yapıldığında 1 gün sonra ve yüksek öncelikli planlamalı', () => {
    const interval = MasteryEngine.calculateNextInterval(0, false);
    expect(interval.days).toBe(1);
    expect(interval.priority).toBe('high');
  });

  it('başarılı tekrarlarda aralıkları sırasıyla 3, 7 ve 14 gün olarak artırmalı', () => {
    // 1. başarılı tekrar
    const int1 = MasteryEngine.calculateNextInterval(1, true);
    expect(int1.days).toBe(3);
    expect(int1.priority).toBe('medium');

    // 2. başarılı tekrar
    const int2 = MasteryEngine.calculateNextInterval(2, true);
    expect(int2.days).toBe(7);
    expect(int2.priority).toBe('low');

    // 3. başarılı tekrar
    const int3 = MasteryEngine.calculateNextInterval(3, true);
    expect(int3.days).toBe(14);
    expect(int3.priority).toBe('low');
  });

  it('başlangıç seviye tespit algoritması doğru sınıflandırma yapmalı', () => {
    // 4 sorudan 1 doğru (%25) -> Temel
    const eval1 = MasteryEngine.evaluateDiagnosticLevel(1, 4);
    expect(eval1.level).toBe('Temel');

    // 4 sorudan 2 doğru (%50) -> Orta
    const eval2 = MasteryEngine.evaluateDiagnosticLevel(2, 4);
    expect(eval2.level).toBe('Orta');

    // 4 sorudan 4 doğru (%100) -> İleri
    const eval3 = MasteryEngine.evaluateDiagnosticLevel(4, 4);
    expect(eval3.level).toBe('İleri');
  });
});
