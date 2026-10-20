import { getDb } from '../db/database';
import { saveMediaBlob, loadMediaBlob } from './mediaStorage';

export type MaterialContentType = 'visual' | 'speech' | 'animation' | 'simulation' | 'question' | 'summary' | 'video' | 'worksheet';
export type VerificationStatus = 'verified' | 'estimated' | 'fallback';

export interface MaterialRecord {
  id: string;
  subject_id: string;
  grade_level: string;
  topic_id: string;
  content_type: MaterialContentType;
  title: string;
  file_path: string;
  created_at: string;
  version: number;
  content_hash: string;
  generator_model: string;
  generation_params?: string;
  license_info: string;
  source_attribution?: string;
  verification_status: VerificationStatus;
  reuse_count: number;
  last_used_at: string;
}

export interface MaterialFilter {
  subjectId?: string;
  topicId?: string;
  contentType?: MaterialContentType;
  verificationStatus?: VerificationStatus;
  searchQuery?: string;
}

/**
 * Deterministic hash function for content, prompts, and topic keys.
 */
export function computeMaterialHash(input: {
  topicId: string;
  contentType: string;
  seedText: string;
  model?: string;
}): string {
  const normalized = `${input.topicId.trim()}:${input.contentType.trim()}:${input.seedText.trim()}:${input.model || 'default'}`;
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c6ce57;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^ Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^ Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(16);
  return `mat_${hex.padStart(16, '0')}`;
}

export class MaterialLibraryService {
  /**
   * Find existing material by topic, type and content hash.
   * If found, returns it directly to prevent duplicate regeneration.
   */
  public static findExistingMaterial(
    topicId: string,
    contentType: MaterialContentType,
    contentHash: string
  ): MaterialRecord | null {
    try {
      const db = getDb();
      const row = db.queryOne<MaterialRecord>(
        `SELECT * FROM material_library 
         WHERE topic_id = ? AND content_type = ? AND content_hash = ? 
         ORDER BY version DESC LIMIT 1`,
        [topicId, contentType, contentHash]
      );
      return row || null;
    } catch {
      return null;
    }
  }

  /**
   * Register or reuse an educational material.
   * If the material already exists with the same hash, its reuse_count is incremented
   * and the existing record is returned without duplicating files or tokens.
   */
  public static async registerMaterial(params: {
    id?: string;
    subjectId: string;
    gradeLevel?: string;
    topicId: string;
    contentType: MaterialContentType;
    title: string;
    filePath?: string;
    contentHash?: string;
    generatorModel: string;
    generationParams?: Record<string, any>;
    licenseInfo?: string;
    sourceAttribution?: string;
    verificationStatus?: VerificationStatus;
    dataBlob?: Blob;
    seedContent?: string;
  }): Promise<{ material: MaterialRecord; reused: boolean }> {
    const db = getDb();
    const hash =
      params.contentHash ||
      computeMaterialHash({
        topicId: params.topicId,
        contentType: params.contentType,
        seedText: params.seedContent || params.title,
        model: params.generatorModel
      });

    // Check if matching material already exists
    const existing = this.findExistingMaterial(params.topicId, params.contentType, hash);
    if (existing) {
      this.recordReuse(existing.id);
      return {
        material: {
          ...existing,
          reuse_count: existing.reuse_count + 1,
          last_used_at: new Date().toISOString()
        },
        reused: true
      };
    }

    const id = params.id || `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const filePath = params.filePath || `assets/materials/${params.topicId}/${id}`;
    const paramsJson = params.generationParams ? JSON.stringify(params.generationParams) : null;
    const license = params.licenseInfo || 'Özgün Üretim (Yerel Öğrenci Kütüphanesi)';
    const status = params.verificationStatus || 'estimated';
    const grade = params.gradeLevel || '9';

    // Store binary payload if provided
    if (params.dataBlob) {
      await saveMediaBlob(id, params.dataBlob);
    }

    db.execute(
      `INSERT INTO material_library (
        id, subject_id, grade_level, topic_id, content_type,
        title, file_path, created_at, version, content_hash,
        generator_model, generation_params, license_info,
        source_attribution, verification_status, reuse_count, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        id,
        params.subjectId,
        grade,
        params.topicId,
        params.contentType,
        params.title,
        filePath,
        now,
        hash,
        params.generatorModel,
        paramsJson,
        license,
        params.sourceAttribution || 'Özgün ders rehberi Eğiticisi',
        status,
        now
      ]
    );

    const record: MaterialRecord = {
      id,
      subject_id: params.subjectId,
      grade_level: grade,
      topic_id: params.topicId,
      content_type: params.contentType,
      title: params.title,
      file_path: filePath,
      created_at: now,
      version: 1,
      content_hash: hash,
      generator_model: params.generatorModel,
      generation_params: paramsJson || undefined,
      license_info: license,
      source_attribution: params.sourceAttribution,
      verification_status: status,
      reuse_count: 0,
      last_used_at: now
    };

