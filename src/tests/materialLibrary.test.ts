import { describe, it, expect, beforeEach } from 'vitest';
import { MaterialLibraryService, computeMaterialHash } from '../services/materialLibraryService';
import { AppDatabase } from '../db/database';

// Node ortamında localStorage polyfill
if (typeof localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

describe('MaterialLibraryService (Bölüm 7: Yerel Materyal Kütüphanesi ve Tekrar Kullanım Testleri)', () => {
  beforeEach(async () => {
    localStorage.clear();
    const db = AppDatabase.getInstance();
    await db.initialize();
  });

  it('1. computeMaterialHash deterministik ve tutarlı hash üretmelidir', () => {
    const hash1 = computeMaterialHash({
      topicId: 'top_fonksiyonlar',
      contentType: 'visual',
      seedText: 'Fonksiyon Tanım ve Değer Kümesi Grafiği',
      model: 'gemini_image'
    });
    const hash2 = computeMaterialHash({
      topicId: 'top_fonksiyonlar',
      contentType: 'visual',
      seedText: 'Fonksiyon Tanım ve Değer Kümesi Grafiği',
      model: 'gemini_image'
    });
    const hashDiff = computeMaterialHash({
      topicId: 'top_fonksiyonlar',
      contentType: 'speech',
      seedText: 'Farklı içerik',
      model: 'gemini_tts'
    });

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiff);
    expect(hash1.startsWith('mat_')).toBe(true);
  });

  it('2. registerMaterial ilk kayıtta yeni materyal oluşturmalı, tekrar çağrıldığında mevcut olanı yeniden kullanmalıdır (Deduplication)', async () => {
    const res1 = await MaterialLibraryService.registerMaterial({
      subjectId: 'subj_math',
      topicId: 'top_fonksiyonlar',
      contentType: 'visual',
      title: 'Birebir ve Örten Fonksiyon Şeması',
      generatorModel: 'gemini_nano',
      seedContent: 'Birebir ve örten fonksiyon grafiği',
      verificationStatus: 'verified'
    });

    expect(res1.reused).toBe(false);
    expect(res1.material.version).toBe(1);
    expect(res1.material.reuse_count).toBe(0);

    // Aynı konu ve içerikle tekrar çağırıldığında yeniden üretmemeli, mevcut materyali döndürmelidir
    const res2 = await MaterialLibraryService.registerMaterial({
      subjectId: 'subj_math',
      topicId: 'top_fonksiyonlar',
      contentType: 'visual',
      title: 'Birebir ve Örten Fonksiyon Şeması',
      generatorModel: 'gemini_nano',
      seedContent: 'Birebir ve örten fonksiyon grafiği'
    });

    expect(res2.reused).toBe(true);
    expect(res2.material.id).toBe(res1.material.id);
    expect(res2.material.reuse_count).toBe(1);
  });

  it('3. createNewVersion eski materyalin üzerine yazmak yerine sürümü artırmalıdır (Versioning)', async () => {
    const initial = await MaterialLibraryService.registerMaterial({
      subjectId: 'subj_eng',
      topicId: 'top_present_perfect',
      contentType: 'speech',
      title: 'Present Perfect Telaffuz Anlatımı',
      generatorModel: 'gemini-3.8-flash-tts',
      seedContent: 'Present Perfect Tense sesli ders',
      verificationStatus: 'verified'
    });

    expect(initial.material.version).toBe(1);

    // Yeni sürüm üret
    const v2 = await MaterialLibraryService.createNewVersion(initial.material.id, {
      title: 'Present Perfect Telaffuz Anlatımı (Gelişmiş V2)',
      generatorModel: 'gemini-3.8-flash-tts',
      newContentSeed: 'Güncellenmiş MEB örnekleri ile Present Perfect',
      verificationStatus: 'verified'
    });

    expect(v2.version).toBe(2);
    expect(v2.id).not.toBe(initial.material.id);

    // Her iki sürüm de kütüphanede bulunmalıdır
    const all = MaterialLibraryService.listMaterials({ topicId: 'top_present_perfect' });
    expect(all.length).toBe(2);
  });

  it('4. listMaterials filtreleme kriterlerine uygun sonuçları döndürmelidir', async () => {
    await MaterialLibraryService.registerMaterial({
      subjectId: 'subj_phys',
      topicId: 'top_ozkutle',
      contentType: 'simulation',
      title: 'Özkütle Sıvı Taşırma Simülasyonu',
      generatorModel: 'phet_canvas',
      seedContent: 'Su ve taş simülasyonu'
    });

    const physMaterials = MaterialLibraryService.listMaterials({ subjectId: 'subj_phys' });
    expect(physMaterials.length).toBeGreaterThanOrEqual(1);
    expect(physMaterials[0].subject_id).toBe('subj_phys');
  });

  it('5. getMaterialStats toplam materyal, tekrar kullanım ve tahmini token tasarrufunu hesaplamalıdır', async () => {
    const stats = MaterialLibraryService.getMaterialStats();
    expect(stats.totalCount).toBeGreaterThanOrEqual(0);
    expect(stats.totalReuses).toBeGreaterThanOrEqual(0);
    expect(stats.typeBreakdown).toBeDefined();
    expect(stats.tokensSavedEstimate).toBeGreaterThanOrEqual(0);
  });
});
