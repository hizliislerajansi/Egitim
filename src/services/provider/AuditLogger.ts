import { getDb } from '../../db/database';
import { AuditLogEntry, SubjectType } from './types';

export class AuditLogger {
  /**
   * Teknik denetim ve performans kaydı ekler
   */
  public static log(entry: {
    providerId?: string;
    action: string;
    subject: SubjectType;
    query: string;
    status: 'success' | 'cache_hit' | 'fallback_invoked' | 'verification_failed' | 'rate_limited' | 'error';
    latencyMs: number;
    tokensSaved?: number;
    costSavedUsd?: number;
    details?: string;
  }): void {
    const db = getDb();
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    try {
      db.run(
        `INSERT INTO unified_audit_log (
          id, timestamp, provider_id, action, subject, query, status,
          latency_ms, tokens_saved, cost_saved_usd, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          now,
          entry.providerId || 'system',
          entry.action,
          entry.subject,
          entry.query.substring(0, 200),
          entry.status,
          entry.latencyMs,
          entry.tokensSaved || 0,
          entry.costSavedUsd || 0.0,
          entry.details || null
        ]
      );
    } catch (e) {
      console.warn('AuditLogger error:', e);
    }
  }

  /**
   * Son denetim loglarını getirir
   */
  public static getRecentLogs(limit = 50): AuditLogEntry[] {
    const db = getDb();
    const rows = db.query<any>(
      'SELECT * FROM unified_audit_log ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );

    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      providerId: r.provider_id,
      action: r.action,
      subject: r.subject as SubjectType,
      query: r.query,
      status: r.status,
      latencyMs: r.latency_ms,
      tokensSaved: r.tokens_saved,
      costSavedUsd: r.cost_saved_usd,
      details: r.details
    }));
  }

  /**
   * Genel denetim metriklerini hesaplar (Toplam tasarruf, istek sayısı vb.)
   */
  public static getMetrics(): {
    totalRequests: number;
    cacheHitCount: number;
    fallbackCount: number;
    totalTokensSaved: number;
    totalCostSavedUsd: number;
    avgLatencyMs: number;
  } {
    const db = getDb();
    const row = db.queryOne<any>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'cache_hit' THEN 1 ELSE 0 END) as cache_hits,
        SUM(CASE WHEN status = 'fallback_invoked' THEN 1 ELSE 0 END) as fallbacks,
        SUM(tokens_saved) as tokens_saved,
        SUM(cost_saved_usd) as cost_saved,
        AVG(latency_ms) as avg_latency
      FROM unified_audit_log
    `);

    return {
      totalRequests: row?.total || 0,
      cacheHitCount: row?.cache_hits || 0,
      fallbackCount: row?.fallbacks || 0,
      totalTokensSaved: row?.tokens_saved || 0,
      totalCostSavedUsd: Number((row?.cost_saved || 0).toFixed(4)),
      avgLatencyMs: Math.round(row?.avg_latency || 0)
    };
  }
}

export class CostController {
  // LLM yerine yerel deterministik/önbellekli çalıştırmada tasarruf edilen tahmini token ve maliyet
  private static readonly ESTIMATED_PROMPT_TOKENS = 450;
  private static readonly ESTIMATED_COMPLETION_TOKENS = 250;
  private static readonly COST_PER_1K_TOKENS = 0.0004; // Gemini-1.5-flash / GPT-4o-mini eşdeğeri

  /**
   * Deterministik veya önbellekli yanıtta tasarruf edilen token ve maliyeti hesaplar
   */
  public static calculateSavings(): { tokens: number; costUsd: number } {
    const totalTokens = this.ESTIMATED_PROMPT_TOKENS + this.ESTIMATED_COMPLETION_TOKENS;
    const cost = (totalTokens / 1000) * this.COST_PER_1K_TOKENS;
    return {
      tokens: totalTokens,
      costUsd: Number(cost.toFixed(5))
    };
  }
}
