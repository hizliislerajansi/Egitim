import { ConversationStyle } from '../types/settings';
import { SubjectCode, AiRole } from './aiAdapter';

export type EmotionalCue = 
  | 'greeting'
  | 'sadness'
  | 'joy'
  | 'anger'
  | 'anxiety'
  | 'indecision'
  | 'humor'
  | 'tiredness'
  | 'correction'
  | 'short_query'
  | 'neutral';

export interface EmotionalAnalysis {
  cue: EmotionalCue;
  guidance: string;
}

export const MASTER_NATURAL_COMMUNICATION_PROMPT = `Sen doğal, akıcı ve bağlama duyarlı iletişim kuran bir yapay zekâ asistanısın. Kullanıcıyla konuşurken önceliğin yalnızca bilgi vermek değil, iletişimi kolay, anlaşılır ve doğal kılmaktır.

Kullanıcının ne söylediğini ve neye ihtiyaç duyduğunu anlamaya çalış. Konuşmanın önceki mesajlarını dikkate al. Duruma göre kısa veya ayrıntılı yanıt ver. Günlük konuşmalarda gereksiz resmiyetten kaçın; teknik ve ciddi konularda ise açık, doğru ve dikkatli ol.

Kullanıcının duygusal ipuçlarına uygun tepki ver; ancak duygularını kesin olarak bildiğini varsayma. Empatiyi kalıp ifadelerle tekrarlamak yerine somut anlayış ve yardımla göster.

Her mesajı uzun bir açıklamaya dönüştürme. Gereksiz başlıklar, tekrarlanan özetler ve otomatik takip soruları kullanma. Bir soru sormak gerçekten gerekiyorsa doğal bir şekilde sor. Kullanıcı yalnızca sohbet etmek istiyorsa her zaman çözüm listesi sunma.

Esprileri ve samimi ifadeleri bağlamına göre kullan. Zorla mizah yapma, yapay yakınlık kurma ve kullanıcıya sürekli iltifat etme. Kullanıcıyı memnun etmek için yanlış bilgi verme; emin olmadığında dürüstçe belirt.

Sesli konuşmada cümleleri doğal uzunlukta tut. Kullanıcı sözünü bitirmeden aceleyle cevap verme. Kullanıcı araya girerse konuşma sırasını uygun şekilde devret. Desteklenen ses özelliklerini kullanarak anlaşılır, akıcı ve doğal bir iletişim kur.

Önceki konuşmalarda olmayan anıları uydurma. Gerçek bir insan olduğunu iddia etme. Kendini doğru biçimde bir yapay zekâ asistanı olarak tanıt; ancak bunu her mesajda tekrarlama.

En önemli kural: Kullanıcıya hazır bir senaryodan cevap okuyormuş gibi değil, konuşmanın o anki bağlamını anlayıp uygun yanıt veriyormuş gibi karşılık ver.`;

export const CONVERSATION_STYLE_PROMPTS: Record<ConversationStyle, string> = {
  casual_friend: 'İletişim Tarzı: Günlük Arkadaşça Sohbet. Samimi, içten, rahat ve doğal bir arkadaş gibi konuş. Gereksiz resmiyetten kaçın, gündelik konuşma dilinin sıcaklığını yansıt.',
  professional: 'İletişim Tarzı: Profesyonel Danışman. Ölçülü, net, çözüm odaklı, saygılı ve güven veren bir ton koru.',
  supportive: 'İletişim Tarzı: Sakin ve Destekleyici. Anlayışlı, sabırlı, moral veren, stresi azaltan ve şefkatli bir dil kullan.',
  energetic: 'İletişim Tarzı: Enerjik ve Neşeli. Dinamik, motive edici, canlı ve cesaretlendirici bir üslup benimse.',
  concise: 'İletişim Tarzı: Kısa ve Doğrudan. Gereksiz giriş veya kapanış yapma; doğrudan sorunun özüne odaklanıp en kısa yoldan yanıtla.',
  teacher: 'İletişim Tarzı: Öğretmen ve Rehber. Eğitici, düşündürücü, sabırlı ve adım adım yol gösteren samimi bir MEB rehberi gibi yaklaş.',
  technical: 'İletişim Tarzı: Teknik Uzman. Mantığı, kuralları, neden-sonuç zincirini derinlemesine ve analitik bir dille açıkla.',
  formal: 'İletişim Tarzı: Resmî İletişim. Ciddi, kurumsal, mesafeli ve tam anlamıyla saygılı bir üslup kullan.'
};

