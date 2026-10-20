import { getDb } from '../db/database';
import { ENGLISH_LANGUAGE_SOURCES } from '../data/englishSources';

export interface SourceRegistryItem {
  id: string;
  name: string;
  url: string;
  category: string;
  license: string;
  access_mode: 'rest_api' | 'open_dataset' | 'deep_link' | 'ai_synthesis';
  status: 'online' | 'degraded' | 'restricted' | 'cached';
  last_checked_at: string;
  item_count: number;
  notes: string;
}

export interface CorpusVocabItem {
  id: string;
  word: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2';
  phonetic?: string;
  audio_url?: string;
  meanings_json: string;
  turkish_meaning: string;
  synonyms_json?: string;
  source_id: string;
  license: string;
  theme_id: string;
  status: 'active' | 'quarantine';
  created_at: string;
  updated_at: string;
}

export interface CorpusSentenceItem {
  id: string;
  vocab_id?: string;
  en_sentence: string;
  tr_sentence: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2';
  source_name: string;
  license: string;
  theme_id: string;
  created_at: string;
}

export interface CorpusGrammarRule {
  id: string;
  theme_id: string;
  title: string;
  cefr_level: 'A1' | 'A2' | 'B1';
  rule_summary: string;
  examples_json: string;
  common_mistakes_json?: string;
  source_name: string;
  created_at: string;
}

export interface CorpusLearningMaterial {
  id: string;
  theme_id: string;
  material_type: 'reading' | 'dialogue' | 'listening_script' | 'exercise' | 'cloze_test';
  title: string;
  content_text: string;
  cefr_level: 'A1' | 'A2' | 'B1';
  metadata_json?: string;
  source_name: string;
  license: string;
  created_at: string;
}

export interface CorpusStats {
  totalVocab: number;
  totalSentences: number;
  totalGrammarRules: number;
  totalMaterials: number;
  quarantinedCount: number;
  cefrBreakdown: Record<string, number>;
  sourceCount: number;
  sourcesOnline: number;
}

// 10 Açık ve Yasal Kaynak Lisans ve Erişim Haritası
export const SOURCE_ACCESS_REGISTRY: Record<string, {
  license: string;
  accessMode: 'rest_api' | 'open_dataset' | 'deep_link' | 'ai_synthesis';
  notes: string;
}> = {
  src_openjam: {
    license: 'MIT / CC-BY-SA 4.0',
    accessMode: 'open_dataset',
    notes: 'Açık veri deposu; CEFR seviyeleri ve 9. sınıf kelime etiketleri yerel veritabanında saklanır.'
  },
  src_cefr_j: {
    license: 'CC-BY-SA 4.0',
    accessMode: 'open_dataset',
    notes: 'Avrupa Konseyi standartlarına uyarlanmış açık dil bilgisi ağacı ve can-do profilleri.'
  },
  src_free_dict_api: {
    license: 'Açık Genel Kullanım (Zero-Key API)',
    accessMode: 'rest_api',
    notes: 'Doğrudan REST API; IPA fonetik ve MP3 telaffuz sesleri dinamik sorgulanır.'
  },
  src_tatoeba: {
    license: 'CC-BY 2.0 FR',
    accessMode: 'open_dataset',
    notes: 'Açık cümle çiftleri; İngilizce-Türkçe örnek cümleler telif riski olmadan yerel harmanlanır.'
  },
  src_wordnet: {
    license: 'WordNet 3.0 License (BSD-style)',
    accessMode: 'open_dataset',
    notes: 'Princeton semantik sözlüğü; eş anlam ve kavramsal ilişkiler için açıkça kullanılabilir.'
  },
  src_voa_learning: {
    license: 'Kamu Malı / Adil Kullanım (Public Domain)',
    accessMode: 'open_dataset',
    notes: 'Kademeli sesli metinler ve basitleştirilmiş İngilizce okuma parçaları formatı.'
  },
  src_british_council_teens: {
    license: 'Telif Hakkı Saklıdır (Proprietary - Sadece Referans)',
    accessMode: 'deep_link',
    notes: 'İzinsiz scraping YAPILMAZ; kullanıcıya bağlamsal derin bağlantı ve özgün pedagojik eşdeğer sunulur.'
  },
  src_cambridge_dict: {
    license: 'Telif Hakkı Saklıdır (Proprietary - Sözlük Lisansı)',
    accessMode: 'deep_link',
    notes: 'Doğrudan scraping yapılmaz; kelime kartlarından derin bağlantı ile akademik referans verilir.'
  },
  src_wiktionary: {
    license: 'CC-BY-SA 3.0 / GFDL',
    accessMode: 'open_dataset',
    notes: 'Wikimedia açık sözlüğü; morfoloji, etimoloji ve ek tanımlar için serbestçe türetilebilir.'
  },
  src_cefr_coe: {
    license: 'Avrupa Konseyi Resmi Standart',
    accessMode: 'open_dataset',
    notes: 'Resmi A1-C2 yeterlilik göstergeleri; MEB müfredat kazanımları ile tam uyumlu.'
  }
};

