import {describe,it,expect,vi,beforeEach} from 'vitest';
const state=vi.hoisted(()=>({settings:new Map<string,unknown>(),blob:null as Blob|null}));
vi.mock('../services/apiClient',()=>({isNativeApp:()=>false,nativeInvoke:vi.fn(),readSetting:(k:string,d:unknown)=>state.settings.get(k)??d,writeSetting:(k:string,v:unknown)=>state.settings.set(k,v)}));
vi.mock('../services/mediaStorage',()=>({loadMediaBlob:async()=>state.blob,saveMediaBlob:vi.fn()}));
import {wantsDetailedExplanation,detailedLesson,detailedLessonUrl,importDetailedLesson} from '../services/detailedLessons';
describe('prepared detailed lessons',()=>{
 beforeEach(()=>{state.settings.clear();state.blob=null;});
 it('recognizes natural Turkish requests',()=>{for(const text of ['Daha detaylı anlat','ayrıntılı açıkla','detayli anlat'])expect(wantsDetailedExplanation(text)).toBe(true);expect(wantsDetailedExplanation('Anlamadım')).toBe(false);});
 it('never constructs paths for unknown topics',async()=>{expect(detailedLesson('../secret')).toBeNull();expect(await detailedLessonUrl('topic_missing')).toBeNull();});
 it('rejects unknown topics and disguised video files before saving',async()=>{await expect(importDetailedLesson('../secret',new File(['x'],'a.mp4'))).rejects.toThrow('Geçersiz');await expect(importDetailedLesson('topic_math_equations',new File(['not a real mp4 file'],'a.mp4'))).rejects.toThrow('doğrulanamadı');});
 it('uses a reviewed local video override',async()=>{state.settings.set('detailed_lesson_assets',{topic_math_equations:{id:'existing'}});state.blob=new Blob(['video'],{type:'video/mp4'});const url=await detailedLessonUrl('topic_math_equations');expect(url).toMatch(/^blob:/);URL.revokeObjectURL(url!);});
});
