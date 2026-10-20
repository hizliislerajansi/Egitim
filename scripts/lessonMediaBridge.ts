import type {Plugin} from 'vite';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {resolve} from 'node:path';
export function lessonMediaBridge():Plugin{
 const handle=(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
  const url=(req.url||'').split('?')[0];if(!url.startsWith('/lesson-media/')){next();return;}
  const match=/^\/lesson-media\/(topic_[a-z0-9_]+\.mp4)$/.exec(url);
  if(!match){res.statusCode=404;res.end();return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.end();return;}
  const path=resolve(process.cwd(),'lesson-media',match[1]);let size:number;
  try{size=statSync(path).size;}catch{res.statusCode=404;res.end();return;}
  let start=0,end=size-1;
  if(req.headers.range){const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!range){res.statusCode=416;res.end();return;}start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),size-1):size-1;if(start>end||start>=size){res.statusCode=416;res.setHeader('Content-Range',`bytes */${size}`);res.end();return;}res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);}
  res.setHeader('Content-Type','video/mp4');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(path,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 };
 return {name:'local-lesson-media',configureServer(server){server.middlewares.use(handle);},configurePreviewServer(server){server.middlewares.use(handle);}};
}
