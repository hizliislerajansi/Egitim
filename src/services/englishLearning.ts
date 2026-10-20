import { getDb } from '../db/database';
import { COURSE_WORDS, ENGLISH_LEVELS, PLACEMENT_ITEMS, type EnglishLevel } from '../data/englishCourse';
import { ORDERED_ENGLISH_UNITS, englishUnit } from '../data/englishCurriculum';
import { ENGLISH_PANELS, type EnglishPanel } from './englishRoutes';

export const ENGLISH_WORD_BANK = [...COURSE_WORDS];
for(const unit of ORDERED_ENGLISH_UNITS) for(const [word,tr] of Object.entries(unit.glossary)) {
  if(ENGLISH_WORD_BANK.some(w=>w.word===word))continue;
  const example=[unit.reading,unit.listening,...unit.examples].flatMap(text=>text.match(/[^.!?]+[.!?]*/g)??[]).find(s=>new RegExp(`\\b${word}\\b`,'i').test(s))?.trim();
  if(example)ENGLISH_WORD_BANK.push({id:`course-${word}`,word,tr,example,level:unit.level});
}
export interface EnglishLearnerState {
  unitId:string;panel:EnglishPanel;minutes:number;placement:Record<string,string>;placementComplete:boolean;
  writing:Record<string,string>;voice:'device'|'configured';wordMode:'recall'|'context';
}
export interface EnglishAttempt {activity_id:string;answer:string;correct:number;attempts:number}
export interface WritingEntry {id:string;unit_id:string;text:string;feedback:string;feedback_kind:string;created_at:string}
export function sanitizeEnglishState(value:unknown):EnglishLearnerState {
 const v=value && typeof value==='object'?value as Partial<EnglishLearnerState>:{};
 const writing:Record<string,string>={};const placement:Record<string,string>={};
 for(const unit of ORDERED_ENGLISH_UNITS)if(typeof v.writing?.[unit.id]==='string')writing[unit.id]=v.writing[unit.id].slice(0,2000);
 for(const q of PLACEMENT_ITEMS)if(q.options.includes(v.placement?.[q.id]??''))placement[q.id]=v.placement![q.id];
 return {unitId:englishUnit(v.unitId??'').id,panel:v.panel && Object.hasOwn(ENGLISH_PANELS,v.panel)?v.panel:'plan',minutes:[10,20,30].includes(v.minutes??0)?v.minutes!:20,
 placement,placementComplete:v.placementComplete===true && PLACEMENT_ITEMS.every(q=>placement[q.id]),writing,voice:v.voice==='configured'?'configured':'device',wordMode:v.wordMode==='context'?'context':'recall'};
}
export function localWritingFeedback(text:string):string {
 const clean=text.trim();const checks:string[]=[];
 if(!clean)return 'Önce bir İngilizce cümle yaz.';
 if(!/^[A-Z]/.test(clean))checks.push('İlk cümleyi büyük harfle başlat.');
 if(!/[.!?]$/.test(clean))checks.push('Son cümleye uygun noktalama ekle.');
 if(/\bi\b/.test(clean))checks.push('İngilizcede tek başına kullanılan I zamiri büyük yazılır.');
 if(/\b(he|she|it)\s+(go|play|like|live)\b/i.test(clean))checks.push('He/she/it ile geniş zamanda fiili kontrol et: she goes / plays / likes / lives.');
 if(/\b(can|should|must)\s+\w+ing\b/i.test(clean))checks.push('Can/should/must sonrasında yalın fiil kullanılır.');
 return 'Yerel biçim kontrolü: '+(checks.join(' ')||'Bu sınırlı kurallarda belirgin biçim hatası bulunmadı.')+' Bu kontrol anlamı veya tüm dil bilgisi hatalarını değerlendirmez; görevin kapsamı ve örnekle karşılaştır.';
}

