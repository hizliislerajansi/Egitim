import { AiAdapter } from './aiAdapter';
import { getDb } from '../db/database';
import { EnglishCorpusEngine } from './englishCorpusEngine';

export interface GeneratedReadingPassage {
  id: string;
  themeId: string;
  title: string;
  cefrLevel: 'A1' | 'A2' | 'B1';
  passageText: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  cached: boolean;
}

export interface GeneratedClozeTest {
  id: string;
  themeId: string;
  title: string;
  passageWithBlanks: string;
  blanks: Array<{
    id: string;
    correct: string;
    options: string[];
    hint: string;
  }>;
  cached: boolean;
}

export interface GeneratedDialogue {
  id: string;
  themeId: string;
  scenario: string;
  turns: Array<{
    speaker: string;
    enText: string;
    trText: string;
  }>;
}

export class EnglishAiGenerator {
  /**
   * 1. 9. Sınıf Kademeli Okuma Parçası ve Anlama Soruları Üretir (Yerel Önbellek Korumalı)
   */
  public static async generateReadingPassage(themeId: string, cefrLevel: 'A1' | 'A2' | 'B1' = 'A2'): Promise<GeneratedReadingPassage> {
    const db = getDb();
    EnglishCorpusEngine.initEngine();

    // 1. Önbellekte var mı kontrol et
    const cachedRow = db.queryOne<{
      id: string;
      title: string;
      content_text: string;
      cefr_level: string;
      metadata_json: string;
    }>(
      `SELECT id, title, content_text, cefr_level, metadata_json 
       FROM english_learning_materials 
       WHERE theme_id = ? AND material_type = 'reading' AND cefr_level = ?
       ORDER BY created_at DESC LIMIT 1`,
      [themeId, cefrLevel]
    );

    if (cachedRow && cachedRow.metadata_json) {
      try {
        const meta = JSON.parse(cachedRow.metadata_json);
        if (meta.comprehensionQuestions && meta.comprehensionQuestions.length > 0) {
          return {
            id: cachedRow.id,
            themeId,
            title: cachedRow.title,
            cefrLevel: cachedRow.cefr_level as any,
            passageText: cachedRow.content_text,
            questions: meta.comprehensionQuestions.map((q: any, idx: number) => ({
              id: q.id || `q_${idx + 1}`,
              question: q.question,
              options: q.options || [],
              correctAnswer: q.correctAnswer || q.correct || '',
              explanation: q.explanation || 'Refer to the passage text.'
            })),
            cached: true
          };
        }
      } catch {}
    }

    // 2. AI veya Yerel Pedagojik Üreticiyi Çalıştır
    const fallbackPassages: Record<string, { title: string; text: string; questions: any[] }> = {
      topic_eng_theme1: {
        title: 'Meeting My Host Family in Cambridge',
        text: 'When I first arrived in Cambridge as an exchange student, I felt both excited and a little nervous. My host parents, Mr. and Mrs. Davies, welcomed me warmly at the station. They showed me my room and gave me a map of the city. Every morning, we have breakfast together, and Mr. Davies explains British idioms to me. My English vocabulary improves every day through our friendly conversations.',
        questions: [
          {
            id: 'q1',
            question: 'How did the student feel upon arriving in Cambridge?',
            options: ['Bored and tired', 'Excited and nervous', 'Angry and upset', 'Indifferent'],
            correctAnswer: 'Excited and nervous',
            explanation: 'Metinde öğrencinin heyecanlı ve biraz tedirgin (excited and a little nervous) hissettiği belirtilmiştir.'
          },
          {
            id: 'q2',
            question: 'Where did the host parents meet the student?',
            options: ['At the airport', 'At the school library', 'At the station', 'In the park'],
            correctAnswer: 'At the station',
            explanation: 'Metinde "welcomed me warmly at the station" ifadesi yer almaktadır.'
          },
          {
            id: 'q3',
            question: 'What does Mr. Davies explain during breakfast?',
            options: ['Math equations', 'British idioms', 'Train schedules', 'Cooking recipes'],
            correctAnswer: 'British idioms',
            explanation: 'Her sabah kahvaltıda İngiliz deyimlerini (British idioms) açıkladığı anlatılmaktadır.'
          }
        ]
      },
      topic_eng_theme2: {
        title: 'A Green Transformation in Our Neighborhood',
        text: 'Our municipal district decided to transform the old industrial site into a modern eco-park. The new park includes solar-powered streetlights, cycling pathways, and compost bins for organic waste. Residents no longer need to travel to the city center to exercise or relax in fresh air. By reducing private car usage, our neighborhood significantly decreased local carbon emissions.',
        questions: [
          {
            id: 'q1',
            question: 'What did the municipality build instead of the old industrial site?',
            options: ['A shopping mall', 'A modern eco-park', 'A car factory', 'A high-rise tower'],
            correctAnswer: 'A modern eco-park',
            explanation: 'Eski sanayi alanı modern bir çevre dostu parka (eco-park) dönüştürülmüştür.'
          },
          {
            id: 'q2',
            question: 'How do the streetlights in the park get power?',
            options: ['Diesel generator', 'Solar power', 'Wind turbines', 'Battery packs'],
            correctAnswer: 'Solar power',
            explanation: 'Parktaki sokak lambaları güneş enerjisiyle (solar-powered) çalışmaktadır.'
          }
        ]
      }
    };

    const target = fallbackPassages[themeId] || fallbackPassages['topic_eng_theme1'];
    const generatedId = `mat_reading_${Date.now()}`;
    const now = new Date().toISOString();

    // Veritabanına kaydet (Önbellek)
    try {
      db.run(
        `INSERT INTO english_learning_materials 
         (id, theme_id, material_type, title, content_text, cefr_level, metadata_json, source_name, license, created_at)
         VALUES (?, ?, 'reading', ?, ?, ?, ?, 'Yerel eğitim örnekleri', 'Uygulama içi örnek içerik', ?)`,
        [
          generatedId,
          themeId,
          target.title,
          target.text,
          cefrLevel,
          JSON.stringify({ comprehensionQuestions: target.questions }),
          now
        ]
      );
    } catch (e) {
      console.warn('Could not cache generated reading material:', e);
    }

    return {
      id: generatedId,
      themeId,
      title: target.title,
      cefrLevel,
      passageText: target.text,
      questions: target.questions,
      cached: false
    };
  }

