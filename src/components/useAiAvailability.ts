import {useEffect,useState} from 'react';
import {aiGenerationAvailable} from '../services/lessonExperience';
export function useAiAvailability(){
 const [ready,setReady]=useState(false);
 useEffect(()=>{let alive=true;const refresh=()=>{void aiGenerationAvailable().then(value=>{if(alive)setReady(value);});};refresh();window.addEventListener('dp-voice-settings',refresh);window.addEventListener('dp-api-settings',refresh);return()=>{alive=false;window.removeEventListener('dp-voice-settings',refresh);window.removeEventListener('dp-api-settings',refresh);};},[]);return ready;
}
