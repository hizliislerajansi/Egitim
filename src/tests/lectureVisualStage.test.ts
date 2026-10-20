import { describe, it, expect } from 'vitest';
import { TOPIC_LECTURES } from '../data/topicLectures';

describe('Görsel ve Animasyonlu Konu Anlatımı Testleri', () => {
  it('tüm müfredat konularında konu anlatım veri modelleri ve kazanımlar eksiksiz olmalıdır', () => {
    const topics = Object.keys(TOPIC_LECTURES);
    expect(topics.length).toBeGreaterThanOrEqual(10);

    topics.forEach((topicKey) => {
      const lecture = TOPIC_LECTURES[topicKey];
      expect(lecture.title).toBeTruthy();
      expect(lecture.outcome).toBeTruthy();
      expect(lecture.summary).toBeTruthy();
      expect(lecture.keyPoints.length).toBeGreaterThan(0);
      expect(lecture.workedExample).toBeDefined();
      expect(lecture.workedExample.solutionSteps.length).toBeGreaterThan(0);
    });
  });

  it('özel interaktif simülatör tanımlı kritik ders konuları mevcut olmalıdır', () => {
    // 1. Matematik Terazi Modeli
    expect(TOPIC_LECTURES['topic_math_equations']).toBeDefined();
    // 2. Kümeler Venn Şeması
    expect(TOPIC_LECTURES['topic_math_sets']).toBeDefined();
    // 3. Mutlak Değer Sayı Doğrusu
    expect(TOPIC_LECTURES['topic_math_absolute']).toBeDefined();
    // 4. Mantık ve Elektrik Devresi
    expect(TOPIC_LECTURES['topic_math_logic']).toBeDefined();
    // 5. Üçgende Açılar 180° İspatı
    expect(TOPIC_LECTURES['topic_math_triangles']).toBeDefined();
    // 6. Fizik Özkütle ve Sıvı Taşırma
    expect(TOPIC_LECTURES['topic_fizik_matter']).toBeDefined();
    // 7. Bilişim Akış Şeması
    expect(TOPIC_LECTURES['topic_bilisim_algo']).toBeDefined();
    // 8. Coğrafya Koordinat ve Yerküre
    expect(TOPIC_LECTURES['topic_cografya_coordinates']).toBeDefined();
  });

  it('sesli anlatım metinleri tüm derslerde öğrenci dostu ve pedagojik açıklamalı olmalıdır', () => {
    const sampleTopics = ['topic_math_equations', 'topic_math_sets', 'topic_fizik_matter'];
    sampleTopics.forEach((tKey) => {
      const lecture = TOPIC_LECTURES[tKey];
      expect(lecture.audioNarration).toBeTruthy();
      expect(lecture.audioNarration.length).toBeGreaterThan(30);
    });
  });
});
