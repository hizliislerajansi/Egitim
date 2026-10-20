import { describe, it, expect, beforeAll, vi } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { MEB_SUBJECTS, MEB_TOPICS } from '../data/mebCurriculum';
import { SpeechPhonetics } from '../services/speechPhonetics';
import { getVoiceService } from '../services/voiceService';
import { DEFAULT_CONFIG, YOUNG_MALE_VOICE_PRESETS, getDefaultYoungMaleVoice } from '../types/settings';
import { MEDIA_OPTIONS } from '../services/mediaCatalog';
import { saveCredential } from '../services/apiClient';
import { parseGeneratedMedia } from '../services/mediaService';

describe('Tüm Dersler, EMA Ana Ses ve API Yedeği Testleri', () => {
  beforeAll(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  it('1. MEB ve EBA Lise 1 için tüm derslerin tamamı tanımlı ve veritabanında mevcut olmalıdır', () => {
    expect(MEB_SUBJECTS.length).toBeGreaterThanOrEqual(9);
    const codes = MEB_SUBJECTS.map(s => s.code);
    expect(codes).toContain('MATH');
    expect(codes).toContain('TURK');
    expect(codes).toContain('FIZIK');
    expect(codes).toContain('KIMYA');
    expect(codes).toContain('BIYOLOJI');
    expect(codes).toContain('TARIH');
    expect(codes).toContain('COGRAFYA');
    expect(codes).toContain('ENG');
    expect(codes).toContain('DIN');
    expect(codes).toContain('SAGLIK');
    expect(codes).toContain('ALMANCA');
    expect(codes).toContain('BILISIM');

    const db = getDb();
    const dbSubjects = db.query<{ count: number }>("SELECT COUNT(*) as count FROM subjects")[0]?.count;
    expect(dbSubjects).toBeGreaterThanOrEqual(9);
  });

  it('2. Matematik dersi felsefeyle karışmamalı, saf cebir ve geometri konularına odaklanmalıdır', () => {
    const mathTopics = MEB_TOPICS.filter(t => t.subject_id === 'subj_math');
    expect(mathTopics.length).toBeGreaterThanOrEqual(6);

    const topicNames = mathTopics.map(t => t.name.toLowerCase());
    expect(topicNames.some(n => n.includes('denklem'))).toBe(true);
    expect(topicNames.some(n => n.includes('küme'))).toBe(true);
    expect(topicNames.some(n => n.includes('mutlak değer'))).toBe(true);
    expect(topicNames.some(n => n.includes('üçgen'))).toBe(true);

    const logicTopic = mathTopics.find(t => t.id === 'topic_math_logic');
    expect(logicTopic?.unit).toContain('Sembolik Mantık');
  });

  it('3. SpeechPhonetics: Büyük harfli kelimeleri harf harf kodlamadan doğal kelimeye dönüştürmelidir (Örn: CAR -> Car)', () => {
    const visualText = "Look at that CAR on the street.";
    const spoken = SpeechPhonetics.toSpokenText(visualText, 'en-US');
    expect(spoken).toContain('Car');
    expect(spoken).not.toContain('C-A-R');
  });

  it('4. SpeechPhonetics: Matematik ve fen sembollerini seslendirilebilir konuşmaya çevirmelidir', () => {
    const mathFormula = "s(A ∪ B) = s(A) + s(B) - s(A ∩ B) ve |2x - 6| ≤ 10";
    const spoken = SpeechPhonetics.toSpokenText(mathFormula, 'tr-TR');
    
    expect(spoken).toContain('birleşim');
    expect(spoken).toContain('kesişim');
    expect(spoken).toContain('mutlak değer');
    expect(spoken).toContain('küçük eşittir');
    expect(spoken).not.toContain('∪');
    expect(spoken).not.toContain('∩');
  });

  it('5. SpeechPhonetics: Boşluk doldurma (____) işaretlerini "boşluk" veya "blank" olarak telaffuz etmelidir', () => {
    const trBlank = "Cümledeki _____ yerine uygun kelimeyi yazınız.";
    expect(SpeechPhonetics.toSpokenText(trBlank, 'tr-TR')).toContain('boşluk');

    const enBlank = "Where _____ you from?";
    expect(SpeechPhonetics.toSpokenText(enBlank, 'en-US')).toContain('blank');
  });

  it('6. EMA varsayılan ses olmalı; Gemini adaptörü isteğe bağlı kullanılabilmelidir', async () => {
    const voiceService = getVoiceService();
    expect(voiceService).toBeDefined();
    expect(typeof voiceService.speak).toBe('function');
    expect(typeof voiceService.stopSpeaking).toBe('function');
    expect(typeof voiceService.speakGeminiAudio).toBe('function');
    expect(typeof voiceService.speakOpenAI).toBe('function');
    expect(typeof voiceService.speakElevenLabs).toBe('function');
    expect(typeof voiceService.speakCartesia).toBe('function');

    // Varsayılan ana sesin gemini-3.8-flash-tts ve Genç Erkek Sesi (Puck) olduğunu doğrula
    expect(DEFAULT_CONFIG.voice_provider).toBe('ema_local');
    expect(DEFAULT_CONFIG.voice_tts_model).toBe('gemini-3.8-flash-tts');
    expect(DEFAULT_CONFIG.voice_model_name).toBe('EMA');
    expect(DEFAULT_CONFIG.focus_mode).toBe(true);
    expect(getDefaultYoungMaleVoice('gemini_speech')).toBe('Puck');
    expect(MEDIA_OPTIONS[0].id).toBe('ema_local');
    expect(MEDIA_OPTIONS.find(o=>o.id==='gemini_tts')?.model).toBe('gemini-3.8-flash-tts');
    expect(MEDIA_OPTIONS[0].docs).toContain('ema-lightning');

    // Gemini 3.8 TTS steps[].content[] ham REST JSON yanıtının doğru ayrıştırıldığını doğrula
    const rawStepsResponse = {
      steps: [
        {
          type: 'model_output',
          content: [{ type: 'audio', data: 'UklGRgQAAABXQVZF', mime_type: 'audio/wav' }]
        }
      ]
    };
    const wavBlob = parseGeneratedMedia('gemini_tts', rawStepsResponse);
    expect(wavBlob.type).toBe('audio/wav');

    // speakGeminiAudio çağrısının gemini-3.8-flash-tts ve Puck ile /v1beta/interactions uç noktasına gittiğini doğrula
    await saveCredential('gemini', 'test-gemini-38-key');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(rawStepsResponse), { headers: { 'Content-Type': 'application/json' } })
    );
    await voiceService.speakGeminiAudio('Merhaba gençler!', 'Puck', undefined, 'gemini-3.8-flash-tts');
    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
    const parsedBody = JSON.parse(String(calledInit?.body));
    expect(calledUrl).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(parsedBody.model).toBe('gemini-3.8-flash-tts');
    expect(parsedBody.generation_config.speech_config[0].voice).toBe('Puck');
    expect(parsedBody.input[0].content[0].annotations[0].type).toBe('speech_metadata');
    fetchSpy.mockRestore();
  });

  it('7. Google Gemini Speech API: pcmBase64ToWavBlob raw 24kHz PCM verisini geçerli WAV Blob a dönüştürmelidir', async () => {
    const { pcmBase64ToWavBlob } = await import('../services/mediaService');
    const mockPcm = btoa(String.fromCharCode(...new Array(100).fill(0)));
    const wavBlob = pcmBase64ToWavBlob(mockPcm, 24000);

    expect(wavBlob).toBeDefined();
    expect(wavBlob.type).toBe('audio/wav');
    expect(wavBlob.size).toBe(44 + 100);

    const arrayBuffer = await wavBlob.arrayBuffer();
    const view = new DataView(arrayBuffer);
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    const sampleRate = view.getUint32(24, true);

    expect(riff).toBe('RIFF');
    expect(wave).toBe('WAVE');
    expect(sampleRate).toBe(24000);
  });
});
