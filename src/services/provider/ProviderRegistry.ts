import { getDb } from '../../db/database';
import { ProviderDescriptor, SubjectType, LicenseType, AccessMode, CircuitState } from './types';

export const ALL_SYSTEM_PROVIDERS: Array<Omit<ProviderDescriptor, 'failureCount' | 'totalRequests' | 'cacheHits' | 'avgLatencyMs' | 'circuitState'>> = [
  // Matematik Sağlayıcıları
  {
    id: 'prov_newton_math',
    name: 'Newton API',
    subject: 'math',
    category: 'Sembolik Cebir & Denklem',
    endpointUrl: 'https://newton.now.sh',
    licenseType: 'api_terms_only',
    licenseName: 'Açık REST API',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Türev, integral, kök bulma ve çarpanlara ayırma işlemleri.'
  },
  {
    id: 'prov_numbers_api',
    name: 'Numbers API',
    subject: 'math',
    category: 'Sayı Özellikleri & Gerçekler',
    endpointUrl: 'http://numbersapi.com',
    licenseType: 'api_terms_only',
    licenseName: 'Açık Kullanım',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Sayıların ilginç özellikleri ve matematiksel trivia.'
  },
  {
    id: 'prov_mathjs',
    name: 'Math.js Local Engine',
    subject: 'math',
    category: 'Deterministik Hesaplama Motoru',
    endpointUrl: 'local://mathjs',
    licenseType: 'permissive_open',
    licenseName: 'Apache-2.0',
    accessMode: 'dataset_offline',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Yerel, hatasız, sıfır token maliyetli deterministik cebir motoru.'
  },

  // Fen Bilimleri & Astronomi
  {
    id: 'prov_periodic_table_json',
    name: 'Periodic Table JSON',
    subject: 'science',
    category: 'Periyodik Tablo & Elementler',
    endpointUrl: 'https://github.com/Bowserinator/Periodic-Table-JSON',
    licenseType: 'permissive_open',
    licenseName: 'CC-BY-SA / MIT',
    accessMode: 'dataset_offline',
    status: 'healthy',
    requiresApiKey: false,
    notes: '118 elementin atom numarası, kütlesi ve elektron konfigürasyonu.'
  },
  {
    id: 'prov_pubchem_pug_rest',
    name: 'PubChem PUG REST',
    subject: 'science',
    category: 'Kimyasal Bileşikler',
    endpointUrl: 'https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest',
    licenseType: 'api_terms_only',
    licenseName: 'NIH Açık Bilim Standardı',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Bileşik formülleri, molekül ağırlığı ve IUPAC adlandırması.'
  },
  {
    id: 'prov_solar_system_opendata',
    name: 'Solar System OpenData',
    subject: 'science',
    category: 'Güneş Sistemi & Gezegenler',
    endpointUrl: 'https://api.le-systeme-solaire.net',
    licenseType: 'api_terms_only',
    licenseName: 'Açık Astronomi API',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Gezegenlerin kütle, yerçekimi, yarıçap ve uydu sayıları.'
  },

  // Coğrafya & İklim
  {
    id: 'prov_rest_countries',
    name: 'REST Countries API',
    subject: 'geography',
    category: 'Dünya Ülkeleri & Demografi',
    endpointUrl: 'https://restcountries.com',
    licenseType: 'api_terms_only',
    licenseName: 'Mozilla Public License 2.0',
    accessMode: 'hybrid_cached',
    status: 'healthy',
    requiresApiKey: false,
    notes: '250 ülkenin başkenti, nüfusu, para birimi ve koordinatları.'
  },
  {
    id: 'prov_open_meteo',
    name: 'Open-Meteo',
    subject: 'geography',
    category: 'İklim & Hava Durumu',
    endpointUrl: 'https://open-meteo.com',
    licenseType: 'attribution_required',
    licenseName: 'CC-BY 4.0',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Anlık sıcaklık, rüzgar hızı ve tarihsel iklim gözlemleri.'
  },

  // Tarih
  {
    id: 'prov_wikimedia_onthisday',
    name: 'Wikimedia On This Day API',
    subject: 'history',
    category: 'Tarihte Bugün & Kronoloji',
    endpointUrl: 'https://api.wikimedia.org',
    licenseType: 'attribution_required',
    licenseName: 'CC-BY-SA 3.0',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Tarihsel olaylar, dönüm noktaları ve biyografiler.'
  },

  // Edebiyat & Sanat
  {
    id: 'prov_gutendex',
    name: 'Gutendex & Project Gutenberg',
    subject: 'literature',
    category: 'Klasik Edebiyat & Kitaplar',
    endpointUrl: 'https://gutendex.com',
    licenseType: 'permissive_open',
    licenseName: 'Public Domain',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Kamu malı dünya klasikleri katalog kaydı ve yazarlar.'
  },
  {
    id: 'prov_met_museum',
    name: 'The Met Museum Collection API',
    subject: 'literature',
    category: 'Sanat Eserleri & Kültür',
    endpointUrl: 'https://collectionapi.metmuseum.org',
    licenseType: 'permissive_open',
    licenseName: 'CC0 1.0 (Public Domain)',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Tarihi sanat eserleri, sanatçılar ve açık erişim görseller.'
  },

  // Sınav & Genel Kültür
  {
    id: 'prov_opentdb',
    name: 'Open Trivia Database',
    subject: 'trivia',
    category: 'Çoktan Seçmeli Soru Bankası',
    endpointUrl: 'https://opentdb.com',
    licenseType: 'attribution_required',
    licenseName: 'CC-BY-SA 4.0',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Fen, matematik, tarih ve coğrafya çoktan seçmeli test soruları.'
  },

  // İngilizce & Dil Öğrenimi
  {
    id: 'prov_free_dict_api',
    name: 'Free Dictionary API',
    subject: 'english',
    category: 'İngilizce Sözlük & IPA',
    endpointUrl: 'https://dictionaryapi.dev',
    licenseType: 'api_terms_only',
    licenseName: 'Açık REST API',
    accessMode: 'direct_api',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'Kelime anlamları, IPA fonetik ve MP3 telaffuz sesleri.'
  },
  {
    id: 'prov_tatoeba',
    name: 'Tatoeba Project',
    subject: 'english',
    category: 'Paralel Cümle Çiftleri',
    endpointUrl: 'https://tatoeba.org',
    licenseType: 'attribution_required',
    licenseName: 'CC-BY 2.0 FR',
    accessMode: 'dataset_offline',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'İngilizce-Türkçe bağlamsal örnek cümleler.'
  },
  {
    id: 'prov_openjam',
    name: 'Openjam CEFR Vocab',
    subject: 'english',
    category: 'Açık Kelime & Seviye',
    endpointUrl: 'https://github.com/amirj4m/openjam',
    licenseType: 'permissive_open',
    licenseName: 'MIT / CC-BY-SA',
    accessMode: 'dataset_offline',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'CEFR A1-B2 etiketli 9. sınıf kelime haznesi.'
  },
  {
    id: 'prov_cambridge_dict',
    name: 'Cambridge Dictionary',
    subject: 'english',
    category: 'Akademik Sözlük Referansı',
    endpointUrl: 'https://dictionary.cambridge.org',
    licenseType: 'proprietary_reference',
    licenseName: 'Telifli (Derin Bağlantı)',
    accessMode: 'deep_link',
    status: 'healthy',
    requiresApiKey: false,
    notes: 'İzinsiz scraping yapılmaz; öğrenciye derin referans bağlantısı verilir.'
  }
];