export class EnglishCorpusEngine {
  private static isInitialized = false;

  /**
   * Corpus Motorunu ve Kaynak Sicilini Başlatır
   */
  public static initEngine(): void {
    if (this.isInitialized) return;
    const db = getDb();
    db.transaction(()=>{

    // 1. Kaynak Sicilini Güncelle/Ekle
    db.run(`INSERT OR IGNORE INTO english_source_registry
      (id,name,url,category,license,access_mode,status,last_checked_at,item_count,notes)
      VALUES ('src_local_examples','Yerel eğitim örnekleri','/dersler/ingilizce?lab=plan','local','Uygulama içi örnek içerik','ai_synthesis','cached','',0,'Kodda tanımlı yerel örnekler; dış veri aktarımı veya harici lisans onayı değildir.')`);
    for (const src of ENGLISH_LANGUAGE_SOURCES) {
      const access = SOURCE_ACCESS_REGISTRY[src.id] || {
        license: 'Açık Kaynak',
        accessMode: 'open_dataset',
        notes: src.integrationNote
      };

      const existing = db.queryOne<{ id: string }>(
        'SELECT id FROM english_source_registry WHERE id = ?',
        [src.id]
      );

      if (!existing) {
        db.run(
          `INSERT INTO english_source_registry (id, name, url, category, license, access_mode, status, last_checked_at, item_count, notes)
           VALUES (?, ?, ?, ?, ?, ?, 'cached', ?, 0, ?)`,
          [src.id, src.name, src.url, src.category, access.license, access.accessMode, '', access.notes]
        );
      }
    }

    // 2. MEB 9. Sınıf Temel Kelime & Cümle Verilerini Çekirdek Olarak Yükle
    this.seedCurriculumCorpus();
    });
    this.isInitialized = true;
  }