export class NaturalConversationEngine {
  /**
   * Kullanıcı mesajındaki belirgin duygusal ipuçlarını ve iletişim niyetini tespit eder
   */
  public static detectEmotionalCue(message: string): EmotionalAnalysis {
    const text = message.toLowerCase().trim();

    // 1. Düzeltme / İtiraz
    if (/^(hayır|öyle değil|yanlış anladın|onu demedim|öyle demek istemedim|değil|düzeltiyorum|pardon)/i.test(text) ||
        text.includes('yanlış anladın') || text.includes('kastetmedim') || text.includes('öyle demedim')) {
      return {
        cue: 'correction',
        guidance: 'Kullanıcı bir yanlış anlaşılmayı düzeltti. Asla savunmaya geçme; hatayı/düzeltmeyi doğal bir nezaketle kabul et ve kullanıcının düzelttiği bilgi üzerinden devam et.'
      };
    }

    // 2. Selamlaşma / Günlük sohbet açılışı
    if (/^(merhaba|selam|selamlar|günaydın|iyi günler|iyi akşamlar|tünaydın|naber|nasılsın|hey|selamün aleyküm)/i.test(text) && text.length < 40) {
      return {
        cue: 'greeting',
        guidance: 'Kullanıcı selam verdi veya hâl hatır sordu. Kısa, sıcak ve doğal karşılık ver. Ders anlatır gibi uzun paragraflar açma, otomatik soru kalıplarına zorlama.'
      };
    }

    // 3. Üzüntü, Çaresizlik, Yılgınlık
    if (/moralim bozuk|üzgünüm|canım sıkkın|yapamıyorum|olmuyor|başaramıyorum|bıktım|tükendim|ağlamak|çok zorlanıyorum|kendimi kötü hissediyorum/i.test(text)) {
      return {
        cue: 'sadness',
        guidance: 'Kullanıcı üzgün veya yılgın. Anlayışlı, sakin ve destekleyici ol. "Bu sizin için olumsuz bir durum" gibi yapay resmiyetten kaçın; samimi, gerçekçi ve rahatlatıcı bir üslupla yaklaş.'
      };
    }

    // 4. Sevinç, Başarı, Heyecan
    if (/başardım|100 aldım|harika oldu|çok mutluyum|yaşasın|kazandım|çözdüm|tam puan|harika bir haber/i.test(text)) {
      return {
        cue: 'joy',
        guidance: 'Kullanıcı bir başarı paylaşıyor veya çok mutlu. Sevincine ve enerjisine doğal bir içtenlikle ortak ol, çabasını takdir et.'
      };
    }

    // 5. Kaygı, Stres, Sınav Korkusu
    if (/stres|kaygı|korkuyorum|panik|yetişmeyecek|sınavdan korkuyorum|ne yapacağım|endişe/i.test(text)) {
      return {
        cue: 'anxiety',
        guidance: 'Kullanıcı endişeli ve stresli. Sakin, açık, güven veren ve durumu adım adım sadeleştiren bir yaklaşım sun.'
      };
    }

    // 6. Öfke, İsyan
    if (/saçmalık|öfkelendim|sinir oldum|böyle iş mi olur|ne alaka|haksızlık|nefret ediyorum/i.test(text)) {
      return {
        cue: 'anger',
        guidance: 'Kullanıcı öfkeli/tepkili. Savunmaya geçmeden veya zıtlaşmadan durumu anlamaya çalış, sakin ve yapıcı kal.'
      };
    }

    // 7. Kararsızlık
    if (/kararsız kaldım|bilemiyorum|sence hangisi|ne yapsam|arada kaldım/i.test(text)) {
      return {
        cue: 'indecision',
        guidance: 'Kullanıcı kararsız. Seçenekleri sadeleştir, avantaj-dezavantajları yormadan sun ve karar vermesini kolaylaştır.'
      };
    }

    // 8. Espri, Şaka, Mizah
    if (/fıkra|şaka|komik|espri|güldür|hahaha|hehehe/i.test(text)) {
      return {
        cue: 'humor',
        guidance: 'Kullanıcı esprili veya şaka yapıyor. Bağlama uygun, zeki ve neşeli bir karşılık ver; kasıntı durma.'
      };
    }

    // 9. Yorgunluk
    if (/çok yoruldum|uykum var|dinlenmek istiyorum|başım ağrıyor|pestilim çıktı/i.test(text)) {
      return {
        cue: 'tiredness',
        guidance: 'Kullanıcı yorgun. Yanıtı kısa, net ve zahmetsiz tut; dinlenmesini teşvik et.'
      };
    }

    // 10. Kısa & Doğrudan Soru
    if (text.length < 25 && (text.includes('?') || /^[\d\s+\-*/x=().]+$/.test(text) || /^(nedir|kaç|kimdir|nerede|ne zaman)/i.test(text))) {
      return {
        cue: 'short_query',
        guidance: 'Kullanıcı kısa ve doğrudan bir soru sordu. Gereksiz giriş, uzun açıklamalar veya rapor biçimi kullanmadan kısa ve net cevap ver.'
      };
    }

    return {
      cue: 'neutral',
      guidance: 'Konuşmanın doğal akışını koru; soruya uygun derinlikte ve samimi yanıt ver.'
    };
  }

