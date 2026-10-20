import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { EnglishCorpusEngine, SOURCE_ACCESS_REGISTRY } from '../services/englishCorpusEngine';
import { EnglishAiGenerator } from '../services/englishAiGenerator';
import { ENGLISH_LANGUAGE_SOURCES } from '../data/englishSources';

describe('Yapay Zekâ Destekli Lise 1 İngilizce Eğitim ve Veri Platformu Testleri', () => {
  beforeEach(async () => {
    const appDb = AppDatabase.getInstance();
    await appDb.initialize();
    EnglishCorpusEngine.initEngine();
  });

  it('1. 10 Belirlenen Kaynağın Tümü Lisans ve Erişim Siciline Doğru Kaydedilmelidir', () => {
    const sources = EnglishCorpusEngine.getSourceRegistry();
    expect(sources.filter(s=>s.id!=='src_local_examples').length).toBe(10);

    const sourceIds = sources.map(s => s.id);
    expect(sourceIds).toContain('src_openjam');
    expect(sourceIds).toContain('src_cefr_j');
    expect(sourceIds).toContain('src_free_dict_api');
    expect(sourceIds).toContain('src_tatoeba');
    expect(sourceIds).toContain('src_wordnet');
    expect(sourceIds).toContain('src_voa_learning');
    expect(sourceIds).toContain('src_british_council_teens');
    expect(sourceIds).toContain('src_cambridge_dict');
    expect(sourceIds).toContain('src_wiktionary');
    expect(sourceIds).toContain('src_cefr_coe');

    // Telifli kaynakların derin bağlantı / referans kuralı denetimi
    const cambridge = sources.find(s => s.id === 'src_cambridge_dict');
    expect(cambridge?.access_mode).toBe('deep_link');
    expect(cambridge?.license).toContain('Proprietary');

    const bcTeens = sources.find(s => s.id === 'src_british_council_teens');
    expect(bcTeens?.access_mode).toBe('deep_link');
  });

  it('2. Çekirdek Müfredat Kelimeleri, Tatoeba Cümleleri ve CEFR-J Kuralları Veritabanına Harmanlanmalıdır', () => {
    const stats = EnglishCorpusEngine.getCorpusStats();
    expect(stats.totalVocab).toBeGreaterThanOrEqual(10);
    expect(stats.totalSentences).toBeGreaterThanOrEqual(5);
    expect(stats.totalGrammarRules).toBeGreaterThanOrEqual(3);
    expect(stats.totalMaterials).toBeGreaterThanOrEqual(2);

    // CEFR A1, A2, B1 dağılımı mevcut olmalı
    expect(stats.cefrBreakdown['A1'] + stats.cefrBreakdown['A2'] + stats.cefrBreakdown['B1']).toBeGreaterThanOrEqual(10);
  });

  it('3. Kelime Sorgulama ve Tatoeba İki Dilli Cümle Çiftleri Doğru Eşleşmelidir', () => {
    const results = EnglishCorpusEngine.searchVocab('exchange');
    expect(results.length).toBeGreaterThanOrEqual(1);
    const item = results[0];
    expect(item.word).toBe('exchange');
    expect(item.cefr_level).toBe('A2');
    expect(item.turkish_meaning).toContain('değişim');

    // Kelimeye bağlı Tatoeba örnek cümlesi
    const sentences = EnglishCorpusEngine.getSentencesForWord(item.id);
    expect(sentences.length).toBeGreaterThanOrEqual(1);
    expect(sentences[0].en_sentence).toContain('exchange');
    expect(sentences[0].tr_sentence).toContain('değişim');
    expect(sentences[0].source_name).toBe('Yerel eğitim örnekleri');
  });

  it('4. Yeni Kelime Ekleme Kalite ve Karantina Kontrolünü Doğru Yürütmelidir', () => {
    // Geçerli kelime ekleme
    const validRes = EnglishCorpusEngine.ingestVocab({
      word: 'sustainable',
      cefr: 'B1',
      phonetic: '/səˈsteɪnəbl/',
      turkishMeaning: 'sürdürülebilir',
      meanings: [{ partOfSpeech: 'adj', definition: 'able to be maintained at a certain rate or level' }],
      sourceId: 'src_openjam',
      themeId: 'topic_eng_theme2'
    });
    expect(validRes.success).toBe(true);
    expect(validRes.status).toBe('active');

    // Geçersiz format (özel semboller) karantinaya alınmalı
    const invalidRes = EnglishCorpusEngine.ingestVocab({
      word: '123_invalid###',
      cefr: 'A1',
      turkishMeaning: 'geçersiz',
      meanings: [],
      sourceId: 'src_openjam'
    });
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.status).toBe('quarantine');

    // Boş Türkçe anlam karantinaya alınmalı
    const emptyTrRes = EnglishCorpusEngine.ingestVocab({
      word: 'biodiversity',
      cefr: 'B1',
      turkishMeaning: '',
      meanings: [],
      sourceId: 'src_openjam'
    });
    expect(emptyTrRes.success).toBe(false);
    expect(emptyTrRes.status).toBe('quarantine');
  });

  it('5. AI İçerik Üretici Kademeli Okuma Metni ve Boşluk Doldurma Alıştırması Üretip Önbelleğe Almalıdır', async () => {
    const reading = await EnglishAiGenerator.generateReadingPassage('topic_eng_theme1', 'A2');
    expect(reading.passageText.length).toBeGreaterThan(50);
    expect(reading.questions.length).toBeGreaterThanOrEqual(2);
    expect(reading.questions[0].correctAnswer).toBeDefined();

    // İkinci çağrıda yerel önbellek devreye girmeli (token tasarrufu)
    const cachedReading = await EnglishAiGenerator.generateReadingPassage('topic_eng_theme1', 'A2');
    expect(cachedReading.cached).toBe(true);

    // Boşluk doldurma (Cloze test)
    const cloze = await EnglishAiGenerator.generateClozeTest('topic_eng_theme2');
    expect(cloze.blanks.length).toBeGreaterThanOrEqual(2);
    expect(cloze.blanks[0].options.length).toBeGreaterThanOrEqual(2);
    expect(cloze.blanks[0].hint).toBeDefined();
  });

  it('6. Her Yanlış Cevapta Otomatik 3 Aşamalı Basitleştirilmiş Pedagojik Açıklama Üretilmelidir', () => {
    // 1. Yanlış Deneme
    const tier1 = EnglishAiGenerator.generateSimplerExplanation('What is your routine?', 'go', 1);
    expect(tier1.level).toBe(1);
    expect(tier1.explanation).toContain('İpucu (1. Yanlış)');
    expect(tier1.spokenText).toBeDefined();

    // 2. Yanlış Deneme
    const tier2 = EnglishAiGenerator.generateSimplerExplanation('What is your routine?', 'went', 2);
    expect(tier2.level).toBe(2);
    expect(tier2.explanation).toContain('Daha Basit İpucu (2. Yanlış)');

    // 3. Yanlış Deneme (Tam Çözüm ve Konu Sonu Tekrar Bilgisi)
    const tier3 = EnglishAiGenerator.generateSimplerExplanation('What is your routine?', 'goes', 3, 'goes');
    expect(tier3.level).toBe(3);
    expect(tier3.explanation).toContain('Tam Çözüm ve Basit Anlatım');
    expect(tier3.explanation).toContain('tekrar');
  });
});
