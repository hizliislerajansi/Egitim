import {spawn,type ChildProcess} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import type {Plugin} from 'vite';
let worker:ChildProcess|undefined;
let warming:Promise<void>|undefined;
async function ensure(){
 const health=async()=>{try{const r=await fetch('http://127.0.0.1:17184/health',{signal:AbortSignal.timeout(1000)});return ((await r.json()) as {service?:string}).service==='derspusulasi-ema';}catch{return false;}};
 if(await health())return;
 if(warming)return warming;
 warming=(async()=>{
 const python=path.resolve('.runtime/ema/Scripts/python.exe');if(!existsSync(python))throw new Error('EMA çalışma ortamı yok. EMA-Kur.ps1 dosyasını çalıştırın.');
 worker=spawn(python,[path.resolve('scripts/ema_server.py'),'--cache-dir',path.resolve('.runtime/models')],{windowsHide:true,stdio:'ignore'});worker.on('error',()=>{});
 for(let i=0;i<50;i++){if(await health())return;await new Promise(r=>setTimeout(r,100));}throw new Error('EMA başlatılamadı');
 })().finally(()=>{warming=undefined;});return warming;
}
export function emaBridge():Plugin{
 const configure=(server:any)=>{
  server.middlewares.use('/api/ema_speech',async(req:any,res:any)=>{try{
   if(req.method!=='POST'){res.statusCode=405;res.end('POST required');return;}
   const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`){res.statusCode=403;res.end('Forbidden');return;}
   let size=0;const chunks:Buffer[]=[];for await(const chunk of req){size+=chunk.length;if(size>24000)throw new Error('Metin çok uzun');chunks.push(Buffer.from(chunk));}
   const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(typeof body.text!=='string'||body.text.length>4000||!body.text.trim()||body.lang!=='tr-TR')throw new Error('Geçersiz EMA isteği');
   await ensure();const response=await fetch('http://127.0.0.1:17184/synthesize',{method:'POST',headers:{'Content-Type':'application/json','X-EMA-Client':'DersPusulasi'},body:JSON.stringify({text:body.text,lang:'tr-TR'}),signal:AbortSignal.timeout(180000)});
   if(!response.ok)throw new Error(`EMA yerel servis: ${response.status}`);
   res.setHeader('Content-Type','audio/wav');res.setHeader('Cache-Control','no-store');res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){res.statusCode=503;res.end(error instanceof Error?error.message:'EMA kullanılamıyor');}});
 };
 return {name:'ema-local-speech',configureServer:configure,configurePreviewServer:configure,closeBundle(){worker?.kill();}};
}

