import {applyAdminBootstrap} from './services/adminBootstrap';
import {StartupConnections} from './components/StartupConnections';
import {initializePageHistory,pageHistory,pushPage} from './services/pageHistory';
import {applyGeminiTeachingVoice} from './services/teachingDefaults';
const AdminPanel=lazy(()=>import('./components/AdminPanel').then(m=>({default:m.AdminPanel})));
import {PreparationNotice} from './components/PreparationNotice';
import {lessonPath,subjectFromPath} from './services/lessonRoutes';
import {applySlowerNarrationDefault,connectLocalTeacher} from './services/lessonExperience';
import {getVoiceService} from './services/voiceService';
import {MEB_SUBJECTS} from './data/mebCurriculum';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar, ScreenId, screenNames } from './components/Sidebar';
const AkilliOgrenDashboard=lazy(()=>import('./components/AkilliOgrenDashboard').then(m=>({default:m.AkilliOgrenDashboard})));
const EgitimPlusDashboard=lazy(()=>import('./components/EgitimPlusDashboard').then(m=>({default:m.EgitimPlusDashboard})));
import { FocusLearningEngine } from './services/focusLearningEngine';
const ApiSettingsPanel=lazy(()=>import('./components/ApiSettingsPanel').then(m=>({default:m.ApiSettingsPanel})));
const FocusStudyScreen = lazy(() => import('./components/FocusStudyScreen').then(m => ({default: m.FocusStudyScreen})));
const ScheduleScreen = lazy(() => import('./components/ScheduleScreen').then(m => ({default: m.ScheduleScreen})));
const SubjectWorkshopScreen = lazy(() => import('./components/SubjectWorkshopScreen').then(m => ({default: m.SubjectWorkshopScreen})));
const QuestionBankScreen = lazy(() => import('./components/QuestionBankScreen').then(m => ({default: m.QuestionBankScreen})));
const ProgressReportScreen = lazy(() => import('./components/ProgressReportScreen').then(m => ({default: m.ProgressReportScreen})));
const GoalsScreen = lazy(() => import('./components/GoalsScreen').then(m => ({default: m.GoalsScreen})));
const TutorScreen = lazy(() => import('./components/TutorScreen').then(m => ({default: m.TutorScreen})));
const NotesScreen = lazy(() => import('./components/NotesScreen').then(m => ({default: m.NotesScreen})));
const HomeroomTeacherScreen = lazy(() => import('./components/HomeroomTeacherScreen').then(m => ({default: m.HomeroomTeacherScreen})));
const StudyCoachScreen = lazy(() => import('./components/StudyCoachScreen').then(m => ({default: m.StudyCoachScreen})));
const EnglishLabScreen = lazy(() => import('./components/EnglishLabScreen').then(m => ({default: m.EnglishLabScreen})));
const MathWorkshopScreen = lazy(() => import('./components/MathWorkshopScreen').then(m => ({default: m.MathWorkshopScreen})));
const LearningHubScreen = lazy(() => import('./components/LearningHubScreen').then(m => ({default: m.LearningHubScreen})));
const ResourcesScreen = lazy(() => import('./components/ResourcesScreen').then(m => ({default: m.ResourcesScreen})));
const MediaStudioScreen = lazy(() => import('./components/MediaStudioScreen').then(m => ({default: m.MediaStudioScreen})));
const VirtualLabScreen = lazy(() => import('./components/VirtualLabScreen').then(m => ({default: m.VirtualLabScreen})));

const ParentSummaryModal=lazy(()=>import('./components/ParentSummaryModal').then(m=>({default:m.ParentSummaryModal})));
const PhoneMicReceiverScreen=lazy(()=>import('./components/PhoneMicReceiverScreen').then(m=>({default:m.PhoneMicReceiverScreen})));
const TutorialWizardModal=lazy(()=>import('./components/TutorialWizardModal').then(m=>({default:m.TutorialWizardModal})));
import { AppDatabase, getDb } from './db/database';
import { seedInitialData } from './db/seed';
import { MasteryEngine } from './services/masteryEngine';
import { getProviderProfile, readSetting, saveProviderProfile, writeSetting } from './services/apiClient';
import { AppTheme } from './types/settings';
import { Search, Bell, Sparkles, Wifi, WifiOff } from 'lucide-react';
import './App.css';
import './Product.css';
const MaterialWorkshop=lazy(()=>import('./components/MaterialWorkshop').then(m=>({default:m.MaterialWorkshop})));
const AssetLibrary=lazy(()=>import('./components/AssetLibrary').then(m=>({default:m.AssetLibrary})));
const ProductExam=lazy(()=>import('./components/ProductExam').then(m=>({default:m.ProductExam})));
const ReviewCards=lazy(()=>import('./components/ProductTools').then(m=>({default:m.ReviewCards})));
const HelpCenter=lazy(()=>import('./components/ProductTools').then(m=>({default:m.HelpCenter})));
const Onboarding=lazy(()=>import('./components/ProductTools').then(m=>({default:m.Onboarding})));
import {ScreenBoundary} from './components/ScreenBoundary';
import {AccessibilityPanel,applyDisplayPreferences} from './components/AccessibilityPanel';
import {ProductHome} from './components/ProductHome';

