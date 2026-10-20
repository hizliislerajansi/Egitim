import {useState} from 'react';
import {FocusLearningEngine as Engine} from '../services/focusLearningEngine';
import type {ScreenId} from './Sidebar';
interface Props {onNavigate:(screen:ScreenId)=>void;}
export function CalmHome({onNavigate}:Props){
  const [pick,setPick]=useState(false);const [message,setMessage]=useState('');
  const current=Engine.current();
  const start=(subjectId?:string)=>{try{if(!subjectId&&current&&current.stage!=='ended'){onNavigate('focus_study');return;}const suggestion=Engine.suggested();Engine.start(subjectId||suggestion.subjectId,subjectId?undefined:suggestion.topicId);onNavigate('focus_study');}catch(error){setMessage(error instanceof Error?error.message:'Çalışma başlatılamadı.');}};
  return <section className="calm-home"><p className="calm-caption">DersPusulası · Küçük adımlarla öğren</p><h1>Bugün küçük bir şeyle başlayalım mı?</h1><p>{Engine.greeting()}</p>
    <div className="calm-home-options"><button className="btn btn-primary calm-start" onClick={()=>start()}>{current&&current.stage!=='ended'?'Kaldığın yerden devam et':'Tek bir küçük görevle başla'}</button>
    <button className="btn btn-secondary" onClick={()=>setPick(!pick)} aria-expanded={pick}>Bugün tek bir küçük hedef seç</button>
    {pick&&<div className="calm-card"><p>Birini seçmen yeterli. Ardından etkinlik başlayacak.</p><div className="calm-actions"><button className="btn btn-secondary" onClick={()=>start('subj_eng')}>Kısa İngilizce alıştırması</button><button className="btn btn-secondary" onClick={()=>start('subj_math')}>Bir matematik sorusu</button></div></div>}
    <button className="btn btn-secondary" onClick={()=>onNavigate('calm_subjects')}>Dersler</button><button className="btn btn-secondary" onClick={()=>onNavigate('progress_report')}>İlerlemem</button></div>{message&&<p role="status">{message}</p>}
  </section>;
}
export function CalmSubjects({onNavigate}:Props){
  const [subjectId,setSubjectId]=useState('');const [message,setMessage]=useState('');const subjects=Engine.subjects();const selected=subjects.find(s=>s.id===subjectId);
  const start=(topicId:string)=>{try{Engine.start(subjectId,topicId);onNavigate('focus_study');}catch(error){setMessage(error instanceof Error?error.message:'Başlatılamadı.');}};
  return <section className="calm-subjects"><h1>{selected?selected.name:'Hangi dersten başlayalım?'}</h1>
    {!selected?<><div className="calm-subject-grid">{subjects.filter(s=>['MATH','ENG'].includes(s.code)).map(s=><button key={s.id} className="calm-card" onClick={()=>setSubjectId(s.id)}><h2>{s.name}</h2><p>Tek bir konu, kısa bir başlangıç.</p></button>)}</div><details className="calm-card"><summary>Diğer dersler</summary>{subjects.filter(s=>!['MATH','ENG'].includes(s.code)).map(s=><button className="btn btn-secondary" key={s.id} onClick={()=>setSubjectId(s.id)}>{s.name}</button>)}</details></>:<>
      <button className="btn btn-secondary" onClick={()=>setSubjectId('')}>Ders seçimine dön</button>
      <p className="calm-caption">Yerel konu arşivi. Güncel programla tüm konu eşleştirmeleri henüz doğrulanmadı. <a href="https://tymm.meb.gov.tr/ogretim-programlari" target="_blank" rel="noopener noreferrer">Resmî program</a></p>
      {selected.code==='ENG'&&<details className="calm-card"><summary>Kelime, dil bilgisi ve dil becerileri</summary><p>Kelime, okuma, dinleme, konuşma ve telaffuz çalışmalarına İngilizce Laboratuvarı'ndan ulaşabilirsin. Yazılı cevap her zaman kullanılabilir.</p><button className="btn btn-secondary" onClick={()=>onNavigate('english_lab')}>İngilizce Laboratuvarı'nı aç</button></details>}
      <div className="calm-topic-list">{Engine.topics(subjectId).map(t=><button className="calm-card" key={t.id} onClick={()=>start(t.id)}><span>{t.name}</span><span>Bir küçük görev →</span></button>)}</div>
    </>}{message&&<p role="status">{message}</p>}</section>;
}
