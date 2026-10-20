import {loadMediaBlob,saveMediaBlob} from './mediaStorage';
export const NARRATION_PREFIX='narration:v1:';
const warnings=new Set<string>();
function warn(kind:string){
  if(warnings.has(kind))return;warnings.add(kind);
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('dp-narration-cache',{detail:{warning:'Ses önbelleği bu cihazda kullanılamadı. Ses çalınabilir; sonraki açılışta yeniden üretim gerekebilir.'}}));
}
export async function narrationStorageId(parts:unknown[]):Promise<string>{
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(parts)));
  return NARRATION_PREFIX+Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
}
export async function storedNarrationBlob(parts:unknown[],produce:()=>Promise<Blob>):Promise<Blob>{
  let id:string;try{id=await narrationStorageId(parts);}catch{warn('hash');return produce();}
  const loadOrCreate=async()=>{
    try{const saved=await loadMediaBlob(id);if(saved?.size&&saved.type.startsWith('audio/')){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('dp-narration-cache',{detail:{source:'stored'}}));return saved;}}catch{warn('read');}
    const blob=await produce();
    if(!blob.size||!blob.type.startsWith('audio/'))throw new Error('Geçerli ses dosyası alınamadı.');
    try{await saveMediaBlob(id,blob);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('dp-narration-cache',{detail:{source:'new'}}));}catch{warn('write');}
    return blob;
  };
  // Same audio requested in two windows must not cause two paid generations.
  if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request(id,loadOrCreate);
  return loadOrCreate();
}
