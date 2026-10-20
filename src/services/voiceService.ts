import {CALM_TEACHING_STYLE} from './teachingVoice';
import { readSetting, writeSetting, hasProviderKey, isNativeApp } from './apiClient';
import { createMedia, mediaTransport, type MediaConfig } from './mediaService';
import {storedNarrationBlob} from './narrationStorage';
import { SpeechPhonetics } from './speechPhonetics';
import { NaturalConversationEngine } from './naturalConversationEngine';
import { getDb } from '../db/database';
import { VoiceProvider } from '../types/settings';

export type VoiceStatus = 'idle' | 'listening' | 'speaking' | 'paused' | 'waiting_for_student';

export interface VoiceServiceOptions {
  lang?: 'tr-TR' | 'en-US';
  rate?: number;
  pitch?: number;
  onStatusChange?: (status: VoiceStatus) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export class VoiceService {
  private static instance: VoiceService | null = null;
  private recognition: any = null;
  private isRecognitionAvailable = false;
  private status: VoiceStatus = 'idle';
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioObjectUrl: string | null = null;
  private speechVersion = 0;
  private speechDebounceTimer: any = null;
  private speechHeartbeat: any = null;
  private options: VoiceServiceOptions = {
    lang: 'tr-TR',
    rate: 1.0,
    pitch: 1.0,
  };

  // Fast memory tier (four steps) over a persistent device audio archive.
  private narrationCache=new Map<string,{promise:Promise<Blob>;expires:number;bytes:number}>();
  private async geminiNarrationBlob(text:string,voice:string,model:string,lang:'tr-TR'|'en-US'='tr-TR'):Promise<Blob>{
    const clean=NaturalConversationEngine.sanitizeForSpeech(text).slice(0,8000);
    const key=JSON.stringify([model,voice,clean,lang,CALM_TEACHING_STYLE]);const now=Date.now();
    for(const [id,entry] of this.narrationCache)if(entry.expires<now)this.narrationCache.delete(id);
    const hit=this.narrationCache.get(key);if(hit)return hit.promise;
    while(this.narrationCache.size>=4)this.narrationCache.delete(this.narrationCache.keys().next().value!);
    const entry={promise:null as unknown as Promise<Blob>,expires:now+10*60*1000,bytes:0};
    entry.promise=(async()=>{
      const blob=await storedNarrationBlob(['gemini-tts-calm-v2',model,voice,clean,lang,CALM_TEACHING_STYLE],async()=>{
        if(!await hasProviderKey('gemini'))throw new Error('Seçili ses için API anahtarı gerekli. Ayarlar ekranından güvenli olarak kaydedin.');
        const result=await createMedia({optionId:model.includes('lite')?'gemini_tts_lite':'gemini_tts',model,voice},clean);
        if(!result.blob?.size)throw new Error('Ses dosyası üretilmedi.');return result.blob;
      });
      entry.bytes=blob.size;
      let total=[...this.narrationCache.values()].reduce((n,v)=>n+v.bytes,0);
      for(const [id,value] of this.narrationCache){if(total<=12*1024*1024)break;if(id===key)continue;total-=value.bytes;this.narrationCache.delete(id);}
      if(entry.bytes>12*1024*1024)this.narrationCache.delete(key);
      return blob;
    })().catch(error=>{if(this.narrationCache.get(key)===entry)this.narrationCache.delete(key);throw error;});
    this.narrationCache.set(key,entry);return entry.promise;
  }
  private async emaNarrationBlob(text:string):Promise<Blob>{
    if(text.length>4000)throw new Error('EMA için en çok 4000 karakter desteklenir.');
    return storedNarrationBlob(['ema-local-v1','ema-lightning-1.1.2',text,'tr-TR'],async()=>{
      const blob=await mediaTransport({route:'ema_speech',payload:{text,lang:'tr-TR'}});
      if(!(blob instanceof Blob)||blob.size<44||!blob.type.startsWith('audio/'))throw new Error('EMA geçerli ses üretmedi.');return blob;
    });
  }
  private voiceNotice(message:string):void{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('dp-voice-notice',{detail:message}));}
  private activeTeacher = '';
  private async speakEma(text:string,lang:'tr-TR'|'en-US',onDone?:()=>void,onStart?:()=>void):Promise<void>{
    const version=this.speechVersion;
    try{
      if(lang!=='tr-TR')throw new Error('Yerel ses yalnız Türkçe destekler.');
      this.voiceNotice('Deniz öğretmen · Yerel Türkçe ses hazırlanıyor…');
      const switched=this.activeTeacher&&this.activeTeacher!=='Deniz';
      const introduction=switched?'Ben Deniz öğretmen. Türkçe anlatıma ben devam edeceğim. ':'';
      const blob=await this.emaNarrationBlob(introduction+text);if(version!==this.speechVersion)return;
      this.activeTeacher='Deniz';
      this.voiceNotice('Deniz öğretmen · Yerel Türkçe ses');this.playAudioBlob(URL.createObjectURL(blob),onDone,onStart);
    }catch{if(version!==this.speechVersion)return;this.setStatus('idle');this.options.onError?.('Yerel Türkçe ses hazırlanamadı. Yerel ses motorunu kontrol edin.');onDone?.();}
  }
  private localEnglishInFlight=new Map<string,Promise<Blob>>();
  private async localEnglishBlob(text:string):Promise<Blob>{
    const voice=readSetting<string>('local_english_voice','Jasper');
    const key=JSON.stringify([voice,text]);const hit=this.localEnglishInFlight.get(key);if(hit)return hit;if(this.localEnglishInFlight.size>=4)throw new Error('Ses hazırlanıyor; kısa süre sonra tekrar deneyin.');
    const pending=storedNarrationBlob(['kitten-local-v1','mini-0.8',voice,text,'en-US'],async()=>{
      const blob=await mediaTransport({route:'kitten_speech',payload:{text,lang:'en-US',voice}});
      if(!(blob instanceof Blob)||blob.size<44||!blob.type.startsWith('audio/'))throw new Error('Yerel İngilizce ses üretilemedi.');return blob;
    }).finally(()=>this.localEnglishInFlight.delete(key));
    this.localEnglishInFlight.set(key,pending);return pending;
  }
  private async speakEnglish(text:string,onDone?:()=>void,onStart?:()=>void):Promise<void>{
    const version=this.speechVersion;const teacher=readSetting<string>('local_english_voice','Jasper');
    try{
      this.voiceNotice(`${teacher} öğretmen · Yerel İngilizce ses hazırlanıyor…`);
      const introduction=this.activeTeacher&&this.activeTeacher!==teacher?`I am ${teacher}, and I will continue the lesson. `:'';
      const blob=await this.localEnglishBlob(introduction+text);if(version!==this.speechVersion)return;
      this.activeTeacher=teacher;this.voiceNotice(`${teacher} öğretmen · Yerel İngilizce ses`);
      this.playAudioBlob(URL.createObjectURL(blob),onDone,onStart);
    }catch{if(version!==this.speechVersion)return;this.setStatus('idle');this.options.onError?.('Yerel İngilizce ses hazırlanamadı. Yönetici panelinden yerel ses kurulumunu kontrol edin.');onDone?.();}
  }
  public async prepareNarration(text:string,lang:'tr-TR'|'en-US'='tr-TR'):Promise<void>{
    const spoken=SpeechPhonetics.toSpokenText(NaturalConversationEngine.sanitizeForSpeech(text),lang,readSetting('pronunciation_dictionary',{}));
    if(!spoken.trim())return;
    try{
      if(lang==='tr-TR'){await this.emaNarrationBlob(spoken);return;}
      await this.localEnglishBlob(spoken);
    }catch{/* Preparation never starts playback or changes the active teacher. */}
  }