  /**
   * MEB 9. Sınıf 10 Teması İçin Çekirdek Açık Kelime ve Cümle Havuzu
   */
  public static seedCurriculumCorpus(): void {
    const db = getDb();
    const countRow = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM english_corpus_vocab');
    if (countRow && countRow.count >= 20) {
      return; // Zaten çekirdek veriler mevcut
    }

    const starterData: Array<{
      word: string;
      cefr: 'A1' | 'A2' | 'B1';
      phonetic: string;
      tr: string;
      themeId: string;
      definitions: Array<{ partOfSpeech: string; definition: string; example: string }>;
      synonyms: string[];
      tatoebaSentenceEn: string;
      tatoebaSentenceTr: string;
    }> = [
      // Theme 1: Studying Abroad
      {
        word: 'exchange',
        cefr: 'A2',
        phonetic: '/ɪksˈtʃeɪndʒ/',
        tr: 'değişim, takas etmek, karşılıklı alıp vermek',
        themeId: 'topic_eng_theme1',
        definitions: [
          { partOfSpeech: 'noun', definition: 'The act of giving something and receiving something in return.', example: 'He joined an international exchange student programme.' }
        ],
        synonyms: ['swap', 'trade', 'interchange'],
        tatoebaSentenceEn: 'I met friendly students during the exchange semester in London.',
        tatoebaSentenceTr: 'Londra’daki değişim döneminde cana yakın öğrencilerle tanıştım.'
      },
      {
        word: 'neighborhood',
        cefr: 'A2',
        phonetic: '/ˈneɪbərhʊd/',
        tr: 'mahalle, çevre, muhit',
        themeId: 'topic_eng_theme2',
        definitions: [
          { partOfSpeech: 'noun', definition: 'A district, especially one forming a community within a town or city.', example: 'Our neighborhood has a modern library and a clean park.' }
        ],
        synonyms: ['district', 'quarter', 'vicinity'],
        tatoebaSentenceEn: 'There is a bakery and a bus stop in my neighborhood.',
        tatoebaSentenceTr: 'Mahallemde bir fırın ve bir otobüs durağı var.'
      },
      {
        word: 'tradition',
        cefr: 'A2',
        phonetic: '/trəˈdɪʃən/',
        tr: 'gelenek, görenek, adet',
        themeId: 'topic_eng_theme6',
        definitions: [
          { partOfSpeech: 'noun', definition: 'The transmission of customs or beliefs from generation to generation.', example: 'It is a family tradition to eat dinner together on Sundays.' }
        ],
        synonyms: ['custom', 'heritage', 'ritual'],
        tatoebaSentenceEn: 'Turkish tea hospitality is an important cultural tradition.',
        tatoebaSentenceTr: 'Türk çayı ikramı önemli bir kültürel gelenektir.'
      },
      {
        word: 'environment',
        cefr: 'B1',
        phonetic: '/ɪnˈvaɪrənmənt/',
        tr: 'çevre, ortam, doğa',
        themeId: 'topic_eng_theme4',
        definitions: [
          { partOfSpeech: 'noun', definition: 'The surroundings or conditions in which a person, animal, or plant lives.', example: 'We must plant trees to protect our natural environment.' }
        ],
        synonyms: ['surroundings', 'nature', 'ecosystem'],
        tatoebaSentenceEn: 'We should keep our environment clean for future generations.',
        tatoebaSentenceTr: 'Gelecek nesiller için çevremizi temiz tutmalıyız.'
      },
      {
        word: 'achievement',
        cefr: 'B1',
        phonetic: '/əˈtʃiːvmənt/',
        tr: 'başarı, kazanım, elde edilen sonuç',
        themeId: 'topic_eng_theme5',
        definitions: [
          { partOfSpeech: 'noun', definition: 'A thing done successfully with effort, skill, or courage.', example: 'Winning the national science fair was her greatest achievement.' }
        ],
        synonyms: ['success', 'accomplishment', 'triumph'],
        tatoebaSentenceEn: 'Aziz Sancar won the Nobel Prize, a historic achievement for Turkey.',
        tatoebaSentenceTr: 'Aziz Sancar Nobel Ödülü kazandı; bu Türkiye için tarihi bir başarıydı.'
      },
      {
        word: 'monument',
        cefr: 'A2',
        phonetic: '/ˈmɒnjʊmənt/',
        tr: 'anıt, tarihi eser, abide',
        themeId: 'topic_eng_theme7',
        definitions: [
          { partOfSpeech: 'noun', definition: 'A statue, building, or other structure erected to commemorate a notable person or event.', example: 'Anıtkabir is an iconic national monument in Ankara.' }
        ],
        synonyms: ['memorial', 'statue', 'shrine'],
        tatoebaSentenceEn: 'The ancient monument attracts thousands of visitors every summer.',
        tatoebaSentenceTr: 'Antik anıt her yaz binlerce ziyaretçi çekmektedir.'
      },
      {
        word: 'emergency',
        cefr: 'A2',
        phonetic: '/ɪˈmɜːdʒənsi/',
        tr: 'acil durum, beklenmedik tehlike',
        themeId: 'topic_eng_theme8',
        definitions: [
          { partOfSpeech: 'noun', definition: 'A serious, unexpected, and often dangerous situation requiring immediate action.', example: 'Call 112 in case of a medical emergency.' }
        ],
        synonyms: ['crisis', 'urgency', 'hazard'],
        tatoebaSentenceEn: 'Paramedics reacted promptly to the emergency call.',
        tatoebaSentenceTr: 'Sağlık ekipleri acil durum çağrısına derhal müdahale etti.'
      },
      {
        word: 'invitation',
        cefr: 'A1',
        phonetic: '/ˌɪnvɪˈteɪʃən/',
        tr: 'davetiye, davet, çağrı',
        themeId: 'topic_eng_theme9',
        definitions: [
          { partOfSpeech: 'noun', definition: 'A written or spoken request considering someone to attend an event.', example: 'I sent an invitation to my classmates for the party.' }
        ],
        synonyms: ['request', 'call', 'offer'],
        tatoebaSentenceEn: 'Thank you for your kind invitation to the ceremony.',
        tatoebaSentenceTr: 'Törene nazik davetiniz için teşekkür ederim.'
      },
      {
        word: 'broadcast',
        cefr: 'B1',
        phonetic: '/ˈbrɔːdkɑːst/',
        tr: 'yayın, radyo veya televizyon yayını yapmak',
        themeId: 'topic_eng_theme10',
        definitions: [
          { partOfSpeech: 'noun', definition: 'A radio or television programme or transmission.', example: 'The educational channel will broadcast the debate live.' }
        ],
        synonyms: ['transmission', 'telecast', 'show'],
        tatoebaSentenceEn: 'The news broadcast started at eight o clock.',
        tatoebaSentenceTr: 'Haber yayını saat sekizde başladı.'
      },
      {
        word: 'documentary',
        cefr: 'A2',
        phonetic: '/ˌdɒkjʊˈmentəri/',
        tr: 'belgesel film veya program',
        themeId: 'topic_eng_theme3',
        definitions: [
          { partOfSpeech: 'noun', definition: 'A film or television programme giving factual information about a subject.', example: 'We watched an inspiring documentary about ocean wildlife.' }
        ],
        synonyms: ['factual film', 'report', 'feature'],
        tatoebaSentenceEn: 'The documentary explained how renewable energy saves resources.',
        tatoebaSentenceTr: 'Belgesel yenilenebilir enerjinin kaynakları nasıl koruduğunu açıkladı.'
      }
    ];

    const now = new Date().toISOString();

    for (const item of starterData) {
      const vocabId = `vocab_${item.word.toLowerCase()}`;
      try {
        db.run(
          `INSERT OR IGNORE INTO english_corpus_vocab 
           (id, word, cefr_level, phonetic, audio_url, meanings_json, turkish_meaning, synonyms_json, source_id, license, theme_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'src_local_examples', 'Uygulama içi örnek içerik', ?, 'active', ?, ?)`,
          [
            vocabId,
            item.word,
            item.cefr,
            item.phonetic,
            '',
            JSON.stringify(item.definitions),
            item.tr,
            JSON.stringify(item.synonyms),
            item.themeId,
            now,
            now
          ]
        );

        // Tatoeba Cümle Çifti Ekle
        const sentenceId = `sent_${item.word.toLowerCase()}_1`;
        db.run(
          `INSERT OR IGNORE INTO english_corpus_sentences
           (id, vocab_id, en_sentence, tr_sentence, cefr_level, source_name, license, theme_id, created_at)
           VALUES (?, ?, ?, ?, ?, 'Yerel eğitim örnekleri', 'Uygulama içi örnek içerik', ?, ?)`,
          [
            sentenceId,
            vocabId,
            item.tatoebaSentenceEn,
            item.tatoebaSentenceTr,
            item.cefr,
            item.themeId,
            now
          ]
        );
        // Correct only unchanged bundled examples, never imported or edited student text.
        db.run('UPDATE english_corpus_vocab SET source_id=?,license=? WHERE id=? AND meanings_json=? AND turkish_meaning=?',
          ['src_local_examples','Uygulama içi örnek içerik',vocabId,JSON.stringify(item.definitions),item.tr]);
        db.run('UPDATE english_corpus_sentences SET source_name=?,license=? WHERE id=? AND en_sentence=? AND tr_sentence=?',
          ['Yerel eğitim örnekleri','Uygulama içi örnek içerik',sentenceId,item.tatoebaSentenceEn,item.tatoebaSentenceTr]);
      } catch (err) {
        console.warn(`Corpus seeding warning for word ${item.word}:`, err);
      }
    }

    // CEFR-J Gramer Kurallarını Ekle
    this.seedGrammarRules();
    // Okuma ve Boşluk Doldurma Materyallerini Ekle
    this.seedLearningMaterials();
  }

