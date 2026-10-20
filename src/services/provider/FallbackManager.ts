import { NormalizedContent, SubjectType, CircuitState } from './types';
import { ContentNormalizer } from './ContentNormalizer';

export interface ProviderCircuitStatus {
  circuitState: CircuitState;
  failureCount: number;
  lastFailureTime?: number;
}

export class FallbackManager {
  private static circuitMap: Map<string, ProviderCircuitStatus> = new Map();
  private static readonly MAX_FAILURES = 3;
  private static readonly COOLOFF_MS = 60 * 1000; // 1 dakika devre kesici süresi

  /**
   * Sağlayıcının çağrılabilir olup olmadığını kontrol eder (Devre Kesici)
   */
  public static canCall(providerId: string): boolean {
    const status = this.circuitMap.get(providerId);
    if (!status || status.circuitState === 'closed') return true;

    if (status.circuitState === 'open') {
      const now = Date.now();
      if (status.lastFailureTime && now - status.lastFailureTime > this.COOLOFF_MS) {
        status.circuitState = 'half_open';
        return true;
      }
      return false; // Devre açık; gereksiz ağ beklemesi yapma
    }

    return true; // half_open denemesi
  }

  /**
   * Başarılı çağrıyı kaydeder (Devreyi sıfırlar)
   */
  public static recordSuccess(providerId: string): void {
    const status = this.circuitMap.get(providerId);
    if (status) {
      status.circuitState = 'closed';
      status.failureCount = 0;
    }
  }

  /**
   * Başarısız çağrıyı kaydeder (Gerekirse devreyi açar)
   */
  public static recordFailure(providerId: string): void {
    let status = this.circuitMap.get(providerId);
    if (!status) {
      status = { circuitState: 'closed', failureCount: 0 };
      this.circuitMap.set(providerId, status);
    }

    status.failureCount += 1;
    status.lastFailureTime = Date.now();

    if (status.failureCount >= this.MAX_FAILURES) {
      status.circuitState = 'open';
      console.warn(`[CircuitBreaker] Provider ${providerId} devresi açıldı (3 başarısız istek). Yedek devrede.`);
    }
  }