  private constructor() {
    this.options.rate = readSetting<number>('speech_rate', 1.0);
    this.initRecognition();
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  public getSpeechRate(): number {
    return this.options.rate || readSetting<number>('speech_rate', 1.0) || 1.0;
  }

  public setSpeechRate(rate: number, persist = true): void {
    const validRate = Number.isFinite(rate) ? Math.max(0.5, Math.min(2.0, rate)) : 1;
    this.options.rate = validRate;
    if (persist) {
      writeSetting('speech_rate', validRate);
      try {
        getDb().execute(
          "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)",
          ['speech_rate', JSON.stringify(validRate), new Date().toISOString()]
        );
      } catch {}
    }
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.playbackRate = validRate;
        this.currentAudioElement.defaultPlaybackRate = validRate;
      } catch {}
    }
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isRecognitionAvailable = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.options.lang || 'tr-TR';

      this.recognition.onstart = () => {
        // Söz kesme (Barge-in): Kullanıcı konuşmaya başladığında yapay zekâ sesini anında durdur
        if (this.status === 'speaking') {
          this.stopSpeaking();
        }
        this.setStatus('listening');
      };

      this.recognition.onresult = (event: any) => {
        // Kullanıcı araya girdiğinde sesi hemen kes (Barge-in)
        if (this.status === 'speaking') {
          this.stopSpeaking();
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text && this.options.onTranscript) {
          if (finalTranscript) {
            if (this.speechDebounceTimer) {
              clearTimeout(this.speechDebounceTimer);
            }
            // Konuşma sonu algılama: Kısa duraksamaları cümlenin bittiği şeklinde yorumlamama
            this.speechDebounceTimer = setTimeout(() => {
              this.options.onTranscript?.(finalTranscript.trim(), true);
              this.speechDebounceTimer = null;
            }, 800);
          } else {
            this.options.onTranscript(interimTranscript, false);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (this.options.onError) {
          this.options.onError(event.error);
        }
        this.setStatus('idle');
      };

      this.recognition.onend = () => {
        if (this.status === 'listening') {
          this.setStatus('idle');
        }
      };
    }
  }

