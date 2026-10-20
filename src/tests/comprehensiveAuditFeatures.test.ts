import { describe, it, expect, beforeEach, vi } from 'vitest';
import { phoneMicService } from '../services/phoneMicService';
import { AiAdapter } from '../services/aiAdapter';
import { AppDatabase, getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { OfflineQuestionEngine } from '../services/offlineQuestionEngine';

describe('Comprehensive Feature Audit Tests (Phone Mic, EVREN LLM, Exam Mode, Mistakes Notebook)', () => {
  beforeEach(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  // 1. Akıllı Telefon Kablosuz Mikrofon & Fallback Testi
  it('PhoneMicService initiates pairing session and emits QR pairing link', () => {
    const session = phoneMicService.initSession();
    expect(session.sessionId).toBeDefined();
    expect(session.sessionId.startsWith('pm_')).toBe(true);
    expect(session.qrUrl).toContain('mode=phone_mic');
    expect(session.qrUrl).toContain(session.sessionId);
    expect(phoneMicService.getStatus()).toBe('pairing');
  });

  it('PhoneMicService receives transcript via broadcast channel and fallback triggers on disconnect', () => {
    const session = phoneMicService.initSession();
    let transcriptReceived = '';

    phoneMicService.onTranscript((text) => {
      transcriptReceived = text;
    });

    // Simüle mobil ses paketi
    phoneMicService.handleIncomingAudioPacket({
      sessionId: session.sessionId,
      type: 'audio_transcript',
      transcript: 'Hücre zarının özellikleri nelerdir?'
    });

    expect(transcriptReceived).toBe('Hücre zarının özellikleri nelerdir?');

    // Bağlantı kopması simülasyonu -> PC mikrofonuna fallback
    phoneMicService.handleIncomingAudioPacket({
      sessionId: session.sessionId,
      type: 'phone_disconnect'
    });

    expect(phoneMicService.getStatus()).toBe('fallback_to_pc');
  });

  // 2. EVREN LLM API Entegrasyonu & Auto Yönlendirme Testi
  it('AiAdapter correctly configures and routes EVREN LLM platform endpoints', async () => {
    const db = getDb();
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
      'ai_provider',
      JSON.stringify('evren'),
      new Date().toISOString()
    ]);
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
      'api_key',
      JSON.stringify('test-evren-secret-key'),
      new Date().toISOString()
    ]);

    // Mock fetch for EVREN endpoint
    const originalFetch = global.fetch;
    let requestedUrl = '';
    let authHeader = '';

    global.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      requestedUrl = url;
      authHeader = opts.headers?.Authorization || '';
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'EVREN LLM T.C. Savunma Sanayii Başkanlığı altyapısıyla yanıt üretti.'
              }
            }
          ]
        })
      };
    }) as any;

    try {
      const resp = await AiAdapter.request({
        taskType: 'chat',
        userMessage: 'Merhaba EVREN',
        role: 'subject_teacher',
        subjectCode: 'MATH'
      });

      expect(requestedUrl).toBe('https://evren-llmapi.ssyz.org.tr/v1/chat/completions');
      expect(authHeader).toBe('Bearer test-evren-secret-key');
      expect(resp.text).toContain('EVREN LLM');
      expect(resp.provider).toBe('evren');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // 3. Sınav Modu & Ustalık & Yanlışlar Defteri Entegrasyon Testi
  it('OfflineQuestionEngine records exam attempts and transfers mistakes into review queue', () => {
    const db = getDb();
    const sessionId = OfflineQuestionEngine.startSession('subj_math', 'exam');

    // Yanlış cevap gönder
    const res = OfflineQuestionEngine.submitAnswer({
      sessionId,
      questionId: 'q_math_eq_1',
      studentAnswer: 'x = 999',
      hintsUsed: 0,
      timeSpentSeconds: 45,
      errorCategory: 'Kavram Yanılgısı'
    });

    expect(res.isCorrect).toBe(false);

    // Veritabanında answer_attempts tablosuna kaydedilmiş mi kontrol et
    const attempts = db.query<any>("SELECT * FROM answer_attempts WHERE question_id = 'q_math_eq_1' AND is_correct = 0");
    expect(attempts.length).toBeGreaterThan(0);
    expect(attempts[0].error_category).toBe('Kavram Yanılgısı');

    // Aralıklı tekrar çizelgesinde (review_schedule) yer aldı mı kontrol et
    const reviews = db.query<any>("SELECT * FROM review_schedule WHERE status = 'pending'");
    expect(reviews.length).toBeGreaterThan(0);
  });
});
