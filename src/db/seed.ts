import { getDb } from './database';
import { MEB_SUBJECTS, MEB_TOPICS, MEB_QUESTIONS } from '../data/mebCurriculum';
import { DEFAULT_CONFIG } from '../types/settings';

export async function seedInitialData(): Promise<void> {
  const db = getDb();
  db.transaction(()=>{

  // 1. Öğrenci Profili Kontrolü
  const profileCount = db.query<{ count: number }>("SELECT COUNT(*) as count FROM student_profile")[0]?.count || 0;
  if (profileCount === 0) {
    const now = new Date().toISOString();
    db.execute(
      `INSERT INTO student_profile (id, name, grade, learning_style, daily_goal_minutes, weekly_goal_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['profile_default', 'Lise 1 Öğrencisi', 9, 'balanced', 45, 225, now, now]
    );
  }

  // 2. Tüm MEB Derslerini Senkronize Et (9 Temel Ders)
  for (const sub of MEB_SUBJECTS) {
    db.execute(
      `INSERT OR REPLACE INTO subjects (id, name, code, icon, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sub.id, sub.name, sub.code, sub.icon, sub.description, sub.sort_order]
    );
  }

  // 3. Konular ve MEB Kazanımları
  const now = new Date().toISOString();
  for (const top of MEB_TOPICS) {
    db.execute(
      `INSERT OR REPLACE INTO topics (id, subject_id, unit, name, learning_outcome, meb_code, difficulty, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [top.id, top.subject_id, top.unit, top.name, top.learning_outcome, top.meb_code, top.difficulty, top.order_index]
    );

    // Topic Mastery kaydı yoksa oluştur
    db.execute(
      `INSERT OR IGNORE INTO topic_mastery (id, topic_id, mastery_score, status, streak_correct, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`mastery_${top.id}`, top.id, 0, 'Yeni', 0, now]
    );
  }

  // 4. MEB Soru Havuzu
  for (const q of MEB_QUESTIONS) {
    db.execute(
      `INSERT OR REPLACE INTO questions (id, topic_id, question_text, question_type, options_json, correct_answer, hint_1, hint_2, explanation, difficulty, meb_aligned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.id,
        q.topic_id,
        q.question_text,
        q.question_type,
        q.options_json || null,
        q.correct_answer,
        q.hint_1,
        q.hint_2,
        q.explanation,
        q.difficulty,
        q.meb_aligned
      ]
    );
  }

  // 5. Varsayılan Ayarlar
  const settingsCount = db.query<{ count: number }>("SELECT COUNT(*) as count FROM app_settings")[0]?.count || 0;
  if (settingsCount === 0) {
    for (const [key, val] of Object.entries(DEFAULT_CONFIG)) {
      db.execute(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
        [key, JSON.stringify(val), now]
      );
    }
  }
  });
}