  public setOptions(opts: Partial<VoiceServiceOptions>): void {
    this.options = { ...this.options, ...opts };
    if (this.recognition && opts.lang) {
      this.recognition.lang = opts.lang;
    }
  }

  public getStatus(): VoiceStatus {
    return this.status;
  }

  public isSupported(): boolean {
    return typeof Audio!=='undefined'||typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public startListening(lang?: 'tr-TR' | 'en-US'): void {
    if (!this.recognition) {
      this.options.onError?.('Cihazınızda sesli dinleme desteklenmiyor.');
      return;
    }

    this.stopSpeaking();

    try {
      if (lang) {
        this.recognition.lang = lang;
      }
      this.recognition.start();
    } catch (e: any) {
      console.warn('Recognition start exception:', e.message);
    }
  }

  public stopListening(): void {
    if (this.speechDebounceTimer) {
      clearTimeout(this.speechDebounceTimer);
      this.speechDebounceTimer = null;
    }
    if (this.recognition && this.status === 'listening') {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored
      }
      this.setStatus('idle');
    }
  }

  /**
   * Metni seslendirir:
   * 1. NaturalConversationEngine ile sahne efektleri ve emojileri temizler ([güler], [iç çeker] okunmaz).
   * 2. SpeechPhonetics ile okunuşu dönüştürür (kullanıcıya gösterilmez).
   * 3. Ayarlarda seçilen ses sağlayıcısını (Gemini Speech, Google TTS, Web Speech veya OpenAI / ElevenLabs) kullanır.
   */
  public speakManually(text: string, lang: 'tr-TR'|'en-US'='tr-TR', onDone?:()=>void, preview?:MediaConfig, onStart?:()=>void): Promise<void> { return this.speak(text,lang,onDone,true,preview,onStart); }