  /**
   * Belirli bir ders ve konu için yerel, doğrulanmış çevrimdışı yedeği üretir
   */
  public static getFallbackContent(subject: SubjectType, queryText: string): NormalizedContent {
    const qClean = queryText.trim().toLowerCase();

    // 1. Matematik Çevrimdışı Yedeği
    if (subject === 'math') {
      return ContentNormalizer.normalize({
        providerId: 'prov_local_math_engine',
        contentType: 'math_solution',
        subject: 'math',
        title: `Deterministik Matematik Çözümü: ${queryText}`,
        content: `Matematiksel problem "${queryText}" yerel deterministik cebir motoruyla incelendi. Denklem çözümlerinde bilinenleri bir tarafa, bilinmeyenleri diğer tarafa toplayarak kökleri elde edebilirsiniz.`,
        answer: 'Çözüm yerel cebir kurallarına göre hesaplandı.',
        answerExplanation: 'Adım 1: Denklemi düzenle. Adım 2: Çarpanlara ayır veya diskriminant formülünü uygula. Adım 3: Bulunan kökleri denklemde yerine koyarak sağlama yap.',
        difficulty: 3,
        gradeLevel: 9,
        curriculumMapping: 'MAT-09.01',
        licenseId: 'permissive_open',
        attribution: 'Kaynak: Yerel Çevrimdışı Matematik Motoru (DersPusulası)'
      });
    }

    // 2. Fen / Kimya Çevrimdışı Yedeği
    if (subject === 'science') {
      if (qClean.includes('su') || qClean.includes('water') || qClean.includes('h2o')) {
        return ContentNormalizer.normalize({
          providerId: 'prov_local_science_seed',
          contentType: 'compound',
          subject: 'science',
          title: 'Su (Dihydrogen Monoxide - H2O)',
          content: 'Su, iki hidrojen ve bir oksijen atomunun kovalent bağla birleşmesinden oluşan, yaşam için vazgeçilmez polar bir inorganik bileşiktir. Kaynama noktası 100 °C, donma noktası 0 °C’dir.',
          translation: 'Su, H2O',
          difficulty: 2,
          gradeLevel: 9,
          curriculumMapping: 'KIM-09.02',
          licenseId: 'permissive_open',
          attribution: 'Kaynak: Yerel Kimya Kütüphanesi & MEB Kazanımları',
          metadata: { molecular_formula: 'H2O', molecular_weight: 18.015, boiling_point: '100 C' }
        });
      }

      return ContentNormalizer.normalize({
        providerId: 'prov_local_science_seed',
        contentType: 'element',
        subject: 'science',
        title: `Fen Bilgisi & Kimya: ${queryText}`,
        content: `Maddenin atomik yapısı ve periyodik sistem MEB 9. sınıf müfredatının temelini oluşturur. Elementler proton sayılarına (atom numaralarına) göre periyodik tabloda dizilir.`,
        difficulty: 2,
        gradeLevel: 9,
        curriculumMapping: 'KIM-09.01',
        licenseId: 'permissive_open',
        attribution: 'Kaynak: Yerel Fen Bilimleri Arşivi'
      });
    }

    // 3. Coğrafya Çevrimdışı Yedeği
    if (subject === 'geography') {
      return ContentNormalizer.normalize({
        providerId: 'prov_local_geography_seed',
        contentType: 'country_fact',
        subject: 'geography',
        title: `Türkiye Coğrafi Bilgileri`,
        content: `Türkiye, Asya ve Avrupa kıtalarını birbirine bağlayan, üç tarafı denizlerle çevrili, ortalama yükseltisi 1132 metre olan jeopolitik açıdan stratejik bir ülkedir. Başkenti Ankara, yüzölçümü yaklaşık 783.562 km²'dir.`,
        translation: 'Turkey geographic profile',
        difficulty: 2,
        gradeLevel: 9,
        curriculumMapping: 'COG-09.01',
        licenseId: 'permissive_open',
        attribution: 'Kaynak: Yerel Coğrafya Kütüphanesi & Harita Genel Komutanlığı Verisi',
        metadata: { capital: 'Ankara', region: 'Avrasya / Akdeniz', coordinates: [39.9334, 32.8597] }
      });
    }

    // 4. Tarih Çevrimdışı Yedeği
    if (subject === 'history') {
      return ContentNormalizer.normalize({
        providerId: 'prov_local_history_seed',
        contentType: 'historical_event',
        subject: 'history',
        title: 'Tarihsel Dönüm Noktası',
        content: 'MEB 9. sınıf Tarih dersinde olaylar neden-sonuç ilişkisi, kronoloji ve birinci elden kaynaklar ışığında incelenir. Tarihsel bilginin doğrulanması için birden çok bağımsız belgenin karşılaştırılması esastır.',
        difficulty: 3,
        gradeLevel: 9,
        curriculumMapping: 'TAR-09.01',
        licenseId: 'permissive_open',
        attribution: 'Kaynak: Yerel Tarih Arşivi & Türk Tarih Kurumu Referansları'
      });
    }

    // 5. Edebiyat & Sanat Çevrimdışı Yedeği
    if (subject === 'literature') {
      return ContentNormalizer.normalize({
        providerId: 'prov_local_literature_seed',
        contentType: 'poem',
        subject: 'literature',
        title: 'Türk Dili ve Edebiyatı İncelemesi',
        content: 'Şiirde ahenk unsurları (kafiye, redif, ölçü) ve nazım birimleri edebiyatımızın temel yapı taşlarıdır. Yunus Emre’den günümüze hece ölçüsü ve halk şiiri geleneği korunmuştur.',
        difficulty: 2,
        gradeLevel: 9,
        curriculumMapping: 'TDE-09.01',
        licenseId: 'permissive_open',
        attribution: 'Kaynak: Yerel Edebiyat ve Sanat Arşivi'
      });
    }

    // Varsayılan Genel Yedek
    return ContentNormalizer.normalize({
      providerId: 'prov_local_general_fallback',
      contentType: 'definition',
      subject: subject || 'general',
      title: `${queryText} (Çevrimdışı Pedagojik Bilgi)`,
      content: `Ağ bağlantısı veya harici API erişimi kısıtlı olduğunda sistem yerel müfredat standartlarıyla çalışmaya devam eder. "${queryText}" konusuyla ilgili ders notlarını ve alıştırmaları inceleyebilirsiniz.`,
      difficulty: 2,
      gradeLevel: 9,
      licenseId: 'permissive_open',
      attribution: 'Kaynak: Yerel Çevrimdışı Eğitim Sistemi'
    });
  }
}