  /**
   * CEFR-J Açık Dil Bilgisi Kurallarını Ekler
   */
  private static seedGrammarRules(): void {
    const db = getDb();
    const rules = [
      {
        id: 'gram_present_simple',
        theme_id: 'topic_eng_theme1',
        title: 'Present Simple & Daily Routines',
        cefr_level: 'A1' as const,
        rule_summary: 'Alışkanlıklar, rutinler ve genel doğruları ifade etmek için geniş zaman (Present Simple) kullanılır. 3. tekil şahısta (He/She/It) fiil sonuna -s/-es/-ies takısı gelir.',
        examples: [
          'I live on a university campus during the semester.',
          'She speaks English fluently with her exchange classmates.',
          'Do you take notes in your morning lectures?'
        ],
        mistakes: [
          'He go to school (YANLIŞ) -> He goes to school (DOĞRU)',
          'She doesn’t likes tea (YANLIŞ) -> She doesn’t like tea (DOĞRU)'
        ],
        source: 'Open Language Profiles (CEFR-J A1.1)'
      },
      {
        id: 'gram_comparatives',
        theme_id: 'topic_eng_theme2',
        title: 'Comparatives & Superlatives (Environment & Cities)',
        cefr_level: 'A2' as const,
        rule_summary: 'İki şeyi karşılaştırırken kısa sıfatlara -er + than, uzun sıfatlara more + than eklenir. En üstünlük (Superlative) durumunda ise the -est veya the most kullanılır.',
        examples: [
          'My neighborhood is quieter than the downtown center.',
          'Public transport is more convenient than driving in heavy traffic.',
          'Ankara is one of the cleanest cities in the region.'
        ],
        mistakes: [
          'More bigger than (YANLIŞ) -> Bigger than (DOĞRU)',
          'The most easy route (YANLIŞ) -> The easiest route (DOĞRU)'
        ],
        source: 'Open Language Profiles (CEFR-J A2.2)'
      },
      {
        id: 'gram_past_simple',
        theme_id: 'topic_eng_theme5',
        title: 'Past Simple & Historical Achievements',
        cefr_level: 'A2' as const,
        rule_summary: 'Geçmişte tamamlanmış eylemleri ve tarihi başarıları anlatırken Past Simple kullanılır. Düzenli fiiller -ed alır, düzensiz fiiller 2. halleriyle kullanılır.',
        examples: [
          'Aziz Sancar graduated from Istanbul Faculty of Medicine in 1969.',
          'Scientists discovered a new renewable energy method last year.',
          'Did they publish their research paper in an international journal?'
        ],
        mistakes: [
          'He didn’t went (YANLIŞ) -> He didn’t go (DOĞRU)',
          'They winned the medal (YANLIŞ) -> They won the medal (DOĞRU)'
        ],
        source: 'Open Language Profiles (CEFR-J A2.1)'
      }
    ];

    const now = new Date().toISOString();
    for (const r of rules) {
      db.run(
        `INSERT OR IGNORE INTO english_grammar_rules
         (id, theme_id, title, cefr_level, rule_summary, examples_json, common_mistakes_json, source_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.theme_id, r.title, r.cefr_level, r.rule_summary, JSON.stringify(r.examples), JSON.stringify(r.mistakes), 'Yerel eğitim örnekleri', now]
      );
      db.run('UPDATE english_grammar_rules SET source_name=? WHERE id=? AND rule_summary=?',['Yerel eğitim örnekleri',r.id,r.rule_summary]);
    }
  }

  /**
   * Kademeli Okuma Metinleri ve Boşluk Doldurma Alıştırmalarını Ekler
   */
  private static seedLearningMaterials(): void {
    const db = getDb();
    const materials = [
      {
        id: 'mat_reading_theme1',
        theme_id: 'topic_eng_theme1',
        material_type: 'reading' as const,
        title: 'My First Week in the Student Exchange Programme',
        cefr_level: 'A2' as const,
        content_text: `Hello everyone! My name is Deniz and I am a 9th-grade student from Izmir. This semester, I am participating in an international exchange programme in Edinburgh. Living with a local host family is a wonderful tradition that helps me practice my English every single morning. The school campus is very green, and the students are respectful and friendly. We explore the historical monuments after classes and share our cultural traditions. I have already learned how to navigate public transport and exchange ideas with international friends.`,
        source_name: 'VOA Graded Style & MEB Outcomes',
        license: 'Public Domain / Open Educational',
        metadata: {
          comprehensionQuestions: [
            { id: 'q1', question: 'Where is Deniz spending the exchange semester?', options: ['London', 'Edinburgh', 'Dublin', 'Cardiff'], correctAnswer: 'Edinburgh', explanation: 'Deniz mentions Edinburgh in the text.' },
            { id: 'q2', question: 'Who does Deniz live with?', options: ['In a hotel', 'Alone in a flat', 'With a local host family', 'In a tent'], correctAnswer: 'With a local host family', explanation: 'Deniz lives with a local host family.' },
            { id: 'q3', question: 'What do students do after classes?', options: ['Play video games', 'Explore historical monuments', 'Sleep immediately', 'Go to the airport'], correctAnswer: 'Explore historical monuments', explanation: 'Students explore historical monuments after classes.' }
          ]
        }
      },
      {
        id: 'mat_cloze_theme2',
        theme_id: 'topic_eng_theme2',
        material_type: 'cloze_test' as const,
        title: 'Living in a Sustainable Neighborhood (Boşluk Doldurma)',
        cefr_level: 'A2' as const,
        content_text: `Our [blank1] is located near the city center. We must protect our natural [blank2] by planting trees and recycling paper. To reduce air pollution, many people use public [blank3] instead of personal cars. Walking along pedestrian lanes is both healthy and [blank4].`,
        source_name: 'CEFR-J A2 Profile Task',
        license: 'CC-BY-SA 4.0',
        metadata: {
          blanks: [
            { id: 'blank1', correct: 'neighborhood', options: ['neighborhood', 'tradition', 'achievement'], hint: 'Yaşadığın yerleşim yeri veya muhit' },
            { id: 'blank2', correct: 'environment', options: ['environment', 'broadcast', 'invitation'], hint: 'Doğal çevre ve ekosistem' },
            { id: 'blank3', correct: 'transport', options: ['transport', 'emergency', 'monument'], hint: 'Toplu taşıma vasıtaları' },
            { id: 'blank4', correct: 'enjoyable', options: ['enjoyable', 'dangerous', 'polluted'], hint: 'Keyifli ve hoş olan durum' }
          ]
        }
      }
    ];

    const now = new Date().toISOString();
    for (const m of materials) {
      db.run(
        `INSERT OR IGNORE INTO english_learning_materials
         (id, theme_id, material_type, title, content_text, cefr_level, metadata_json, source_name, license, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.theme_id, m.material_type, m.title, m.content_text, m.cefr_level, JSON.stringify(m.metadata), 'Yerel eğitim örnekleri', 'Uygulama içi örnek içerik', now]
      );
      db.run('UPDATE english_learning_materials SET source_name=?,license=? WHERE id=? AND content_text=?',['Yerel eğitim örnekleri','Uygulama içi örnek içerik',m.id,m.content_text]);
    }
  }