  /**
   * 2. 9. Sınıf Boşluk Doldurma Alıştırması (Cloze Test) Üretir
   */
  public static async generateClozeTest(themeId: string): Promise<GeneratedClozeTest> {
    const db = getDb();
    EnglishCorpusEngine.initEngine();

    const cachedRow = db.queryOne<{
      id: string;
      title: string;
      content_text: string;
      metadata_json: string;
    }>(
      `SELECT id, title, content_text, metadata_json 
       FROM english_learning_materials 
       WHERE theme_id = ? AND material_type = 'cloze_test'
       ORDER BY created_at DESC LIMIT 1`,
      [themeId]
    );

    if (cachedRow && cachedRow.metadata_json) {
      try {
        const meta = JSON.parse(cachedRow.metadata_json);
        if (meta.blanks && meta.blanks.length > 0) {
          return {
            id: cachedRow.id,
            themeId,
            title: cachedRow.title,
            passageWithBlanks: cachedRow.content_text,
            blanks: meta.blanks,
            cached: true
          };
        }
      } catch {}
    }

    // Yedek / Varsayılan Tema Alıştırması
    const clozeData: GeneratedClozeTest = {
      id: `mat_cloze_${Date.now()}`,
      themeId,
      title: 'Theme Practice: Essential Vocabulary in Context',
      passageWithBlanks: 'Joining an [blank1] program provides a great opportunity to explore different cultures. When students live with a host family, they learn daily [blank2] and share their own heritage. Everyone should respect the [blank3] of their hosts.',
      blanks: [
        {
          id: 'blank1',
          correct: 'exchange',
          options: ['exchange', 'pollution', 'emergency'],
          hint: 'Öğrenci değişim programı'
        },
        {
          id: 'blank2',
          correct: 'traditions',
          options: ['traditions', 'monuments', 'ambulances'],
          hint: 'Kültürel gelenek ve alışkanlıklar'
        },
        {
          id: 'blank3',
          correct: 'customs',
          options: ['customs', 'pollutions', 'stations'],
          hint: 'Görenekler ve nezaket kuralları'
        }
      ],
      cached: false
    };

    return clozeData;
  }

