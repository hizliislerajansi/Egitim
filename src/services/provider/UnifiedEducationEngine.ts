import { NormalizedContent, ProviderQuery, ValidationResult } from './types';
import { ProviderRegistry } from './ProviderRegistry';
import { SourceSelector } from './SourceSelector';
import { CacheManager } from './CacheManager';
import { FallbackManager } from './FallbackManager';
import { ContentValidator } from './ContentValidator';
import { LicenseChecker } from './LicenseChecker';
import { AuditLogger, CostController } from './AuditLogger';

export interface EngineResponse {
  content: NormalizedContent;
  fromCache: boolean;
  fromFallback: boolean;
  verification: ValidationResult;
  latencyMs: number;
  savings: { tokens: number; costUsd: number };
}

export class UnifiedEducationEngine {
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized) return;
    ProviderRegistry.init();
    this.isInitialized = true;
  }

  /**
   * 12 Adımlı Merkezi Veri Erişim Hattı
   */
  public static async executeQuery(query: ProviderQuery): Promise<EngineResponse> {
    this.initialize();
    const startTime = performance.now();
    const cleanText = query.text.trim();
    const savings = CostController.calculateSavings();

    // 1. Önbellekte Arama
    const cached = CacheManager.findBySubjectAndTitle(query.subject, cleanText);
    if (cached) {
      const latencyMs = Math.round(performance.now() - startTime);
      const verification = ContentValidator.validateContent(cached);

      ProviderRegistry.recordMetric(cached.providerId, latencyMs, true, true);
      AuditLogger.log({
        providerId: cached.providerId,
        action: 'cache_lookup',
        subject: query.subject,
        query: cleanText,
        status: 'cache_hit',
        latencyMs,
        tokensSaved: savings.tokens,
        costSavedUsd: savings.costUsd,
        details: `Önbellekten anında getirildi (TTL aktif).`
      });

      return {
        content: cached,
        fromCache: true,
        fromFallback: false,
        verification,
        latencyMs,
        savings
      };
    }

    // 2. Adaptörü Seç ve Çalıştır
    let result: NormalizedContent;
    let fromFallback = false;

    try {
      result = await SourceSelector.routeQuery(query);
      FallbackManager.recordSuccess(result.providerId);
    } catch (err: any) {
      // Hata durumunda yerel devre kesici ve yedeğe geç
      FallbackManager.recordFailure('system');
      fromFallback = true;
      result = FallbackManager.getFallbackContent(query.subject, cleanText);
    }

    // 3. Çok Aşamalı Doğrulama
    const verification = ContentValidator.validateContent(result);
    if (!verification.isValid) {
      // Hatalı içerik tespit edilirse güvenli yedeğe yönlendir
      result = FallbackManager.getFallbackContent(query.subject, cleanText);
      fromFallback = true;
    }

    // 4. Lisans Kontrolü
    if (!LicenseChecker.isSafeToDisplay(result.licenseId)) {
      result = FallbackManager.getFallbackContent(query.subject, cleanText);
      fromFallback = true;
    }

    // 5. Uygunsa Önbelleğe Al
    if (!fromFallback && verification.isValid) {
      CacheManager.set(result);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    // 6. Metrik ve Denetim Kaydı
    ProviderRegistry.recordMetric(result.providerId, latencyMs, false, !fromFallback);
    AuditLogger.log({
      providerId: result.providerId,
      action: 'source_fetch',
      subject: query.subject,
      query: cleanText,
      status: fromFallback ? 'fallback_invoked' : 'success',
      latencyMs,
      tokensSaved: savings.tokens,
      costSavedUsd: savings.costUsd,
      details: `Doğrulama: ${verification.method} (Güven: ${verification.confidence.toFixed(2)})`
    });

    return {
      content: result,
      fromCache: false,
      fromFallback,
      verification,
      latencyMs,
      savings
    };
  }

  /**
   * Tüm ders sağlayıcılarının sağlık durumunu ve istatistiklerini getirir
   */
  public static getDashboardStatus() {
    this.initialize();
    const providers = ProviderRegistry.getAllProviders();
    const cacheStats = CacheManager.getCacheStats();
    const metrics = AuditLogger.getMetrics();

    return {
      providers,
      cacheStats,
      metrics,
      totalHealthyProviders: providers.filter(p => p.status === 'healthy').length,
      totalProviders: providers.length
    };
  }
}