  /**
   * Tüm 10 Kaynağın Durumunu ve Lisans Sicilini Getirir
   */
  public static getSourceRegistry(): SourceRegistryItem[] {
    this.initEngine();
    const db = getDb();
    const rows = db.query<SourceRegistryItem>(
      'SELECT id, name, url, category, license, access_mode, status, last_checked_at, item_count, notes FROM english_source_registry ORDER BY name ASC'
    );

    // Her kaynağın veri tabanındaki güncel kayıt sayısını hesapla
    return rows.map(r => {
      const count=db.queryOne<{count:number}>('SELECT COUNT(*) AS count FROM english_corpus_vocab WHERE source_id=?',[r.id])?.count??0;
      return { ...r, item_count: count };
    });
  }

  /**
   * Kelime Haznesinden Arama ve Filtreleme
   */
  public static searchVocab(query: string, themeId?: string, cefrLevel?: string): CorpusVocabItem[] {
    this.initEngine();
    const db = getDb();
    let sql = 'SELECT * FROM english_corpus_vocab WHERE status = "active"';
    const params: any[] = [];

    if (query.trim()) {
      sql += ' AND (word LIKE ? OR turkish_meaning LIKE ?)';
      params.push(`%${query.trim()}%`, `%${query.trim()}%`);
    }

    if (themeId && themeId !== 'all') {
      sql += ' AND theme_id = ?';
      params.push(themeId);
    }

    if (cefrLevel && cefrLevel !== 'all') {
      sql += ' AND cefr_level = ?';
      params.push(cefrLevel);
    }

    sql += ' ORDER BY word ASC LIMIT 50';
    return db.query<CorpusVocabItem>(sql, params);
  }