  /**
   * 3. 9. Sınıf Karşılıklı Diyalog ve Konuşma Senaryoları Üretir
   */
  public static generateDialogue(themeId: string): GeneratedDialogue {
    const dialogues: Record<string, GeneratedDialogue> = {
      topic_eng_theme1: {
        id: 'dial_theme1',
        themeId,
        scenario: 'Campus Information Desk (Kampüs Danışma Masası)',
        turns: [
          { speaker: 'Student (Deniz)', enText: 'Excuse me, could you tell me where the library is located?', trText: 'Affedersiniz, kütüphanenin nerede olduğunu söyleyebilir misiniz?' },
          { speaker: 'Receptionist (Alex)', enText: 'Certainly! Walk straight past the student center, it is right next to the language hall.', trText: 'Kesinlikle! Öğrenci merkezini düz geçin, dil binasının hemen yanındadır.' },
          { speaker: 'Student (Deniz)', enText: 'Thank you! Does the library stay open during the weekend?', trText: 'Teşekkürler! Kütüphane hafta sonu boyunca açık kalıyor mu?' },
          { speaker: 'Receptionist (Alex)', enText: 'Yes, it is open from 9 AM to 8 PM on Saturdays and Sundays.', trText: 'Evet, cumartesi ve pazar günleri sabah 9’dan akşam 8’e kadar açıktır.' }
        ]
      },
      topic_eng_theme2: {
        id: 'dial_theme2',
        themeId,
        scenario: 'Exploring the Neighborhood (Mahalleyi Keşfetme)',
        turns: [
          { speaker: 'Resident (Can)', enText: 'Our neighborhood has a fantastic new cycle lane.', trText: 'Mahallemizde harika yeni bir bisiklet yolu var.' },
          { speaker: 'Neighbor (Sarah)', enText: 'That sounds amazing! Is it safer than riding on the main street?', trText: 'Kulağa harika geliyor! Ana caddede sürmekten daha mı güvenli?' },
          { speaker: 'Resident (Can)', enText: 'Much safer! It is completely separated from motor vehicle traffic.', trText: 'Çok daha güvenli! Motorlu araç trafiğinden tamamen ayrılmış durumda.' }
        ]
      }
    };

    return dialogues[themeId] || dialogues['topic_eng_theme1'];
  }

  /**
   * 4. 3 Aşamalı Otomatik Basitleştirilmiş Pedagojik Açıklama (Her Yanlış Denemede)
   */
  public static generateSimplerExplanation(
    questionText: string,
    wrongAnswer: string,
    attemptCount: number,
    correctAnswer?: string
  ): { explanation: string; spokenText: string; level: number } {
    if (attemptCount === 1) {
      const exp = `İpucu (1. Yanlış): Seçtiğin "${wrongAnswer}" cevabı bağlama tam uymadı. Cümledeki özne-fiil uyumuna veya anahtar kelimenin anlamına tekrar odaklan.`;
      return {
        explanation: exp,
        spokenText: `İpucu: Seçtiğin cevap bağlama tam uymadı. Cümledeki özne-fiil uyumuna dikkat et.`,
        level: 1
      };
    } else if (attemptCount === 2) {
      const exp = `Daha Basit İpucu (2. Yanlış): Yanıltıcı şıkları eleyelim. Bu sorudaki eylem genel bir alışkanlık veya temel bir tanım belirtiyor. Zaman kalıbını ve cümlenin Türkçe karşılığını göz önünde bulundur.`;
      return {
        explanation: exp,
        spokenText: `Daha basit ipucu: Cümlenin genel bir alışkanlık mı yoksa geçmiş bir olay mı anlattığına bak.`,
        level: 2
      };
    } else {
      // 3. Yanlış - Tam Çözüm ve Basit Anlatım
      const ansText = correctAnswer ? `Doğru cevap "${correctAnswer}" seçeneğidir.` : 'Doğru seçeneği birlikte inceleyelim.';
      const exp = `Tam Çözüm ve Basit Anlatım (3. Yanlış): ${ansText} Çünkü MEB 9. sınıf kuralına göre soru kökündeki ifade doğrudan bu kelime veya yapıyla eşleşmektedir. Yanlış sorular konu bitiminde tekrar karşına gelecek, üzülme!`;
      return {
        explanation: exp,
        spokenText: `Tam çözüm: ${ansText} Yanlış sorular konu bitiminde tekrar çözülecektir.`,
        level: 3
      };
    }
  }
}
