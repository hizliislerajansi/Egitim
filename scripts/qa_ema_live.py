import urllib.request,json,time,wave,io,hashlib
from pathlib import Path
base='http://127.0.0.1:17184'
print(json.loads(urllib.request.urlopen(base+'/health').read()),flush=True)
text='Merhaba. Bugün Einstein ve Google ile ilgili bir örnek inceleyeceğiz. Üç artı iki eşittir beş.'
results=[]
for i in range(2):
 request=urllib.request.Request(base+'/synthesize',data=json.dumps({'text':text,'lang':'tr-TR'}).encode(),headers={'Content-Type':'application/json','X-EMA-Client':'DersPusulasi'})
 start=time.perf_counter()
 data=urllib.request.urlopen(request,timeout=240).read()
 with wave.open(io.BytesIO(data)) as wav:
  results.append({'generation_seconds':round(time.perf_counter()-start,3),'audio_seconds':round(wav.getnframes()/wav.getframerate(),3),'sample_rate':wav.getframerate(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 if i==0:Path('docs/ema-real-sample.wav').write_bytes(data)
 print(results[-1],flush=True)
Path('docs/ema-live-results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
