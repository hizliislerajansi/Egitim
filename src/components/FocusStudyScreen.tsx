import {studentText} from '../services/studentExperience';
import {useEffect,useRef,useState} from 'react';
import {FocusLearningEngine as Engine,type FocusSession} from '../services/focusLearningEngine';
import {OfflineQuestionEngine} from '../services/offlineQuestionEngine';
import {TOPIC_LECTURES} from '../data/topicLectures';
import {AiAdapter,type SubjectCode} from '../services/aiAdapter';
import {getVoiceService} from '../services/voiceService';

interface Props {onExit:()=>void;onFocusChange:(value:boolean)=>void;}
export function FocusStudyScreen({onExit,onFocusChange}:Props){
  const [state,setState]=useState<FocusSession|null>(()=>Engine.current());
  const [message,setMessage]=useState('');const [aiHint,setAiHint]=useState('');const [busy,setBusy]=useState(false);
  const [focused,setFocused]=useState(true);const [voiceOn,setVoiceOn]=useState(false);const [listening,setListening]=useState(false);const [exampleStep,setExampleStep]=useState(0);
  const [reducedMotion,setReducedMotion]=useState(()=>Engine.preferences().reducedMotion);
  const [support,setSupport]=useState(()=>Engine.preferences().gentleReturn);const [minutes,setMinutes]=useState(()=>Engine.current()?.minutes||Engine.preferences().minutes);
  const lastInteraction=useRef(Date.now());const questionHeading=useRef<HTMLHeadingElement>(null);const alive=useRef(true);
  useEffect(()=>{alive.current=true;onFocusChange(true);return()=>{alive.current=false;onFocusChange(false);getVoiceService().stopListening();getVoiceService().stopSpeaking();};},[]);
  useEffect(()=>{questionHeading.current?.focus();setAiHint('');setExampleStep(0);},[state?.questionId]);
  useEffect(()=>{
    const activity=()=>{lastInteraction.current=Date.now();};const events=['pointerdown','keydown'] as const;events.forEach(name=>window.addEventListener(name,activity,{passive:true}));
    const interval=setInterval(()=>{
      const current=Engine.current();if(!current||current.stage==='ended')return;
      const idle=Date.now()-lastInteraction.current;
      if(document.visibilityState==='visible'&&idle<60000&&current.stage!=='break')Engine.addActiveSeconds(10);
      const next=Engine.current();
      if(next&&support&&idle>=120000&&!next.returnMessageShown&&next.stage!=='break'){Engine.change({returnMessageShown:true});setMessage('Burada kalmıştık. İstersen devam edebilir veya mola verebilirsin.');}
      setState(Engine.current());
    },10000);
    return()=>{clearInterval(interval);events.forEach(name=>window.removeEventListener(name,activity));};
  },[support]);
  function change(action:()=>FocusSession|null){try{setState(action());setMessage('');}catch(error){setMessage(error instanceof Error?error.message:'İşlem tamamlanamadı.');}}
  if(!state)return <section className="calm-card"><h1>Kısa çalışma</h1><p>Önce bir ders veya küçük hedef seçebilirsin.</p><button className="btn btn-primary" onClick={onExit}>Ana ekrana dön</button></section>;
  const question=OfflineQuestionEngine.getQuestionById(state.questionId)!;
  const subject=Engine.subjects().find(s=>s.id===state.subjectId)!;const topic=Engine.topics(state.subjectId).find(t=>t.id===state.topicId);
  const lecture=TOPIC_LECTURES[state.topicId];let choices:string[]=[];try{const parsed=JSON.parse(question.options_json||'[]');if(Array.isArray(parsed))choices=parsed.filter(x=>typeof x==='string');}catch{/* Text input remains usable. */}
  const speak=()=>{if(!voiceOn)return;getVoiceService().speakManually(question.question_text,subject?.code==='ENG'?'en-US':'tr-TR');};
  async function askHint(){setBusy(true);try{
    const response=await AiAdapter.request({taskType:'hint',subjectCode:subject.code as SubjectCode,topicName:topic?.name,userMessage:`Bu soruda yalnız ilk düşünme adımına kısa bir ipucu ver: ${question.question_text}`,maxTokens:160});
    if(alive.current&&Engine.current()?.questionId===state?.questionId&&Engine.current()?.id===state?.id){setAiHint(response.isFallback?`Yerel ipucu: ${question.hint_1||'Önce soruda isteneni ve verilenleri ayır.'}`:`ders rehberi ipucu: ${response.text}`);setState(Engine.change({hintLevel:Math.max(1,state!.hintLevel)}));}
  }catch{if(alive.current)setAiHint(`Bağlantı kurulamadı. Yerel ipucu: ${question.hint_1||'Verilenleri tek tek yazmayı dene.'}`);}finally{if(alive.current)setBusy(false);}}
  return <section className="calm-study" aria-label="Kısa çalışma oturumu">
    <header className="calm-study-toolbar"><span>{subject?.name} · {state.checkedCount} deneme</span><button className="btn btn-secondary" onClick={()=>{setFocused(!focused);onFocusChange(!focused);}}>{focused?'Normal görünüme dön':'Odaklanma modunu aç'}</button><button className="btn btn-secondary" onClick={()=>{getVoiceService().stopSpeaking();getVoiceService().stopListening();onExit();}}>Kaydet ve çık</button></header>
    <h1>{topic?.name||subject?.name}</h1>
    <p className="calm-caption">{minutes} dakikalık küçük hedef. Süreyi tamamlamak zorunda değilsin.</p>
    {state.activeSeconds>=minutes*60&&state.stage!=='ended'&&<p className="calm-inline-note">Seçtiğin süreye ulaştın. Devam etmek, mola vermek veya bitirmek sana bağlı.</p>}
    {state.stage==='break'?<div className="calm-card"><h2>Mola zamanı</h2><p>İstersen ayağa kalk, bir yudum su iç veya gözlerini dinlendir. Soru burada kalıyor.</p><button className="btn btn-primary" onClick={()=>change(()=>Engine.resume())}>Kaldığım soruya dön</button><button className="btn btn-secondary" onClick={()=>change(()=>Engine.finish())}>Bugünlük bitir</button></div>:state.stage==='ended'?<div className="calm-card"><h2>Bugünlük burada durabiliriz</h2><p>{state.checkedCount?`${state.checkedCount} cevap denemesi kaydedildi. İstersen başka zaman bir küçük adımla devam edebilirsin.`:'Henüz cevap vermemiş olman bir başarısızlık değil. İstediğin zaman yeniden başlayabilirsin.'}</p><button className="btn btn-primary" onClick={onExit}>Ana ekrana dön</button></div>:<div className="calm-card">
      <p className="calm-step">{state.stage==='understand'?'1 / 3 · Kısaca anla':state.stage==='try'?'2 / 3 · Bir küçük görev dene':'3 / 3 · Kontrol et ve karar ver'}</p>
      {state.stage==='understand'?<><h2 ref={questionHeading} tabIndex={-1}>Tek bir adımla başlayalım</h2><p>{lecture?.summary.slice(0,420)||question.hint_1||'Önce sorunun ne istediğine bak. Verilenleri ve bilinmeyeni ayırmak bir başlangıç olabilir.'}</p>
        {lecture?.workedExample&&<><button className="btn btn-secondary" onClick={()=>{setExampleStep(n=>Math.min(n+1,lecture.workedExample.solutionSteps.length));Engine.change({hintLevel:1});}}>Örnekten bir adım göster</button>{exampleStep>0&&<p>{lecture.workedExample.solutionSteps[exampleStep-1]}</p>}</>}
        <button className="btn btn-primary" onClick={()=>change(()=>Engine.change({stage:'try'}))}>Küçük görevi dene</button></>:<>
        <h2 ref={questionHeading} tabIndex={-1}>{question.question_text}</h2>
        {state.stage==='try'?<form onSubmit={e=>{e.preventDefault();change(()=>Engine.submit(state.answer));}}>
          {choices.length?<fieldset><legend>Cevabını seç</legend>{choices.map(choice=><label className="calm-choice" key={choice}><input type="radio" name="focus-answer" checked={state.answer===choice} onChange={()=>change(()=>Engine.change({answer:choice}))}/>{choice}</label>)}</fieldset>:<><label htmlFor="focus-answer">Cevabın</label><input id="focus-answer" className="chat-input" autoComplete="off" value={state.answer} onChange={e=>change(()=>Engine.change({answer:e.target.value}))}/></>}
          <button className="btn btn-primary" disabled={!state.answer.trim()}>Cevabımı kontrol et</button>
        </form>:<div role="status"><p>{state.result?.correct?(state.result.assisted?'İpucunu kullanarak sonuca ulaştın.':'Cevabını kendi başına doğruladın.'):'Bu deneme beklenen sonuçla eşleşmedi. Bir ipucu, daha küçük bir örnek veya mola seçebilirsin.'}</p><div className="calm-actions"><button className="btn btn-primary" onClick={()=>change(()=>Engine.next())}>Bir küçük görev daha</button>{!state.result?.correct&&<button className="btn btn-secondary" onClick={()=>change(()=>Engine.next(true))}>Daha kolay bir görev dene</button>}</div></div>}
        <details><summary>İpucu veya açıklamalı çözüm</summary><button className="btn btn-secondary" onClick={()=>change(()=>Engine.change({hintLevel:Math.min(2,state.hintLevel+1)}))}>Kısa ipucu</button>{state.hintLevel>0&&<p>{state.hintLevel===1?question.hint_1:question.hint_2||question.hint_1}</p>}<button className="btn btn-secondary" onClick={()=>change(()=>Engine.change({solutionSeen:true}))}>Açıklamalı çözümü göster</button>{state.solutionSeen&&<p>{question.explanation} Sonuç: {question.correct_answer}</p>}</details>
      </>}
      <div className="calm-actions"><button className="btn btn-secondary" onClick={()=>{getVoiceService().stopSpeaking();getVoiceService().stopListening();change(()=>Engine.pause());}}>Mola ver</button><button className="btn btn-secondary" onClick={()=>change(()=>Engine.finish())}>Bugünlük bitir</button></div>
    </div>}
    {state.stage!=='break'&&state.stage!=='ended'&&<details className="calm-card calm-help"><summary>İsteğe bağlı destek ve ayarlar</summary>
      <label><input type="checkbox" checked={reducedMotion} onChange={e=>{setReducedMotion(e.target.checked);Engine.setPreferences({reducedMotion:e.target.checked});document.documentElement.setAttribute('data-reduced-motion',String(e.target.checked));}}/> Animasyonları kapat</label>
      <label>Oturum önerisi <select value={minutes} onChange={e=>{const value=Number(e.target.value);setMinutes(value);Engine.setPreferences({minutes:value});change(()=>Engine.change({minutes:value}));}}>{[1,3,5,8,10,15].map(m=><option value={m} key={m}>{m} dakika</option>)}</select></label>
      <label><input type="checkbox" checked={support} onChange={e=>{setSupport(e.target.checked);Engine.setPreferences({gentleReturn:e.target.checked});}}/> Nazik geri dönüş hatırlatması (oturumda en fazla bir kez)</label>
      <label><input type="checkbox" checked={voiceOn} onChange={e=>{setVoiceOn(e.target.checked);if(!e.target.checked){getVoiceService().stopListening();getVoiceService().stopSpeaking();setListening(false);}}}/> Bu oturumda sesli destek kullan</label>
      {voiceOn&&<div className="calm-actions"><button className="btn btn-secondary" onClick={speak}>Soruyu dinle</button><button className="btn btn-secondary" onClick={()=>{const service=getVoiceService();if(listening){service.stopListening();setListening(false);return;}service.setOptions({onTranscript:(text,isFinal)=>{if(alive.current&&isFinal){change(()=>Engine.change({answer:text}));setListening(false);}},onError:()=>{if(alive.current){setListening(false);setMessage('Ses tanıma kesin olmayabilir. Cevabını metinden kontrol edebilirsin.');}}});service.startListening(subject.code==='ENG'?'en-US':'tr-TR');setListening(true);}}>{listening?'Mikrofonu kapat':'Bas ve konuş'}</button><span>{listening?'Mikrofon dinliyor.':'Metinle devam edebilirsin.'}</span></div>}
      <button className="btn btn-secondary" disabled={busy} onClick={()=>void askHint()}>{busy?'Hazırlanıyor…':'Rehberden kısa ipucu al'}</button><small>Yanıtlar otomatik hazırlanır; gerektiğinde öğretmeninle doğrula. Bu düğme yalnız soruyu seçili API sağlayıcısına gönderir; hesap kotası kullanılabilir.</small>{aiHint&&<p role="status">{studentText(aiHint)}</p>}
    </details>}
    {message&&<p role="status" className="calm-inline-note">{message}</p>}
  </section>;
}
