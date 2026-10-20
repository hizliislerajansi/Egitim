import { describe, it, expect, beforeAll } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { KnowledgeGraphEngine } from '../services/knowledgeGraph';
import { ErrorAnalysisEngine } from '../services/errorAnalysisEngine';
import { LessonGenerator } from '../services/lessonGenerator';
import { SpeakingSimulator, REAL_LIFE_SCENARIOS } from '../services/speakingSimulator';
import { MasteryEngine } from '../services/masteryEngine';
import { OpenAlexAdapter } from '../services/provider/adapters/OpenAlexAdapter';
import { WikimediaCommonsAdapter } from '../services/provider/adapters/WikimediaCommonsAdapter';
import { OpenStaxCK12Adapter } from '../services/provider/adapters/OpenStaxCK12Adapter';
import { UnifiedEducationEngine } from '../services/provider/UnifiedEducationEngine';

// Node ortamında localStorage polyfill
if (typeof localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

describe('Otonom Öğrenme, Doğrulama ve Açık Veri Motoru Testleri', () => {
  beforeAll(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  describe('1. Müfredat ve Bilgi Grafiği (Knowledge Graph)', () => {
    it('Konu için tanımlı ön koşulları ve gerekçeleri getirmeli', () => {
      const prereqs = KnowledgeGraphEngine.getPrerequisites('MAT-09.02');
      expect(prereqs).toBeDefined();
      expect(prereqs?.prerequisiteCodes.length).toBeGreaterThan(0);
      expect(prereqs?.prerequisiteTitles[0]).toBe('Birinci Dereceden Denklemler');
    });

    it('Ön koşul için kısa tanılama soruları üretmeli ve analizi yapabilmeli', () => {
      const questions = KnowledgeGraphEngine.getDiagnosticQuestions('MAT-09.02');
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].options.length).toBe(4);

      const analysis = KnowledgeGraphEngine.analyzeDiagnostic('MAT-09.02', questions[0].id, questions[0].correctAnswer);
      expect(analysis.isPrerequisiteMissing).toBe(false);
      expect(analysis.clue).toContain('sağlam');
    });
  });

  describe('2. Derinlemesine Hata Analizi ve Kademeli İpuçları', () => {
    it('Kavram yanılgısı, işlem hatası ve dikkatsizlik ayrımı yapabilmeli', () => {
      const diagnosis = ErrorAnalysisEngine.diagnose(
        '2x + 6 = 14 denkleminde x kaçtır?',
        '6',
        '4',
        'math',
        1
      );

      expect(diagnosis.status).toBe('incorrect');
      expect(diagnosis.category).toBeDefined();
      expect(diagnosis.graduatedHint).toBeDefined();
      expect(diagnosis.hintLevel).toBe(1);
    });

    it('Tam doğru cevapta status "correct" ve confidence 1.0 dönmeli', () => {
      const correctDiagnosis = ErrorAnalysisEngine.diagnose(
        '2x + 6 = 14 denkleminde x kaçtır?',
        '4',
        '4',
        'math'
      );
      expect(correctDiagnosis.status).toBe('correct');
      expect(correctDiagnosis.confidence).toBe(1.0);
    });
  });

  describe('3. Otomatik 6 Bileşenli Ders Üreticisi (Lesson Generator)', () => {
    it('Hedef, ön koşul, açıklama, çözümlü örnek, alıştırma ve mini değerlendirme üretmeli', () => {
      const lesson = LessonGenerator.generateLesson('MATH', 'İkinci Dereceden Bir Bilinmeyenli Denklemler');
      expect(lesson).toBeDefined();
      expect(lesson.targetOutcome).toBeDefined();
      expect(lesson.prerequisites.length).toBeGreaterThan(0);
      expect(lesson.conceptExplanation).toContain('Diskriminant');
      expect(lesson.workedExample.stepByStepSolution.length).toBeGreaterThan(0);
      expect(lesson.independentPractice.problemStatement).toBeDefined();
      expect(lesson.miniQuiz.length).toBe(3);
    });
  });

  describe('4. İngilizce Konuşma Simülatörü & Akustik Gürültü Ayrımı', () => {
    it('Ses tanıma gürültüsü ile gerçek dilbilgisi hatasını birbirinden ayırmalı', () => {
      const scenario = REAL_LIFE_SCENARIOS[0];
      const turn = scenario.turns[0];

      // 1. Düşük güvenilirlikli veya boş ses girişi -> Akustik gürültü, dil hatası DEĞİL
      const noisyResult = SpeakingSimulator.evaluateSpeech('', turn, 0.45);
      expect(noisyResult.isRecognized).toBe(false);
      expect(noisyResult.needsRetry).toBe(true);
      expect(noisyResult.retryReason).toContain('net');

      // 2. Başarılı telaffuz ve uygun yanıt
      const validResult = SpeakingSimulator.evaluateSpeech('Good morning! Here is my passport and booking code.', turn, 0.95);
      expect(validResult.isRecognized).toBe(true);
      expect(validResult.isGrammaticallyAcceptable).toBe(true);
    });
  });

  describe('5. Aralıklı Tekrar Yığılmasını Önleme (Zero Pile-up)', () => {
    it('Aşırı biriken tekrarları günlük 15 soru sınırına göre sonraki günlere yaymalı', () => {
      const db = getDb();
      const pastDate = '2026-01-01';
      // 20 adet eski bekleyen tekrar ekle
      for (let i = 0; i < 20; i++) {
        db.execute(
          `INSERT INTO review_schedule (id, topic_id, scheduled_date, priority, status, reason, created_at)
           VALUES (?, 'topic_math_fonksiyonlar', ?, 'high', 'pending', 'Test review', ?)`,
          [`test_rev_${Date.now()}_${i}`, pastDate, new Date().toISOString()]
        );
      }

      const rebalance = MasteryEngine.rebalanceReviewSchedule(15);
      expect(rebalance.todayReviewsCount).toBeLessThanOrEqual(15);
      expect(rebalance.rescheduledCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('6. Açık Veri Sağlayıcıları ve Lisanslı Entegrasyonlar', () => {
    it('OpenAlex adapter akademik özet ve lisans atfı sağlamalı', async () => {
      const result = await OpenAlexAdapter.searchResearch('hooke');
      expect(result).toBeDefined();
      expect(result.contentType).toBe('academic_summary');
      expect(result.content).toContain('Hooke');
      expect(result.attribution).toContain('OpenAlex');
    });

    it('Wikimedia Commons adapter eğitim görseli ve lisans atfı sağlamalı', async () => {
      const media = await WikimediaCommonsAdapter.searchMedia('hooke');
      expect(media).toBeDefined();
      expect(media.contentType).toBe('educational_media');
      expect(media.sourceUrl).toContain('wikimedia');
      expect(media.attribution).toContain('Wikimedia Commons');
    });

    it('OpenStax & CK-12 adapter lisanslı ders bölümleri getirmeli', () => {
      const chapter = OpenStaxCK12Adapter.getCurriculumChapter('FIZ-09.02');
      expect(chapter).toBeDefined();
      expect(chapter.contentType).toBe('textbook_chapter');
      expect(chapter.attribution).toContain('OpenStax');
    });

    it('UnifiedEducationEngine 12 adımlı hatta sorguyu normalize edip doğrulamalı', async () => {
      const response = await UnifiedEducationEngine.executeQuery({
        subject: 'math',
        text: 'quadratic',
        gradeLevel: 9
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.verification).toBeDefined();
      expect(response.savings.tokens).toBeGreaterThan(0);
    });
  });
});
