import { describe, it, expect } from 'vitest';
import { ENGLISH_LANGUAGE_SOURCES } from '../data/englishSources';
import { DictionaryService } from '../services/dictionaryService';

describe('Açık Dil Bilimi, CEFR ve İngilizce Kaynak Entegrasyon Testleri', () => {
  it('1. Kullanıcının talep ettiği 10 açık dil kaynağının tamamı eksiksiz tanımlanmış olmalıdır', () => {
    expect(ENGLISH_LANGUAGE_SOURCES.length).toBe(10);

    const names = ENGLISH_LANGUAGE_SOURCES.map(s => s.name);
    expect(names).toContain('Openjam');
    expect(names).toContain('Open Language Profiles – CEFR-J');
    expect(names).toContain('Free Dictionary API');
    expect(names).toContain('Tatoeba');
    expect(names).toContain('Princeton WordNet');
    expect(names).toContain('VOA Learning English');
    expect(names).toContain('British Council LearnEnglish Teens');
    expect(names).toContain('Cambridge Dictionary');
    expect(names).toContain('Wiktionary');
    expect(names).toContain('CEFR – Council of Europe');

    // Her bir kaynağın geçerli bir http/https url'i olmalı
    ENGLISH_LANGUAGE_SOURCES.forEach(s => {
      expect(s.url.startsWith('http')).toBe(true);
      expect(s.shortDesc.length).toBeGreaterThan(10);
      expect(s.integrationNote.length).toBeGreaterThan(10);
    });
  });

  it('2. DictionaryService: Kelime sorgulandığında doğru CEFR seviyesi, fonetik ve derin bağlantıları üretmelidir', async () => {
    const entry = await DictionaryService.lookupWord('exchange', { timeoutMs: 1000 });
    expect(entry.word).toBe('exchange');
    expect(entry.cefrLevel).toBe('A2');
    expect(entry.phonetic).toBeDefined();
    expect(entry.tatoebaUrl).toContain('tatoeba.org');
    expect(entry.cambridgeUrl).toContain('dictionary.cambridge.org');
    expect(entry.wiktionaryUrl).toContain('wiktionary.org');
    expect(entry.wordnetUrl).toContain('wordnet');
    expect(entry.meanings.length).toBeGreaterThan(0);
  });

  it('3. DictionaryService: Çevrimdışı veya bilinmeyen kelimelerde dahi kesintisiz fallback sağlamalıdır', async () => {
    const fallbackEntry = await DictionaryService.lookupWord('unknownwordxyz', { skipApi: true });
    expect(fallbackEntry.word).toBe('unknownwordxyz');
    expect(fallbackEntry.cefrLevel).toBeDefined();
    expect(fallbackEntry.meanings.length).toBeGreaterThan(0);
    expect(fallbackEntry.tatoebaUrl).toContain('unknownwordxyz');
  });

  it('4. CEFR Seviye rozetleri (A1, A2, B1, B2) pedagojik olarak doğru renk ve etiketleri döndürmelidir', () => {
    const a1 = DictionaryService.getCefrBadge('A1');
    const a2 = DictionaryService.getCefrBadge('A2');
    const b1 = DictionaryService.getCefrBadge('B1');

    expect(a1.label).toContain('A1');
    expect(a2.label).toContain('A2');
    expect(b1.label).toContain('B1');
    expect(a1.color).toBe('#10b981');
    expect(a2.color).toBe('#2563eb');
  });
});
