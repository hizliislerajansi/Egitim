import { describe, it, expect, beforeAll } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';
import { MasteryEngine } from '../services/masteryEngine';
import { exportDatabaseToJson, importDatabaseFromJson, exportTableToCsv } from '../db/backup';
import { AiAdapter } from '../services/aiAdapter';

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

describe('Aşama 1: SQLite Veritabanı, Çevrimdışı Motor ve Testler', () => {
  beforeAll(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  it('11 tablonun tamamı ve şema başarıyla oluşturulmalı', () => {
    const db = getDb();
    const tables = [
      'student_profile',
      'subjects',
      'topics',
      'questions',
      'study_sessions',
      'answer_attempts',
      'topic_mastery',
      'review_schedule',
      'conversation_summaries',
      'ai_usage',
      'app_settings'
    ];

    for (const t of tables) {
      const res = db.query(`SELECT COUNT(*) as count FROM ${t}`);
      expect(res).toBeDefined();
      expect(res[0].count).toBeGreaterThanOrEqual(0);
    }
  });

  it('MEB Lise 1 dersleri ve konuları tohumlanmış olmalı', () => {
    const db = getDb();
    const subjects = db.query('SELECT * FROM subjects');
    expect(subjects.length).toBeGreaterThanOrEqual(2);

    const topics = db.query('SELECT * FROM topics');
    expect(topics.length).toBeGreaterThanOrEqual(8);

    const questions = db.query('SELECT * FROM questions');
    expect(questions.length).toBeGreaterThanOrEqual(8);
  });

  it('Çevrimdışı Soru Motoru doğru cevabı kabul edip attempt kaydetmeli', () => {
    const questions = OfflineQuestionEngine.getQuestionsBySubject('subj_math');
    expect(questions.length).toBeGreaterThan(0);

    const q = questions.find(item => item.id === 'q_math_3') || questions[0];
    const sessionId = OfflineQuestionEngine.startSession('subj_math', 'math_workshop');

    // Doğru cevap testi
    const result = OfflineQuestionEngine.submitAnswer({
      sessionId,
      questionId: q.id,
      studentAnswer: q.correct_answer,
      hintsUsed: 0,
      timeSpentSeconds: 20
    });

    expect(result.isCorrect).toBe(true);
    expect(result.attemptId).toBeDefined();

    // Veritabanında kayıt doğrulaması
    const db = getDb();
    const attempt = db.queryOne('SELECT * FROM answer_attempts WHERE id = ?', [result.attemptId]);
    expect(attempt).toBeDefined();
    expect(attempt.is_correct).toBe(1);
  });

  it('Yanlış cevap verildiğinde hata kategorisi ve tekrar planı oluşturulmalı', () => {
    const questions = OfflineQuestionEngine.getQuestionsBySubject('subj_math');
    const q = questions[0];
    const sessionId = OfflineQuestionEngine.startSession('subj_math', 'math_workshop');

    const result = OfflineQuestionEngine.submitAnswer({
      sessionId,
      questionId: q.id,
      studentAnswer: 'yanlis_cevap_999',
      hintsUsed: 1,
      timeSpentSeconds: 15,
      errorCategory: 'Kavram Yanılgısı'
    });

    expect(result.isCorrect).toBe(false);

    // Tekrar planı kontrolü
    const db = getDb();
    const review = db.queryOne('SELECT * FROM review_schedule WHERE topic_id = ? AND status = "pending" ORDER BY id DESC', [q.topic_id]);
    expect(review).toBeDefined();
    expect(review.priority).toBe('high');
  });

  it('Konu Ustalık Durumu (Topic Mastery) doğru güncellenmeli', () => {
    const topicId = 'topic_math_equations';
    const mastery1 = MasteryEngine.updateTopicMastery(topicId, true, 0);
    expect(mastery1.mastery_score).toBeGreaterThan(0);
    expect(mastery1.streak_correct).toBeGreaterThanOrEqual(1);
    expect(['Öğreniliyor', 'Pekişiyor']).toContain(mastery1.status);
  });

  it('Veritabanı JSON yedeği alınabilmeli ve geri yüklenebilmeli', () => {
    const jsonDump = exportDatabaseToJson();
    expect(jsonDump).toBeDefined();
    expect(jsonDump.length).toBeGreaterThan(100);

    const restoreResult = importDatabaseFromJson(jsonDump);
    expect(restoreResult.success).toBe(true);
  });

  it('CSV dışa aktarımı çalışmalı', () => {
    const csv = exportTableToCsv('topics');
    expect(csv).toContain('name');
    expect(csv).toContain('learning_outcome');
  });

  it('Bütçe ve AI kullanım denetimi çalışmalı', () => {
    const budget = AiAdapter.checkBudget();
    expect(budget.dailySpentUsd).toBeGreaterThanOrEqual(0);
    expect(budget.isDailyLimitExceeded).toBe(false);
  });
});
