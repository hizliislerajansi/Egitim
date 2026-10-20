let maxIndex=0;
export function initializePageHistory(){const index=Number.isInteger(history.state?.dpIndex)?history.state.dpIndex:0;maxIndex=index;history.replaceState({...history.state,dpIndex:index},'',location.href);}
export function pageHistory(){return {index:history.state?.dpIndex||0,max:maxIndex};}
export function pushPage(state:Record<string,unknown>,url:string){const index=(history.state?.dpIndex||0)+1;maxIndex=index;history.pushState({...state,dpIndex:index},'',url);window.dispatchEvent(new Event('dp-page-history'));}