  public async speak(text: string, lang: 'tr-TR' | 'en-US' = 'tr-TR', onDone?: () => void, explicit = false, preview?:MediaConfig,onStart?:()=>void): Promise<void> {
    if (!explicit && !readSetting('audio_feedback_enabled', false)) {onDone?.(); return;}
    this.stopSpeaking();
    this.stopListening();

    // 1. Sahne direktifleri ([güler], [iç çeker], *güler* vs.) ve emojileri temizle
    const sanitizedText = NaturalConversationEngine.sanitizeForSpeech(text);
    // 2. Kullanıcıya hissettirmeden konuşma odaklı fonetik metne dönüştür
    const spokenText = SpeechPhonetics.toSpokenText(sanitizedText, lang,readSetting('pronunciation_dictionary',{}));
    if (!spokenText.trim()) {
      onDone?.();
      return;
    }

    const version = this.speechVersion;
    if(!preview){if(lang==='tr-TR')await this.speakEma(spokenText,lang,onDone,onStart);else await this.speakEnglish(spokenText,onDone,onStart);return;}
    const mediaConfig = preview || readSetting<MediaConfig | null>('media_default_speech', null);
    if(mediaConfig?.optionId==='ema_local'){await this.speakEma(spokenText,lang,onDone,onStart);return;}
    if (mediaConfig) {
      if (mediaConfig.optionId === 'google_tts') { await this.speakGoogleTTS(spokenText,lang,onDone);return; }
      if (mediaConfig.optionId === 'web_speech') { await this.speakDevice(spokenText, lang, onDone); return; }
      try {
        const result = ['gemini_tts','gemini_tts_lite'].includes(mediaConfig.optionId) ? {blob:await this.geminiNarrationBlob(spokenText,mediaConfig.voice||'Puck',mediaConfig.model?.includes('3.8')?mediaConfig.model:'gemini-3.8-flash-tts',lang)} : {blob:await storedNarrationBlob(['speech-media-v1',mediaConfig.optionId,mediaConfig.model,mediaConfig.voice,spokenText,lang],async()=>{const generated=await createMedia(mediaConfig,spokenText.slice(0,8000));if(!generated.blob)throw new Error('Ses dosyası üretilmedi.');return generated.blob;})};
        if (version !== this.speechVersion) return;
        if (!result.blob) throw new Error('Ses dosyası üretilmedi.');
        this.playAudioBlob(URL.createObjectURL(result.blob), onDone,onStart);
        return;
      } catch (error) {
        if (version !== this.speechVersion) return;
        this.setStatus('idle');
        this.options.onError?.(error instanceof Error && error.message.includes('API anahtarı') ? error.message : 'Seçilen ses API bağlantısı başarısız. API anahtarını, modeli ve kotayı kontrol edin. Başka sese otomatik geçilmedi.');
        onDone?.();
        return;
      }
    }

    // SQLite'tan ses sağlayıcısını oku
    const provider=readSetting<VoiceProvider>('voice_provider','ema_local');
    let voiceModel=readSetting<string>('voice_model_name','Puck');

    if (!voiceModel || voiceModel === 'default') {
      voiceModel = 'Puck';
    }

    try {
      if(provider==='ema_local'){await this.speakEma(spokenText,lang,onDone,onStart);return;}
      if(provider==='google_tts'){await this.speakGoogleTTS(spokenText,lang,onDone);return;}
      if(provider==='web_speech'){await this.speakDevice(spokenText,lang,onDone);return;}
      const selected=provider==='gemini_speech'?'gemini':provider==='openai_tts'?'openai':provider==='elevenlabs'?'elevenlabs':provider==='cartesia_tts'?'cartesia':null;
      if(!selected||(selected!=='gemini'&&!await hasProviderKey(selected)))throw new Error('Seçili ses için API anahtarı gerekli. Ayarlar ekranından güvenli olarak kaydedin.');
      if(version!==this.speechVersion)return;
      if(provider==='gemini_speech'){
        const model=readSetting<string>('voice_tts_model','gemini-3.8-flash-tts');
        if(!await this.speakGeminiAudio(spokenText,voiceModel,onDone,model.includes('3.8')?model:'gemini-3.8-flash-tts',onStart,lang))throw new Error('Gemini ses üretimi başarısız. API bağlantısını ve kotayı kontrol edin.');
      }else if(provider==='openai_tts')await this.speakOpenAI(spokenText,'',voiceModel,onDone);
      else if(provider==='elevenlabs')await this.speakElevenLabs(spokenText,'',voiceModel,onDone);
      else if(provider==='cartesia_tts')await this.speakCartesia(spokenText,'',voiceModel,onDone);
    }catch(error){
      if(version!==this.speechVersion)return;
      this.setStatus('idle');
      this.options.onError?.(error instanceof Error?error.message:'Seçili ses üretilemedi.');
      onDone?.();
    }
  }

