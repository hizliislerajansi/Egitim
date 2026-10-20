import { NormalizedContent } from '../types';
import { ContentNormalizer } from '../ContentNormalizer';

const CORE_COUNTRIES: Record<string, {
  nameTr: string;
  nameEn: string;
  capital: string;
  population: number;
  areaKm2: number;
  region: string;
  currency: string;
  coordinates: [number, number];
}> = {
  turkey: { nameTr: 'Türkiye', nameEn: 'Turkey', capital: 'Ankara', population: 85372377, areaKm2: 783562, region: 'Avrasya / Akdeniz', currency: 'TRY (Türk Lirası)', coordinates: [39.9334, 32.8597] },
  germany: { nameTr: 'Almanya', nameEn: 'Germany', capital: 'Berlin', population: 84358845, areaKm2: 357022, region: 'Avrupa', currency: 'EUR (Euro)', coordinates: [52.52, 13.405] },
  japan: { nameTr: 'Japonya', nameEn: 'Japan', capital: 'Tokyo', population: 125124000, areaKm2: 377975, region: 'Doğu Asya', currency: 'JPY (Yen)', coordinates: [35.6762, 139.6503] },
  france: { nameTr: 'Fransa', nameEn: 'France', capital: 'Paris', population: 67750000, areaKm2: 551695, region: 'Batı Avrupa', currency: 'EUR (Euro)', coordinates: [48.8566, 2.3522] },
  uk: { nameTr: 'Birleşik Krallık', nameEn: 'United Kingdom', capital: 'Londra', population: 67330000, areaKm2: 242495, region: 'Batı Avrupa', currency: 'GBP (Sterlin)', coordinates: [51.5074, -0.1278] }
};

export class GeographyAdapter {
  /**
   * REST Countries API: Ülke profili ve demografik/coğrafi veriler
   */
  public static async getCountry(countryQuery: string): Promise<NormalizedContent> {
    const q = countryQuery.trim().toLowerCase();

    // 1. Çevrimdışı Çekirdek Kayıtlarda Ara
    let localFound: typeof CORE_COUNTRIES[string] | undefined = CORE_COUNTRIES[q];
    if (!localFound) {
      localFound = Object.values(CORE_COUNTRIES).find(
        c => c.nameTr.toLowerCase() === q || c.nameEn.toLowerCase() === q
      );
    }

    if (localFound) {
      return ContentNormalizer.normalize({
        providerId: 'prov_rest_countries',
        contentType: 'country_fact',
        subject: 'geography',
        topic: 'Dünya Coğrafyası ve Nüfus',
        title: `${localFound.nameTr} (${localFound.nameEn}) Ülke Profili`,
        content: `Ülke: ${localFound.nameTr} (${localFound.nameEn})\nBaşkent: ${localFound.capital}\nNüfus: ${localFound.population.toLocaleString('tr-TR')}\nYüzölçümü: ${localFound.areaKm2.toLocaleString('tr-TR')} km²\nBölge: ${localFound.region}\nPara Birimi: ${localFound.currency}\nKoordinatlar: ${localFound.coordinates[0]}, ${localFound.coordinates[1]}`,
        translation: `${localFound.nameEn}: ${localFound.nameTr}`,
        difficulty: 2,
        gradeLevel: 9,
        curriculumMapping: 'COG-09.02',
        licenseId: 'api_terms_only',
        attribution: 'Kaynak: REST Countries API & Yerel Coğrafi İstatistikler',
        metadata: {
          capital: localFound.capital,
          population: localFound.population,
          area_km2: localFound.areaKm2,
          coordinates: localFound.coordinates
        }
      });
    }

    // 2. Canlı REST Countries API Çağrısı Denemesi
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryQuery)}?fields=name,capital,population,area,region,currencies,latlng`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const list = await res.json();
        const data = list[0];
        if (data) {
          const commonName = data.name?.common || countryQuery;
          const cap = data.capital?.[0] || 'Belirtilmemiş';
          const pop = data.population || 0;
          const area = data.area || 0;
          const coords = data.latlng || [0, 0];

          return ContentNormalizer.normalize({
            providerId: 'prov_rest_countries',
            contentType: 'country_fact',
            subject: 'geography',
            topic: 'Ülkeler Coğrafyası',
            title: `${commonName} Ülke Profili`,
            content: `Ülke: ${commonName}\nBaşkent: ${cap}\nNüfus: ${pop.toLocaleString('tr-TR')}\nYüzölçümü: ${area.toLocaleString('tr-TR')} km²\nBölge: ${data.region || 'Dünya'}\nKoordinatlar: ${coords.join(', ')}`,
            difficulty: 2,
            gradeLevel: 9,
            curriculumMapping: 'COG-09.02',
            licenseId: 'api_terms_only',
            attribution: 'Kaynak: REST Countries (https://restcountries.com)',
            metadata: { capital: cap, population: pop, area_km2: area, coordinates: coords }
          });
        }
      }
    } catch {}

    // Fallback
    return ContentNormalizer.normalize({
      providerId: 'prov_rest_countries',
      contentType: 'country_fact',
      subject: 'geography',
      title: `Coğrafi Bölge İncelemesi: ${countryQuery}`,
      content: `Yeryüzü şekilleri, iklim kuşakları ve insan yerleşimleri coğrafyanın temel inceleme alanıdır.`,
      difficulty: 2,
      gradeLevel: 9,
      curriculumMapping: 'COG-09.01',
      licenseId: 'permissive_open',
      attribution: 'Kaynak: MEB 9. Sınıf Coğrafya'
    });
  }

  /**
   * Open-Meteo: Anlık iklim ve hava gözlemleri
   */
  public static async getWeather(lat = 39.93, lng = 32.85): Promise<NormalizedContent> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const current = json.current_weather;
        return ContentNormalizer.normalize({
          providerId: 'prov_open_meteo',
          contentType: 'weather_fact',
          subject: 'geography',
          topic: 'İklim ve Hava Durumu',
          title: `Hava Durumu Gözlemi (${lat}, ${lng})`,
          content: `Sıcaklık: ${current.temperature} °C\nRüzgar Hızı: ${current.windspeed} km/s\nSaat: ${current.time}`,
          difficulty: 1,
          gradeLevel: 9,
          licenseId: 'api_terms_only',
          attribution: 'Kaynak: Open-Meteo (https://open-meteo.com) - CC-BY 4.0',
          ttlHours: 1, // Hava durumu için 1 saat önbellek
          metadata: { temperature_c: current.temperature, windspeed: current.windspeed }
        });
      }
    } catch {}

    return ContentNormalizer.normalize({
      providerId: 'prov_open_meteo',
      contentType: 'weather_fact',
      subject: 'geography',
      title: `İklim Bilgisi`,
      content: `Türkiye'de Akdeniz, Karadeniz ve Karasal iklim olmak üzere üç ana iklim tipi görülmektedir.`,
      difficulty: 1,
      gradeLevel: 9,
      licenseId: 'permissive_open',
      attribution: 'Kaynak: Yerel Coğrafya Kütüphanesi'
    });
  }
}
