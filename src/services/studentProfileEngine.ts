import { getDb } from '../db/database';

export type GradeLevel = 'ortaokul' | 'lise_1' | 'lise_ileri' | 'temel';
export type AddressStyle = 'samimi' | 'akademik' | 'tesvik_edici';
export type ModalityPreference = 'text' | 'audio' | 'visual' | 'interactive' | 'balanced';
export type VerbosityPreference = 'ozet' | 'orta' | 'detayli';

export type MasteryState = 
  | 'henuz_ogrenilmedi'
  | 'ogreniliyor'
  | 'yardimla_cozulebiliyor'
  | 'bagimsiz_cozulebiliyor'
  | 'tekrar_gerekiyor'
  | 'kalici_ogrenme_kontrol';

export interface AdaptiveProfile {
  id: string;
  name: string;
  age: number;
  gradeLevel: GradeLevel;
  addressStyle: AddressStyle;
  preferredModality: ModalityPreference;
  verbosityPreference: VerbosityPreference;
  dailyTimeMinutes: number;
  targetSubjects: string[];
  goalsText: string;
  strongTopics: string[];
  strugglingTopics: string[];
  successfulStyles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TopicMasteryRecord {
  id: string;
  topicId: string;
  masteryState: MasteryState;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  independentSolves: number;
  assistedSolves: number;
  lastAttemptAssisted: boolean;
  simplificationLevelNeeded: number;
  lastEvaluatedAt: string;
  isPotentialGuess?: boolean;
}

export class StudentProfileEngine {
  private static DEFAULT_PROFILE_ID = 'student_default';