  /**
   * Google Gemini Speech Generation API (https://aistudio.google.com/apps/bundled/voice-library)
   * Doğrudan Google AI Studio Voice Library üzerindeki erkek insan seslerini (Puck, Charon, Fenrir, Orus) üretir.
   */
  public async speakGeminiAudio(text: string, voiceName = 'Puck', onDone?:()=>void, model = 'gemini-3.8-flash-tts', onStart?:()=>void,lang:'tr-TR'|'en-US'='tr-TR'): Promise<boolean> {
    const version = this.speechVersion;
    try {
      const result = {blob:await this.geminiNarrationBlob(text,voiceName,model,lang)};
      if(version !== this.speechVersion || !result.blob) return false;
      if(typeof Audio === 'undefined') {onDone?.();return true;}
      this.playAudioBlob(URL.createObjectURL(result.blob),onDone,onStart);return true;
    } catch(error) {this.setStatus('idle');if(error instanceof Error&&error.message.includes('API anahtarı'))throw error;return false;}
  }

  /**
   * Google TTS - Kesintisiz ve İnsani Doğallıkta Google Türkçe / İngilizce Seslendirme
   * 1. Vite proxy (/api/google_tts) üzerinden veya doğrudan resmi Google ses akışı çeker.
   * 2. Metni cümle cümle gerçek Google MP3 olarak çalar.
   * 3. Çevrimdışıysa veya bağlantı koparsa Web Speech motoruna yumuşak geçiş yapar.
   */
  public async speakGoogleTTS(text: string, lang: 'tr-TR' | 'en-US' = 'tr-TR', onDone?: () => void): Promise<void> {
    this.setStatus('speaking');
    const version = this.speechVersion;
    const langCode = lang.startsWith('en') ? 'en' : 'tr';
    const cleanText = text.replace(/[*_#`]/g, '').trim();

    // Cümle sınırlarına böl
    const rawSentences = cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText];
    const sentences = rawSentences.flatMap(s=>s.match(/[\s\S]{1,170}(?:\s|$)|[\s\S]{1,170}/g)||[]).map(s => s.trim()).filter(Boolean);
    if (sentences.length === 0) {
      onDone?.();
      return;
    }

    let currentIndex = 0;

    const playNext = async () => {
      if (version !== this.speechVersion) return;
      if (currentIndex >= sentences.length) {
        this.setStatus('idle');
        onDone?.();
        return;
      }

      const segment = sentences[currentIndex];
      currentIndex++;

      try {
        const blob=await storedNarrationBlob(['google-tts-v1',langCode,segment],async()=>{
        let blob:Blob;
        if(isNativeApp()){
          blob=await mediaTransport({route:'google_tts',payload:{text:segment,lang:langCode}});
        } else {
          const ttsUrl=`${window.location.origin}/api/google_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(segment)}`;
          const res=await fetch(ttsUrl);
          if(!res.ok)throw new Error(`Google TTS HTTP: ${res.status}`);
          blob=await res.blob();
        }
        if(!(blob instanceof Blob)||!blob.type.startsWith('audio/'))throw new Error('Google ses dosyası alınamadı.');
        return blob;
        });
        if (version !== this.speechVersion) return;

        const audioUrl = URL.createObjectURL(blob);
        this.playAudioBlob(audioUrl, () => {
          if (version === this.speechVersion) {
            playNext();
          }
        });
      } catch (error) {
        if(version!==this.speechVersion)return;
        this.setStatus('idle');
        this.options.onError?.(`Ücretsiz Google sesi alınamadı (${error instanceof Error && error.message.startsWith('Google') ? error.message : error instanceof Error ? error.name : 'bağlantı hatası'}). Mekanik Windows sesi otomatik açılmadı.`);
        onDone?.();
      }
    };

    await playNext();
  }

  /**
   * Ücretsiz Web Speech API (Chrome / Edge / Safari / Windows Yerel ve Google Sesleri)
   * 1. 150+ karakterli metinleri cümlelere bölerek sırayla çalar.
   * 2. Chrome'un 15 saniyede konuşmayı dondurma (freeze) hatasını heartbeat ile önler.
   * 3. Utterance nesnesini GC'den korur.
   * 4. Asla robotik desktop sesini önceliklendirmez; Google Türkçe / Natural sesleri seçer.
   */
  private async speakDevice(text:string,lang:'tr-TR'|'en-US',onDone?:()=>void):Promise<void>{
    const version=this.speechVersion;
    if(isNativeApp()){
      try {
        const blob=await storedNarrationBlob(['windows-device-v2',lang,text.slice(0,4000)],async()=>{
          const result=await mediaTransport({route:'device_speech',payload:{text:text.slice(0,4000),lang}});
          if(!(result instanceof Blob)||!result.size)throw new Error('Cihaz sesi üretilemedi.');return result;
        });
        if(version!==this.speechVersion)return;
        if(!(blob instanceof Blob)||!blob.size)throw new Error('Cihaz sesi uretilemedi.');
        this.playAudioBlob(URL.createObjectURL(blob),onDone);return;
      } catch { if(version!==this.speechVersion)return; }
    }
    this.speakWebSpeech(text,lang,onDone);
  }

  private speakWebSpeech(text: string, lang: 'tr-TR' | 'en-US', onDone?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.options.onError?.('Bu cihazda ses motoru bulunamadi.');
      onDone?.();
      return;
    }

    if (this.speechHeartbeat) {
      clearInterval(this.speechHeartbeat);
      this.speechHeartbeat = null;
    }

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#`]/g, '').trim();
    if (!cleanText) {
      onDone?.();
      return;
    }

    // Doğal cümle sınırlarından böl
    const rawSentences = cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText];
    const sentences = rawSentences.map(s => s.trim()).filter(Boolean);
    if (sentences.length === 0) {
      onDone?.();
      return;
    }

