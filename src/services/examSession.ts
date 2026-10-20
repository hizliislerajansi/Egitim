import {readSetting,writeSetting} from './apiClient';
import {OfflineQuestionEngine} from './offlineQuestionEngine';
import {getDb} from '../db/database';
export interface ExamSession{version:1;id:string;subjectId:string;questionIds:string[];answers:Record<string,string>;flags:string[];index:number;startedAt:number;deadline:number|null;results?:Array<{id:string;correct:boolean;explanation:string}>;finishedAt?:number;}
export const ExamSessionStore={
 current:()=>readSetting<ExamSession|null>('product_exam_v1',null),
 save:(s:ExamSession)=>{writeSetting('product_exam_v1',s);return s;},
 start(subjectId:string,topicId:string,count:number,difficulty:number,minutes:number):ExamSession{
  if(!Number.isInteger(count)||count<1||count>50||!Number.isFinite(minutes)||minutes<0||minutes>180)throw new Error('Soru sayısı 1–50, süre 0–180 dakika olmalı.');
  const questions=OfflineQuestionEngine.getQuestionsBySubject(subjectId).filter(q=>(!topicId||q.topic_id===topicId)&&(!difficulty||q.difficulty===difficulty)).slice(0,count);
  if(!questions.length)throw new Error('Bu filtreler için kayıtlı soru bulunamadı.');
  return this.save({version:1,id:OfflineQuestionEngine.startSession(subjectId,'offline_practice'),subjectId,questionIds:questions.map(q=>q.id),answers:{},flags:[],index:0,startedAt:Date.now(),deadline:minutes?Date.now()+minutes*60000:null});
 },
 finish():ExamSession{
  const s=this.current();if(!s)throw new Error('Kayıtlı sınav yok.');if(s.results)return s;
  return getDb().transaction(()=>{
   const results=s.questionIds.map(id=>{const q=OfflineQuestionEngine.getQuestionById(id);if(!q)throw new Error('Sınav sorusu bulunamadı.');const result=OfflineQuestionEngine.submitAnswer({sessionId:s.id,questionId:id,studentAnswer:s.answers[id]||'',hintsUsed:0,timeSpentSeconds:0});return {id,correct:result.isCorrect,explanation:result.explanation};});
   const finishedAt=Date.now();OfflineQuestionEngine.endSession(s.id,Math.floor((Math.min(finishedAt,s.deadline||finishedAt)-s.startedAt)/1000));
   return this.save({...s,results,finishedAt});
  });
 }
};
