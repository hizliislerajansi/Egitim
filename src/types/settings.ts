import type { ManagedProvider } from '../services/apiClient';
export type AIProvider = ManagedProvider | 'custom';
export type VoiceMode = 'economic' | 'live' | 'text_only';
export type VoiceProvider = 'ema_local' | 'gemini_speech' | 'google_tts' | 'web_speech' | 'openai_tts' | 'elevenlabs' | 'cartesia_tts' | 'edge_natural';
export type AppTheme = 'light' | 'dark' | 'system';
export type ConversationStyle = 
  | 'casual_friend'   // Günlük arkadaşça sohbet
  | 'professional'   // Profesyonel danışman
  | 'supportive'     // Sakin ve destekleyici
  | 'energetic'      // Enerjik ve neşeli
  | 'concise'        // Kısa ve doğrudan
  | 'teacher'        // Öğretmen ve rehber
  | 'technical'      // Teknik uzman
  | 'formal';        // Resmî iletişim

export interface AppConfig {
  ai_provider: AIProvider;
  api_key: string; // Stored securely, never logged
  ai_model: string;
  conversation_style: ConversationStyle;
  voice_mode: VoiceMode;
  voice_provider: VoiceProvider;
  voice_tts_model?: GeminiTtsModel;
  voice_api_key: string;
  voice_model_name: string; // 'alloy' | 'nova' | 'rachel' | 'adam' | 'default'
  daily_budget_usd: number;
  monthly_budget_usd: number;
  theme: AppTheme;
  focus_mode?: boolean;
  reduced_motion: boolean;
  offline_mode: boolean;
  speech_rate: number;
  audio_feedback_enabled: boolean;
}

export const DEFAULT_CONFIG: AppConfig = {
  ai_provider: 'gemini',
  api_key: '',
  ai_model: 'gemini-3.5-flash-lite',
  conversation_style: 'teacher',
  voice_mode: 'economic',
  voice_provider: 'ema_local', // Resmi Google Gemini Speech Generation API
  voice_tts_model: 'gemini-3.8-flash-tts',
  voice_api_key: '',
  voice_model_name: 'EMA', // Google Gemini Türkçe doğal ses modeli
  daily_budget_usd: 0.50,
  monthly_budget_usd: 10.00,
  theme: 'light',
  focus_mode: true,
  reduced_motion: true,
  offline_mode: false,
  speech_rate: 1.0,
  audio_feedback_enabled: false,
};

export type GeminiTtsModel = 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts';
export interface VoicePresetOption { id: string; name: string; label: string; ageRange: string; tone: string; provider: VoiceProvider; description: string; recommended?: boolean; gender: string; }

export const GOOGLE_AISTUDIO_MALE_VOICES: VoicePresetOption[] = [
  {
    id: 'Puck',
    name: 'Puck',
    label: '👨 Puck (Google ses paneli - Doğal, Samimi Genç Erkek Sesi - Önerilen)',
    ageRange: 'Genç Erkek',
    tone: 'Doğal & Akıcı',
    provider: 'gemini_speech',
    description: 'Google ses paneli Voice Library resmi insan erkek sesi',
    recommended: true,
    gender: 'male'
  },
  {
    id: 'Charon',
    name: 'Charon',
    label: '👨 Charon (Google ses paneli - Sakin, Derin & Güven Veren Erkek Sesi)',
    ageRange: 'Yetişkin Erkek',
    tone: 'Sakin & Güven Verici',
    provider: 'gemini_speech',
    description: 'Google ses paneli Voice Library derin erkek sesi',
    recommended: false,
    gender: 'male'
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    label: '👨 Fenrir (Google ses paneli - Enerjik, Güçlü & Tok Erkek Sesi)',
    ageRange: 'Genç Erkek',
    tone: 'Enerjik & Kararlı',
    provider: 'gemini_speech',
    description: 'Google ses paneli Voice Library enerjik erkek sesi',
    recommended: false,
    gender: 'male'
  },
  {
    id: 'Orus',
    name: 'Orus',
    label: '👨 Orus (Google ses paneli - Dengeli, Kararlı & Net Erkek Sesi)',
    ageRange: 'Yetişkin Erkek',
    tone: 'Dengeli & Net',
    provider: 'gemini_speech',
    description: 'Google ses paneli Voice Library net erkek sesi',
    recommended: false,
    gender: 'male'
  }
];

export const YOUNG_MALE_VOICE_PRESETS: Record<VoiceProvider, VoicePresetOption[]> = {
  ema_local:[{id:'EMA',name:'EMA Lightning',label:'EMA Lightning · Yerel Türkçe',ageRange:'Tek ses',tone:'Türkçe',provider:'ema_local',description:'Cihazda çalışır; Türkçe için API anahtarı gerektirmez',recommended:true,gender:'unspecified'}],
  gemini_speech: GOOGLE_AISTUDIO_MALE_VOICES,
  google_tts: [
    { id: 'tr-TR-Standard-B', name: 'Google Türkçe Erkek', label: '👨 Google Türkçe Erkek Sesi', ageRange: 'Genç Erkek', tone: 'Net & Akıcı', provider: 'google_tts', description: 'Google resmi Türkçe erkek ses motoru', recommended: true, gender: 'male' }
  ],
  web_speech: [
    { id: 'default', name: 'Cihaz Erkek Sesi', label: 'Cihaz Erkek Sesi', ageRange: 'Yerel', tone: 'Sistem', provider: 'web_speech', description: 'Windows yerel ses', recommended: true, gender: 'male' }
  ],
  openai_tts: [
    { id: 'alloy', name: 'Alloy', label: 'Alloy (Erkek)', ageRange: 'Genç Erkek', tone: 'Dengeli', provider: 'openai_tts', description: 'OpenAI erkek sesi', recommended: true, gender: 'male' },
    { id: 'echo', name: 'Echo', label: 'Echo (Erkek)', ageRange: 'Genç Erkek', tone: 'Sıcak', provider: 'openai_tts', description: 'OpenAI erkek sesi', recommended: false, gender: 'male' },
    { id: 'onyx', name: 'Onyx', label: 'Onyx (Erkek)', ageRange: 'Yetişkin Erkek', tone: 'Derin', provider: 'openai_tts', description: 'OpenAI derin erkek sesi', recommended: false, gender: 'male' }
  ],
  elevenlabs: [
    { id: 'default', name: 'ElevenLabs Erkek', label: 'ElevenLabs Erkek Sesi', ageRange: 'Genç Erkek', tone: 'Ultra Gerçekçi', provider: 'elevenlabs', description: 'ElevenLabs erkek sesi', recommended: true, gender: 'male' }
  ],
  cartesia_tts: [
    { id: 'default', name: 'Cartesia Erkek', label: 'Cartesia Erkek Sesi', ageRange: 'Genç Erkek', tone: 'Hızlı', provider: 'cartesia_tts', description: 'Cartesia erkek sesi', recommended: true, gender: 'male' }
  ],
  edge_natural: [
    { id: 'default', name: 'Edge Erkek', label: 'Edge Erkek Sesi', ageRange: 'Genç Erkek', tone: 'Doğal', provider: 'edge_natural', description: 'Edge erkek sesi', recommended: true, gender: 'male' }
  ]
};

export function getDefaultYoungMaleVoice(provider: VoiceProvider): string { return YOUNG_MALE_VOICE_PRESETS[provider]?.[0]?.id || 'Puck'; }

