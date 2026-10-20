export interface DialogueTurn {
  id: string;
  botPromptEn: string;
  botPromptTr: string;
  expectedKeywords: string[];
  suggestedAnswer: string;
  grammarFocus: string;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  titleTr: string;
  setting: string;
  cefrLevel: 'A1' | 'A2' | 'B1';
  role: string;
  turns: DialogueTurn[];
}

export const REAL_LIFE_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'airport_checkin',
    title: 'At the Airport Check-in Desk',
    titleTr: 'Havalimanı Giriş ve Bilet Masası',
    setting: 'International Airport Terminal',
    cefrLevel: 'A2',
    role: 'You are an exchange student checking in for your flight.',
    turns: [
      {
        id: 'turn_1',
        botPromptEn: 'Good morning! Welcome to London Airways. May I please see your passport and flight booking code?',
        botPromptTr: 'Günaydın! London Airways’e hoş geldiniz. Pasaportunuzu ve uçuş rezervasyon kodunuzu görebilir miyim?',
        expectedKeywords: ['here', 'passport', 'ticket', 'booking', 'please'],
        suggestedAnswer: 'Good morning! Here is my passport and booking code.',
        grammarFocus: 'Polite greetings and presenting documents'
      },
      {
        id: 'turn_2',
        botPromptEn: 'Thank you! Are you checking in any bags today, or do you only have cabin hand luggage?',
        botPromptTr: 'Teşekkürler! Bugün bagaja vereceğiniz valiz var mı, yoksa sadece el bagajınız mı bulunuyor?',
        expectedKeywords: ['suitcase', 'bag', 'cabin', 'luggage', 'only', 'one'],
        suggestedAnswer: 'I have one suitcase to check in and one small cabin backpack.',
        grammarFocus: 'Present simple with countable nouns'
      },
      {
        id: 'turn_3',
        botPromptEn: 'Your luggage weight is 18 kilograms, which is well within the limit. Would you prefer a window or an aisle seat?',
        botPromptTr: 'Valiziniz 18 kilo, sınırın altında. Pencere kenarı mı yoksa koridor tarafı mı tercih edersiniz?',
        expectedKeywords: ['window', 'aisle', 'seat', 'prefer', 'please'],
        suggestedAnswer: 'I would prefer a window seat, please.',
        grammarFocus: 'Expressing preferences with "would prefer"'
      }
    ]
  },
  {
    id: 'restaurant_order',
    title: 'Ordering Food at a Cafe',
    titleTr: 'Kafede Sipariş Verme ve Hesap İsteme',
    setting: 'City Center Cafe & Bistro',
    cefrLevel: 'A1',
    role: 'You are ordering lunch with friends.',
    turns: [
      {
        id: 'turn_1',
        botPromptEn: 'Hello! Welcome to Green Bistro. Are you ready to order, or do you need a few more minutes?',
        botPromptTr: 'Merhaba! Green Bistro’ya hoş geldiniz. Sipariş vermeye hazır mısınız, yoksa birkaç dakikaya mı ihtiyacınız var?',
        expectedKeywords: ['ready', 'order', 'please', 'like', 'menu'],
        suggestedAnswer: 'Hello! We are ready to order, thank you.',
        grammarFocus: 'Present simple and readiness'
      },
      {
        id: 'turn_2',
        botPromptEn: 'Great! What can I get for you today as a main course and a drink?',
        botPromptTr: 'Harika! Ana yemek ve içecek olarak ne arzu edersiniz?',
        expectedKeywords: ['like', 'sandwich', 'salad', 'water', 'tea', 'juice', 'please'],
        suggestedAnswer: 'I would like a chicken sandwich and a bottle of mineral water, please.',
        grammarFocus: 'Making polite requests with "I would like"'
      },
      {
        id: 'turn_3',
        botPromptEn: 'Everything has been served. How was your meal? Would you like any dessert or the bill?',
        botPromptTr: 'Yemeğiniz nasıldı? Tatlı mı istersiniz yoksa hesabı mı getireyim?',
        expectedKeywords: ['delicious', 'good', 'bill', 'check', 'please'],
        suggestedAnswer: 'The meal was delicious! Could we have the bill, please?',
        grammarFocus: 'Past tense evaluation and requesting the bill'
      }
    ]
  },
  {
    id: 'asking_directions',
    title: 'Asking for Directions in the City',
    titleTr: 'Şehirde Yön ve Adres Sorma',
    setting: 'Street Corner near the Station',
    cefrLevel: 'A2',
    role: 'You are trying to find the national library.',
    turns: [
      {
        id: 'turn_1',
        botPromptEn: 'Excuse me, you look a bit lost. Can I help you with something?',
        botPromptTr: 'Affedersiniz, biraz kaybolmuş gibi görünüyorsunuz. Yardımcı olabilir miyim?',
        expectedKeywords: ['excuse', 'looking', 'library', 'where', 'how', 'find'],
        suggestedAnswer: 'Excuse me, could you tell me how to get to the national library?',
        grammarFocus: 'Asking directions politely with indirect questions'
      },
      {
        id: 'turn_2',
        botPromptEn: 'Sure! Walk straight down this avenue for two blocks, then turn left at the traffic lights. Do you know where the post office is?',
        botPromptTr: 'Tabii! Bu caddede iki blok düz yürüyün, ardından trafik ışıklarından sola dönün. Postanenin nerede olduğunu biliyor musunuz?',
        expectedKeywords: ['yes', 'no', 'understand', 'straight', 'turn', 'left'],
        suggestedAnswer: 'I understand, go straight and turn left at the lights. Thank you!',
        grammarFocus: 'Imperatives and confirming instructions'
      }
    ]
  }
];

