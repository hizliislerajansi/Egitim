import { getDb } from '../../db/database';
import { NormalizedContent, SubjectType } from './types';
import { LicenseChecker } from './LicenseChecker';

export class CacheManager {
  /**
   * İçeriği önbellekten getirir (Geçerlilik süresi dolmamışsa)
   */
  public static get(contentHash: string): NormalizedContent | null {
    const db = getDb();
    const now = new Date().toISOString();

    const row = db.queryOne<any>(
      `SELECT * FROM unified_normalized_content 
       WHERE content_hash = ? AND (cache_expires_at IS NULL OR cache_expires_at > ?)`,
      [contentHash, now]
    );

    if (!row) return null;
    return this.mapRowToContent(row);
  }

  /**
   * Konu ve başlığa göre önbellekte arama yapar
   */
  public static findBySubjectAndTitle(subject: SubjectType, title: string): NormalizedContent | null {
    const db = getDb();
    const now = new Date().toISOString();

    const row = db.queryOne<any>(
      `SELECT * FROM unified_normalized_content 
       WHERE subject = ? AND LOWER(title) = ? AND (cache_expires_at IS NULL OR cache_expires_at > ?)
       ORDER BY last_verified_at DESC LIMIT 1`,
      [subject, title.trim().toLowerCase(), now]
    );

    if (!row) return null;
    return this.mapRowToContent(row);
  }

  /**
   * Yeni içeriği önbelleğe kaydeder (Lisans ve tekillik kontrolü ile)
   */
  public static set(content: NormalizedContent, ttlHours?: number): boolean {
    if (!LicenseChecker.isCachePermitted(content.licenseId)) {
      return false; // Lisans kalıcı saklamaya izin vermiyor
    }

    const db = getDb();
    const now = new Date();
    let cacheExpiresAt = content.cacheExpiresAt;

    if (ttlHours && ttlHours > 0) {
      cacheExpiresAt = new Date(now.getTime() + ttlHours * 3600 * 1000).toISOString();
    }

    try {
      db.run(
        `INSERT OR REPLACE INTO unified_normalized_content (
          id, provider_id, provider_record_id, content_type, subject, topic,
          language, target_language, title, content, translation, answer,
          answer_explanation, difficulty, grade_level, cefr_level, curriculum_mapping,
          source_url, license_id, attribution, retrieved_at, last_verified_at,
          verification_status, verification_method, confidence, content_hash,
          cache_expires_at, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id,
          content.providerId,
          content.providerRecordId || null,
          content.contentType,
          content.subject,
          content.topic || null,
          content.language,
          content.targetLanguage || 'tr',
          content.title,
          content.content,
          content.translation || null,
          content.answer || null,
          content.answerExplanation || null,
          content.difficulty,
          content.gradeLevel,
          content.cefrLevel || null,
          content.curriculumMapping || null,
          content.sourceUrl || null,
          content.licenseId,
          content.attribution,
          content.retrievedAt,
          content.lastVerifiedAt,
          content.verificationStatus,
          content.verificationMethod,
          content.confidence,
          content.contentHash,
          cacheExpiresAt || null,
          JSON.stringify(content.metadata || {})
        ]
      );
      return true;
    } catch (err) {
      console.warn('CacheManager set error:', err);
      return false;
    }
  }

  /**
   * Süresi dolmuş önbellek kayıtlarını temizler
   */
  public static cleanExpired(): number {
    const db = getDb();
    const now = new Date().toISOString();
    const initialCount = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM unified_normalized_content WHERE cache_expires_at IS NOT NULL AND cache_expires_at <= ?',
      [now]
    )?.count || 0;

    if (initialCount > 0) {
      db.run('DELETE FROM unified_normalized_content WHERE cache_expires_at IS NOT NULL AND cache_expires_at <= ?', [now]);
    }
    return initialCount;
  }

  /**
   * Önbellek istatistiklerini getirir
   */
  public static getCacheStats(): {
    totalItems: number;
    subjectBreakdown: Record<string, number>;
  } {
    const db = getDb();
    const total = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM unified_normalized_content')?.count || 0;
    const rows = db.query<{ subject: string; count: number }>(
      'SELECT subject, COUNT(*) as count FROM unified_normalized_content GROUP BY subject'
    );

    const breakdown: Record<string, number> = {};
    for (const r of rows) {
      breakdown[r.subject] = r.count;
    }

    return { totalItems: total, subjectBreakdown: breakdown };
  }

  private static mapRowToContent(row: any): NormalizedContent {
    let metadata: Record<string, any> = {};
    try {
      if (row.metadata_json) metadata = JSON.parse(row.metadata_json);
    } catch {}

    return {
      id: row.id,
      providerId: row.provider_id,
      providerRecordId: row.provider_record_id,
      contentType: row.content_type,
      subject: row.subject as SubjectType,
      topic: row.topic,
      language: row.language,
      targetLanguage: row.target_language,
      title: row.title,
      content: row.content,
      translation: row.translation,
      answer: row.answer,
      answerExplanation: row.answer_explanation,
      difficulty: row.difficulty,
      gradeLevel: row.grade_level,
      cefrLevel: row.cefr_level,
      curriculumMapping: row.curriculum_mapping,
      sourceUrl: row.source_url,
      licenseId: row.license_id,
      attribution: row.attribution,
      retrievedAt: row.retrieved_at,
      lastVerifiedAt: row.last_verified_at,
      verificationStatus: row.verification_status,
      verificationMethod: row.verification_method,
      confidence: row.confidence,
      contentHash: row.content_hash,
      cacheExpiresAt: row.cache_expires_at,
      metadata
    };
  }
}
