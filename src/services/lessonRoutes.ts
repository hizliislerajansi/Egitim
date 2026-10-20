import { MEB_SUBJECTS } from '../data/mebCurriculum';
const slugs: Record<string,string> = {subj_math:'matematik',subj_eng:'ingilizce',subj_turk:'turk-dili-ve-edebiyati',subj_fizik:'fizik',subj_kimya:'kimya',subj_biyoloji:'biyoloji',subj_tarih:'tarih',subj_cografya:'cografya',subj_din:'din-kulturu',subj_saglik:'saglik-bilgisi',subj_almanca:'almanca',subj_bilisim:'bilisim'};
export function lessonPath(id:string):string { return '/dersler/'+(slugs[id] || encodeURIComponent(id)); }
export function subjectFromPath(path:string):string|undefined { return MEB_SUBJECTS.find(s=>lessonPath(s.id)===path.replace(/\/$/,''))?.id; }
