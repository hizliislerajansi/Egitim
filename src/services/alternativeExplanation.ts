import {AiAdapter} from './aiAdapter';
import type {TopicLecture} from '../data/topicLectures';
export interface AlternativeExplanation {title:string;scene:string[];steps:string[];narration:string;}
export const wantsAnotherExplanation=(text:string)=>/anlamad[ıi]m|anlayamad[ıi]m|daha basit|başka örnek|farklı.*anlat/iu.test(text);
export function alternativeExplanation(lecture:TopicLecture,attempt:number):AlternativeExplanation{
 const second=attempt%2===0;
 if(/fizik.*(force|kuvvet|motion)/.test(lecture.topicId)){
   const steps=second?['Bir yolcu otobüsü fren yaptığında yolcunun gövdesi ileri hareketini sürdürmek ister.','Bu eylemsizliktir: net kuvvet yokken hareket durumu korunur.','Emniyet kemeri yolcuya kuvvet uygulayarak onun da yavaşlamasını sağlar.','Etki–tepki başka bir ilkedir: kuvvetler farklı cisimlere etkir.']:['Tekerlekli sandalyede oturup duvarı ittiğini düşün. Bunu yalnız güvenli bir düşünce deneyi olarak inceleyelim.','Sen duvara kuvvet uygularsın; duvar da sana eşit büyüklükte, zıt yönde kuvvet uygular.','Kuvvetlerden biri duvara, diğeri sana etkir. Aynı cisme etkimedikleri için birbirlerini götürmezler.','Bu, Newton’un üçüncü yasası olan etki–tepkidir.'];
   return {title:second?'Otobüste ani fren · Eylemsizlik':'Duvarı itmek · Etki–tepki',scene:second?['Otobüs yavaşlar','Yolcu hareketini sürdürür','Kemer yolcuyu yavaşlatır']:['Sen → duvar','Duvar → sen','Eşit kuvvet · Zıt yön'],steps,narration:steps.join(' ')};
 }
 if(lecture.topicId==='topic_math_equations'){
   const steps=second?['İki aynı defter ve 10 lira toplam 50 lira olsun.','Bir defterin fiyatına x dersek 2x + 10 = 50 olur.','İki taraftan 10 çıkarırız: 2x = 40. Sonra iki tarafı 2’ye böleriz: x = 20.','Kontrol: 2 çarpı 20 artı 10, 50 eder. Bir defter 20 liradır.']:['Bir kutu ve 3 bilye, toplam 8 bilye ile aynı ağırlıkta olsun.','Kutudaki bilye sayısına x diyelim: x + 3 = 8.','Terazinin iki tarafından da 3 bilye çıkarırız: x = 5.','Kontrol: 5 + 3 = 8. Eşitliğin iki tarafına aynı işlem uygulanır.'];
   return {title:second?'Kırtasiye alışverişi':'Bilyeli terazi',scene:second?['2 defter + 10 ₺','50 ₺','1 defter = 20 ₺']:['Kutu + 3 bilye','8 bilye','Kutu = 5 bilye'],steps,narration:steps.join(' ')};
 }
 if(lecture.topicId==='topic_math_sets'){
   const steps=second?['Bir sınıfta A kümesi müzik sevenler, B kümesi spor sevenler olsun.','Hem müziği hem sporu seven Deniz, A ile B’nin kesişimindedir.','En az birini sevenler birleşimdedir. Yalnız müzik seven Ece, A fark B içindedir.','Kesişim ortakları; birleşim iki kümenin tüm elemanlarını tekrarsız gösterir.']:['A sepetinde elma ve armut; B sepetinde armut ve muz olsun.','İki sepette ortak olan armut kesişimi oluşturur.','Birleşim elma, armut ve muzdur. Armut yalnız bir kez yazılır.','A fark B yalnız elmadır; çünkü elma B sepetinde yoktur.'];
   return {title:second?'Sınıftaki hobiler':'Meyve sepetleri',scene:second?['Müzik: Ece, Deniz','Spor: Deniz, Ali','Ortak: Deniz']:['A: Elma, Armut','B: Armut, Muz','Ortak: Armut'],steps,narration:steps.join(' ')};
 }
 // Stay grounded in the selected topic; never invent a subject-specific analogy.
 const ex=lecture.workedExample;
 const steps=second?[lecture.formulasOrRules[0]?.content||lecture.summary,ex.question,...ex.solutionSteps,`Sonuç: ${ex.finalAnswer}`]:[ex.question,...ex.solutionSteps,`Sonuç: ${ex.finalAnswer}`,lecture.keyPoints[0]||lecture.summary];
 return {title:second?'Kuraldan örneğe · '+lecture.title:'Örnekten kurala · '+lecture.title,scene:second?['Kural', 'Uygulama', 'Kontrol']:['Soru', 'Adım adım çözüm', 'Sonuç'],steps,narration:steps.join(' ')};
}

export function parseAlternative(text:string):AlternativeExplanation|null{
 try{const value=JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,''));if(typeof value.title!=='string'||value.title.length>160||!Array.isArray(value.scene)||value.scene.length!==3||!value.scene.every((v:unknown)=>typeof v==='string'&&v.length>0&&v.length<=65)||!Array.isArray(value.steps)||value.steps.length!==4||!value.steps.every((v:unknown)=>typeof v==='string'&&v.length>0&&v.length<=650))return null;return {title:value.title,scene:value.scene,steps:value.steps,narration:value.steps.join(' ')};}catch{return null;}
}
export async function requestAlternative(lecture:TopicLecture,attempt:number,previous?:AlternativeExplanation):Promise<AlternativeExplanation>{
 const local=alternativeExplanation(lecture,attempt);
 if(['topic_math_equations','topic_math_sets','topic_fizik_motion','topic_fizik_force','topic_fizik_kuvvet'].includes(lecture.topicId))return local;
 try{
  const response=await AiAdapter.request({role:'subject_teacher',taskType:'chat',topicName:lecture.title,maxTokens:1000,systemPrompt:'You are a patient ninth-grade teacher. Give a DIFFERENT scientifically accurate everyday example for this exact topic in Turkish. Never equate braking inertia with Newton third law. Explain analogy limits. Do not change the learning objective. Return ONLY JSON: {"title":"short title","scene":["short visual label","short visual label","short visual label"],"steps":["situation","rule and relation","worked application","check and conclusion"]}. Exactly three scene labels and four steps. No HTML, links or markdown.',userMessage:JSON.stringify({topic:lecture.title,goal:lecture.outcome,reference:lecture.summary,rules:lecture.formulasOrRules,original:lecture.workedExample,previous:previous?.narration,attempt})});
  if(!response.isFallback){const parsed=parseAlternative(response.text);if(parsed&&parsed.narration!==previous?.narration)return parsed;}
 }catch{/* Keep the available lesson when the connection fails. */}
 return {...local,title:'Kayıtlı örneği farklı adımlarla inceleyelim · '+lecture.title};
}
