import {getDb} from '../db/database';
import {OfflineQuestionEngine} from './offlineQuestionEngine';
import {readSetting,writeSetting} from './apiClient';
import type {Question,Subject,Topic} from '../types/database';

export interface FocusPreferences {minutes:number;gentleReturn:boolean;reducedMotion:boolean;autoAudio:boolean;gamification:boolean;}
export interface FocusSession {
  version:1;id:string;subjectId:string;topicId:string;questionId:string;stage:'understand'|'try'|'feedback'|'break'|'ended';
  previousStage?:'understand'|'try'|'feedback';answer:string;hintLevel:number;solutionSeen:boolean;result?:{correct:boolean;attemptId:string;assisted:boolean};
  questionIds:string[];checkedCount:number;correctCount:number;activeSeconds:number;minutes:number;returnMessageShown:boolean;updatedAt:string;
}
const key='focus_session_v1';
export class FocusLearningEngine {
  static preferences():FocusPreferences{return {...{minutes:3,gentleReturn:false,reducedMotion:true,autoAudio:false,gamification:false},...readSetting<Partial<FocusPreferences>>('focus_preferences',{})};}
  static setPreferences(partial:Partial<FocusPreferences>):FocusPreferences{
    const next={...this.preferences(),...partial};
    if(!Number.isFinite(next.minutes)||next.minutes<1||next.minutes>60)throw new Error('1–60 dakika arasında bir süre seçin.');
    writeSetting('focus_preferences',next);writeSetting('reduced_motion',next.reducedMotion);writeSetting('audio_feedback_enabled',next.autoAudio);return next;
  }
  static subjects():Subject[]{return getDb().query<Subject>('SELECT * FROM subjects ORDER BY CASE WHEN code = \'MATH\' THEN 0 WHEN code = \'ENG\' THEN 1 ELSE 2 END, sort_order');}
  static topics(subjectId:string):Topic[]{return getDb().query<Topic>('SELECT * FROM topics WHERE subject_id = ? ORDER BY order_index',[subjectId]);}
  static current():FocusSession|null{
    const state=readSetting<FocusSession|null>(key,null);
    if(!state||state.version!==1||!OfflineQuestionEngine.getQuestionById(state.questionId))return null;
    return state;
  }
  static save(state:FocusSession):FocusSession{const next={...state,updatedAt:new Date().toISOString()};writeSetting(key,next);return next;}
  static suggested():{subjectId:string;topicId?:string}{
    const current=this.current();if(current&&current.stage!=='ended')return {subjectId:current.subjectId,topicId:current.topicId};
    const topic=getDb().queryOne<{subject_id:string;topic_id:string}>(`SELECT t.subject_id, t.id topic_id FROM topics t JOIN questions q ON q.topic_id=t.id LEFT JOIN topic_mastery m ON m.topic_id=t.id WHERE t.subject_id IN ('subj_math','subj_eng') GROUP BY t.id ORDER BY COALESCE(m.mastery_score,0),t.order_index LIMIT 1`);
    return {subjectId:topic?.subject_id||'subj_math',topicId:topic?.topic_id};
  }
  static start(subjectId:string,topicId?:string,minutes=this.preferences().minutes):FocusSession{
    const active=this.current();
    const question=getDb().queryOne<Question>(`SELECT q.* FROM questions q JOIN topics t ON t.id=q.topic_id WHERE t.subject_id=? ${topicId?'AND t.id=?':''} ORDER BY q.difficulty,t.order_index LIMIT 1`,topicId?[subjectId,topicId]:[subjectId]);
    if(!question)throw new Error('Bu konu için yerel soru henüz yok. Başka bir konu seçebilirsin.');
    if(minutes<1||minutes>60||!Number.isFinite(minutes))throw new Error('Geçersiz süre.');
    return getDb().transaction(()=>{
      if(active&&active.stage!=='ended')this.finish();
      const id=OfflineQuestionEngine.startSession(subjectId,'offline_practice');
      return this.save({version:1,id,subjectId,topicId:question.topic_id,questionId:question.id,stage:'understand',answer:'',hintLevel:0,solutionSeen:false,questionIds:[],checkedCount:0,correctCount:0,activeSeconds:0,minutes,returnMessageShown:false,updatedAt:new Date().toISOString()});
    });
  }
  static change(patch:Partial<Pick<FocusSession,'answer'|'hintLevel'|'solutionSeen'|'stage'|'returnMessageShown'|'minutes'>>):FocusSession{
    const state=this.current();if(!state)throw new Error('Oturum yok.');return this.save({...state,...patch});
  }
  static submit(answer:string):FocusSession{
    const state=this.current();if(!state)throw new Error('Oturum yok.');
    if(state.result)return state; // Double click / refresh cannot award another attempt.
    if(state.stage!=='try'||!answer.trim())throw new Error('Önce küçük görevi dene.');
    return getDb().transaction(()=>{
      const result=OfflineQuestionEngine.submitAnswer({sessionId:state.id,questionId:state.questionId,studentAnswer:answer.trim(),hintsUsed:state.solutionSeen?3:state.hintLevel,timeSpentSeconds:0,errorCategory:'Diğer'});
      return this.save({...state,answer,stage:'feedback',result:{correct:result.isCorrect,attemptId:result.attemptId,assisted:state.solutionSeen||state.hintLevel>0},checkedCount:state.checkedCount+1,correctCount:state.correctCount+(result.isCorrect?1:0),questionIds:[...state.questionIds,state.questionId]});
    });
  }
  static next(easier=false):FocusSession{
    const state=this.current();if(!state)throw new Error('Oturum yok.');
    const current=OfflineQuestionEngine.getQuestionById(state.questionId)!;
    const candidates=OfflineQuestionEngine.getQuestionsByTopic(state.topicId).filter(q=>!state.questionIds.includes(q.id)&&q.id!==state.questionId);
    const chosen=(easier?candidates.sort((a,b)=>a.difficulty-b.difficulty):candidates.sort((a,b)=>Math.abs(a.difficulty-current.difficulty)-Math.abs(b.difficulty-current.difficulty)))[0];
    if(!chosen)throw new Error('Bu konuda başka kısa soru yok. İstersen çözümü inceleyebilir veya farklı bir konu seçebilirsin.');
    return this.save({...state,questionId:chosen.id,stage:'understand',answer:'',hintLevel:0,solutionSeen:false,result:undefined});
  }
  static pause():FocusSession{const s=this.current();if(!s)throw new Error('Oturum yok.');if(s.stage==='break'||s.stage==='ended')return s;return this.save({...s,previousStage:s.stage,stage:'break'});}
  static resume():FocusSession{const s=this.current();if(!s)throw new Error('Oturum yok.');if(s.stage==='break')return this.save({...s,stage:s.previousStage||'understand'});return s;}
  static addActiveSeconds(seconds:number):FocusSession|null{const s=this.current();if(!s||['break','ended'].includes(s.stage))return s;return this.save({...s,activeSeconds:s.activeSeconds+Math.max(0,Math.min(15,Math.floor(seconds)))});}
  static finish():FocusSession|null{const s=this.current();if(!s)return null;return getDb().transaction(()=>{OfflineQuestionEngine.endSession(s.id,s.activeSeconds);return this.save({...s,stage:'ended'});});}
  static greeting():string{
    const s=this.current();if(s&&s.stage!=='ended')return 'Kaldığın soru burada duruyor. İstersen oradan devam edebiliriz.';
    const n=getDb().queryOne<{n:number}>('SELECT COUNT(*) n FROM answer_attempts')?.n||0;
    const messages=n?['Bugün bir kısa tekrar yeterli olabilir.','İstersen tek bir soruyla başlayabiliriz.','Küçük bir örnek üzerinden ilerleyebiliriz.']:['Başlamak için bir kısa soru yeterli.','İngilizce veya matematikten küçük bir adım seçebilirsin.'];
    return messages[n%messages.length];
  }
}
