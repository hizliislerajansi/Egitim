import { describe, it, expect, beforeAll } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { StudentProfileEngine } from '../services/studentProfileEngine';
import { SimplificationLadder } from '../services/simplificationLadder';
import { GentleStudyPlanner } from '../services/gentleStudyPlanner';
import { AdaptivePedagogyEngine } from '../services/adaptivePedagogyEngine';

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

describe('Yaşa, Gelişim Düzeyine ve Kişisel İhtiyaçlara Uyarlanan Yapay Zekâ Öğretmeni', () => {
  beforeAll(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  describe('1. Öğrenciyi Tanıma ve Kişiselleştirilmiş Profil Motoru', () => {
    it('Varsayılan profil güvenli değerlerle başlatılmalı', () => {
      const profile = StudentProfileEngine.getProfile();
      expect(profile).toBeDefined();
      expect(profile.name).toBe('Deniz');
      expect(profile.age).toBe(15);
      expect(profile.gradeLevel).toBe('lise_1');
      expect(profile.addressStyle).toBe('samimi');
      expect(profile.dailyTimeMinutes).toBe(45);
    });

    it('Öğrenci profili yaş, sınıf ve hitap biçimine göre güncellenebilmeli', () => {
      const updated = StudentProfileEngine.updateProfile({
        name: 'Cem',
        age: 16,
        gradeLevel: 'lise_ileri',
        addressStyle: 'tesvik_edici',
        verbosityPreference: 'detayli'
      });

      expect(updated.name).toBe('Cem');
      expect(updated.age).toBe(16);
      expect(updated.gradeLevel).toBe('lise_ileri');
      expect(updated.addressStyle).toBe('tesvik_edici');

      // Kalıcılığı doğrula
      const retrieved = StudentProfileEngine.getProfile();
      expect(retrieved.name).toBe('Cem');
      expect(retrieved.verbosityPreference).toBe('detayli');
    });

    it('Profil asla aşağılayıcı veya kalıcı olumsuz etiketler içermemeli', () => {
      const profile = StudentProfileEngine.getProfile();
      expect(JSON.stringify(profile)).not.toContain('başarısız');
      expect(JSON.stringify(profile)).not.toContain('yavaş öğrenen');
      expect(JSON.stringify(profile)).not.toContain('dikkatsiz');
    });
  });

  describe('2. Dinamik 6 Aşamalı Ustalık ve Zorluk Ayarlama', () => {
    it('Yardımlı çözüm ile bağımsız çözümü ayrı değerlendirmeli', () => {
      const topicId = 'topic_test_functions';

      // 1. İpuçlu (yardımlı) doğru cevap
      const step1 = StudentProfileEngine.evaluateAnswer({
        topicId,
        isCorrect: true,
        hintsUsed: 2,
        timeSpentSeconds: 25
      });
      expect(step1.mastery.masteryState).toBe('yardimla_cozulebiliyor');
      expect(step1.mastery.assistedSolves).toBe(1);
      expect(step1.mastery.independentSolves).toBe(0);

      // 2. Bağımsız doğru cevap
      const step2 = StudentProfileEngine.evaluateAnswer({
        topicId,
        isCorrect: true,
        hintsUsed: 0,
        timeSpentSeconds: 18
      });
      expect(step2.mastery.independentSolves).toBe(1);

      // 3. İkinci ardışık bağımsız doğru ile bağımsız çözülebiliyor seviyesine geçmeli
      const step3 = StudentProfileEngine.evaluateAnswer({
        topicId,
        isCorrect: true,
        hintsUsed: 0,
        timeSpentSeconds: 15
      });
      expect(step3.mastery.masteryState).toBe('bagimsiz_cozulebiliyor');
      expect(step3.mastery.independentSolves).toBe(2);
    });

    it('Tek bir yanlış cevap seviyeyi sıfırlamamalı, tekrar gerekiyor aşamasına almalı', () => {
      const topicId = 'topic_test_functions';
      const stepWrong = StudentProfileEngine.evaluateAnswer({
        topicId,
        isCorrect: false,
        hintsUsed: 0,
        timeSpentSeconds: 12
      });
      expect(stepWrong.mastery.masteryState).toBe('tekrar_gerekiyor');
      expect(stepWrong.mastery.consecutiveWrong).toBe(1);
    });

    it('Çok hızlı (<4s) tahmin yanıtlarını tespit edip doğrulama bayrağı açmalı', () => {
      const guessResult = StudentProfileEngine.evaluateAnswer({
        topicId: 'topic_test_guess',
        isCorrect: true,
        hintsUsed: 0,
        timeSpentSeconds: 2
      });
      expect(guessResult.isPotentialGuess).toBe(true);
      expect(guessResult.recommendedNextAction).toBe('verify_guess');
    });
  });

  describe('3. 8 Basamaklı Kademeli Basitleştirme Merdiveni', () => {
    it('8 farklı basamağın tümü geçerli pedagojik içerik üretmeli', () => {
      const mockProfile = StudentProfileEngine.getProfile();
      const steps = [
        'normal',
        'simpler',
        'analogy',
        'visual',
        'step_by_step',
        'prerequisite_check',
        'alternative_method',
        'quick_check'
      ] as const;

      for (let i = 0; i < steps.length; i++) {
        const res = SimplificationLadder.generateExplanation(
          steps[i],
          'Fonksiyonlar',
          'MATH',
          mockProfile
        );
        expect(res.step).toBe(steps[i]);
        expect(res.stepNumber).toBe(i + 1);
        expect(res.adaptedContent.length).toBeGreaterThan(40);
      }
    });

    it('Öğrenci hitap tarzına göre karşılama tonunu uyarlamalı', () => {
      const mockProfile = StudentProfileEngine.getProfile();
      const samimiProfile = { ...mockProfile, addressStyle: 'samimi' as const, name: 'Deniz' };
      const akademikProfile = { ...mockProfile, addressStyle: 'akademik' as const, name: 'Deniz' };

      const resSamimi = SimplificationLadder.generateExplanation('simpler', 'Fonksiyonlar', 'MATH', samimiProfile);
      const resAkademik = SimplificationLadder.generateExplanation('simpler', 'Fonksiyonlar', 'MATH', akademikProfile);

      expect(resSamimi.adaptedContent).toContain('Sevgili Deniz');
      expect(resAkademik.adaptedContent).toContain('Sayın Deniz');
    });

    it('quick_check basamağı tek bir mini kontrol sorusu ve çözüm açıklaması sunmalı', () => {
      const mockProfile = StudentProfileEngine.getProfile();
      const checkRes = SimplificationLadder.generateExplanation('quick_check', 'Fonksiyonlar', 'MATH', mockProfile);
      expect(checkRes.checkQuestion).toBeDefined();
      expect(checkRes.checkQuestion?.options.length).toBe(4);
      expect(checkRes.checkQuestion?.correctAnswer).toBe('B) 10');
      expect(checkRes.checkQuestion?.explanation).toContain('f(4)');
    });
  });

  describe('4. Bunaltmayan Çalışma Planlayıcısı & Yorgunluk Kontrolü', () => {
    it('Günlük süreyi aşmayan ve farklı etkinlikleri harmanlayan plan üretmeli', () => {
      const profile = StudentProfileEngine.getProfile();
      const plan = GentleStudyPlanner.generateDailyPlan(profile);

      expect(plan.totalMinutes).toBeLessThanOrEqual(profile.dailyTimeMinutes);
      expect(plan.tasks.length).toBeGreaterThanOrEqual(2);
      expect(plan.tasks.length).toBeLessThanOrEqual(4);

      // Görev tiplerinin çeşitliliğini kontrol et
      const types = plan.tasks.map(t => t.taskType);
      expect(types).toContain('concept');
      expect(types).toContain('practice');
    });

    it('Uzun süreli aralıksız çalışma ve soru yığılmasında mola tavsiyesi vermeli', () => {
      const freshSession = GentleStudyPlanner.checkSessionFatigue(15, 4);
      expect(freshSession.needsBreak).toBe(false);

      const tiredSession = GentleStudyPlanner.checkSessionFatigue(45, 18);
      expect(tiredSession.needsBreak).toBe(true);
      expect(tiredSession.gentleMessage).toContain('mola');
      expect(tiredSession.gentleMessage).not.toContain('zorundasın');
    });
  });

  describe('5. Karar Motoru & Deterministik Yerel Hesaplama (Token Tasarrufu)', () => {
    it('2. dereceden denklem sorusunu yerel matematik motoru ile 0 token ile çözmeli', () => {
      const decision = AdaptivePedagogyEngine.processStudentQuery({
        userMessage: 'x^2 - 5x + 6 = 0 denklemini çöz',
        subjectCode: 'MATH'
      });

      expect(decision.deterministicAnswer).toBeDefined();
      expect(decision.tokensSaved).toBeGreaterThan(400);
      expect(decision.responseContent).toContain('Diskriminant');
      expect(decision.responseContent).toContain('3');
      expect(decision.responseContent).toContain('2');
    });

    it('Öğrenci "anlamadım" dediğinde otomatik olarak bir sonraki basamağa geçmeli', () => {
      const decision = AdaptivePedagogyEngine.processStudentQuery({
        userMessage: 'Bu açıklamayı hiç anlamadım, çok karışık geldi',
        subjectCode: 'MATH',
        currentStep: 'normal'
      });

      expect(decision.step).toBe('simpler');
      expect(decision.action).toBe('simplify');
    });
  });
});
