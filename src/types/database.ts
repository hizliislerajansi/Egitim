export type LearningStatus = 'Yeni' | 'Öğreniliyor' | 'Pekişiyor' | 'Hatırlatma Gerekli';
export type ErrorCategory = 'Kavram Yanılgısı' | 'İşlem Hatası' | 'Dikkatsizlik' | 'Kelime/Dilbilgisi Eksikliği' | 'Diğer';
export type QuestionType = 'multiple_choice' | 'open_math' | 'fill_blank' | 'dialogue';

export interface StudentProfile {
  id: string;
  name: string;
  grade: number; // 9
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'balanced';
  daily_goal_minutes: number;
  weekly_goal_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string; // 'İngilizce' | 'Matematik' | etc.
  code: string; // 'ENG' | 'MATH'
  icon: string;
  description: string;
  sort_order: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  unit: string;
  name: string;
  learning_outcome: string; // MEB kazanımı
  meb_code: string;
  difficulty: number; // 1 to 5
  order_index: number;
}

export interface Question {
  id: string;
  topic_id: string;
  question_text: string;
  question_type: QuestionType;
  options_json?: string; // stringified string[] for multiple choice
  correct_answer: string;
  hint_1: string;
  hint_2: string;
  explanation: string;
  solution_explanation?: string;
  difficulty: number; // 1 to 5
  meb_aligned: number; // 1 or 0
}

export interface StudySession {
  id: string;
  subject_id: string;
  topic_id?: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  session_type: 'offline_practice' | 'ai_chat' | 'math_workshop' | 'english_lab' | 'review';
}

export interface AnswerAttempt {
  id: string;
  session_id: string;
  question_id: string;
  student_answer: string;
  is_correct: number; // 1 or 0
  hint_used_count: number;
  time_spent_seconds: number;
  error_category?: ErrorCategory;
  created_at: string;
}

export interface TopicMastery {
  id: string;
  topic_id: string;
  mastery_score: number; // 0 to 100
  status: LearningStatus;
  streak_correct: number;
  last_studied_at?: string;
  updated_at: string;
}

export interface ReviewScheduleItem {
  id: string;
  topic_id: string;
  scheduled_date: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'skipped';
  reason?: string;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  session_id: string;
  subject_id: string;
  summary_text: string;
  key_takeaways?: string;
  weakness_tags?: string; // JSON string array
  created_at: string;
}

export interface AiUsage {
  id: string;
  provider: string; // 'gemini' | 'openai' | 'ollama' | 'mock'
  model: string;
  task_type: 'chat' | 'explanation' | 'hint' | 'speech_to_text' | 'text_to_speech';
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  timestamp: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}
