export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema_11_tables',
    sql: `
      -- 1. Öğrenci Profili
      CREATE TABLE IF NOT EXISTS student_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grade INTEGER NOT NULL DEFAULT 9,
        learning_style TEXT NOT NULL DEFAULT 'balanced',
        daily_goal_minutes INTEGER NOT NULL DEFAULT 45,
        weekly_goal_minutes INTEGER NOT NULL DEFAULT 225,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- 2. Dersler (MEB Lise 1)
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      -- 3. Konular ve MEB Kazanımları
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        unit TEXT NOT NULL,
        name TEXT NOT NULL,
        learning_outcome TEXT NOT NULL,
        meb_code TEXT NOT NULL,
        difficulty INTEGER NOT NULL DEFAULT 3,
        order_index INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      );

      -- 4. Soru Bankası (Çevrimdışı ve MEB Uyumlu)
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL DEFAULT 'multiple_choice',
        options_json TEXT,
        correct_answer TEXT NOT NULL,
        hint_1 TEXT,
        hint_2 TEXT,
        explanation TEXT,
        difficulty INTEGER NOT NULL DEFAULT 3,
        meb_aligned INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      );

      -- 5. Çalışma Oturumları
      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        topic_id TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        session_type TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      );

      -- 6. Cevap Denemeleri ve Hata Analizi
      CREATE TABLE IF NOT EXISTS answer_attempts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        student_answer TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        hint_used_count INTEGER NOT NULL DEFAULT 0,
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        error_category TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      );

      -- 7. Konu Ustalığı (Yeni, Öğreniliyor, Pekişiyor, Hatırlatma Gerekli)
      CREATE TABLE IF NOT EXISTS topic_mastery (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL UNIQUE,
        mastery_score INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Yeni',
        streak_correct INTEGER NOT NULL DEFAULT 0,
        last_studied_at TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      );

      -- 8. Kişisel Tekrar Planı (Aralıklı Tekrar / Spaced Repetition)
      CREATE TABLE IF NOT EXISTS review_schedule (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        scheduled_date TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'pending',
        reason TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      );

      -- 9. Sohbet ve Ders Özetleri
      CREATE TABLE IF NOT EXISTS conversation_summaries (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        summary_text TEXT NOT NULL,
        key_takeaways TEXT,
        weakness_tags TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      );

      -- 10. AI Kullanımı ve Bütçe Takibi (Token, Süre, Tahmini Maliyet)
      CREATE TABLE IF NOT EXISTS ai_usage (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        task_type TEXT NOT NULL,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0,
        estimated_cost_usd REAL NOT NULL DEFAULT 0.0,
        timestamp TEXT NOT NULL
      );

      -- 11. Uygulama Ayarları
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- İndeksler
      CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
      CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
      CREATE INDEX IF NOT EXISTS idx_attempts_session ON answer_attempts(session_id);
      CREATE INDEX IF NOT EXISTS idx_attempts_question ON answer_attempts(question_id);
      CREATE INDEX IF NOT EXISTS idx_mastery_topic ON topic_mastery(topic_id);
      CREATE INDEX IF NOT EXISTS idx_review_date ON review_schedule(scheduled_date, status);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_time ON ai_usage(timestamp);
    `
  },
  {
    version: 2,
    name: 'english_corpus_and_source_registry',
    sql: `
      -- 12. İngilizce Kaynak & Lisans Sicili (Tüm 10 Kaynak)
      CREATE TABLE IF NOT EXISTS english_source_registry (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT NOT NULL,
        license TEXT NOT NULL,
        access_mode TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'online',
        last_checked_at TEXT,
        item_count INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      );

      -- 13. Açık Kelime Hazinesi ve CEFR Profili
      CREATE TABLE IF NOT EXISTS english_corpus_vocab (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL UNIQUE,
        cefr_level TEXT NOT NULL,
        phonetic TEXT,
        audio_url TEXT,
        meanings_json TEXT NOT NULL,
        turkish_meaning TEXT,
        synonyms_json TEXT,
        source_id TEXT NOT NULL,
        license TEXT NOT NULL,
        theme_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (source_id) REFERENCES english_source_registry(id)
      );

      -- 14. Tatoeba Uyumlu İki Dilli Cümle Çiftleri
      CREATE TABLE IF NOT EXISTS english_corpus_sentences (
        id TEXT PRIMARY KEY,
        vocab_id TEXT,
        en_sentence TEXT NOT NULL,
        tr_sentence TEXT NOT NULL,
        cefr_level TEXT NOT NULL,
        source_name TEXT NOT NULL,
        license TEXT NOT NULL,
        theme_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (vocab_id) REFERENCES english_corpus_vocab(id) ON DELETE SET NULL
      );

      -- 15. CEFR-J Dil Bilgisi Kuralları ve Kalıpları
      CREATE TABLE IF NOT EXISTS english_grammar_rules (
        id TEXT PRIMARY KEY,
        theme_id TEXT NOT NULL,
        title TEXT NOT NULL,
        cefr_level TEXT NOT NULL,
        rule_summary TEXT NOT NULL,
        examples_json TEXT NOT NULL,
        common_mistakes_json TEXT,
        source_name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      -- 16. Öğrenme Materyalleri (Okuma, Dinleme, Boşluk Doldurma, Diyalog)
      CREATE TABLE IF NOT EXISTS english_learning_materials (
        id TEXT PRIMARY KEY,
        theme_id TEXT NOT NULL,
        material_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content_text TEXT NOT NULL,
        cefr_level TEXT NOT NULL,
        metadata_json TEXT,
        source_name TEXT NOT NULL,
        license TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      -- İndeksler
      CREATE INDEX IF NOT EXISTS idx_vocab_word ON english_corpus_vocab(word);
      CREATE INDEX IF NOT EXISTS idx_vocab_theme ON english_corpus_vocab(theme_id);
      CREATE INDEX IF NOT EXISTS idx_vocab_cefr ON english_corpus_vocab(cefr_level);
      CREATE INDEX IF NOT EXISTS idx_sentences_vocab ON english_corpus_sentences(vocab_id);
      CREATE INDEX IF NOT EXISTS idx_sentences_theme ON english_corpus_sentences(theme_id);
      CREATE INDEX IF NOT EXISTS idx_grammar_theme ON english_grammar_rules(theme_id);
      CREATE INDEX IF NOT EXISTS idx_materials_theme ON english_learning_materials(theme_id, material_type);
    `
  },
  {
    version: 3,
    name: 'unified_multidisciplinary_provider_architecture',
    sql: `
      -- 17. Merkezi Veri Sağlayıcı Sicili (Tüm Dersler)
      CREATE TABLE IF NOT EXISTS unified_provider_registry (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        category TEXT NOT NULL,
        endpoint_url TEXT NOT NULL,
        license_type TEXT NOT NULL,
        license_name TEXT NOT NULL,
        access_mode TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'healthy',
        circuit_state TEXT NOT NULL DEFAULT 'closed',
        failure_count INTEGER NOT NULL DEFAULT 0,
        total_requests INTEGER NOT NULL DEFAULT 0,
        cache_hits INTEGER NOT NULL DEFAULT 0,
        avg_latency_ms REAL NOT NULL DEFAULT 0.0,
        last_success_at TEXT,
        last_error_at TEXT,
        last_error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- 18. Ortak Formatta Normalleştirilmiş ve Doğrulanmış İçerik Kütüphanesi
      CREATE TABLE IF NOT EXISTS unified_normalized_content (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        provider_record_id TEXT,
        content_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT,
        language TEXT NOT NULL DEFAULT 'en',
        target_language TEXT NOT NULL DEFAULT 'tr',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        translation TEXT,
        answer TEXT,
        answer_explanation TEXT,
        difficulty INTEGER NOT NULL DEFAULT 3,
        grade_level INTEGER NOT NULL DEFAULT 9,
        cefr_level TEXT,
        curriculum_mapping TEXT,
        source_url TEXT,
        license_id TEXT,
        attribution TEXT,
        retrieved_at TEXT NOT NULL,
        last_verified_at TEXT NOT NULL,
        verification_status TEXT NOT NULL DEFAULT 'verified',
        verification_method TEXT NOT NULL DEFAULT 'deterministic_math',
        confidence REAL NOT NULL DEFAULT 1.0,
        content_hash TEXT NOT NULL UNIQUE,
        cache_expires_at TEXT,
        metadata_json TEXT,
        FOREIGN KEY (provider_id) REFERENCES unified_provider_registry(id)
      );

      -- 19. Teknik İzleme, Denetim ve Maliyet Tasarrufu Kayıtları
      CREATE TABLE IF NOT EXISTS unified_audit_log (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        provider_id TEXT,
        action TEXT NOT NULL,
        subject TEXT NOT NULL,
        query TEXT NOT NULL,
        status TEXT NOT NULL,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        tokens_saved INTEGER NOT NULL DEFAULT 0,
        cost_saved_usd REAL NOT NULL DEFAULT 0.0,
        details TEXT
      );

      -- İndeksler
      CREATE INDEX IF NOT EXISTS idx_unified_provider_subject ON unified_provider_registry(subject, status);
      CREATE INDEX IF NOT EXISTS idx_unified_content_subject ON unified_normalized_content(subject, topic);
      CREATE INDEX IF NOT EXISTS idx_unified_content_type ON unified_normalized_content(content_type);
      CREATE INDEX IF NOT EXISTS idx_unified_content_hash ON unified_normalized_content(content_hash);
      CREATE INDEX IF NOT EXISTS idx_unified_audit_time ON unified_audit_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_unified_audit_provider ON unified_audit_log(provider_id);
    `
  },
  {
    version: 4,
    name: 'adaptive_student_profile_and_pedagogy',
    sql: `
      -- 20. Yaşa ve Gelişim Düzeyine Uyarlanan Kişisel Öğrenci Profili
      CREATE TABLE IF NOT EXISTS adaptive_student_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Deniz',
        age INTEGER NOT NULL DEFAULT 15,
        grade_level TEXT NOT NULL DEFAULT 'lise_1',
        address_style TEXT NOT NULL DEFAULT 'samimi',
        preferred_modality TEXT NOT NULL DEFAULT 'balanced',
        verbosity_preference TEXT NOT NULL DEFAULT 'orta',
        daily_time_minutes INTEGER NOT NULL DEFAULT 45,
        target_subjects_json TEXT NOT NULL DEFAULT '["subj_math","subj_phys","subj_chem","subj_bio","subj_lit","subj_hist","subj_geo","subj_eng"]',
        goals_text TEXT DEFAULT 'Lise 1 derslerini tam kavramak ve TYT temeli oluşturmak',
        strong_topics_json TEXT NOT NULL DEFAULT '[]',
        struggling_topics_json TEXT NOT NULL DEFAULT '[]',
        successful_styles_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- 21. 6 Aşamalı Dinamik Konu Ustalık Durumu Takibi
      CREATE TABLE IF NOT EXISTS adaptive_topic_mastery (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL UNIQUE,
        mastery_state TEXT NOT NULL DEFAULT 'henuz_ogrenilmedi',
        consecutive_correct INTEGER NOT NULL DEFAULT 0,
        consecutive_wrong INTEGER NOT NULL DEFAULT 0,
        independent_solves INTEGER NOT NULL DEFAULT 0,
        assisted_solves INTEGER NOT NULL DEFAULT 0,
        last_attempt_assisted INTEGER NOT NULL DEFAULT 0,
        simplification_level_needed INTEGER NOT NULL DEFAULT 1,
        last_evaluated_at TEXT NOT NULL
      );

      -- 22. Kişiselleştirilmiş Pedagojik Olay Günlüğü
      CREATE TABLE IF NOT EXISTS adaptive_learning_events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        topic_id TEXT,
        event_type TEXT NOT NULL,
        details_json TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_adaptive_topic_mastery ON adaptive_topic_mastery(topic_id, mastery_state);
      CREATE INDEX IF NOT EXISTS idx_adaptive_events_time ON adaptive_learning_events(timestamp);
    `
  },
  {
    version: 5,
    name: 'educational_catalog_and_media_assets',
    sql: `
      -- 23. Çok Kaynaklı Eğitim Kataloğu (MEB, Denemeler, Özel Okul, Açık Lisans & AI)
      CREATE TABLE IF NOT EXISTS educational_catalog (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        grade_level TEXT NOT NULL,
        unit_name TEXT NOT NULL,
        source_category TEXT NOT NULL,
        source_title TEXT NOT NULL,
        publisher TEXT NOT NULL,
        edition TEXT,
        page_or_no TEXT,
        copyright_status TEXT NOT NULL,
        license_info TEXT NOT NULL,
        source_url TEXT,
        learning_outcome TEXT NOT NULL,
        content_summary TEXT NOT NULL,
        original_question_json TEXT,
        visual_asset_json TEXT,
        created_at TEXT NOT NULL
      );

      -- 24. Özgün Eğitim Görselleri, Animasyon ve Simülasyon Önbelleği
      CREATE TABLE IF NOT EXISTS educational_visual_cache (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        generator_provider TEXT NOT NULL,
        model_name TEXT NOT NULL,
        prompt_hash TEXT NOT NULL,
        content_type TEXT NOT NULL,
        svg_or_data TEXT NOT NULL,
        explanation_json TEXT,
        voice_narration TEXT,
        verified_pedagogical INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_edu_catalog_subject ON educational_catalog(subject_id, topic_id);
      CREATE INDEX IF NOT EXISTS idx_edu_catalog_source ON educational_catalog(source_category);
      CREATE INDEX IF NOT EXISTS idx_edu_visual_cache ON educational_visual_cache(topic_id, generator_provider);
    `
  },
  {
    version: 6,
    name: 'material_library_and_versioning',
    sql: `
      -- 25. Yerel Materyal Kütüphanesi ve Tekrar Kullanım Sicili (Bölüm 7)
      CREATE TABLE IF NOT EXISTS material_library (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        grade_level TEXT NOT NULL DEFAULT '9',
        topic_id TEXT NOT NULL,
        content_type TEXT NOT NULL, -- visual, speech, animation, simulation, question, summary
        title TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        content_hash TEXT NOT NULL UNIQUE,
        generator_model TEXT NOT NULL,
        generation_params TEXT,
        license_info TEXT NOT NULL DEFAULT 'Özgün Üretim (Yerel)',
        source_attribution TEXT,
        verification_status TEXT NOT NULL DEFAULT 'verified', -- verified, estimated, fallback
        reuse_count INTEGER NOT NULL DEFAULT 0,
        last_used_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_material_topic ON material_library(topic_id, content_type);
      CREATE INDEX IF NOT EXISTS idx_material_hash ON material_library(content_hash);
      CREATE INDEX IF NOT EXISTS idx_material_subject ON material_library(subject_id);
    `
  }
  ,{
    version: 7,
    name: 'english_learning_evidence',
    sql: `
      CREATE TABLE IF NOT EXISTS english_assessments (
        id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, level TEXT NOT NULL,
        answers_json TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS english_word_reviews (
        profile_id TEXT NOT NULL, word_id TEXT NOT NULL, streak INTEGER NOT NULL DEFAULT 0,
        lapses INTEGER NOT NULL DEFAULT 0, interval_days INTEGER NOT NULL DEFAULT 0,
        due_at TEXT NOT NULL, reviewed_at TEXT NOT NULL,
        PRIMARY KEY (profile_id, word_id)
      );
      CREATE TABLE IF NOT EXISTS english_activity_evidence (
        id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, activity_id TEXT NOT NULL,
        skill TEXT NOT NULL, correct INTEGER NOT NULL, total INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_english_reviews_due ON english_word_reviews(profile_id, due_at);
      CREATE INDEX IF NOT EXISTS idx_english_evidence_profile ON english_activity_evidence(profile_id, created_at);
      -- Earlier registry seeds assigned online without a network check.
      UPDATE english_source_registry SET status='cached', last_checked_at=''
        WHERE id IN ('src_openjam','src_cefr_j','src_free_dict_api','src_tatoeba','src_wordnet','src_voa_learning','src_british_council_teens','src_cambridge_dict','src_wiktionary','src_cefr_coe');
    `
  }
  ,{
    version: 8,
    name: 'english_resume_and_portfolio',
    sql: `
      CREATE TABLE IF NOT EXISTS english_learner_state (
        profile_id TEXT PRIMARY KEY, state_json TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS english_exercise_attempts (
        profile_id TEXT NOT NULL, activity_id TEXT NOT NULL, answer TEXT NOT NULL,
        correct INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL,
        PRIMARY KEY (profile_id, activity_id)
      );
      CREATE TABLE IF NOT EXISTS english_writing_portfolio (
        id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, unit_id TEXT NOT NULL,
        text TEXT NOT NULL, feedback TEXT NOT NULL, feedback_kind TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_english_portfolio ON english_writing_portfolio(profile_id, created_at);
    `
  }
  ,{
    version:9,name:'unit_checkpoint_exams',sql:`
      CREATE TABLE IF NOT EXISTS unit_exam_sessions (
        id TEXT PRIMARY KEY,profile_id TEXT NOT NULL,unit_id TEXT NOT NULL,
        questions_json TEXT NOT NULL,answers_json TEXT NOT NULL,
        result_json TEXT,created_at TEXT NOT NULL,finished_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_unit_exam_student ON unit_exam_sessions(profile_id,unit_id,created_at);
    `
  }
];
