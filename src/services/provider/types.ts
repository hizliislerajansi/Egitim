export type SubjectType = 
  | 'math' 
  | 'science' 
  | 'geography' 
  | 'history' 
  | 'literature' 
  | 'trivia' 
  | 'english' 
  | 'general';

export type LicenseType = 
  | 'permissive_open'        // MIT, Apache-2.0, CC0, Public Domain
  | 'attribution_required'   // CC-BY, CC-BY-SA
  | 'api_terms_only'         // Free REST API with terms of service
  | 'proprietary_reference'  // Reference / Deep link only (Never scrape)
  | 'quarantined';           // License ambiguous or violation detected

export type AccessMode = 
  | 'direct_api' 
  | 'dataset_offline' 
  | 'hybrid_cached' 
  | 'deep_link';

export type VerificationStatus = 
  | 'verified' 
  | 'provisional' 
  | 'quarantined';

export type VerificationMethod = 
  | 'deterministic_math' 
  | 'cross_referenced' 
  | 'curated_seed' 
  | 'ai_verified' 
  | 'unverified';

export type VerificationTier = 
  | 'low_risk'      // Known facts, math formulas, pre-verified vocab
  | 'medium_risk'   // Open explanations, historical narratives, translations
  | 'high_risk';    // Conflicting facts, complex multi-step math, unverified API claims

export type CircuitState = 
  | 'closed'        // Normal healthy operation
  | 'open'          // Provider broken; traffic redirected to fallback
  | 'half_open';    // Testing if provider recovered

export interface ProviderDescriptor {
  id: string;
  name: string;
  subject: SubjectType;
  category: string;
  endpointUrl: string;
  licenseType: LicenseType;
  licenseName: string;
  accessMode: AccessMode;
  status: 'healthy' | 'degraded' | 'offline' | 'quarantined';
  circuitState: CircuitState;
  failureCount: number;
  totalRequests: number;
  cacheHits: number;
  avgLatencyMs: number;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  rateLimitPerMinute?: number;
  requiresApiKey: boolean;
  notes: string;
}

export interface NormalizedContent {
  id: string;
  providerId: string;
  providerRecordId?: string;
  contentType: string; // 'definition' | 'math_solution' | 'element' | 'compound' | 'country_fact' | 'historical_event' | 'poem' | 'artwork' | 'trivia_question'
  subject: SubjectType;
  topic?: string;
  language: string;
  targetLanguage?: string;
  title: string;
  content: string;
  translation?: string;
  answer?: string;
  answerExplanation?: string;
  difficulty: number; // 1 to 5
  gradeLevel: number; // 9 for Lise 1
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2';
  curriculumMapping?: string; // MEB kazanım kodu (örn: MAT-09, KIM-09)
  sourceUrl?: string;
  licenseId: LicenseType;
  attribution: string;
  retrievedAt: string;
  lastVerifiedAt: string;
  verificationStatus: VerificationStatus;
  verificationMethod: VerificationMethod;
  confidence: number; // 0.0 to 1.0
  contentHash: string;
  cacheExpiresAt?: string;
  metadata?: Record<string, any>;
}

export interface ProviderQuery {
  subject: SubjectType;
  topic?: string;
  queryType: 
    | 'word_lookup' 
    | 'math_solve' 
    | 'chemistry_element' 
    | 'chemistry_compound'
    | 'astronomy_planet' 
    | 'geography_country' 
    | 'weather_forecast' 
    | 'earthquake_recent'
    | 'history_today' 
    | 'literature_book' 
    | 'literature_poem' 
    | 'art_work' 
    | 'trivia_quiz';
  text: string;
  parameters?: Record<string, any>;
  studentLevel?: number; // 1 to 5
  allowExternalApi?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  tier: VerificationTier;
  confidence: number;
  method: VerificationMethod;
  errors: string[];
  warnings: string[];
  crossReferenceMatch?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  providerId?: string;
  action: string;
  subject: SubjectType;
  query: string;
  status: 'success' | 'cache_hit' | 'fallback_invoked' | 'verification_failed' | 'rate_limited' | 'error';
  latencyMs: number;
  tokensSaved: number;
  costSavedUsd: number;
  details?: string;
}
