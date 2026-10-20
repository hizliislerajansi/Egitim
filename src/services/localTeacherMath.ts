// A deliberately narrow arithmetic path; unsupported expressions go to the teacher.
export function localLinearExplanation(message:string):string|null{
 const match=message.replace(/−/g,'-').match(/(?<![\w.(+*/^\-])([+-]?(?:\d+(?:[.,]\d+)?)?)\s*x\s*([+-])\s*(\d+(?:[.,]\d+)?)\s*=\s*([+-]?\d+(?:[.,]\d+)?)(?![\d.,x^*/()+\-])/i);
 if(!match)return null;
 const a=match[1]===''||match[1]==='+'?1:match[1]==='-'?-1:Number(match[1].replace(',','.'));
 const b=Number(match[3].replace(',','.'))*(match[2]==='-'?-1:1),c=Number(match[4].replace(',','.'));
 if(!a||![a,b,c].every(Number.isFinite))return null;
 const right=c-b,x=right/a;if(!Number.isFinite(x))return null;
 const n=(v:number)=>Number(v.toPrecision(10)).toLocaleString('tr-TR',{maximumFractionDigits:10,useGrouping:false});
 return `Doğrulanmış yerel matematik çözümü\nHer iki taraftan ${n(b)} çıkar: ${n(a)}x = ${n(c)} − (${n(b)}) = ${n(right)}.\nHer iki tarafı ${n(a)} sayısına böl: x = ${n(right)} / ${n(a)} = ${n(x)}.\nKontrol: ${n(a)} × (${n(x)}) + (${n(b)}) = ${n(c)}.`;
}
