import {useSyncExternalStore} from 'react';
import {preparationSnapshot,subscribePreparation} from '../services/studentExperience';
export function PreparationNotice(){
 const message=useSyncExternalStore(subscribePreparation,preparationSnapshot,()=> '');
 return <div className="preparation-notice" role="status" aria-live="polite" aria-atomic="true" hidden={!message}>{message&&<><span className="preparation-dot" aria-hidden="true"/>{message}</>}</div>;
}
