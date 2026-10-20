import {studentText} from '../services/studentExperience';
import { useEffect, useRef, useState } from 'react';
import type { EnglishUnit } from '../data/englishCurriculum';
import { EnglishLearning } from '../services/englishLearning';
import { AiAdapter } from '../services/aiAdapter';
import { getVoiceService } from '../services/voiceService';

export function EnglishConversation({unit,profile,speak,onRecorded}:{unit:EnglishUnit;profile:string;speak:(text:string)=>void;onRecorded:()=>void}) {
 const [step,setStep]=useState(()=>unit.conversation.findIndex((_,index)=>!EnglishLearning.evidence(profile).some(e=>e.activity_id===`${unit.id}:conversation:${index}`&&e.correct===1)));
 const [text,setText]=useState('');const [message,setMessage]=useState('');const [reply,setReply]=useState('');const [busy,setBusy]=useState(false);const [listening,setListening]=useState(false);
 const version=useRef(0);
 useEffect(()=>()=>{version.current++;getVoiceService().stopListening();},[]);
 const turn=unit.conversation[step];
 const check=()=>{
  if(!turn||!text.trim())return;
  if(!turn.keywords.some(w=>text.toLowerCase().includes(w))){setMessage(`Görevde beklenen anlamı netleştir. Örnek: ${turn.example} Bu sınırlı kalıp kontrolü, serbest dil veya telaffuz puanı değildir.`);return;}
  version.current++;setBusy(false);getVoiceService().stopListening();setListening(false);
  EnglishLearning.record(profile,`${unit.id}:conversation:${step}`,'speaking-task',1,1);onRecorded();
  setMessage('Görevle ilgili ifade bulundu. Dil bilgisi ve telaffuz değerlendirmesi yapılmadı.');setText('');setReply('');setStep(step+1<unit.conversation.length?step+1:-1);
 };
 const ask=async()=>{
  if(!text.trim()||busy||!turn)return;setBusy(true);const current=++version.current;
  try{const response=await AiAdapter.request({role:'subject_teacher',subjectCode:'ENG',taskType:'chat',topicName:unit.title,maxTokens:240,contextSummary:`${unit.level}. Practice situation: ${turn.teacher}. Reply briefly at this level. Explain one error constructively in Turkish. Never claim to measure pronunciation.`,userMessage:text.slice(0,1000)});if(current===version.current)setReply(`${response.isFallback?'Yerel rehber':'Öğretmen'}: ${response.text}`);}
  catch{if(current===version.current)setMessage('Yanıt alınamadı. Yerel görev ve örnekle devam edebilirsin.');}
  finally{if(current===version.current)setBusy(false);}
 };
 return <div><h3>Günlük diyalog · {unit.title}</h3><p>Metin ve ekonomik sıralı sesli pratik: dinle, cevap ver, isteğe bağlı Öğretmen geri bildirimi al. Kesintisiz gerçek zamanlı ses akışı bu modun parçası değildir.</p>
  {!turn?<><p role="status">Üç diyalog görevinin de kayıtlı cevabı var.</p><button className="btn btn-secondary" onClick={()=>{setStep(0);setMessage('');}}>Diyaloğu yeniden çalış</button></>:<><p>Görev {step+1}/{unit.conversation.length}</p><p lang="en">{turn.teacher}</p><button className="btn btn-secondary" onClick={()=>speak(turn.teacher)}>Öğretmeni dinle</button><label>İngilizce cevabın<textarea className="chat-input" maxLength={1000} rows={3} value={text} onChange={e=>{version.current++;setBusy(false);setText(e.target.value);setReply('');}}/></label>
   <button className="btn btn-secondary" onClick={()=>{const voice=getVoiceService();if(listening){voice.stopListening();setListening(false);return;}voice.setOptions({lang:'en-US',onTranscript:(value,final)=>{if(final){setText(value.slice(0,1000));setListening(false);}},onStatusChange:status=>{if(status==='idle')setListening(false);},onError:error=>{setMessage(`${error} Cevabını yazarak sürdürebilirsin.`);setListening(false);}});setListening(true);voice.startListening('en-US');}}>{listening?'Mikrofonu durdur':'Konuşarak cevap gir'}</button><button className="btn btn-primary" disabled={!text.trim()} onClick={check}>Görev cevabını kaydet</button><details><summary>İpucu ve örnek</summary><p lang="en">{turn.example}</p></details><p>Öğretmen geri bildirimi istersen yalnız bu cevap ve görev bağlamı mevcut sağlayıcıya gönderilir.</p><button className="btn btn-secondary" disabled={!text.trim()||busy} onClick={()=>void ask()}>{busy?'Hazırlanıyor…':'Cevabımı değerlendir'}</button></>}
  {message&&<p role="status">{message}</p>}{reply&&<p role="status" style={{whiteSpace:'pre-wrap'}}>{studentText(reply)}</p>}<p>Konuşma tanıması tarayıcı desteği ve izne bağlıdır; ağ servisi kullanabilir. Ham ses saklanmaz. Metin alternatifi her zaman açıktır.</p></div>;
}
