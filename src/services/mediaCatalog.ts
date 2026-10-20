import type { CredentialProvider } from './apiClient';
export type MediaKind = 'speech' | 'image' | 'video';
export interface MediaOption {
  id: string;
  kind: MediaKind;
  name: string;
  vendor: CredentialProvider | 'local';
  model: string;
  pricing: string;
  docs: string;
  keyUrl?: string;
  local?: boolean;
}
export const MEDIA_OPTIONS: MediaOption[] = [
  {id:'ema_local',kind:'speech',name:'EMA Lightning · Yerel Türkçe (varsayılan)',vendor:'local',model:'ema-lightning-1.1.2',pricing:'Yerel işlem; ses üretimi için API ücreti yok',docs:'https://github.com/canberk7/ema-lightning',local:true},
  {
    id: 'gemini_tts',
    kind: 'speech',
    name: 'Gemini 3.8 Flash TTS — Ana Ses (Genç Erkek: Puck / Fenrir / Orus)',
    vendor: 'gemini',
    model: 'gemini-3.8-flash-tts',
    pricing: 'Ücretsiz katman / ücretli API; 130 dilde en yüksek insan sesi doğallığı ve tonlama',
    docs: 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-8-flash-tts',
    keyUrl: 'https://aistudio.google.com/api-keys'
  },
  {
    id: 'gemini_tts_lite',
    kind: 'speech',
    name: 'Gemini 3.8 Flash-Lite TTS (Düşük Gecikmeli Hızlı Genç Erkek Sesi)',
    vendor: 'gemini',
    model: 'gemini-3.8-flash-lite-tts',
    pricing: 'Ücretsiz katman / ücretli API; yüksek hız ve düşük gecikme',
    docs: 'https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-lite-tts',
    keyUrl: 'https://aistudio.google.com/api-keys'
  },
  {
    id: 'openai_tts',
    kind: 'speech',
    name: 'OpenAI GPT-4o Mini TTS (Genç Erkek: Ash / Echo / Verse)',
    vendor: 'openai',
    model: 'gpt-4o-mini-tts',
    pricing: 'Ücretli API (Gerçek insan tonlaması ve nefes kontrolü)',
    docs: 'https://developers.openai.com/api/docs/guides/text-to-speech',
    keyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'elevenlabs_tts',
    kind: 'speech',
    name: 'ElevenLabs Multilingual v2 (Genç Erkek: Josh / Liam / Charlie)',
    vendor: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    pricing: 'Ücretsiz aylık deneme kotası / ücretli plan',
    docs: 'https://elevenlabs.io/docs/api-reference/text-to-speech/convert',
    keyUrl: 'https://elevenlabs.io/app/settings/api-keys'
  },
  {
    id: 'cartesia_tts',
    kind: 'speech',
    name: 'Cartesia Sonic-3.6 (Ultra Düşük Gecikmeli Genç Erkek Sesi)',
    vendor: 'cartesia',
    model: 'sonic-2',
    pricing: 'Aylık 20K kredi ücretsiz katman / kullandığın kadar öde',
    docs: 'https://docs.cartesia.ai/get-started/overview',
    keyUrl: 'https://play.cartesia.ai/keys'
  },
  {
    id: 'web_speech',
    kind: 'speech',
    name: 'Doğal Cihaz Sesi (Ahmet Neural — Genç Erkek)',
    vendor: 'local',
    model: 'system',
    pricing: 'API ücreti yok; Microsoft Ahmet Neural / Google Türkçe erkek sesini seçer',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis',
    local: true
  },
  {
    id: 'mistral_tts',
    kind: 'speech',
    name: 'Mistral ses üretimi (Voxtral)',
    vendor: 'mistral',
    model: '',
    pricing: 'Hesapta erişilen ses modeli ve tarifeye bağlı',
    docs: 'https://docs.mistral.ai/api/endpoint/audio/speech',
    keyUrl: 'https://console.mistral.ai/api-keys'
  },
  {
    id: 'kokoro',
    kind: 'speech',
    name: 'Kokoro — yerel ses API (Erkek: am_adam / am_michael)',
    vendor: 'local',
    model: 'kokoro',
    pricing: 'Yerel; API ücreti yok, kurulum ve donanım gerekir.',
    docs: 'https://github.com/remsky/Kokoro-FastAPI',
    local: true
  },
  {
    id: 'gemini_image',
    kind: 'image',
    name: 'Gemini Nano Banana 2.1',
    vendor: 'gemini',
    model: 'gemini-nano-banana-2.1',
    pricing: 'Ücretli / varsa hesap deneme kotası; sınırsız ücretsiz değil',
    docs: 'https://ai.google.dev/gemini-api/docs/image-generation',
    keyUrl: 'https://aistudio.google.com/api-keys'
  },
  {
    id: 'openai_image',
    kind: 'image',
    name: 'OpenAI GPT Image',
    vendor: 'openai',
    model: 'gpt-image-2',
    pricing: 'Ücretli API; model erişimi hesaba bağlı',
    docs: 'https://developers.openai.com/api/docs/guides/image-generation',
    keyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'openrouter_image',
    kind: 'image',
    name: 'OpenRouter görsel modelleri',
    vendor: 'openrouter',
    model: 'google/gemini-3.1-flash-image',
    pricing: 'Seçilen modelin güncel tarifesine bağlı; katalogdan kontrol edin',
    docs: 'https://openrouter.ai/docs/guides/overview/multimodal/image-generation',
    keyUrl: 'https://openrouter.ai/settings/keys'
  },
  {
    id:'together_image',kind:'image',name:'Together Rehber · FLUX.2 Dev',vendor:'together',model:'black-forest-labs/FLUX.2-dev',pricing:'Ücretli API; ücretsiz kullanım veya kredi garanti edilmez. Model ve hesap tarifesi geçerli.',docs:'https://docs.together.ai/docs/inference/images/overview',keyUrl:'https://api.together.ai/settings/api-keys'
  },
  {
    id: 'sd_image',
    kind: 'image',
    name: 'Stable Diffusion — AUTOMATIC1111 yerel',
    vendor: 'local',
    model: 'installed-checkpoint',
    pricing: 'Yerel; API ücreti yok, model lisansı ve donanım gereksinimi var',
    docs: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API',
    local: true
  },
  {
    id: 'comfy_image',
    kind: 'image',
    name: 'ComfyUI — yerel görsel iş akışı',
    vendor: 'local',
    model: 'workflow',
    pricing: 'Yerel; API ücreti yok. Kurulu model ve API biçiminde iş akışı gerekir.',
    docs: 'https://docs.comfy.org/development/comfyui-server/comms_routes',
    local: true
  },
  {
    id: 'gemini_video',
    kind: 'video',
    name: 'Google Veo 3.1',
    vendor: 'gemini',
    model: 'veo-3.1-generate-preview',
    pricing: 'Ücretli API; video başına hesap kotası/tarifesi geçerli',
    docs: 'https://ai.google.dev/gemini-api/docs/veo',
    keyUrl: 'https://aistudio.google.com/api-keys'
  },
  {
    id: 'openai_video',
    kind: 'video',
    name: 'OpenAI Sora',
    vendor: 'openai',
    model: 'sora-2',
    pricing: 'Ücretli API; hesap erişimi gerekli',
    docs: 'https://developers.openai.com/api/docs/guides/video-generation',
    keyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'comfy_video',
    kind: 'video',
    name: 'ComfyUI — yerel video iş akışı',
    vendor: 'local',
    model: 'workflow',
    pricing: 'Yerel; API ücreti yok. Video modeli, donanım ve API iş akışı gerekir.',
    docs: 'https://docs.comfy.org/development/comfyui-server/comms_routes',
    local: true
  }
];
export function mediaOption(id: string): MediaOption {
  const option = MEDIA_OPTIONS.find(p => p.id === id);
  if (!option) throw new Error('Desteklenmeyen medya sağlayıcısı.');
  return option;
}
