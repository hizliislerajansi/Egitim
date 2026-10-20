import {whilePreparing} from './studentExperience';
import { getDb } from '../db/database';

export const AI_PROVIDERS = [
  'gemini',
  'groq',
  'cerebras',
  'openrouter',
  'zai',
  'mistral',
  'huggingface',
  'cloudflare',
  'together',
  'fireworks',
  'deepseek',
  'openai',
  'anthropic',
  'evren',
  'ollama'
] as const;

export type ManagedProvider = typeof AI_PROVIDERS[number];

export const PROVIDER_DEFAULTS: Record<ManagedProvider, { name: string; model: string; docs: string }> = {
  gemini: { name: 'Google Gemini', model: 'gemini-3.5-flash-lite', docs: 'https://ai.google.dev/gemini-api/docs' },
  groq: { name: 'Groq Cloud (Ultra Hızlı & Ücretsiz Kota)', model: 'llama-3.3-70b-versatile', docs: 'https://console.groq.com/docs/quickstart' },
  cerebras: { name: 'Cerebras Cloud (Işık Hızında Llama)', model: 'llama3.1-8b', docs: 'https://inference-docs.cerebras.ai/' },
  openrouter: { name: 'OpenRouter (Ücretsiz & Yüzlerce Model)', model: 'openrouter/free', docs: 'https://openrouter.ai/docs/quickstart' },
  zai: { name: 'Z.Rehber / GLM (GLM-4.5 Flash & Frontier)', model: 'glm-4.5-flash', docs: 'https://docs.z.ai/guides/overview/quick-start' },
  mistral: { name: 'Mistral Rehber (Avrupa LLM & Deneme Kotası)', model: 'mistral-small-latest', docs: 'https://docs.mistral.ai/api/endpoint/chat' },
  huggingface: { name: 'Hugging Face Inference API', model: 'Qwen/Qwen2.5-72B-Instruct', docs: 'https://huggingface.co/docs/inference-providers/en/index' },
  cloudflare: { name: 'Cloudflare Workers Rehber', model: '@cf/meta/llama-3.1-8b-instruct', docs: 'https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/' },
  together: { name: 'Together Rehber (Açık Ağırlıklı Modeller)', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', docs: 'https://docs.together.ai/docs/quickstart' },
  fireworks: { name: 'Fireworks Rehber (Hızlı Sunucusuz Çıkarım)', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct', docs: 'https://docs.fireworks.ai/getting-started/quickstart' },
  deepseek: { name: 'DeepSeek (Ekonomik & Güçlü Akıl Yürütme)', model: 'deepseek-chat', docs: 'https://api-docs.deepseek.com/' },
  openai: { name: 'OpenAI (GPT-4o Mini / Standart API)', model: 'gpt-4o-mini', docs: 'https://platform.openai.com/docs/api-reference' },
  anthropic: { name: 'Anthropic Claude (Haiku / Sonnet)', model: 'claude-3-5-haiku-20241022', docs: 'https://platform.claude.com/docs/en/api/overview' },
  evren: { name: 'EVREN LLM', model: 'auto', docs: 'https://evren.ssyz.org.tr/llm-inference/' },
  ollama: { name: 'Ollama (İsteğe Bağlı Yerel Sunucu)', model: 'llama3:latest', docs: 'https://docs.ollama.com/api/generate' }
};

export interface ProviderProfile {
  model: string;
  enabled: boolean;
  accountId?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ApiInput {
  provider: ManagedProvider;
  model: string;
  system: string;
  message: string;
  maxTokens: number;
  history?: ChatHistoryItem[];
  accountId?: string;
}

export type ConnectionState =
  | 'success'
  | 'missing_key'
  | 'disabled'
  | 'unauthorized'
  | 'rate_limit'
  | 'model_error'
  | 'timeout'
  | 'network_error'
  | 'invalid_response';

export class ApiConnectionError extends Error {
  constructor(public state: ConnectionState, message: string) {
    super(message);
  }
}

export interface ApiErrorLogEntry {
  id: string;
  provider: ManagedProvider;
  model: string;
  state: ConnectionState;
  message: string;
  timestamp: string;
}

export interface ModelCapabilityDescriptor {
  supportsText: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsAudioInput: boolean;
  supportsAudioOutput: boolean;
  supportsToolCalling: boolean;
  contextWindowTokens: number;
  isFreeEligible: boolean;
  turkishQualityTier: 'high' | 'medium' | 'basic';
  latencyTier: 'ultra_fast' | 'fast' | 'standard';
}

export type CredentialProvider = ManagedProvider | 'elevenlabs' | 'cartesia';

// In-memory session store for non-native browser sessions (never exposed to public files or DB)
const sessionKeys = new Map<CredentialProvider, string>();
const keyMaskHints = new Map<CredentialProvider, string>();

// Simple client-side rate limiter to avoid accidental duplicate paid requests
const lastRequestTimestamps = new Map<string, number>();

export const isNativeApp = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export function maskSecretKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}`;
}

export function sanitizeSensitiveText(text: string): string {
  let clean = text;
  for (const [, val] of sessionKeys.entries()) {
    if (val && val.length >= 6 && clean.includes(val)) {
      clean = clean.split(val).join('[MASKELİ_ANAHTAR]');
    }
  }
  return clean.replace(/\b(sk-[a-zA-Z0-9_-]{12,}|AIza[a-zA-Z0-9_-]{15,}|gsk_[a-zA-Z0-9_-]{12,}|hf_[a-zA-Z0-9_-]{12,})\b/g, '[MASKELİ_ANAHTAR]');
}

export function readSetting<T>(key: string, fallback: T): T {
  try {
    const row = getDb().queryOne<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
    return row ? JSON.parse(row.value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeSetting(key: string, value: unknown) {
  getDb().execute(
    'INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)',
    [key, JSON.stringify(value), new Date().toISOString()]
  );
}

export function getProviderProfile(provider: ManagedProvider): ProviderProfile {
  const fallbackModel =
    provider === 'gemini'
      ? readSetting('gemini_model', PROVIDER_DEFAULTS.gemini.model)
      : PROVIDER_DEFAULTS[provider].model;
  return readSetting<ProviderProfile>(`ai_profile_${provider}`, {
    model: fallbackModel,
    enabled: true
  });
}

function legacyKey(provider: CredentialProvider): string {
  return readSetting('ai_provider', 'gemini') === provider ? readSetting('api_key', '') : '';
}

export function getStoredKey(provider: CredentialProvider): string {
  if (sessionKeys.get(provider)) return sessionKeys.get(provider)!;
  if (!isNativeApp() && typeof window !== 'undefined' && window.sessionStorage) {
    const sess = window.sessionStorage.getItem(`dp_ai_key_${provider}`);
    if (sess) return sess;
  }
  const leg = legacyKey(provider);
  if (leg) return leg;
  if (provider === 'gemini') {
    const vKey = readSetting('voice_api_key', '');
    if (vKey) return vKey;
    const gKey = readSetting('gemini_api_key', '');
    if (gKey) return gKey;
  }
  const genKey = readSetting<string>(`ai_key_${provider}`, '');
  if (genKey) return genKey;
  return '';
}

export function getMaskedKeyHint(provider: CredentialProvider): string {
  const active = getStoredKey(provider);
  if (active) return maskSecretKey(active);
  const savedHint = keyMaskHints.get(provider) || readSetting<string>(`ai_key_hint_${provider}`, '');
  return savedHint;
}

export async function nativeInvoke<T>(command: string, args: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

export async function hasProviderKey(provider: CredentialProvider): Promise<boolean> {
  if (provider === 'ollama') return true;
  if (isNativeApp()) return (await nativeInvoke<boolean>('has_api_key', { provider })) || !!getStoredKey(provider);
  return !!getStoredKey(provider);
}

export async function saveProviderProfile(provider: ManagedProvider, profile: ProviderProfile, newKey = ''): Promise<void> {
  const cleanModel = profile.model.trim();
  if (!/^[\w.:/@-]{1,150}$/.test(cleanModel) || cleanModel.includes('..')) {
    throw new Error('Geçerli bir model kimliği girin.');
  }
  const previous = readSetting<ManagedProvider>('ai_provider', 'gemini');
  const old = AI_PROVIDERS.includes(previous) ? legacyKey(previous) : '';
  if (old && previous !== 'ollama') {
    if (isNativeApp()) await nativeInvoke('save_api_key', { provider: previous, key: old });
    else sessionKeys.set(previous, old);
    keyMaskHints.set(previous, maskSecretKey(old));
    writeSetting(`ai_key_hint_${previous}`, maskSecretKey(old));
    getDb().execute("DELETE FROM app_settings WHERE key = 'api_key'");
  }
  const key = newKey.trim();
  if (key && provider !== 'ollama') {
    if (isNativeApp()) {
      await nativeInvoke('save_api_key', { provider, key });
    } else {
      sessionKeys.set(provider, key);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(`dp_ai_key_${provider}`, key);
      }
    }
    // Remove any insecure leftover plaintext key from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(`dp_ai_key_${provider}`);
    }
    keyMaskHints.set(provider, maskSecretKey(key));
    writeSetting(`ai_key_hint_${provider}`, maskSecretKey(key));
    if (readSetting('ai_provider', 'gemini') === provider) {
      getDb().execute("DELETE FROM app_settings WHERE key = 'api_key'");
    }
  }
  writeSetting(`ai_profile_${provider}`, { ...profile, model: cleanModel });
  writeSetting('ai_provider', provider);
}

export async function deleteProviderKey(provider: CredentialProvider): Promise<void> {
  if (isNativeApp() && provider !== 'ollama') await nativeInvoke('delete_api_key', { provider });
  sessionKeys.delete(provider);
  keyMaskHints.delete(provider);
  if (typeof window !== 'undefined') {
    window.sessionStorage?.removeItem(`dp_ai_key_${provider}`);
    window.localStorage?.removeItem(`dp_ai_key_${provider}`);
  }
  getDb().execute('DELETE FROM app_settings WHERE key = ?', [`ai_key_hint_${provider}`]);
  if (readSetting('ai_provider', 'gemini') === provider) {
    getDb().execute("DELETE FROM app_settings WHERE key = 'api_key'");
  }
}

export function logApiError(provider: ManagedProvider, model: string, err: ApiConnectionError): void {
  try {
    const existing = readSetting<ApiErrorLogEntry[]>('api_error_logs', []);
    const entry: ApiErrorLogEntry = {
      id: `err_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      provider,
      model,
      state: err.state,
      message: sanitizeSensitiveText(err.message),
      timestamp: new Date().toISOString()
    };
    writeSetting('api_error_logs', [entry, ...existing].slice(0, 25));
  } catch {
    // Ignore logging errors
  }
}

