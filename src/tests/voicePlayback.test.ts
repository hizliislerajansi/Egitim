import {beforeEach,describe,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({native:false,hasKey:false,savedAudio:new Map<string,Blob>(),settings:{} as Record<string,unknown>,media:vi.fn(),transport:vi.fn()}));
vi.mock('../services/apiClient',()=>({isNativeApp:()=>mock.native,readSetting:(key:string,value:unknown)=>mock.settings[key]??value,hasProviderKey:async()=>mock.hasKey}));
vi.mock('../services/mediaStorage',()=>({loadMediaBlob:vi.fn(async(id:string)=>mock.savedAudio.get(id)||null),saveMediaBlob:vi.fn(async(id:string,blob:Blob)=>{mock.savedAudio.set(id,blob);})}));
vi.mock('../services/mediaService',()=>({createMedia:mock.media,mediaTransport:mock.transport}));
import {storedNarrationBlob,narrationStorageId} from '../services/narrationStorage';
import * as audioStorage from '../services/mediaStorage';
import {getVoiceService} from '../services/voiceService';
const service=getVoiceService();
beforeEach(()=>{vi.restoreAllMocks();mock.native=false;mock.hasKey=false;mock.savedAudio.clear();(service as any).narrationCache.clear();(service as any).activeTeacher='';mock.settings={audio_feedback_enabled:false,voice_provider:'gemini_speech'};mock.media.mockReset();mock.transport.mockReset();service.stopSpeaking();});
describe('User initiated voice regression',()=>{
 it('keeps unsolicited automatic feedback quiet',async()=>{const play=vi.spyOn(service as any,'speakWebSpeech').mockImplementation(()=>{});await service.speak('Merhaba');expect(play).not.toHaveBeenCalled();expect(mock.transport).not.toHaveBeenCalled();});
 it('plays a user click even when automatic feedback is off',async()=>{const play=vi.spyOn(service as any,'speakWebSpeech').mockImplementation(()=>{});await service.speakManually('Merhaba','tr-TR',undefined,{optionId:'web_speech',model:'',voice:''});expect(play).toHaveBeenCalled();});
 it('previews the visible selection instead of an old saved cloud voice',async()=>{mock.settings.media_default_speech={optionId:'gemini_tts',model:'old',voice:'Kore'};const play=vi.spyOn(service as any,'speakWebSpeech').mockImplementation(()=>{});await service.speakManually('Merhaba','tr-TR',undefined,{optionId:'web_speech',model:'',voice:''});expect(play).toHaveBeenCalled();expect(mock.media).not.toHaveBeenCalled();});
 it('uses native Windows speech without a localhost development proxy or API key',async()=>{mock.native=true;mock.transport.mockResolvedValue(new Blob(['RIFFwave'],{type:'audio/wav'}));const play=vi.spyOn(service as any,'playAudioBlob').mockImplementation(()=>{});await service.speakManually('Merhaba','tr-TR',undefined,{optionId:'web_speech',model:'',voice:''});expect(mock.transport).toHaveBeenCalledWith({route:'device_speech',payload:{text:expect.any(String),lang:'tr-TR'}});expect(play).toHaveBeenCalled();expect(mock.media).not.toHaveBeenCalled();});
 it('does not substitute free Google or Windows when the selected Gemini service fails',async()=>{mock.native=true;mock.media.mockRejectedValue(new Error('offline'));const error=vi.fn();service.setOptions({onError:error});await service.speakManually('Merhaba','tr-TR',undefined,{optionId:'gemini_tts',model:'gemini-3.8-flash-tts',voice:'Puck'});expect(mock.transport).not.toHaveBeenCalled();expect(error).toHaveBeenCalled();});
 it('does not silently switch to Windows speech when free Google is offline',async()=>{mock.native=true;mock.transport.mockRejectedValue(new Error('offline'));const local=vi.spyOn(service as any,'speakWebSpeech').mockImplementation(()=>{});const error=vi.fn();service.setOptions({onError:error});await service.speakManually('Merhaba','tr-TR',undefined,{optionId:'google_tts',model:'',voice:''});expect(error).toHaveBeenCalled();expect(local).not.toHaveBeenCalled();expect(mock.transport).toHaveBeenCalledTimes(1);expect(mock.transport).toHaveBeenCalledWith(expect.objectContaining({route:'google_tts'}));});

  it('adjusts and retrieves speech rate cleanly', () => {
    service.setSpeechRate(0.85, false);
    expect(service.getSpeechRate()).toBe(0.85);
    service.setSpeechRate(1.25, false);
    expect(service.getSpeechRate()).toBe(1.25);
  });
 it('applies rate to generated audio and updates currently playing audio',()=>{
   let audio:any;
   class FakeAudio { playbackRate=1;defaultPlaybackRate=1;currentTime=0;src='';play=vi.fn(async()=>{});pause=vi.fn();constructor(){audio=this;} }
   vi.stubGlobal('Audio',FakeAudio);
   try{service.setSpeechRate(0.75,false);(service as any).playAudioBlob('blob:voice-test');expect(audio.playbackRate).toBe(0.75);service.setSpeechRate(1.5,false);expect(audio.playbackRate).toBe(1.5);service.stopSpeaking();}finally{vi.unstubAllGlobals();}
 });
 it('reports a missing Gemini credential instead of playing another provider',async()=>{const error=vi.fn();service.setOptions({onError:error});mock.settings.voice_provider='gemini_speech';await service.speakManually('Merhaba','en-US',undefined,{optionId:'gemini_tts',model:'gemini-3.8-flash-tts',voice:'Charon'});expect(error).toHaveBeenCalledWith(expect.stringContaining('API anahtarı'));expect(mock.media).not.toHaveBeenCalled();expect(mock.transport).not.toHaveBeenCalled();});

 it('prepares the next local English clip without playback and reuses it for narration',async()=>{
   mock.hasKey=true;mock.transport.mockResolvedValue(new Blob(['x'.repeat(100)],{type:'audio/wav'}));
   const play=vi.spyOn(service as any,'playAudioBlob').mockImplementation(()=>{});vi.stubGlobal('Audio',class {});
   try{await service.prepareNarration('Sonraki adım.','en-US');expect(play).not.toHaveBeenCalled();await service.speakManually('Sonraki adım.','en-US');expect(mock.transport).toHaveBeenCalledTimes(1);expect(play).toHaveBeenCalledTimes(1);}finally{vi.unstubAllGlobals();}
 });
 it('shares an in-flight preparation request and never plays a stopped request',async()=>{
   mock.hasKey=true;let ready!:(result:any)=>void;mock.transport.mockImplementation(()=>new Promise(resolve=>{ready=resolve;}));
   const play=vi.spyOn(service as any,'playAudioBlob').mockImplementation(()=>{});
   const warming=service.prepareNarration('Bekleyen adım.','en-US');await vi.waitFor(()=>expect(mock.transport).toHaveBeenCalledTimes(1));
   const speaking=service.speakManually('Bekleyen adım.','en-US');await Promise.resolve();await Promise.resolve();service.stopSpeaking();
   ready(new Blob(['x'.repeat(100)],{type:'audio/wav'}));await Promise.all([warming,speaking]);expect(mock.transport).toHaveBeenCalledTimes(1);expect(play).not.toHaveBeenCalled();
 });
 it('invalidates prepared audio when the selected voice changes',async()=>{
   mock.hasKey=true;mock.media.mockResolvedValue({blob:new Blob(['wave'],{type:'audio/wav'})});
   await (service as any).geminiNarrationBlob('Aynı metin.','Charon','gemini-3.8-flash-tts','en-US');await (service as any).geminiNarrationBlob('Aynı metin.','Fenrir','gemini-3.8-flash-tts','en-US');
   expect(mock.media).toHaveBeenCalledTimes(2);expect(mock.media.mock.calls[1][0].voice).toBe('Fenrir');
 });
 it('retries a failed prefetch instead of caching the error',async()=>{
   mock.hasKey=true;mock.transport.mockRejectedValueOnce(new Error('temporary')).mockResolvedValue(new Blob(['x'.repeat(100)],{type:'audio/wav'}));
   await service.prepareNarration('Yeniden dene.','en-US');await service.prepareNarration('Yeniden dene.','en-US');expect(mock.transport).toHaveBeenCalledTimes(2);
 });
 it('prepares local English without a key or cloud call',async()=>{mock.transport.mockResolvedValue(new Blob(['x'.repeat(100)],{type:'audio/wav'}));await service.prepareNarration('Hello.','en-US');await service.prepareNarration('Hello.','en-US');expect(mock.transport).toHaveBeenCalledTimes(1);expect(mock.media).not.toHaveBeenCalled();});
 it('starts next-step preparation only after actual playback starts, and ignores stale end events',()=>{
   let audio:any;class FakeAudio {playbackRate=1;defaultPlaybackRate=1;currentTime=0;src='';onplay?:()=>void;onended?:()=>void;pause=vi.fn();play=vi.fn(async()=>{});constructor(){audio=this;}}
   vi.stubGlobal('Audio',FakeAudio);const start=vi.fn(),end=vi.fn();
   try{(service as any).playAudioBlob('blob:timing-test',end,start);expect(start).not.toHaveBeenCalled();audio.onplay();audio.onplay();expect(start).toHaveBeenCalledTimes(1);expect(end).not.toHaveBeenCalled();service.stopSpeaking();audio.onended();expect(end).not.toHaveBeenCalled();}finally{vi.unstubAllGlobals();}
 });

 it('reuses saved audio after memory is cleared and the API key is unavailable',async()=>{
   mock.hasKey=true;mock.transport.mockResolvedValue(new Blob(['x'.repeat(100)],{type:'audio/wav'}));
   await service.prepareNarration('Kalıcı ders kaydı.','en-US');expect(mock.savedAudio.size).toBe(1);
   (service as any).narrationCache.clear();
   const play=vi.spyOn(service as any,'playAudioBlob').mockImplementation(()=>{});vi.stubGlobal('Audio',class {});
   try{await service.speakManually('Kalıcı ders kaydı.','en-US');expect(play).toHaveBeenCalledTimes(1);expect(mock.transport).toHaveBeenCalledTimes(1);}finally{vi.unstubAllGlobals();}
 });
 it('keeps persistent audio when only playback speed changes',async()=>{
   mock.hasKey=true;mock.transport.mockResolvedValue(new Blob(['x'.repeat(100)],{type:'audio/wav'}));
   await service.prepareNarration('Hız değişebilir.','en-US');(service as any).narrationCache.clear();service.setSpeechRate(1.5,false);await service.prepareNarration('Hız değişebilir.','en-US');expect(mock.transport).toHaveBeenCalledTimes(1);expect(mock.savedAudio.size).toBe(1);
 });
 it('stores only a hash identity and separates different languages',async()=>{
   mock.hasKey=true;mock.media.mockResolvedValue({blob:new Blob(['wave'],{type:'audio/wav'})});
   mock.transport.mockResolvedValue(new Blob(['x'.repeat(100)],{type:'audio/wav'}));await (service as any).geminiNarrationBlob('Example.','Charon','gemini-3.8-flash-tts','tr-TR');await service.prepareNarration('Example.','en-US');
   expect(mock.savedAudio.size).toBe(2);for(const id of mock.savedAudio.keys())expect(id).toMatch(/^narration:v1:[a-f0-9]{64}$/);
 });

 it('repairs an invalid persisted audio artifact',async()=>{
   const parts=['test-repair'];const id=await narrationStorageId(parts);mock.savedAudio.set(id,new Blob(['not audio'],{type:'text/html'}));
   const generate=vi.fn(async()=>new Blob(['wav'],{type:'audio/wav'}));const result=await storedNarrationBlob(parts,generate);expect(result.type).toBe('audio/wav');expect(generate).toHaveBeenCalledTimes(1);expect(mock.savedAudio.get(id)?.type).toBe('audio/wav');
 });
 it('keeps playable audio when the persistent disk quota is exhausted',async()=>{
   vi.spyOn(audioStorage,'saveMediaBlob').mockRejectedValueOnce(new Error('quota'));
   const result=await storedNarrationBlob(['quota-test'],async()=>new Blob(['wav'],{type:'audio/wav'}));expect(result.size).toBe(3);expect(mock.savedAudio.size).toBe(0);
 });
 it('uses a shared browser lock so two windows generate the same audio only once',async()=>{
   let tail=Promise.resolve();const request=vi.fn((_id:string,run:()=>Promise<Blob>)=>{const next=tail.then(run);tail=next.then(()=>undefined,()=>undefined);return next;});
   vi.stubGlobal('navigator',{locks:{request}});const generate=vi.fn(async()=>new Blob(['wav'],{type:'audio/wav'}));
   try{await Promise.all([storedNarrationBlob(['shared-window'],generate),storedNarrationBlob(['shared-window'],generate)]);expect(generate).toHaveBeenCalledTimes(1);expect(request).toHaveBeenCalledTimes(2);}finally{vi.unstubAllGlobals();}
 });

});

