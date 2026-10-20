import { NormalizedContent } from '../types';
import { ContentNormalizer } from '../ContentNormalizer';

const CORE_LITERATURE: Record<string, {
  title: string;
  author: string;
  period: string;
  form: string;
  sampleLines: string[];
  theme: string;
  curriculumCode: string;
}> = {
  dede_korkut: {
    title: 'Dede Korkut Hikâyeleri',
    author: 'Anonim / Dede Korkut',
    period: 'Geçiş Dönemi Türk Edebiyatı',
    form: 'Nazım - Nesir Karışık Destansı Hikâye',
    sampleLines: ['Dedem Korkut geldi, boy boyladı, soy soyladı...', 'Gelimli gidimli dünya, son ucu ölümlü dünya.'],
    theme: 'Oğuz Türklerinin kahramanlıkları, aile yapısı, töre ve inançları.',
    curriculumCode: 'TDE-09.02'
  },
  yunus_emre: {
    title: 'İlim İlim Bilmektir',
    author: 'Yunus Emre',
    period: 'Halk Edebiyatı / Tasavvuf Şiiri',
    form: 'Koşma / İlahî Nazım Şekli (Hece Ölçüsü)',
    sampleLines: ['İlim ilim bilmektir, ilim kendin bilmektir.', 'Sen kendini bilmezsin, ya nice okumaktır?'],
    theme: 'İnsanın kendini tanıması, alçakgönüllülük ve evrensel sevgi.',
    curriculumCode: 'TDE-09.03'
  },
  otuz_bes_yas: {
    title: 'Otuz Beş Yaş Şiiri',
    author: 'Cahit Sıtkı Tarancı',
    period: 'Cumhuriyet Dönemi Türk Şiiri',
    form: 'Hece Ölçüsüyle Lirik Şiir',
    sampleLines: ['Yaş otuz beş! Yolun yarısı eder.', 'Dante gibi ortasındayız ömrün.'],
    theme: 'Zamanın akışı, fanilik ve yaşama sevinci.',
    curriculumCode: 'TDE-09.04'
  }
};

export class LiteratureArtAdapter {
  /**
   * Edebi eser veya şiir arama
   */
  public static async getLiterature(query: string): Promise<NormalizedContent> {
    const q = query.trim().toLowerCase();

    // 1. Çekirdek Edebiyat Kayıtlarında Ara
    let found = Object.values(CORE_LITERATURE).find(
      lit => lit.title.toLowerCase().includes(q) || lit.author.toLowerCase().includes(q)
    );

    if (found) {
      return ContentNormalizer.normalize({
        providerId: 'prov_local_literature_seed',
        contentType: 'poem',
        subject: 'literature',
        topic: 'Türk Dili ve Edebiyatı Eser İncelemesi',
        title: `${found.title} - ${found.author}`,
        content: `Eser: ${found.title}\nYazar/Şair: ${found.author}\nDönem: ${found.period}\nNazım Şekli/Tür: ${found.form}\nTema: ${found.theme}\n\nÖrnek Dizeler:\n"${found.sampleLines.join('\n')}"`,
        difficulty: 2,
        gradeLevel: 9,
        curriculumMapping: found.curriculumCode,
        licenseId: 'permissive_open',
        attribution: 'Kaynak: MEB Türk Dili ve Edebiyatı & Açık Halk Şiiri Külliyatı',
        metadata: { author: found.author, period: found.period, form: found.form }
      });
    }

    // 2. Gutendex / Project Gutenberg Çevrimiçi Kitap Arama Denemesi
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const url = `https://gutendex.com/books/?search=${encodeURIComponent(query)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const book = data.results?.[0];
        if (book) {
          const authorName = book.authors?.[0]?.name || 'Bilinmiyor';
          return ContentNormalizer.normalize({
            providerId: 'prov_gutendex',
            contentType: 'book_record',
            subject: 'literature',
            topic: 'Dünya Klasikleri',
            title: `${book.title} (${authorName})`,
            content: `Kitap: ${book.title}\nYazar: ${authorName}\nDiller: ${book.languages?.join(', ')}\nİndirme Sayısı: ${book.download_count}\nKonular: ${book.subjects?.slice(0, 3).join('; ')}`,
            difficulty: 3,
            gradeLevel: 9,
            licenseId: 'permissive_open',
            attribution: 'Kaynak: Project Gutenberg & Gutendex (Public Domain)',
            metadata: { gutenberg_id: book.id, author: authorName, download_count: book.download_count }
          });
        }
      }
    } catch {}

    // Fallback
    return ContentNormalizer.normalize({
      providerId: 'prov_local_literature_seed',
      contentType: 'poem',
      subject: 'literature',
      title: `Edebi İnceleme: ${query}`,
      content: `Edebiyat duygu, düşünce ve hayallerin dil aracılığıyla estetik biçimde ifade edilme sanatıdır.`,
      difficulty: 2,
      gradeLevel: 9,
      curriculumMapping: 'TDE-09.01',
      licenseId: 'permissive_open',
      attribution: 'Kaynak: MEB 9. Sınıf Türk Dili ve Edebiyatı'
    });
  }

  /**
   * The Met Museum Collection API: Sanat eseri sorgusu
   */
  public static async getArtwork(searchQuery: string): Promise<NormalizedContent> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(searchQuery)}&hasImages=true`;
      const searchRes = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const objectId = searchJson.objectIDs?.[0];
        if (objectId) {
          const itemRes = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`);
          if (itemRes.ok) {
            const item = await itemRes.json();
            return ContentNormalizer.normalize({
              providerId: 'prov_met_museum',
              contentType: 'artwork',
              subject: 'literature',
              topic: 'Sanat Tarihi ve Görsel Kültür',
              title: `${item.title || searchQuery} (${item.artistDisplayName || 'Anonim'})`,
              content: `Eser: ${item.title}\nSanatçı: ${item.artistDisplayName || 'Bilinmiyor'}\nDönem/Tarih: ${item.objectDate || 'Tarih belirtilmemiş'}\nKültür: ${item.culture || 'Genel'}\nTeknik/Materyal: ${item.medium || 'Bilinmiyor'}`,
              difficulty: 2,
              gradeLevel: 9,
              licenseId: 'permissive_open',
              attribution: 'Kaynak: The Metropolitan Museum of Art Open Access (CC0)',
              sourceUrl: item.objectURL,
              metadata: { object_id: objectId, artist: item.artistDisplayName, date: item.objectDate, image_url: item.primaryImageSmall }
            });
          }
        }
      }
    } catch {}

    // Fallback Sanat Eseri
    return ContentNormalizer.normalize({
      providerId: 'prov_local_art_seed',
      contentType: 'artwork',
      subject: 'literature',
      title: `Sanat Tarihi: ${searchQuery}`,
      content: `Görsel sanatlar insanlığın estetik arayışını ve kültürel mirasını taşların, renklerin ve çizgilerin diliyle günümüze ulaştırır.`,
      difficulty: 2,
      gradeLevel: 9,
      licenseId: 'permissive_open',
      attribution: 'Kaynak: Açık Sanat Tarihi Arşivi'
    });
  }
}
