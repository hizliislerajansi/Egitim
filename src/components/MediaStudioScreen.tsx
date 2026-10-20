import {useEffect, useRef, useState} from 'react';
import {getVoiceService} from '../services/voiceService';
import {readSetting, writeSetting, saveCredential, hasProviderKey, isNativeApp} from '../services/apiClient';
import {MEDIA_OPTIONS, mediaOption, type MediaKind} from '../services/mediaCatalog';
import {createMedia, refreshMediaJob, mediaError, type MediaConfig, type MediaJob} from '../services/mediaService';
import {loadMediaBlob, saveMediaBlob} from '../services/mediaStorage';

export function MediaStudioScreen() {
  const [kind,setKind]=useState<MediaKind>('speech');
  const [optionId,setOptionId]=useState('gemini_tts');
  const option=mediaOption(optionId);
  const [model,setModel]=useState(option.model);
  const [voice,setVoice]=useState('Puck');
  const [prompt,setPrompt]=useState('');
  const [key,setKey]=useState('');
  const [hasKey,setHasKey]=useState(false);
  const [workflow,setWorkflow]=useState('');
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');
  const [jobs,setJobs]=useState<MediaJob[]>(()=>readSetting('media_jobs',[]));
  const jobsRef=useRef(jobs);
  const [preview,setPreview]=useState<{url:string;kind:MediaKind;name:string}|null>(null);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview.url);},[preview]);
  useEffect(()=>{
    let current=true;const selected=mediaOption(optionId);const defaultVoice=selected.vendor==='gemini'?'Puck':selected.id==='kokoro'?'am_adam':selected.id==='elevenlabs_tts'?'TxGEqnHWrfWFTfGW9XjX':selected.id==='cartesia_tts'?'a0e99841-438c-4a64-b679-ae501e7d6091':selected.id==='mistral_tts'?'':'ash';const cfg=readSetting<MediaConfig>(`media_config_${optionId}`,{optionId,model:selected.model,voice:defaultVoice});
    setModel(cfg.model);setVoice(cfg.voice);setWorkflow(cfg.workflow||'');setKey('');setHasKey(false);setStatus('');
    if(selected.vendor!=='local')hasProviderKey(selected.vendor).then(v=>{if(current)setHasKey(v);}).catch(()=>{if(current)setStatus('Anahtar kasasına erişilemedi.');});
    return ()=>{current=false;};
  },[optionId]);
  const config=():MediaConfig=>({optionId,model:model.trim(),voice:voice.trim(),...(optionId.startsWith('comfy_')?{workflow}: {})});
  function updateJob(job:MediaJob){const next=[job,...jobsRef.current.filter(j=>j.id!==job.id)].slice(0,20);jobsRef.current=next;writeSetting('media_jobs',next);if(alive.current)setJobs(next);}
  async function save(){
    if(!/^[\w.:/-]{0,150}$/.test(model)||model.includes('..'))throw new Error('Geçersiz model kimliği.');
    if(key.trim()&&option.vendor!=='local'){await saveCredential(option.vendor,key);setKey('');setHasKey(true);}
    writeSetting(`media_config_${optionId}`,config());
  }
  async function showAsset(job:MediaJob,blob?:Blob){
    const data=blob||await loadMediaBlob(job.id);if(!data)throw new Error('Dosya yerel depoda bulunamadı. Daha önce indirdiğiniz dosyayı kullanın.');
    if(!/^(image\/(png|jpeg|webp)|audio\/(wav|x-wav|mpeg|mp3|ogg|flac|opus)|video\/(mp4|webm))$/.test(data.type))throw new Error('Önizleme için desteklenmeyen dosya türü.');
    const ext=data.type.split('/')[1].replace('mpeg','mp3').replace('x-wav','wav');
    if(alive.current)setPreview({url:URL.createObjectURL(data),kind:job.kind,name:`derspusulasi-${job.id}.${ext}`});
  }
  async function run(action:()=>Promise<void>){setBusy(true);try{await action();}catch(error){if(alive.current)setStatus(mediaError(error));}finally{if(alive.current)setBusy(false);}}
  async function generate(){
    if(!prompt.trim())throw new Error('Önce üretilecek içeriği açıklayın.');
    if(option.id==='web_speech'){
      const service=getVoiceService();let failed=false;
      service.setOptions({onError:(text)=>{failed=true;if(alive.current)setStatus(text);}});
      setStatus('Cihaz seslendirmesi hazirlaniyor…');
      await service.speakManually(prompt,'tr-TR',()=>{if(alive.current&&!failed)setStatus('Cihaz seslendirmesi tamamlandi.');},{optionId:'web_speech',model:'',voice:''});return;
    }
    await save();
    const job:MediaJob={id:crypto.randomUUID(),optionId,kind:option.kind,model:model.trim(),prompt,voice,status:'submitting',createdAt:new Date().toISOString()};
    updateJob(job);setStatus('Üretim isteği gönderiliyor…');
    try{
      const result=await createMedia(config(),prompt);
      if(result.blob){
        try{await saveMediaBlob(job.id,result.blob);}catch{job.message='Dosya üretildi ancak yerel depoya kaydedilemedi; önizlemeden hemen indirin.';}
        job.status='completed';await showAsset(job,result.blob);setStatus(job.message||'Gerçek medya yanıtı alındı. Dosyayı indirebilirsiniz.');
      }else{job.status='pending';job.remoteId=result.remoteId;setStatus('Üretim işi alındı. Geçmişteki Durumu güncelle düğmesiyle takip edin.');}
      updateJob(job);
    }catch(error){job.status='unknown';job.message=mediaError(error);updateJob(job);throw error;}
  }
  async function refresh(job:MediaJob){
    const result=await refreshMediaJob(job);const next={...job,status:result.status,message:result.message,progress:result.progress};
    if(result.blob){try{await saveMediaBlob(job.id,result.blob);}catch{next.message='Dosya hazır; yerel kayıt başarısız, hemen indirin.';}await showAsset(next,result.blob);}
    updateJob(next);setStatus(result.message|| (result.status==='pending'?'İş henüz tamamlanmadı.':'Üretim durumu güncellendi.'));
  }
  return <div className="media-studio">
    <header><h1>Medya Stüdyosu</h1><p>Ana ses motoru olarak Google Gemini 3.8 Flash TTS (gemini-3.8-flash-tts — Genç Erkek: Puck) seçilidir. Dersler için gerçek insan kalitesinde ses, görsel ve video üretebilirsiniz.</p></header>
    <div className="media-tabs" role="tablist" aria-label="Medya türü">{(['speech','image','video'] as const).map(k=><button key={k} role="tab" aria-selected={kind===k} disabled={busy} className={`btn ${kind===k?'btn-primary':'btn-secondary'}`} onClick={()=>{setKind(k);setOptionId(MEDIA_OPTIONS.find(p=>p.kind===k)!.id);setPreview(null);}}>{k==='speech'?'Ses':k==='image'?'Görsel':'Video'}</button>)}</div>
    <div className="media-layout"><section className="dp-card media-controls">
      <label htmlFor="media-provider">Sağlayıcı / model seçeneği</label><select id="media-provider" className="chat-input" disabled={busy} value={optionId} onChange={e=>setOptionId(e.target.value)}>{MEDIA_OPTIONS.filter(p=>p.kind===kind).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <p className="media-price">{option.pricing}</p>
      <div className="media-links"><a href={option.docs} target="_blank" rel="noopener noreferrer">Resmî belgeler</a>{option.keyUrl&&<a href={option.keyUrl} target="_blank" rel="noopener noreferrer">API anahtarı al</a>}</div>
      {option.vendor!=='local'&&<><p>{isNativeApp()?'Anahtar Windows kasasında saklanır.':'Anahtar bu sekmenin belleğinde tutulur; yenilemede yeniden girilir.'} Aynı sağlayıcının metin ve medya işlemleri aynı anahtarı kullanır.</p><label htmlFor="media-key">{hasKey?'Anahtar mevcut; değiştirmek için girin':'Sağlayıcı API anahtarı'}</label><input id="media-key" type="password" className="chat-input" autoComplete="off" value={key} disabled={busy} onChange={e=>setKey(e.target.value)} placeholder={hasKey?'Kayıtlı anahtar korunur':'Hesabınızdan aldığınız API anahtarı'} /></>}
      {option.id!=='web_speech'&&!optionId.startsWith('comfy_')&&optionId!=='sd_image'&&<><label htmlFor="media-model">Model kimliği</label><input id="media-model" className="chat-input" disabled={busy} value={model} onChange={e=>setModel(e.target.value)}/></>}
      {kind==='speech'&&option.id!=='web_speech'&&<><label htmlFor="media-voice">Genç erkek ses adı / kimliği</label><input id="media-voice" className="chat-input" disabled={busy} value={voice} onChange={e=>setVoice(e.target.value)}/></>}
      {optionId.startsWith('comfy_')&&<><label htmlFor="media-workflow">ComfyUI API iş akışı JSON</label><textarea id="media-workflow" className="chat-input" rows={5} value={workflow} disabled={busy} onChange={e=>setWorkflow(e.target.value)} placeholder="ComfyUI'den API biçiminde dışa aktardığınız JSON. CLIPTextEncode metninde {{prompt}} kullanılabilir."/><small>Yalnız güvendiğiniz iş akışlarını kullanın. Yerel servis ve ilgili modeller ayrıca kurulmalıdır.</small></>}
      <button className="btn btn-secondary" disabled={busy} onClick={()=>void run(async()=>{await save();setStatus('Medya ayarları kaydedildi; üretim henüz test edilmedi.');})}>Medya ayarlarını kaydet</button>
      {kind==='speech'&&<button className="btn btn-secondary" disabled={busy} onClick={()=>void run(async()=>{await save();writeSetting('media_default_speech',config());setStatus('Öğretmen seslendirmesi bu genç erkek ses sağlayıcısını kullanacak. Servis erişilemezse cihaz sesi kullanılır ve uyarı verilir.');})}>Bu sesi öğretmende kullan</button>}
    </section><section className="dp-card media-output">
      <label htmlFor="media-prompt">{kind==='speech'?'Seslendirilecek metin':'Üretilecek içeriğin açıklaması'}</label><textarea id="media-prompt" className="chat-input" rows={6} maxLength={8000} disabled={busy} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={kind==='speech'?'Seslendirilecek ders metnini yazın.':'Örneğin: Fotosentezin aşamalarını anlatan bir eğitim görseli.'}/>
      <p>Yalnız yazdığınız açıklama seçilen sağlayıcıya gönderilir. Bulut üretimi ücret/kota tüketebilir; Pro aboneliği API kotasının doğrulandığı anlamına gelmez.</p>
      <button className="btn btn-primary" disabled={busy||!prompt.trim()} onClick={()=>void run(generate)}>{busy?'İşleniyor…':kind==='speech'?'Seslendir / ses üret':kind==='image'?'Görsel üret':'Video üretimini başlat'}</button>
      <p role="status" aria-live="polite">{status}</p>
      {preview&&<div className="media-preview">{preview.kind==='speech'?<audio controls src={preview.url}/>:preview.kind==='image'?<img src={preview.url} alt="ders rehberi ile üretilen eğitim görseli"/>:<video controls src={preview.url}/>}<a className="btn btn-secondary" href={preview.url} download={preview.name}>Dosyayı indir</a></div>}
    </section></div>
    <section className="dp-card media-history"><h2>Üretim geçmişi</h2><p>İş kimlikleri korunur. Video ve ComfyUI işlerini yeniden üretmeden güncelleyebilirsiniz. Dosyalar bu cihazın tarayıcı deposundadır; JSON veritabanı yedeği medya dosyalarını içermez, dosyaları ayrıca indirin.</p>
      {!jobs.length?<p>Henüz üretim yok.</p>:jobs.map(job=><article key={job.id}><div><strong>{mediaOption(job.optionId).name}</strong><p>{job.prompt.slice(0,100)}</p><small>{new Date(job.createdAt).toLocaleString('tr-TR')} · {({submitting:'Gönderiliyor / sonuç doğrulanmadı',pending:'İşleniyor',completed:'Tamamlandı',failed:'Başarısız',unknown:'Sonuç doğrulanamadı'})[job.status]}{typeof job.progress==='number'?` · %${job.progress}`:''}</small>{job.message&&<p>{job.message}</p>}</div><div>{job.remoteId&&job.status!=='completed'&&<button className="btn btn-secondary" disabled={busy} onClick={()=>void run(()=>refresh(job))}>Durumu güncelle</button>}{job.status==='completed'&&<button className="btn btn-secondary" disabled={busy} onClick={()=>void run(()=>showAsset(job))}>Önizle / indir</button>}</div></article>)}
    </section>
  </div>;
}
