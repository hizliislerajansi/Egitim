import { isNativeApp } from './apiClient';
export interface WordMeaning {
  partOfSpeech: string;
  definitions: {
    definition: string;
    example?: string;
    synonyms?: string[];
  }[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  meanings: WordMeaning[];
  turkishMeaning?: string;
  tatoebaUrl: string;
  cambridgeUrl: string;
  wiktionaryUrl: string;
  wordnetUrl: string;
  source: 'free_dictionary_api' | 'offline_cefr_cache';
}

// 9. Sınıf Müfredat ve CEFR Seviye Eşleme Tablosu (Openjam & CEFR-J referanslı)
const CEFR_LEVEL_MAP: Record<string, 'A1' | 'A2' | 'B1' | 'B2'> = {
  student: 'A1',
  school: 'A1',
  book: 'A1',
  friend: 'A1',
  family: 'A1',
  country: 'A1',
  city: 'A1',
  study: 'A1',
  learn: 'A1',
  speak: 'A1',
  listen: 'A1',
  teacher: 'A1',
  neighborhood: 'A2',
  exchange: 'A2',
  tradition: 'A2',
  explore: 'A2',
  custom: 'A2',
  culture: 'A2',
  environment: 'B1',
  protect: 'A2',
  inspire: 'B1',
  leader: 'A2',
  technology: 'A2',
  science: 'A2',
  communicate: 'B1',
  achievement: 'B1'
};

// Çevrimdışı Temel Kelimeler (İnternetsiz durum veya API arızası durumunda tam yedek)
const OFFLINE_DICTIONARY: Record<string, Partial<DictionaryEntry>> = {
  exchange: {
    word: 'exchange',
    phonetic: '/ɪksˈtʃeɪndʒ/',
    cefrLevel: 'A2',
    turkishMeaning: 'Değişim, takas etmek, karşılıklı alıp vermek',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'An act of giving one thing and receiving another in return.',
            example: 'They were granted an exchange student visa.',
            synonyms: ['trade', 'swap', 'interchange']
          }
        ]
      },
      {
        partOfSpeech: 'verb',
        definitions: [
          {
            definition: 'To give something and receive something of the same kind in return.',
            example: 'We exchanged email addresses after the lesson.',
            synonyms: ['switch', 'trade']
          }
        ]
      }
    ]
  },
  neighborhood: {
    word: 'neighborhood',
    phonetic: '/ˈneɪbərhʊd/',
    cefrLevel: 'A2',
    turkishMeaning: 'Mahalle, çevre, civar',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'A district or community within a town or city.',
            example: 'Our neighborhood has a modern library and a clean park.',
            synonyms: ['district', 'quarter', 'vicinity']
          }
        ]
      }
    ]
  },
  tradition: {
    word: 'tradition',
    phonetic: '/trəˈdɪʃən/',
    cefrLevel: 'A2',
    turkishMeaning: 'Gelenek, anane, göreneksel kültür',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The transmission of customs or beliefs from generation to generation.',
            example: 'Turkish hospitality is an ancient tradition passed down through generations.',
            synonyms: ['custom', 'heritage', 'ritual']
          }
        ]
      }
    ]
  },
  achievement: {
    word: 'achievement',
    phonetic: '/əˈtʃiːvmənt/',
    cefrLevel: 'B1',
    turkishMeaning: 'Başarı, kazanım, üstün gayretle elde edilen sonuç',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'A thing done successfully with effort, skill, or courage.',
            example: 'Graduating from high school with honors is a major achievement.',
            synonyms: ['accomplishment', 'success', 'triumph']
          }
        ]
      }
    ]
  },
  environment: {
    word: 'environment',
    phonetic: '/ɪnˈvaɪrənmənt/',
    cefrLevel: 'B1',
    turkishMeaning: 'Çevre, doğal ortam, tabiat',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The natural world, as a whole or in a particular geographical area.',
            example: 'Protecting the environment is essential for the future of humanity.',
            synonyms: ['habitat', 'nature', 'surroundings']
          }
        ]
      }
    ]
  }
};

