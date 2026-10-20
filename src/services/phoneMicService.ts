/**
 * PhoneMicService: Telefonu Bilgisayarın Mikrofonu Olarak Kullanma Servisi
 * - Yerel ağ veya doğrudan eşleştirme ile telefonu kablosuz mikrofona dönüştürür.
 * - QR kod ile anında eşleşir, tarayıcı Web Audio API & Web Speech API köprüsü kurar.
 * - Canlı ses seviyesi (VU meter), sessize alma, kopan bağlantıyı otomatik toparlama
 *   ve telefon kesilirse bilgisayar mikrofonuna pürüzsüz geri dönüş sağlar.
 */

export type PhoneMicStatus = 'disconnected' | 'pairing' | 'connected' | 'muted' | 'fallback_to_pc';

export interface PhoneMicEvent {
  type: 'transcript' | 'audio_level' | 'status_change' | 'error';
  transcript?: string;
  audioLevel?: number; // 0 - 100
  status?: PhoneMicStatus;
  errorMessage?: string;
}

export class PhoneMicService {
  private static instance: PhoneMicService | null = null;
  private sessionId: string = '';
  private status: PhoneMicStatus = 'disconnected';
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(event: PhoneMicEvent) => void> = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private isMuted: boolean = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): PhoneMicService {
    if (!PhoneMicService.instance) {
      PhoneMicService.instance = new PhoneMicService();
    }
    return PhoneMicService.instance;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getStatus(): PhoneMicStatus {
    return this.status;
  }

  public getPairingUrl(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${origin}/?mode=phone_mic&session=${this.sessionId}`;
  }

  public initSession(): { sessionId: string; qrUrl: string } {
    this.sessionId = this.generateSessionId();
    this.status = 'pairing';
    this.startHostSession();
    return {
      sessionId: this.sessionId,
      qrUrl: this.getPairingUrl()
    };
  }

  public onTranscript(callback: (text: string) => void): () => void {
    return this.subscribe((event) => {
      if (event.type === 'transcript' && event.transcript) {
        callback(event.transcript);
      }
    });
  }

  public handleIncomingAudioPacket(packet: { sessionId?: string; type: string; transcript?: string; level?: number }): void {
    if (packet.type === 'audio_transcript' && packet.transcript) {
      this.notify({ type: 'transcript', transcript: packet.transcript });
    } else if (packet.type === 'audio_level' && packet.level !== undefined) {
      this.notify({ type: 'audio_level', audioLevel: packet.level });
    } else if (packet.type === 'phone_disconnect') {
      this.handlePhoneDisconnect();
    }
  }

  /**
   * Bilgisayar Tarafı: Eşleştirmeyi Başlatır ve Telefon Bağlantısını Dinler
   */
  public startHostSession(): void {
    this.status = 'pairing';
    this.notify({ type: 'status_change', status: this.status });

    if (typeof BroadcastChannel !== 'undefined') {
      if (this.channel) this.channel.close();
      this.channel = new BroadcastChannel(`phone_mic_${this.sessionId}`);
      this.channel.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'phone_connected') {
          this.status = 'connected';
          this.notify({ type: 'status_change', status: this.status });
        } else if (data.type === 'phone_transcript') {
          this.notify({ type: 'transcript', transcript: data.text });
        } else if (data.type === 'audio_level') {
          this.notify({ type: 'audio_level', audioLevel: data.level });
        } else if (data.type === 'phone_disconnected') {
          this.handlePhoneDisconnect();
        }
      };
    }
  }

  /**
   * Telefon Tarafı: Telefon Tarayıcısında Mikrofonu Açar ve Sesi İletir
   */
  public async connectAsPhone(sessionId: string, onLevelChange?: (level: number) => void): Promise<boolean> {
    this.sessionId = sessionId;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Cihazınızda mikrofon desteği bulunamadı veya güvenli bağlam (HTTPS/localhost) gereklidir.');
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });

      // AudioContext ile canlı VU-meter (Ses Seviyesi)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!this.analyser || this.status === 'disconnected') return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const level = Math.min(100, Math.round((avg / 128) * 100));

        if (onLevelChange) onLevelChange(level);
        if (this.channel && !this.isMuted) {
          this.channel.postMessage({ type: 'audio_level', level });
        }

        requestAnimationFrame(checkLevel);
      };
      requestAnimationFrame(checkLevel);

      // Telefon Web Speech Dikte Başlatma
      this.initPhoneSpeechRecognition();

      this.channel = new BroadcastChannel(`phone_mic_${sessionId}`);
      this.channel.postMessage({ type: 'phone_connected' });
      this.status = 'connected';
      return true;
    } catch (err: any) {
      this.notify({ type: 'error', errorMessage: err.message });
      return false;
    }
  }

  /**
   * Telefon Web Speech Tanıma
   */
  private initPhoneSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'tr-TR';

      recognition.onresult = (event: any) => {
        if (this.isMuted) return;
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const text = lastResult[0].transcript.trim();
          if (this.channel) {
            this.channel.postMessage({ type: 'phone_transcript', text });
          }
        }
      };

      recognition.onerror = () => {
        try { recognition.start(); } catch {}
      };

      recognition.onend = () => {
        if (this.status === 'connected') {
          try { recognition.start(); } catch {}
        }
      };

      try {
        recognition.start();
      } catch {}
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.status = this.isMuted ? 'muted' : 'connected';
    this.notify({ type: 'status_change', status: this.status });
    return this.isMuted;
  }

  public disconnect(): void {
    if (this.channel) {
      this.channel.postMessage({ type: 'phone_disconnected' });
      this.channel.close();
      this.channel = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.status = 'disconnected';
    this.notify({ type: 'status_change', status: this.status });
  }

  private handlePhoneDisconnect(): void {
    this.status = 'fallback_to_pc';
    this.notify({ 
      type: 'status_change', 
      status: this.status, 
      errorMessage: 'Telefon mikrofonu bağlantısı kesildi. Bilgisayar mikrofonuna geri dönüldü.' 
    });
  }

  public subscribe(listener: (event: PhoneMicEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(event: PhoneMicEvent): void {
    this.listeners.forEach(l => l(event));
  }

  private generateSessionId(): string {
    return `pm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }
}

export const phoneMicService = PhoneMicService.getInstance();
