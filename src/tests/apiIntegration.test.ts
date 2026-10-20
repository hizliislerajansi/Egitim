import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { AiAdapter } from '../services/aiAdapter';
import { deleteProviderKey, getProviderProfile, hasProviderKey, saveProviderProfile, sendAiRequest, writeSetting } from '../services/apiClient';

beforeAll(async () => {await getDb().initialize(); await seedInitialData();});
afterEach(() => {vi.restoreAllMocks(); vi.useRealTimers();});
describe('Gerçek API sözleşmesi ve anahtar izolasyonu', () => {
  it('sağlayıcı değiştirilince eski anahtarı yeni servise göndermez', async () => {
    writeSetting('ai_provider', 'gemini'); writeSetting('api_key', 'isolated-fixture');
    await saveProviderProfile('openai', {model: 'gpt-4o-mini', enabled: true});
    await deleteProviderKey('openai');
    expect(await hasProviderKey('openai')).toBe(false);
    expect(await hasProviderKey('gemini')).toBe(true);
    expect(getDb().queryOne("SELECT key FROM app_settings WHERE key='api_key'")).toBeNull();
    await deleteProviderKey('gemini');
  });
  it('yeni anahtarı veritabanına yazmaz ve model tercihini korur', async () => {
    await saveProviderProfile('gemini', {model:'gemini-test-model', enabled:true}, 'test-fixture-not-real');
    expect(JSON.stringify(getDb().query('SELECT * FROM app_settings'))).not.toContain('test-fixture-not-real');
    expect(getProviderProfile('gemini').model).toBe('gemini-test-model');
  });
  it('429 yanıtında tekrar ücretli çağrı veya sahte başarı üretmez', async () => {
    const fetchMock = vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('{}', {status:429}));
    const result = await AiAdapter.testConnection('gemini');
    expect(result.success).toBe(false); expect(result.message).toContain('429');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('boş sağlayıcı yanıtını bağlantı başarısı saymaz', async () => {
    vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({candidates:[]})));
    const result = await AiAdapter.testConnection('gemini');
    expect(result.success).toBe(false);
    expect(result.message).toContain('metin');
  });
  it('eksik kullanım verisini uydurmaz ve anahtarı URL içine koymaz', async () => {
    const fetchMock = vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({candidates:[{content:{parts:[{text:'Merhaba'}]}}]})));
    writeSetting('ai_provider','gemini');
    const result = await AiAdapter.request({taskType:'chat',userMessage:'test'});
    expect(result.isFallback).toBe(false); expect(result.usageKnown).toBe(false); expect(result.costKnown).toBe(false);
    expect(result.tokensUsed.total).toBe(0);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain('test-fixture-not-real');
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string,string>)['x-goog-api-key']).toBe('test-fixture-not-real');
  });
  it('devre dışı sağlayıcıda ağa çıkmaz', async () => {
    await saveProviderProfile('gemini', {model:'gemini-test-model', enabled:false});
    const fetchMock = vi.spyOn(globalThis,'fetch');
    await expect(sendAiRequest({provider:'gemini', model:'gemini-test-model', system:'', message:'test', maxTokens:10})).rejects.toThrow('devre dışı');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('ağ zaman aşımını doğru bildirir', async () => {
    await saveProviderProfile('gemini', {model:'gemini-test-model', enabled:true});
    vi.useFakeTimers();
    vi.spyOn(globalThis,'fetch').mockImplementation((_url, init) => new Promise((_resolve,reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted','AbortError')));
    }));
    const pending = AiAdapter.testConnection('gemini');
    await vi.advanceTimersByTimeAsync(30001);
    const result = await pending;
    expect(result.success).toBe(false); expect(result.message).toContain('zamanında');
  });
});