describe('EMA local-first speech',()=>{
 it('uses local speech without an API key and caches the actual audio',async()=>{
   mock.settings.voice_provider='ema_local';mock.transport.mockResolvedValue(new Blob(['x'.repeat(100)],{type:'audio/wav'}));const play=vi.spyOn(service as any,'playAudioBlob').mockImplementation(()=>{});
   await service.speakManually('Google ile öğreniyorum.');await service.speakManually('Google ile öğreniyorum.');
   expect(mock.transport).toHaveBeenCalledTimes(1);expect(mock.transport).toHaveBeenCalledWith({route:'ema_speech',payload:{text:'gugıl ile öğreniyorum.',lang:'tr-TR'}});expect(mock.media).not.toHaveBeenCalled();expect(play).toHaveBeenCalledTimes(2);
 });
 it('never sends Turkish to cloud even when legacy fallback was enabled',async()=>{
   mock.hasKey=true;mock.settings.ema_api_fallback=true;mock.transport.mockRejectedValue(new Error('local down'));const error=vi.fn();service.setOptions({onError:error});await service.speakManually('Merhaba');expect(mock.media).not.toHaveBeenCalled();expect(error).toHaveBeenCalled();
 });
 it('uses English locally without cloud keys and caches audio by voice',async()=>{
   mock.hasKey=false;mock.transport.mockResolvedValue(new Blob(['x'.repeat(100)],{type:'audio/wav'}));const play=vi.spyOn(service as any,'playAudioBlob').mockImplementation(()=>{});
   await service.speakManually('Hello.','en-US');await service.speakManually('Hello.','en-US');expect(mock.transport).toHaveBeenCalledTimes(1);expect(mock.transport).toHaveBeenCalledWith({route:'kitten_speech',payload:{text:'Hello.',lang:'en-US',voice:'Jasper'}});expect(mock.media).not.toHaveBeenCalled();expect(play).toHaveBeenCalledTimes(2);
   mock.settings.local_english_voice='Bella';await service.speakManually('Next sentence.','en-US');expect(mock.transport.mock.calls[1][0].payload.text).toContain('I am Bella');await service.speakManually('Another sentence.','en-US');expect(mock.transport.mock.calls[2][0].payload.text).not.toContain('I am Bella');
 });
 it('discards cancelled English audio without cloud fallback',async()=>{
   let resolve!:(b:Blob)=>void;mock.transport.mockImplementation(()=>new Promise(r=>{resolve=r;}));const done=vi.fn();const play=vi.spyOn(service as any,'playAudioBlob').mockImplementation(()=>{});const request=service.speakManually('Wait.','en-US',done);await vi.waitFor(()=>expect(mock.transport).toHaveBeenCalledTimes(1));service.stopSpeaking();resolve(new Blob(['x'.repeat(100)],{type:'audio/wav'}));await request;expect(play).not.toHaveBeenCalled();expect(done).not.toHaveBeenCalled();expect(mock.media).not.toHaveBeenCalled();
 });
 it('reports missing local English runtime without sending text to cloud',async()=>{
   mock.hasKey=true;mock.transport.mockRejectedValue(new Error('missing runtime'));const error=vi.fn(),done=vi.fn();service.setOptions({onError:error});await service.speakManually('Hello.','en-US',done);expect(error).toHaveBeenCalledTimes(1);expect(done).toHaveBeenCalledTimes(1);expect(mock.media).not.toHaveBeenCalled();
 });
 it('never plays or calls an API after a pending local request is stopped',async()=>{
   mock.settings.voice_provider='ema_local';mock.hasKey=true;let resolve!:(value:Blob)=>void;mock.transport.mockImplementation(()=>new Promise(r=>{resolve=r;}));const play=vi.spyOn(service as any,'playAudioBlob').mockImplementation(()=>{});const remote=vi.spyOn(service,'speakGeminiAudio').mockResolvedValue(true);
   const pending=service.speakManually('Durdurulan EMA isteği');await vi.waitFor(()=>expect(mock.transport).toHaveBeenCalled());service.stopSpeaking();resolve(new Blob(['x'.repeat(100)],{type:'audio/wav'}));await pending;expect(play).not.toHaveBeenCalled();expect(remote).not.toHaveBeenCalled();
 });
});
