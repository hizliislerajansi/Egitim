export const TURKISH_PRONUNCIATIONS:Record<string,string>={
 'ChatGPT':'çet ci pi ti','YouTube':'yutub','Google':'gugıl','WhatsApp':'vatsap','Facebook':'feysbuk',
 'online':'onlayn','offline':'oflayn','Einstein':'aynştayn','Shakespeare':'şekspir','Descartes':'dekart',
 'CPU':'si pi yu','GPU':'ci pi yu','HTML':'eyç ti em el','USB':'yu es bi','API':'ey pi ay',
 'Dr.':'doktor','Prof.':'profesör','Doç.':'doçent'
};
export function parsePronunciationDictionary(raw:string):Record<string,string>{
 const result:Record<string,string>={};const lines=raw.split(/\r?\n/).filter(line=>line.trim());
 if(lines.length>100)throw new Error('En çok 100 telaffuz kaydı ekleyin.');
 for(const line of lines){const i=line.indexOf('=');const written=line.slice(0,i).trim(),spoken=line.slice(i+1).trim();
 if(i<1||!written||!spoken||written.length>80||spoken.length>120||/[\x00-\x1f]/.test(written+spoken))throw new Error('Her satır Yazılış=Okunuş biçiminde olmalı.');
 Object.defineProperty(result,written,{value:spoken,enumerable:true,configurable:true});
 }return result;
}
export function pronunciationText(text:string,language:'tr-TR'|'en-US',custom:Record<string,string>={}):string{
 // English teaching remains English; Turkish phonetic substitutions never touch it.
 if(language!=='tr-TR')return text;
 const dictionary={...TURKISH_PRONUNCIATIONS,...custom};
 const pairs=Object.entries(dictionary).filter(([key,value])=>key.length>0&&key.length<=80&&typeof value==='string'&&value.length>0&&value.length<=120).slice(0,150);
 if(!pairs.length)return text;
 const lookup=new Map(pairs.map(([key,value])=>[key.toLocaleLowerCase('tr'),value]));
 const escaped=pairs.map(([key])=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length);
 const regex=new RegExp('(?<![\\p{L}\\p{N}_])('+escaped.join('|')+')(?![\\p{L}\\p{N}_])','giu');
 return text.replace(regex,match=>lookup.get(match.toLocaleLowerCase('tr'))||match);
}