  /**
   * Sağlayıcılar için zengin, doğal ve bağlam-duyarlı sistem promptu inşa eder
   */
  public static buildNaturalSystemPrompt(options: {
    role?: AiRole;
    subjectCode?: SubjectCode;
    topicName?: string;
    conversationStyle?: ConversationStyle;
    userMessage?: string;
    recentMistakes?: string[];
    taskType?: string;
  }): string {
    const style = options.conversationStyle || 'teacher';
    const styleGuidance = CONVERSATION_STYLE_PROMPTS[style] || CONVERSATION_STYLE_PROMPTS.teacher;

    let emotionalInstruction = '';
    if (options.userMessage) {
      const analysis = this.detectEmotionalCue(options.userMessage);
      if (analysis.cue !== 'neutral') {
        emotionalInstruction = `\n[Mevcut Mesaj İletişim İpucu: ${analysis.guidance}]`;
      }
    }

    let roleBase = '';
    const role = options.role || 'subject_teacher';
    if (role === 'homeroom_teacher') {
      roleBase = 'Sen MEB Lise 1 Sınıf Öğretmenisin. Tüm 9 MEB dersini (Matematik, Türk Dili ve Edebiyatı, Fizik, Kimya, Biyoloji, Tarih, Coğrafya, İngilizce, Din Kültürü) bütünsel olarak takip eder, üniteleri bağlar ve öğrenciyi motive edersin.';
    } else if (role === 'study_coach') {
      roleBase = 'Sen MEB Lise 1 Kişisel Ders Koçu ve Rehberlik Danışmanısın. Öğrencinin moralini yüksek tutar, stresini azaltır, çalışma stratejileri ve aralıklı tekrar planlamasıyla samimi rehberlik edersin.';
    } else {
      roleBase = 'Sen MEB Lise 1 Branş Öğretmenisin. Sadece o anki ders ve konu kapsamına odaklanır, pedagojik rehberlik sunarsın.';
      if (options.subjectCode === 'MATH' || options.subjectCode?.includes('MATH')) {
        roleBase += ' Branş: Matematik. Sayılar, cebir, denklemler ve geometriye odaklan.';
      } else if (options.subjectCode) {
        roleBase += ` Branş: ${options.subjectCode}.`;
      }
      if (options.topicName) roleBase += ` Konu: ${options.topicName}.`;
    }

    return `${MASTER_NATURAL_COMMUNICATION_PROMPT}

[KİŞİLİK VE ROL TANIMI]
${styleGuidance}
${roleBase}${emotionalInstruction}`;
  }

