import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, formatBytes } from '../services/storageService';
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

describe('StorageService (Bölüm 8: Yerel Depolama ve Güvenli Taşıma Testleri)', () => {
  beforeEach(async () => {
    localStorage.clear();
    const db = AppDatabase.getInstance();
    await db.initialize();
  });

  it('1. formatBytes sayıları doğru birimlere çevirmelidir', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  it('2. getStorageLocation varsayılan ve özel depolama konumlarını doğru bildirmelidir', () => {
    const loc = StorageService.getStorageLocation();
    expect(loc.path).toBeTruthy();
    expect(loc.isWritable).toBe(true);
    expect(loc.type).toBeDefined();
  });

  it('3. getStorageUsage kategorik disk kullanımını ve kota durumunu hesaplamalıdır', async () => {
    const usage = await StorageService.getStorageUsage();
    expect(usage.totalBytes).toBe(0); // No browser quota API in Node.
    expect(usage.usedBytes).toBeGreaterThan(0);
    expect(usage.freeBytes).toBeGreaterThanOrEqual(0);
    expect(usage.categories.length).toBe(3);

    const dbCategory = usage.categories.find(c => c.id === 'database');
    expect(dbCategory).toBeDefined();
    expect(dbCategory?.bytes).toBeGreaterThan(0);
  });

  it('4. validateDestination geçerli ve geçersiz dosya yollarını ayırt etmelidir', () => {
    // Boş yol
    const emptyCheck = StorageService.validateDestination('');
    expect(emptyCheck.valid).toBe(false);

    // Geçersiz yol
    const invalidCheck = StorageService.validateDestination('http://invalid:path/??');
    expect(invalidCheck.valid).toBe(false);

    // Geçerli Windows C: yolu
    const cCheck = StorageService.validateDestination('C:\\DersProgramiDepo');
    expect(cCheck.valid).toBe(true);
    expect(cCheck.detectedType).toBe('local_custom');

    // Geçerli Harici D: yolu
    const dCheck = StorageService.validateDestination('D:\\Harici_Egitim_Diski');
    expect(dCheck.valid).toBe(true);
    expect(dCheck.detectedType).toBe('external_disk');

    // Geçerli Ağ Yolu
    const netCheck = StorageService.validateDestination('\\\\OkulSunucusu\\OrtakDepo');
    expect(netCheck.valid).toBe(true);
    expect(netCheck.detectedType).toBe('network_share');
  });

  it('5. prepareMigrationPlan doğru taşınacak veri boyutunu ve güvenlik payını hesaplamalıdır', async () => {
    const plan = await StorageService.prepareMigrationPlan('D:\\Yeni_Depo');
    expect(plan.planId).toBeTruthy();
    expect(plan.targetPath).toBe('D:\\Yeni_Depo');
    expect(plan.targetType).toBe('external_disk');
    expect(plan.totalSizeBytes).toBeGreaterThan(0);
    expect(plan.requiredFreeSpaceBytes).toBeGreaterThan(plan.totalSizeBytes);
  });

  it('6. unsupported migration must not report success or change storage', async () => {
    const before=StorageService.getStorageLocation();
    const plan=await StorageService.prepareMigrationPlan('D:\\DersProgrami_SSD');
    const progress=vi.fn();
    await expect(StorageService.executeMigration(plan,progress)).rejects.toThrow('desteklenmiyor');
    expect(StorageService.getStorageLocation()).toEqual(before);
    expect(progress).not.toHaveBeenCalled();
    expect(StorageService.confirmCleanupOldStorage('D:\\old').success).toBe(false);
  });

  it('7. getLargeFilesList dosyaları boyutlarına göre sıralı döndürmelidir', async () => {
    const files = await StorageService.getLargeFilesList(10);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0].id).toBe('sqlite_main_database');
  });

  it('8. createFullStorageSnapshot ve restoreFullStorageSnapshot tam yedek alıp geri yükleyebilmelidir', () => {
    const snapshot = StorageService.createFullStorageSnapshot();
    expect(snapshot.json).toBeTruthy();
    expect(snapshot.filename).toContain('derspusulasi_tam_yedek_');

    const restoreRes = StorageService.restoreFullStorageSnapshot(snapshot.json);
    expect(restoreRes.success).toBe(true);
  });
});
