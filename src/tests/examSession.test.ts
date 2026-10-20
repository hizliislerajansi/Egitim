import {beforeAll,describe,it,expect} from 'vitest';
import {AppDatabase,getDb} from '../db/database';
import {seedInitialData} from '../db/seed';
import {ExamSessionStore as E} from '../services/examSession';
import {OfflineQuestionEngine as Q} from '../services/offlineQuestionEngine';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>storage.get(k)||null,setItem:(k:string,v:string)=>storage.set(k,v)},configurable:true});
beforeAll(async()=>{await AppDatabase.getInstance().initialize();await seedInitialData();});
describe('Persistent exam integrity',()=>{
 it('retains answers, flags and cursor when reloaded from settings',()=>{const s=E.start('subj_math','',2,0,0);E.save({...s,answers:{[s.questionIds[0]]:'4'},flags:[s.questionIds[0]],index:1});expect(E.current()).toMatchObject({answers:{[s.questionIds[0]]:'4'},flags:[s.questionIds[0]],index:1});});
 it('records final answers only once even if finish is called twice',()=>{const s=E.current()!;const first=Q.getQuestionById(s.questionIds[0])!;E.save({...s,answers:{[first.id]:first.correct_answer}});const count=()=>getDb().queryOne<{n:number}>('SELECT COUNT(*) n FROM answer_attempts')!.n;const n=count();const finished=E.finish();E.finish();expect(count()).toBe(n+s.questionIds.length);expect(finished.results?.[0].correct).toBe(true);expect(finished.results?.[1].correct).toBe(false);});
 it('rejects invalid or empty selection without replacing existing exam',()=>{const id=E.current()!.id;expect(()=>E.start('missing','',1,0,0)).toThrow();expect(()=>E.start('subj_math','',51,0,0)).toThrow();expect(E.current()!.id).toBe(id);});
 it('rolls all grading back when a question is missing',()=>{const s=E.start('subj_math','',1,0,0);E.save({...s,questionIds:[s.questionIds[0],'missing-question']});const n=getDb().queryOne<{n:number}>('SELECT COUNT(*) n FROM answer_attempts')!.n;expect(()=>E.finish()).toThrow();expect(getDb().queryOne<{n:number}>('SELECT COUNT(*) n FROM answer_attempts')!.n).toBe(n);expect(E.current()?.results).toBeUndefined();});
});
