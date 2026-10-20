import {useState,useEffect,useRef} from 'react';
import {Home,CalendarDays,BookOpen,HelpCircle,TrendingUp,Target,Bot,FileText,Settings,Sparkles,Wifi,WifiOff,Compass,FlaskConical,Layers,Cpu,Users,Languages,Calculator,Zap,Dna,Landmark,Globe,HeartHandshake,ShieldPlus,MessageSquareText,CodeXml,PanelLeftClose,PanelLeftOpen,Menu,X,type LucideIcon} from 'lucide-react';
import {FocusLearningEngine} from '../services/focusLearningEngine';
export type ScreenId = 
  | 'material_workshop' | 'accessibility' | 'library' | 'storage' | 'review_cards' | 'exams' | 'help' | 'onboarding'
  | 'dashboard' 
  | 'schedule'
  | 'subject_workshop'
  | 'question_bank'
  | 'progress_report'
  | 'goals'
  | 'tutor' 
  | 'notes'
  | 'resources'
  | 'virtual_lab'
  | 'admin'
  | 'settings'
  | 'homeroom'
  | 'study_coach'
  | 'math_workshop'
  | 'english_lab' 
  | 'learning_hub'
  | 'media_studio'
  | 'focus_study'
  | 'calm_subjects'
  | 'api_hub'
  | 'akilli_ogren'
  | 'egitim_plus';