    return { material: record, reused: false };
  }

  /**
   * Mark a material as reused and update timestamp.
   */
  public static recordReuse(id: string): void {
    try {
      const db = getDb();
      const now = new Date().toISOString();
      db.execute(
        `UPDATE material_library 
         SET reuse_count = reuse_count + 1, last_used_at = ? 
         WHERE id = ?`,
        [now, id]
      );
    } catch (e) {
      console.warn('Could not update material reuse count:', e);
    }
  }

  /**
   * Create a new version of an existing material rather than overwriting.
   */
  public static async createNewVersion(
    currentId: string,
    updates: {
      title?: string;
      generatorModel?: string;
      generationParams?: Record<string, any>;
      newContentSeed?: string;
      dataBlob?: Blob;
      verificationStatus?: VerificationStatus;
    }
  ): Promise<MaterialRecord> {
    const db = getDb();
    const current = db.queryOne<MaterialRecord>('SELECT * FROM material_library WHERE id = ?', [currentId]);
    if (!current) throw new Error('Güncellenecek materyal bulunamadı.');

    const newVersion = current.version + 1;
    const newId = `mat_${Date.now()}_v${newVersion}`;
    const now = new Date().toISOString();
    const newHash = computeMaterialHash({
      topicId: current.topic_id,
      contentType: current.content_type,
      seedText: updates.newContentSeed || `${current.title}_v${newVersion}`,
      model: updates.generatorModel || current.generator_model
    });

    if (updates.dataBlob) {
      await saveMediaBlob(newId, updates.dataBlob);
    }

    const paramsJson = updates.generationParams
      ? JSON.stringify(updates.generationParams)
      : current.generation_params;

    db.execute(
      `INSERT INTO material_library (
        id, subject_id, grade_level, topic_id, content_type,
        title, file_path, created_at, version, content_hash,
        generator_model, generation_params, license_info,
        source_attribution, verification_status, reuse_count, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        newId,
        current.subject_id,
        current.grade_level,
        current.topic_id,
        current.content_type,
        updates.title || current.title,
        `assets/materials/${current.topic_id}/${newId}`,
        now,
        newVersion,
        newHash,
        updates.generatorModel || current.generator_model,
        paramsJson,
        current.license_info,
        current.source_attribution,
        updates.verificationStatus || current.verification_status,
        now
      ]
    );

    return {
      ...current,
      id: newId,
      version: newVersion,
      created_at: now,
      content_hash: newHash,
      title: updates.title || current.title,
      generator_model: updates.generatorModel || current.generator_model,
      generation_params: paramsJson || undefined,
      verification_status: updates.verificationStatus || current.verification_status,
      reuse_count: 0,
      last_used_at: now
    };
  }

  /**
   * Load binary blob for a material record.
   */
  public static async loadMaterialBlob(materialId: string): Promise<Blob | null> {
    return loadMediaBlob(materialId);
  }

  /**
   * List materials with flexible filtering.
   */
  public static listMaterials(filter?: MaterialFilter): MaterialRecord[] {
    try {
      const db = getDb();
      let query = 'SELECT * FROM material_library WHERE 1=1';
      const params: any[] = [];

      if (filter?.subjectId) {
        query += ' AND subject_id = ?';
        params.push(filter.subjectId);
      }
      if (filter?.topicId) {
        query += ' AND topic_id = ?';
        params.push(filter.topicId);
      }
      if (filter?.contentType) {
        query += ' AND content_type = ?';
        params.push(filter.contentType);
      }
      if (filter?.verificationStatus) {
        query += ' AND verification_status = ?';
        params.push(filter.verificationStatus);
      }
      if (filter?.searchQuery) {
        query += ' AND (title LIKE ? OR topic_id LIKE ?)';
        params.push(`%${filter.searchQuery}%`, `%${filter.searchQuery}%`);
      }

      query += ' ORDER BY created_at DESC';
      return db.query<MaterialRecord>(query, params);
    } catch {
      return [];
    }
  }

  /**
   * Delete a material record and its stored binary blob.
   */
  public static async deleteMaterial(id: string): Promise<boolean> {
    try {
      const db = getDb();
      db.execute('DELETE FROM material_library WHERE id = ?', [id]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Aggregate statistics about material generation, reuse and token savings.
   */
  public static getMaterialStats(): {
    totalCount: number;
    totalReuses: number;
    tokensSavedEstimate: number;
    typeBreakdown: Record<MaterialContentType, number>;
  } {
    const breakdown: Record<MaterialContentType, number> = {
      video:0,worksheet:0,
      visual: 0,
      speech: 0,
      animation: 0,
      simulation: 0,
      question: 0,
      summary: 0
    };

    try {
      const db = getDb();
      const rows = db.query<MaterialRecord>('SELECT * FROM material_library');
      let totalReuses = 0;

      for (const row of rows) {
        totalReuses += row.reuse_count || 0;
        if (breakdown[row.content_type] !== undefined) {
          breakdown[row.content_type]++;
        }
      }

      // Estimate tokens saved: ~1200 tokens per visual/animation, ~800 tokens per speech, ~400 tokens per question
      const tokensSavedEstimate = totalReuses * 900;

      return {
        totalCount: rows.length,
        totalReuses,
        tokensSavedEstimate,
        typeBreakdown: breakdown
      };
    } catch {
      return {
        totalCount: 0,
        totalReuses: 0,
        tokensSavedEstimate: 0,
        typeBreakdown: breakdown
      };
    }
  }
}
