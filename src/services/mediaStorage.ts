export async function saveMediaBlob(id: string, blob: Blob): Promise<void> {
  const db = await openMediaDb();
  try {await new Promise<void>((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put(blob,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('Medya dosyası yerel depoya kaydedilemedi.'));tx.onabort=()=>reject(new Error('Medya kaydı iptal edildi.'));});}finally{db.close();}
}
export async function loadMediaBlob(id: string): Promise<Blob | null> {
  const db = await openMediaDb();
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction('assets','readonly');const req=tx.objectStore('assets').get(id);req.onsuccess=()=>resolve(req.result || null);req.onerror=()=>reject(new Error('Yerel medya okunamadı.'));});}finally{db.close();}
}
function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{const req=indexedDB.open('derspusulasi_media',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('assets'))req.result.createObjectStore('assets');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(new Error('Yerel medya deposu açılamadı; tarayıcı depolama iznini kontrol edin.'));});
}

export async function listMediaAssets():Promise<Array<{id:string;blob:Blob}>>{
  const db=await openMediaDb();
  try{return await new Promise((resolve,reject)=>{
    const result:Array<{id:string;blob:Blob}>=[];
    const tx=db.transaction('assets','readonly');const request=tx.objectStore('assets').openCursor();
    request.onsuccess=()=>{const cursor=request.result;if(cursor){if(cursor.value instanceof Blob)result.push({id:String(cursor.key),blob:cursor.value});cursor.continue();}};
    tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(new Error('Medya arşivi okunamadı.'));tx.onabort=()=>reject(new Error('Arşiv okuması iptal edildi.'));
  });}finally{db.close();}
}

export async function deleteMediaAsset(id:string):Promise<void>{
  const db=await openMediaDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('Dosya silinemedi.'));});}finally{db.close();}
}

// Only narration-prefixed records are counted; lesson media and videos stay separate.
export async function narrationCacheStats():Promise<{count:number;bytes:number}>{
  const db=await openMediaDb();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction('assets','readonly');let count=0,bytes=0;
    const request=tx.objectStore('assets').openCursor(IDBKeyRange.bound('narration:v1:','narration:v1:\uffff'));
    request.onsuccess=()=>{const cursor=request.result;if(cursor){if(cursor.value instanceof Blob){count++;bytes+=cursor.value.size;}cursor.continue();}};
    tx.oncomplete=()=>resolve({count,bytes});tx.onerror=()=>reject(new Error('Ses önbelleği okunamadı.'));tx.onabort=()=>reject(new Error('Ses önbelleği okuması iptal edildi.'));
  });}finally{db.close();}
}