interface SidebarProps {currentScreen:ScreenId;selectedSubjectId:string;onSelectSubject:(id:string)=>void;onSelectScreen:(screen:ScreenId)=>void;onOpenSettings:()=>void;onOpenParentSummary:()=>void;onOpenTutorial:()=>void;isOnline:boolean;}
export const screenNames:Partial<Record<ScreenId,string>>={admin:'Yönetici paneli',material_workshop:'Eğitim materyali atölyesi',accessibility:'Görünüm ve erişilebilirlik',library:'Materyal arşivi',storage:'Depolama',review_cards:'Tekrar kartları',exams:'Sınavlar',help:'Yardım',onboarding:'Çalışma tercihleri',dashboard:'Genel bakış',calm_subjects:'Derslerim',schedule:'Çalışma planım',subject_workshop:'Ders anlatımı',question_bank:'Sınav ve sorular',progress_report:'İlerleme raporları',goals:'Hedeflerim',tutor:'Öğretmenim',notes:'Notlarım',resources:'Kaynaklar',virtual_lab:'Sanal laboratuvar',homeroom:'Sınıf rehberi',study_coach:'Çalışma koçu',math_workshop:'Matematik atölyesi',english_lab:'İngilizce laboratuvarı',learning_hub:'Öğrenme merkezi',media_studio:'Medya stüdyosu',focus_study:'Odaklı çalışma',api_hub:'Model ve API bağlantıları'};
export function Sidebar(props:SidebarProps){
 const [collapsed,setCollapsed]=useState(()=>localStorage.getItem('dp_sidebar_collapsed')==='true');
 const [mobile,setMobile]=useState(false);
 const [small,setSmall]=useState(()=>window.matchMedia('(max-width:780px)').matches);
 const navRef=useRef<HTMLElement>(null),triggerRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const query=window.matchMedia('(max-width:780px)');const update=()=>setSmall(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 useEffect(()=>{if(!mobile)return;const before=document.activeElement as HTMLElement;navRef.current?.querySelector<HTMLButtonElement>('button')?.focus();const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMobile(false);triggerRef.current?.focus();}if(e.key==='Tab'){const buttons=Array.from(navRef.current?.querySelectorAll<HTMLElement>('button,summary')||[]).filter(el=>el.getClientRects().length>0);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',close);return()=>{window.removeEventListener('keydown',close);before?.focus();};},[mobile]);
 const icons:Record<string,LucideIcon>={MATH:Calculator,TURK:BookOpen,FIZIK:Zap,KIMYA:FlaskConical,BIYOLOJI:Dna,TARIH:Landmark,COGRAFYA:Globe,ENG:Languages,DIN:HeartHandshake,SAGLIK:ShieldPlus,ALMANCA:MessageSquareText,BILISIM:CodeXml};
 const groups:Array<{title:string;items:Array<[ScreenId,string,LucideIcon]>}>=[
 {title:'ÖĞRENME',items:[['dashboard','Genel bakış',Home],['calm_subjects','Derslerim',BookOpen],['schedule','Çalışma planım',CalendarDays],['tutor','Öğretmenim',Bot],['question_bank','Soru bankası',HelpCircle],['exams','Sınavlarım',FileText],['review_cards','Tekrar kartları',Layers],['focus_study','Odaklı çalışma',Target]]},
 {title:'LABORATUVARLAR',items:[['english_lab','İngilizce',Languages],['math_workshop','Matematik',Calculator],['virtual_lab','Sanal laboratuvar',FlaskConical]]},
 {title:'İLERLEME',items:[['progress_report','İlerleme raporları',TrendingUp],['goals','Hedeflerim',Target],['study_coach','Çalışma koçu',Sparkles]]},
 {title:'KÜTÜPHANE',items:[['material_workshop','Materyal oluştur',Sparkles],['library','Materyal arşivi',Layers],['notes','Notlarım',FileText],['learning_hub','Öğrenme merkezi',Layers],['resources','Kaynaklar',Compass]]},
 {title:'UYGULAMA',items:[['admin','Yönetici paneli',Settings],['help','Yardım ve gizlilik',HelpCircle]]}];
 const run=(action:()=>void)=>{action();setMobile(false);};
 const item=(label:string,Icon:LucideIcon,action:()=>void,active=false,key=label)=><button key={key} className={`product-nav-item ${active?'active':''}`} title={label} aria-label={label} aria-current={active?'page':undefined} onClick={()=>run(action)}><Icon size={19}/><span>{label}</span></button>;
 return <><button ref={triggerRef} className="product-mobile-menu" aria-label="Menüyü aç" aria-expanded={mobile} onClick={()=>setMobile(true)}><Menu size={22}/></button>{mobile&&<button className="product-nav-scrim" aria-label="Menüyü kapat" onClick={()=>setMobile(false)}/>}
 <aside ref={navRef} inert={small&&!mobile} role={small&&mobile?'dialog':undefined} aria-modal={small&&mobile?true:undefined} className={`product-sidebar ${collapsed?'collapsed':''} ${mobile?'mobile-open':''}`} aria-label="Ana menü" onKeyDown={e=>{if(e.key==='Escape')setMobile(false);}}>
 <div className="product-brand"><span className="product-brand-mark"><BookOpen size={22}/></span><div><strong>DersPusulası</strong><small>Senin öğrenme alanın</small></div><button className="mobile-close" aria-label="Menüyü kapat" onClick={()=>setMobile(false)}><X size={20}/></button></div>
 <button className="product-collapse" aria-label={collapsed?'Menüyü genişlet':'Menüyü daralt'} onClick={()=>setCollapsed(v=>{localStorage.setItem('dp_sidebar_collapsed',String(!v));return !v;})}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}<span>Menüyü daralt</span></button>
 <nav>{groups.map((group,index)=><div className="product-nav-group" key={group.title}><h2>{group.title}</h2>{group.items.map(([id,label,Icon])=>item(label,Icon,()=>props.onSelectScreen(id),props.currentScreen===id,id))}{index===0&&<details className="product-subjects" open={!collapsed}><summary title="Tüm dersler">DERSLER</summary>{FocusLearningEngine.subjects().map(s=>item(s.name,icons[s.code]||BookOpen,()=>props.onSelectSubject(s.id),props.currentScreen==='subject_workshop'&&props.selectedSubjectId===s.id,s.id))}</details>}{group.title==='UYGULAMA'&&<>{item('Kullanım rehberi',HelpCircle,props.onOpenTutorial)}{item('Veli özeti',Users,props.onOpenParentSummary)}</>}</div>)}</nav>
 <div className="product-connection">{props.isOnline?<Wifi size={15}/>:<WifiOff size={15}/>}<span>{props.isOnline?'İnternet bağlantısı var':'Çevrimdışı · Yerel dersler hazır'}</span></div>
 </aside></>;
}
