import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { DemoDataManager } from '../services/demoDataManager';

describe('DemoDataManager and Tutorial Wizard Tests', () => {
  beforeEach(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  it('loads realistic demo data into attempts, sessions, mastery, and review schedule', async () => {
    const res = await DemoDataManager.loadDemoData();
    expect(res.success).toBe(true);

    const db = getDb();
    const attempts = db.query("SELECT * FROM answer_attempts");
    expect(attempts.length).toBeGreaterThanOrEqual(7);

    const sessions = db.query("SELECT * FROM study_sessions");
    expect(sessions.length).toBeGreaterThanOrEqual(4);

    const reviews = db.query("SELECT * FROM review_schedule WHERE status = 'pending'");
    expect(reviews.length).toBeGreaterThanOrEqual(3);

    const masteries = db.query("SELECT * FROM topic_mastery WHERE mastery_score > 0");
    expect(masteries.length).toBeGreaterThanOrEqual(5);
  });

  it('safely clears demo/attempt data without erasing core MEB curriculum', () => {
    const clearRes = DemoDataManager.clearDemoData();
    expect(clearRes.success).toBe(true);

    const db = getDb();
    const attempts = db.query("SELECT * FROM answer_attempts");
    expect(attempts.length).toBe(0);

    const sessions = db.query("SELECT * FROM study_sessions");
    expect(sessions.length).toBe(0);

    const reviews = db.query("SELECT * FROM review_schedule");
    expect(reviews.length).toBe(0);

    // Çekirdek müfredatın korunduğunu doğrula
    const subjects = db.query("SELECT * FROM subjects");
    expect(subjects.length).toBeGreaterThanOrEqual(9);

    const topics = db.query("SELECT * FROM topics");
    expect(topics.length).toBeGreaterThan(0);

    const questions = db.query("SELECT * FROM questions");
    expect(questions.length).toBeGreaterThan(0);
  });
});
