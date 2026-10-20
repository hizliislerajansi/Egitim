import { NormalizedContent } from '../types';
import { ContentNormalizer } from '../ContentNormalizer';

// Çekirdek Periyodik Tablo Verisi (Bowserinator / IUPAC Standartları)
const CORE_ELEMENTS: Record<string, {
  name: string;
  nameTr: string;
  symbol: string;
  number: number;
  atomicMass: number;
  group: number;
  period: number;
  category: string;
  summary: string;
  electronConfig: string;
}> = {
  h: { name: 'Hydrogen', nameTr: 'Hidrojen', symbol: 'H', number: 1, atomicMass: 1.008, group: 1, period: 1, category: 'Ametal', summary: 'Evrende en çok bulunan elementtir. Su molekülünün ana bileşenidir.', electronConfig: '1s1' },
  he: { name: 'Helium', nameTr: 'Helyum', symbol: 'He', number: 2, atomicMass: 4.0026, group: 18, period: 1, category: 'Soygaz', summary: 'Renksiz, kokusuz, tek atomlu asal gazdır. Yıldızların nükleer füzyon ürünüdür.', electronConfig: '1s2' },
  li: { name: 'Lithium', nameTr: 'Lityum', symbol: 'Li', number: 3, atomicMass: 6.94, group: 1, period: 2, category: 'Alkali Metal', summary: 'En hafif metaldir; batarya teknolojilerinde kritik role sahiptir.', electronConfig: '[He] 2s1' },
  c: { name: 'Carbon', nameTr: 'Karbon', symbol: 'C', number: 6, atomicMass: 12.011, group: 14, period: 2, category: 'Ametal', summary: 'Organik kimyanın ve Dünya üzerindeki yaşamın temel yapı taşıdır.', electronConfig: '[He] 2s2 2p2' },
  n: { name: 'Nitrogen', nameTr: 'Azot', symbol: 'N', number: 7, atomicMass: 14.007, group: 15, period: 2, category: 'Ametal', summary: 'Dünya atmosferinin yaklaşık %78’ini oluşturan hayati gazdır.', electronConfig: '[He] 2s2 2p3' },
  o: { name: 'Oxygen', nameTr: 'Oksijen', symbol: 'O', number: 8, atomicMass: 15.999, group: 16, period: 2, category: 'Ametal', summary: 'Hücresel solunum ve yanma reaksiyonları için zorunlu elementtir.', electronConfig: '[He] 2s2 2p4' },
  na: { name: 'Sodium', nameTr: 'Sodyum', symbol: 'Na', number: 11, atomicMass: 22.990, group: 1, period: 3, category: 'Alkali Metal', summary: 'Yumuşak, gümüş-beyaz renkli, suyla şiddetli tepkime veren alkali metaldir.', electronConfig: '[Ne] 3s1' },
  fe: { name: 'Iron', nameTr: 'Demir', symbol: 'Fe', number: 26, atomicMass: 55.845, group: 8, period: 4, category: 'Geçiş Metali', summary: 'Yerkabuğunda ve canlılarda hemoglobin yapısında bulunan kritik metaldir.', electronConfig: '[Ar] 3d6 4s2' },
  cu: { name: 'Copper', nameTr: 'Bakır', symbol: 'Cu', number: 29, atomicMass: 63.546, group: 11, period: 4, category: 'Geçiş Metali', summary: 'Elektrik ve ısı iletkenliği son derece yüksek, sünek bir metaldir.', electronConfig: '[Ar] 3d10 4s1' },
  au: { name: 'Gold', nameTr: 'Altın', symbol: 'Au', number: 79, atomicMass: 196.97, group: 11, period: 6, category: 'Soy Metal', summary: 'Korozyona ve oksitlenmeye karşı son derece dirençli kıymetli metaldir.', electronConfig: '[Xe] 4f14 5d10 6s1' }
};

// Güneş Sistemi Gezegen Verileri (Solar System OpenData Standardı)
const SOLAR_PLANETS: Record<string, {
  name: string;
  nameTr: string;
  gravity: number; // m/s^2
  meanRadius: number; // km
  orbitDays: number;
  moons: number;
  summary: string;
}> = {
  earth: { name: 'Earth', nameTr: 'Dünya', gravity: 9.807, meanRadius: 6371.0, orbitDays: 365.25, moons: 1, summary: 'Güneş Sistemi’nde bilinen yaşamı barındıran tek gök cismidir.' },
  mars: { name: 'Mars', nameTr: 'Mars', gravity: 3.72, meanRadius: 3389.5, orbitDays: 687, moons: 2, summary: 'Kızıl Gezegen olarak bilinir; yüzeyindeki demir oksit kırmızımsı bir görünüm verir.' },
  jupiter: { name: 'Jupiter', nameTr: 'Jüpiter', gravity: 24.79, meanRadius: 69911, orbitDays: 4333, moons: 95, summary: 'Güneş Sistemi’nin en büyük gaz devi gezegenidir; Büyük Kırmızı Leke fırtınasıyla ünlüdür.' },
  saturn: { name: 'Saturn', nameTr: 'Satürn', gravity: 10.44, meanRadius: 58232, orbitDays: 10759, moons: 146, summary: 'Geniş ve parlak halka sistemiyle bilinen ikinci büyük gaz devidir.' }
};

