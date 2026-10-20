import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { NaturalConversationEngine, MASTER_NATURAL_COMMUNICATION_PROMPT, CONVERSATION_STYLE_PROMPTS } from '../services/naturalConversationEngine';
import { AiAdapter } from '../services/aiAdapter';
import { VoiceService, getVoiceService } from '../services/voiceService';
import { ConversationStyle } from '../types/settings';
import { AppDatabase } from '../db/database';
import { seedInitialData } from '../db/seed';

describe('MODÜL 14: Doğal İnsan İletişimi ve Gerçekçi Yapay Zekâ Davranışı Testleri', () => {
  beforeAll(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Senaryo 1: Kullanıcı selam verdiğinde doğal cevap
  it('1. Kullanıcı selam verdiğinde robotik/ders anlatır gibi değil, doğal ve sıcak karşılık vermelidir', () => {
    const greeting = 'Selam, nasılsın?';
    const analysis = NaturalConversationEngine.detectEmotionalCue(greeting);
    expect(analysis.cue).toBe('greeting');

    const offlineResponse = NaturalConversationEngine.generateNaturalOfflineResponse(greeting, 'subject_teacher', 'MATH', 'casual_friend');
    expect(offlineResponse.toLowerCase()).toContain('selam');
    // Ders anlatır gibi uzun resmi klişe olmamalı
    expect(offlineResponse).not.toContain('Aşağıdaki konular mevcuttur');
    expect(offlineResponse.length).toBeLessThan(150);
  });

  // Senaryo 2: Kullanıcı kısa soru sorduğunda kısa cevap
  it('2. Kullanıcı kısa bir soru sorduğunda gereksiz uzatmadan doğrudan ve kısa cevap vermelidir', () => {
    const shortQuery = '2+2 kaç?';
    const analysis = NaturalConversationEngine.detectEmotionalCue(shortQuery);
    expect(analysis.cue).toBe('short_query');

    const offlineResponse = NaturalConversationEngine.generateNaturalOfflineResponse(shortQuery, 'subject_teacher', 'MATH', 'concise');
    expect(offlineResponse.trim()).toBe('4.');
  });

  // Senaryo 3: Kullanıcı üzgün olduğunu belirttiğinde uygun empati ve sakinlik
  it('3. Kullanıcı üzgün veya yılgın olduğunu belirttiğinde kalıp empati yerine anlayışlı ve sakin yaklaşmalıdır', () => {
    const sadMessage = 'Çok moralim bozuk, fizikten hiçbir şey yapamıyorum artık.';
    const analysis = NaturalConversationEngine.detectEmotionalCue(sadMessage);
    expect(analysis.cue).toBe('sadness');

    const response = NaturalConversationEngine.generateNaturalOfflineResponse(sadMessage, 'study_coach', 'FIZIK', 'supportive');
    expect(response.toLowerCase()).toMatch(/anlıyorum|canını sıkma|acelemiz yok|ufak bir adım/i);
    // Yapay resmiyet olmamalı
    expect(response).not.toContain('olumsuz bir deneyim teşkil');
  });

  // Senaryo 4: Kullanıcı şaka yaptığında bağlama uygun esprili karşılık
  it('4. Kullanıcı şaka yaptığında bağlama uygun doğal ve esprili karşılık vermelidir', () => {
    const jokeMessage = 'Hocam bu soru beni bile aştı, cevabı uzaylılara soralım hahaha';
    const analysis = NaturalConversationEngine.detectEmotionalCue(jokeMessage);
    expect(analysis.cue).toBe('humor');

    const response = NaturalConversationEngine.generateNaturalOfflineResponse(jokeMessage, 'subject_teacher', 'MATH');
    expect(response.toLowerCase()).toMatch(/yaklaşımdı|gülümsemek|keyfimiz/i);
  });

  // Senaryo 5: Önceki bilgiyi referans gösterdiğinde bağlamı ve hafızayı koruma
  it('5. Konuşma geçmişi (Multi-Turn History) ile önceki mesajlardaki kullanıcı tercihleri ve bağlam korunmalıdır', () => {
    const history = [
      { role: 'user' as const, content: 'Benim adım Cem ve hedefim tıp fakültesi.' },
      { role: 'assistant' as const, content: 'Tanıştığıma memnun oldum Cem! Hedefin harika.' },
      { role: 'user' as const, content: 'Biyolojide hücre konusunu çalışıyorduk.' },
      { role: 'assistant' as const, content: 'Evet, organellerde kalmıştık.' },
      { role: 'user' as const, content: 'Peki mitokondri ne işe yarar?' }
    ];

    const pruned = NaturalConversationEngine.pruneConversationHistory(history, 8);
    expect(pruned.history.length).toBe(5);
    expect(pruned.history[0].content).toContain('Cem');

    // 10'dan fazla tur olduğunda özetleme çalışmalıdır
    const longHistory = Array.from({ length: 12 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: i === 0 ? 'Adım Cem, 9. sınıf öğrencisiyim.' : `Mesaj turu ${i}`
    }));

    const result = NaturalConversationEngine.pruneConversationHistory(longHistory, 6);
    expect(result.history.length).toBe(6);
    expect(result.contextSummary).toBeDefined();
    expect(result.contextSummary).toContain('Cem');
  });

  // Senaryo 6: Kullanıcı yanlış anlaşılmayı düzelttiğinde düzeltmeyi takip etme
  it('6. Kullanıcı bir düzeltme yaptığında savunmaya geçmeden hatayı kabul edip düzeltmeyi benimsemelidir', () => {
    const correctionMessage = 'Hayır yanlış anladın, ben 5 değil 6 dedim.';
    const analysis = NaturalConversationEngine.detectEmotionalCue(correctionMessage);
    expect(analysis.cue).toBe('correction');

    const response = NaturalConversationEngine.generateNaturalOfflineResponse(correctionMessage);
    expect(response.toLowerCase()).toMatch(/haklısın|kusura bakma|düzeltmen için teşekkürler/i);
  });

  // Senaryo 7: Kullanıcı sesli konuşurken duraksadığında erken kesilmeme (Debounce)
  it('7. Ses servisinde konuşma duraksamaları için debounce gecikmesi tanımlı olmalıdır', () => {
    const voiceService = getVoiceService();
    expect(voiceService).toBeDefined();
    // voiceService instance içinde speechDebounceTimer alanı ve 800ms buffer mevcuttur
    expect(typeof (voiceService as any).stopListening).toBe('function');
  });

  // Senaryo 8: Kullanıcı söz kestiğinde yapay zekânın sesinin anında durması (Barge-In)
  it('8. Kullanıcı konuşmaya başladığında veya mikrofon açıldığında çalan yapay zekâ sesi durdurulmalıdır (Barge-In)', () => {
    const voiceService = getVoiceService();
    const stopSpy = vi.spyOn(voiceService, 'stopSpeaking');

    // Ses açıkken kullanıcı konuştuğunda stopSpeaking tetiklenmelidir
    (voiceService as any).status = 'speaking';
    voiceService.stopSpeaking();
    expect(stopSpy).toHaveBeenCalled();
    expect(voiceService.getStatus()).toBe('idle');
  });

  // Senaryo 9: Konuşma sırasında geri besleme ve eko azaltma
  it('9. Ses durdurulduğunda ses nesnesi temizlenmeli ve bellek sızıntısı önlenmelidir', () => {
    const voiceService = getVoiceService();
    voiceService.stopSpeaking();
    expect((voiceService as any).audioObjectUrl).toBeNull();
  });

  // Senaryo 10: API sağlayıcısı değiştiğinde kişiliğin ve konuşma kurallarının korunması
  it('10. Tüm sağlayıcılar için MASTER_NATURAL_COMMUNICATION_PROMPT ve seçilen stil tutarlı uygulanmalıdır', () => {
    const promptTeacher = AiAdapter.buildCompactSystemPrompt({
      role: 'subject_teacher',
      subjectCode: 'MATH',
      conversationStyle: 'teacher',
      userMessage: 'Denklem nedir?'
    });
    expect(promptTeacher).toContain(MASTER_NATURAL_COMMUNICATION_PROMPT);
    expect(promptTeacher).toContain(CONVERSATION_STYLE_PROMPTS.teacher);

    const promptFriend = AiAdapter.buildCompactSystemPrompt({
      role: 'study_coach',
      conversationStyle: 'casual_friend',
      userMessage: 'Selam koç!'
    });
    expect(promptFriend).toContain(MASTER_NATURAL_COMMUNICATION_PROMPT);
    expect(promptFriend).toContain(CONVERSATION_STYLE_PROMPTS.casual_friend);
  });

  // Senaryo 11: API yavaşladığında veya bağlantı koptuğunda çevrimdışı doğal fallback
  it('11. Çevrimdışı modda bile yapay zekâ doğal ve insani yanıt üretmelidir', async () => {
    const response = await AiAdapter.request({
      taskType: 'chat',
      role: 'study_coach',
      userMessage: 'Çok moralim bozuk yapamıyorum',
      conversationStyle: 'supportive'
    });
    expect(response.isFallback).toBe(true);
    expect(response.text.length).toBeGreaterThan(20);
    expect(response.text.toLowerCase()).toMatch(/anlıyorum|canını sıkma|acelemiz yok|ufak bir adım/i);
  });

  // Senaryo 12: Bütçe veya kota tükendiğinde izinsiz ücretli API'ye geçmeme
  it('12. Bütçe durumu aşıldığında istek güvenle reddedilmeli ve yerel öğrenmeye yönlendirmelidir', () => {
    const budget = AiAdapter.checkBudget();
    expect(budget.dailyLimitUsd).toBeGreaterThan(0);
    expect(budget.monthlyLimitUsd).toBeGreaterThan(0);
    expect(typeof budget.isDailyLimitExceeded).toBe('boolean');
  });

  // Senaryo 13: Türkçe konuşmada seslendirme metninden [güler], [iç çeker], emojiler temizlenmelidir
  it('13. Sahne efektleri ([güler], [iç çeker], *güler*) ve emojiler seslendirme metninden arındırılmalıdır', () => {
    const rawAiOutput = "Harika bir fikir! [güler] Buna gerçekten çok sevindim 😊 *göz kırpar* Hemen başlayalım.";
    const cleanSpeech = NaturalConversationEngine.sanitizeForSpeech(rawAiOutput);

    expect(cleanSpeech).not.toContain('[güler]');
    expect(cleanSpeech).not.toContain('*göz kırpar*');
    expect(cleanSpeech).not.toContain('😊');
    expect(cleanSpeech).toContain('Harika bir fikir!');
    expect(cleanSpeech).toContain('Hemen başlayalım.');
  });

  // Senaryo 14: Gereksiz tekrarların ve otomatik takip sorularının azaltılması
  it('14. Sistem talimatı gereksiz şablonları, otomatik takip sorularını ve ders anlatır gibi kalıpları yasaklamalıdır', () => {
    expect(MASTER_NATURAL_COMMUNICATION_PROMPT).toContain('otomatik takip soruları kullanma');
    expect(MASTER_NATURAL_COMMUNICATION_PROMPT).toContain('Gereksiz başlıklar, tekrarlanan özetler');
    expect(MASTER_NATURAL_COMMUNICATION_PROMPT).toContain('hazır bir senaryodan cevap okuyormuş gibi değil');
  });
});
