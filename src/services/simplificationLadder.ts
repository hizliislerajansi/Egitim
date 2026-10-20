import { AdaptiveProfile } from './studentProfileEngine';

export type SimplificationStep = 
  | 'normal'            // 1. Normal anlatım
  | 'simpler'           // 2. Daha basit anlatım
  | 'analogy'           // 3. Günlük yaşam örneği
  | 'visual'            // 4. Görsel / Şematik anlatım
  | 'step_by_step'      // 5. Adım adım çözüm
  | 'prerequisite_check'// 6. Ön bilgi kontrolü
  | 'alternative_method'// 7. Alternatif yöntem
  | 'quick_check';      // 8. Kısa kontrol (1 Soru)

export interface SimplificationResult {
  step: SimplificationStep;
  stepNumber: number;
  stepTitle: string;
  adaptedContent: string;
  followUpPrompt: string;
  checkQuestion?: {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

export class SimplificationLadder {
  /**
   * 8 Aşamalı Kademeli Basitleştirme Motoru
   * Öğrencinin yaş, sınıf ve anlama seviyesine göre içeriği uyarlar.
   */
  public static generateExplanation(
    step: SimplificationStep,
    topicName: string,
    subjectCode: string,
    profile: AdaptiveProfile,
    baseConceptText?: string
  ): SimplificationResult {
    const isMath = subjectCode === 'MATH' || subjectCode.toLowerCase().includes('mat');
    const isEng = subjectCode === 'ENG' || subjectCode.toLowerCase().includes('ing');
    const isSci = ['PHYS', 'CHEM', 'BIO'].includes(subjectCode) || subjectCode.toLowerCase().includes('fen');
    const isSocial = ['HIST', 'GEO', 'LIT'].includes(subjectCode);

    // Hitap tonu ayarı
    const greeting = profile.addressStyle === 'samimi' 
      ? `Sevgili ${profile.name}, gel birlikte bakalım:` 
      : profile.addressStyle === 'tesvik_edici'
      ? `Harika bir merak gösteriyorsun ${profile.name}! Adım adım başaracağız:`
      : `Sayın ${profile.name}, konunun akademik çözümlemesi:`;

    switch (step) {
      case 'normal':
        return {
          step: 'normal',
          stepNumber: 1,
          stepTitle: '1. Seviyeye Uygun Normal Anlatım',
          adaptedContent: `${greeting}\n\n### 📘 ${topicName}\n${baseConceptText || 'Bu konu, 9. sınıf müfredatımızın temel yapı taşlarından biridir.'}\n\nKonunun temel tanımı: Bağımsız değişkenler ile bağımlı sonuçlar arasındaki mantıksal bağıntıyı ifade eder.`,
          followUpPrompt: 'Bu anlatım yeterli oldu mu, yoksa daha somut bir örnekle mi pekiştirelim?'
        };

      case 'simpler':
        return {
          step: 'simpler',
          stepNumber: 2,
          stepTitle: '2. Sadeleştirilmiş ve Parçalanmış Anlatım',
          adaptedContent: `${greeting}\n\n### 🧩 Parça Parça Sade Anlatım: ${topicName}\n\nKarmaşık akademik terimleri bir kenara bırakalım:\n1. **Temel Girdi (Giren Şey):** Elimizdeki başlangıç bilgisi.\n2. **Kural (Dönüşüm):** Girdiye uygulanan tek bir işlem kuralı.\n3. **Çıktı (Elde Edilen):** Kuralın sonucunda oluşan yeni değer.\n\nHer seferinde yalnızca 1 adımı düşünmemiz yeterlidir!`,
          followUpPrompt: 'Şimdi günlük hayattan tanıdık bir benzetme görmek ister misin?'
        };

      case 'analogy':
        const analogyExample = isMath
          ? 'Matematiksel fonksiyonları bir **meyve suyu sıkacağına** benzetebilirsin. İçine portakal atarsan (girdi), makine onu sıkar (fonksiyon kuralı) ve sana portakal suyu verir (çıktı). Portakal atıp elma suyu alamazsın; her girdinin kesin ve tek bir çıktısı vardır!'
          : isSci
          ? 'Atom yapısını bir **güneş sistemine** benzetebilirsin. Güneş merkezdeki çekirdek (proton ve nötronlar), gezegenler ise etrafındaki yörüngelerde dönen elektronlardır.'
          : isEng
          ? 'İngilizce cümle kurmayı **vagonları birbirine bağlanan bir trene** benzetebilirsin: 1. Lokomotif: Özne (Kim?), 2. İlk Vagon: Fiil (Ne yapıyor?), 3. Son Vagonlar: Nesne ve Yer/Zaman (Neyi, Nerede?).'
          : 'Tarihî olayları bir **domino taşı dizilimine** benzetebilirsin. Bir olayın sonucu, bir sonraki olayın başlangıç nedenini tetikler.';

        return {
          step: 'analogy',
          stepNumber: 3,
          stepTitle: '3. Günlük Yaşam Analojisi',
          adaptedContent: `${greeting}\n\n### 🌍 Günlük Hayattan Bir Benzetme\n\n${analogyExample}\n\nBu sayede soyut formüller yerine gözünün önünde canlandırabileceğin somut bir modelle düşünebilirsin.`,
          followUpPrompt: 'Bunu şematik olarak bir tablo veya çizimle görmek ister misin?'
        };

      case 'visual':
        const visualContent = isMath
          ? `\`\`\`text
  [ Girdi Kümesi A ]        [ Fonksiyon Kuralı: f(x) = 2x + 1 ]        [ Çıktı Kümesi B ]
         ( 1 )      ───────▶        ( 2·1 + 1 )           ───────▶         ( 3 )
         ( 2 )      ───────▶        ( 2·2 + 1 )           ───────▶         ( 5 )
         ( 3 )      ───────▶        ( 2·3 + 1 )           ───────▶         ( 7 )
\`\`\``
          : `\`\`\`text
  +------------------+         +------------------+         +------------------+
  |    Başlangıç     |  ====>  |      Süreç       |  ====>  |      Sonuç       |
  | (Neden / Girdi)  |         |   (Uygulama)     |         | (Çıktı / Durum)  |
  +------------------+         +------------------+         +------------------+
\`\`\``;

        return {
          step: 'visual',
          stepNumber: 4,
          stepTitle: '4. Şematik ve Görsel Taslak',
          adaptedContent: `${greeting}\n\n### 📊 Şematik Görünüm\n\n${visualContent}\n\nGördüğün gibi her eleman karşısındaki tek bir hedefe net bir ok ile bağlanmaktadır.`,
          followUpPrompt: 'Birlikte adım adım bir örnek çözelim mi?'
        };

      case 'step_by_step':
        return {
          step: 'step_by_step',
          stepNumber: 5,
          stepTitle: '5. Adım Adım Rehberli Çözüm',
          adaptedContent: `${greeting}\n\n### 🐾 Adım Adım Düşünme ve Çözüm Rehberi\n\n- **Adım 1 (Verilenleri Yaz):** Soruda bize ne verilmiş? Hangi sayılar veya bilgiler elimizde var?\n- **Adım 2 (İsteneni Netleştir):** Bizden tam olarak neyi bulmamız isteniyor?\n- **Adım 3 (İşlem Köprüsü):** Verilenlerden istenene ulaşmak için hangi kuralı veya formülü kullanacağız?\n- **Adım 4 (Uygula & Kontrol Et):** İşlemi acele etmeden adım adım tamamlayıp birimini kontrol ediyoruz.`,
          followUpPrompt: 'Bu adımda eksik kalan bir temel bilgi hissediyor musun?'
        };

      case 'prerequisite_check':
        return {
          step: 'prerequisite_check',
          stepNumber: 6,
          stepTitle: '6. Ön Bilgi ve Temel Kontrolü',
          adaptedContent: `${greeting}\n\n### 🔍 Ön Bilgi Teşhisi\n\nBu konuda zorlanıyorsan bu gayet doğaldır; çünkü bu konu doğrudan şu 2 temel ön bilgiye dayanır:\n1. **Temel İşlem Önceliği ve İşaret Kuralları** (Negatif sayıların çarpımı ve parantezler)\n2. **Basit 1. Dereceden Denklem Çözümü** (Bilinmeyeni yalnız bırakma)\n\nEğer istersen ana konuya geçmeden önce bu 2 dakikalık ön bilgiyi tazeleyelim.`,
          followUpPrompt: 'Ön bilgiyi hatırladın mı, yoksa alternatif bir yöntem mi deneyelim?'
        };

      case 'alternative_method':
        return {
          step: 'alternative_method',
          stepNumber: 7,
          stepTitle: '7. Alternatif / Tersine Düşünme Yöntemi',
          adaptedContent: `${greeting}\n\n### 💡 Farklı Bir Bakış Açısı (Alternatif Yöntem)\n\nDoğrudan formülle gitmek yerine **seçeneklerden deneme** veya **ters işlem** yöntemini kullanabiliriz:\n- Sonuçtan geriye doğru gidelim:\n  Eğer çıkış değerimiz 7 ise ve kuralımız "2 ile çarp 1 ekle" idiyse;\n  Tersini yapalım: Önce 1 çıkar (7 - 1 = 6), sonra 2'ye böl (6 / 2 = 3).\n  Demek ki başlangıç sayımız 3 imiş!\n\nTers işlem yöntemi çoğu zaman zihinden çok daha hızlı sonuç verir.`,
          followUpPrompt: 'Harika! Şimdi küçük bir mini soruyla kendini test etmek ister misin?'
        };

      case 'quick_check':
      default:
        return {
          step: 'quick_check',
          stepNumber: 8,
          stepTitle: '8. Anlayış Kontrolü (1 Kısa Soru)',
          adaptedContent: `${greeting}\n\n### 🎯 Kısa Kontrol Sorusu (Sadece 1 Soru!)\n\nKuralımız: "Giren sayıyı 3 ile çarp ve 2 çıkar."\nİçeriye **4** sayısını gönderirsek dışarıya hangi sayı çıkar?`,
          followUpPrompt: 'Cevabını seç veya yaz, hemen birlikte doğrulayalım!',
          checkQuestion: {
            questionText: 'Kuralımız f(x) = 3x - 2 olduğuna göre, f(4) kaçtır?',
            options: ['A) 8', 'B) 10', 'C) 12', 'D) 14'],
            correctAnswer: 'B) 10',
            explanation: 'f(4) = 3·(4) - 2 = 12 - 2 = 10 olur. Harika kavradın!'
          }
        };
    }
  }

  /**
   * Öğrencinin isteğine veya durumuna göre en uygun basamağı otomatik önerir
   */
  public static recommendNextStep(
    currentStep: SimplificationStep,
    userFeedback: 'too_hard' | 'give_example' | 'show_steps' | 'check_me' | 'just_answer'
  ): SimplificationStep {
    switch (userFeedback) {
      case 'give_example':
        return 'analogy';
      case 'show_steps':
        return 'step_by_step';
      case 'check_me':
        return 'quick_check';
      case 'too_hard':
        if (currentStep === 'normal') return 'simpler';
        if (currentStep === 'simpler') return 'analogy';
        if (currentStep === 'analogy') return 'visual';
        if (currentStep === 'visual') return 'step_by_step';
        if (currentStep === 'step_by_step') return 'prerequisite_check';
        return 'alternative_method';
      case 'just_answer':
      default:
        return 'step_by_step';
    }
  }
}