  /**
   * Belirli bir kelimenin Tatoeba cümle çiftlerini getirir
   */
  public static getSentencesForWord(wordOrVocabId: string): CorpusSentenceItem[] {
    this.initEngine();
    const db = getDb();
    return db.query<CorpusSentenceItem>(
      `SELECT s.* FROM english_corpus_sentences s
       LEFT JOIN english_corpus_vocab v ON s.vocab_id = v.id
       WHERE s.vocab_id = ? OR v.word = ? OR s.en_sentence LIKE ?
       ORDER BY s.id ASC LIMIT 10`,
      [wordOrVocabId, wordOrVocabId, `%${wordOrVocabId}%`]
    );
  }

  /**
   * Belirli bir temanın Dil Bilgisi Kurallarını getirir
   */
  public static getGrammarRules(themeId?: string): CorpusGrammarRule[] {
    this.initEngine();
    const db = getDb();
    if (themeId && themeId !== 'all') {
      return db.query<CorpusGrammarRule>(
        'SELECT * FROM english_grammar_rules WHERE theme_id = ? ORDER BY title ASC',
        [themeId]
      );
    }
    return db.query<CorpusGrammarRule>('SELECT * FROM english_grammar_rules ORDER BY title ASC');
  }

  /**
   * Öğrenme Materyallerini getirir (Okuma, Boşluk Doldurma, Diyalog vb.)
   */
  public static getLearningMaterials(themeId?: string, materialType?: string): CorpusLearningMaterial[] {
    this.initEngine();
    const db = getDb();
    let sql = 'SELECT * FROM english_learning_materials WHERE 1=1';
    const params: any[] = [];

    if (themeId && themeId !== 'all') {
      sql += ' AND theme_id = ?';
      params.push(themeId);
    }

    if (materialType && materialType !== 'all') {
      sql += ' AND material_type = ?';
      params.push(materialType);
    }

    sql += ' ORDER BY created_at DESC';
    return db.query<CorpusLearningMaterial>(sql, params);
  }

