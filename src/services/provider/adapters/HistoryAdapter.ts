import { NormalizedContent } from '../types';
import { ContentNormalizer } from '../ContentNormalizer';

const CORE_HISTORY_EVENTS: Array<{
  year: number;
  title: string;
  summary: string;
  significance: string;
  curriculumCode: string;
}> = [
  {
    year: 1071,
    title: 'Malazgirt Meydan Muharebesi',
    summary: 'Sultan Alparslan komutasındaki Büyük Selçuklu ordusu, Bizans İmparatoru Romen Diyojen’in ordusunu Malazgirt Ovası’nda mağlup etmiştir.',
    significance: 'Anadolu’nun kapıları Türklere kesin olarak açılmış ve Türkiye tarihi başlamıştır.',
    curriculumCode: 'TAR-09.05'
  },
  {
    year: 1453,
    title: 'İstanbul’un Fethi',
    summary: 'Fatih Sultan Mehmet komutasındaki Osmanlı ordusu 53 günlük kuşatmanın ardından Konstantinopolis’i fethetmiştir.',
    significance: 'Orta Çağ kapanmış, Yeni Çağ başlamış; Doğu Roma (Bizans) İmparatorluğu sona ermiştir.',
    curriculumCode: 'TAR-09.06'
  },
  {
    year: 1839,
    title: 'Tanzimat Fermanı (Gülhane Hatt-ı Hümayunu)',
    summary: 'Sultan Abdülmecid döneminde Hariciye Nazırı Mustafa Reşid Paşa tarafından ilan edilen anayasal nitelikli yenileşme fermanıdır.',
    significance: 'Hukukun üstünlüğü, can, mal ve namus güvenliği devlet güvencesine alınmıştır.',
    curriculumCode: 'TAR-09.07'
  },
  {
    year: 1923,
    title: 'Türkiye Cumhuriyeti’nin İlanı',
    summary: 'Gazi Mustafa Kemal Atatürk’ün önderliğinde TBMM tarafından cumhuriyet rejimi resmen ilan edilmiştir.',
    significance: 'Egemenlik kayıtsız şartsız millete geçmiş ve modern Türkiye’nin temeli atılmıştır.',
    curriculumCode: 'TAR-09.08'
  }
];

export class HistoryAdapter {
  /**
   * Tarihsel olay arama (Konu veya yıla göre)
   */
  public static async getEvent(query: string): Promise<NormalizedContent> {
    const q = query.trim().toLowerCase();
    const matched = CORE_HISTORY_EVENTS.find(
      e => e.title.toLowerCase().includes(q) || String(e.year) === q || q.includes(String(e.year))
    );

    if (matched) {
      return ContentNormalizer.normalize({
        providerId: 'prov_wikimedia_onthisday',
        contentType: 'historical_event',
        subject: 'history',
        topic: 'Türk ve Dünya Tarihi Dönüm Noktaları',
        title: `${matched.year}: ${matched.title}`,
        content: `Yıl: ${matched.year}\nOlay: ${matched.title}\nAçıklama: ${matched.summary}\nTarihsel Önemi: ${matched.significance}`,
        difficulty: 3,
        gradeLevel: 9,
        curriculumMapping: matched.curriculumCode,
        licenseId: 'attribution_required',
        attribution: 'Kaynak: Wikimedia On This Day & Türk Tarih Kurumu Arşivi',
        metadata: { year: matched.year, significance: matched.significance }
      });
    }

    // Çevrimiçi Wikimedia On This Day API Denemesi (Bugünün Tarihi)
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/${month}/${day}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const firstEvent = json.selected?.[0];
        if (firstEvent) {
          return ContentNormalizer.normalize({
            providerId: 'prov_wikimedia_onthisday',
            contentType: 'historical_event',
            subject: 'history',
            topic: 'Tarihte Bugün',
            title: `Tarihte Bugün (${firstEvent.year}): ${firstEvent.text.substring(0, 60)}...`,
            content: `Yıl: ${firstEvent.year}\nOlay: ${firstEvent.text}`,
            translation: `Tarihte bugün (${firstEvent.year}): ${firstEvent.text}`,
            difficulty: 2,
            gradeLevel: 9,
            licenseId: 'attribution_required',
            attribution: 'Kaynak: Wikimedia On This Day API (CC-BY-SA 3.0)',
            metadata: { year: firstEvent.year }
          });
        }
      }
    } catch {}

    // Fallback
    return ContentNormalizer.normalize({
      providerId: 'prov_local_history_seed',
      contentType: 'historical_event',
      subject: 'history',
      title: `Tarihsel İnceleme: ${query}`,
      content: `Tarih bilimi geçmişte yaşamış insan topluluklarının faaliyetlerini yer ve zaman göstererek, neden-sonuç ilişkisi içinde belgelere dayalı olarak inceler.`,
      difficulty: 2,
      gradeLevel: 9,
      curriculumMapping: 'TAR-09.01',
      licenseId: 'permissive_open',
      attribution: 'Kaynak: MEB 9. Sınıf Tarih'
    });
  }
}