export class ScienceAdapter {
  /**
   * Element arama (Sembol, ad veya atom numarası ile)
   */
  public static async getElement(query: string): Promise<NormalizedContent> {
    const q = query.trim().toLowerCase();
    let found = CORE_ELEMENTS[q];

    if (!found) {
      // Sembole veya ada göre ara
      found = Object.values(CORE_ELEMENTS).find(
        el => el.symbol.toLowerCase() === q || el.name.toLowerCase() === q || el.nameTr.toLowerCase() === q || String(el.number) === q
      ) as any;
    }

    if (found) {
      return ContentNormalizer.normalize({
        providerId: 'prov_periodic_table_json',
        contentType: 'element',
        subject: 'science',
        topic: 'Periyodik Sistem ve Elementler',
        title: `${found.nameTr} (${found.symbol}) - Atom No: ${found.number}`,
        content: `Element Adı: ${found.nameTr} (${found.name})\nSembol: ${found.symbol}\nAtom Numarası: ${found.number}\nAtom Kütlesi: ${found.atomicMass} g/mol\nPeriyot: ${found.period}, Grup: ${found.group} (${found.category})\nElektron Dizilimi: ${found.electronConfig}\nGenel Bilgi: ${found.summary}`,
        translation: `${found.symbol}: ${found.nameTr}`,
        difficulty: 2,
        gradeLevel: 9,
        curriculumMapping: 'KIM-09.01',
        licenseId: 'permissive_open',
        attribution: 'Kaynak: Periodic Table JSON (Bowserinator/Periodic-Table-JSON) & IUPAC',
        metadata: {
          atomic_number: found.number,
          symbol: found.symbol,
          atomic_mass: found.atomicMass,
          group: found.group,
          period: found.period,
          category: found.category
        }
      });
    }

    // Bulunamadıysa genel element bilgisi dön
    return ContentNormalizer.normalize({
      providerId: 'prov_periodic_table_json',
      contentType: 'element',
      subject: 'science',
      title: `Element İncelemesi: ${query}`,
      content: `Periyodik sistemdeki elementler artan atom numaralarına göre sıralanır. Elementlerin son katmanındaki değerlik elektronları kimyasal özelliklerini belirler.`,
      difficulty: 2,
      gradeLevel: 9,
      curriculumMapping: 'KIM-09.01',
      licenseId: 'permissive_open',
      attribution: 'Kaynak: MEB 9. Sınıf Kimya ve Periyodik Sistem'
    });
  }

  /**
   * PubChem PUG REST API: Kimyasal bileşik sorgusu
   */
  public static async getCompound(compoundName: string): Promise<NormalizedContent> {
    const cleanName = compoundName.trim();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanName)}/JSON`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const cid = json?.PC_Compounds?.[0]?.id?.id?.cid;
        if (cid) {
          return ContentNormalizer.normalize({
            providerId: 'prov_pubchem_pug_rest',
            contentType: 'compound',
            subject: 'science',
            topic: 'Kimyasal Türler ve Bileşikler',
            title: `Kimyasal Bileşik: ${cleanName} (CID: ${cid})`,
            content: `PubChem CID: ${cid}\nBileşik adı: ${cleanName}\nDetaylı yapısal özellikler ve 2D/3D koordinat verisi PubChem veritabanında doğrulanmıştır.`,
            difficulty: 3,
            gradeLevel: 9,
            curriculumMapping: 'KIM-09.02',
            licenseId: 'api_terms_only',
            attribution: 'Kaynak: PubChem PUG REST (NIH National Library of Medicine)',
            sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
            metadata: { cid, compound_name: cleanName }
          });
        }
      }
    } catch {}

    // Yerel Fallback (Su, Tuz, Karbondioksit)
    return ContentNormalizer.normalize({
      providerId: 'prov_pubchem_pug_rest',
      contentType: 'compound',
      subject: 'science',
      topic: 'Bileşikler ve Formüller',
      title: `Bileşik Bilgisi: ${cleanName}`,
      content: `Kimyasal bileşikler iki veya daha fazla farklı elementin sabit kütle oranlarında birleşmesiyle oluşur.`,
      difficulty: 2,
      gradeLevel: 9,
      curriculumMapping: 'KIM-09.02',
      licenseId: 'permissive_open',
      attribution: 'Kaynak: Yerel Kimya Kütüphanesi'
    });
  }

  /**
   * Solar System Gezegen Bilgisi
   */
  public static async getPlanet(planetName: string): Promise<NormalizedContent> {
    const key = planetName.trim().toLowerCase();
    const p = SOLAR_PLANETS[key] || SOLAR_PLANETS['earth'];

    return ContentNormalizer.normalize({
      providerId: 'prov_solar_system_opendata',
      contentType: 'planet_data',
      subject: 'science',
      topic: 'Güneş Sistemi ve Astronomi',
      title: `${p.nameTr} (${p.name}) Gezegen Profili`,
      content: `Gezegen: ${p.nameTr} (${p.name})\nYerçekimi İvmesi (g): ${p.gravity} m/s²\nOrtalama Yarıçap: ${p.meanRadius} km\nYörünge Periyodu: ${p.orbitDays} Dünya günü\nDoğal Uydu Sayısı: ${p.moons}\nÖzet: ${p.summary}`,
      translation: `${p.name}: ${p.nameTr}`,
      difficulty: 2,
      gradeLevel: 9,
      licenseId: 'api_terms_only',
      attribution: 'Kaynak: Solar System OpenData (api.le-systeme-solaire.net)',
      metadata: { gravity: p.gravity, radius_km: p.meanRadius, orbit_days: p.orbitDays, moons: p.moons }
    });
  }
}