export interface WordReview {profile_id:string;word_id:string;streak:number;lapses:number;interval_days:number;due_at:string;reviewed_at:string}
export function placementResult(answers: Record<string,string>): EnglishLevel {
  if (PLACEMENT_ITEMS.some(q => !q.options.includes(answers[q.id]))) throw new Error('Tüm seviye sorularını cevapla.');
  let level: EnglishLevel = 'A1';
  for (const band of ENGLISH_LEVELS) {
    const items = PLACEMENT_ITEMS.filter(q => q.level === band);
    if (items.filter(q => answers[q.id] === q.answer).length < 2) break;
    level = band;
  }
  return level;
}
// Original simple interval schedule; no external SRS implementation or model dependency.
export function nextWordReview(previous: WordReview | null, correct: boolean, now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new Error('Geçersiz tarih.');
  const streak = correct ? (previous?.streak ?? 0) + 1 : 0;
  const interval_days = correct ? Math.min(60, 2 ** Math.min(streak - 1, 6)) : 0;
  return {streak, lapses:(previous?.lapses ?? 0) + (correct ? 0 : 1), interval_days,
    due_at:new Date(now.getTime() + (correct ? interval_days * 86400000 : 600000)).toISOString(), reviewed_at:now.toISOString()};
}
export function normalizeEnglish(value:string) { return value.trim().toLowerCase().replace(/[.!?]+$/g,'').replace(/\s+/g,' '); }
export const EnglishLearning = {
  state(profile:string):EnglishLearnerState {
    const legacy=this.evidence(profile).filter(e=>/^(A1|A2|B1|B2):[^:]+:(correct|retry)$/.test(e.activity_id));
    const existing=new Set(this.attempts(profile).map(a=>a.activity_id));
    const imported: {id:string;answer:string;correct:number}[]=[];
    for(const entry of legacy){const [level,itemId,status]=entry.activity_id.split(':');const unit=englishUnit(`${level.toLowerCase()}-foundation`);const item=(entry.skill==='grammar'?unit.grammar:entry.skill==='reading'?unit.questions:[]).find(q=>q.id===itemId);const id=`${unit.id}:${entry.skill}:${itemId}`;if(!item||existing.has(id))continue;existing.add(id);imported.push({id,answer:status==='correct'?item.answer:'',correct:Number(status==='correct')});}
    if(imported.length)getDb().transaction(()=>{for(const e of imported)getDb().run('INSERT OR IGNORE INTO english_exercise_attempts VALUES (?,?,?,?,1,?)',[profile,e.id,e.answer,e.correct,new Date().toISOString()]);});
    const row=getDb().queryOne<{state_json:string}>('SELECT state_json FROM english_learner_state WHERE profile_id=?',[profile]);
    if(row){try{return sanitizeEnglishState(JSON.parse(row.state_json));}catch{throw new Error('İngilizce devam kaydı okunamadı; veri korunuyor.');}}
    const assessment=this.assessment(profile);
    return sanitizeEnglishState({unitId:assessment?`${assessment.level.toLowerCase()}-foundation`:'a1-foundation',panel:assessment?'plan':'placement'});
  },
  saveState(profile:string,state:EnglishLearnerState) {
    getDb().run('INSERT INTO english_learner_state VALUES (?,?,?) ON CONFLICT(profile_id) DO UPDATE SET state_json=excluded.state_json, updated_at=excluded.updated_at',[profile,JSON.stringify(sanitizeEnglishState(state)),new Date().toISOString()]);
    if(getDb().getPersistenceError())throw new Error('Cihaz depolaması kaydı yazamadı; alan açıp Kaydı yeniden dene düğmesine bas.');
  },
  attempts(profile:string) {return getDb().query<EnglishAttempt>('SELECT activity_id,answer,correct,attempts FROM english_exercise_attempts WHERE profile_id=?',[profile]);},
  submitExercise(profile:string,unitId:string,itemId:string,answer:string,skill:'grammar'|'reading'|'listening'|'reading-supported') {
    const unit=ORDERED_ENGLISH_UNITS.find(u=>u.id===unitId);
    const items=skill==='grammar'?unit?.grammar:skill==='reading'?unit?.questions:unit?.listeningQuestions;
    const item=items?.find(q=>q.id===itemId);
    if(!item || !item.options.includes(answer))throw new Error('Geçersiz etkinlik cevabı.');
    const correct=answer===item.answer;const activity=`${unitId}:${skill}:${itemId}`;
    getDb().transaction(()=>{
      getDb().run('INSERT INTO english_exercise_attempts VALUES (?,?,?,?,1,?) ON CONFLICT(profile_id,activity_id) DO UPDATE SET answer=excluded.answer,correct=excluded.correct,attempts=attempts+1,updated_at=excluded.updated_at',[profile,activity,answer,Number(correct),new Date().toISOString()]);
      this.record(profile,`${activity}:${correct?'correct':'retry'}`,skill,Number(correct),1);
    });
    return correct;
  },
  unitProgress(profile:string,unitId:string,previous?:EnglishAttempt[]):{grammar:boolean;reading:boolean;ready:boolean} {
    const unit=englishUnit(unitId);
    const attempts=previous??this.attempts(profile);
    const grammar=unit.grammar.every(q=>attempts.some(a=>a.activity_id===`${unitId}:grammar:${q.id}`&&a.correct===1));
    const reading=unit.questions.every(q=>attempts.some(a=>a.activity_id===`${unitId}:reading:${q.id}`&&a.correct===1));
    return {grammar,reading,ready:grammar&&reading};
  },
  portfolio(profile:string,unitId?:string) {return getDb().query<WritingEntry>('SELECT id,unit_id,text,feedback,feedback_kind,created_at FROM english_writing_portfolio WHERE profile_id=?'+(unitId?' AND unit_id=?':'')+' ORDER BY created_at DESC, rowid DESC LIMIT 50',unitId?[profile,unitId]:[profile]);},
  saveWriting(profile:string,unitId:string,text:string,feedback='',kind='self-review') {
    if(!ORDERED_ENGLISH_UNITS.some(u=>u.id===unitId)||!text.trim()||text.length>2000||feedback.length>12000||!['self-review','local','ai'].includes(kind))throw new Error('Yazma kaydı geçersiz.');
    // Explicitly saving a draft never fabricates a proficiency score.
    const last=this.portfolio(profile,unitId)[0];
    if(last?.text===text.trim() && last.feedback===feedback)return last.id;
    const id=crypto.randomUUID();getDb().run('INSERT INTO english_writing_portfolio VALUES (?,?,?,?,?,?,?)',[id,profile,unitId,text.trim(),feedback,kind,new Date().toISOString()]);return id;
  },
  profile():string {
    const profile = getDb().queryOne<{id:string}>('SELECT id FROM student_profile ORDER BY created_at, id LIMIT 1');
    if (!profile) throw new Error('Öğrenci profili bulunamadı.');
    return profile.id;
  },
  assessment(profile:string) {return getDb().queryOne<{level:EnglishLevel;answers_json:string}>('SELECT level, answers_json FROM english_assessments WHERE profile_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1',[profile]);},
  saveAssessment(profile:string, answers:Record<string,string>) {
    const level = placementResult(answers);
    getDb().run('INSERT INTO english_assessments VALUES (?, ?, ?, ?, ?)',[crypto.randomUUID(),profile,level,JSON.stringify(answers),new Date().toISOString()]);
    return level;
  },
  reviews(profile:string) {return getDb().query<WordReview>('SELECT * FROM english_word_reviews WHERE profile_id = ?',[profile]);},
  review(profile:string, wordId:string, answer:string, now = new Date()) {
    const word = ENGLISH_WORD_BANK.find(w => w.id === wordId);
    if (!word || !answer.trim() || answer.length > 200) throw new Error('Geçerli bir kelime cevabı gir.');
    const previous = this.reviews(profile).find(r => r.word_id === wordId) ?? null;
    if (previous && previous.due_at > now.toISOString()) throw new Error('Bu kelimenin tekrar zamanı henüz gelmedi.');
    const correct = normalizeEnglish(answer) === normalizeEnglish(word.word);
    const next = nextWordReview(previous,correct,now);
    getDb().transaction(() => {
      getDb().run('INSERT INTO english_word_reviews VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id, word_id) DO UPDATE SET streak=excluded.streak, lapses=excluded.lapses, interval_days=excluded.interval_days, due_at=excluded.due_at, reviewed_at=excluded.reviewed_at',
        [profile,wordId,next.streak,next.lapses,next.interval_days,next.due_at,next.reviewed_at]);
      this.record(profile,`word:${wordId}:${now.toISOString()}`,'vocabulary',Number(correct),1);
    });
    return {correct,...next};
  },
  record(profile:string, activity:string, skill:string, correct:number,total:number) {
    if (!Number.isInteger(correct) || !Number.isInteger(total) || correct < 0 || total < 1 || correct > total) throw new Error('Geçersiz sonuç.');
    // One evidence row per activity prevents repeated clicks from inflating completion.
    const id = JSON.stringify([profile,activity]);
    getDb().run('INSERT OR IGNORE INTO english_activity_evidence VALUES (?, ?, ?, ?, ?, ?, ?)',[id,profile,activity,skill,correct,total,new Date().toISOString()]);
  },
  evidence(profile:string) {return getDb().query<{activity_id:string;skill:string;correct:number;total:number;created_at:string}>('SELECT activity_id, skill, correct, total, created_at FROM english_activity_evidence WHERE profile_id = ? ORDER BY created_at DESC, rowid DESC',[profile]);},
};
