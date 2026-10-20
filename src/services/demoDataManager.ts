import { getDb } from '../db/database';
import { seedInitialData } from '../db/seed';

export class DemoDataManager {
  /**
   * Demo / Deneme Çalışma Verilerini Yükler
   * - Gerçekçi çözülmüş sorular, doğru ve yanlış denemeler (kavram yanılgısı, işlem hatası)
   * - Konu ustalık skorları (Öğreniliyor, Pekişiyor, Hatırlatma Gerekli)
   * - Aralıklı tekrar çizelgesi kayıtları
   * - Çalışma oturumları ve AI kullanım logları
   */
  public static async loadDemoData(): Promise<{ success: boolean; message: string }> {
    try {
      const db = getDb();
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const isoNow = now.toISOString();

      // 1. Önce çekirdek müfredat verisinin varlığını garanti et
      await seedInitialData();

      // 2. Demo Oturumları Oluştur
      const sessions = [
        { id: 'demo_sess_1', subject_id: 'subj_math', topic_id: 'topic_math_eq', session_type: 'math_workshop', duration: 1800 },
        { id: 'demo_sess_2', subject_id: 'subj_eng', topic_id: 'topic_eng_theme1', session_type: 'english_lab', duration: 1500 },
        { id: 'demo_sess_3', subject_id: 'subj_phys', topic_id: 'topic_phys_matter', session_type: 'subject_workshop', duration: 1200 },
        { id: 'demo_sess_4', subject_id: 'subj_chem', topic_id: 'topic_chem_matter', session_type: 'subject_workshop', duration: 900 }
      ];

      for (const s of sessions) {
        db.execute(`
          INSERT OR REPLACE INTO study_sessions (id, subject_id, topic_id, start_time, end_time, duration_seconds, session_type)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [s.id, s.subject_id, s.topic_id, isoNow, isoNow, s.duration, s.session_type]);
      }

      // 3. Demo Cevap Denemeleri (Başarılar & Yanlışlar Defteri için Hatalar)
      const attempts = [
        // Matematik Doğru ve Yanlışları
        { id: 'demo_att_1', session_id: 'demo_sess_1', question_id: 'q_math_eq_1', answer: 'x = 2', is_correct: 1, hints: 0, err: null },
        { id: 'demo_att_2', session_id: 'demo_sess_1', question_id: 'q_math_eq_2', answer: 'x = 4', is_correct: 0, hints: 1, err: 'İşlem Hatası' },
        { id: 'demo_att_3', session_id: 'demo_sess_1', question_id: 'q_math_fn_1', answer: 'f(3) = 10', is_correct: 0, hints: 2, err: 'Kavram Yanılgısı' },
        // İngilizce
        { id: 'demo_att_4', session_id: 'demo_sess_2', question_id: 'q_eng_theme1_1', answer: 'Where are you from?', is_correct: 1, hints: 0, err: null },
        { id: 'demo_att_5', session_id: 'demo_sess_2', question_id: 'q_eng_theme1_2', answer: 'I lives in Ankara', is_correct: 0, hints: 1, err: 'Dikkatsizlik' },
        // Fizik
        { id: 'demo_att_6', session_id: 'demo_sess_3', question_id: 'q_phys_matter_1', answer: 'd = m / V', is_correct: 1, hints: 0, err: null },
        { id: 'demo_att_7', session_id: 'demo_sess_3', question_id: 'q_phys_matter_2', answer: 'Özkütle hacme bağlıdır', is_correct: 0, hints: 1, err: 'Kavram Yanılgısı' }
      ];

      for (const a of attempts) {
        db.execute(`
          INSERT OR REPLACE INTO answer_attempts (id, session_id, question_id, student_answer, is_correct, hint_used_count, time_spent_seconds, error_category, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [a.id, a.session_id, a.question_id, a.answer, a.is_correct, a.hints, 25, a.err, isoNow]);
      }

      // 4. Konu Ustalık Skorları
      const masteries = [
        { topic_id: 'topic_math_eq', score: 75, status: 'Pekişiyor', streak: 3 },
        { topic_id: 'topic_math_fn', score: 40, status: 'Öğreniliyor', streak: 1 },
        { topic_id: 'topic_math_set', score: 90, status: 'Pekişiyor', streak: 5 },
        { topic_id: 'topic_eng_theme1', score: 85, status: 'Pekişiyor', streak: 4 },
        { topic_id: 'topic_eng_theme2', score: 30, status: 'Hatırlatma Gerekli', streak: 0 },
        { topic_id: 'topic_phys_matter', score: 65, status: 'Öğreniliyor', streak: 2 },
        { topic_id: 'topic_chem_matter', score: 55, status: 'Öğreniliyor', streak: 2 }
      ];

      for (const m of masteries) {
        db.execute(`
          INSERT OR REPLACE INTO topic_mastery (id, topic_id, mastery_score, status, streak_correct, last_studied_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [`mastery_${m.topic_id}`, m.topic_id, m.score, m.status, m.streak, isoNow, isoNow]);
      }

      // 5. Aralıklı Tekrar Çizelgesi
      const reviews = [
        { id: 'demo_rev_1', topic_id: 'topic_math_fn', date: todayStr, priority: 'high', reason: 'Kavram Yanılgısı tespit edildi' },
        { id: 'demo_rev_2', topic_id: 'topic_eng_theme2', date: todayStr, priority: 'medium', reason: '3 günlük tekrar döngüsü' },
        { id: 'demo_rev_3', topic_id: 'topic_phys_matter', date: todayStr, priority: 'low', reason: 'Haftalık pekiştirme tekrarı' }
      ];

      for (const r of reviews) {
        db.execute(`
          INSERT OR REPLACE INTO review_schedule (id, topic_id, scheduled_date, priority, status, reason, created_at)
          VALUES (?, ?, ?, ?, 'pending', ?, ?)
        `, [r.id, r.topic_id, r.date, r.priority, r.reason, isoNow]);
      }

      // 6. AI Kullanım Logu
      db.execute(`
        INSERT OR REPLACE INTO ai_usage (id, provider, model, task_type, prompt_tokens, completion_tokens, estimated_cost_usd, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['demo_usage_1', 'gemini', 'gemini-2.5-flash', 'explanation', 250, 180, 0.00015, isoNow]);

      return {
        success: true,
        message: 'Demo çalışma verileri (oturumlar, çözülen sorular, ustalık skorları ve tekrar takvimi) başarıyla yüklendi.'
      };
    } catch (err: any) {
      console.error('Demo veri yükleme hatası:', err);
      return {
        success: false,
        message: `Demo veri yüklenirken hata oluştu: ${err.message}`
      };
    }
  }

  /**
   * Demo ve Kullanıcı Çalışma Verilerini Temizler (Çekirdek MEB müfredatını korur)
   */
  public static clearDemoData(): { success: boolean; message: string } {
    try {
      const db = getDb();

      // Only explicitly marked demo records may be removed.
      for (const table of ['answer_attempts', 'conversation_summaries', 'review_schedule', 'ai_usage', 'study_sessions']) {
        db.execute(`DELETE FROM ${table} WHERE id GLOB 'demo_*'`);
      }
      // Mastery aggregates can mix real and demo activity; preserve ambiguous records.

      return {
        success: true,
        message: 'Yalnızca demo işaretli kayıtlar silindi. Gerçek çalışma geçmişi ve ortak ustalık puanları korundu.'
      };
    } catch (err: any) {
      console.error('Demo veri temizleme hatası:', err);
      return {
        success: false,
        message: `Demo veriler temizlenirken hata oluştu: ${err.message}`
      };
    }
  }
}
