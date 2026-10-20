import {useEffect,useRef} from 'react';
export function useDialogFocus(open:boolean,onClose:()=>void){
 const ref=useRef<HTMLDivElement>(null);
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement as HTMLElement;
  const dialog=ref.current;
  const controls=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex="0"]')||[]).filter(el=>!el.hasAttribute('disabled')&&el.getClientRects().length>0);
  controls()[0]?.focus();
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();close.current();}if(event.key==='Tab'){const items=controls(),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
  dialog?.addEventListener('keydown',key);return()=>{dialog?.removeEventListener('keydown',key);previous?.focus();};
 },[open]);return ref;
}
