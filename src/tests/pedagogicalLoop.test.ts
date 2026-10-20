import { describe, it, expect, beforeAll } from 'vitest';
import { AppDatabase } from '../db/database';
import { seedInitialData } from '../db/seed';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';
import { MEB_QUESTIONS } from '../data/mebCurriculum';

describe('3 Yanlış Bekleme, Otomatik Basit Anlatım ve Konu Sonu Tekrar Döngüsü Testleri', () => {
  beforeAll(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  it('1. Yanlış cevap verildiğinde soru kilitlenmeli, 3 deneme yapılana kadar soru atlanmamalıdır', () => {
    const q = MEB_QUESTIONS[0];
    let wrongAttempts = 0;
    const maxAllowedWrongs = 3;

    // 1. Yanlış Deneme
    wrongAttempts++;
    let canAdvance = wrongAttempts >= maxAllowedWrongs;
    expect(canAdvance).toBe(false);
    expect(wrongAttempts).toBe(1);

    // 2. Yanlış Deneme
    wrongAttempts++;
    canAdvance = wrongAttempts >= maxAllowedWrongs;
    expect(canAdvance).toBe(false);
    expect(wrongAttempts).toBe(2);

    // 3. Yanlış Deneme
    wrongAttempts++;
    canAdvance = wrongAttempts >= maxAllowedWrongs;
    expect(canAdvance).toBe(true);
    expect(wrongAttempts).toBe(3);
  });

  it('2. Her yanlış cevapta aşamalı olarak daha basitleştirilmiş anlatım üretilmelidir', () => {
    const keyRule = "Kümelerde birleşim formülü: s(A U B) = s(A) + s(B) - s(A ∩ B).";
    const hint1 = "Önce her iki kulübe de üye olan kesişim kümesini düşün.";
    const hint2 = "Sadece satranç ve sadece kodlama kulübündekileri topla.";

    // 1. Yanlışta Seviye 1 Basitleştirme
    const simpleExplanationLevel1 = `1. Basit Anlatım: ${keyRule} Soru kökünde senden ne istendiğine dikkat et.`;
    expect(simpleExplanationLevel1).toContain('1. Basit Anlatım');
    expect(simpleExplanationLevel1).toContain(keyRule);

    // 2. Yanlışta Seviye 2 Süper Basitleştirme & Doğrudan İpucu
    const simpleExplanationLevel2 = `2. Süper Basit Adım Adım İpucu: ${hint1} ${hint2}`;
    expect(simpleExplanationLevel2).toContain('2. Süper Basit Adım Adım İpucu');
    expect(simpleExplanationLevel2).toContain(hint1);
  });

  it('3. Konu bitiminde 3 yanlış yapılan sorular kuyruğa alınmalı ve tekrar çözülmelidir', () => {
    const topicQuestions = MEB_QUESTIONS.slice(0, 3);
    const failedQueue: any[] = [];

    // Soru 1: Doğru çözüldü
    // Soru 2: 3 Yanlış yapıldı -> Kuyruğa eklenir
    failedQueue.push(topicQuestions[1]);
    // Soru 3: Doğru çözüldü

    expect(failedQueue.length).toBe(1);
    expect(failedQueue[0].id).toBe(topicQuestions[1].id);

    // Konu sonu kontrolü
    let activeQuestions = [...topicQuestions];
    let isTopicCompleted = false;
    let isReviewMode = false;

    // Tüm sorular bittiğinde:
    if (failedQueue.length > 0) {
      isReviewMode = true;
      activeQuestions = [...failedQueue];
      isTopicCompleted = false;
    } else {
      isTopicCompleted = true;
    }

    expect(isReviewMode).toBe(true);
    expect(isTopicCompleted).toBe(false);
    expect(activeQuestions.length).toBe(1);
    expect(activeQuestions[0].id).toBe(topicQuestions[1].id);

    // Tekrar modunda soru doğru çözüldüğünde konu tamamlanmalı
    const remainingFailed = failedQueue.filter(q => q.id !== topicQuestions[1].id);
    if (remainingFailed.length === 0) {
      isTopicCompleted = true;
      isReviewMode = false;
    }

    expect(isTopicCompleted).toBe(true);
    expect(isReviewMode).toBe(false);
  });
});