  /**
   * Öğrenci Profilini Getir (Mevcut değilse varsayılan değerlerle başlatır)
   */
  public static getProfile(): AdaptiveProfile {
    const db = getDb();
    const row = db.queryOne<{
      id: string;
      name: string;
      age: number;
      grade_level: string;
      address_style: string;
      preferred_modality: string;
      verbosity_preference: string;
      daily_time_minutes: number;
      target_subjects_json: string;
      goals_text: string;
      strong_topics_json: string;
      struggling_topics_json: string;
      successful_styles_json: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM adaptive_student_profile WHERE id = ?", [this.DEFAULT_PROFILE_ID]);

    if (!row) {
      return this.initializeDefaultProfile();
    }

    return {
      id: row.id,
      name: row.name,
      age: row.age,
      gradeLevel: (row.grade_level as GradeLevel) || 'lise_1',
      addressStyle: (row.address_style as AddressStyle) || 'samimi',
      preferredModality: (row.preferred_modality as ModalityPreference) || 'balanced',
      verbosityPreference: (row.verbosity_preference as VerbosityPreference) || 'orta',
      dailyTimeMinutes: row.daily_time_minutes || 45,
      targetSubjects: this.safeParseArray(row.target_subjects_json),
      goalsText: row.goals_text || 'Lise 1 konularını pekiştirmek ve sınav başarısı elde etmek',
      strongTopics: this.safeParseArray(row.strong_topics_json),
      strugglingTopics: this.safeParseArray(row.struggling_topics_json),
      successfulStyles: this.safeParseArray(row.successful_styles_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Öğrenci Profilini Güncelle
   */
  public static updateProfile(partial: Partial<Omit<AdaptiveProfile, 'id' | 'createdAt'>>): AdaptiveProfile {
    const current = this.getProfile();
    const updated: AdaptiveProfile = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString()
    };

    const db = getDb();
    db.execute(
      `INSERT OR REPLACE INTO adaptive_student_profile (
        id, name, age, grade_level, address_style, preferred_modality, 
        verbosity_preference, daily_time_minutes, target_subjects_json, 
        goals_text, strong_topics_json, struggling_topics_json, successful_styles_json, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        updated.id,
        updated.name,
        updated.age,
        updated.gradeLevel,
        updated.addressStyle,
        updated.preferredModality,
        updated.verbosityPreference,
        updated.dailyTimeMinutes,
        JSON.stringify(updated.targetSubjects),
        updated.goalsText,
        JSON.stringify(updated.strongTopics),
        JSON.stringify(updated.strugglingTopics),
        JSON.stringify(updated.successfulStyles),
        updated.createdAt,
        updated.updatedAt
      ]
    );

    return updated;
  }

  /**
   * Konu Ustalık Durumunu Getir
   */
  public static getTopicMastery(topicId: string): TopicMasteryRecord {
    const db = getDb();
    const row = db.queryOne<{
      id: string;
      topic_id: string;
      mastery_state: string;
      consecutive_correct: number;
      consecutive_wrong: number;
      independent_solves: number;
      assisted_solves: number;
      last_attempt_assisted: number;
      simplification_level_needed: number;
      last_evaluated_at: string;
    }>("SELECT * FROM adaptive_topic_mastery WHERE topic_id = ?", [topicId]);

    if (!row) {
      return {
        id: `adm_${topicId}`,
        topicId,
        masteryState: 'henuz_ogrenilmedi',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        independentSolves: 0,
        assistedSolves: 0,
        lastAttemptAssisted: false,
        simplificationLevelNeeded: 1,
        lastEvaluatedAt: new Date().toISOString()
      };
    }

    return {
      id: row.id,
      topicId: row.topic_id,
      masteryState: (row.mastery_state as MasteryState) || 'henuz_ogrenilmedi',
      consecutiveCorrect: row.consecutive_correct,
      consecutiveWrong: row.consecutive_wrong,
      independentSolves: row.independent_solves,
      assistedSolves: row.assisted_solves,
      lastAttemptAssisted: Boolean(row.last_attempt_assisted),
      simplificationLevelNeeded: row.simplification_level_needed,
      lastEvaluatedAt: row.last_evaluated_at
    };
  }

  /**
   * Cevap Sonrası Dinamik Ustalık ve Zorluk Güncellemesi
   * - İpuçlu (yardımlı) çözüm ile bağımsız çözümü ayrı tutar.
   * - Tek bir hatada seviyeyi dramatik düşürmez; tek bir doğruda aşırı yükseltmez.
   * - Çok hızlı (<4s) tahmin yanıtlarını tespit ederek doğrulama bayrağı açar.
   */
  public static evaluateAnswer(params: {
    topicId: string;
    isCorrect: boolean;
    hintsUsed: number;
    timeSpentSeconds: number;
    errorType?: string;
  }): { mastery: TopicMasteryRecord; isPotentialGuess: boolean; recommendedNextAction: string } {
    const current = this.getTopicMastery(params.topicId);
    const now = new Date().toISOString();
    const isAssisted = params.hintsUsed > 0;
    const isFastGuess = params.isCorrect && params.timeSpentSeconds < 4 && params.hintsUsed === 0;

    let consecutiveCorrect = current.consecutiveCorrect;
    let consecutiveWrong = current.consecutiveWrong;
    let independentSolves = current.independentSolves;
    let assistedSolves = current.assistedSolves;
    let simplificationLevel = current.simplificationLevelNeeded;
    let state: MasteryState = current.masteryState;

    if (params.isCorrect) {
      consecutiveCorrect += 1;
      consecutiveWrong = 0;

      if (isAssisted) {
        assistedSolves += 1;
        state = 'yardimla_cozulebiliyor';
      } else {
        independentSolves += 1;
        // Bağımsız doğru serisi 2'yi geçtiğinde bağımsız çözülüyor kabul edilir
        if (consecutiveCorrect >= 2 && independentSolves >= 2) {
          state = 'bagimsiz_cozulebiliyor';
        } else if (state === 'henuz_ogrenilmedi') {
          state = 'ogreniliyor';
        }
      }

      // Başarı durumunda basitleştirme ihtiyacı kademeli azalır
      simplificationLevel = Math.max(1, simplificationLevel - 1);
    } else {
      consecutiveCorrect = 0;
      consecutiveWrong += 1;

      // Yanlış sayısı arttıkça basitleştirme basamağı artar
      simplificationLevel = Math.min(8, simplificationLevel + 1);

      if (state === 'bagimsiz_cozulebiliyor') {
        // Tek yanlışta seviye tamamen sıfırlanmaz, 'tekrar_gerekiyor' aşamasına alınır
        state = 'tekrar_gerekiyor';
      } else if (consecutiveWrong >= 2) {
        state = 'ogreniliyor';
      }
    }

    const updatedMastery: TopicMasteryRecord = {
      id: current.id,
      topicId: params.topicId,
      masteryState: state,
      consecutiveCorrect,
      consecutiveWrong,
      independentSolves,
      assistedSolves,
      lastAttemptAssisted: isAssisted,
      simplificationLevelNeeded: simplificationLevel,
      lastEvaluatedAt: now,
      isPotentialGuess: isFastGuess
    };

    const db = getDb();
    db.execute(
      `INSERT OR REPLACE INTO adaptive_topic_mastery (
        id, topic_id, mastery_state, consecutive_correct, consecutive_wrong,
        independent_solves, assisted_solves, last_attempt_assisted, simplification_level_needed,
        last_evaluated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        updatedMastery.id,
        updatedMastery.topicId,
        updatedMastery.masteryState,
        updatedMastery.consecutiveCorrect,
        updatedMastery.consecutiveWrong,
        updatedMastery.independentSolves,
        updatedMastery.assistedSolves,
        isAssisted ? 1 : 0,
        updatedMastery.simplificationLevelNeeded,
        now
      ]
    );

    // Başarılı ve zorlanan konular listesini dinamik güncelle
    this.updateTopicAffinity(params.topicId, state);

    let recommendedAction = 'normal_practice';
    if (isFastGuess) {
      recommendedAction = 'verify_guess';
    } else if (!params.isCorrect && consecutiveWrong >= 2) {
      recommendedAction = 'step_by_step_remedy';
    } else if (state === 'bagimsiz_cozulebiliyor') {
      recommendedAction = 'advance_challenge';
    }

    return {
      mastery: updatedMastery,
      isPotentialGuess: isFastGuess,
      recommendedNextAction: recommendedAction
    };
  }

  private static updateTopicAffinity(topicId: string, state: MasteryState) {
    const profile = this.getProfile();
    let strong = [...profile.strongTopics];
    let struggling = [...profile.strugglingTopics];

    if (state === 'bagimsiz_cozulebiliyor') {
      if (!strong.includes(topicId)) strong.push(topicId);
      struggling = struggling.filter(t => t !== topicId);
    } else if (state === 'tekrar_gerekiyor' || state === 'yardimla_cozulebiliyor') {
      if (!struggling.includes(topicId)) struggling.push(topicId);
    }

    this.updateProfile({
      strongTopics: strong.slice(-10),
      strugglingTopics: struggling.slice(-10)
    });
  }

  private static initializeDefaultProfile(): AdaptiveProfile {
    const now = new Date().toISOString();
    const defaultProfile: AdaptiveProfile = {
      id: this.DEFAULT_PROFILE_ID,
      name: 'Deniz',
      age: 15,
      gradeLevel: 'lise_1',
      addressStyle: 'samimi',
      preferredModality: 'balanced',
      verbosityPreference: 'orta',
      dailyTimeMinutes: 45,
      targetSubjects: ['subj_math', 'subj_phys', 'subj_chem', 'subj_bio', 'subj_lit', 'subj_hist', 'subj_geo', 'subj_eng'],
      goalsText: 'Lise 1 derslerini tam kavramak ve TYT temeli oluşturmak',
      strongTopics: [],
      strugglingTopics: [],
      successfulStyles: ['günlük_örnek', 'adim_adim'],
      createdAt: now,
      updatedAt: now
    };

    const db = getDb();
    db.execute(
      `INSERT OR REPLACE INTO adaptive_student_profile (
        id, name, age, grade_level, address_style, preferred_modality, 
        verbosity_preference, daily_time_minutes, target_subjects_json, 
        goals_text, strong_topics_json, struggling_topics_json, successful_styles_json, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        defaultProfile.id,
        defaultProfile.name,
        defaultProfile.age,
        defaultProfile.gradeLevel,
        defaultProfile.addressStyle,
        defaultProfile.preferredModality,
        defaultProfile.verbosityPreference,
        defaultProfile.dailyTimeMinutes,
        JSON.stringify(defaultProfile.targetSubjects),
        defaultProfile.goalsText,
        JSON.stringify(defaultProfile.strongTopics),
        JSON.stringify(defaultProfile.strugglingTopics),
        JSON.stringify(defaultProfile.successfulStyles),
        now,
        now
      ]
    );

    return defaultProfile;
  }

  private static safeParseArray(jsonStr?: string): string[] {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
