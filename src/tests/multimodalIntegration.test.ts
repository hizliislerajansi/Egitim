import {beforeAll,afterEach,describe,it,expect,vi} from 'vitest';
import {getDb} from '../db/database';
import {seedInitialData} from '../db/seed';
import {saveCredential,listOpenRouterModels,providerFetch,writeSetting,saveProviderProfile} from '../services/apiClient';
import {MEDIA_OPTIONS} from '../services/mediaCatalog';
import {createMedia,parseGeneratedMedia,refreshMediaJob,validateWorkflow,mediaTransport,type MediaJob} from '../services/mediaService';
import {AiAdapter} from '../services/aiAdapter';

beforeAll(async()=>{await getDb().initialize();await seedInitialData();});
afterEach(()=>vi.restoreAllMocks());
const json=(body:unknown)=>new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
const wav='UklGRgQAAABXQVZF';
const config={optionId:'gemini_tts_lite',model:'gemini-3.8-flash-lite-tts',voice:'Kore'};
describe('Çoklu medya API sözleşmeleri',()=>{
  it('iki istenen Gemini 3.8 ses modeli ve gerçek yerel alternatifleri içerir',()=>{
    expect(MEDIA_OPTIONS.filter(p=>p.kind==='speech').map(p=>p.model)).toEqual(expect.arrayContaining(['gemini-3.8-flash-tts','gemini-3.8-flash-lite-tts']));
    expect(MEDIA_OPTIONS.some(p=>p.kind==='video'&&p.local)).toBe(true);
  });
  it('Gemini TTS güncel Interactions gövdesiyle ses üretir',async()=>{
    await saveCredential('gemini','fixture-gemini-only');
    const fetchMock=vi.spyOn(globalThis,'fetch').mockResolvedValue(json({output_audio:{data:wav,mime_type:'audio/wav'}}));
    const result=await createMedia(config,'Merhaba');
    expect(result.blob?.type).toBe('audio/wav');
    const [url,init]=fetchMock.mock.calls[0];const body=JSON.parse(String(init?.body));
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(body.model).toBe('gemini-3.8-flash-lite-tts');
    expect(body.generation_config.speech_config[0].voice).toBe('Kore');
    expect(body.input[0].content[0].text).toBe('Merhaba');
  });
  it('boş veya eski genel Gemini modelini güncel TTS modeline taşır ve seçili sesi korur',async()=>{
    await saveCredential('gemini','fixture-gemini-tts');
    const spy=vi.spyOn(globalThis,'fetch').mockImplementation(async()=>json({output_audio:{data:wav,mime_type:'audio/wav'}}));
    for(const model of ['', 'gemini-2.0-flash']){
      await createMedia({optionId:'gemini_tts',model,voice:'Fenrir'},'Merhaba');
      const [url,init]=spy.mock.calls.at(-1)!;const body=JSON.parse(String(init?.body));
      expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
      expect(body.model).toBe('gemini-3.8-flash-tts');expect(body.generation_config.speech_config[0].voice).toBe('Fenrir');
    }
  });
  it('Gemini görüntü çıktısını üretim verisi olarak ayrıştırır',()=>{
    const blob=parseGeneratedMedia('gemini_image',{outputs:[{type:'image',data:'iVBORw==',mime_type:'image/png'}]});
    expect(blob.type).toBe('image/png');
  });
  it('eksik medya / HTML başarı olarak gösterilmez',()=>{
    expect(()=>parseGeneratedMedia('gemini_tts',{})).toThrow('kullanılabilir medya');
    expect(()=>parseGeneratedMedia('openai_tts',new Blob(['error'],{type:'text/html'}))).toThrow();
  });
  it('OpenRouter görsel üretiminde görsel modalitesini ister',async()=>{
    await saveCredential('openrouter','fixture-openrouter-only');
    const spy=vi.spyOn(globalThis,'fetch').mockResolvedValue(json({choices:[{message:{images:[{image_url:{url:'data:image/png;base64,iVBORw=='}}]}}]}));
    const result=await createMedia({optionId:'openrouter_image',model:'google/image-model',voice:''},'Bir güneş çiz');
    expect(result.blob?.type).toBe('image/png');
    expect(JSON.parse(String(spy.mock.calls[0][1]?.body)).modalities).toContain('image');
  });
  it('Sora gönderimi multipart olur, yalnız iş kimliği dönünce bekler',async()=>{
    await saveCredential('openai','fixture-openai-only');
    const spy=vi.spyOn(globalThis,'fetch').mockResolvedValue(json({id:'video_job_1',status:'queued'}));
    expect(await createMedia({optionId:'openai_video',model:'sora-2',voice:''},'Eğitim videosu')).toEqual({remoteId:'video_job_1'});
    expect(spy.mock.calls[0][1]?.body).toBeInstanceOf(FormData);
    expect((spy.mock.calls[0][1]?.body as FormData).get('seconds')).toBe('4');
  });
  it('Veo gerçek operasyon kimliğini korur, tamamlandı uydurmaz',async()=>{
    const spy=vi.spyOn(globalThis,'fetch').mockResolvedValue(json({name:'models/veo-3.1-generate-preview/operations/job1'}));
    const result=await createMedia({optionId:'gemini_video',model:'veo-3.1-generate-preview',voice:''},'Bir atom modeli');
    expect(result.remoteId).toContain('operations/job1');
    expect(result.blob).toBeUndefined();
    expect(String(spy.mock.calls[0][0])).toContain('predictLongRunning');
  });
  it('Veo durum sorgusu yeni ücretli üretim başlatmaz',async()=>{
    const spy=vi.spyOn(globalThis,'fetch').mockResolvedValue(json({done:false}));
    const job={optionId:'gemini_video',remoteId:'models/veo-3.1-generate-preview/operations/job1'} as MediaJob;
    expect((await refreshMediaJob(job)).status).toBe('pending');
    expect(spy.mock.calls[0][1]?.method).toBe('GET');
  });
  it('medya indirmesinde anahtar farklı bir adrese gönderilmez',async()=>{
    const spy=vi.spyOn(globalThis,'fetch');
    await expect(mediaTransport({route:'gemini_video_file',id:'https://evil.test/video.mp4'})).rejects.toThrow('İzin verilmeyen');
    await expect(providerFetch('gemini','https://evil.test/',{})).rejects.toThrow('İzin verilmeyen');
    expect(spy).not.toHaveBeenCalled();
  });
  it('iş kimliğinde yol geçişini ağ çağrısından önce reddeder',async()=>{
    const spy=vi.spyOn(globalThis,'fetch');
    await expect(mediaTransport({route:'openai_video_status',id:'../../secret'})).rejects.toThrow('kimliği');
    expect(spy).not.toHaveBeenCalled();
  });
  it('ComfyUI API biçimini doğrular ve yalnız prompt yer tutucusunu değiştirir',()=>{
    expect(()=>validateWorkflow('{"nodes":[]}','test')).toThrow('API biçimi');
    const workflow=validateWorkflow(JSON.stringify({'1':{class_type:'CLIPTextEncode',inputs:{text:'{{prompt}}'}},'2':{class_type:'CLIPTextEncode',inputs:{text:'fixed negative'}}}),'an atom');
    expect(workflow['1'].inputs.text).toBe('an atom');expect(workflow['2'].inputs.text).toBe('fixed negative');
  });
  it('OpenRouter ücretsiz etiketini gerçek tarife alanlarından türetir',async()=>{
    vi.spyOn(globalThis,'fetch').mockResolvedValue(json({data:[{id:'vendor/free',pricing:{prompt:'0',completion:'0'}},{id:'vendor/paid:free',pricing:{prompt:'1',completion:'2'}},{id:'vendor/unknown'}]}));
    const models=await listOpenRouterModels();expect(models.map(m=>m.free)).toEqual([true,false,false]);
  });
  it('OpenRouter model kimliğinde slash destekler ve doğru servise gider',async()=>{
    await saveProviderProfile('openrouter',{model:'openrouter/free',enabled:true},'fixture-openrouter');
    const spy=vi.spyOn(globalThis,'fetch').mockResolvedValue(json({choices:[{message:{content:'hello'}}],usage:{prompt_tokens:2,completion_tokens:1}}));
    const result=await AiAdapter.request({taskType:'chat',userMessage:'test'});
    expect(result.provider).toBe('openrouter');expect(String(spy.mock.calls[0][0])).toBe('https://openrouter.ai/api/v1/chat/completions');
  });
  it('Gemini birincil başarısız olunca kayıtlı EVREN ikincil yanıtını açıklar',async()=>{
    await saveProviderProfile('evren',{model:'auto',enabled:true},'fixture-evren');
    await saveProviderProfile('gemini',{model:'gemini-test',enabled:true},'fixture-gemini');writeSetting('ai_auto_fallback',true);
    vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response('{}',{status:429})).mockResolvedValueOnce(json({choices:[{message:{content:'Yedek yanıt'}}]}));
    const result=await AiAdapter.request({taskType:'chat',userMessage:'test'});
    expect(result.provider).toBe('evren');expect(result.connectionMessage).toContain('EVREN');
  });
});