export function getApiErrorLogs(provider?: ManagedProvider): ApiErrorLogEntry[] {
  const all = readSetting<ApiErrorLogEntry[]>('api_error_logs', []);
  return provider ? all.filter(e => e.provider === provider) : all;
}

export function classifyApiError(error: unknown): ApiConnectionError {
  if (error instanceof ApiConnectionError) return error;
  const message = sanitizeSensitiveText(String(error));
  if (/401|403/.test(message)) {
    return new ApiConnectionError(
      'unauthorized',
      'API anahtarı geçersiz veya hesap yetkisi reddedildi (401/403). Anahtarınızı kontrol edin.'
    );
  }
  if (/429/.test(message)) {
    return new ApiConnectionError(
      'rate_limit',
      'Kota veya hız sınırına ulaşıldı (429). Ücretsiz kota dolmuş olabilir.'
    );
  }
  if (/404|400/.test(message)) {
    return new ApiConnectionError(
      'model_error',
      'Anahtar doğrulandı ancak seçilen model kimliği veya istek parametresi bu sağlayıcıda desteklenmiyor (400/404).'
    );
  }
  if (/Abort|timeout|zaman aşımı/i.test(message)) {
    return new ApiConnectionError('timeout', 'Servis zamanında yanıt vermedi (Zaman aşımı).');
  }
  return new ApiConnectionError(
    'network_error',
    'Servise bağlanılamadı. İnternet bağlantısını, CORS politikasını veya servis durumunu kontrol edin.'
  );
}

