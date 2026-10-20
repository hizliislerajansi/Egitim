import { NormalizedContent, SubjectType, LicenseType, VerificationStatus, VerificationMethod } from './types';

export class ContentNormalizer {
  /**
   * Deterministik içerik özeti (Hash) üretir
   */
  public static generateContentHash(providerId: string, subject: string, title: string, text: string): string {
    const raw = `${providerId.toLowerCase()}::${subject.toLowerCase()}::${title.trim().toLowerCase()}::${text.trim().toLowerCase()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // 32bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}_${raw.length}`;
  }

  /**
   * Ham verileri ortak NormalizedContent şemasına dönüştürür
   */
  public static normalize(data: {
    id?: string;
    providerId: string;
    providerRecordId?: string;
    contentType: string;
    subject: SubjectType;
    topic?: string;
    language?: string;
    targetLanguage?: string;
    title: string;
    content: string;
    translation?: string;
    answer?: string;
    answerExplanation?: string;
    difficulty?: number;
    gradeLevel?: number;
    cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2';
    curriculumMapping?: string;
    sourceUrl?: string;
    licenseId: LicenseType;
    attribution: string;
    verificationStatus?: VerificationStatus;
    verificationMethod?: VerificationMethod;
    confidence?: number;
    metadata?: Record<string, any>;
    ttlHours?: number;
  }): NormalizedContent {
    const now = new Date();
    const retrievedAt = now.toISOString();
    const contentHash = this.generateContentHash(data.providerId, data.subject, data.title, data.content);

    let cacheExpiresAt: string | undefined = undefined;
    if (data.ttlHours && data.ttlHours > 0) {
      const exp = new Date(now.getTime() + data.ttlHours * 3600 * 1000);
      cacheExpiresAt = exp.toISOString();
    }

    return {
      id: data.id || `norm_${data.providerId}_${contentHash}`,
      providerId: data.providerId,
      providerRecordId: data.providerRecordId,
      contentType: data.contentType,
      subject: data.subject,
      topic: data.topic,
      language: data.language || 'en',
      targetLanguage: data.targetLanguage || 'tr',
      title: data.title.trim(),
      content: data.content.trim(),
      translation: data.translation?.trim(),
      answer: data.answer?.trim(),
      answerExplanation: data.answerExplanation?.trim(),
      difficulty: Math.max(1, Math.min(5, data.difficulty || 3)),
      gradeLevel: data.gradeLevel || 9,
      cefrLevel: data.cefrLevel,
      curriculumMapping: data.curriculumMapping,
      sourceUrl: data.sourceUrl,
      licenseId: data.licenseId,
      attribution: data.attribution,
      retrievedAt,
      lastVerifiedAt: retrievedAt,
      verificationStatus: data.verificationStatus || 'verified',
      verificationMethod: data.verificationMethod || 'curated_seed',
      confidence: Math.max(0.1, Math.min(1.0, data.confidence !== undefined ? data.confidence : 1.0)),
      contentHash,
      cacheExpiresAt,
      metadata: data.metadata || {}
    };
  }
}