  /**
   * Sesli okuma için metni doğal konuşma akışına hazırlar:
   * Sahne direktifleri ([güler], [iç çeker], *güler*), emojiler ve kod bloklarını ayıklar.
   */
  public static sanitizeForSpeech(text: string): string {
    return text
      // Köşeli parantez içindeki sahne efektlerini temizle ([güler], [iç çeker], [duraksar] vs.)
      .replace(/\[.*?\]/g, '')
      // Yıldız içindeki yapay duygu ifadelerini temizle (*güler*, *fısıldar* vs.)
      .replace(/\*.*?\*/g, '')
      // Emojileri temizle (ses motoru emoji okumasın)
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Markdown başlık işaretlerini temizle
      .replace(/#{1,6}\s+/g, '')
      // Fazla boşlukları sadeleştir
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Token tasarrufu ve bağlam yönetimi: Uzun konuşma geçmişini özetler ve son turları korur.
   */
  public static pruneConversationHistory(
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxTurns = 8
  ): { history: Array<{ role: 'user' | 'assistant'; content: string }>; contextSummary?: string } {
    if (history.length <= maxTurns) {
      return { history };
    }

    // En eski turlardan kritik karar ve tercihleri özetle
    const olderTurns = history.slice(0, history.length - maxTurns);
    const recentTurns = history.slice(history.length - maxTurns);

    const summarizedKeyPoints: string[] = [];
    for (const turn of olderTurns) {
      if (turn.role === 'user') {
        if (/adım|ismim|hedefim|seviyem|sınıfım/i.test(turn.content)) {
          summarizedKeyPoints.push(`Kullanıcı bilgisi: "${turn.content.slice(0, 80)}"`);
        }
        if (/yanlış|değil|düzeltiyorum/i.test(turn.content)) {
          summarizedKeyPoints.push(`Kullanıcı düzeltmesi: "${turn.content.slice(0, 80)}"`);
        }
      }
    }

    const contextSummary = summarizedKeyPoints.length > 0 
      ? `Önceki sohbet özeti ve kayıtlı tercihler: ${summarizedKeyPoints.join('; ')}`
      : 'Önceki konuşmada konuyla ilgili temel adımlar ve sorular tartışıldı.';

    return {
      history: recentTurns,
      contextSummary
    };
  }

  /**
   * Çevrimdışı modda gerçekçi, doğal insan iletişimi yanıtları üretir
   */
  public static generateNaturalOfflineResponse(
    userMessage: string,
    role: AiRole = 'subject_teacher',
    subjectCode?: SubjectCode,
    style: ConversationStyle = 'teacher'
  ): string {
    const analysis = this.detectEmotionalCue(userMessage);

    // 1. Selamlaşma
    if (analysis.cue === 'greeting') {
      if (style === 'casual_friend' || style === 'energetic') {
        return 'Selam! Nasıl gidiyor, bugün ne üzerine kafa yoruyoruz?';
      }
      if (style === 'concise') {
        return 'Merhaba! Seni dinliyorum.';
      }
      return 'Merhaba! Nasıl gidiyor? Bugün hangi konuya odaklanmak istersin?';
    }

    // 2. Düzeltme
    if (analysis.cue === 'correction') {
      return 'Haklısın, kusura bakma dikkatsizlik etmişim. Düzeltmen için teşekkürler, tam olarak söylediğin şekilde devam edelim.';
    }

    // 3. Üzüntü / Yılgınlık
    if (analysis.cue === 'sadness') {
      if (role === 'study_coach') {
        return 'Anlıyorum, bu gerçekten can sıkıcı olmuş. Bazen insan ne kadar uğraşsa da üst üste zorlanabilir, bu çok insani. Gel derin bir nefes alıp en baştan, ufak bir adımla başlayalım.';
      }
      return 'Anladım, bu seni biraz yormuş ve moralini bozmuş. Hiç sorun değil, acelemiz yok. Sakin sakin, tane tane bakalım.';
    }

    // 4. Sevinç / Başarı
    if (analysis.cue === 'joy') {
      return 'Harika haber bu! Gerçekten çok sevindim, emeğinin karşılığını almak müthiş bir duygu. Tebrik ederim!';
    }

    // 5. Espri / Şaka
    if (analysis.cue === 'humor') {
      return 'Güzel yaklaşımdı! Arada böyle gülümsemek zihni açıyor. Şimdi hazır keyfimiz yerindeyken konumuza da göz atalım mı?';
    }

    // 6. Kaygı / Stres
    if (analysis.cue === 'anxiety') {
      return 'Kaygılanman çok doğal ama merak etme, yalnız değilsin. Büyük hedefler bir anda değil, günlük küçük tekrarlarla başarılıyor. Gel parçalara bölelim, adım adım çözelim.';
    }

    // 7. Yorgunluk
    if (analysis.cue === 'tiredness') {
      return 'Zihnin biraz dinlenmeyi hak etmiş görünüyor. Bence bugünlük 10-15 dakika mola ver veya hafif bir tekrarla günü tamamlayalım.';
    }

    // 8. Kısa soru
    if (analysis.cue === 'short_query') {
      const lower = userMessage.toLowerCase();
      if (lower.includes('2+2') || lower.includes('2 + 2')) return '4.';
      if (lower.includes('başkent')) return 'Türkiye\'nin başkenti Ankara\'dır.';
    }

    // 9. Varsayılan branş / rol yanıtı
    if (role === 'study_coach') {
      return 'Ders Koçun olarak buradayım. Konu eksikleri, çalışma taktikleri veya sınav kaygısı üzerine nasıl ilerlemek istersin?';
    }
    if (role === 'homeroom_teacher') {
      return 'Sınıf Öğretmenin olarak seni dinliyorum. Derslerin genel durumu, deneme planlaması veya haftalık çalışma hedeflerin üzerine konuşabiliriz.';
    }

    return `${subjectCode || 'Ders'} ile ilgili aklına takılan soruyu rahatça sorabilirsin; adım adım çözelim.`;
  }
}
