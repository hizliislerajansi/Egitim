import { getDb } from '../db/database';
import { Question, AnswerAttempt, ErrorCategory } from '../types/database';
import { validateMathAnswer } from './mathValidator';
import { MasteryEngine } from './masteryEngine';

export interface AnswerResult {
  isCorrect: boolean;
  explanation: string;
  feedback: string;
  attemptId: string;
}

export class OfflineQuestionEngine {
  public static getQuestionsBySubject(subjectId: string): Question[] {
    const db = getDb();
    return db.query<Question>(`
      SELECT q.* FROM questions q
      JOIN topics t ON q.topic_id = t.id
      WHERE t.subject_id = ?
      ORDER BY t.order_index ASC, q.difficulty ASC
    `, [subjectId]);
  }

  public static getQuestionsByTopic(topicId: string): Question[] {
    const db = getDb();
    return db.query<Question>(`
      SELECT * FROM questions
      WHERE topic_id = ?
      ORDER BY difficulty ASC
    `, [topicId]);
  }

  public static getQuestionById(questionId: string): Question | null {
    const db = getDb();
    return db.queryOne<Question>(`
      SELECT * FROM questions WHERE id = ?
    `, [questionId]);
  }

  public static submitAnswer(params: {
    sessionId: string;
    questionId: string;
    studentAnswer: string;
    hintsUsed: number;
    timeSpentSeconds: number;
    errorCategory?: ErrorCategory;
  }): AnswerResult {
    const db = getDb();
    const question = this.getQuestionById(params.questionId);
    if (!question) {
      throw new Error(`Soru bulunamadı: ${params.questionId}`);
    }

    let isCorrect = false;
    let feedback = '';

    if (question.question_type === 'open_math') {
      const mathVal = validateMathAnswer(params.studentAnswer, question.correct_answer);
      isCorrect = mathVal.isValid;
      feedback = mathVal.feedback || (isCorrect ? 'Doğru cevap!' : 'Yanlış cevap.');
    } else {
      // Çoktan seçmeli veya metin eşleşmesi
      const normStudent = params.studentAnswer.trim().toLowerCase();
      const normCorrect = question.correct_answer.trim().toLowerCase();
      isCorrect = normStudent === normCorrect;
      feedback = isCorrect
        ? 'Harika! Doğru cevabı buldun.'
        : `Yanlış cevap. Doğru yanıt: ${question.correct_answer}`;
    }

    const attemptId = `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    // 1. Answer attempt kaydet
    db.execute(
      `INSERT INTO answer_attempts (id, session_id, question_id, student_answer, is_correct, hint_used_count, time_spent_seconds, error_category, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attemptId,
        params.sessionId,
        params.questionId,
        params.studentAnswer,
        isCorrect ? 1 : 0,
        params.hintsUsed,
        params.timeSpentSeconds,
        isCorrect ? null : (params.errorCategory || 'Dikkatsizlik'),
        now
      ]
    );

    // 2. Topic Mastery güncelle
    MasteryEngine.updateTopicMastery(
      question.topic_id,
      isCorrect,
      params.hintsUsed,
      params.errorCategory
    );

    return {
      isCorrect,
      explanation: question.explanation,
      feedback,
      attemptId
    };
  }

  public static startSession(subjectId: string, sessionType: 'offline_practice' | 'math_workshop' | 'english_lab' | 'review' | 'subject_workshop'): string {
    const db = getDb();
    const sessionId = `sess_${Date.now()}_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.execute(
      `INSERT INTO study_sessions (id, subject_id, start_time, duration_seconds, session_type)
       VALUES (?, ?, ?, 0, ?)`,
      [sessionId, subjectId, now, sessionType]
    );

    return sessionId;
  }

  public static endSession(sessionId: string, durationSeconds: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.execute(
      `UPDATE study_sessions
       SET end_time = ?, duration_seconds = ?
       WHERE id = ?`,
      [now, durationSeconds, sessionId]
    );
  }
}
