import {getDb} from '../db/database';
import {MaterialLibraryService,type MaterialRecord,type MaterialContentType} from './materialLibraryService';
import {loadMediaBlob} from './mediaStorage';
import {createMedia,refreshMediaJob,type MediaConfig,type MediaJob} from './mediaService';
import type {Topic} from '../types/database';
import {readSetting,writeSetting} from './apiClient';

export type EducationalKind='diagram'|'worksheet'|'summary'|'image'|'speech'|'video'|'animation';
export interface MaterialRequest{topicId:string;grade:string;kind:EducationalKind;method:'local'|'cloud';config?:MediaConfig;instructions:string;ratio:'16:9'|'1:1';revision:number;}
export interface MaterialOutcome{record?:MaterialRecord;blob?:Blob;reused:boolean;job?:MediaJob;}
const inflight=new Map<string,Promise<MaterialOutcome>>();
export function escapeXml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));}
export async function materialIdentity(request:MaterialRequest,topic:Topic):Promise<string>{
 const value=JSON.stringify({version:2,...request,topic:{name:topic.name,outcome:topic.learning_outcome,unit:topic.unit},config:request.config||null});
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return 'edu2_'+Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
}
export function diagramSvg(title:string,points:string[],ratio:'16:9'|'1:1'='16:9',animated=false):string{
 const h=ratio==='1:1'?960:540;const selected=points.slice(0,4);const row=(h-150)/Math.max(1,selected.length);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${h}" viewBox="0 0 960 ${h}" role="img"><title>${escapeXml(title)}</title><rect width="960" height="${h}" rx="24" fill="#f7f8fc"/><text x="40" y="55" fill="#20263a" font-family="Segoe UI,sans-serif" font-size="23">${escapeXml(title.slice(0,65))}</text>${selected.map((p,i)=>`<g>${animated?`<animate attributeName="opacity" values="0.35;1;1" dur="6s" begin="${i*.5}s" repeatCount="indefinite"/>`:''}<rect x="40" y="${85+i*row}" width="880" height="${row-15}" rx="12" fill="${i%2?'#ddf5ea':'#e7edff'}"/><text x="60" y="${115+i*row}" fill="#20263a" font-family="Segoe UI,sans-serif" font-size="18">${escapeXml(p.slice(0,90))}</text></g>`).join('')}<text x="40" y="${h-18}" fill="#626b80" font-family="Segoe UI,sans-serif" font-size="12">DersPusulası · Yerel programatik şema · Eğitim içeriğini kontrol edin</text></svg>`;
}
export async function renderLessonVideo(title:string,scenes:string[],signal?:AbortSignal,onProgress?:(n:number)=>void):Promise<Blob>{
 if(typeof MediaRecorder==='undefined')throw new Error('Bu ortam yerel video kaydını desteklemiyor. Şema veya çalışma sayfasını kullanın.');
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
 if(!canvas.captureStream)throw new Error('Tuval video kaydı bu ortamda desteklenmiyor.');
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Çizim alanı açılamadı.');
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw new Error('WebM kodlayıcısı bulunamadı.');
 const stream=canvas.captureStream(20);const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1000000});
 return new Promise((resolve,reject)=>{
  const chunks:BlobPart[]=[];let frame=0;let timer:ReturnType<typeof setInterval>;const finish=()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop());signal?.removeEventListener('abort',abort);};
  const abort=()=>{if(recorder.state!=='inactive')recorder.stop();finish();reject(new Error('Yerel video üretimi iptal edildi.'));};
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>{finish();reject(new Error('Video kaydı başarısız.'));};recorder.onstop=()=>{finish();if(!signal?.aborted){const blob=new Blob(chunks,{type:'video/webm'});blob.size?resolve(blob):reject(new Error('Boş video üretildi.'));}};
  const draw=()=>{const index=Math.min(3,Math.floor(frame/40));ctx.fillStyle='#f7f8fc';ctx.fillRect(0,0,960,540);ctx.fillStyle='#315efb';ctx.fillRect(40,45,80,6);ctx.fillStyle='#20263a';ctx.font='bold 25px Segoe UI';ctx.fillText(title.slice(0,60),40,110);ctx.font='22px Segoe UI';const text=scenes[index%Math.max(1,scenes.length)]||title;const words=text.split(/\s+/);let line='',y=220;for(const word of words){if(ctx.measureText(line+' '+word).width>850){ctx.fillText(line,40,y);y+=38;line=word;}else line+=(line?' ':'')+word;}ctx.fillText(line,40,y);ctx.fillStyle='#315efb';ctx.fillRect(40,465,880*frame/160,6);ctx.font='15px Segoe UI';ctx.fillText(`Sahne ${index+1}/4 · Yerel sessiz ders videosu`,40,510);frame++;onProgress?.(Math.min(100,Math.round(frame/160*100)));if(frame>=160&&recorder.state==='recording')recorder.stop();};
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){abort();return;}draw();recorder.start(250);timer=setInterval(draw,50);
 });
}
export async function createEducationalMaterial(request:MaterialRequest,options?:{signal?:AbortSignal;onProgress?:(n:number)=>void}):Promise<MaterialOutcome>{
 const topic=getDb().queryOne<Topic>('SELECT * FROM topics WHERE id=?',[request.topicId]);if(!topic)throw new Error('Konu bulunamadı.');
 if(!/^\d{1,2}$/.test(request.grade)||request.instructions.length>2000||!Number.isInteger(request.revision)||request.revision<1)throw new Error('Geçersiz materyal ayarı.');
 const key=await materialIdentity(request,topic);if(inflight.has(key))return inflight.get(key)!;
 const run=async()=>{
  const type:MaterialContentType=request.kind==='image'||request.kind==='diagram'?'visual':request.kind==='speech'?'speech':request.kind==='animation'?'animation':request.kind==='video'?'video':request.kind==='worksheet'?'worksheet':'summary';
  const existing=MaterialLibraryService.findExistingMaterial(topic.id,type,key);
  if(existing){const blob=await loadMediaBlob(existing.id);if(blob?.size){MaterialLibraryService.recordReuse(existing.id);return {record:existing,blob,reused:true};}throw new Error('Materyal kaydı var ancak dosyası bulunamadı. Yeni sürüm seçerek yeniden üretin.');}
  const pending=readSetting<Record<string,MediaJob>>('educational_pending_v1',{});
  if(pending[key])return {reused:true,job:pending[key]};
  const {TOPIC_LECTURES}=await import('../data/topicLectures');const lecture=TOPIC_LECTURES[topic.id];
  const points=lecture?.keyPoints?.length?lecture.keyPoints:[topic.learning_outcome,topic.unit];
  let blob:Blob|undefined,job:MediaJob|undefined;let model='local-lesson-renderer-v2';
  if(request.method==='cloud'){
   if(!request.config)throw new Error('Üretim sağlayıcısı seçilmeli.');
   const prompt=`Özgün eğitim materyali. Sınıf: ${request.grade}. Ünite: ${topic.unit}. Konu: ${topic.name}. Hedef: ${topic.learning_outcome}. ${request.kind==='speech'?lecture?.audioNarration||topic.learning_outcome:'Bilimsel doğruluk, sade ve okunaklı Türkçe. Oran: '+request.ratio+'.'} İstek: ${request.instructions}`.slice(0,8000);
   const result=await createMedia(request.config,prompt);blob=result.blob;model=request.config.model;
   if(result.remoteId){job={id:key,optionId:request.config.optionId,kind:'video',model,prompt,voice:request.config.voice,status:'pending',remoteId:result.remoteId,createdAt:new Date().toISOString()};writeSetting('educational_pending_v1',{...pending,[key]:job});return {reused:false,job};}
  }else if(request.kind==='video')blob=await renderLessonVideo(topic.name,[lecture?.summary||topic.learning_outcome,...points],options?.signal,options?.onProgress);
  else if(request.kind==='diagram'||request.kind==='animation')blob=new Blob([diagramSvg(topic.name,points,request.ratio,request.kind==='animation')],{type:'image/svg+xml'});
  else if(request.kind==='worksheet'||request.kind==='summary'){
   const questions=getDb().query<{question_text:string;explanation:string}>('SELECT question_text,explanation FROM questions WHERE topic_id=? LIMIT 5',[topic.id]);
   const text=[topic.name,topic.unit,`Hedef: ${topic.learning_outcome}`,lecture?.summary||'',...points.map(p=>'• '+p),...(request.kind==='worksheet'?questions.map((q,i)=>`${i+1}. ${q.question_text}\nYanıtın: __________________\n`):[]),'Kontrol notu: Yerel ders arşivinden programatik olarak düzenlendi; eğitim doğruluğu bağımsız olarak doğrulanmadı.'].join('\n\n');blob=new Blob([text],{type:'text/plain;charset=utf-8'});
  }else throw new Error('Bu tür için bulut sağlayıcısı seçin. Yerel ses/video modeli ayrıca kurulum gerektirir.');
  if(options?.signal?.aborted)throw new Error('İşlem iptal edildi.');if(!blob?.size||blob.size>128*1024*1024)throw new Error('Materyal dosyası boş veya sınırı aşıyor.');
  const contentSha=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());const checksum=Array.from(new Uint8Array(contentSha),n=>n.toString(16).padStart(2,'0')).join('');
  const registered=await MaterialLibraryService.registerMaterial({subjectId:topic.subject_id,topicId:topic.id,gradeLevel:request.grade,contentType:type,title:`${topic.name} · ${request.kind} · sürüm ${request.revision}`,contentHash:key,generatorModel:model,dataBlob:blob,verificationStatus:'estimated',licenseInfo:request.method==='local'?'Yerel arşiv metninden özgün programatik düzen; kaynak metnin koşulları geçerlidir.':'Rehber üretimi; seçilen sağlayıcının kullanım şartları geçerlidir.',sourceAttribution:request.method==='local'?'DersPusulası yerel ders arşivi':'Seçilen Rehber sağlayıcısı',generationParams:{...request,checksum,technicalCheck:'nonempty-size-and-sha256',educationalReview:'not-reviewed'}});
  if(request.revision>1){getDb().execute('UPDATE material_library SET version=? WHERE id=?',[request.revision,registered.material.id]);registered.material.version=request.revision;}
  return {record:registered.material,blob,reused:registered.reused};
 };
 const promise=run();inflight.set(key,promise);try{return await promise;}finally{inflight.delete(key);}
}
export async function pollEducationalJob(job:MediaJob){return refreshMediaJob(job);}

export async function archiveEducationalVideo(request:MaterialRequest,job:MediaJob,blob:Blob):Promise<MaterialRecord>{
 const topic=getDb().queryOne<Topic>('SELECT * FROM topics WHERE id=?',[request.topicId]);
 if(!topic||!blob.size||!blob.type.startsWith('video/'))throw new Error('Geçerli video dosyası bulunamadı.');
 const result=await MaterialLibraryService.registerMaterial({subjectId:topic.subject_id,topicId:topic.id,gradeLevel:request.grade,contentType:'video',title:topic.name+' · video',contentHash:job.id,generatorModel:job.model,dataBlob:blob,verificationStatus:'estimated',licenseInfo:'Rehber üretimi; sağlayıcının kullanım şartları geçerlidir.',generationParams:{...request,remoteId:job.remoteId,educationalReview:'not-reviewed'}});
 const pending=readSetting<Record<string,MediaJob>>('educational_pending_v1',{});delete pending[job.id];writeSetting('educational_pending_v1',pending);return result.material;
}
