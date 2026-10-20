import {unitQuestions} from '../services/unitQuestionBank';
import {beforeAll,expect,it,vi} from 'vitest';
import {AppDatabase} from '../db/database';
import {UnitExams} from '../services/unitExam';
import {applySlowerNarrationDefault,nextNarrationStep,aiGenerationAvailable} from '../services/lessonExperience';
import {readSetting,writeSetting} from '../services/apiClient';
import {localLinearExplanation} from '../services/localTeacherMath';
import {seedInitialData} from '../db/seed';
import {MEB_TOPICS} from '../data/mebCurriculum';
import {OfflineQuestionEngine} from '../services/offlineQuestionEngine';
import {validateExamQuestions} from '../services/unitExam';
beforeAll(async()=>{await AppDatabase.getInstance().initialize();});
it('hides generation when offline, disabled, or the local model is missing',async()=>{
 writeSetting('ai_provider','ollama');writeSetting('ai_profile_ollama',{enabled:true,model:'qwen2.5:1.5b'});
 writeSetting('offline_mode',true);expect(await aiGenerationAvailable()).toBe(false);
 writeSetting('offline_mode',false);writeSetting('ai_profile_ollama',{enabled:false,model:'qwen2.5:1.5b'});expect(await aiGenerationAvailable()).toBe(false);
 writeSetting('ai_profile_ollama',{enabled:true,model:'qwen2.5:1.5b'});
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({models:[]})}));expect(await aiGenerationAvailable()).toBe(false);
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({models:[{name:'qwen2.5:1.5b'}]})}));expect(await aiGenerationAvailable()).toBe(true);vi.unstubAllGlobals();
});
it('provides valid checkpoint questions for every stored MEB unit',async()=>{
 await seedInitialData();
 for(const unit of new Set(MEB_TOPICS.map(t=>t.subject_id+':'+t.unit))){
  const items=unitQuestions(MEB_TOPICS.filter(t=>t.subject_id+':'+t.unit===unit));
  expect(items.length,unit).toBeGreaterThan(0);
  expect(()=>validateExamQuestions(items)).not.toThrow();
 }
});
it('explains a supported linear equation using checked arithmetic and rejects other forms',()=>{
 expect(localLinearExplanation('2x+4=10 denkleminde x kaçtır?')).toContain('x = 6 / 2 = 3');
 expect(localLinearExplanation('0x+4=10')).toBeNull();
 expect(localLinearExplanation('x^2+2x+4=10')).toBeNull();
 expect(localLinearExplanation('2x+4=10/2')).toBeNull();
});
it('slows existing speech once and terminates after the fourth narration step',()=>{
 writeSetting('speech_rate',1);writeSetting('narration_slow20_v1',false);
 applySlowerNarrationDefault();applySlowerNarrationDefault();expect(readSetting('speech_rate',1)).toBe(.8);
 expect([0,1,2,3].map(nextNarrationStep)).toEqual([1,2,3,null]);
});
it('persists unit answers, isolates profiles, and requires complete answers before grading',()=>{
 const questions=[{id:'a',prompt:'2+2?',options:['3','4'],answer:'4',explanation:'2+2=4'},{id:'b',prompt:'x+1=3?',options:[],answer:'2',explanation:'Subtract 1',math:true}];
 const exam=UnitExams.start('exam-a','unit-one',questions);
 expect(UnitExams.start('exam-a','unit-one',questions).id).toBe(exam.id);
 expect(()=>UnitExams.answer('exam-b',exam.id,'a','4')).toThrow();
 expect(()=>UnitExams.finish('exam-a',exam.id)).toThrow();
 UnitExams.answer('exam-a',exam.id,'a','4');UnitExams.answer('exam-a',exam.id,'b','2.0');
 const finished=UnitExams.finish('exam-a',exam.id);expect(JSON.parse(finished.result_json!).score).toBe(100);
 expect(UnitExams.finish('exam-a',exam.id).result_json).toBe(finished.result_json);
 expect(()=>UnitExams.answer('exam-a',exam.id,'a','3')).toThrow();
 expect(UnitExams.passed('exam-a','unit-one')).toBe(true);expect(UnitExams.passed('exam-b','unit-one')).toBe(false);
 expect(UnitExams.start('exam-a','unit-one',questions).id).not.toBe(exam.id);
});
