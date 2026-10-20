import {beforeAll,describe,it,expect} from 'vitest';
import {AppDatabase,getDb} from '../db/database';
import {seedInitialData} from '../db/seed';
import {FocusLearningEngine as E} from '../services/focusLearningEngine';
import {OfflineQuestionEngine as Q} from '../services/offlineQuestionEngine';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>storage.get(k)||null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)},configurable:true});
beforeAll(async()=>{await AppDatabase.getInstance().initialize();await seedInitialData();});
describe('Resumable calm learning',()=>{
 it('preserves answer, hint and question through a break',()=>{const s=E.start('subj_math');E.change({stage:'try',answer:'my draft',hintLevel:1});E.pause();expect(E.current()?.questionId).toBe(s.questionId);expect(E.resume()).toMatchObject({stage:'try',answer:'my draft',hintLevel:1});});
 it('does not end an existing session on invalid topic selection',()=>{const s=E.current()!;expect(()=>E.start('subj_eng','missing-topic')).toThrow();expect(E.current()?.id).toBe(s.id);expect(E.current()?.stage).toBe('try');});
 it('records a checked answer exactly once, including assistance',()=>{const s=E.current()!;const q=Q.getQuestionById(s.questionId)!;const count=()=>getDb().queryOne<{n:number}>('SELECT COUNT(*) n FROM answer_attempts')!.n;const n=count();E.submit(q.correct_answer);E.submit(q.correct_answer);expect(count()).toBe(n+1);expect(E.current()?.result).toMatchObject({correct:true,assisted:true});});
 it('does not count break time as study or a question attempt',()=>{E.pause();const s=E.current()!;E.addActiveSeconds(10);expect(E.current()?.activeSeconds).toBe(s.activeSeconds);expect(E.current()?.checkedCount).toBe(s.checkedCount);E.resume();});
 it('keeps English and math topics separate',()=>{const s=E.start('subj_eng');expect(E.topics('subj_math').some(t=>t.id===s.topicId)).toBe(false);expect(s.subjectId).toBe('subj_eng');});
 it('ending without an answer does not invent success',()=>{E.finish();expect(E.current()).toMatchObject({stage:'ended',checkedCount:0,correctCount:0});});
 it('starts quiet, allows a one minute goal, and validates duration',()=>{expect(E.preferences()).toMatchObject({autoAudio:false,gentleReturn:false,reducedMotion:true});E.setPreferences({minutes:1});expect(E.start('subj_math').minutes).toBe(1);expect(()=>E.setPreferences({minutes:0})).toThrow();});
 it('rolls back the complete transaction on an error',()=>{expect(()=>getDb().transaction(()=>{getDb().execute("INSERT INTO app_settings (key,value,updated_at) VALUES ('focus_rollback_probe','1','test')");throw new Error('stop');})).toThrow();expect(getDb().queryOne("SELECT value FROM app_settings WHERE key='focus_rollback_probe'")).toBeFalsy();});
});