export class ProviderRegistry {
  private static isInitialized = false;

  /**
   * Sağlayıcı sicil tablosunu başlatır ve sağlayıcıları SQLite'a yükler
   */
  public static init(): void {
    if (this.isInitialized) return;
    const db = getDb();
    const now = new Date().toISOString();

    for (const p of ALL_SYSTEM_PROVIDERS) {
      const existing = db.queryOne<{ id: string }>(
        'SELECT id FROM unified_provider_registry WHERE id = ?',
        [p.id]
      );

      if (!existing) {
        db.run(
          `INSERT INTO unified_provider_registry (
            id, name, subject, category, endpoint_url, license_type, license_name,
            access_mode, status, circuit_state, failure_count, total_requests,
            cache_hits, avg_latency_ms, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'closed', 0, 0, 0, 0.0, ?, ?)`,
          [p.id, p.name, p.subject, p.category, p.endpointUrl, p.licenseType, p.licenseName, p.accessMode, p.status, now, now]
        );
      }
    }

    this.isInitialized = true;
  }

  /**
   * Kayıtlı tüm sağlayıcıları getirir
   */
  public static getAllProviders(): ProviderDescriptor[] {
    this.init();
    const db = getDb();
    const rows = db.query<any>('SELECT * FROM unified_provider_registry ORDER BY subject ASC, name ASC');

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      subject: r.subject as SubjectType,
      category: r.category,
      endpointUrl: r.endpoint_url,
      licenseType: r.license_type as LicenseType,
      licenseName: r.license_name,
      accessMode: r.access_mode as AccessMode,
      status: r.status,
      circuitState: r.circuit_state as CircuitState,
      failureCount: r.failure_count,
      totalRequests: r.total_requests,
      cacheHits: r.cache_hits,
      avgLatencyMs: Math.round(r.avg_latency_ms),
      lastSuccessAt: r.last_success_at,
      lastErrorAt: r.last_error_at,
      lastErrorMessage: r.last_error_message,
      requiresApiKey: false,
      notes: r.category
    }));
  }

  /**
   * Belirli bir ders için sağlayıcıları listeler
   */
  public static getProvidersBySubject(subject: SubjectType): ProviderDescriptor[] {
    return this.getAllProviders().filter(p => p.subject === subject);
  }

  /**
   * Sağlayıcı kullanım metriğini günceller
   */
  public static recordMetric(providerId: string, latencyMs: number, isCacheHit: boolean, isSuccess: boolean, errorMsg?: string): void {
    this.init();
    const db = getDb();
    const now = new Date().toISOString();

    if (isSuccess) {
      db.run(
        `UPDATE unified_provider_registry SET 
          total_requests = total_requests + 1,
          cache_hits = cache_hits + ?,
          avg_latency_ms = (avg_latency_ms * 0.8) + (? * 0.2),
          last_success_at = ?,
          status = 'healthy',
          updated_at = ?
         WHERE id = ?`,
        [isCacheHit ? 1 : 0, latencyMs, now, now, providerId]
      );
    } else {
      db.run(
        `UPDATE unified_provider_registry SET 
          total_requests = total_requests + 1,
          failure_count = failure_count + 1,
          last_error_at = ?,
          last_error_message = ?,
          status = CASE WHEN failure_count >= 3 THEN 'degraded' ELSE status END,
          updated_at = ?
         WHERE id = ?`,
        [now, errorMsg || 'Bilinmeyen hata', now, providerId]
      );
    }
  }
}