    let currentIndex = 0;
    const version = this.speechVersion;

    const playSentence = () => {
      if (version !== this.speechVersion) return;
      if (currentIndex >= sentences.length) {
        if (this.speechHeartbeat) {
          clearInterval(this.speechHeartbeat);
          this.speechHeartbeat = null;
        }
        this.setStatus('idle');
        this.currentUtterance = null;
        onDone?.();
        return;
      }

      const segment = sentences[currentIndex];
      currentIndex++;

      const utterance = new SpeechSynthesisUtterance(segment);
      utterance.lang = lang;
      utterance.rate = this.getSpeechRate();
      utterance.pitch = this.options.pitch || 1.0;

      try {
        const voices = window.speechSynthesis.getVoices();
        const prefix = lang.split('-')[0];
        const langVoices = voices.filter(v => v.lang.startsWith(prefix));
        if(lang==='en-US'&&voices.length>0&&langVoices.length===0){
          this.setStatus('idle');this.options.onError?.('Cihazda İngilizce konuşma sesi bulunamadı. İngilizce ses paketini kurun veya API sesi seçin.');onDone?.();return;
        }

        // 1. Türkçe Doğal Erkek Sesleri (Ahmet - Edge Natural / Online)
        let preferred = langVoices.find(v => v.name.toLowerCase().includes('ahmet'));
        // 2. Windows / Cihaz Erkek Sesleri (Tolga, Male, Erkek)
        if (!preferred) {
          preferred = langVoices.find(v => 
            v.name.toLowerCase().includes('tolga') || 
            v.name.toLowerCase().includes('male') || 
            v.name.toLowerCase().includes('erkek')
          );
        }
        // 3. Doğal / Online sesler (Kadın sesleri Emel/Yelda hariç)
        if (!preferred) {
          preferred = langVoices.find(v => 
            (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online')) &&
            !v.name.toLowerCase().includes('emel') && 
            !v.name.toLowerCase().includes('yelda')
          );
        }
        // 4. Kadın olmayan diğer sesler
        if (!preferred) {
          preferred = langVoices.find(v => 
            !v.name.toLowerCase().includes('emel') && 
            !v.name.toLowerCase().includes('yelda') &&
            !v.name.toLowerCase().includes('female')
          );
        }
        // 5. Hiçbiri yoksa mevcut ilk ses
        if (!preferred) {
          preferred = langVoices[0];
        }

        if (preferred) {
          utterance.voice = preferred;
          // Eğer tek bulunan ses kadın sesi ise, tınıyı toklaştırmak için perdeyi hafifçe düşür (erkek sesine yaklaştır)
          const isFemale = preferred.name.toLowerCase().includes('emel') || 
                           preferred.name.toLowerCase().includes('yelda') || 
                           preferred.name.toLowerCase().includes('female') ||
                           preferred.name.toLowerCase().includes('google');
          if (isFemale) {
            utterance.pitch = 0.85;
          }
        }
      } catch {
        // Ignored
      }

      utterance.onstart = () => {
        if (version === this.speechVersion) {
          this.setStatus('speaking');
        }
      };

      utterance.onend = () => {
        if (version === this.speechVersion) {
          playSentence();
        }
      };

      utterance.onerror = (event) => {
        if (version !== this.speechVersion) return;
        if (this.speechHeartbeat) {clearInterval(this.speechHeartbeat);this.speechHeartbeat=null;}
        this.setStatus('idle');
        if(event.error!=='canceled'&&event.error!=='interrupted')this.options.onError?.('Cihaz seslendirmesi basarisiz. Windows ses ve konusma ayarlarini kontrol edin.');
        onDone?.();
      };

      this.currentUtterance = utterance;
      (window as any).__lastSpeechUtterance = utterance; // V8 garbage collection koruması
      window.speechSynthesis.speak(utterance);
    };

    // Chrome 15 saniye freeze koruması (heartbeat)
    this.speechHeartbeat = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 4000);

