import {CALM_TEACHING_STYLE} from './teachingVoice';
import {whilePreparing} from './studentExperience';
import { classifyApiError, hasProviderKey, isNativeApp, nativeInvoke, providerFetch } from './apiClient';
import { mediaOption, type MediaKind } from './mediaCatalog';
export interface MediaJob {
  id: string;
  optionId: string;
  kind: MediaKind;
  model: string;
  prompt: string;
  voice: string;
  status: 'submitting' | 'pending' | 'completed' | 'failed' | 'unknown';
  remoteId?: string;
  message?: string;
  progress?: number;
  createdAt: string;
  file?: { filename: string; subfolder?: string };
}
export interface MediaConfig {
  optionId: string;
  model: string;
  voice: string;
  workflow?: string;
  aspectRatio?: '16:9' | '1:1';
}
interface TransportInput {
  route: string;
  payload?: any;
  id?: string;
}
const safeSegment = (id: string) => {
  if (!/^[\w-]{1,200}$/.test(id)) throw new Error('Geçersiz iş kimliği.');
  return id;
};
export async function mediaTransport(input: TransportInput): Promise<any | Blob> {
  return whilePreparing(input.route.includes('speech')||input.route.includes('tts')?'Ses hazırlanıyor…':'Materyal hazırlanıyor…',()=>mediaTransportInternal(input));
}
async function mediaTransportInternal(input: TransportInput): Promise<any | Blob> {
  if (isNativeApp()) {
    const result = await nativeInvoke<any>('media_request', { input });
    return result.kind === 'binary' ? base64Blob(result.data, result.mime) : result.body;
  }
  if(input.route==='kitten_speech'){
    const payload=input.payload||{};if(typeof payload.text!=='string'||!payload.text.trim()||payload.text.length>4000||payload.lang!=='en-US')throw new Error('Yerel İngilizce yalnız Türkçe ve en çok 4000 karakter destekler.');
    const response=await fetch('/api/kitten_speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(180000)});
    if(!response.ok)throw new Error('Yerel İngilizce yerel ses motoru kullanılamıyor. Kurulumu kontrol edin.');
    if(!response.headers.get('content-type')?.startsWith('audio/'))throw new Error('Yerel İngilizce ses yanıtı geçersiz.');return response.blob();
  }
  if(input.route==='ema_speech'){
    const payload=input.payload||{};if(typeof payload.text!=='string'||!payload.text.trim()||payload.text.length>4000||payload.lang!=='tr-TR')throw new Error('EMA yalnız Türkçe ve en çok 4000 karakter destekler.');
    const response=await fetch('/api/ema_speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(180000)});
    if(!response.ok)throw new Error('EMA yerel ses motoru kullanılamıyor. Kurulumu kontrol edin.');
    if(!response.headers.get('content-type')?.startsWith('audio/'))throw new Error('EMA ses yanıtı geçersiz.');return response.blob();
  }
  const body = input.payload || {};
  let url = '';
  let vendor: any = 'local';
  let method = 'POST';
  let binary = false;
  let payload: any = JSON.stringify(body);
  let form = false;
  const extraHeaders: Record<string, string> = {};
  switch (input.route) {
    case 'gemini_speech': {
      const model = body.model || 'gemini-3.8-flash-tts';
      if (!/^[\w.-]{1,150}$/.test(model)) throw new Error('Geçersiz model.');
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      vendor = 'gemini';
      payload = JSON.stringify(body.body || body);
      break;
    }
    case 'gemini_interaction':
      url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
      vendor = 'gemini';
      break;
    case 'openai_speech':
    case 'openai_tts':
      url = 'https://api.openai.com/v1/audio/speech';
      vendor = 'openai';
      binary = true;
      payload = JSON.stringify(body.body || body);
      break;
    case 'mistral_speech':
      url = 'https://api.mistral.ai/v1/audio/speech';
      vendor = 'mistral';
      break;
    case 'elevenlabs_speech':
    case 'elevenlabs_tts':
      url = `https://api.elevenlabs.io/v1/text-to-speech/${safeSegment(input.id || body.voiceId || 'TxGEqnHWrfWFTfGW9XjX')}`;
      vendor = 'elevenlabs';
      binary = true;
      payload = JSON.stringify(body.body || body);
      break;
    case 'cartesia_speech':
    case 'cartesia_tts':
      url = 'https://api.cartesia.ai/tts/bytes';
      vendor = 'cartesia';
      binary = true;
      extraHeaders['Cartesia-Version'] = '2024-06-10';
      payload = JSON.stringify(body.body || body);
      break;
    case 'together_image':
      url='https://api.together.ai/v1/images/generations';
      vendor='together';
      break;
    case 'openai_image':
      url = 'https://api.openai.com/v1/images/generations';
      vendor = 'openai';
      break;
    case 'openrouter_image':
      url = 'https://openrouter.ai/api/v1/chat/completions';
      vendor = 'openrouter';
      break;
    case 'openai_video_create': {
      url = 'https://api.openai.com/v1/videos';
      vendor = 'openai';
      form = true;
      const fields = new FormData();
      fields.set('model', body.model);
      fields.set('prompt', body.prompt);
      fields.set('seconds', '4');
      fields.set('size', '1280x720');
      payload = fields;
      break;
    }
    case 'openai_video_status':
    case 'openai_video_file':
      url = `https://api.openai.com/v1/videos/${safeSegment(input.id || '')}${input.route.endsWith('_file') ? '/content' : ''}`;
      vendor = 'openai';
      method = 'GET';
      binary = input.route.endsWith('_file');
      break;
    case 'gemini_video_create':
      if (!/^[\w.-]{1,150}$/.test(body.model)) throw new Error('Geçersiz model.');
      url = `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:predictLongRunning`;
      vendor = 'gemini';
      payload = JSON.stringify({
        instances: [{ prompt: body.prompt }],
        parameters: { aspectRatio: '16:9', durationSeconds: 8 }
      });
      break;
    case 'gemini_video_status':
      if (!/^[\w./-]{1,300}$/.test(input.id || '') || !input.id?.includes('operations/') || input.id.includes('..'))
        throw new Error('Geçersiz işlem.');
      url = `https://generativelanguage.googleapis.com/v1beta/${input.id}`;
      vendor = 'gemini';
      method = 'GET';
      break;
    case 'gemini_video_file': {
      const uri = new URL(input.id || '');
      if (
        uri.protocol !== 'https:' ||
        uri.hostname !== 'generativelanguage.googleapis.com' ||
        uri.port ||
        uri.username ||
        !uri.pathname.startsWith('/v1beta/files/')
      )
        throw new Error('İzin verilmeyen medya adresi.');
      uri.search = '?alt=media';
      url = uri.toString();
      vendor = 'gemini';
      method = 'GET';
      binary = true;
      break;
    }
    case 'kokoro_speech':
      url = 'http://127.0.0.1:8880/v1/audio/speech';
      binary = true;
      break;
    case 'sd_image':
      url = 'http://127.0.0.1:7860/sdapi/v1/txt2img';
      break;
    case 'comfy_create':
      url = 'http://127.0.0.1:8188/prompt';
      break;
    case 'comfy_status':
      url = `http://127.0.0.1:8188/history/${safeSegment(input.id || '')}`;
      method = 'GET';
      break;
    case 'comfy_file': {
      if (!body.filename || /[\\/]|\.\./.test(body.filename) || /\.\.|^[/\\]|:/.test(body.subfolder || ''))
        throw new Error('Geçersiz dosya.');
      url = `http://127.0.0.1:8188/view?${new URLSearchParams({
        filename: body.filename,
        subfolder: body.subfolder || '',
        type: 'output'
      })}`;
      method = 'GET';
      binary = true;
      break;
    }
    default:
      throw new Error('Desteklenmeyen medya işlemi.');
  }
  const response = await providerFetch(vendor, url, {
    method,
    headers: form ? extraHeaders : { 'Content-Type': 'application/json', ...extraHeaders },
    ...(method === 'POST' ? { body: payload } : {})
  });
  return binary ? response.blob() : response.json();
}
export function base64Blob(data: string, mime: string): Blob {
  if (!/^(audio\/(wav|x-wav|mpeg|mp3|ogg|flac|opus)|image\/(png|jpeg|webp)|video\/(mp4|webm))$/.test(mime))
    throw new Error('Desteklenmeyen medya türü.');
  if (!data || data.length > 180_000_000) throw new Error('Geçersiz medya boyutu.');
  const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  return new Blob([bytes], { type: mime === 'audio/x-wav' ? 'audio/wav' : mime });
}
export function pcmBase64ToWavBlob(base64Pcm: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Blob {
  const binaryString = atob(base64Pcm.replace(/\s+/g, ''));
  const pcmLength = binaryString.length;
  const buffer = new ArrayBuffer(44 + pcmLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  view.setUint32(28, byteRate, true);
  const blockAlign = numChannels * (bitsPerSample / 8);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, pcmLength, true);

  const bytes = new Uint8Array(buffer, 44, pcmLength);
  for (let i = 0; i < pcmLength; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function findMedia(value: any, kind: 'audio' | 'image'): { data: string; mime: string } | null {
  if (!value || typeof value !== 'object') return null;
  if (value.inlineData && typeof value.inlineData.data === 'string') {
    return { data: value.inlineData.data, mime: value.inlineData.mimeType || 'audio/wav' };
  }
  if (value.inline_data && typeof value.inline_data.data === 'string') {
    return { data: value.inline_data.data, mime: value.inline_data.mime_type || 'audio/wav' };
  }
  const direct = value[`output_${kind}`];
  if (direct?.data) return { data: direct.data, mime: direct.mime_type || (kind === 'audio' ? 'audio/wav' : 'image/png') };
  if (value.type === kind && typeof value.data === 'string')
    return { data: value.data, mime: value.mime_type || (kind === 'audio' ? 'audio/wav' : 'image/png') };
  for (const key of ['steps', 'candidates', 'parts', 'outputs', 'output', 'content']) {
    const items = value[key];
    if (Array.isArray(items)) {
      for (const item of items) {
        const result = findMedia(item, kind);
        if (result) return result;
      }
    } else if (items && typeof items === 'object') {
      const result = findMedia(items, kind);
      if (result) return result;
    }
  }
  return null;
}
export function parseGeneratedMedia(optionId: string, response: any): Blob {
  if (response instanceof Blob) {
    if (!response.size || !/^(audio|video|image)\//.test(response.type))
      throw new Error('Servis geçerli medya döndürmedi.');
    return response;
  }
  const option = mediaOption(optionId);
  if (option.vendor === 'gemini') {
    const media = findMedia(response, option.kind === 'speech' ? 'audio' : 'image');
    if (media) {
      // Gemini 3.8 TTS unary yanıtları varsayılan olarak RIFF başlıklı WAV (UklGR...) döndürür.
      const isRiffWav = media.data.startsWith('UklGR');
      if (!isRiffWav && (media.mime.includes('pcm') || media.mime.includes('l16'))) {
        const match = media.mime.match(/rate=(\d+)/);
        const rate = match ? parseInt(match[1], 10) : 24000;
        return pcmBase64ToWavBlob(media.data, rate);
      }
      return base64Blob(media.data, isRiffWav ? 'audio/wav' : media.mime);
    }
  }
  if (option.id === 'mistral_tts' && response.audio_data) return base64Blob(response.audio_data, 'audio/wav');
  const b64 = response.data?.[0]?.b64_json || response.images?.[0];
  if (typeof b64 === 'string') return base64Blob(b64, 'image/png');
  const image = response.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof image === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(image)) {
    const [header, data] = image.split(',');
    return base64Blob(data, header.slice(5, header.indexOf(';')));
  }
  throw new Error('Servis kullanılabilir medya üretmedi; engelleme, model erişimi veya yanıt biçimini kontrol edin.');
}
export function validateWorkflow(raw: string, prompt: string): any {
  let workflow: any;
  try {
    workflow = JSON.parse(raw);
  } catch {
    throw new Error('Geçerli bir ComfyUI API JSON iş akışı yükleyin.');
  }
  if (
    !workflow ||
    Array.isArray(workflow) ||
    typeof workflow !== 'object' ||
    Object.keys(workflow).length > 200 ||
    !Object.values(workflow).every((v: any) => v && typeof v.class_type === 'string' && v.inputs && typeof v.inputs === 'object')
  )
    throw new Error('ComfyUI API biçimi gerekli; arayüz iş akışı JSON biçimi kabul edilmez.');
  for (const node of Object.values(workflow) as any[])
    if (node.class_type === 'CLIPTextEncode' && node.inputs.text === '{{prompt}}') node.inputs.text = prompt;
  return workflow;
}
export async function createMedia(config: MediaConfig, prompt: string): Promise<{ blob?: Blob; remoteId?: string }> {
  const option = mediaOption(config.optionId);
  if (!prompt.trim() || prompt.length > 8000) throw new Error('1–8000 karakter arasında bir açıklama girin.');
  if (option.vendor !== 'local' && !(await hasProviderKey(option.vendor)))
    throw new Error('Bu sağlayıcı için önce API anahtarını kaydedin.');
  if (option.id === 'web_speech') throw new Error('Web Speech cihazda çalınır; dosya üretmez.');
  let request: TransportInput;
  switch (option.id) {
    case 'ema_local': return {blob:await mediaTransport({route:'ema_speech',payload:{text:prompt,lang:'tr-TR'}})};
    case 'gemini_tts':
    case 'gemini_tts_lite': {
      const useInteractions = !config.model || config.model.includes('3.8') || ['gemini-2.0-flash','gemini-2.5-flash'].includes(config.model);
      if (useInteractions) {
        request = {
          route: 'gemini_interaction',
          payload: {
            model: config.model?.includes('3.8') ? config.model : 'gemini-3.8-flash-tts',
            input: [
              {
                type: 'user_input',
                content: [
                  {
                    type: 'text',
                    text: prompt,
                    annotations: [
                      {
                        type: 'speech_metadata',
                        style: CALM_TEACHING_STYLE
                      }
                    ]
                  }
                ]
              }
            ],
            response_format: { type: 'audio' },
            generation_config: { speech_config: [{ voice: config.voice || 'Puck' }] }
          }
        };
      } else {
        const model = config.model && config.model.startsWith('gemini-') ? config.model : 'gemini-2.0-flash';
        request = {
          route: 'gemini_speech',
          payload: {
            model,
            body: {
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `Aşağıdaki ders anlatımını Türkçe ve son derece akıcı, samimi, doğal bir erkek öğretmen tonuyla seslendir:\n\n${prompt}` }]
                }
              ],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: config.voice || 'Puck'
                    }
                  }
                }
              }
            }
          }
        };
      }
      break;
    }
    case 'openai_tts':
    case 'kokoro':
      request = {
        route: option.id === 'kokoro' ? 'kokoro_speech' : 'openai_speech',
        payload: {
          model: config.model,
          input: prompt,
          voice: config.voice || (option.id === 'kokoro' ? 'am_adam' : 'ash'),
          response_format: 'wav',
          ...(option.id === 'openai_tts' && config.model.includes('gpt-4o')
            ? { instructions: 'Samimi, doğal, gerçek insan kalitesinde genç bir erkek öğretmen tonuyla konuş.' }
            : {})
        }
      };
      break;
    case 'mistral_tts':
      request = {
        route: 'mistral_speech',
        payload: {
          input: prompt,
          ...(config.model ? { model: config.model } : {}),
          ...(config.voice ? { voice_id: config.voice } : {}),
          response_format: 'wav',
          stream: false
        }
      };
      break;
    case 'elevenlabs_tts':
      request = {
        route: 'elevenlabs_speech',
        id: config.voice || 'TxGEqnHWrfWFTfGW9XjX',
        payload: { text: prompt, model_id: config.model || 'eleven_multilingual_v2' }
      };
      break;
    case 'cartesia_tts':
      request = {
        route: 'cartesia_speech',
        payload: {
          model_id: config.model || 'sonic-2',
          transcript: prompt,
          voice: { mode: 'id', id: config.voice || 'a0e99841-438c-4a64-b679-ae501e7d6091' },
          output_format: { container: 'wav', encoding: 'pcm_s16le', sample_rate: 24000 }
        }
      };
      break;
    case 'gemini_image':
      request = {
        route: 'gemini_interaction',
        payload: { model: config.model, input: prompt, response_format: { type: 'image', aspect_ratio: config.aspectRatio||'1:1' } }
      };
      break;
    case 'openai_image':
      request = { route: 'openai_image', payload: { model: config.model, prompt, n: 1, size: config.aspectRatio==='16:9'?'1536x864':'1024x1024' } };
      break;
    case 'together_image':
      request={route:'together_image',payload:{model:config.model,prompt,n:1,steps:20,response_format:'base64',width:1024,height:config.aspectRatio==='16:9'?576:1024}};
      break;
    case 'openrouter_image':
      request = {
        route: 'openrouter_image',
        payload: { model: config.model, messages: [{ role: 'user', content: prompt }], modalities: ['image', 'text'] }
      };
      break;
    case 'sd_image':
      request = { route: 'sd_image', payload: { prompt, steps: 20, width: 512, height: 512, batch_size: 1 } };
      break;
    case 'gemini_video':
    case 'openai_video':
      request = {
        route: option.id === 'gemini_video' ? 'gemini_video_create' : 'openai_video_create',
        payload: { model: config.model, prompt }
      };
      break;
    case 'comfy_image':
    case 'comfy_video':
      request = { route: 'comfy_create', payload: { prompt: validateWorkflow(config.workflow || '', prompt) } };
      break;
    default:
      throw new Error('Desteklenmeyen sağlayıcı.');
  }
  const result = await mediaTransport(request);
  if (option.kind === 'video' || option.id.startsWith('comfy_')) {
    const remoteId = result.name || result.id || result.prompt_id;
    if (typeof remoteId !== 'string' || !remoteId) throw new Error('Servis üretim işi kimliği döndürmedi.');
    return { remoteId };
  }
  return { blob: parseGeneratedMedia(option.id, result) };
}
export async function refreshMediaJob(job: MediaJob): Promise<{
  blob?: Blob;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  progress?: number;
}> {
  if (!job.remoteId) throw new Error('İş kimliği bulunamadı.');
  const route =
    job.optionId === 'gemini_video'
      ? 'gemini_video_status'
      : job.optionId === 'openai_video'
      ? 'openai_video_status'
      : 'comfy_status';
  const result = await mediaTransport({ route, id: job.remoteId });
  if (job.optionId === 'openai_video') {
    if (result.status === 'failed') return { status: 'failed', message: 'Video servisi işi tamamlayamadı.' };
    if (result.status === 'completed')
      return { status: 'completed', blob: await mediaTransport({ route: 'openai_video_file', id: job.remoteId }) };
    return { status: 'pending', progress: typeof result.progress === 'number' ? result.progress : undefined };
  }
  if (job.optionId === 'gemini_video') {
    if (result.error) return { status: 'failed', message: 'Google video işlemi başarısız.' };
    if (!result.done) return { status: 'pending' };
    const uri =
      result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      result.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri)
      return {
        status: 'failed',
        message: 'İş tamamlandı ancak video dönmedi; sağlayıcı içerik filtresi uygulamış olabilir.'
      };
    return { status: 'completed', blob: await mediaTransport({ route: 'gemini_video_file', id: uri }) };
  }
  const history = result[job.remoteId];
  if (!history) return { status: 'pending' };
  if (history.status?.status_str === 'error') return { status: 'failed', message: 'ComfyUI iş akışı başarısız.' };
  for (const output of Object.values(history.outputs || {}) as any[]) {
    const files = job.kind === 'video' ? [...(output.videos || []), ...(output.gifs || [])] : output.images || [];
    const file = files.find(
      (f: any) => f.type === 'output' && (job.kind === 'video' ? /\.(mp4|webm)$/i : /\.(png|jpe?g|webp)$/i).test(f.filename)
    );
    if (file) return { status: 'completed', blob: await mediaTransport({ route: 'comfy_file', payload: file }) };
  }
  if (history.status?.completed)
    return { status: 'failed', message: 'İş akışı tamamlandı ancak istenen biçimde çıktı dosyası yok.' };
  return { status: 'pending' };
}
export const mediaError = (error: unknown) =>
  error instanceof Error ? error.message : classifyApiError(error).message;
