const pending=new Map<symbol,string>();
const listeners=new Set<()=>void>();
export function preparationSnapshot(){return [...pending.values()].at(-1)||'';}
export function subscribePreparation(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function beginPreparation(message='Hazırlanıyor…'){
 const id=Symbol();pending.set(id,message);listeners.forEach(listener=>listener());
 return()=>{if(pending.delete(id))listeners.forEach(listener=>listener());};
}
export async function whilePreparing<T>(message:string,operation:()=>Promise<T>):Promise<T>{
 const finish=beginPreparation(message);try{return await operation();}finally{finish();}
}
// Presentation only: old generated feedback stays unchanged in student storage.
export function studentText(text:string){return text.replace(/\bAI\s+[öÖ]ğretmeni/g,'Öğretmen').replace(/yapay\s+zek[âa]nın/gi,'rehberin').replace(/yapay\s+zek[âa]ya/gi,'rehberine').replace(/yapay\s+zek[âa]dan/gi,'rehberden').replace(/yapay\s+zek[âa]/gi,'ders rehberi').replace(/\bAI\b/g,'Rehber');}