const AppEntry: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'phone_mic'
    ? <Suspense fallback={<p role="status">Mikrofon ekranı yükleniyor…</p>}><PhoneMicReceiverScreen sessionId={params.get('session') || 'default_session'} /></Suspense>
    : <App />;
};

export const App: React.FC = () => {
  const [navigation,setNavigation]=useState(pageHistory);
  useEffect(()=>{initializePageHistory();const sync=()=>setNavigation(pageHistory());sync();window.addEventListener('dp-page-history',sync);window.addEventListener('popstate',sync);return()=>{window.removeEventListener('dp-page-history',sync);window.removeEventListener('popstate',sync);};},[]);
  const [focusLayout, setFocusLayout] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');

  const [isParentSummaryOpen, setIsParentSummaryOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [startupError, setStartupError] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState<AppTheme>('light');
  const [masteries, setMasteries] = useState<any[]>([]);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj_math');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Veritabanı başlatma ve veri tohumlama
  useEffect(() => {
    async function init() {
      try {
        const db = AppDatabase.getInstance();
        await db.initialize();
        await seedInitialData();
        applySlowerNarrationDefault();
        getVoiceService().setSpeechRate(readSetting('speech_rate',0.8),false);
        if (!readSetting('gemini_evren_preference_applied', false)) {
          await saveProviderProfile('gemini', getProviderProfile('gemini'));
          writeSetting('ai_secondary_provider', 'evren');
          writeSetting('ai_auto_fallback', true);
          writeSetting('gemini_evren_preference_applied', true);
        }
        if (!readSetting('gemini_puck_tts_v4_applied',false)) {
          writeSetting('voice_provider','gemini_speech');
          writeSetting('voice_model_name','Puck');
          writeSetting('voice_tts_model','gemini-3.8-flash-tts');
          writeSetting('media_default_speech',null);
          writeSetting('gemini_puck_tts_v4_applied',true);
        }
        if (!readSetting('ema_local_default_v1',false)) {
          writeSetting('voice_before_ema',{provider:readSetting('voice_provider','gemini_speech'),voice:readSetting('voice_model_name','Puck'),media:readSetting('media_default_speech',null)});
          writeSetting('voice_provider','ema_local');writeSetting('voice_model_name','EMA');writeSetting('media_default_speech',null);
          writeSetting('ema_api_fallback',true);writeSetting('ema_fallback_provider','gemini_speech');writeSetting('ema_local_default_v1',true);
        }
        if (!readSetting('calm_defaults_v1_applied', false)) {
          FocusLearningEngine.setPreferences({reducedMotion:true,autoAudio:false});
          writeSetting('calm_defaults_v1_applied',true);
        }
        document.documentElement.setAttribute('data-reduced-motion',String(readSetting('reduced_motion',true)));
        applyDisplayPreferences(readSetting('product_display_v1',{font:1,contrast:false,motion:false}));
        applyGeminiTeachingVoice();
        applyAdminBootstrap();
        refreshStats();

        const themeRow = db.queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'theme'");
        if (themeRow) {
          const loadedTheme = JSON.parse(themeRow.value);
          setTheme(loadedTheme);
          document.documentElement.setAttribute('data-theme', loadedTheme==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):loadedTheme);
        }

        const last=readSetting<{screen:ScreenId;subjectId:string}|null>('product_last_screen',null);
        const routeSubject=subjectFromPath(window.location.pathname);
        if(routeSubject){setCurrentScreen('subject_workshop');setSelectedSubjectId(routeSubject);}
        else if(last&&Object.hasOwn(screenNames,last.screen)){setCurrentScreen(['settings','api_hub','accessibility','storage','onboarding','media_studio'].includes(last.screen)?'admin':last.screen);setSelectedSubjectId(last.subjectId||'subj_math');}
        await connectLocalTeacher();
        setIsReady(true);
      } catch (err) {
        console.error('Uygulama başlatma hatası:', err);
        setStartupError(true);
      }
    }

    init();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshStats = () => {
    try {
      const db = getDb();
      MasteryEngine.rebalanceReviewSchedule(15);
      const m = MasteryEngine.getAllMasteries();
      setMasteries(m);

      const revs = db.query("SELECT COUNT(*) as count FROM review_schedule WHERE status = 'pending'");
      setPendingReviewsCount(revs[0]?.count || 0);
    } catch (e) {
      console.warn('Could not refresh stats:', e);
    }
  };

  useEffect(()=>{
    const onPop=()=>{const id=subjectFromPath(window.location.pathname);const saved=history.state?.dpScreen as ScreenId;setCurrentScreen(saved&&Object.hasOwn(screenNames,saved)?(['settings','api_hub','accessibility','storage','onboarding','media_studio'].includes(saved)?'admin':saved):id?'subject_workshop':'dashboard');if(id||history.state?.dpSubject)setSelectedSubjectId(id||history.state.dpSubject);};
    window.addEventListener('popstate',onPop);return ()=>window.removeEventListener('popstate',onPop);
  },[]);
  useEffect(()=>{if(!isReady)return;const subject=MEB_SUBJECTS.find(s=>s.id===selectedSubjectId);document.title=(currentScreen==='subject_workshop'?subject?.name:screenNames[currentScreen])+' · DersPusulası';const description=document.querySelector('meta[name=description]');if(description)description.setAttribute('content',currentScreen==='subject_workshop'&&subject?subject.name+' çalışma sayfası. Konu anlatımı, alıştırma, kişisel öğretmen ve cihazda saklanan öğrenme ilerlemesi.':'DersPusulası kişisel öğrenme alanı: dersler, alıştırmalar ve öğrenme araçları.');},[isReady,currentScreen,selectedSubjectId]);
  useEffect(()=>{if(isReady)history.replaceState({...history.state,dpScreen:currentScreen,dpSubject:selectedSubjectId},'',location.href);},[isReady,currentScreen,selectedSubjectId]);
  const handleScreenChange = (screen: ScreenId, subjectId=selectedSubjectId) => {
    screen=['settings','api_hub','accessibility','storage','onboarding','media_studio'].includes(screen)?'admin':screen;
    refreshStats();
    const path=screen==='subject_workshop'?lessonPath(subjectId):'/';
    if(screen!==currentScreen||(screen==='subject_workshop'&&subjectId!==selectedSubjectId))pushPage({dpScreen:screen,dpSubject:subjectId},path);
    setCurrentScreen(screen);
    writeSetting('product_last_screen',{screen,subjectId});
    document.title=`${screenNames[screen]||'Çalışma alanı'} · DersPusulası`;
  };

  const handleNavigateWithSubject = (screen: ScreenId, subjectId?: string) => {
    if (subjectId) {
      setSelectedSubjectId(subjectId);
    }
    handleScreenChange(screen,subjectId||selectedSubjectId);
    if(subjectId){writeSetting('product_last_screen',{screen,subjectId});if(screen==='subject_workshop')window.history.replaceState({...history.state},'',lessonPath(subjectId));}
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):newTheme);
    const db = getDb();
    db.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
      'theme',
      JSON.stringify(newTheme),
      new Date().toISOString()
    ]);
  };

  if (startupError) return <main role="alert" style={{padding: 32}}><h1>Veriler yüklenemedi</h1><p>Mevcut kayıtlar korundu. Sayfayı yeniden açın; sorun sürerse yerel verilerin yedeğini alın.</p><button onClick={() => window.location.reload()}>Yeniden dene</button></main>;

  if (!isReady) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="status-dot" style={{ width: '16px', height: '16px', margin: '0 auto 12px auto', animation: 'pulse 1s infinite' }} />
          <h3>DersPusulası Hazırlanıyor...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Yerel kayıtlar ve ders içerikleri yükleniyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container product-app calm-ui ${focusLayout ? 'is-focused' : ''}`}>
      <PreparationNotice/>
      <StartupConnections onManage={()=>handleScreenChange('admin')}/>
      <a className="product-skip" href="#main-content">İçeriğe geç</a>
      <Sidebar
        currentScreen={currentScreen}
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={(id)=>handleNavigateWithSubject('subject_workshop',id)}
        onSelectScreen={handleScreenChange}
        onOpenSettings={() => handleScreenChange('admin')}
        onOpenParentSummary={() => setIsParentSummaryOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        isOnline={isOnline}
      />

      <div className="main-wrapper">
        <header className="product-topbar"><nav className="page-history" aria-label="Sayfa geçmişi"><button aria-label="Önceki sayfa" disabled={navigation.index<=0} onClick={()=>history.back()}>← Geri</button><button aria-label="Sonraki sayfa" disabled={navigation.index>=navigation.max} onClick={()=>history.forward()}>İleri →</button></nav><div className="product-breadcrumb"><span>Öğrenme alanım</span><span aria-hidden="true">/</span><strong>{screenNames[currentScreen]||'Çalışma alanı'}</strong></div><form className="product-search" onSubmit={e=>{e.preventDefault();handleScreenChange('question_bank');}}><Search size={17}/><input aria-label="Konu, ders veya soru ara" placeholder="Konu veya soru ara…" value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)}/><button aria-label="Ara" type="submit">Ara</button></form><button className="product-profile" onClick={()=>handleScreenChange('admin')} aria-label="Yönetici panelini aç">Yönetim</button></header>

        {/* Ana İçerik Alanı */}
        <main id="main-content" tabIndex={-1} className="content-area"><ScreenBoundary key={currentScreen}><Suspense fallback={<p role="status">Ekran yükleniyor…</p>}>
          {currentScreen === 'admin' && <AdminPanel theme={theme} onThemeChange={handleThemeChange}/>}
          {currentScreen === 'accessibility' && <AccessibilityPanel theme={theme} onThemeChange={handleThemeChange}/>}
          {currentScreen === 'material_workshop' && <MaterialWorkshop initialSubjectId={selectedSubjectId}/>}
          {currentScreen === 'library' && <AssetLibrary/>}
          {currentScreen === 'storage' && <AssetLibrary storage/>}
          {currentScreen === 'exams' && <ProductExam/>}
          {currentScreen === 'review_cards' && <ReviewCards/>}
          {currentScreen === 'help' && <HelpCenter onNavigate={handleScreenChange}/>}
          {currentScreen === 'onboarding' && <Onboarding onDone={()=>handleScreenChange('dashboard')}/>}
          {currentScreen === 'dashboard' && <ProductHome onNavigate={handleNavigateWithSubject}/>}
          {currentScreen === 'akilli_ogren' && (
            <AkilliOgrenDashboard
              onNavigate={handleNavigateWithSubject}
              onOpenTutorial={() => setIsTutorialOpen(true)}
            />
          )}
          {currentScreen === 'egitim_plus' && (
            <EgitimPlusDashboard
              onNavigate={handleNavigateWithSubject}
              onOpenTutorial={() => setIsTutorialOpen(true)}
            />
          )}
          {currentScreen === 'calm_subjects' && <ProductHome catalogue onNavigate={handleNavigateWithSubject}/>}
          {currentScreen === 'focus_study' && <FocusStudyScreen onExit={()=>handleScreenChange('dashboard')} onFocusChange={setFocusLayout}/>}
          {currentScreen === 'api_hub' && <section className="calm-card"><h1>API bağlantıları</h1><ApiSettingsPanel/></section>}

          {currentScreen === 'schedule' && (
            <ScheduleScreen onNavigate={handleNavigateWithSubject} />
          )}

          {currentScreen === 'subject_workshop' && (
            <SubjectWorkshopScreen
              key={selectedSubjectId}
              onSelectSubject={id=>handleNavigateWithSubject('subject_workshop',id)}
              initialSubjectId={selectedSubjectId}
              onBackToDashboard={() => handleScreenChange('dashboard')}
            />
          )}

          {currentScreen === 'question_bank' && (
            <QuestionBankScreen key={globalSearch} initialSearch={globalSearch} onNavigate={handleScreenChange} />
          )}

          {currentScreen === 'progress_report' && (
            <ProgressReportScreen />
          )}

          {currentScreen === 'goals' && (
            <GoalsScreen />
          )}

          {currentScreen === 'tutor' && (
            <TutorScreen />
          )}

          {currentScreen === 'notes' && (
            <NotesScreen />
          )}

          {currentScreen === 'homeroom' && <HomeroomTeacherScreen />}
          {currentScreen === 'study_coach' && <StudyCoachScreen />}
          {currentScreen === 'english_lab' && <EnglishLabScreen />}
          {currentScreen === 'math_workshop' && <MathWorkshopScreen />}
          {currentScreen === 'virtual_lab' && <VirtualLabScreen />}
          {currentScreen === 'learning_hub' && <LearningHubScreen />}
          {currentScreen === 'resources' && <ResourcesScreen />}
          {currentScreen === 'media_studio' && <MediaStudioScreen />}
        </Suspense></ScreenBoundary></main>
      </div>

      <Suspense fallback={<p role="status">Ayarlar yükleniyor…</p>}>
      {isParentSummaryOpen&&<ParentSummaryModal
        isOpen={isParentSummaryOpen}
        onClose={() => setIsParentSummaryOpen(false)}
      />

      }
      {isTutorialOpen&&<TutorialWizardModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onNavigateToScreen={(screen) => handleScreenChange(screen)}
      />
      }</Suspense>
    </div>
  );
};

export default AppEntry;
