import { describe, it, expect, beforeAll } from 'vitest';
import { AppDatabase } from '../db/database';
import { seedInitialData } from '../db/seed';
import { TOPIC_LECTURES } from '../data/topicLectures';
import { MEB_TOPICS } from '../data/mebCurriculum';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';
import { AiAdapter } from '../services/aiAdapter';

describe('Pedagojik Roller ve Ders Akışı Testleri', () => {
  beforeAll(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  it('Tüm MEB matematik ve İngilizce konuları için Konu Anlatımı ve Sesli Metin bulunmalıdır', () => {
    expect(Object.keys(TOPIC_LECTURES).length).toBeGreaterThanOrEqual(10);

    const mathLogic = TOPIC_LECTURES['topic_math_logic'];
    expect(mathLogic).toBeDefined();
    expect(mathLogic.title).toBe('Önermeler ve Doğruluk Değerleri');
    expect(mathLogic.audioNarration.length).toBeGreaterThan(50);
    expect(mathLogic.workedExample.solutionSteps.length).toBeGreaterThan(0);

    const engTheme1 = TOPIC_LECTURES['topic_eng_theme1'];
    expect(engTheme1).toBeDefined();
    expect(engTheme1.title).toBe('Greetings & Personal Information');
    expect(engTheme1.audioNarration.length).toBeGreaterThan(50);
  });

  it('Her konuya özel MEB soruları filtrelenebilmelidir (Önce Konu Anlatımı -> Sonra Soru)', () => {
    const logicQuestions = OfflineQuestionEngine.getQuestionsByTopic('topic_math_logic');
    expect(logicQuestions.length).toBeGreaterThan(0);
    expect(logicQuestions.every(q => q.topic_id === 'topic_math_logic')).toBe(true);

    const engQuestions = OfflineQuestionEngine.getQuestionsByTopic('topic_eng_theme1');
    expect(engQuestions.length).toBeGreaterThan(0);
    expect(engQuestions.every(q => q.topic_id === 'topic_eng_theme1')).toBe(true);
  });

  it('AiAdapter 3 farklı rol (Branş Öğretmeni, Sınıf Öğretmeni, Ders Koçu) için özel sistem talimatı üretmelidir', () => {
    const branchPrompt = AiAdapter.buildCompactSystemPrompt({
      role: 'subject_teacher',
      subjectCode: 'MATH',
      topicName: 'Önermeler',
      taskType: 'explanation',
      userMessage: 'Mantık konusunu anlat'
    });
    expect(branchPrompt).toContain('Branş Öğretmenisin');
    expect(branchPrompt).toContain('Matematik');

    const homeroomPrompt = AiAdapter.buildCompactSystemPrompt({
      role: 'homeroom_teacher',
      taskType: 'chat',
      userMessage: 'Genel durumum nasıl?'
    });
    expect(homeroomPrompt).toContain('Sınıf Öğretmenisin');
    expect(homeroomPrompt).toContain('bütünsel');

    const coachPrompt = AiAdapter.buildCompactSystemPrompt({
      role: 'study_coach',
      taskType: 'coaching',
      userMessage: 'Motivasyonum düştü'
    });
    expect(coachPrompt).toContain('Ders Koçu');
    expect(coachPrompt).toContain('moral');
  });

  it('Branş öğretmeni, sınıf öğretmeni ve ders koçu çevrimdışı fallback ile kaliteli pedagojik yanıt vermelidir', async () => {
    // Sınıf Öğretmeni
    const homeroomRes = await AiAdapter.request({
      role: 'homeroom_teacher',
      taskType: 'chat',
      userMessage: 'Tüm derslerimi değerlendirir misiniz?'
    });
    expect(homeroomRes.text.length).toBeGreaterThan(30);

    // Ders Koçu
    const coachRes = await AiAdapter.request({
      role: 'study_coach',
      taskType: 'coaching',
      userMessage: 'Bugün çok stresliyim, ders çalışamıyorum.'
    });
    expect(coachRes.text.length).toBeGreaterThan(30);

    // Branş Öğretmeni
    const branchRes = await AiAdapter.request({
      role: 'subject_teacher',
      subjectCode: 'MATH',
      taskType: 'explanation',
      userMessage: 'Önerme nedir?'
    });
    expect(branchRes.text.length).toBeGreaterThan(30);
  });
});
