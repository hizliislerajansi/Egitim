import {MaterialLibraryService} from './materialLibraryService';
import {loadMediaBlob} from './mediaStorage';
import {getDb} from '../db/database';
export interface OpenImage{title:string;url:string;page:string;author:string;license:string;licenseUrl:string;checkedAt:string;}
const clean=(v:unknown)=>String(v||'').replace(/<[^>]*>/g,'').replace(/&[a-z#0-9]+;/gi,' ').trim().slice(0,500);
export function parseCommonsImages(body:any):OpenImage[]{
 return Object.values(body?.query?.pages||{}).flatMap((page:any)=>{
  const info=page.imageinfo?.[0],meta=info?.extmetadata;if(!meta)return [];
  const license=clean(meta.LicenseShortName?.value),licenseUrl=String(meta.LicenseUrl?.value||''),author=clean(meta.Artist?.value),url=String(info.thumburl||info.url||''),description=String(info.descriptionurl||'');
  if(!/^(CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0)|CC0|Public domain)$/i.test(license)||!author)return [];
  if(!/^https:\/\/creativecommons\.org\/(licenses|publicdomain)\//.test(licenseUrl))return [];
  if(!/^https:\/\/upload\.wikimedia\.org\//.test(url)||!/^https:\/\/commons\.wikimedia\.org\/wiki\//.test(description))return [];
  if(!['image/png','image/jpeg','image/webp'].includes(info.thumbmime||info.mime))return [];
  return [{title:clean(page.title),url,page:description,author,license,licenseUrl,checkedAt:new Date().toISOString()}];
 });
}
export async function searchOpenImages(query:string):Promise<OpenImage[]>{
 if(query.trim().length<3||query.length>150)throw new Error('3–150 karakterlik bir konu araması gir.');
 const params=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:'5',prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'800',iiextmetadatafilter:'Artist|LicenseShortName|LicenseUrl'});
 const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal:AbortSignal.timeout(15000),credentials:'omit',redirect:'error'});
 if(!response.ok)throw new Error('Ücretsiz kaynak aramasına ulaşılamadı. Yerel üretimle devam edebilirsin.');
 const body=await response.json();if(body.error)throw new Error('Kaynak servisi aramayı tamamlayamadı.');return parseCommonsImages(body);
}
export async function saveOpenImage(image:OpenImage,topicId:string){
 const topic=getDb().queryOne<{subject_id:string;name:string}>('SELECT subject_id,name FROM topics WHERE id=?',[topicId]);if(!topic)throw new Error('Konu seçilmeli.');
 // Revalidate the origin immediately before retrieval; no credentials follow redirects.
 if(new URL(image.url).origin!=='https://upload.wikimedia.org')throw new Error('İzin verilmeyen dosya kaynağı.');
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(topicId+'|'+image.url+'|'+image.license));
 const contentHash='commons_'+Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
 const existing=MaterialLibraryService.findExistingMaterial(topicId,'visual',contentHash);if(existing&&await loadMediaBlob(existing.id)){MaterialLibraryService.recordReuse(existing.id);return {material:existing,reused:true};}
 const response=await fetch(image.url,{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('Görsel indirilemedi.');
 const size=Number(response.headers.get('content-length')||0);if(size>8*1024*1024)throw new Error('Görsel 8 MB sınırını aşıyor.');
 const blob=await response.blob();if(!blob.size||blob.size>8*1024*1024||!/^image\/(png|jpeg|webp)$/.test(blob.type))throw new Error('Desteklenmeyen görsel dosyası.');

 return MaterialLibraryService.registerMaterial({topicId,subjectId:topic.subject_id,contentType:'visual',title:topic.name+' · '+image.title,contentHash,generatorModel:'Wikimedia Commons Imageinfo API',dataBlob:blob,verificationStatus:'estimated',licenseInfo:`${image.license} · ${image.licenseUrl}`,sourceAttribution:`${image.author} · ${image.page}`,generationParams:{source:image,educationalReview:'not-reviewed',licenseCheck:'API metadata allowlist; user must review file page'}});
}