    playSentence();
  }

  /**
   * OpenAI Text-to-Speech API (Ücretli)
   */
  private async speakOpenAI(text:string,_apiKey:string,voice='alloy',onDone?:()=>void):Promise<void>{
    const config={optionId:'openai_tts',model:'gpt-4o-mini-tts',voice:['alloy','echo','fable','onyx','nova','shimmer'].includes(voice)?voice:'alloy'};
    const result={blob:await storedNarrationBlob(['openai-tts-v1',config.model,config.voice,text.slice(0,4000)],async()=>{const generated=await createMedia(config,text.slice(0,4000));if(!generated.blob)throw new Error('Ses üretilemedi.');return generated.blob;})};
    if(!result.blob)throw new Error('Ses uretilemedi.');this.playAudioBlob(URL.createObjectURL(result.blob),onDone);
  }
  private async speakElevenLabs(text:string,_apiKey:string,voice?:string,onDone?:()=>void):Promise<void>{
    const config={optionId:'elevenlabs_tts',model:'eleven_multilingual_v2',voice:voice&&voice!=='default'?voice:'21m00Tcm4TlvDq8ikWAM'};
    const result={blob:await storedNarrationBlob(['elevenlabs-tts-v1',config.model,config.voice,text.slice(0,4000)],async()=>{const generated=await createMedia(config,text.slice(0,4000));if(!generated.blob)throw new Error('Ses üretilemedi.');return generated.blob;})};
    if(!result.blob)throw new Error('Ses uretilemedi.');this.playAudioBlob(URL.createObjectURL(result.blob),onDone);
  }

  public async speakCartesia(text: string, _apiKey = '', voice = 'a0e99841-438c-4a64-b679-ae501e7d6091', onDone?:()=>void): Promise<void> {
    const result={blob:await storedNarrationBlob(['cartesia-tts-v1','sonic-2',voice,text.slice(0,8000)],async()=>{const generated=await createMedia({optionId:'cartesia_tts',model:'sonic-2',voice},text.slice(0,8000));if(!generated.blob)throw new Error('Ses üretilemedi.');return generated.blob;})};
    if(!result.blob)throw new Error('Ses üretilemedi.');this.playAudioBlob(URL.createObjectURL(result.blob),onDone);
  }

  private playAudioBlob(url: string, onDone?: () => void,onStart?:()=>void): void {
    const version = this.speechVersion;
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement.src = '';
      } catch {}
      this.currentAudioElement = null;
    }

    if (version !== this.speechVersion) {
      try { URL.revokeObjectURL(url); } catch {}
      return;
    }

    this.setStatus('speaking');
    this.audioObjectUrl = url;
    const audio = new Audio(url);
    this.currentAudioElement = audio;

    const rate = this.getSpeechRate();
    audio.playbackRate = rate;
    audio.defaultPlaybackRate = rate;

    let started=false;
    audio.onplay = () => {
      if(version!==this.speechVersion)return;
      audio.playbackRate = this.getSpeechRate();
      if(!started){started=true;onStart?.();}
    };

    audio.onended = () => {
      if(version!==this.speechVersion)return;
      this.setStatus('idle');
      try { URL.revokeObjectURL(url); } catch {}
      if (this.audioObjectUrl === url) this.audioObjectUrl = null;
      if (this.currentAudioElement === audio) this.currentAudioElement = null;
      onDone?.();
    };

    audio.onerror = () => {
      if(version!==this.speechVersion)return;
      this.options.onError?.('Ses dosyasi oynatilamadi. Cihaz sesini veya ses cikisini kontrol edin.');
      this.setStatus('idle');
      try { URL.revokeObjectURL(url); } catch {}
      if (this.audioObjectUrl === url) this.audioObjectUrl = null;
      if (this.currentAudioElement === audio) this.currentAudioElement = null;
      onDone?.();
    };

    audio.play().catch(e => {
      if(version!==this.speechVersion)return;
      if (version === this.speechVersion) {
        this.options.onError?.('Ses oynatma engellendi. Ses dugmesine yeniden basin ve ses cikisini kontrol edin.');
        this.setStatus('idle');
      }
      try { URL.revokeObjectURL(url); } catch {}
      if (this.audioObjectUrl === url) this.audioObjectUrl = null;
      if (this.currentAudioElement === audio) this.currentAudioElement = null;
      onDone?.();
    });
  }

  public stopSpeaking(): void {
    this.speechVersion++;
    if (this.speechDebounceTimer) {
      clearTimeout(this.speechDebounceTimer);
      this.speechDebounceTimer = null;
    }
    if (this.speechHeartbeat) {
      clearInterval(this.speechHeartbeat);
      this.speechHeartbeat = null;
    }
    if (this.audioObjectUrl) { 
      try { URL.revokeObjectURL(this.audioObjectUrl); } catch {}
      this.audioObjectUrl = null; 
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
      this.currentUtterance = null;
    }
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement.src = '';
      } catch {}
      this.currentAudioElement = null;
    }
    if (this.status === 'speaking') {
      this.setStatus('idle');
    }
  }

  public pauseSpeaking(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.setStatus('paused');
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.setStatus('paused');
    }
  }

  public resumeSpeaking(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.play();
      this.setStatus('speaking');
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.setStatus('speaking');
    }
  }

  private setStatus(status: VoiceStatus): void {
    this.status = status;
    if (this.options.onStatusChange) {
      this.options.onStatusChange(status);
    }
  }
}

export const getVoiceService = (): VoiceService => VoiceService.getInstance();