export interface SpeechEvaluationResult {
  isRecognized: boolean;
  needsRetry: boolean;
  retryReason?: string;
  isGrammaticallyAcceptable: boolean;
  confidenceScore: number;
  feedback: string;
  grammarTip: string;
}

export class SpeakingSimulator {
  /**
   * Ses tanıma doğruluğu ile öğrencinin dil hatasını birbirinden ayıran değerlendirme
   */
  public static evaluateSpeech(
    spokenText: string,
    turn: DialogueTurn,
    rawConfidence: number = 0.85
  ): SpeechEvaluationResult {
    const textClean = spokenText.trim().toLowerCase();

    // 1. Düşük Güven veya Mikrofon Gürültüsü Denetimi
    // Ses tanıma hatasını öğrencinin gramer hatası gibi YORUMLAMA!
    if (rawConfidence < 0.65 || textClean.length < 3 || textClean === '...' || /^[^a-zA-Z]+$/.test(textClean)) {
      return {
        isRecognized: false,
        needsRetry: true,
        retryReason: 'Mikrofonunuzdan gelen ses net anlaşılamadı veya arka plan gürültüsü yüksek. Lütfen mikrofona biraz daha yakın konuşarak tekrar ediniz.',
        isGrammaticallyAcceptable: false,
        confidenceScore: rawConfidence,
        feedback: 'Ses algılama kalitesi düşük.',
        grammarTip: 'Bu bir dil bilgisi hatası değildir; ses girişi tekrar beklenmektedir.'
      };
    }

    // 2. Anahtar Kelime ve Anlamsal Uygunluk
    const matchedCount = turn.expectedKeywords.filter(kw => textClean.includes(kw.toLowerCase())).length;
    const isKeywordMatched = matchedCount > 0;

    // 3. Basit Gramer & Yapı Değerlendirmesi
    let feedback = '';
    let isGrammarOk = true;

    if (isKeywordMatched) {
      feedback = `Harika! Bağlama uygun ve akıcı bir ifade kullandınız (${turn.expectedKeywords.filter(k => textClean.includes(k.toLowerCase())).join(', ')}).`;
    } else {
      isGrammarOk = false;
      feedback = `Cümleniz anlaşıldı fakat bu diyalog adımında beklenen anahtar kelimeler tam yer almadı.`;
    }

    return {
      isRecognized: true,
      needsRetry: false,
      isGrammaticallyAcceptable: isGrammarOk,
      confidenceScore: rawConfidence,
      feedback,
      grammarTip: `Hedef Kalıp: ${turn.grammarFocus}. Örnek Doğal Cevap: "${turn.suggestedAnswer}"`
    };
  }
}
