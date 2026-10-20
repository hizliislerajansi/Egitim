import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { exportDatabaseToJson, importDatabaseFromJson, exportTableToCsv } from '../db/backup';
import { DemoDataManager } from '../services/demoDataManager';
import { DictionaryService } from '../services/dictionaryService';

describe('Veri koruma regresyonları', () => {
  beforeAll(async () => { await getDb().initialize(); await seedInitialData(); });
  it('tüm modülleri yedekler ve gizli anahtarları dışarı çıkarmaz', () => {
    const db = getDb();
    db.execute('INSERT OR REPLACE INTO app_settings VALUES (?, ?, ?)', ['voice_api_key', 'private-test-value', new Date().toISOString()]);
    const json = exportDatabaseToJson();
    expect(json).not.toContain('private-test-value');
    expect(JSON.parse(json).tables).toHaveProperty('english_corpus_vocab');
    expect(importDatabaseFromJson(json).success).toBe(true);
    expect(db.queryOne<{value: string}>("SELECT value FROM app_settings WHERE key='voice_api_key'")?.value).toBe('private-test-value');
  });
  it('geçersiz kayıt sonrası önceki tabloları da geri alır', () => {
    const before = exportDatabaseToJson();
    const data = JSON.parse(before);
    data.tables.student_profile = [];
    data.tables.subjects.push({...data.tables.subjects[0]});
    expect(importDatabaseFromJson(JSON.stringify(data)).success).toBe(false);
    expect(JSON.parse(exportDatabaseToJson()).tables).toEqual(JSON.parse(before).tables);
  });
  it('boş tabloyu geri yükler ve izinsiz SQL tanımlayıcılarını reddeder', () => {
    expect(importDatabaseFromJson(JSON.stringify({version: 2, tables: {ai_usage: []}})).success).toBe(true);
    expect(importDatabaseFromJson(JSON.stringify({version: 2, tables: {'subjects; DROP TABLE topics': []}})).success).toBe(false);
    expect(() => exportTableToCsv('app_settings')).toThrow();
  });
  it('demo temizliği gerçek kayıtları korur', () => {
    const db = getDb();
    db.execute("INSERT INTO ai_usage VALUES ('real_usage', 'local', 'local', 'chat', 0, 0, 0, ?)", [new Date().toISOString()]);
    DemoDataManager.clearDemoData();
    expect(db.queryOne("SELECT id FROM ai_usage WHERE id='real_usage'")).not.toBeNull();
  });
  it('çevrimdışı sözlük seçilince hiçbir ağ isteği yapmaz', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await DictionaryService.lookupWord('unknownlocalword', {skipApi: true});
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});