  /**
   * Yeni Kelime Ekler (Veri Doğrulama ve Karantina Kontrolü Dahil)
   */
  public static ingestVocab(data: {
    word: string;
    cefr: 'A1' | 'A2' | 'B1' | 'B2';
    phonetic?: string;
    audioUrl?: string;
    meanings: any[];
    turkishMeaning: string;
    synonyms?: string[];
    sourceId: string;
    themeId?: string;
  }): { success: boolean; status: 'active' | 'quarantine'; reason?: string } {
    this.initEngine();
    const db = getDb();
    const wordClean = data.word.trim().toLowerCase();

    // 1. Veri Kalite Denetimi
    if (!wordClean || wordClean.length < 2 || !/^[a-zA-Z\s\-]+$/.test(wordClean)) {
      return { success: false, status: 'quarantine', reason: 'Geçersiz kelime formatı veya özel karakter hatası.' };
    }

    if (!data.turkishMeaning || data.turkishMeaning.trim().length === 0) {
      return { success: false, status: 'quarantine', reason: 'Türkçe anlam boş bırakılamaz.' };
    }

    const now = new Date().toISOString();
    const vocabId = `vocab_${wordClean.replace(/\s+/g, '_')}`;
    const source=db.queryOne<{license:string}>('SELECT license FROM english_source_registry WHERE id=?',[data.sourceId]);
    if(!source)return {success:false,status:'quarantine',reason:'Kaynak sicilde bulunamadı.'};

    try {
      db.run(
        `INSERT OR REPLACE INTO english_corpus_vocab
         (id, word, cefr_level, phonetic, audio_url, meanings_json, turkish_meaning, synonyms_json, source_id, license, theme_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [
          vocabId,
          wordClean,
          data.cefr,
          data.phonetic || '',
          data.audioUrl || '',
          JSON.stringify(data.meanings || []),
          data.turkishMeaning.trim(),
          JSON.stringify(data.synonyms || []),
          data.sourceId,
          source.license,
          data.themeId || 'topic_eng_theme1',
          now,
          now
        ]
      );
      return { success: true, status: 'active' };
    } catch (err: any) {
      return { success: false, status: 'quarantine', reason: err.message };
    }
  }

  /**
   * İstatistik Özeti (Admin & Dashboard İçin)
   */
  public static getCorpusStats(): CorpusStats {
    this.initEngine();
    const db = getDb();

    const vRow = db.queryOne<{ total: number; quarantined: number }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'quarantine' THEN 1 ELSE 0 END) as quarantined
      FROM english_corpus_vocab
    `);

    const sRow = db.queryOne<{ total: number }>('SELECT COUNT(*) as total FROM english_corpus_sentences');
    const gRow = db.queryOne<{ total: number }>('SELECT COUNT(*) as total FROM english_grammar_rules');
    const mRow = db.queryOne<{ total: number }>('SELECT COUNT(*) as total FROM english_learning_materials');

    const cefrRows = db.query<{ cefr_level: string; count: number }>(`
      SELECT cefr_level, COUNT(*) as count 
      FROM english_corpus_vocab 
      WHERE status = 'active'
      GROUP BY cefr_level
    `);

    const cefrMap: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
    for (const r of cefrRows) {
      cefrMap[r.cefr_level] = r.count;
    }

    const srcRows = db.query<{ status: string }>('SELECT status FROM english_source_registry');
    const onlineCount = srcRows.filter(s => s.status === 'online').length;

    return {
      totalVocab: vRow?.total || 0,
      totalSentences: sRow?.total || 0,
      totalGrammarRules: gRow?.total || 0,
      totalMaterials: mRow?.total || 0,
      quarantinedCount: vRow?.quarantined || 0,
      cefrBreakdown: cefrMap,
      sourceCount: srcRows.length,
      sourcesOnline: onlineCount
    };
  }

  /**
   * Tüm Açık Kaynakların Durumunu ve Canlılığını Günceller
   */
  public static async refreshSourceHealth(): Promise<SourceRegistryItem[]> {
    this.initEngine();
    const db = getDb();
    const sources = this.getSourceRegistry();
    const now = new Date().toISOString();

    for (const src of sources) {
      // A static registry entry is not evidence of a successful network check.
      if (src.access_mode !== 'rest_api' || src.id !== 'src_free_dict_api') continue;
      let isAlive = false;
      if (src.access_mode === 'rest_api' && src.id === 'src_free_dict_api') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          const res = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/hello', { signal: controller.signal });
          isAlive = res.ok;
        } catch {
          isAlive = false;
        } finally {
          clearTimeout(timeoutId);
        }
      }

      const newStatus = isAlive ? 'online' : 'degraded';
      db.run(
        'UPDATE english_source_registry SET status = ?, last_checked_at = ? WHERE id = ?',
        [newStatus, now, src.id]
      );
    }

    return this.getSourceRegistry();
  }
}
