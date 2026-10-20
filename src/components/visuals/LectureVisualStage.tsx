import type {AlternativeExplanation} from '../../services/alternativeExplanation';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft, 
  Sparkles, Layers, Sliders, Eye, Zap, Compass, Info,
  Volume2, VolumeX, RefreshCw, Bot, X, CheckCircle2
} from 'lucide-react';
import { TopicLecture } from '../../data/topicLectures';
import { getVoiceService } from '../../services/voiceService';
import { AiAdapter } from '../../services/aiAdapter';
import { readSetting, writeSetting, saveCredential, hasProviderKey } from '../../services/apiClient';
import {narrationCacheStats} from '../../services/mediaStorage';
import { getDb } from '../../db/database';
import { Key } from 'lucide-react';
import {nextNarrationStep} from '../../services/lessonExperience';
import {useAiAvailability} from '../useAiAvailability';

interface LectureVisualStageProps {
  alternative?: AlternativeExplanation;
  topicId: string;
  lecture: TopicLecture;
  onStepChange?: (stepIndex: number) => void;
}

export const LectureVisualStage: React.FC<LectureVisualStageProps> = ({ topicId, lecture, alternative }) => {
  const aiReady=useAiAvailability();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // Start only after the student presses the lesson button.
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceError,setVoiceError]=useState('');
  const [voiceNotice,setVoiceNotice]=useState('');
  useEffect(()=>{const changed=(event:Event)=>setVoiceNotice((event as CustomEvent<string>).detail);window.addEventListener('dp-voice-notice',changed);return()=>window.removeEventListener('dp-voice-notice',changed);},[]);
  const [audioCacheCount,setAudioCacheCount]=useState<number|null>(null);
  const [audioCacheWarning,setAudioCacheWarning]=useState('');
  const [audioCacheNotice,setAudioCacheNotice]=useState('');
  useEffect(()=>{
    let alive=true;
    const refresh=()=>{void narrationCacheStats().then(stats=>{if(alive)setAudioCacheCount(stats.count);}).catch(()=>{});};
    const changed=(event:Event)=>{const detail=(event as CustomEvent<{warning?:string;source?:string}>).detail;if(detail?.warning)setAudioCacheWarning(detail.warning);if(detail?.source)setAudioCacheNotice(detail.source==='stored'?'Ses kaydı kalıcı önbellekten alındı.':'Ses üretildi ve bu cihaza kaydedildi.');refresh();};
    refresh();window.addEventListener('dp-narration-cache',changed);
    return()=>{alive=false;window.removeEventListener('dp-narration-cache',changed);};
  },[]);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return readSetting<string>('voice_model_name', 'EMA');
  });
  const [selectedRate, setSelectedRate] = useState<number>(() => {
    return readSetting<number>('speech_rate', 1.0);
  });
  useEffect(()=>{
    const refresh=()=>{setSelectedVoice(readSetting('voice_model_name','EMA'));setSelectedRate(readSetting('speech_rate',1));voiceService.current.stopSpeaking();setIsSpeaking(false);setIsPlaying(false);};
    window.addEventListener('dp-voice-settings',refresh);
    return()=>window.removeEventListener('dp-voice-settings',refresh);
  },[]);
  const [sliderVal, setSliderVal] = useState<number>(4);
  const [selectedSubItem, setSelectedSubItem] = useState<string>('all');
  const [circuitSwitches, setCircuitSwitches] = useState<{ p: boolean; q: boolean }>({ p: false, q: false });
  const [circuitMode, setCircuitMode] = useState<'and' | 'or'>('and');
  const [triangleType, setTriangleType] = useState<'equilateral' | 'right' | 'obtuse'>('equilateral');
  const [isFolded, setIsFolded] = useState<boolean>(false);
  const [material, setMaterial] = useState<'iron' | 'wood' | 'gold'>('iron');
  const [algoInput, setAlgoInput] = useState<number>(6);
  const [algoStep, setAlgoStep] = useState<number>(0);

  // AI Üretimli Görsel & Animasyon Paketi State
  const [activePackageMode, setActivePackageMode] = useState<'standard' | 'ai'>('standard');
  const [aiPackage, setAiPackage] = useState<{
    topicTitle: string;
    promptUsed: string;
    steps: Array<{
      title: string;
      formula: string;
      explanation: string;
      voiceNarration: string;
    }>;
  } | null>(null);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);

  const voiceService = useRef(getVoiceService());

  useEffect(() => {
    hasProviderKey('gemini').then(hasKey => {
      setHasGeminiKey(hasKey);
    });
  }, []);

  // Mevcut aktif adımın pedagojik anlatım metni ve seslendirmesi (Karşılama cümlesiz, doğrudan kural odaklı)
  const getStepInfo = (step: number) => {
    if(alternative){const count=alternative.steps.length;const narration=alternative.steps.slice(Math.floor(step*count/4),Math.floor((step+1)*count/4)).join(' ');return {title:alternative.title,explanation:narration,voiceNarration:narration};}
    if (activePackageMode === 'ai' && aiPackage) {
      const s = aiPackage.steps[step] || aiPackage.steps[0];
      return {
        title: s.title,
        explanation: s.explanation,
        voiceNarration: s.voiceNarration || s.explanation
      };
    }

    const subId = lecture?.subjectId;

    // 1. MATEMATİK: Denklemler
    if (topicId === 'topic_math_equations') {
      const list = [
        { title: 'Eşitlik ve Terazi Modeli', explanation: 'Denklem terazinin iki kefesi gibidir: 3(2x - 4) + 5 = 2x + 9.', voiceNarration: 'Birinci dereceden denklemde eşitliğin iki tarafı terazinin kefeleri gibi tam dengededir: 3 parantezinde 2x eksi 4 artı 5, 2x artı 9 a eşittir.' },
        { title: 'Parantezi Dağıtma Kuralı', explanation: '3 sayısı parantez içine dağıtılır: 3·2x = 6x ve 3·(-4) = -12. İfade: 6x - 12 + 5 olur.', voiceNarration: 'Parantez dağıtılır: 3 ile 2x çarpımı 6x, 3 ile eksi 4 çarpımı eksi 12 eder. İfade 6x eksi 12 artı 5 haline gelir.' },
        { title: 'Sabitleri Sadeleştirme', explanation: '-12 + 5 = -7. Eşitlik 6x - 7 = 2x + 9 olarak düzenlenir.', voiceNarration: 'Sabit terimler toplanır: eksi 12 artı 5, eksi 7 eder. Eşitlik 6x eksi 7 eşittir 2x artı 9 olur.' },
        { title: 'x Değerini Yalnız Bırakma', explanation: '6x - 2x = 9 + 7 ⇒ 4x = 16 ve her iki taraf dörde bölünerek x = 4 bulunur.', voiceNarration: '2x sola, eksi 7 sağa geçer. 4x eşittir 16 ve her iki taraf dörde bölünerek x eşittir 4 kökü bulunur.' }
      ];
      return list[step] || list[0];
    }

    // 2. MATEMATİK: Kümeler
    if (topicId === 'topic_math_sets') {
      const list = [
        { title: 'Venn Şeması ve Evrensel Küme', explanation: 'E evrensel kümesi içindeki A ve B kümelerinin eleman sınırları.', voiceNarration: 'Evrensel küme içinde A ve B kümelerinin eleman dağılımı ve kesişim bölgesi incelenir.' },
        { title: 'Kesişim Kümesi (A ∩ B)', explanation: 'A ∩ B, her iki kümede aynı anda bulunan ortak elemanların sarı taranmış bölgesidir.', voiceNarration: 'Kesişim kümesi, her iki kümede ortak bulunan elemanların oluşturduğu orta alandır.' },
        { title: 'Birleşim Kümesi (A ∪ B)', explanation: 'A ∪ B, her iki kümedeki tüm elemanların tek bir kez sayıldığı toplam alandır.', voiceNarration: 'Birleşim kümesi, A veya B kümesindeki tüm elemanları içine alan geniş bölgedir.' },
        { title: 'Fark Kümeleri (A \\ B ve B \\ A)', explanation: 'A \\ B yalnızca A\'da olanları, B \\ A ise yalnızca B\'de bulunanları gösterir.', voiceNarration: 'Fark kümesi bir kümede bulunup diğerinde bulunmayan elemanları ayırır. Örneğin A fark B, yalnızca A kümesine ait elemanlardır.' }
      ];
      return list[step] || list[0];
    }

    // 3. MATEMATİK: Mutlak Değer
    if (topicId === 'topic_math_absolute') {
      const list = [
        { title: 'Sayı Doğrusunda Başlangıç', explanation: 'Mutlak değer bir sayının sıfır başlangıç noktasına olan uzaklığıdır.', voiceNarration: 'Mutlak değer, reel sayının sayı doğrusundaki sıfır başlangıç noktasına olan geometrik uzaklığıdır. Uzaklık asla negatif olamaz.' },
        { title: 'Pozitif Değer Mesafesi', explanation: `|${sliderVal}| = ${sliderVal} birim uzaklıktadır.`, voiceNarration: `Pozitif ${sliderVal} sayısının sıfıra olan mesafesi ${sliderVal} birimdir.` },
        { title: 'Negatif Değer Mesafesi', explanation: `|-${sliderVal}| = ${sliderVal} birimdir. İşaret daima pozitife döner.`, voiceNarration: `Negatif ${sliderVal} sayısının da sıfıra uzaklığı yine pozitif ${sliderVal} birimdir.` },
        { title: 'Kritik Çıkarım & Eşitsizlik', explanation: '|x| ≥ 0 bağıntısı tüm reel sayılar için geçerlidir.', voiceNarration: 'Mutlak değer daima sıfır veya sıfırdan büyüktür. Hiçbir zaman negatif bir değere eşit olamaz.' }
      ];
      return list[step] || list[0];
    }

    // 4. MATEMATİK: Üçgende Açılar
    if (topicId === 'topic_math_triangles') {
      const list = [
        { title: 'Üçgen Köşeleri & Açılar', explanation: 'Üçgenin iç açıları α, β ve θ olarak tanımlanır.', voiceNarration: 'Üçgenin iç açıları toplamının 180 derece olduğu paralel doğru ve katlama yöntemiyle ispatlanır.' },
        { title: 'Tepeye Paralel Doğru Çizimi', explanation: 'Tepe noktasından tabana çizilen paralel doğru iç ters açıları taşır.', voiceNarration: 'Tepe noktasından tabana paralel bir doğru çizildiğinde iç ters açılardan dolayı taban açıları tepeye taşınır.' },
        { title: 'Açıların Birleştirilmesi', explanation: 'Üçgenin üç açısı tepe noktasında yan yana gelerek doğru açı oluşturur.', voiceNarration: 'Üç açı tepe noktasında birleştirildiğinde düz bir doğru açıyı meydana getirir.' },
        { title: '180° İspat Sonucu', explanation: 'Doğru açı 180° olduğundan α + β + θ = 180° bağıntısı kesinleşir.', voiceNarration: 'Doğru açı 180 derece olduğundan tüm üçgenlerin iç açıları toplamı her zaman 180 derecedir.' }
      ];
      return list[step] || list[0];
    }

    // 5. MATEMATİK: Mantık Devresi
    if (topicId === 'topic_math_logic') {
      const list = [
        { title: 'Önermeler ve Elektrik Anahtarları', explanation: 'Doğru önerme 1 kapalı anahtar, yanlış önerme 0 açık anahtardır.', voiceNarration: 'Mantık önermelerinde doğru önerme kapalı devre anahtarını, yanlış önerme açık anahtarı temsil eder.' },
        { title: 'Ve Bağlacı - Seri Bağlantı', explanation: 'Seri devrede lambanın yanması için iki anahtarın da kapalı olması gerekir (1 ∧ 1 = 1).', voiceNarration: 'Ve bağlacı seri devredir. Lambanın yanabilmesi için iki anahtarın da kapalı olması şarttır.' },
        { title: 'Veya Bağlacı - Paralel Bağlantı', explanation: 'Paralel devrede anahtarlardan birinin kapalı olması lambayı yakar.', voiceNarration: 'Veya bağlacı paralel bağlı devredir. Anahtarlardan tek birinin bile kapalı olması lambayı yakmaya yeterlidir.' },
        { title: 'Doğruluk Tablosu Çıkarımı', explanation: 'VE bağlacı seçicidir; VEYA bağlacı kapsayıcıdır.', voiceNarration: 'Ve bağlacı yalnızca iki önerme de birken bir değerini alır. Veya bağlacı ise önermelerden biri bir olduğunda daima birdir.' }
      ];
      return list[step] || list[0];
    }

    // 6. KİMYA: Bohr Atom & Katman Elektron Dağılımı (Yalnızca Bohr/Atom konusu seçildiğinde)
    if (topicId === 'topic_kimya_atom' || topicId === 'topic_kimya_bohr') {
      const list = [
        { title: 'Atomun Çekirdeği ve Yörüngeler', explanation: 'Atomun merkezinde pozitif protonlar ve yüksüz nötronlar bulunur; çevresinde elektronlar döner.', voiceNarration: 'Atomun merkezinde proton ve nötronlardan oluşan çekirdek, çevresindeki enerji katmanlarında ise elektronlar yer alır.' },
        { title: 'Katman Elektron Dağılım Kuralı (2n²)', explanation: '1. katman en fazla 2, 2. katman en fazla 8, 3. katman en fazla 8 elektron taşır.', voiceNarration: 'Bohr modeline göre elektronlar katmanlara belirli kapasitelerle dizilir: birinci katman iki, ikinci katman sekiz elektron alır.' },
        { title: 'Periyodik Tabloda Grup ve Periyot', explanation: 'Katman sayısı periyot numarasını, son katmandaki değerlik elektron sayısı grup numarasını verir.', voiceNarration: 'Elektron katman sayısı elementin periyot numarasını, son katmandaki değerlik elektron sayısı ise grup numarasını belirler.' },
        { title: 'Oktet Kuralı & Kimyasal Bağ', explanation: 'Atomlar kararlı hale gelmek için son katmanlarını 8 elektrona tamamlayarak bağ kurar.', voiceNarration: 'Atomlar son katmanlarını sekize tamamlamak için elektron alışverişi veya ortaklaşmasıyla kimyasal bağ oluşturur.' }
      ];
      return list[step] || list[0];
    }

    // 7. BİYOLOJİ: Hücre ve Organeller & DNA (Yalnızca Hücre konusu seçildiğinde)
    if (topicId === 'topic_biyo_hucre' || topicId === 'topic_biyo_cell') {
      const list = [
        { title: 'Hücre Zarı & Seçici Geçirgenlik', explanation: 'Çift katmanlı fosfolipid tabakası madde giriş çıkışını kontrol eder.', voiceNarration: 'Hücre zarı çift katmanlı fosfolipid yapısıyla madde geçişini seçici geçirgen olarak denetler.' },
        { title: 'Çekirdek ve Genetik Kod (DNA)', explanation: 'Çift sarmal DNA molekülü canlının tüm kalıtsal yönergelerini taşır.', voiceNarration: 'Çekirdek içinde hücrenin tüm kalıtsal yönergelerini taşıyan çift sarmal DNA molekülü bulunur.' },
        { title: 'Mitokondri ve Enerji (ATP)', explanation: 'Mitokondri hücresel solunumla hücrenin temel enerji para birimi olan ATP üretir.', voiceNarration: 'Mitokondri oksijenli solunumla hücrenin enerji molekülü olan ATP yi sentezler.' },
        { title: 'Hücresel Organizasyon', explanation: 'Hücreler bir araya gelerek dokuları, dokular organları, organlar sistemleri oluşturur.', voiceNarration: 'Hücreler birleşerek dokuları, organları ve canlı sistemini meydana getirir.' }
      ];
      return list[step] || list[0];
    }

    // 8. TÜRK DİLİ VE EDEBİYATI: Cümle Ögeleri (Yalnızca Cümle Ögeleri konusu seçildiğinde)
    if (topicId === 'topic_turk_cumle_ogeleri') {
      const list = [
        { title: 'Temel Ögeler: Yüklem ve Özne', explanation: 'Yüklem cümlenin lokomotifidir; özne ise işi gerçekleştiren temel unsurdur.', voiceNarration: 'Cümlenin iki temel ögesi yüklem ve öznedir. Yüklem iş veya oluşu bildirir, yükleme sorulan Kim ve Ne soruları özneyi verir.' },
        { title: 'Nesne (Belirtili ve Belirtisiz)', explanation: 'Neyi, Kimi? soruları belirtili nesneyi; Ne? sorusu belirtisiz nesneyi buldurur.', voiceNarration: 'Özne bulunduktan sonra yükleme sorulan Neyi ve Kimi soruları belirtili nesneyi gösterir.' },
        { title: 'Tümleçler (Zarf ve Dolaylı Tümleç)', explanation: 'Nasıl, Ne zaman? zarf tümlecini; Kime, Nerede, Nereden? yer tamlayıcısını verir.', voiceNarration: 'Nasıl ve Ne zaman soruları zarf tümlecini; Nerede ve Kime soruları yer tamlayıcısını belirler.' },
        { title: 'Bölünmez Öbekler Kuralı', explanation: 'Deyimler, tamlamalar ve birleşik fiiller öge ayrımında asla bölünmez.', voiceNarration: 'Cümle ögeleri bulunurken tamlamalar, deyimler ve birleşik fiiller asla parçalanmaz, bir bütün olarak alınır.' }
      ];
      return list[step] || list[0];
    }

    // 9. TARİH: Zaman Şeridi ve İlk Çağ Medeniyetleri (Yalnızca İlk Çağ konusu seçildiğinde)
    if (topicId === 'topic_tarih_ilk_cag' || topicId === 'topic_tarih_yazi') {
      const list = [
        { title: 'Tarihin Başlangıcı ve Yazı', explanation: 'MÖ 3200 yılında Sümerlerin çivi yazısını bulmasıyla tarih çağları başlar.', voiceNarration: 'Tarih, milattan önce 3200 yılında Sümerlerin çivi yazısını bulmasıyla Tarih Öncesi ve Tarih Çağları olarak ikiye ayrılır.' },
        { title: 'İlk Çağ Medeniyet Havzaları', explanation: 'Mezopotamya, Mısır, Anadolu ve Ege kıyılarında kurulan ilk uygarlıklar.', voiceNarration: 'İlk Çağ medeniyetleri Fırat, Dicle ve Nil nehirleri kıyısındaki verimli topraklarda kurulmuştur.' },
        { title: 'Neden-Sonuç İlişkisi', explanation: 'Tarihsel olaylar gerçekleştiği dönemin koşullarıyla ve birbirini takip eden zincirle incelenir.', voiceNarration: 'Tarihsel olaylar incelenirken neden-sonuç bağı kurulur ve o dönemin şartları dikkate alınır.' },
        { title: 'Birinci Elden Tarihsel Kaynaklar', explanation: 'Kitabeler, arkeolojik bulgular ve paralar döneme tanıklık eden temel belgelerdir.', voiceNarration: 'Yazılı kitabeler, paralar ve arkeolojik eserler araştırmalarda birinci elden en güvenilir bilgi kaynaklarıdır.' }
      ];
      return list[step] || list[0];
    }

    // 10. İNGİLİZCE: Present Simple (Yalnızca Present Simple konusu seçildiğinde)
    if (topicId === 'topic_eng_present_simple' || topicId === 'topic_eng_tenses') {
      const list = [
        { title: 'Present Simple: Rutinler ve Doğrular', explanation: 'Subject + Verb kuralı; genel gerçekler ve alışkanlıklar anlatılır.', voiceNarration: 'Simple Present Tense rutin alışkanlıkları ve genel gerçekleri ifade etmek için kullanılır.' },
        { title: '3. Tekil Şahıs Kuralı (He / She / It)', explanation: 'He, She ve It öznelerinde fiilin sonuna -s, -es veya -ies takısı gelir.', voiceNarration: 'He, She ve It öznelerinde olumlu cümlede fiilin sonuna s takısı eklenir.' },
        { title: 'Soru ve Olumsuz Yapısı (Do / Does)', explanation: 'Olumsuzda don\'t / doesn\'t kullanılır ve fiil yalın haline döner.', voiceNarration: 'Olumsuz cümlelerde do not veya does not kullanılır ve fiil ilk yalın haline döner.' },
        { title: 'Zaman Zarfları (Frequency Adverbs)', explanation: 'Always, usually, often, sometimes ve never eylemin sıklığını belirtir.', voiceNarration: 'Always, usually, often ve never gibi zaman zarfları eylemin gerçekleşme sıklığını belirtir.' }
      ];
      return list[step] || list[0];
    }

    // 11. DİN KÜLTÜRÜ: İnanç Esasları (Yalnızca İnanç konusu seçildiğinde)
    if (topicId === 'topic_din_inanc' || topicId === 'topic_din_tevhid') {
      const list = [
        { title: 'Tevhid İnancı: Allah\'ın Birliği', explanation: 'İslam inanç sisteminin merkezinde Allah\'ın birliği ve eşi olmaması yer alır.', voiceNarration: 'İslam inanç esaslarının temeli Tevhid inancıdır; yani Allah ın birliği ve benzersiz oluşudur.' },
        { title: 'Nübüvvet ve İlahi Vahiy', explanation: 'Allah insanlara doğru yolu göstermek için peygamberler ve kutsal kitaplar göndermiştir.', voiceNarration: 'Nübüvvet, insanlara doğru yolu rehberlik etmek üzere peygamberler ve vahiy gönderilmesidir.' },
        { title: 'Ahiret Bilinci ve Sorumluluk', explanation: 'Dünya hayatındaki amellerin hesap günü tartılacağı ve karşılık bulacağı inancı.', voiceNarration: 'Ahiret inancı insanın bu dünyadaki tüm eylemlerinden sorumlu olduğu bilincini kazandırır.' },
        { title: 'Ahlak ve Toplumsal Adalet', explanation: 'İnanç esasları dürüstlük, adalet, merhamet ve dayanışma erdemleriyle hayata yansır.', voiceNarration: 'İnanç esasları insanda doğruluk, adalet, merhamet ve toplumsal yardımlaşma ahlakını geliştirir.' }
      ];
      return list[step] || list[0];
    }

    // 12. SAĞLIK BİLGİSİ: İlk Yardım (Yalnızca İlk Yardım konusu seçildiğinde)
    if (topicId === 'topic_saglik_ilkyardim') {
      const list = [
        { title: 'Olay Yeri Güvenliği ve Bilinç Kontrolü', explanation: 'Önce çevre güvenliği alınır, ardından kazazedenin omzuna dokunarak bilinç sorgulanır.', voiceNarration: 'İlk yardımda ilk kural çevre güvenliğini sağlamak ve kazazedenin bilincini omzuna hafifçe dokunarak kontrol etmektir.' },
        { title: 'Hava Yolu Açıklığı (Baş-Çene Pozisyonu)', explanation: 'Dilin geriye kaçmasını önlemek için bir el alında, diğer el çenede geriye eğilir.', voiceNarration: 'Solunum yolunu açmak için Baş Çene pozisyonu verilir ve ağız içi kontrol edilir.' },
        { title: 'Solunum Değerlendirmesi: Bak-Dinle-Hisset', explanation: 'Göğüs hareketi gözlenir, nefes sesi dinlenir ve yanağa hava akımı 10 saniye hissedilir.', voiceNarration: 'Solunum Bak Dinle Hisset yöntemiyle on saniye süreyle titizlikle değerlendirilir.' },
        { title: '112 Acil Arama ve Kalp Masajı', explanation: 'Solunum yoksa 112 aranır ve dakikada 100-120 bası ritmiyle göğüs masajına geçilir.', voiceNarration: 'Solunum yoksa gecikmeden yüz on iki aranır ve dakikada yüz yirmi ritimle göğüs masajına başlanır.' }
      ];
      return list[step] || list[0];
    }

    // 13. ALMANCA: Artikeller & Fiil Çekimi (Yalnızca Artikeller konusu seçildiğinde)
    if (topicId === 'topic_almanca_artikeller') {
      const list = [
        { title: 'İsimler ve Belirli Artikeller', explanation: 'Almancada her ismin cinsiyeti vardır: der (eril), die (dişil), das (nötr).', voiceNarration: 'Almancada isimlerin tümü büyük harfle yazılır ve belirli artikeller taşır: der eril, die dişil, das nötrdür.' },
        { title: 'Kişi Zamirleri (Personalpronomen)', explanation: 'ich (ben), du (sen), er/sie/es (o), wir (biz), ihr (siz), sie/Sie (onlar/Siz).', voiceNarration: 'Kişi zamirleri ben için ih, sen için du, o için er zi es olarak telaffuz edilir.' },
        { title: 'Temel Fiil Çekimi (sein)', explanation: 'ich bin, du bist, er ist, wir sind, ihr seid, sie sind düzensiz çekimi.', voiceNarration: 'Olmak anlamına gelen sein fiili ich bin, du bist, er ist şeklinde çekimlenir.' },
        { title: 'Cümle Dizilim Kuralı', explanation: 'Almanca kurallı cümlede çekimli fiil daima ikinci sırada yer alır.', voiceNarration: 'Kurallı düz cümlelerde çekimli fiil her zaman cümlenin ikinci sırasında konumlanır.' }
      ];
      return list[step] || list[0];
    }

    // 14. COĞRAFYA: Koordinat Sistemi (Yalnızca Koordinat konusu seçildiğinde)
    if (topicId === 'topic_cografya_koordinat' || topicId === 'topic_cografya_doga') {
      const list = [
        { title: 'Doğa ve İnsan Etkileşimi', explanation: 'İnsan ve doğal çevre karşılıklı etkileşim halindedir; coğrafya bu ilişkiyi inceler.', voiceNarration: 'Doğa ve insan ünitesinde canlılar ile doğal çevrenin karşılıklı etkileşimi ve coğrafyanın temel ilkeleri incelenir.' },
        { title: 'Paralel ve Meridyen Sistemi', explanation: 'Ekvatora paralel 180 paralel çemberi, kutuptan kutba 360 meridyen yayı uzanır.', voiceNarration: 'Dünya üzerinde konumu belirlemek için paralel ve meridyen ağları kullanılır. Toplam yüz seksen paralel ve üç yüz altmış meridyen bulunur.' },
        { title: 'Meridyenler Arası 4 Dakika Kuralı', explanation: 'Ardışık iki meridyen arasındaki yerel saat farkı Dünya\'nın her yerinde 4 dakikadır.', voiceNarration: 'Dünya nın batıdan doğuya dönüşünden ötürü iki ardışık meridyen arasındaki yerel saat farkı daima dört dakikadır.' },
        { title: 'Mutlak ve Göreceli Konum', explanation: 'Koordinatlarla ifade edilen mutlak konumdur; kıtalara, denizlere göre durum göreceli konumdur.', voiceNarration: 'Enlem ve boylam dereceleriyle belirtilen konum mutlak konum; denizlere, boğazlara ve komşulara göre durum ise göreceli konumdur.' }
      ];
      return list[step] || list[0];
    }

    // 15. BİLİŞİM: Algoritmalar ve Akış Şeması (Yalnızca Algoritma konusu seçildiğinde)
    if (topicId === 'topic_bilisim_algo') {
      const list = [
        { title: 'Algoritma ve Problem Çözme', explanation: 'Algoritma bir problemi çözmek için takip edilen sonlu ve kesin adımlar dizisidir.', voiceNarration: 'Algoritma, bir problemin çözümü için tasarlanan adım adım sonlu mantıksal işlem basamaklarıdır.' },
        { title: 'Akış Şeması Sembolleri', explanation: 'Elips başla/bitir, paralelkenar girdi, dikdörtgen işlem, eşkenar dörtgen karar yapısını gösterir.', voiceNarration: 'Akış şemasında elips başla ve bitir, paralelkenar veri girişi, dikdörtgen matematiksel işlem ve baklava dilimi karar yapısını gösterir.' },
        { title: 'Karar ve Koşul Yapısı (Eğer / Değilse)', explanation: 'Şarta bağlı olarak programın akışı farklı yollara ayrılır.', voiceNarration: 'Koşul yapılarında şart doğruysa evet kolu, şart yanlışsa hayır kolu işletilerek program yönlendirilir.' },
        { title: 'Döngüler ve Test', explanation: 'Belirli bir işlem şart sağlanana kadar tekrar edilir; kod adım adım test edilir.', voiceNarration: 'Döngüler belirli bir şart geçerli olduğu sürece işlem bloğunun tekrarlanmasını sağlar.' }
      ];
      return list[step] || list[0];
    }

    // 16. FİZİK: Madde ve Özkütle / Kuvvet ve Hareket (Yalnızca bu konular seçildiğinde)
    if (topicId === 'topic_fizik_matter' || topicId === 'topic_fizik_density') {
      const list = [
        { title: 'Kütle, Hacim ve Özkütle', explanation: 'Özkütle birim hacimdeki kütle miktarıdır: d = m / V.', voiceNarration: 'Özkütle saf maddeler için ayırt edici bir özelliktir. Kütlenin hacme bölünmesiyle hesaplanır: d eşittir m bölü V dir.' },
        { title: 'Dereceli Silindir ve Taşırma Kabı', explanation: 'Düzensiz katıların hacmi sıvıya batırılarak yer değiştiren sıvının hacmiyle ölçülür.', voiceNarration: 'Düzensiz katı cisimlerin hacmi dereceli silindire atıldığında yükselen sıvı seviyesi farkıyla bulunur.' },
        { title: 'Yüzme, Askıda Kalma ve Batma', explanation: 'Özkütlesi sıvıdan küçük olan yüzer, eşit olan askıda kalır, büyük olan dibe batar.', voiceNarration: 'Sıvı içine bırakılan cismin özkütlesi sıvıdan küçükse yüzer, eşitse askıda kalır, büyükse dibe batar.' },
        { title: 'Sabit Sıcaklıkta Ayırt Edicilik', explanation: 'Sabit sıcaklık ve basınçta saf bir maddenin özkütlesi kütleye bağlı olarak değişmez.', voiceNarration: 'Sabit sıcaklık ve basınçta saf maddelerin özkütlesi sabittir; kütle arttıkça hacim de aynı oranda artar.' }
      ];
      return list[step] || list[0];
    }
    if (topicId === 'topic_fizik_force' || topicId === 'topic_fizik_kuvvet') {
      const list = [
        { title: 'Temel Kuvvet ve Ölçüm', explanation: 'Kuvvet cisimlerin hareket ve şeklini değiştirir; dinamometre ile Newton cinsinden ölçülür.', voiceNarration: 'Kuvvet cisimlerin hareket durumunu değiştiren etkidir. Dinamometre ile ölçülür ve birimi Newton dur.' },
        { title: 'Bileşke Kuvvet (Net Kuvvet)', explanation: 'Aynı yönlü kuvvetler toplanır, zıt yönlü kuvvetler çıkarılarak Fnet elde edilir.', voiceNarration: 'Aynı yönlü kuvvetler toplanır, zıt yönlü kuvvetler çıkarılarak cisme etki eden net kuvvet hesaplanır.' },
        { title: 'Newton\'un İkinci Hareket Yasası', explanation: 'Net kuvvet kütle ile ivmenin çarpımına eşittir: F = m · a.', voiceNarration: 'Newton un ikinci yasasına göre net kuvvet, cismin kütlesi ile ivmesinin çarpımına eşittir.' },
        { title: 'Sürtünme Kuvveti ve Etki-Tepki', explanation: 'Sürtünme daima harekete zıt yöndedir; her etkiye eşit ve zıt bir tepki oluşur.', voiceNarration: 'Sürtünme kuvveti daima hareket yönüne zıttır ve hareketi engelleyici bir direnç oluşturur.' }
      ];
      return list[step] || list[0];
    }

    // 17. TÜM DİĞER KONULAR İÇİN MEB DERS VERİSİNDEN OTOMATİK 4 ADIMLI DİNAMİK PAKET
    // Karışmayı %100 önler: Hangi konu seçildiyse doğrudan onun özetini, formülünü ve örneğini seslendirir.
    if (lecture) {
      const kp = lecture.keyPoints || [];
      const formulas = lecture.formulasOrRules || [];
      const worked = lecture.workedExample;
      const list = [
        {
          title: `${lecture.title} Temel Kavramı`,
          explanation: lecture.summary || kp[0] || 'Kavram ve bilimsel tanım.',
          voiceNarration: lecture.summary || kp[0] || 'Kavram ve bilimsel tanım.'
        },
        {
          title: formulas[0]?.title || 'Temel Kural ve Formül',
          explanation: formulas[0]?.content || kp[0] || 'Konunun temel formülü ve kuralı.',
          voiceNarration: formulas[0]?.content || kp[0] || 'Konunun temel formülü ve kuralı.'
        },
        {
          title: 'Kritik Püf Noktası',
          explanation: kp[1] || kp[0] || 'Sorularda dikkat edilecek en önemli kural.',
          voiceNarration: kp[1] || kp[0] || 'Sorularda dikkat edilecek en önemli kural.'
        },
        {
          title: 'Soru Çözüm Taktiği',
          explanation: worked?.solutionSteps?.[0] || worked?.question || 'Örnek soru ve çözüm tekniği.',
          voiceNarration: worked?.solutionSteps?.[0] || worked?.question || 'Örnek soru ve çözüm tekniği.'
        }
      ];
      return list[step] || list[0];
    }

    return {
      title: 'Konu İncelemesi',
      explanation: 'MEB müfredatına uygun konu anlatımı ve kurallar.',
      voiceNarration: 'MEB müfredatına uygun konu anlatımı ve kurallar.'
    };
  };

  // Sesli Anlatımı Tetikle ve Cümle Kesilmesini Önleyen Otomatik Geçiş
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const isVoiceEnabledRef = useRef(isVoiceEnabled);
  isVoiceEnabledRef.current = isVoiceEnabled;
  const stepTimerRef = useRef<any>(null);
  const lastNarrationKeyRef = useRef<string>('');
  const prevTopicRef = useRef<string>(topicId);

  const advanceNextStep = () => {
    if (!isPlayingRef.current) return;
    const next=nextNarrationStep(activeStep);
    if(next===null){isPlayingRef.current=false;setIsPlaying(false);setIsSpeaking(false);return;}
    setActiveStep(next);
  };

  const handleVoiceChange = (newVoice: string) => {
    setSelectedVoice(newVoice);
    writeSetting('voice_model_name', newVoice);
    const provider = newVoice==='EMA'?'ema_local':(newVoice === 'Ahmet' || newVoice === 'Tolga') ? 'web_speech' : 'gemini_speech';
    writeSetting('voice_provider', provider);
    writeSetting('media_default_speech',null);
    try {
      const now = new Date().toISOString();
      getDb().execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
        'voice_model_name', JSON.stringify(newVoice), now
      ]);
      getDb().execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
        'voice_provider', JSON.stringify(provider), now
      ]);
    } catch {}

    lastNarrationKeyRef.current = '';
    voiceService.current.stopSpeaking();
    setIsSpeaking(true);
    setTimeout(() => {
      speakStepNarration(activeStep);
    }, 100);
  };

  const handleRateChange = (newRate: number) => {
    setSelectedRate(newRate);
    writeSetting('speech_rate', newRate);
    voiceService.current.setSpeechRate(newRate, true);
  };

  const speakStepNarration = (stepIndex: number) => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }

    voiceService.current.stopSpeaking();

    const info = getStepInfo(stepIndex);
    if (!info || !info.voiceNarration) return;

    if (!isVoiceEnabledRef.current) {
      setIsSpeaking(false);
      if (isPlayingRef.current) {
        stepTimerRef.current = setTimeout(() => {
          advanceNextStep();
        }, 8000);
      }
      return;
    }

    setIsSpeaking(true);
    const lang = !alternative && /^topic_eng_theme[1-6]$/.test(topicId) ? 'en-US' as const : 'tr-TR' as const; // Stored theme narrations are English; alternative explanations remain Turkish.
    
    let failed=false;setVoiceError('');
    voiceService.current.setOptions({onError:(message)=>{failed=true;setVoiceError(message);setIsSpeaking(false);setIsPlaying(false);if(stepTimerRef.current)clearTimeout(stepTimerRef.current);}});
    // Seçilen sağlayıcı ve ses korunur.
    voiceService.current.speakManually(info.voiceNarration, lang, () => {
      setIsSpeaking(false);
      if(failed)return;
      // Ses tamamen bittikten sonra yalnız kısa bir doğal geçiş bırak.
      if (isPlayingRef.current) {
        stepTimerRef.current = setTimeout(() => {
          advanceNextStep();
        }, 120);
      }
    },undefined,()=>{
      // Generate only the next automatic step while the current audio is playing.
      if(failed||!isPlayingRef.current||!isVoiceEnabledRef.current)return;
      if(stepIndex>=3)return;
      const next=getStepInfo(stepIndex+1);
      if(next?.voiceNarration)void voiceService.current.prepareNarration(next.voiceNarration,lang);
    });
  };

  const togglePlay = () => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (isPlaying) {
      isPlayingRef.current=false;
      setIsPlaying(false);
      voiceService.current.stopSpeaking();
      setIsSpeaking(false);
    } else {
      isPlayingRef.current=true;
      setIsPlaying(true);
      lastNarrationKeyRef.current = '';
      speakStepNarration(activeStep);
    }
  };

  // Konu değiştiğinde durumu sıfırla (aynı anda ses başlatmayı engeller)
  useEffect(() => {
    if (prevTopicRef.current !== topicId) {
      prevTopicRef.current = topicId;
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      voiceService.current.stopSpeaking();
      setIsSpeaking(false);
      lastNarrationKeyRef.current = '';
      setActiveStep(0);
      isPlayingRef.current=false;
      setIsPlaying(false);
      setIsFolded(false);
      setAlgoStep(0);
      setActivePackageMode('standard');
      setAiPackage(null);
    }
  }, [topicId]);

  useEffect(()=>{isPlayingRef.current=false;setIsPlaying(false);setIsSpeaking(false);setActiveStep(0);voiceService.current.stopSpeaking();if(stepTimerRef.current)clearTimeout(stepTimerRef.current);lastNarrationKeyRef.current='';},[alternative]);

  // Adım, konu veya ses durumu değiştiğinde güvenli seslendirme tetikle
  useEffect(() => {
    const key = `${topicId}::${activeStep}::${activePackageMode}::${isVoiceEnabled}`;
    if (!isPlayingRef.current) { voiceService.current.stopSpeaking(); setIsSpeaking(false); return; }
    if (lastNarrationKeyRef.current === key) return;

    // React render döngüleri ve çift mount çağrılarını engelleyen kısa debounce
    const timer = setTimeout(() => {
      if (!isPlayingRef.current) return;
      lastNarrationKeyRef.current = key;
      speakStepNarration(activeStep);
    }, 70);

    return () => {
      clearTimeout(timer);
    };
  }, [topicId, activeStep, activePackageMode, isVoiceEnabled]);

  // Bileşen kapandığında sesi ve zamanlayıcıları durdur
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      voiceService.current.stopSpeaking();
    };
  }, []);

  const toggleVoice = () => {
    if (isVoiceEnabled) {
      voiceService.current.stopSpeaking();
      setIsSpeaking(false);
      setIsVoiceEnabled(false);
    } else {
      setIsVoiceEnabled(true);
      lastNarrationKeyRef.current = '';
      speakStepNarration(activeStep);
    }
  };

  const handleReplayVoice = () => {
    lastNarrationKeyRef.current = '';
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    voiceService.current.stopSpeaking();
    setIsSpeaking(true);
    setTimeout(() => {
      speakStepNarration(activeStep);
    }, 50);
  };

  // Yapay Zekâ Görsel Paketi Üreticisi (Pedagojik Fallback ile %100 Güvenli)
  const generateOfflineVisualPackage = (topId: string, topTitle: string, customPrompt?: string) => {
    const promptLabel = customPrompt?.trim() || topTitle;
    return {
      topicTitle: promptLabel,
      promptUsed: promptLabel,
      steps: [
        {
          title: '1. Kavramın Doğuşu & Model Tanımı',
          formula: `${promptLabel} Modeli`,
          explanation: `"${promptLabel}" konusunun temel bileşenleri ve başlangıç şartları görselleştiriliyor.`,
          voiceNarration: `${promptLabel} modelinde temel bileşenler, değişkenler ve başlangıç şartları incelenir.`
        },
        {
          title: '2. Kural, Formül & Dinamik İşleyiş',
          formula: 'f(x) ⇒ Bağıntı & Kural',
          explanation: `Değişkenlerin birbirini nasıl etkilediği ve kuralların uygulanış sırası adım adım gösterilir.`,
          voiceNarration: `Kural ve formül ilişkisinde değişkenler arasındaki etki-tepki zinciri takip edilir.`
        },
        {
          title: '3. Canlı Simülasyon & Değişken Deneyi',
          formula: 'Girdi ⇒ Süreç ⇒ Çıktı',
          explanation: `Sistem interaktif olarak çalıştırılıyor. Kuralların pratik doğrulaması yapılır.`,
          voiceNarration: `Simülasyon çalıştırıldığında parametre değişimlerinin sonucu nasıl doğruladığı gözlemlenir.`
        },
        {
          title: '4. Sınav Taktiği, Püf Nokta & Kazanım Özeti',
          formula: 'Hedef Soru Çözümü',
          explanation: `MEB sınavlarında en sık gelen soru tipi ve konunun en kritik püf noktası.`,
          voiceNarration: `Sınav sorularında hız kazandıracak kritik püf noktası ve çözüm taktiği özetlenir.`
        }
      ]
    };
  };

  const handleGenerateAiPackage = async (customPrompt?: string) => {
    setIsGeneratingAi(true);
    const promptText = customPrompt?.trim() || lecture.title;

    try {
      const response = await AiAdapter.request({
        role: 'subject_teacher',
        taskType: 'explanation',
        topicName: lecture.title,
        userMessage: `Lise 1 MEB müfredatına uygun "${promptText}" konusu için 4 adımlı görsel ve animasyonlu bir ders anlatım paketi oluştur. 
ÖNEMLİ KURAL: Kesinlikle "hoş geldin", "merhaba", "bu derste öğreneceğiz" gibi karşılama ve giriş cümleleri yazma. Doğrudan kuralı, adımı ve bilimsel formülü açıkla.
Yanıtını SADECE şu formatta geçerli bir JSON olarak ver:
{
  "topicTitle": "${promptText}",
  "steps": [
    {
      "title": "Adım Başlığı",
      "formula": "Formül veya kural",
      "explanation": "Öğrenciye yönelik açıklama",
      "voiceNarration": "Doğrudan kuralı anlatan seslendirme cümlesi"
    }
  ]
}`
      });

      let parsed: any = null;
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = null;
        }
      }

      if (!response.isFallback && parsed && Array.isArray(parsed.steps) && parsed.steps.length === 4 && parsed.steps.every((step:Record<string,unknown>)=>['title','formula','explanation','voiceNarration'].every(field=>typeof step[field]==='string'&&(step[field] as string).trim().length>0))) {
        setAiPackage({
          topicTitle: parsed.topicTitle || promptText,
          promptUsed: promptText,
          steps: parsed.steps.slice(0, 4)
        });
      } else {
        setVoiceError('Rehber geçerli bir ders paketi oluşturamadı. Mevcut ders anlatımıyla devam edebilirsin.');
        setShowAiModal(false);
        return;
      }

      setActivePackageMode('ai');
      setActiveStep(0);
      setShowAiModal(false);
    } catch {
      setVoiceError('Rehber bağlantısı kurulamadı; görsel paket oluşturulmadı.');
      setShowAiModal(false);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // -------------------------------------------------------------
  // 1. MATEMATİK: DENKLEMLER (Terazi & Adım Adım Denge Animasyonu)
  // -------------------------------------------------------------
  const renderEquationsBalance = () => {
    const steps = [
      {
        title: 'Başlangıç Hali',
        leftText: '3(2x - 4) + 5',
        rightText: '2x + 9',
        explanation: 'Eşitliğin her iki tarafı terazi gibi dengededir.',
        beamAngle: 0,
        leftGlow: false,
        rightGlow: false,
      },
      {
        title: '1. Adım: Parantezi Dağıt',
        leftText: '6x - 12 + 5',
        rightText: '2x + 9',
        explanation: '3 sayısı parantez içine dağıtıldı: 3·2x = 6x ve 3·(-4) = -12.',
        beamAngle: -2,
        leftGlow: true,
        rightGlow: false,
      },
      {
        title: '2. Adım: Sabitleri Sadeleştir',
        leftText: '6x - 7',
        rightText: '2x + 9',
        explanation: '-12 + 5 = -7 oldu. Şimdi x\'leri bir tarafa, sayıları diğer tarafa toplayacağız.',
        beamAngle: 2,
        leftGlow: true,
        rightGlow: true,
      },
      {
        title: '3. Adım: x\'i Yalnız Bırak & Sonuç',
        leftText: '4x',
        rightText: '16  ⇒  x = 4',
        explanation: '6x - 2x = 9 + 7 ⇒ 4x = 16 ve x = 4. Terazi tam dengede!',
        beamAngle: 0,
        leftGlow: true,
        rightGlow: true,
      }
    ];

    const cur = steps[activeStep] || steps[0];

    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge">
            <Sparkles size={14} /> İnteraktif Terazi Modeli
          </span>
          <div className="dp-vis-steps-pills">
            {steps.map((st, i) => (
              <button 
                key={i} 
                className={`dp-vis-pill-btn ${activeStep === i ? 'active' : ''}`}
                onClick={() => { setActiveStep(i); setIsPlaying(false); }}
              >
                {i + 1}. Adım
              </button>
            ))}
          </div>
        </div>

        {/* Terazi SVG */}
        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <defs>
              <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Stand / Taban */}
            <polygon points="270,225 330,225 310,130 290,130" fill="#64748b" />
            <rect x="250" y="222" width="100" height="12" rx="4" fill="#475569" />
            <circle cx="300" cy="125" r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />

            {/* Pivot & Eğimli Kol (Beam) */}
            <g transform={`rotate(${cur.beamAngle}, 300, 125)`} style={{ transition: 'transform 0.6s ease' }}>
              <rect x="80" y="122" width="440" height="8" rx="4" fill="url(#beamGrad)" />

              {/* Sol Kefe İpleri ve Tabağı */}
              <line x1="120" y1="126" x2="80" y2="175" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="120" y1="126" x2="160" y2="175" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
              <ellipse cx="120" cy="180" rx="65" ry="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />

              {/* Sağ Kefe İpleri ve Tabağı */}
              <line x1="480" y1="126" x2="440" y2="175" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="480" y1="126" x2="520" y2="175" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
              <ellipse cx="480" cy="180" rx="65" ry="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />

              {/* Sol Kefe İçeriği (Glow & Kutu) */}
              <g transform="translate(70, 142)">
                <rect 
                  x="0" y="0" width="100" height="34" rx="8" 
                  fill={cur.leftGlow ? '#1e3a8a' : '#0f172a'} 
                  stroke={cur.leftGlow ? '#60a5fa' : '#334155'} 
                  strokeWidth="2"
                  filter={cur.leftGlow ? 'url(#glowEffect)' : undefined}
                />
                <text x="50" y="22" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="bold">
                  {cur.leftText}
                </text>
              </g>

              {/* Sağ Kefe İçeriği */}
              <g transform="translate(430, 142)">
                <rect 
                  x="0" y="0" width="100" height="34" rx="8" 
                  fill={cur.rightGlow ? '#064e3b' : '#0f172a'} 
                  stroke={cur.rightGlow ? '#34d399' : '#334155'} 
                  strokeWidth="2"
                  filter={cur.rightGlow ? 'url(#glowEffect)' : undefined}
                />
                <text x="50" y="22" textAnchor="middle" fill="#4ade80" fontSize="13" fontWeight="bold">
                  {cur.rightText}
                </text>
              </g>

              {/* Eşitlik İşareti */}
              <circle cx="300" cy="95" r="16" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
              <text x="300" y="100" textAnchor="middle" fill="#fbbf24" fontSize="16" fontWeight="bold">=</text>
            </g>
          </svg>
        </div>

        {/* Açıklama ve Canlı Kontrol */}
        <div className="dp-vis-explanation-card">
          <div className="dp-vis-expl-title">
            <span className="dp-vis-step-tag">{cur.title}</span>
          </div>
          <p className="dp-vis-expl-text">{cur.explanation}</p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 2. MATEMATİK: KÜMELER (İnteraktif Venn Şeması)
  // -------------------------------------------------------------
  const renderSetsVenn = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge">
            <Layers size={14} /> İnteraktif Venn Şeması (A ve B Kümeleri)
          </span>
          <div className="dp-vis-button-group">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'union', label: 'A ∪ B (Birleşim)' },
              { id: 'intersection', label: 'A ∩ B (Kesişim)' },
              { id: 'diffA', label: 'A \\ B (Fark)' },
              { id: 'diffB', label: 'B \\ A (Fark)' },
            ].map((btn) => (
              <button 
                key={btn.id}
                className={`dp-vis-pill-btn ${selectedSubItem === btn.id ? 'active' : ''}`}
                onClick={() => setSelectedSubItem(btn.id)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <defs>
              <linearGradient id="setAGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="setBGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="intersectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Evrensel Küme E */}
            <rect x="40" y="20" width="520" height="200" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="65" y="48" fill="#94a3b8" fontSize="16" fontWeight="bold">E</text>

            {/* A Kümesi Dairesi */}
            <circle 
              cx="240" cy="120" r="85" 
              fill={selectedSubItem === 'union' || selectedSubItem === 'diffA' || selectedSubItem === 'all' ? 'url(#setAGrad)' : 'rgba(59, 130, 246, 0.1)'} 
              stroke="#3b82f6" strokeWidth={selectedSubItem === 'diffA' ? 4 : 2}
            />

            {/* B Kümesi Dairesi */}
            <circle 
              cx="360" cy="120" r="85" 
              fill={selectedSubItem === 'union' || selectedSubItem === 'diffB' || selectedSubItem === 'all' ? 'url(#setBGrad)' : 'rgba(16, 185, 129, 0.1)'} 
              stroke="#10b981" strokeWidth={selectedSubItem === 'diffB' ? 4 : 2}
            />

            {/* Kesişim Alanı Vurgusu (Overlap) */}
            {(selectedSubItem === 'intersection' || selectedSubItem === 'union' || selectedSubItem === 'all') && (
              <path 
                d="M 300 52 A 85 85 0 0 1 300 188 A 85 85 0 0 1 300 52 Z" 
                fill={selectedSubItem === 'intersection' ? 'url(#intersectGrad)' : 'rgba(245, 158, 11, 0.5)'}
                stroke="#f59e0b" strokeWidth={selectedSubItem === 'intersection' ? 3 : 1}
              />
            )}

            {/* Etiketler ve Örnek Sayılar */}
            <text x="195" y="75" fill="#60a5fa" fontSize="18" fontWeight="bold">A</text>
            <text x="195" y="125" fill="#ffffff" fontSize="15" fontWeight="bold">s(A\B) = 6</text>

            <text x="405" y="75" fill="#34d399" fontSize="18" fontWeight="bold">B</text>
            <text x="405" y="125" fill="#ffffff" fontSize="15" fontWeight="bold">s(B\A) = 8</text>

            <text x="300" y="125" textAnchor="middle" fill="#fef08a" fontSize="14" fontWeight="bold">
              s(A∩B) = 4
            </text>

            {/* Formül Gösterimi */}
            <rect x="140" y="185" width="320" height="28" rx="6" fill="#1e293b" stroke="#475569" />
            <text x="300" y="204" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">
              s(A ∪ B) = s(A) + s(B) - s(A ∩ B) = 10 + 12 - 4 = 18
            </text>
          </svg>
        </div>

        <div className="dp-vis-explanation-card">
          <p className="dp-vis-expl-text">
            {selectedSubItem === 'union' && 'Birleşim (A ∪ B): A veya B kümesindeki tüm elemanlar toplanır. Ortak elemanlar bir kez sayılır.'}
            {selectedSubItem === 'intersection' && 'Kesişim (A ∩ B): Hem A hem de B kümesinde aynı anda bulunan ortak elemanlardır.'}
            {selectedSubItem === 'diffA' && 'Fark (A \\ B): A kümesinde olup B kümesinde bulunmayan yalnız A\'ya ait elemanlardır.'}
            {selectedSubItem === 'diffB' && 'Fark (B \\ A): B kümesinde olup A kümesinde bulunmayan yalnız B\'ye ait elemanlardır.'}
            {selectedSubItem === 'all' && 'Şemadaki butonlara basarak Birleşim, Kesişim ve Fark bölgelerinin nasıl aydınlandığını inceleyin.'}
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 3. MATEMATİK: MUTLAK DEĞER (Sayı Doğrusu Animasyonu)
  // -------------------------------------------------------------
  const renderAbsoluteValueRuler = () => {
    const distance = Math.abs(sliderVal);

    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge">
            <Sliders size={14} /> Sayı Doğrusu ve Uzaklık Simülatörü
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nokta x:</span>
            <input 
              type="range" min="-8" max="8" value={sliderVal} 
              onChange={(e) => setSliderVal(parseInt(e.target.value))}
              className="dp-vis-slider"
            />
            <span className="badge badge-pekisiyor" style={{ minWidth: '40px', textAlign: 'center' }}>
              x = {sliderVal}
            </span>
          </div>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 200" className="dp-vis-svg">
            {/* Sayı Doğrusu Ana Çizgisi */}
            <line x1="40" y1="120" x2="560" y2="120" stroke="#64748b" strokeWidth="3" />
            <polygon points="565,120 555,115 555,125" fill="#64748b" />
            <polygon points="35,120 45,115 45,125" fill="#64748b" />

            {/* Cetvel Çizgileri (-8 to +8) */}
            {[-8, -6, -4, -2, 0, 2, 4, 6, 8].map((num) => {
              const xPos = 300 + num * 30;
              const isOrigin = num === 0;
              return (
                <g key={num}>
                  <line x1={xPos} y1={isOrigin ? 105 : 112} x2={xPos} y2={isOrigin ? 135 : 128} stroke={isOrigin ? '#f59e0b' : '#94a3b8'} strokeWidth={isOrigin ? 3 : 1.5} />
                  <text x={xPos} y="150" textAnchor="middle" fill={isOrigin ? '#fbbf24' : '#cbd5e1'} fontSize={isOrigin ? '14' : '11'} fontWeight={isOrigin ? 'bold' : 'normal'}>
                    {num}
                  </text>
                </g>
              );
            })}

            {/* 0 (Başlangıç) Noktası Vurgusu */}
            <circle cx="300" cy="120" r="6" fill="#f59e0b" />

            {/* Seçilen x Noktası */}
            {sliderVal !== 0 && (
              <g>
                {/* Uzaklık Yayı / Oku */}
                <path 
                  d={`M 300 95 Q ${(300 + (300 + sliderVal * 30)) / 2} 45 ${300 + sliderVal * 30} 95`} 
                  fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="5,3" 
                />
                <circle cx={300 + sliderVal * 30} cy="120" r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <text x={(300 + (300 + sliderVal * 30)) / 2} y="55" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="bold">
                  |{sliderVal}| = {distance} birim
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="dp-vis-explanation-card">
          <p className="dp-vis-expl-text">
            <strong>Tanım:</strong> Bir sayının 0 noktasına (orijine) olan <strong>fiziksel uzaklığına</strong> mutlak değer denir. Uzaklık hiçbir zaman negatif olamaz. Bu nedenle |-5| = 5 ve |+5| = 5'tir.
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 4. MATEMATİK: ÜÇGENDE AÇILAR (180 Derece İspat Animasyonu)
  // -------------------------------------------------------------
  const renderTriangleAngles = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge">
            <Compass size={14} /> Üçgende İç Açılar Toplamı (180° İspatı)
          </span>
          <div className="dp-vis-button-group">
            <button 
              className={`dp-vis-pill-btn ${!isFolded ? 'active' : ''}`}
              onClick={() => setIsFolded(false)}
            >
              <Eye size={13} /> 1. Üçgen Görünümü
            </button>
            <button 
              className={`dp-vis-pill-btn ${isFolded ? 'active' : ''}`}
              onClick={() => setIsFolded(true)}
            >
              <Sparkles size={13} /> 2. Köşeleri Birleştir (180° Doğru Açı)
            </button>
          </div>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            {!isFolded ? (
              // Üçgen Durumu
              <g>
                <polygon points="300,40 140,200 460,200" fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="3" />
                
                {/* Köşe Açı Yayları */}
                <path d="M 285 65 A 30 30 0 0 0 315 65" fill="none" stroke="#ef4444" strokeWidth="3" />
                <text x="300" y="85" textAnchor="middle" fill="#f87171" fontSize="14" fontWeight="bold">A (60°)</text>

                <path d="M 175 195 A 35 35 0 0 0 160 170" fill="none" stroke="#10b981" strokeWidth="3" />
                <text x="180" y="185" fill="#34d399" fontSize="14" fontWeight="bold">B (60°)</text>

                <path d="M 425 195 A 35 35 0 0 1 440 170" fill="none" stroke="#f59e0b" strokeWidth="3" />
                <text x="390" y="185" fill="#fbbf24" fontSize="14" fontWeight="bold">C (60°)</text>
              </g>
            ) : (
              // Birleşmiş 180° Doğru Açı Durumu
              <g>
                {/* Taban Doğrusu */}
                <line x1="80" y1="160" x2="520" y2="160" stroke="#64748b" strokeWidth="3" />
                
                {/* 3 Açının Birleşimi (Yarım Daire) */}
                <path d="M 220 160 A 80 80 0 0 1 260 90" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="3" />
                <path d="M 260 90 A 80 80 0 0 1 340 90" fill="rgba(16, 185, 129, 0.4)" stroke="#10b981" strokeWidth="3" />
                <path d="M 340 90 A 80 80 0 0 1 380 160" fill="rgba(245, 158, 11, 0.4)" stroke="#f59e0b" strokeWidth="3" />

                <circle cx="300" cy="160" r="5" fill="#ffffff" />
                <text x="235" y="130" fill="#f87171" fontSize="13" fontWeight="bold">A</text>
                <text x="300" y="110" textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="bold">B</text>
                <text x="360" y="130" fill="#fbbf24" fontSize="13" fontWeight="bold">C</text>

                <text x="300" y="60" textAnchor="middle" fill="#38bdf8" fontSize="18" fontWeight="bold">
                  A + B + C = 180° (Doğru Açı)
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="dp-vis-explanation-card">
          <p className="dp-vis-expl-text">
            Bir üçgenin iç açıları hangi biçimde olursa olsun, üç köşeyi kestiğinizde ve yan yana koyduğunuzda kusursuz bir doğru açı (180°) meydana gelir.
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 5. MATEMATİK: MANTIK & ELEKTRİK DEVRESİ (VE / VEYA Devresi)
  // -------------------------------------------------------------
  const renderLogicCircuit = () => {
    const isBulbLit = circuitMode === 'and' 
      ? (circuitSwitches.p && circuitSwitches.q)
      : (circuitSwitches.p || circuitSwitches.q);

    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge">
            <Zap size={14} /> Mantık Kapıları & Elektrik Devresi Simülatörü
          </span>
          <div className="dp-vis-button-group">
            <button 
              className={`dp-vis-pill-btn ${circuitMode === 'and' ? 'active' : ''}`}
              onClick={() => setCircuitMode('and')}
            >
              p ∧ q (Seri Devre)
            </button>
            <button 
              className={`dp-vis-pill-btn ${circuitMode === 'or' ? 'active' : ''}`}
              onClick={() => setCircuitMode('or')}
            >
              p ∨ q (Paralel Devre)
            </button>
          </div>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            {/* Pil / Güç Kaynağı */}
            <rect x="60" y="100" width="30" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <line x1="75" y1="80" x2="75" y2="100" stroke="#e2e8f0" strokeWidth="3" />
            <line x1="75" y1="140" x2="75" y2="180" stroke="#e2e8f0" strokeWidth="3" />
            <text x="75" y="125" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">Pil</text>

            {/* Üst ve Alt Hat */}
            <line x1="75" y1="80" x2="160" y2="80" stroke="#e2e8f0" strokeWidth="3" />
            <line x1="75" y1="180" x2="480" y2="180" stroke="#e2e8f0" strokeWidth="3" />

            {circuitMode === 'and' ? (
              // SERİ DEVRE (p ve q)
              <g>
                {/* Anahtar p */}
                <line x1="160" y1="80" x2="210" y2="80" stroke="#e2e8f0" strokeWidth="3" />
                <line 
                  x1="210" y1="80" 
                  x2="250" y2={circuitSwitches.p ? 80 : 60} 
                  stroke={circuitSwitches.p ? '#10b981' : '#ef4444'} 
                  strokeWidth="4" 
                />
                <circle cx="210" cy="80" r="4" fill="#ffffff" />
                <circle cx="250" cy="80" r="4" fill="#ffffff" />
                <text x="230" y="55" fill="#38bdf8" fontSize="13" fontWeight="bold">p = {circuitSwitches.p ? 1 : 0}</text>

                {/* Anahtar q */}
                <line x1="250" y1="80" x2="310" y2="80" stroke="#e2e8f0" strokeWidth="3" />
                <line 
                  x1="310" y1="80" 
                  x2="350" y2={circuitSwitches.q ? 80 : 60} 
                  stroke={circuitSwitches.q ? '#10b981' : '#ef4444'} 
                  strokeWidth="4" 
                />
                <circle cx="310" cy="80" r="4" fill="#ffffff" />
                <circle cx="350" cy="80" r="4" fill="#ffffff" />
                <text x="330" y="55" fill="#34d399" fontSize="13" fontWeight="bold">q = {circuitSwitches.q ? 1 : 0}</text>

                <line x1="350" y1="80" x2="480" y2="80" stroke="#e2e8f0" strokeWidth="3" />
              </g>
            ) : (
              // PARALEL DEVRE (p veya q)
              <g>
                <line x1="160" y1="80" x2="160" y2="50" stroke="#e2e8f0" strokeWidth="3" />
                <line x1="160" y1="80" x2="160" y2="110" stroke="#e2e8f0" strokeWidth="3" />

                {/* Üst Kol (p) */}
                <line x1="160" y1="50" x2="230" y2="50" stroke="#e2e8f0" strokeWidth="3" />
                <line x1="230" y1="50" x2="270" y2={circuitSwitches.p ? 50 : 35} stroke={circuitSwitches.p ? '#10b981' : '#ef4444'} strokeWidth="4" />
                <circle cx="230" cy="50" r="4" fill="#ffffff" />
                <circle cx="270" cy="50" r="4" fill="#ffffff" />
                <line x1="270" y1="50" x2="340" y2="50" stroke="#e2e8f0" strokeWidth="3" />

                {/* Alt Kol (q) */}
                <line x1="160" y1="110" x2="230" y2="110" stroke="#e2e8f0" strokeWidth="3" />
                <line x1="230" y1="110" x2="270" y2={circuitSwitches.q ? 110 : 95} stroke={circuitSwitches.q ? '#10b981' : '#ef4444'} strokeWidth="4" />
                <circle cx="230" cy="110" r="4" fill="#ffffff" />
                <circle cx="270" cy="110" r="4" fill="#ffffff" />
                <line x1="270" y1="110" x2="340" y2="110" stroke="#e2e8f0" strokeWidth="3" />

                <line x1="340" y1="50" x2="340" y2="80" stroke="#e2e8f0" strokeWidth="3" />
                <line x1="340" y1="110" x2="340" y2="80" stroke="#e2e8f0" strokeWidth="3" />
                <line x1="340" y1="80" x2="480" y2="80" stroke="#e2e8f0" strokeWidth="3" />
              </g>
            )}

            {/* Lamba / Ampul */}
            <line x1="480" y1="80" x2="480" y2="110" stroke="#e2e8f0" strokeWidth="3" />
            <line x1="480" y1="150" x2="480" y2="180" stroke="#e2e8f0" strokeWidth="3" />
            <circle cx="480" cy="130" r="20" fill={isBulbLit ? '#fbbf24' : '#334155'} stroke={isBulbLit ? '#f59e0b' : '#64748b'} strokeWidth="3" filter={isBulbLit ? 'url(#glowEffect)' : undefined} />
            <text x="480" y="135" textAnchor="middle" fill={isBulbLit ? '#78350f' : '#cbd5e1'} fontSize="14" fontWeight="bold">💡</text>
          </svg>
        </div>

        {/* Canlı Anahtar Düğmeleri */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '10px 0' }}>
          <button 
            className={`btn ${circuitSwitches.p ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setCircuitSwitches(prev => ({ ...prev, p: !prev.p }))}
          >
            p Anahtarını {circuitSwitches.p ? 'AÇ (0 Yap)' : 'KAPAT (1 Yap)'}
          </button>
          <button 
            className={`btn ${circuitSwitches.q ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setCircuitSwitches(prev => ({ ...prev, q: !prev.q }))}
          >
            q Anahtarını {circuitSwitches.q ? 'AÇ (0 Yap)' : 'KAPAT (1 Yap)'}
          </button>
        </div>

        <div className="dp-vis-explanation-card">
          <p className="dp-vis-expl-text">
            {circuitMode === 'and' ? (
              <span><strong>VE (∧) Bağlacı:</strong> Lambanın yanması (1 olması) için <strong>her iki anahtarın da kapalı (1)</strong> olması zorunludur. (1 ∧ 1 = 1, diğer tüm durumlar 0'dır).</span>
            ) : (
              <span><strong>VEYA (∨) Bağlacı:</strong> Lambanın yanması için <strong>en az bir anahtarın kapalı (1)</strong> olması yeterlidir. (0 ∨ 0 = 0, diğer tüm durumlar 1'dir).</span>
            )}
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 6. FİZİK: MADDE VE ÖZKÜTLE (Arşimet Taşırma Kabı Simülasyonu)
  // -------------------------------------------------------------
  const renderDensitySimulation = () => {
    const materials = {
      iron: { name: 'Demir', mass: 156, volume: 20, density: 7.8, sinks: true, color: '#94a3b8' },
      wood: { name: 'Tahta', mass: 12, volume: 20, density: 0.6, sinks: false, color: '#d97706' },
      gold: { name: 'Altın', mass: 386, volume: 20, density: 19.3, sinks: true, color: '#f59e0b' }
    };
    const curMat = materials[material];

    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge">
            <Compass size={14} /> Özkütle & Arşimet Taşırma Kabı (d = m / V)
          </span>
          <div className="dp-vis-button-group">
            {(['iron', 'wood', 'gold'] as const).map((mKey) => (
              <button 
                key={mKey}
                className={`dp-vis-pill-btn ${material === mKey ? 'active' : ''}`}
                onClick={() => setMaterial(mKey)}
              >
                {materials[mKey].name}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 220" className="dp-vis-svg">
            {/* Dereceli Silindir (Taşırma Kabı) */}
            <rect x="180" y="40" width="100" height="150" rx="4" fill="none" stroke="#94a3b8" strokeWidth="3" />
            {/* Su Dolu Kısım */}
            <rect x="182" y="90" width="96" height="98" fill="rgba(56, 189, 248, 0.4)" />
            {/* Taşırma Borusu */}
            <path d="M 280 85 L 340 120" stroke="#94a3b8" strokeWidth="4" fill="none" />

            {/* İçindeki Cisim */}
            <rect 
              x="215" 
              y={curMat.sinks ? 150 : 85} 
              width="30" height="30" rx="4" 
              fill={curMat.color} stroke="#ffffff" strokeWidth="1.5"
              style={{ transition: 'all 0.5s ease' }}
            />

            {/* Dijital Terazi */}
            <rect x="380" y="140" width="140" height="50" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x="450" y="165" textAnchor="middle" fill="#38bdf8" fontSize="16" fontWeight="bold">
              Kütle: {curMat.mass} g
            </text>
            <text x="450" y="182" textAnchor="middle" fill="#94a3b8" fontSize="11">
              Hacim: {curMat.volume} cm³
            </text>

            {/* Hesaplama Kutusu */}
            <rect x="60" y="50" width="100" height="60" rx="6" fill="#0f172a" stroke="#334155" />
            <text x="110" y="75" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">d = m / V</text>
            <text x="110" y="98" textAnchor="middle" fill="#4ade80" fontSize="13" fontWeight="bold">
              {curMat.density} g/cm³
            </text>
          </svg>
        </div>

        <div className="dp-vis-explanation-card">
          <p className="dp-vis-expl-text">
            <strong>Suyun özkütlesi 1 g/cm³'tür:</strong> {curMat.name} cisminin özkütlesi ({curMat.density} g/cm³), 
            sudan {curMat.sinks ? 'büyük olduğu için batar.' : 'küçük olduğu için yüzer.'}
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 7. BİLİŞİM: ALGORİTMA VE AKIŞ ŞEMASI (Flowchart Engine)
  // -------------------------------------------------------------
  const renderFlowchartSimulator = () => {
    const isEven = algoInput % 2 === 0;

    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge">
            <Compass size={14} /> İnteraktif Algoritma & Akış Şeması
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Girdi Sayısı:</span>
            <input 
              type="number" value={algoInput} 
              onChange={(e) => { setAlgoInput(parseInt(e.target.value) || 0); setAlgoStep(0); }}
              style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#1e293b', color: '#fff' }}
            />
            <button 
              className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => setAlgoStep((prev) => (prev + 1) % 4)}
            >
              Adım İlerlet (Adım {algoStep + 1}/4)
            </button>
          </div>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 230" className="dp-vis-svg">
            {/* 1. Başla (Elips) */}
            <rect x="60" y="95" width="80" height="40" rx="20" fill={algoStep === 0 ? '#2563eb' : '#1e293b'} stroke="#60a5fa" strokeWidth="2" />
            <text x="100" y="120" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">Başla</text>

            <line x1="140" y1="115" x2="190" y2="115" stroke="#64748b" strokeWidth="2" />

            {/* 2. Girdi (Paralelkenar) */}
            <polygon points="200,95 280,95 260,135 180,135" fill={algoStep === 1 ? '#2563eb' : '#1e293b'} stroke="#60a5fa" strokeWidth="2" />
            <text x="230" y="120" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">Sayı = {algoInput}</text>

            <line x1="270" y1="115" x2="320" y2="115" stroke="#64748b" strokeWidth="2" />

            {/* 3. Karar / Eşkenar Dörtgen */}
            <polygon points="370,80 430,115 370,150 310,115" fill={algoStep === 2 ? '#f59e0b' : '#1e293b'} stroke="#fbbf24" strokeWidth="2" />
            <text x="370" y="118" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">Sayı % 2 == 0?</text>

            {/* Çıkış Dalları */}
            <line x1="430" y1="115" x2="490" y2={isEven ? 70 : 160} stroke="#64748b" strokeWidth="2" />
            
            {/* 4. Sonuç (Çift / Tek) */}
            <rect x="490" y="50" width="80" height="35" rx="6" fill={algoStep === 3 && isEven ? '#10b981' : '#1e293b'} stroke="#34d399" strokeWidth="2" />
            <text x="530" y="72" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">"Çift Sayı"</text>

            <rect x="490" y="145" width="80" height="35" rx="6" fill={algoStep === 3 && !isEven ? '#10b981' : '#1e293b'} stroke="#34d399" strokeWidth="2" />
            <text x="530" y="167" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">"Tek Sayı"</text>
          </svg>
        </div>

        <div className="dp-vis-explanation-card">
          <p className="dp-vis-expl-text">
            Bilgisayar algoritmaları veriyi adım adım işler: Sayı 2'ye tam bölünüyorsa <strong>Çift</strong>, kalan 1 ise <strong>Tek</strong> dalından devam eder.
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 8. COĞRAFYA: KOORDİNAT SİSTEMİ & DÖNEN YERKÜRE
  // -------------------------------------------------------------
  const renderGlobeCoordinates = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge">
            <Compass size={14} /> 3D Görünümlü Yerküre & Koordinat Sistemi
          </span>
          <span style={{ fontSize: '0.85rem', color: '#38bdf8' }}>Türkiye: 36°-42° Kuzey, 26°-45° Doğu</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 230" className="dp-vis-svg">
            {/* Dış Uzay ve Işık */}
            <circle cx="300" cy="115" r="95" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            
            {/* Yerküre Dairesi */}
            <circle cx="300" cy="115" r="90" fill="#1e3a8a" />

            {/* Paraleller (Enlemler) */}
            <ellipse cx="300" cy="115" rx="90" ry="1" stroke="#f59e0b" strokeWidth="2.5" /> {/* Ekvator */}
            <text x="405" y="119" fill="#f59e0b" fontSize="11" fontWeight="bold">Ekvator (0°)</text>

            <ellipse cx="300" cy="75" rx="78" ry="1" stroke="#93c5fd" strokeWidth="1" strokeDasharray="3,3" />
            <ellipse cx="300" cy="155" rx="78" ry="1" stroke="#93c5fd" strokeWidth="1" strokeDasharray="3,3" />

            {/* Meridyenler (Boylamlar) */}
            <ellipse cx="300" cy="115" rx="1" ry="90" stroke="#34d399" strokeWidth="2.5" /> {/* Greenwich */}
            <text x="300" y="22" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">Greenwich (0°)</text>

            <ellipse cx="300" cy="115" rx="45" ry="90" stroke="#6ee7b7" strokeWidth="1" strokeDasharray="3,3" />
            <ellipse cx="300" cy="115" rx="75" ry="90" stroke="#6ee7b7" strokeWidth="1" strokeDasharray="3,3" />

            {/* Türkiye İşareti */}
            <circle cx="320" cy="95" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <text x="330" y="90" fill="#f87171" fontSize="11" fontWeight="bold">Türkiye</text>
          </svg>
        </div>

        <div className="dp-vis-explanation-card">
          <p className="dp-vis-expl-text">
            <strong>Ekvator</strong> dünyayı Kuzey ve Güney Yarımküreye bölerken, <strong>Greenwich</strong> Doğu ve Batı Yarımküreye ayırır.
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 9. GENEL / TÜM DİĞER DERSLER İÇİN ANİMASYONLU KAVRAM HARİTASI
  // -------------------------------------------------------------
  const renderGenericConceptMap = () => {
    const formulas = lecture.formulasOrRules || [];
    const kp = lecture.keyPoints || [];
    const worked = lecture.workedExample;

    const stepNodes = [
      { id: 0, title: '1. Temel Tanım', label: 'Kavram & Kapsam', color: '#3b82f6', icon: '📘' },
      { id: 1, title: '2. Kural & Formül', label: formulas[0]?.title || 'Temel Bağıntı', color: '#10b981', icon: '⚡' },
      { id: 2, title: '3. Püf Noktası', label: 'Sınav Taktiği', color: '#8b5cf6', icon: '🎯' },
      { id: 3, title: '4. Örnek Çözüm', label: 'Uygulama', color: '#f59e0b', icon: '✍️' }
    ];

    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
            <Sparkles size={14} /> {lecture.unit || 'MEB Müfredatı'}: {lecture.title}
          </span>
          <div className="dp-vis-steps-pills">
            {stepNodes.map((node) => (
              <button 
                key={node.id} 
                className={`dp-vis-pill-btn ${activeStep === node.id ? 'active' : ''}`}
                style={activeStep === node.id ? { background: node.color, borderColor: node.color, color: '#fff' } : {}}
                onClick={() => { setActiveStep(node.id); setIsPlaying(false); }}
              >
                {node.icon} {node.title}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* 4 Adımlı İlerleme Düğümleri */}
            {stepNodes.map((node, i) => {
              const xPos = 65 + i * 135;
              const isCur = activeStep === i;
              const isPast = activeStep > i;

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${xPos}, 45)`} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setActiveStep(node.id); setIsPlaying(false); }}
                >
                  {/* Bağlantı Çizgisi */}
                  {i < 3 && (
                    <line 
                      x1="90" y1="20" x2="135" y2="20" 
                      stroke={isPast ? '#10b981' : '#334155'} 
                      strokeWidth="2.5" 
                      strokeDasharray={isPast ? 'none' : '3,3'} 
                    />
                  )}

                  {/* Adım Kartı */}
                  <rect 
                    x="0" y="0" width="95" height="42" rx="8" 
                    fill={isCur ? node.color : '#1e293b'} 
                    stroke={isCur ? '#ffffff' : isPast ? '#10b981' : '#334155'} 
                    strokeWidth={isCur ? 2 : 1.5} 
                  />
                  <text x="47" y="18" textAnchor="middle" fill={isCur ? '#ffffff' : '#94a3b8'} fontSize="10" fontWeight="bold">
                    {node.title}
                  </text>
                  <text x="47" y="32" textAnchor="middle" fill={isCur ? '#ffffff' : '#cbd5e1'} fontSize="9">
                    {node.label.length > 13 ? node.label.substring(0, 11) + '…' : node.label}
                  </text>
                </g>
              );
            })}

            {/* Merkez Dinamik Bilgi Paneli */}
            <g transform="translate(45, 105)">
              <rect 
                x="0" y="0" width="510" height="100" rx="10" 
                fill="#131b2e" 
                stroke={stepNodes[activeStep]?.color || '#3b82f6'} 
                strokeWidth="2" 
              />

              {activeStep === 0 && (
                <>
                  <text x="25" y="30" fill="#38bdf8" fontSize="12" fontWeight="bold">📘 1. ADIM: TEMEL KAVRAM & TANIM</text>
                  <text x="25" y="55" fill="#f8fafc" fontSize="12" fontWeight="500">
                    {lecture.title}
                  </text>
                  <text x="25" y="80" fill="#94a3b8" fontSize="11">
                    {lecture.summary?.length > 70 ? lecture.summary.substring(0, 68) + '…' : lecture.summary}
                  </text>
                </>
              )}

              {activeStep === 1 && (
                <>
                  <text x="25" y="30" fill="#34d399" fontSize="12" fontWeight="bold">⚡ 2. ADIM: FORMÜL VE KURAL BAĞINTISI</text>
                  <text x="25" y="55" fill="#fbbf24" fontSize="13" fontWeight="bold">
                    {formulas[0]?.title || 'Temel Kural'}: {formulas[0]?.content || kp[0] || 'Kural bağıntısı'}
                  </text>
                  <text x="25" y="80" fill="#cbd5e1" fontSize="11">
                    {formulas[1]?.content ? `Ek Kural: ${formulas[1].content}` : 'Sorularda formülü doğrudan uygulayarak çözüme ulaşın.'}
                  </text>
                </>
              )}

              {activeStep === 2 && (
                <>
                  <text x="25" y="30" fill="#c084fc" fontSize="12" fontWeight="bold">🎯 3. ADIM: KRİTİK SINAV PÜF NOKTASI</text>
                  <text x="25" y="55" fill="#ffffff" fontSize="12" fontWeight="500">
                    {kp[1] || kp[0] || 'Tüm soru tiplerinde temel ilkelere dikkat edin.'}
                  </text>
                  <text x="25" y="80" fill="#f472b6" fontSize="11" fontWeight="bold">
                    ⚠️ Sık Yapılan Hata: İşaret veya öncül atlamamaya dikkat edin!
                  </text>
                </>
              )}

              {activeStep === 3 && (
                <>
                  <text x="25" y="30" fill="#fbbf24" fontSize="12" fontWeight="bold">✍️ 4. ADIM: ÖRNEK SORU VE ADIM ADIM ÇÖZÜM</text>
                  <text x="25" y="55" fill="#ffffff" fontSize="11">
                    {worked?.question ? (worked.question.length > 70 ? worked.question.substring(0, 68) + '…' : worked.question) : 'Örnek soru uygulaması.'}
                  </text>
                  <text x="25" y="80" fill="#34d399" fontSize="11" fontWeight="bold">
                    {worked?.solutionSteps?.[0] ? (worked.solutionSteps[0].length > 70 ? worked.solutionSteps[0].substring(0, 68) + '…' : worked.solutionSteps[0]) : 'Çözüm adımı uygulanıyor.'}
                  </text>
                </>
              )}
            </g>
          </svg>
        </div>

        <div className="dp-vis-explanation-card">
          <p className="dp-vis-expl-text">
            <strong>{stepNodes[activeStep]?.title}:</strong> {activeStep === 0 ? lecture.summary : activeStep === 1 ? (formulas[0]?.content || kp[0]) : activeStep === 2 ? (kp[1] || kp[0]) : (worked?.solutionSteps?.join(' ') || worked?.question || lecture.summary)}
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 10. YAPAY ZEKÂ ÜRETIMLI DİNAMİK GÖRSEL PAKET RENDERERI
  // -------------------------------------------------------------
  const renderAiGeneratedPackage = () => {
    if (!aiPackage) return null;
    const cur = aiPackage.steps[activeStep] || aiPackage.steps[0];

    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
            <Sparkles size={14} /> ders rehberi Paketi: {aiPackage.topicTitle}
          </span>
          <div className="dp-vis-steps-pills">
            {aiPackage.steps.map((st, i) => (
              <button 
                key={i} 
                className={`dp-vis-pill-btn ${activeStep === i ? 'active' : ''}`}
                style={activeStep === i ? { background: '#7c3aed', borderColor: '#6d28d9' } : {}}
                onClick={() => { setActiveStep(i); setIsPlaying(false); }}
              >
                {i + 1}. Adım
              </button>
            ))}
          </div>
        </div>

        {/* AI SVG Animasyon Sahnesi */}
        <div className="dp-svg-canvas-wrapper" style={{ borderColor: '#4c1d95' }}>
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <defs>
              <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            {/* Dış Bilimsel Çerçeve & Koordinat Grid */}
            <rect x="20" y="20" width="560" height="200" rx="16" fill="#0b0f19" stroke="#334155" strokeWidth="1.5" />
            <line x1="20" y1="120" x2="580" y2="120" stroke="#1e293b" strokeDasharray="4,4" />
            <line x1="300" y1="20" x2="300" y2="220" stroke="#1e293b" strokeDasharray="4,4" />

            {/* Adım 1: Kavram Düğümü */}
            <g transform="translate(100, 120)">
              <circle cx="0" cy="0" r={activeStep === 0 ? 38 : 28} fill={activeStep === 0 ? 'url(#aiGrad)' : '#1e293b'} stroke="#8b5cf6" strokeWidth={activeStep === 0 ? 3 : 1.5} />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">1. Kavram</text>
            </g>

            {/* Bağlantı Oku 1-2 */}
            <line x1="140" y1="120" x2="200" y2="120" stroke={activeStep >= 1 ? '#a855f7' : '#334155'} strokeWidth="2.5" markerEnd="url(#arrow)" />

            {/* Adım 2: Formül & Kural */}
            <g transform="translate(240, 120)">
              <rect x="-35" y="-28" width="70" height="56" rx="10" fill={activeStep === 1 ? 'url(#aiGrad)' : '#1e293b'} stroke="#ec4899" strokeWidth={activeStep === 1 ? 3 : 1.5} />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">2. Formül</text>
            </g>

            {/* Bağlantı Oku 2-3 */}
            <line x1="280" y1="120" x2="330" y2="120" stroke={activeStep >= 2 ? '#ec4899' : '#334155'} strokeWidth="2.5" />

            {/* Adım 3: Deney & Simülasyon */}
            <g transform="translate(370, 120)">
              <polygon points="0,-32 30,22 -30,22" fill={activeStep === 2 ? 'url(#aiGrad)' : '#1e293b'} stroke="#3b82f6" strokeWidth={activeStep === 2 ? 3 : 1.5} />
              <text x="0" y="10" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">3. Deney</text>
            </g>

            {/* Bağlantı Oku 3-4 */}
            <line x1="405" y1="120" x2="465" y2="120" stroke={activeStep >= 3 ? '#3b82f6' : '#334155'} strokeWidth="2.5" />

            {/* Adım 4: Sınav Taktiği & Sonuç */}
            <g transform="translate(500, 120)">
              <circle cx="0" cy="0" r={activeStep === 3 ? 38 : 28} fill={activeStep === 3 ? '#10b981' : '#1e293b'} stroke="#34d399" strokeWidth={activeStep === 3 ? 3 : 1.5} />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">4. Sonuç</text>
            </g>

            {/* Alt Kural ve Formül Bandı */}
            <rect x="40" y="180" width="520" height="30" rx="8" fill="rgba(139, 92, 246, 0.15)" stroke="#6366f1" strokeWidth="1" />
            <text x="300" y="200" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              💡 {cur.formula}
            </text>
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 11. KİMYA: BOHR ATOM MODELİ & KATMAN ELEKTRON DAĞILIMI
  // -------------------------------------------------------------
  const renderChemistryAtom = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            ⚛️ Kimya: Bohr Atom Modeli & Katman Dağılımı (Sodyum - ₁₁Na)
          </span>
          <div className="dp-vis-button-group">
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Çekirdek: 11p⁺, 12n⁰ | Katmanlar: 2, 8, 1</span>
          </div>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <defs>
              <radialGradient id="nucleusGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="70%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </radialGradient>
            </defs>

            {/* Arka Plan Grid */}
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* Sol Periyodik Tablo Kartı */}
            <g transform="translate(45, 45)">
              <rect x="0" y="0" width="90" height="110" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
              <text x="45" y="22" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="bold">11</text>
              <text x="45" y="58" textAnchor="middle" fill="#ffffff" fontSize="28" fontWeight="900">Na</text>
              <text x="45" y="80" textAnchor="middle" fill="#cbd5e1" fontSize="11">Sodyum</text>
              <text x="45" y="98" textAnchor="middle" fill="#64748b" fontSize="10">22.99</text>
            </g>

            {/* Merkez Çekirdek (Proton & Nötron) */}
            <g transform="translate(350, 120)">
              {/* 3. Katman (M Katmanı: 1 Değerlik Elektronu) */}
              <circle cx="0" cy="0" r="85" fill="none" stroke={activeStep >= 2 ? '#f59e0b' : '#334155'} strokeWidth="1.5" strokeDasharray={activeStep === 2 ? 'none' : '3,3'} />
              {/* M Katmanı Elektronu */}
              <circle cx="0" cy="-85" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="12" y="-85" fill="#f59e0b" fontSize="10" fontWeight="bold">e⁻ (Değerlik)</text>

              {/* 2. Katman (L Katmanı: 8 Elektron) */}
              <circle cx="0" cy="0" r="58" fill="none" stroke={activeStep >= 1 ? '#3b82f6' : '#334155'} strokeWidth="1.5" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, idx) => {
                const rad = (ang * Math.PI) / 180;
                return <circle key={idx} cx={Math.cos(rad) * 58} cy={Math.sin(rad) * 58} r="4" fill="#60a5fa" />;
              })}

              {/* 1. Katman (K Katmanı: 2 Elektron) */}
              <circle cx="0" cy="0" r="32" fill="none" stroke={activeStep >= 0 ? '#10b981' : '#334155'} strokeWidth="1.5" />
              <circle cx="-32" cy="0" r="4" fill="#34d399" />
              <circle cx="32" cy="0" r="4" fill="#34d399" />

              {/* Çekirdek */}
              <circle cx="0" cy="0" r="18" fill="url(#nucleusGrad)" stroke="#fca5a5" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">11p⁺</text>
            </g>

            {/* Sağ Bilgi Açıklaması */}
            <g transform="translate(470, 60)">
              <text x="0" y="20" fill="#38bdf8" fontSize="12" fontWeight="bold">Katman Dağılımı:</text>
              <text x="0" y="42" fill="#e2e8f0" fontSize="13">K : 2 e⁻</text>
              <text x="0" y="62" fill="#e2e8f0" fontSize="13">L : 8 e⁻</text>
              <text x="0" y="82" fill="#f59e0b" fontSize="13" fontWeight="bold">M : 1 e⁻ (3. Periyot, 1A)</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 12. BİYOLOJİ: HÜCRE ZARI, ÇEKİRDEK & DNA SARMALI
  // -------------------------------------------------------------
  const renderBiologyCell = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            🔬 Biyoloji: Ökaryot Canlı Hücresi & DNA Sarmalı
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Zar, Çekirdek, Mitokondri (ATP), Ribozom</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <defs>
              <linearGradient id="cellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#064e3b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#022c22" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* Hücre Zarı ve Sitoplazma */}
            <ellipse cx="260" cy="120" rx="190" ry="85" fill="url(#cellGrad)" stroke="#10b981" strokeWidth="3" />
            <text x="90" y="65" fill="#34d399" fontSize="11" fontWeight="bold">Hücre Zarı (Fosfolipid Çift Kat)</text>

            {/* Çekirdek ve DNA */}
            <circle cx="230" cy="120" r="45" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2.5" />
            <text x="230" y="105" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">Çekirdek</text>
            
            {/* Dönen DNA Sarmal Temsili */}
            <path d="M 215 115 Q 230 100, 245 115 T 215 135" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            <path d="M 245 115 Q 230 130, 215 115 T 245 135" fill="none" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Mitokondri (ATP Fabrikası) */}
            <g transform="translate(360, 85)">
              <ellipse cx="0" cy="0" rx="30" ry="16" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
              <path d="M -20 0 Q -10 -8, 0 0 T 20 0" fill="none" stroke="#fca5a5" strokeWidth="1.5" />
              <text x="0" y="28" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">Mitokondri (ATP)</text>
            </g>

            {/* Ribozomlar (Küçük protein noktacıkları) */}
            <circle cx="160" cy="140" r="3" fill="#a78bfa" />
            <circle cx="180" cy="160" r="3" fill="#a78bfa" />
            <circle cx="320" cy="155" r="3" fill="#a78bfa" />
            <circle cx="340" cy="140" r="3" fill="#a78bfa" />
            <text x="160" y="180" fill="#c4b5fd" fontSize="9">Ribozomlar (Protein Sentezi)</text>

            {/* Sağ Bilim Kartı */}
            <g transform="translate(470, 50)">
              <rect x="0" y="0" width="100" height="140" rx="8" fill="#1e293b" stroke="#334155" />
              <text x="50" y="24" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">Temel Kural</text>
              <text x="10" y="50" fill="#e2e8f0" fontSize="10">1. Seçici Zar</text>
              <text x="10" y="75" fill="#e2e8f0" fontSize="10">2. DNA Yönetimi</text>
              <text x="10" y="100" fill="#e2e8f0" fontSize="10">3. ATP Enerjisi</text>
              <text x="10" y="125" fill="#e2e8f0" fontSize="10">4. Protein Üretimi</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 13. TÜRK DİLİ VE EDEBİYATI: CÜMLE ÖGELERİ TRENİ
  // -------------------------------------------------------------
  const renderTurkishGrammar = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            🚂 Türk Dili ve Edebiyatı: Cümle Ögeleri Tren Modeli
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Örnek: "Ahmet dün akşam kitabı dikkatle okudu."</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* Demir Ray Hattı */}
            <line x1="40" y1="170" x2="560" y2="170" stroke="#64748b" strokeWidth="4" />
            <line x1="40" y1="176" x2="560" y2="176" stroke="#475569" strokeWidth="2" />
            {[60, 110, 160, 210, 260, 310, 360, 410, 460, 510].map(rx => (
              <line key={rx} x1={rx} y1="165" x2={rx} y2={181} stroke="#94a3b8" strokeWidth="2" />
            ))}

            {/* Vagon 1: Özne */}
            <g transform="translate(60, 90)">
              <rect x="0" y="0" width="95" height="55" rx="8" fill={activeStep === 0 ? '#3b82f6' : '#1e293b'} stroke="#60a5fa" strokeWidth="2" />
              <text x="47" y="22" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">ÖZNE</text>
              <text x="47" y="42" textAnchor="middle" fill="#93c5fd" fontSize="12">"Ahmet"</text>
              <circle cx="20" cy="62" r="8" fill="#475569" />
              <circle cx="75" cy="62" r="8" fill="#475569" />
              <text x="47" y="-8" textAnchor="middle" fill="#38bdf8" fontSize="9">(Kim?)</text>
            </g>

            {/* Bağlantı Demiri */}
            <line x1="155" y1="120" x2="175" y2="120" stroke="#f59e0b" strokeWidth="3" />

            {/* Vagon 2: Zarf Tümleci */}
            <g transform="translate(175, 90)">
              <rect x="0" y="0" width="105" height="55" rx="8" fill={activeStep === 1 ? '#8b5cf6' : '#1e293b'} stroke="#a78bfa" strokeWidth="2" />
              <text x="52" y="22" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">ZARF TÜM.</text>
              <text x="52" y="42" textAnchor="middle" fill="#c4b5fd" fontSize="12">"dün akşam"</text>
              <circle cx="25" cy="62" r="8" fill="#475569" />
              <circle cx="80" cy="62" r="8" fill="#475569" />
              <text x="52" y="-8" textAnchor="middle" fill="#c084fc" fontSize="9">(Ne zaman?)</text>
            </g>

            {/* Bağlantı Demiri */}
            <line x1="280" y1="120" x2="300" y2="120" stroke="#f59e0b" strokeWidth="3" />

            {/* Vagon 3: Belirtili Nesne */}
            <g transform="translate(300, 90)">
              <rect x="0" y="0" width="95" height="55" rx="8" fill={activeStep === 2 ? '#10b981' : '#1e293b'} stroke="#34d399" strokeWidth="2" />
              <text x="47" y="22" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">NESNE</text>
              <text x="47" y="42" textAnchor="middle" fill="#a7f3d0" fontSize="12">"kitabı"</text>
              <circle cx="20" cy="62" r="8" fill="#475569" />
              <circle cx="75" cy="62" r="8" fill="#475569" />
              <text x="47" y="-8" textAnchor="middle" fill="#4ade80" fontSize="9">(Neyi?)</text>
            </g>

            {/* Bağlantı Demiri */}
            <line x1="395" y1="120" x2="415" y2="120" stroke="#f59e0b" strokeWidth="3" />

            {/* Lokomotif: Yüklem */}
            <g transform="translate(415, 75)">
              <rect x="0" y="15" width="125" height="55" rx="8" fill={activeStep === 3 ? '#ef4444' : '#7f1d1d'} stroke="#f87171" strokeWidth="2.5" />
              <rect x="90" y="0" width="30" height="20" fill="#475569" /> {/* Baca */}
              <text x="62" y="38" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">YÜKLEM</text>
              <text x="62" y="58" textAnchor="middle" fill="#fecaca" fontSize="13" fontWeight="bold">"okudu"</text>
              <circle cx="25" cy="77" r="9" fill="#fca5a5" />
              <circle cx="65" cy="77" r="9" fill="#fca5a5" />
              <circle cx="105" cy="77" r="9" fill="#fca5a5" />
              <text x="62" y="-5" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">LOKOMOTİF</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 14. TARİH: ZAMAN ŞERİDİ & ÇAĞLAR
  // -------------------------------------------------------------
  const renderHistoryTimeline = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            📜 Tarih: Çağlar ve Medeniyetler Zaman Çizelgesi
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>MÖ 3200 Yazının İcadından Günümüze</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* Zaman Oku */}
            <line x1="50" y1="120" x2="550" y2="120" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrow)" />

            {/* 1. MÖ 3200 Sümerler Yazı */}
            <g transform="translate(90, 120)">
              <circle cx="0" cy="0" r="10" fill={activeStep === 0 ? '#f59e0b' : '#1e293b'} stroke="#f59e0b" strokeWidth="2" />
              <line x1="0" y1="-10" x2="0" y2="-40" stroke="#f59e0b" strokeWidth="1.5" />
              <rect x="-45" y="-75" width="90" height="35" rx="6" fill="#1e293b" stroke="#f59e0b" />
              <text x="0" y="-60" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="bold">MÖ 3200</text>
              <text x="0" y="-46" textAnchor="middle" fill="#ffffff" fontSize="9">Yazının İcadı</text>
              <text x="0" y="25" textAnchor="middle" fill="#94a3b8" fontSize="9">İlk Çağ Başlar</text>
            </g>

            {/* 2. 375 Kavimler Göçü */}
            <g transform="translate(220, 120)">
              <circle cx="0" cy="0" r="10" fill={activeStep === 1 ? '#3b82f6' : '#1e293b'} stroke="#3b82f6" strokeWidth="2" />
              <line x1="0" y1="10" x2="0" y2="40" stroke="#3b82f6" strokeWidth="1.5" />
              <rect x="-45" y="40" width="90" height="35" rx="6" fill="#1e293b" stroke="#3b82f6" />
              <text x="0" y="55" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">MS 375</text>
              <text x="0" y="69" textAnchor="middle" fill="#ffffff" fontSize="9">Kavimler Göçü</text>
              <text x="0" y="-20" textAnchor="middle" fill="#94a3b8" fontSize="9">Orta Çağ</text>
            </g>

            {/* 3. 1453 İstanbul'un Fethi */}
            <g transform="translate(360, 120)">
              <circle cx="0" cy="0" r="10" fill={activeStep === 2 ? '#10b981' : '#1e293b'} stroke="#10b981" strokeWidth="2" />
              <line x1="0" y1="-10" x2="0" y2="-40" stroke="#10b981" strokeWidth="1.5" />
              <rect x="-45" y="-75" width="90" height="35" rx="6" fill="#1e293b" stroke="#10b981" />
              <text x="0" y="-60" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold">1453</text>
              <text x="0" y="-46" textAnchor="middle" fill="#ffffff" fontSize="9">İstanbul Fethi</text>
              <text x="0" y="25" textAnchor="middle" fill="#94a3b8" fontSize="9">Yeni Çağ</text>
            </g>

            {/* 4. 1789 Fransız İhtilali & Yakın Çağ */}
            <g transform="translate(480, 120)">
              <circle cx="0" cy="0" r="10" fill={activeStep === 3 ? '#ec4899' : '#1e293b'} stroke="#ec4899" strokeWidth="2" />
              <line x1="0" y1="10" x2="0" y2="40" stroke="#ec4899" strokeWidth="1.5" />
              <rect x="-45" y="40" width="90" height="35" rx="6" fill="#1e293b" stroke="#ec4899" />
              <text x="0" y="55" textAnchor="middle" fill="#fbcfe8" fontSize="10" fontWeight="bold">1789</text>
              <text x="0" y="69" textAnchor="middle" fill="#ffffff" fontSize="9">Fransız İhtilali</text>
              <text x="0" y="-20" textAnchor="middle" fill="#94a3b8" fontSize="9">Yakın Çağ</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 15. İNGİLİZCE: ZAMANLAR & DİL BİLGİSİ SİMÜLATÖRÜ
  // -------------------------------------------------------------
  const renderEnglishTenses = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            🇬🇧 İngilizce: Simple Present Tense Timeline & He/She/It -s Rule
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Subject + Verb(s/es) + Object</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* Zaman Doğrusu (PAST <--- PRESENT ---> FUTURE) */}
            <line x1="80" y1="65" x2="520" y2="65" stroke="#475569" strokeWidth="2" />
            
            {/* Past */}
            <text x="120" y="55" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">PAST (Geçmiş)</text>
            <circle cx="120" cy="65" r="4" fill="#64748b" />

            {/* Present (Center Highlight) */}
            <circle cx="300" cy="65" r="8" fill="#3b82f6" stroke="#93c5fd" strokeWidth="2" />
            <text x="300" y="50" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="bold">PRESENT (ŞİMDİ - GENEL)</text>
            <text x="300" y="85" textAnchor="middle" fill="#38bdf8" fontSize="10">Rutinler & Alışkanlıklar</text>

            {/* Future */}
            <text x="480" y="55" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">FUTURE (Gelecek)</text>
            <circle cx="480" cy="65" r="4" fill="#64748b" />

            {/* Cümle Kurma Blokları */}
            <g transform="translate(60, 110)">
              {/* Özne Kartı */}
              <rect x="0" y="0" width="130" height="70" rx="8" fill={activeStep === 0 ? '#1e3a8a' : '#1e293b'} stroke="#3b82f6" strokeWidth="2" />
              <text x="65" y="25" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="bold">SUBJECT</text>
              <text x="65" y="48" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">He / She / It</text>
            </g>

            <text x="215" y="150" fill="#f59e0b" fontSize="24" fontWeight="bold">+</text>

            <g transform="translate(240, 110)">
              {/* Fiil Kartı */}
              <rect x="0" y="0" width="130" height="70" rx="8" fill={activeStep === 1 ? '#065f46' : '#1e293b'} stroke="#10b981" strokeWidth="2" />
              <text x="65" y="25" textAnchor="middle" fill="#a7f3d0" fontSize="11" fontWeight="bold">VERB + (S)</text>
              <text x="65" y="48" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">play<tspan fill="#f59e0b">s</tspan></text>
            </g>

            <text x="395" y="150" fill="#f59e0b" fontSize="24" fontWeight="bold">+</text>

            <g transform="translate(420, 110)">
              {/* Nesne & Zaman Kartı */}
              <rect x="0" y="0" width="130" height="70" rx="8" fill={activeStep >= 2 ? '#4c1d95' : '#1e293b'} stroke="#8b5cf6" strokeWidth="2" />
              <text x="65" y="25" textAnchor="middle" fill="#ddd6fe" fontSize="11" fontWeight="bold">OBJECT / TIME</text>
              <text x="65" y="48" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">tennis every day</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 16. DİN KÜLTÜRÜ: İSLAM İNANÇ ESASLARI VE AHLAK AĞACI
  // -------------------------------------------------------------
  const renderReligionBelief = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            🕌 Din Kültürü: İnanç Esasları ve Erdem Sütunları
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Tevhid, Vahiy, Ahiret, Ahlak</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* Merkez Sütun: Tevhid (Allah'ın Birliği) */}
            <g transform="translate(100, 70)">
              <rect x="0" y="0" width="90" height="110" rx="10" fill={activeStep === 0 ? '#065f46' : '#1e293b'} stroke="#10b981" strokeWidth="2" />
              <text x="45" y="35" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold">1. TEVHİD</text>
              <text x="45" y="65" textAnchor="middle" fill="#ffffff" fontSize="11">Allah'ın</text>
              <text x="45" y="85" textAnchor="middle" fill="#ffffff" fontSize="11">Birliği</text>
            </g>

            {/* 2. Sütun: Nübüvvet */}
            <g transform="translate(210, 70)">
              <rect x="0" y="0" width="90" height="110" rx="10" fill={activeStep === 1 ? '#1e3a8a' : '#1e293b'} stroke="#3b82f6" strokeWidth="2" />
              <text x="45" y="35" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="bold">2. NÜBÜVVET</text>
              <text x="45" y="65" textAnchor="middle" fill="#ffffff" fontSize="11">Peygamber</text>
              <text x="45" y="85" textAnchor="middle" fill="#ffffff" fontSize="11">& Vahiy</text>
            </g>

            {/* 3. Sütun: Ahiret */}
            <g transform="translate(320, 70)">
              <rect x="0" y="0" width="90" height="110" rx="10" fill={activeStep === 2 ? '#831843' : '#1e293b'} stroke="#ec4899" strokeWidth="2" />
              <text x="45" y="35" textAnchor="middle" fill="#f472b6" fontSize="12" fontWeight="bold">3. AHİRET</text>
              <text x="45" y="65" textAnchor="middle" fill="#ffffff" fontSize="11">Sorumluluk</text>
              <text x="45" y="85" textAnchor="middle" fill="#ffffff" fontSize="11">& Hesap</text>
            </g>

            {/* 4. Sütun: Ahlak ve Adalet */}
            <g transform="translate(430, 70)">
              <rect x="0" y="0" width="90" height="110" rx="10" fill={activeStep === 3 ? '#78350f' : '#1e293b'} stroke="#f59e0b" strokeWidth="2" />
              <text x="45" y="35" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">4. AHLAK</text>
              <text x="45" y="65" textAnchor="middle" fill="#ffffff" fontSize="11">Adalet &</text>
              <text x="45" y="85" textAnchor="middle" fill="#ffffff" fontSize="11">Merhamet</text>
            </g>

            {/* Taban Birleştirici Hat */}
            <rect x="80" y="190" width="460" height="15" rx="6" fill="#334155" />
            <text x="310" y="202" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="bold">İSLAM İNANÇ VE DEĞERLER SİSTEMİ</text>
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 17. SAĞLIK BİLGİSİ: İLK YARDIM & YAŞAM KURTARMA ZİNCİRİ
  // -------------------------------------------------------------
  const renderHealthFirstAid = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            🩺 Sağlık Bilgisi: Hayat Kurtarma Zinciri & İlk Yardım
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>112 Acil, Hava Yolu, Bak-Dinle-Hisset</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* 1. Adım: Güvenlik & Bilinç */}
            <g transform="translate(60, 60)">
              <circle cx="45" cy="45" r="42" fill={activeStep === 0 ? '#1e3a8a' : '#1e293b'} stroke="#3b82f6" strokeWidth="2.5" />
              <text x="45" y="40" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">1. Güvenlik</text>
              <text x="45" y="55" textAnchor="middle" fill="#93c5fd" fontSize="9">& Bilinç</text>
            </g>

            <line x1="160" y1="105" x2="190" y2="105" stroke="#64748b" strokeWidth="2" />

            {/* 2. Adım: Hava Yolu */}
            <g transform="translate(190, 60)">
              <circle cx="45" cy="45" r="42" fill={activeStep === 1 ? '#065f46' : '#1e293b'} stroke="#10b981" strokeWidth="2.5" />
              <text x="45" y="40" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">2. Hava Yolu</text>
              <text x="45" y="55" textAnchor="middle" fill="#a7f3d0" fontSize="9">(Baş-Çene)</text>
            </g>

            <line x1="290" y1="105" x2="320" y2="105" stroke="#64748b" strokeWidth="2" />

            {/* 3. Adım: Solunum */}
            <g transform="translate(320, 60)">
              <circle cx="45" cy="45" r="42" fill={activeStep === 2 ? '#78350f' : '#1e293b'} stroke="#f59e0b" strokeWidth="2.5" />
              <text x="45" y="40" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">3. Solunum</text>
              <text x="45" y="55" textAnchor="middle" fill="#fde68a" fontSize="9">Bak-Dinle</text>
            </g>

            <line x1="420" y1="105" x2="450" y2="105" stroke="#64748b" strokeWidth="2" />

            {/* 4. Adım: 112 & Kalp Masajı */}
            <g transform="translate(450, 60)">
              <circle cx="45" cy="45" r="42" fill={activeStep === 3 ? '#7f1d1d' : '#1e293b'} stroke="#ef4444" strokeWidth="2.5" />
              <text x="45" y="40" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">4. 112 Acil</text>
              <text x="45" y="55" textAnchor="middle" fill="#fca5a5" fontSize="9">& Kalp Masajı</text>
            </g>

            {/* Canlı Nabız / EKG Hattı */}
            <path d="M 60 185 L 200 185 L 220 160 L 235 205 L 250 175 L 265 190 L 275 185 L 540 185" fill="none" stroke="#ef4444" strokeWidth="2" />
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 18. ALMANCA: ARTIKELLER & FİİL ÇEKİMİ
  // -------------------------------------------------------------
  const renderGermanGrammar = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
            🇩🇪 Almanca: Artikeller (der, die, das) ve 'sein' Fiili
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Eril (Mavi), Dişil (Kırmızı), Nötr (Yeşil)</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* Artikel Kutuları */}
            <g transform="translate(60, 50)">
              <rect x="0" y="0" width="130" height="60" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
              <text x="65" y="28" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">der</text>
              <text x="65" y="48" textAnchor="middle" fill="#93c5fd" fontSize="10">Maskulin (Eril)</text>
            </g>

            <g transform="translate(235, 50)">
              <rect x="0" y="0" width="130" height="60" rx="8" fill="#831843" stroke="#ec4899" strokeWidth="2" />
              <text x="65" y="28" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">die</text>
              <text x="65" y="48" textAnchor="middle" fill="#f472b6" fontSize="10">Feminin (Dişil)</text>
            </g>

            <g transform="translate(410, 50)">
              <rect x="0" y="0" width="130" height="60" rx="8" fill="#065f46" stroke="#10b981" strokeWidth="2" />
              <text x="65" y="28" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">das</text>
              <text x="65" y="48" textAnchor="middle" fill="#a7f3d0" fontSize="10">Neutral (Nötr)</text>
            </g>

            {/* Sein Fiili Çekim Tablosu */}
            <g transform="translate(60, 130)">
              <rect x="0" y="0" width="480" height="70" rx="8" fill="#1e293b" stroke="#475569" />
              <text x="240" y="22" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">'sein' Fiil Çekimi (Olmak):</text>
              <text x="80" y="48" fill="#ffffff" fontSize="11">ich <tspan fill="#60a5fa" fontWeight="bold">bin</tspan></text>
              <text x="180" y="48" fill="#ffffff" fontSize="11">du <tspan fill="#60a5fa" fontWeight="bold">bist</tspan></text>
              <text x="280" y="48" fill="#ffffff" fontSize="11">er/sie/es <tspan fill="#60a5fa" fontWeight="bold">ist</tspan></text>
              <text x="400" y="48" fill="#ffffff" fontSize="11">wir <tspan fill="#60a5fa" fontWeight="bold">sind</tspan></text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 19. FİZİK: KUVVET VE HAREKET (VEKTÖRLER & NEWTON F = m·a)
  // -------------------------------------------------------------
  const renderPhysicsForce = () => {
    return (
      <div className="dp-vis-container">
        <div className="dp-vis-top-bar">
          <span className="dp-vis-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            ⚡ Fizik: Dinamometre, Kuvvet Vektörleri & Newton Prensibi
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Fnet = F1 - Fs | F = m · a</span>
        </div>

        <div className="dp-svg-canvas-wrapper">
          <svg viewBox="0 0 600 240" className="dp-vis-svg">
            <rect x="20" y="20" width="560" height="200" rx="14" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />

            {/* Zemin */}
            <line x1="50" y1="170" x2="550" y2="170" stroke="#64748b" strokeWidth="3" />
            {[70, 120, 170, 220, 270, 320, 370, 420, 470, 520].map(gx => (
              <line key={gx} x1={gx} y1="170" x2={gx - 10} y2="182" stroke="#475569" strokeWidth="1.5" />
            ))}

            {/* m Kütleli Cisim */}
            <g transform="translate(250, 100)">
              <rect x="0" y="0" width="100" height="70" rx="8" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2.5" />
              <text x="50" y="35" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">m = 5 kg</text>
              <text x="50" y="55" textAnchor="middle" fill="#93c5fd" fontSize="11">Cisim</text>
            </g>

            {/* Sağa Doğru Çeken Kuvvet (F1 = 30 N) */}
            <g transform="translate(350, 135)">
              <line x1="0" y1="0" x2="120" y2="0" stroke="#10b981" strokeWidth="4" />
              <polygon points="120,-6 135,0 120,6" fill="#10b981" />
              <text x="60" y="-12" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold">F₁ = 30 N (Sağa)</text>
            </g>

            {/* Sola Doğru Sürtünme Kuvveti (Fs = 10 N) */}
            <g transform="translate(250, 165)">
              <line x1="0" y1="0" x2="-70" y2="0" stroke="#ef4444" strokeWidth="3" />
              <polygon points="-70,-5 -82,0 -70,5" fill="#ef4444" />
              <text x="-35" y="-8" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="bold">Fs = 10 N</text>
            </g>

            {/* Net Kuvvet ve İvme Hesaplama Paneli */}
            <g transform="translate(50, 45)">
              <rect x="0" y="0" width="160" height="75" rx="8" fill="#1e293b" stroke="#334155" />
              <text x="80" y="22" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">Net Kuvvet Hesabı:</text>
              <text x="80" y="44" textAnchor="middle" fill="#ffffff" fontSize="11">Fnet = 30 - 10 = 20 N</text>
              <text x="80" y="64" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">a = F / m = 4 m/s²</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // Dynamic dispatch based on topic or subject
  const renderVisualContent = () => {
    if(alternative)return <section className="alternative-scene" aria-label="Farklı örnek ve görsel"><h3>{alternative.title}</h3><svg viewBox="0 0 600 180" role="img" aria-label={alternative.title} style={{width:'100%',maxHeight:180}}>
      <rect width="600" height="180" rx="20" fill="#e6f4ff"/>
      {alternative.title.includes('Etki–tepki')?<><rect x="430" y="15" width="25" height="150" fill="#64748b"/><circle cx="260" cy="50" r="20" fill="#7355bc"/><path d="M260 70 V120 M260 85 L420 85 M260 120 L215 155 M260 120 L300 155" stroke="#263555" strokeWidth="9"/><path d="M320 55 H410 l-12 -8 m12 8 l-12 8 M410 115 H320 l12 -8 m-12 8 l12 8" fill="none" stroke="#e65b45" strokeWidth="5"/></>:alternative.title.includes('Eylemsizlik')?<><rect x="110" y="60" width="260" height="70" rx="20" fill="#6584d9"/><circle cx="160" cy="135" r="19" fill="#273653"/><circle cx="320" cy="135" r="19" fill="#273653"/><circle cx="270" cy="75" r="16" fill="#ffe1b6"/><path d="M400 85 H510 l-20 -12 m20 12 l-20 12" fill="none" stroke="#da5845" strokeWidth="6"/><text x="400" y="135" fontSize="18" fill="#273653">Hareket yönü</text></>:alternative.title.includes('sepetleri')||alternative.title.includes('hobiler')?<><circle cx="245" cy="90" r="65" fill="#4c8edb" fillOpacity=".5" stroke="#3264ad"/><circle cx="345" cy="90" r="65" fill="#b669d0" fillOpacity=".5" stroke="#8146a6"/><text x="210" y="95" fontSize="24">A</text><text x="362" y="95" fontSize="24">B</text><circle cx="295" cy="90" r="9" fill="#facc15"/></>:alternative.title==='Bilyeli terazi'?<><path d="M300 35 V145 M220 150 H380 M150 65 H450 M170 65 L135 110 H205 Z M430 65 L395 110 H465 Z" stroke="#475569" strokeWidth="5" fill="#c5d6f5"/><rect x="144" y="81" width="26" height="24" rx="3" fill="#9573d6"/>{[0,1,2].map(i=><circle key={i} cx={180+i*10} cy="100" r="5" fill="#eb8352"/>)}<text x="410" y="100" fontSize="22">8</text></>:alternative.title.includes('alışveriş')?<><rect x="140" y="45" width="55" height="85" rx="5" fill="#9573d6"/><rect x="215" y="45" width="55" height="85" rx="5" fill="#6584d9"/><text x="300" y="100" fontSize="28" fill="#273653">+ 10 ₺ = 50 ₺</text></>:<>{alternative.scene.map((label,index)=><g key={index}><circle cx={110+index*190} cy="85" r="35" fill={index===activeStep%3?'#9573d6':'#6584d9'}/><text x={110+index*190} y="93" textAnchor="middle" fontSize="26" fill="white">{index+1}</text></g>)}</>}
    </svg><div className="alternative-flow">{alternative.scene.map((label,index)=><div key={index} className={activeStep%3===index?'current':''}><span aria-hidden="true">{index+1}</span><strong>{label}</strong>{index<2&&<b aria-hidden="true">→</b>}</div>)}</div><ol>{alternative.steps.map((text,index)=><li key={index}>{text}</li>)}</ol><p role="status">Yeni görsel ve açıklama hazır. Dinlemek için Derse başla düğmesine bas.</p></section>;

    if (activePackageMode === 'ai' && aiPackage) {
      return renderAiGeneratedPackage();
    }

    // 1. Matematik Simülasyonları (Yalnızca ilgili konu seçildiğinde)
    if (topicId === 'topic_math_equations' || topicId === 'topic_denklem') return renderEquationsBalance();
    if (topicId === 'topic_math_sets' || topicId === 'topic_kume') return renderSetsVenn();
    if (topicId === 'topic_math_absolute' || topicId === 'topic_mutlak_deger') return renderAbsoluteValueRuler();
    if (topicId === 'topic_math_triangles' || topicId === 'topic_ucgen') return renderTriangleAngles();
    if (topicId === 'topic_math_logic' || topicId === 'topic_mantik') return renderLogicCircuit();

    // 2. Fizik Simülasyonları (Yalnızca ilgili konu seçildiğinde)
    if (topicId === 'topic_fizik_matter' || topicId === 'topic_fizik_density') return renderDensitySimulation();
    if (topicId === 'topic_fizik_force' || topicId === 'topic_fizik_kuvvet') return renderPhysicsForce();

    // 3. Diğer Derslere Özel Simülasyonlar (Yalnızca ilgili konu seçildiğinde)
    if (topicId === 'topic_kimya_atom' || topicId === 'topic_kimya_bohr') return renderChemistryAtom();
    if (topicId === 'topic_biyo_hucre' || topicId === 'topic_biyo_cell') return renderBiologyCell();
    if (topicId === 'topic_bilisim_algo') return renderFlowchartSimulator();
    if (topicId === 'topic_cografya_koordinat' || topicId === 'topic_cografya_doga') return renderGlobeCoordinates();
    if (topicId === 'topic_turk_cumle_ogeleri') return renderTurkishGrammar();
    if (topicId === 'topic_tarih_ilk_cag' || topicId === 'topic_tarih_yazi') return renderHistoryTimeline();
    if (topicId === 'topic_eng_present_simple' || topicId === 'topic_eng_tenses') return renderEnglishTenses();
    if (topicId === 'topic_din_inanc' || topicId === 'topic_din_tevhid') return renderReligionBelief();
    if (topicId === 'topic_saglik_ilkyardim') return renderHealthFirstAid();
    if (topicId === 'topic_almanca_artikeller') return renderGermanGrammar();

    // 4. TÜM DİĞER KONULAR İÇİN: Konunun kendi başlığı, kuralları ve örnekleriyle dinamik kavram haritası
    return renderGenericConceptMap();
  };

  const currentStep = getStepInfo(activeStep);

  return (
    <div className="dp-lecture-visual-stage-card">
      {voiceNotice&&<p role="status">{voiceNotice}</p>}
      <div className="dp-stage-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="dp-stage-pulse-dot" />
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Etkileşimli anlatım
          </h4>

          {/* Standart MEB / Yapay Zekâ Paketi Geçiş Butonları */}
          {aiPackage && (
            <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: '20px', padding: '2px', border: '1px solid var(--border-color)', marginLeft: '8px' }}>
              <button 
                style={{ padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600, borderRadius: '16px', border: 'none', cursor: 'pointer', background: activePackageMode === 'standard' ? '#2563eb' : 'transparent', color: activePackageMode === 'standard' ? '#fff' : 'var(--text-secondary)' }}
                onClick={() => { setActivePackageMode('standard'); setActiveStep(0); }}
              >
                MEB Standart
              </button>
              <button 
                style={{ padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600, borderRadius: '16px', border: 'none', cursor: 'pointer', background: activePackageMode === 'ai' ? '#7c3aed' : 'transparent', color: activePackageMode === 'ai' ? '#fff' : 'var(--text-secondary)' }}
                onClick={() => { setActivePackageMode('ai'); setActiveStep(0); }}
              >
                ✨ Rehber Paketi
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Yapay Zekâ ile Canlandır Butonu */}
          {aiReady&&!!lecture?.summary?.trim()&&<button 
            className="dp-vis-action-btn dp-btn-ai-sparkle"
            disabled={isGeneratingAi}
            onClick={() => {if(!isGeneratingAi)void handleGenerateAiPackage(lecture.title);}}
            title="Bu konu için görsel anlatım hazırla"
          >
            <Sparkles size={15} />
            <span>{isGeneratingAi?'Hazırlanıyor…':'Konuyu canlandır'}</span>
          </button>}
          {aiReady&&<button className="dp-vis-action-btn" disabled={isGeneratingAi} onClick={()=>setShowAiModal(true)}>Özel konu</button>}

          {/* Oynat / Durdur Butonu */}
          <button 
            className={`dp-vis-action-btn ${isPlaying ? 'dp-btn-pause-active' : ''}`}
            onClick={togglePlay}
            title={isPlaying ? 'Dersi Durdur (İstendiğinde Tekrar Başlatılabilir)' : 'Dersi sesli anlatımla başlat'}
            style={isPlaying ? { background: '#dc2626', color: '#fff', borderColor: '#b91c1c', fontWeight: 700 } : { fontWeight: 600 }}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span>{isPlaying ? 'Duraklat' : 'Derse başla'}</span>
          </button>

          {/* Sıfırla */}
          <button 
            className="dp-vis-action-btn"
            onClick={() => {
              if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
              lastNarrationKeyRef.current = '';
              voiceService.current.stopSpeaking();
              setActiveStep(0);
              setIsPlaying(false);
            }}
            title="Başa Dön"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Main Dynamic Animation Stage */}
      {renderVisualContent()}

      {/* ============================================================
          SENKRONİZE SESLİ ANLATICI & DERS PAKETİ BİLGİ BANDI
          ============================================================ */}
      <div className="dp-synchronized-narrator-bar">
        {audioCacheWarning&&<p role="status">{audioCacheWarning}</p>}
        {voiceError&&<p role="alert" style={{padding:12,color:'var(--text-primary)'}}>{voiceError}</p>}
        <div className="dp-narrator-badge-row">
          <div className="dp-narrator-badge">
            <div className={`dp-narrator-dot ${isSpeaking ? 'active' : ''}`} />
            <span>
              {isSpeaking ? 'Anlatılıyor…' : isPlaying ? 'Anlatım sürüyor' : 'Başlamak için Derse başla düğmesine bas'}
            </span>
          </div>

          <div className="dp-narrator-actions">
            <button 
              className="dp-narrator-btn"
              onClick={handleReplayVoice}
            >
              <RotateCcw size={14} />
              <span>Tekrar Dinle</span>
            </button>
            <button className="dp-narrator-btn" onClick={()=>{isPlayingRef.current=false;setIsPlaying(false);voiceService.current.setSpeechRate(Math.max(0.5,Math.round(voiceService.current.getSpeechRate()*80)/100),true);handleReplayVoice();}}>Anlatımı daha yavaş dinle</button>
          </div>
        </div>

        <div className="dp-narrator-speech-box">
          <div className="dp-narrator-step-tag">
            {activeStep + 1}. ADIM: {currentStep.title}
          </div>
          <p className="dp-narrator-text">{currentStep.explanation}</p>
        </div>

        {/* Ses Dalgası Animasyonu */}
        {isSpeaking && (
          <div className="dp-voice-wave-container">
            <div className="dp-voice-bar" style={{ animationDelay: '0s' }} />
            <div className="dp-voice-bar" style={{ animationDelay: '0.2s' }} />
            <div className="dp-voice-bar" style={{ animationDelay: '0.4s' }} />
            <div className="dp-voice-bar" style={{ animationDelay: '0.1s' }} />
            <div className="dp-voice-bar" style={{ animationDelay: '0.3s' }} />
          </div>
        )}

        {/* Adım Navigasyonu ve İlerleme Butonları */}
        <div className="dp-step-nav-footer">
          <button 
            className="dp-step-nav-btn"
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
          >
            <ChevronLeft size={16} /> Önceki Adım
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 1, 2, 3].map(st => (
              <button 
                key={st}
                className={`dp-vis-pill-btn ${activeStep === st ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => { setActiveStep(st); setIsPlaying(false); }}
              >
                {st + 1}. Adım
              </button>
            ))}
          </div>

          <button 
            className="dp-step-nav-btn"
            disabled={activeStep === 3}
            onClick={() => setActiveStep(prev => Math.min(3, prev + 1))}
          >
            Sonraki Adım <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ============================================================
          YAPAY ZEKÂ GÖRSEL PAKET ÜRETİCİ MODAL
          ============================================================ */}
      {showAiModal && (
        <div className="dp-ai-modal-overlay" onClick={() => !isGeneratingAi && setShowAiModal(false)}>
          <div className="dp-ai-modal-card" onClick={e => e.stopPropagation()}>
            <div className="dp-ai-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="#a855f7" />
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  ders rehberi ile Görsel Ders Paketi Üret
                </h4>
              </div>
              <button 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowAiModal(false)}
                disabled={isGeneratingAi}
              >
                <X size={20} />
              </button>
            </div>

            <div className="dp-ai-modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                Öğretmenn, bu konu için 4 adımlı interaktif görsel bir simülasyon ve sesli anlatım paketi hazırlasın.
              </p>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>SEÇİLİ KONU</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{lecture.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>Kazanım: {lecture.outcome}</div>
              </div>

              {/* Hızlı Buton: Bu Konuyu Üret */}
              <button 
                className="btn btn-primary"
                style={{ padding: '12px', justifyContent: 'center', fontWeight: 700, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                disabled={isGeneratingAi}
                onClick={() => handleGenerateAiPackage(lecture.title)}
              >
                {isGeneratingAi ? (
                  <span>⏳ Görsel Paket Hazırlanıyor…</span>
                ) : (
                  <span>⚡ "{lecture.title}" İçin 4 Adımlı Görsel Paket Üret</span>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>VEYA ÖZEL BİR SORU / KAVRAM CANLANDIR</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
              </div>

              <div>
                <input 
                  type="text"
                  className="chat-input"
                  placeholder="Örn: Pisagor teoremini su bidonlarıyla açıkla / Hücre bölünmesini canlandır..."
                  value={aiCustomPrompt}
                  disabled={isGeneratingAi}
                  onChange={e => setAiCustomPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && aiCustomPrompt.trim() && !isGeneratingAi) {
                      handleGenerateAiPackage(aiCustomPrompt.trim());
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={isGeneratingAi} 
                  onClick={() => setShowAiModal(false)}
                >
                  Vazgeç
                </button>
                <button 
                  className="btn btn-primary"
                  disabled={isGeneratingAi || !aiCustomPrompt.trim()}
                  onClick={() => handleGenerateAiPackage(aiCustomPrompt.trim())}
                >
                  {isGeneratingAi ? 'Hazırlanıyor…' : 'Özel Paketi Canlandır'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          GOOGLE AI STUDIO DOĞAL İNSAN SESİ KURULUM MODAL
          ============================================================ */}
      {showKeyModal && (
        <div className="dp-ai-modal-overlay" onClick={() => !isSavingKey && setShowKeyModal(false)}>
          <div className="dp-ai-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="dp-ai-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#2563eb" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  Google ses paneli Doğal İnsan Sesi Kurulumu
                </h4>
              </div>
              <button 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowKeyModal(false)}
                disabled={isSavingKey}
              >
                <X size={18} />
              </button>
            </div>
            <div className="dp-ai-modal-body" style={{ gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Google ses paneli Voice Library üzerindeki doğal insan seslerini (<strong>Puck, Charon, Fenrir, Orus</strong>) kullanabilmek için Google Gemini API anahtarınızı girin.
              </p>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>Ücretsiz API Anahtarı Nasıl Alınır?</div>
                <div style={{ color: '#64748b' }}>1. Google ses paneli hesabınıza giriş yapın.</div>
                <div style={{ color: '#64748b' }}>2. "Create API key" butonuna tıklayarak ücretsiz anahtarınızı kopyalayın.</div>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '6px', color: '#2563eb', fontWeight: 700, textDecoration: 'underline' }}
                >
                  🔗 aistudio.google.com/app/apikey adresinden Ücretsiz Al ↗
                </a>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
                  Google Gemini API Anahtarınız (AIzaSy...)
                </label>
                <input 
                  type="password"
                  className="chat-input"
                  placeholder="AIzaSy..."
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowKeyModal(false)}
                  disabled={isSavingKey}
                >
                  Kapat
                </button>
                <button 
                  className="btn btn-primary"
                  disabled={isSavingKey || !inputKey.trim()}
                  onClick={async () => {
                    setIsSavingKey(true);
                    try {
                      await saveCredential('gemini', inputKey.trim());
                      writeSetting('gemini_api_key', inputKey.trim());
                      writeSetting('voice_model_name', selectedVoice);
                      writeSetting('voice_provider', 'gemini_speech');
                      try {
                        const now = new Date().toISOString();
                        getDb().execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
                          'gemini_api_key', JSON.stringify(inputKey.trim()), now
                        ]);
                        getDb().execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)", [
                          'voice_provider', JSON.stringify('gemini_speech'), now
                        ]);
                      } catch {}
                      setHasGeminiKey(true);
                      setShowKeyModal(false);
                      setInputKey('');
                      lastNarrationKeyRef.current = '';
                      speakStepNarration(activeStep);
                    } catch {
                      alert('Anahtar kaydedilemedi. Lütfen geçerli bir anahtar girin.');
                    } finally {
                      setIsSavingKey(false);
                    }
                  }}
                >
                  {isSavingKey ? 'Kaydediliyor…' : 'Kaydet ve Puck Sesini Başlat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

