import { describe, it, expect, beforeAll, vi } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { seedInitialData } from '../db/seed';
import { AiAdapter } from '../services/aiAdapter';

if (typeof localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

describe('Aşama 6: Güvenlik, Bütçe Koruma ve Gizlilik Testleri', () => {
  beforeAll(async () => {
    const db = AppDatabase.getInstance();
    await db.initialize();
    await seedInitialData();
  });

  it('API anahtarı loglara veya hata mesajlarına sızdırılmamalı', async () => {
    const db = getDb();
    const fakeSecretKey = 'sk-super-secret-key-1234567890';
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
      'api_key',
      JSON.stringify(fakeSecretKey),
      new Date().toISOString()
    ]);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline fixture'));
    // Test fixture: no credential is sent to a real provider.
    const res = await AiAdapter.request({
      taskType: 'chat',
      userMessage: 'Test mesajı'
    });

    // Çıktıda veya yanıtta asla gizli anahtar geçmemeli
    expect(res.text).not.toContain(fakeSecretKey);
    expect(JSON.stringify(res)).not.toContain(fakeSecretKey);
    fetchSpy.mockRestore();
  });

  it('Günlük bütçe dolduğunda istekler engellenmeli ve bütçe hatası fırlatılmalı', async () => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Günlük limiti 0.10 $ yapalım
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
      'daily_budget_usd',
      JSON.stringify(0.10),
      new Date().toISOString()
    ]);

    // Yapay olarak 0.15 $ harcama kaydı ekleyelim
    db.execute(`
      INSERT INTO ai_usage (id, provider, model, task_type, prompt_tokens, completion_tokens, estimated_cost_usd, timestamp)
      VALUES (?, 'gemini', 'gemini-1.5-flash', 'chat', 5000, 2000, 0.15, ?)
    `, [`fake_overbudget_${Date.now()}`, `${today}T12:00:00.000Z`]);

    const budgetStatus = AiAdapter.checkBudget();
    expect(budgetStatus.isDailyLimitExceeded).toBe(true);

    // İstek yapıldığında bütçe dolduğu için hata vermeli
    await expect(
      AiAdapter.request({ taskType: 'chat', userMessage: 'Bütçe testi' })
    ).rejects.toThrow('Günlük bütçe');
  });

  it('Çevrimdışı durumda yerel pedagojik yanıt kesintisiz dönmeli', async () => {
    const db = getDb();
    // API anahtarını temizleyelim
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
      'api_key',
      JSON.stringify(''),
      new Date().toISOString()
    ]);

    // Bütçeyi normale çekelim
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
      'daily_budget_usd',
      JSON.stringify(5.00),
      new Date().toISOString()
    ]);

    const res = await AiAdapter.request({
      taskType: 'chat',
      userMessage: 'İngilizce prefer kuralı nedir?'
    });

    expect(res.isFallback).toBe(true);
    expect(res.text.length).toBeGreaterThan(10);
    expect(res.estimatedCostUsd).toBe(0.0);
  });
});
