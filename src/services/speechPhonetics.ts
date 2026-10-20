import {pronunciationText} from './pronunciation';
/**
 * SpeechPhonetics Service
 * 
 * Ekranda kullanıcıya gösterilen metin ile ses motorunun (TTS) okuyacağı metni ayırır.
 * Kullanıcı ekranda "CAR", "s(A ∪ B) = 18", "|2x - 6| = 10" gibi biçimlendirilmiş metinleri görür.
 * Ancak ses motoruna gönderilmeden önce bu servis metni doğal telaffuz edilebilecek
 * konuşma metnine ("Car", "A birleşim B'nin eleman sayısı eşittir 18", "mutlak değer 2 x eksi 6") dönüştürür.
 * Kullanıcı bu dönüşümü görmez; sadece doğal okunuşu dinler.
 */

export class SpeechPhonetics {
  /**
   * Metni TTS motorunun doğru, akıcı ve harf harf kodlamadan okuyacağı konuşma metnine çevirir.
   */
  public static toSpokenText(rawText: string, lang: 'tr-TR' | 'en-US' = 'tr-TR',custom:Record<string,string>={}): string {
    if (!rawText) return '';

    let text = pronunciationText(rawText,lang,custom);

    // 1. Boşluk doldurma çizgilerini (____) "boşluk" veya "blank" olarak telaffuz et
    if (lang === 'en-US') {
      text = text.replace(/_{2,}/g, ' blank ');
    } else {
      text = text.replace(/_{2,}/g, ' boşluk ');
    }

    // 2. Markdown etiketlerini ve işaretlerini temizle
    text = text.replace(/[*#`~]/g, ' ');
    text = text.replace(/(?<!\w)_(?!\w)/g, ' ');
    text = text.replace(/\n+/g, '. ');

    // 3. Büyük harfle yazılmış kelimeleri harf harf kodlamadan doğal telaffuza çevir (Örn: CAR -> Car)
    text = text.replace(/\b([A-Z]{2,6})\b/g, (match) => {
      const acronyms: Record<string, string> = {
        'MEB': 'Meb',
        'TBMM': 'Te be me me',
        'LİSE': 'Lise',
        'AI': lang === 'en-US' ? 'A I' : 'Ey Ay',
        'TTS': 'Te Te Se',
        'STT': 'Se Te Te',
        'OK': 'Okey',
        'TV': 'Teve'
      };
      if (acronyms[match]) return acronyms[match];
      // CAR -> Car, BOOK -> Book, APPLE -> Apple
      return match.charAt(0) + match.slice(1).toLowerCase();
    });

    // 4. Matematik ve Mantık Sembollerini Doğal Türkçe Konuşmaya Çevir
    if (lang === 'tr-TR') {
      // Kümeler
      text = text.replace(/s\(([A-Za-z])\s*∪\s*([A-Za-z])\)/g, '$1 birleşim $2 nin eleman sayısı');
      text = text.replace(/s\(([A-Za-z])\s*∩\s*([A-Za-z])\)/g, '$1 kesişim $2 nin eleman sayısı');
      text = text.replace(/s\(([A-Za-z])\s*\\\s*([A-Za-z])\)/g, '$1 fark $2 nin eleman sayısı');
      text = text.replace(/s\(([A-Za-z])\)/g, '$1 kümesinin eleman sayısı');
      text = text.replace(/([A-Za-z])\s*∪\s*([A-Za-z])/g, '$1 birleşim $2');
      text = text.replace(/([A-Za-z])\s*∩\s*([A-Za-z])/g, '$1 kesişim $2');
      text = text.replace(/([A-Za-z])\s*\\\s*([A-Za-z])/g, '$1 fark $2');
      text = text.replace(/([A-Za-z])\s*x\s*([A-Za-z])/g, '$1 kartezyen çarpım $2');

      // Mantık Sembolleri
      text = text.replace(/∧/g, ' ve ');
      text = text.replace(/∨/g, ' veya ');
      text = text.replace(/⇒/g, ' ise ');
      text = text.replace(/⇔/g, ' ancak ve ancak ');
      text = text.replace(/≡/g, ' denktir ');
      text = text.replace(/≢/g, ' denk değildir ');
      text = text.replace(/p'/g, "p'nin değili");
      text = text.replace(/q'/g, "q'nün değili");
      text = text.replace(/r'/g, "r'nin değili");

      // Mutlak Değer
      text = text.replace(/\|([^|]+)\|/g, 'mutlak değer $1');

      // Üslü İfadeler
      text = text.replace(/([a-zA-Z0-9]+)\^2\b|([a-zA-Z0-9]+)²/g, (_match,a,b)=>`${a||b} kare`);
      text = text.replace(/([a-zA-Z0-9]+)\^3\b|([a-zA-Z0-9]+)³/g, (_match,a,b)=>`${a||b} küp`);
      text = text.replace(/2\^n\b|2ⁿ/g, '2 üzeri n');
      text = text.replace(/([0-9a-zA-Z]+)\^([0-9a-zA-Z]+)/g, '$1 üzeri $2');

      // Cebirsel ve Karşılaştırma İşaretleri
      text = text.replace(/≤/g, ' küçük eşittir ');
      text = text.replace(/≥/g, ' büyük eşittir ');
      text = text.replace(/≠/g, ' eşit değildir ');
      text = text.replace(/=/g, ' eşittir ');
      text = text.replace(/∈/g, ' elemanıdır ');
      text = text.replace(/∉/g, ' elemanı değildir ');
      text = text.replace(/⊆/g, ' alt kümesidir ');
      text = text.replace(/∅/g, ' boş küme ');
      text = text.replace(/±/g, ' artı eksi ');

      // Açı ve Geometri
      text = text.replace(/m\(([A-Z])\)/g, '$1 açısının ölçüsü');
      text = text.replace(/°/g, ' derece');

      // Fizik ve Kimya Sembolleri
      text = text.replace(/F\s*=\s*m\s*[·*x]\s*a/gi, 'F eşittir m çarpı a');
      text = text.replace(/H2O|H₂O/g, 'H iki O');
      text = text.replace(/CO2|CO₂/g, 'karbondioksit');
      text = text.replace(/O2|O₂/g, 'oksijen');
    }

    // Fazla boşlukları temizle
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }
}
