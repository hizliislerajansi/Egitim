import { ORDERED_ENGLISH_UNITS } from '../data/englishCurriculum';
export const ENGLISH_PANELS = {plan:'Günlük plan',placement:'Seviye taraması',vocabulary:'Kelime tekrarı',grammar:'Dil bilgisi',reading:'Okuma',listening:'Dinleme',writing:'Yazma',speaking:'Konuşma',exam:'Ünite sınavı'};
export type EnglishPanel = keyof typeof ENGLISH_PANELS;
export function englishLocation(search:string):{panel?:EnglishPanel;unit?:string} {
 const params=new URLSearchParams(search);const panel=params.get('lab');const unit=params.get('unit');
 return {panel:panel && Object.hasOwn(ENGLISH_PANELS,panel)?panel as EnglishPanel:undefined,unit:ORDERED_ENGLISH_UNITS.some(u=>u.id===unit)?unit!:undefined};
}
export function englishPath(panel:EnglishPanel,unit:string) {return `/dersler/ingilizce?${new URLSearchParams({lab:panel,unit})}`;}