export function getProviderEndpoint(provider: ManagedProvider, model: string, accountId?: string): string {
  switch (provider) {
    case 'gemini':
      return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    case 'ollama':
      return 'http://127.0.0.1:11434/api/generate';
    case 'anthropic':
      return 'https://api.anthropic.com/v1/messages';
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    case 'mistral':
      return 'https://api.mistral.ai/v1/chat/completions';
    case 'zai':
      return 'https://api.z.ai/api/paas/v4/chat/completions';
    case 'groq':
      return 'https://api.groq.com/openai/v1/chat/completions';
    case 'cerebras':
      return 'https://api.cerebras.ai/v1/chat/completions';
    case 'together':
      return 'https://api.together.xyz/v1/chat/completions';
    case 'fireworks':
      return 'https://api.fireworks.ai/inference/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/chat/completions';
    case 'huggingface':
      return 'https://router.huggingface.co/v1/chat/completions';
    case 'cloudflare': {
      const acct = (accountId || getProviderProfile('cloudflare').accountId || '').trim();
      return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(acct || 'default')}/ai/v1/chat/completions`;
    }
    case 'evren':
      return 'https://evren-llmapi.ssyz.org.tr/v1/chat/completions';
  }
}

export async function sendAiRequest(input: ApiInput): Promise<any> {
  return whilePreparing('Yanıt hazırlanıyor…',()=>sendAiRequestInternal(input));
}
async function sendAiRequestInternal(input: ApiInput): Promise<any> {
  const profile = getProviderProfile(input.provider);
  if (!profile.enabled) throw new ApiConnectionError('disabled', 'Bu sağlayıcı devre dışı.');
  if (!(await hasProviderKey(input.provider))) {
    throw new ApiConnectionError('missing_key', 'Bu sağlayıcı için API anahtarı girilmedi.');
  }
  if (input.provider === 'cloudflare') {
    const acct = (input.accountId || profile.accountId || '').trim();
    if (!acct) {
      throw new ApiConnectionError('missing_key', 'Cloudflare Workers Rehber için Account ID girilmedi.');
    }
  }
  input = { ...input, maxTokens: Math.max(1, Math.min(4096, input.maxTokens)) };
  try {
    if (isNativeApp()) {
      const oldKey = legacyKey(input.provider);
      if (oldKey) {
        await nativeInvoke('save_api_key', { provider: input.provider, key: oldKey });
        getDb().execute("DELETE FROM app_settings WHERE key = 'api_key'");
      }
      return await nativeInvoke('ai_request', {
        input: { ...input, accountId: input.accountId || profile.accountId }
      });
    }
    const key = getStoredKey(input.provider);
    const url = getProviderEndpoint(input.provider, input.model, input.accountId || profile.accountId);
    let body: unknown;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (input.provider === 'gemini') {
      headers['x-goog-api-key'] = key;
      const contents: any[] = [];
      if (input.history && input.history.length > 0) {
        for (const item of input.history) {
          contents.push({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }]
          });
        }
      }
      contents.push({ role: 'user', parts: [{ text: input.message }] });
      body = {
        systemInstruction: { parts: [{ text: input.system }] },
        contents,
        generationConfig: { maxOutputTokens: input.maxTokens }
      };
    } else if (input.provider === 'ollama') {
      body = {
        model: input.model,
        system: input.system,
        prompt: [...(input.history||[]).slice(-8).map(item=>`${item.role}: ${item.content}`),`user: ${input.message}`].join('\n'),
        stream: false,
        options: { num_predict: input.maxTokens, num_ctx: 2048 }
      };
    } else if (input.provider === 'anthropic') {
      headers['x-api-key'] = key || '';
      headers['anthropic-version'] = '2023-06-01';
      const messages: any[] = [];
      if (input.history && input.history.length > 0) {
        for (const item of input.history) {
          messages.push({ role: item.role, content: item.content });
        }
      }
      messages.push({ role: 'user', content: input.message });
      body = {
        model: input.model,
        system: input.system,
        messages,
        max_tokens: input.maxTokens
      };
    } else {
      headers.Authorization = `Bearer ${key}`;
      const messages: any[] = [{ role: 'system', content: input.system }];
      if (input.history && input.history.length > 0) {
        for (const item of input.history) {
          messages.push({ role: item.role, content: item.content });
        }
      }
      messages.push({ role: 'user', content: input.message });
      body = {
        model: input.model,
        messages,
        [input.provider === 'openai' ? 'max_completion_tokens' : 'max_tokens']: input.maxTokens
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
        redirect: 'error'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const classified = classifyApiError(error);
    logApiError(input.provider, input.model, classified);
    throw classified;
  }
}

export async function saveCredential(provider: CredentialProvider, key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed || trimmed.length > 4096) throw new Error('Geçerli bir anahtar girin.');
  if (isNativeApp()) {
    await nativeInvoke('save_api_key', { provider, key: trimmed });
  } else {
    sessionKeys.set(provider, trimmed);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(`dp_ai_key_${provider}`, trimmed);
    }
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(`dp_ai_key_${provider}`);
  }
  writeSetting(`ai_key_${provider}`, trimmed);
  if (provider === 'gemini') {
    writeSetting('voice_api_key', trimmed);
    writeSetting('gemini_api_key', trimmed);
  }
  keyMaskHints.set(provider, maskSecretKey(trimmed));
  writeSetting(`ai_key_hint_${provider}`, maskSecretKey(trimmed));
}

// Only fixed, verified provider endpoints may call this. Never send credentials to user supplied URLs.
export async function providerFetch(
  provider: CredentialProvider | 'local',
  url: string,
  init: RequestInit,
  timeoutMs = 120000
): Promise<Response> {
  const allowed: Partial<Record<CredentialProvider | 'local', string[]>> = {
    gemini: ['https://generativelanguage.googleapis.com/'],
    openai: ['https://api.openai.com/'],
    openrouter: ['https://openrouter.ai/'],
    mistral: ['https://api.mistral.ai/'],
    zai: ['https://api.z.ai/'],
    groq: ['https://api.groq.com/'],
    cerebras: ['https://api.cerebras.ai/'],
    together: ['https://api.together.xyz/', 'https://api.together.ai/'],
    fireworks: ['https://api.fireworks.ai/'],
    deepseek: ['https://api.deepseek.com/'],
    huggingface: ['https://router.huggingface.co/', 'https://api-inference.huggingface.co/'],
    cloudflare: ['https://api.cloudflare.com/'],
    anthropic: ['https://api.anthropic.com/'],
    elevenlabs: ['https://api.elevenlabs.io/'],
    cartesia: ['https://api.cartesia.ai/'],
    local: ['http://127.0.0.1:8880/', 'http://127.0.0.1:7860/', 'http://127.0.0.1:8188/']
  };
  if (!allowed[provider]?.some(base => url.startsWith(base))) {
    throw new Error('İzin verilmeyen servis adresi.');
  }
  const headers = new Headers(init.headers);
  if (provider !== 'local') {
    const key = getStoredKey(provider);
    if (!key) throw new ApiConnectionError('missing_key', 'Bu sağlayıcının anahtarını önce kaydedin.');
    headers.set(
      provider === 'gemini' ? 'x-goog-api-key' : provider === 'elevenlabs' ? 'xi-api-key' : provider === 'cartesia' ? 'X-API-Key' : 'Authorization',
      ['gemini', 'elevenlabs', 'cartesia'].includes(provider) ? key : `Bearer ${key}`
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, headers, signal: controller.signal, redirect: 'error' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 128 * 1024 * 1024) throw new Error('Medya boyutu sınırı aşıldı.');
    return new Response(bytes, { status: response.status, headers: response.headers });
  } catch (error) {
    throw classifyApiError(error);
  } finally {
    clearTimeout(timer);
  }
}

export interface PublicModel {
  id: string;
  name: string;
  free: boolean;
  source?: 'live_api' | 'verified_catalog';
}

export async function listOpenRouterModels(): Promise<PublicModel[]> {
  let data: any;
  if (isNativeApp()) {
    const result = await nativeInvoke<any>('media_request', { input: { route: 'openrouter_models' } });
    data = result.body;
  } else {
    const response = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  }
  if (!Array.isArray(data?.data)) throw new Error('Model kataloğu alınamadı.');
  return data.data
    .filter((m: any) => typeof m.id === 'string' && (!m.architecture?.output_modalities || m.architecture.output_modalities.includes('text')))
    .map((m: any) => ({
      id: m.id,
      name: typeof m.name === 'string' ? m.name : m.id,
      free:
        m.pricing?.prompt != null &&
        m.pricing?.completion != null &&
        Number(m.pricing.prompt) === 0 &&
        Number(m.pricing.completion) === 0
    }));
}

/**
 * Sağlayıcının desteklediği güncel model listesini mümkün olduğunca API üzerinden alır;
 * API üzerinden alınamıyorsa doğrulanmış resmî katalog listesini döner ve kaynağını açıkça belirtir.
 */
export async function fetchProviderModels(provider: ManagedProvider): Promise<{
  models: PublicModel[];
  liveVerified: boolean;
  note: string;
}> {
  const info = PROVIDER_INFO[provider];
  const fallbackModels: PublicModel[] = info.presets.map(id => ({
    id,
    name: id,
    free: info.category === 'free_tier' || info.category === 'local' || id.endsWith(':free') || id === 'openrouter/free' || id === 'glm-4.5-flash',
    source: 'verified_catalog'
  }));

  if (provider === 'openrouter') {
    try {
      const list = await listOpenRouterModels();
      return {
        models: list.map(m => ({ ...m, source: 'live_api' })),
        liveVerified: true,
        note: `OpenRouter API üzerinden ${list.length} güncel model doğrulandı (${list.filter(m => m.free).length} ücretsiz model).`
      };
    } catch {
      return {
        models: fallbackModels,
        liveVerified: false,
        note: 'Canlı model kataloğuna erişilemedi; doğrulanmış resmî model listesi gösteriliyor.'
      };
    }
  }

  const modelEndpoints: Partial<Record<ManagedProvider, string>> = {
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
    openai: 'https://api.openai.com/v1/models',
    groq: 'https://api.groq.com/openai/v1/models',
    mistral: 'https://api.mistral.ai/v1/models',
    cerebras: 'https://api.cerebras.ai/v1/models',
    together: 'https://api.together.xyz/v1/models',
    fireworks: 'https://api.fireworks.ai/inference/v1/models',
    deepseek: 'https://api.deepseek.com/models',
    huggingface: 'https://router.huggingface.co/v1/models'
  };

  const endpoint = modelEndpoints[provider];
  if (endpoint && !isNativeApp() && getStoredKey(provider)) {
    try {
      const res = await providerFetch(provider, endpoint, { method: 'GET' }, 12000);
      const data = await res.json();
      const rawList = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [];
      if (rawList.length > 0) {
        const parsed: PublicModel[] = rawList
          .map((item: any) => {
            const rawId = String(item.id || item.name || '').replace(/^models\//, '');
            return {
              id: rawId,
              name: String(item.displayName || item.name || rawId),
              free: info.category === 'free_tier' || rawId.includes('free') || (provider === 'gemini' && rawId.includes('flash')),
              source: 'live_api' as const
            };
          })
          .filter((m: PublicModel) => m.id.length > 0);
        if (parsed.length > 0) {
          return {
            models: parsed,
            liveVerified: true,
            note: `${info.name} resmi API uç noktasından ${parsed.length} güncel model alındı.`
          };
        }
      }
    } catch {
      // Fallback to verified official catalog below
    }
  }

  return {
    models: fallbackModels,
    liveVerified: false,
    note: `${info.name} için resmî dokümantasyondan doğrulanmış model kataloğu listeleniyor (Canlı API model sorgusu yapılmadı veya desteklenmiyor).`
  };
}

export function getModelCapabilities(provider: ManagedProvider, model: string): ModelCapabilityDescriptor {
  const lower = model.toLowerCase();
  const info = PROVIDER_INFO[provider];
  const isFreeEligible =
    info.category === 'free_tier' ||
    info.category === 'local' ||
    lower.endsWith(':free') ||
    lower === 'openrouter/free' ||
    lower === 'glm-4.5-flash' ||
    ['gemini', 'groq', 'cerebras', 'huggingface', 'cloudflare'].includes(provider);

  return {
    supportsText: true,
    supportsStreaming: provider !== 'ollama',
    supportsVision: lower.includes('gemini') || lower.includes('gpt-4o') || lower.includes('claude-3') || lower.includes('vision') || lower.includes('pixtral'),
    supportsAudioInput: provider === 'gemini',
    supportsAudioOutput: provider === 'gemini' || provider === 'openai',
    supportsToolCalling: !['ollama', 'cloudflare'].includes(provider),
    contextWindowTokens: lower.includes('gemini') ? 1_000_000 : lower.includes('claude') ? 200_000 : 128_000,
    isFreeEligible,
    turkishQualityTier: ['gemini', 'openai', 'anthropic', 'deepseek', 'mistral', 'groq', 'openrouter', 'zai'].includes(provider) ? 'high' : 'medium',
    latencyTier: ['groq', 'cerebras'].includes(provider) ? 'ultra_fast' : lower.includes('flash') || lower.includes('mini') || lower.includes('haiku') ? 'fast' : 'standard'
  };
}

export function checkClientRateLimit(provider: ManagedProvider, minIntervalMs = 400): boolean {
  const now = Date.now();
  const prev = lastRequestTimestamps.get(provider) || 0;
  if (now - prev < minIntervalMs) return false;
  lastRequestTimestamps.set(provider, now);
  return true;
}

export interface ProviderInfoDetail {
  name: string;
  shortBadge: string;
  protocolVersion: string;
  category: 'free_tier' | 'paid' | 'mixed' | 'local';
  pricing: string;
  freeTierNote: string;
  platformUrl: string;
  keyUrl: string;
  docsUrl: string;
  docs: string;
  pricingUrl: string;
  modelsUrl: string;
  presets: string[];
  requiresAccountId?: boolean;
}

export const PROVIDER_INFO: Record<ManagedProvider, ProviderInfoDetail> = {
  gemini: {
    name: 'Google Gemini',
    shortBadge: 'G',
    protocolVersion: 'Google Generative Language API v1beta',
    category: 'mixed',
    pricing: 'Geniş ücretsiz kota katmanı (15 RPM / 1M TPM); sonrasında kullandığın kadar öde faturalandırma.',
    freeTierNote: 'Google ses paneli üzerinden alınan API anahtarları için ücretsiz kota tanımlıdır.',
    platformUrl: 'https://aistudio.google.com/',
    keyUrl: 'https://aistudio.google.com/api-keys',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    docs: 'https://ai.google.dev/gemini-api/docs',
    pricingUrl: 'https://ai.google.dev/pricing',
    modelsUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    presets: ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-flash-lite']
  },
  groq: {
    name: 'Groq Cloud',
    shortBadge: 'GQ',
    protocolVersion: 'OpenAI-Compatible REST v1',
    category: 'mixed',
    pricing: 'Ücretsiz geliştirici kota katmanı (Ultra hızlı LPU üzerinde Llama 3.3, Qwen, Gemma 2).',
    freeTierNote: 'Geliştiriciler için dakikada belirli istek/token sınırıyla ücretsiz kota sunulur; üst kotalar ücretlidir.',
    platformUrl: 'https://console.groq.com/',
    keyUrl: 'https://console.groq.com/keys',
    docsUrl: 'https://console.groq.com/docs/quickstart',
    docs: 'https://console.groq.com/docs/quickstart',
    pricingUrl: 'https://groq.com/pricing/',
    modelsUrl: 'https://console.groq.com/docs/models',
    presets: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-qwq-32b', 'mixtral-8x7b-32768']
  },
  cerebras: {
    name: 'Cerebras Cloud',
    shortBadge: 'CB',
    protocolVersion: 'OpenAI-Compatible REST v1',
    category: 'mixed',
    pricing: 'Wafer-Scale Engine ile ışık hızında Llama modelleri; ücretsiz geliştirici kotası + ücretli katman.',
    freeTierNote: 'Ücretsiz geliştirici kotası sunar; yüksek hacimli üretim kullanımı ücretlidir.',
    platformUrl: 'https://cloud.cerebras.ai/',
    keyUrl: 'https://cloud.cerebras.ai/',
    docsUrl: 'https://inference-docs.cerebras.ai/',
    docs: 'https://inference-docs.cerebras.ai/',
    pricingUrl: 'https://cerebras.ai/pricing',
    modelsUrl: 'https://inference-docs.cerebras.ai/models',
    presets: ['llama3.1-8b', 'llama-3.3-70b', 'qwen-3-32b']
  },
  openrouter: {
    name: 'OpenRouter',
    shortBadge: 'OR',
    protocolVersion: 'OpenRouter Unified API v1',
    category: 'mixed',
    pricing: 'Ücretsiz (:free) modeller ve 300+ ücretli model tek bir API anahtarında.',
    freeTierNote: 'Model kimliği :free ile bitenler ve openrouter/free yönlendiricisi ücretsizdir; günlük istek limitine tabidir.',
    platformUrl: 'https://openrouter.ai/',
    keyUrl: 'https://openrouter.ai/settings/keys',
    docsUrl: 'https://openrouter.ai/docs/quickstart',
    docs: 'https://openrouter.ai/docs/quickstart',
    pricingUrl: 'https://openrouter.ai/models',
    modelsUrl: 'https://openrouter.ai/models',
    presets: [
      'openrouter/free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'google/gemini-2.0-flash-exp:free'
    ]
  },
  zai: {
    name: 'Z.Rehber / GLM',
    shortBadge: 'Z',
    protocolVersion: 'Z.Rehber PaaS v4 (OpenAI-Compatible)',
    category: 'mixed',
    pricing: 'GLM-4.5-Flash ücretsiz model desteği ve GLM-4.5 / GLM-5 ücretli amiral gemisi modelleri.',
    freeTierNote: 'GLM-4.5-Flash modeli ücretsiz kullanılabilir; gelişmiş GLM modelleri token bazlı ücretlidir.',
    platformUrl: 'https://z.ai/model-api',
    keyUrl: 'https://z.ai/manage-apikey/billing',
    docsUrl: 'https://docs.z.ai/guides/overview/quick-start',
    docs: 'https://docs.z.ai/guides/overview/quick-start',
    pricingUrl: 'https://docs.z.ai/guides/overview/pricing',
    modelsUrl: 'https://z.ai/model-api',
    presets: ['glm-4.5-flash', 'glm-4.5', 'glm-4.5-air', 'glm-4-plus']
  },
  mistral: {
    name: 'Mistral Rehber',
    shortBadge: 'M',
    protocolVersion: 'Mistral La Plateforme v1',
    category: 'mixed',
    pricing: 'La Plateforme deneme katmanı (Experiment plan) ve token bazlı ücretli üretim tarifesi.',
    freeTierNote: 'Telefon doğrulamasıyla ücretsiz deneme katmanı (Experiment) sunulabilir; kurumsal kullanım ücretlidir.',
    platformUrl: 'https://console.mistral.ai/',
    keyUrl: 'https://console.mistral.ai/api-keys',
    docsUrl: 'https://docs.mistral.ai/api/endpoint/chat',
    docs: 'https://docs.mistral.ai/api/endpoint/chat',
    pricingUrl: 'https://mistral.ai/pricing/',
    modelsUrl: 'https://docs.mistral.ai/getting-started/models/models_overview/',
    presets: ['mistral-small-latest', 'mistral-large-latest', 'codestral-latest', 'ministral-8b-latest']
  },
  huggingface: {
    name: 'Hugging Face Inference API',
    shortBadge: 'HF',
    protocolVersion: 'HF Inference Router v1 (OpenAI-Compatible)',
    category: 'mixed',
    pricing: 'Ücretsiz aylık deneme kredisi ve kullandığın kadar öde sunucusuz açık kaynak modeller.',
    freeTierNote: 'Ücretsiz HF hesaplarına sınırlı aylık Inference kredisi tanımlanır; aşım durumunda PRO veya ön ödeme gerekir.',
    platformUrl: 'https://huggingface.co/',
    keyUrl: 'https://huggingface.co/settings/tokens',
    docsUrl: 'https://huggingface.co/docs/inference-providers/en/index',
    docs: 'https://huggingface.co/docs/inference-providers/en/index',
    pricingUrl: 'https://huggingface.co/docs/inference-providers/en/pricing',
    modelsUrl: 'https://huggingface.co/inference/models',
    presets: [
      'Qwen/Qwen2.5-72B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct',
      'mistralai/Mistral-Small-24B-Instruct-2501',
      'deepseek-ai/DeepSeek-R1'
    ]
  },
  cloudflare: {
    name: 'Cloudflare Workers Rehber',
    shortBadge: 'CF',
    protocolVersion: 'Cloudflare Rehber v1 (OpenAI-Compatible)',
    category: 'mixed',
    pricing: 'Günlük 10.000 Neurons ücretsiz kota; sonrasında 1.000 Neurons başına $0.011 ücretlendirme.',
    freeTierNote: 'Ücretsiz Cloudflare hesabıyla günlük 10.000 Neurons ücretsizdir. API anahtarı yanında Account ID gerektirir.',
    platformUrl: 'https://dash.cloudflare.com/',
    keyUrl: 'https://dash.cloudflare.com/?to=/:account/ai/workers-ai',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/',
    docs: 'https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/',
    pricingUrl: 'https://developers.cloudflare.com/workers-ai/platform/pricing/',
    modelsUrl: 'https://developers.cloudflare.com/workers-ai/models/',
    presets: [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/qwen/qwen2.5-coder-32b-instruct',
      '@cf/mistral/mistral-7b-instruct-v0.2'
    ],
    requiresAccountId: true
  },
  together: {
    name: 'Together Rehber',
    shortBadge: 'TG',
    protocolVersion: 'Together Inference REST v1',
    category: 'paid',
    pricing: 'Açık kaynak modeller için token bazlı ekonomik sunucusuz çıkarım tarifesi.',
    freeTierNote: 'Kayıt sonrası başlangıç kredisi tanımlanabilir; düzenli kullanım ön ödemeli bakiye gerektirir.',
    platformUrl: 'https://api.together.ai/',
    keyUrl: 'https://api.together.ai/settings/api-keys',
    docsUrl: 'https://docs.together.ai/docs/quickstart',
    docs: 'https://docs.together.ai/docs/quickstart',
    pricingUrl: 'https://www.together.ai/pricing',
    modelsUrl: 'https://docs.together.ai/docs/serverless-models',
    presets: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
      'deepseek-ai/DeepSeek-V3',
      'mistralai/Mixtral-8x7B-Instruct-v0.1'
    ]
  },
  fireworks: {
    name: 'Fireworks Rehber',
    shortBadge: 'FW',
    protocolVersion: 'Fireworks Inference v1 (OpenAI-Compatible)',
    category: 'paid',
    pricing: 'Düşük gecikmeli açık ağırlıklı modeller için 1M token başına ekonomik fiyatlandırma.',
    freeTierNote: 'Yeni hesaplara başlangıç deneme kredisi verilir; sonrasında kullandığın kadar öde modeli geçerlidir.',
    platformUrl: 'https://fireworks.ai/',
    keyUrl: 'https://fireworks.ai/account/api-keys',
    docsUrl: 'https://docs.fireworks.ai/getting-started/quickstart',
    docs: 'https://docs.fireworks.ai/getting-started/quickstart',
    pricingUrl: 'https://fireworks.ai/pricing',
    modelsUrl: 'https://fireworks.ai/models',
    presets: [
      'accounts/fireworks/models/llama-v3p3-70b-instruct',
      'accounts/fireworks/models/deepseek-v3',
      'accounts/fireworks/models/qwen2p5-72b-instruct'
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    shortBadge: 'DS',
    protocolVersion: 'DeepSeek REST API v1',
    category: 'paid',
    pricing: 'Sektörün en ekonomik token tarifesi (Önbellek isabetinde çok düşük girdi maliyeti).',
    freeTierNote: 'Ön ödemeli API modelidir; platform.deepseek.com üzerinden bakiye yüklenmesi gerekir.',
    platformUrl: 'https://platform.deepseek.com/',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    docsUrl: 'https://api-docs.deepseek.com/',
    docs: 'https://api-docs.deepseek.com/',
    pricingUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    modelsUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    presets: ['deepseek-chat', 'deepseek-reasoner']
  },
  openai: {
    name: 'OpenAI',
    shortBadge: 'OA',
    protocolVersion: 'OpenAI Chat Completions v1',
    category: 'paid',
    pricing: 'Ücretli API (Token bazlı faturalandırma). ChatGPT Plus aboneliği API için geçerli değildir.',
    freeTierNote: 'platform.openai.com üzerinden ön ödemeli kredi yüklenmesi gerekir.',
    platformUrl: 'https://platform.openai.com/',
    keyUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    docs: 'https://platform.openai.com/docs/api-reference',
    pricingUrl: 'https://openai.com/api/pricing/',
    modelsUrl: 'https://platform.openai.com/docs/models',
    presets: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o3-mini']
  },
  anthropic: {
    name: 'Anthropic Claude',
    shortBadge: 'CL',
    protocolVersion: 'Anthropic Messages API 2023-06-01',
    category: 'paid',
    pricing: 'Ücretli API (Token bazlı faturalandırma). Claude Pro aboneliği API için geçerli değildir.',
    freeTierNote: 'console.anthropic.com hesabına ön ödemeli kredi yüklenmesi gerekir.',
    platformUrl: 'https://console.anthropic.com/',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://platform.claude.com/docs/en/api/overview',
    docs: 'https://platform.claude.com/docs/en/api/overview',
    pricingUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    modelsUrl: 'https://platform.claude.com/docs/en/models/overview',
    presets: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-7-sonnet-20250219']
  },
  evren: {
    name: 'EVREN LLM',
    shortBadge: 'EV',
    protocolVersion: 'OpenAI-Compatible REST v1',
    category: 'mixed',
    pricing: 'Kurumsal / akademik hesap erişimi ve sağlayıcı tarifesine bağlıdır.',
    freeTierNote: 'Anahtar yetkisine bağlı kotalar geçerlidir.',
    platformUrl: 'https://evren.ssyz.org.tr/llm-inference/',
    keyUrl: 'https://evren.ssyz.org.tr/llm-inference/',
    docsUrl: 'https://evren.ssyz.org.tr/llm-inference/',
    docs: 'https://evren.ssyz.org.tr/llm-inference/',
    pricingUrl: 'https://evren.ssyz.org.tr/',
    modelsUrl: 'https://evren.ssyz.org.tr/',
    presets: ['auto']
  },
  ollama: {
    name: 'Ollama (İsteğe Bağlı Yerel)',
    shortBadge: 'OL',
    protocolVersion: 'Ollama Local REST API',
    category: 'local',
    pricing: 'Yerel ve API maliyetsiz. Ancak sistem donanımı ve model indirme gerektirir.',
    freeTierNote: 'Zorunlu DEĞİLDİR; uygulamamız uzaktaki API\'ler ve yerel çevrimdışı motorla çalışır.',
    platformUrl: 'https://ollama.com/',
    keyUrl: 'https://ollama.com/download',
    docsUrl: 'https://docs.ollama.com/api/generate',
    docs: 'https://docs.ollama.com/api/generate',
    pricingUrl: 'https://ollama.com/',
    modelsUrl: 'https://ollama.com/library',
    presets: ['llama3:latest', 'mistral:latest', 'qwen2.5:latest']
  }
};
