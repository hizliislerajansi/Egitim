import { readSetting, writeSetting, getProviderProfile, hasProviderKey, AI_PROVIDERS, isNativeApp, nativeInvoke, type ManagedProvider } from './apiClient';
export function applySlowerNarrationDefault(){
 if(readSetting('narration_slow20_v1',false))return;
 const previous=readSetting('speech_rate',1);
 writeSetting('speech_before_slow20',previous);
 writeSetting('speech_rate',Math.max(0.5,Math.round(previous*80)/100));
 writeSetting('narration_slow20_v1',true);
}
export function nextNarrationStep(step:number):number|null{return step>=3?null:step+1;}
export async function aiGenerationAvailable():Promise<boolean>{
 if(readSetting('offline_mode',false))return false;
 const provider=readSetting<string>('ai_provider','gemini');
 if(!AI_PROVIDERS.includes(provider as ManagedProvider))return false;
 if(!getProviderProfile(provider as ManagedProvider).enabled)return false;
 if(provider==='ollama'){
  try{const response=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(1500)});const data=await response.json();const model=getProviderProfile('ollama').model;return response.ok&&Array.isArray(data.models)&&data.models.some((m:{name:string})=>m.name===model);}catch{return false;}
 }
 return getProviderProfile(provider as ManagedProvider).enabled&&await hasProviderKey(provider as ManagedProvider);
}
export async function connectLocalTeacher(){
 if(readSetting('offline_mode',false))return;
 if(isNativeApp()){try{await nativeInvoke('local_ai_start',{});}catch{/* Optional companion is not installed. */}}
 if(await aiGenerationAvailable())return;
 if(readSetting('ai_before_local_teacher',null))return;
 try{const response=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(1500)});const data=await response.json();if(!response.ok||!data.models?.some((m:{name:string})=>m.name==='qwen2.5:1.5b'))return;
  if(!readSetting('ai_before_local_teacher',null))writeSetting('ai_before_local_teacher',{provider:readSetting('ai_provider','gemini'),profile:getProviderProfile('ollama')});
  writeSetting('ai_profile_ollama',{enabled:true,model:'qwen2.5:1.5b'});writeSetting('ai_provider','ollama');
 }catch{/* Existing configuration is retained when the local runtime is unavailable. */}
}
