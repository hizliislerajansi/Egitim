import { getDb } from '../db/database';
import { TopicMastery, LearningStatus, ErrorCategory } from '../types/database';

export interface SpacedInterval {
  days: number;
  priority: 'low' | 'medium' | 'high';
}

export class MasteryEngine {
  /**
   * Aralıklı Tekrar Hesaplayıcısı (Spaced Repetition Algorithm)
   * 1. Hata -> 1 gün sonra (Yüksek Öncelik)
   * 1. Başarılı Tekrar -> 3 gün sonra (Orta Öncelik)
   * 2. Başarılı Tekrar -> 7 gün sonra (Düşük Öncelik)
   * 3. Başarılı Tekrar -> 14 gün sonra (Pekiştirilmiş)
   */
  public static calculateNextInterval(streak: number, isCorrect: boolean): SpacedInterval {
    if (!isCorrect) {
      return { days: 1, priority: 'high' };
    }

    switch (streak) {
      case 1:
        return { days: 3, priority: 'medium' };
      case 2:
        return { days: 7, priority: 'low' };
      case 3:
      default:
        return { days: 14, priority: 'low' };
    }
  }

  public static updateTopicMastery(
    topicId: string,
    isCorrect: boolean,
    hintsUsed: number,
    errorCategory?: ErrorCategory
  ): TopicMastery {
    const db = getDb();
    const existing = db.queryOne<TopicMastery>(
      "SELECT * FROM topic_mastery WHERE topic_id = ?",
      [topicId]
    );

    let score = existing ? existing.mastery_score : 0;
    let streak = existing ? existing.streak_correct : 0;
    const now = new Date().toISOString();

    if (isCorrect) {
      streak += 1;
      let gain = 25;
      if (hintsUsed === 1) gain = 15;
      else if (hintsUsed >= 2) gain = 8;

      score = Math.min(100, score + gain);
    } else {
      streak = 0;
      score = Math.max(0, score - 15);
    }

    // Durum belirleme: Yeni, Öğreniliyor, Pekişiyor, Hatırlatma Gerekli
    let status: LearningStatus = 'Yeni';
    if (score === 0) {
      status = 'Yeni';
    } else if (score < 70) {
      status = 'Öğreniliyor';
    } else {
      status = 'Pekişiyor';
    }

    // Aralıklı tekrar hesapla ve takvime ekle
    const interval = this.calculateNextInterval(streak, isCorrect);
    const reason = !isCorrect 
      ? `Yanlış cevap tekrarı (${errorCategory || 'Dikkatsizlik'})`
      : `Aralıklı pekiştirme (Seri: ${streak})`;

    this.scheduleReview(topicId, interval.days, interval.priority, reason);

    if (!isCorrect && score > 20) {
      status = 'Hatırlatma Gerekli';
    }

    const id = existing ? existing.id : `mastery_${topicId}`;
    db.execute(
      `INSERT OR REPLACE INTO topic_mastery (id, topic_id, mastery_score, status, streak_correct, last_studied_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, topicId, score, status, streak, now, now]
    );

    return {
      id,
      topic_id: topicId,
      mastery_score: score,
      status,
      streak_correct: streak,
      last_studied_at: now,
      updated_at: now
    };
  }

  public static scheduleReview(
    topicId: string,
    daysAhead: number,
    priority: 'low' | 'medium' | 'high',
    reason: string
  ): void {
    const db = getDb();
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    const scheduledDate = date.toISOString().split('T')[0];

    const id = `rev_${topicId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    db.execute(
      `INSERT INTO review_schedule (id, topic_id, scheduled_date, priority, status, reason, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [id, topicId, scheduledDate, priority, reason, now]
    );
  }

  /**
   * Aralıklı Tekrar Yığılmasını Önleme ve Yeniden Dengeleme Motoru
   * - Öğrencinin sisteme girmediği günlerde biriken geçmiş tekrarları tespit eder.
   * - Günlük maksimum soru limitini (varsayılan: 15) aşan tekrarları öncelik sırasına göre
   *   sonraki günlere yayarak öğrencinin motivasyonunu korur (Zero Pile-up).
   */
  public static rebalanceReviewSchedule(maxDailyLimit: number = 15): {
    rescheduledCount: number;
    todayReviewsCount: number;
  } {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Gecikmiş ve bugünkü bekleyen tekrarları önceliğe göre sırala (high > medium > low)
    const overdueOrToday = db.query<{
      id: string;
      topic_id: string;
      scheduled_date: string;
      priority: 'high' | 'medium' | 'low';
    }>(
      `SELECT id, topic_id, scheduled_date, priority 
       FROM review_schedule 
       WHERE status = 'pending' AND scheduled_date <= ? 
       ORDER BY 
         CASE priority 
           WHEN 'high' THEN 1 
           WHEN 'medium' THEN 2 
           WHEN 'low' THEN 3 
           ELSE 4 
         END ASC,
         scheduled_date ASC`,
      [today]
    );

    if (overdueOrToday.length <= maxDailyLimit) {
      return {
        rescheduledCount: 0,
        todayReviewsCount: overdueOrToday.length
      };
    }

    // İlk maxDailyLimit kadar olanı bugünde tut
    const toKeepToday = overdueOrToday.slice(0, maxDailyLimit);
    const toReschedule = overdueOrToday.slice(maxDailyLimit);

    let dayOffset = 1;
    let distributedInCurrentDay = 0;
    const maxPerNextDay = Math.max(5, Math.floor(maxDailyLimit / 2));

    for (const item of toReschedule) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + dayOffset);
      const newScheduledDate = nextDate.toISOString().split('T')[0];

      db.execute(
        "UPDATE review_schedule SET scheduled_date = ? WHERE id = ?",
        [newScheduledDate, item.id]
      );

      distributedInCurrentDay++;
      if (distributedInCurrentDay >= maxPerNextDay) {
        dayOffset++;
        distributedInCurrentDay = 0;
      }
    }

    return {
      rescheduledCount: toReschedule.length,
      todayReviewsCount: toKeepToday.length
    };
  }

  public static getAllMasteries(): (TopicMastery & { topic_name: string; unit: string; subject_id: string })[] {
    const db = getDb();
    return db.query(`
      SELECT m.*, t.name as topic_name, t.unit, t.subject_id
      FROM topic_mastery m
      JOIN topics t ON m.topic_id = t.id
      ORDER BY t.order_index ASC
    `);
  }

  /**
   * Başlangıç Seviye Tahmini (Diagnostic Evaluation)
   */
  public static evaluateDiagnosticLevel(correctCount: number, totalQuestions: number): {
    level: 'Temel' | 'Orta' | 'İleri';
    recommendation: string;
  } {
    const ratio = totalQuestions > 0 ? correctCount / totalQuestions : 0;
    if (ratio < 0.4) {
      return {
        level: 'Temel',
        recommendation: 'Kavram anlatımlarına ve kademeli ipuçlarına öncelik verilecek.'
      };
    } else if (ratio < 0.8) {
      return {
        level: 'Orta',
        recommendation: 'Standart MEB müfredat akışı ve soru çözüm atölyesiyle pekiştirilecek.'
      };
    } else {
      return {
        level: 'İleri',
        recommendation: 'Zorluk derecesi 4-5 olan ileri düzey sorular ve hızlı diyalog pratikleri sunulacak.'
      };
    }
  }
}