export class DictionaryService {
  /**
   * Free Dictionary API üzerinden canlı arama yapar.
   * Başarısız olursa veya çevrimdışıysa yerel CEFR/Openjam veritabanına geri düşer.
   */
  public static async lookupWord(
    rawWord: string, 
    options?: { timeoutMs?: number; skipApi?: boolean }
  ): Promise<DictionaryEntry> {
    const cleanWord = rawWord.trim().toLowerCase().replace(/[^a-zA-Z\s-]/g, '');
    const firstWord = cleanWord.split(' ')[0] || cleanWord;

    const tatoebaUrl = `https://tatoeba.org/en/sentences/search?query=${encodeURIComponent(cleanWord)}&from=eng&to=tur`;
    const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english-turkish/${encodeURIComponent(cleanWord)}`;
    const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(cleanWord)}`;
    const wordnetUrl = `http://wordnetweb.princeton.edu/perl/webwn?s=${encodeURIComponent(cleanWord)}`;

    const cefr = CEFR_LEVEL_MAP[firstWord] || 'A2';

    // API atlanacaksa doğrudan yerel önbellek
    if (options?.skipApi) {
      const cached = OFFLINE_DICTIONARY[firstWord] || OFFLINE_DICTIONARY[firstWord.toUpperCase()];
      if (cached) {
        return {
          word: cleanWord,
          phonetic: cached.phonetic,
          cefrLevel: cached.cefrLevel || cefr,
          meanings: cached.meanings || [],
          turkishMeaning: cached.turkishMeaning,
          tatoebaUrl,
          cambridgeUrl,
          wiktionaryUrl,
          wordnetUrl,
          source: 'offline_cefr_cache'
        };
      }
    }

    // Free Dictionary API denenir (Timeout korumalı)
    if (!options?.skipApi) try {
      let data: any;
      if (isNativeApp()) {
        const { invoke } = await import('@tauri-apps/api/core');
        data = await invoke('dictionary_lookup', {word: firstWord});
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs || 5000);
        try {
          const useLocalProxy = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
          const url = useLocalProxy ? `/api/dictionary/${encodeURIComponent(firstWord)}` : `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(firstWord)}`;
          const response = await fetch(url, {headers: {'Accept': 'application/json'}, signal: controller.signal});
          if (!response.ok) throw new Error('Sözlük yanıt vermedi');
          data = await response.json();
        } finally { clearTimeout(timeoutId); }
      }
      {
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          
          // Ses dosyasını phonetics içinden bul
          let audioUrl: string | undefined;
          if (Array.isArray(entry.phonetics)) {
            const audioObj = entry.phonetics.find((p: any) => p.audio && p.audio.trim().length > 0);
            if (audioObj) {
              audioUrl = audioObj.audio;
            }
          }

          const parsedMeanings: WordMeaning[] = (entry.meanings || []).map((m: any) => ({
            partOfSpeech: m.partOfSpeech || 'noun',
            definitions: (m.definitions || []).slice(0, 3).map((d: any) => ({
              definition: d.definition,
              example: d.example,
              synonyms: d.synonyms ? d.synonyms.slice(0, 4) : undefined
            }))
          }));

          return {
            word: entry.word || cleanWord,
            phonetic: entry.phonetic || (entry.phonetics?.[0]?.text),
            audioUrl,
            cefrLevel: cefr,
            meanings: parsedMeanings,
            turkishMeaning: OFFLINE_DICTIONARY[firstWord]?.turkishMeaning,
            tatoebaUrl,
            cambridgeUrl,
            wiktionaryUrl,
            wordnetUrl,
            source: 'free_dictionary_api'
          };
        }
      }
    } catch {
      // Ağ hatası veya çevrimdışı durum: Yerel veriye geçilir
    }

    // Çevrimdışı / Yerel Yedek
    const cached = OFFLINE_DICTIONARY[firstWord];
    if (cached) {
      return {
        word: cleanWord,
        phonetic: cached.phonetic,
        cefrLevel: cached.cefrLevel || cefr,
        meanings: cached.meanings || [],
        turkishMeaning: cached.turkishMeaning,
        tatoebaUrl,
        cambridgeUrl,
        wiktionaryUrl,
        wordnetUrl,
        source: 'offline_cefr_cache'
      };
    }

    // Bilinmeyen kelime için genel CEFR referans şablonu
    return {
      word: cleanWord,
      phonetic: undefined,
      cefrLevel: cefr,
      meanings: [
        {
          partOfSpeech: 'word',
          definitions: [
            {
              definition: `Definition and usage examples available in external reference databases.`,
              example: `Refer to Cambridge, Wiktionary or Tatoeba for full contextual sentences.`
            }
          ]
        }
      ],
      tatoebaUrl,
      cambridgeUrl,
      wiktionaryUrl,
      wordnetUrl,
      source: 'offline_cefr_cache'
    };
  }

  /**
   * CEFR seviyesine göre açıklama ve rozet rengi üretir
   */
  public static getCefrBadge(level: 'A1' | 'A2' | 'B1' | 'B2') {
    switch (level) {
      case 'A1':
        return { label: 'A1 - Başlangıç', color: '#10b981', bg: '#ecfdf5' };
      case 'A2':
        return { label: 'A2 - Temel (9. Sınıf)', color: '#2563eb', bg: '#eff6ff' };
      case 'B1':
        return { label: 'B1 - Orta Düzey', color: '#7c3aed', bg: '#f5f3ff' };
      case 'B2':
        return { label: 'B2 - İleri Düzey', color: '#d97706', bg: '#fffbeb' };
      default:
        return { label: 'A2 - 9. Sınıf', color: '#2563eb', bg: '#eff6ff' };
    }
  }
}
