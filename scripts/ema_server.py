"""Loopback-only EMA bridge. No cloud synthesis, uploaded paths or arbitrary commands."""
import argparse, io, json, os, threading, time, wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

MODEL = None
MODEL_LOCK = threading.Lock()
ALLOWED_ORIGINS = {'http://127.0.0.1:5173', 'http://localhost:5173', 'tauri://localhost', 'http://tauri.localhost'}
MAX_BODY = 24000

def valid_payload(payload):
    if not isinstance(payload, dict): raise ValueError('JSON nesnesi gerekli')
    text = payload.get('text')
    if not isinstance(text, str) or not text.strip() or len(text)>4000: raise ValueError('1-4000 karakter gerekli')
    if payload.get('lang','tr-TR')!='tr-TR': raise ValueError('EMA yalnız Türkçe destekler')
    return text

def synthesize(text):
    global MODEL
    import numpy as np
    if MODEL is None:
        import torch
        from ema_lightning import EMA
        torch.set_num_threads(max(1,min(4,os.cpu_count() or 1)))
        MODEL = EMA(device='cpu')
        # Avoid expensive batch-size tuning at first request on a classroom CPU.
        MODEL._batch_size=1
    speech=MODEL.say(text, speed=1.0, sample_rate=24000, seed=42)
    samples=np.asarray(speech.audio)
    if samples.size==0 or not np.isfinite(samples).all(): raise RuntimeError('Geçersiz ses çıktısı')
    pcm=(np.clip(samples,-1,1)*32767).astype('<i2').tobytes()
    output=io.BytesIO()
    with wave.open(output,'wb') as audio:
        audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(speech.sample_rate);audio.writeframes(pcm)
    return output.getvalue()

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass  # Do not record learning text.
    def send(self,status,data,mime='application/json; charset=utf-8'):
        self.send_response(status);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers()
        try:self.wfile.write(data)
        except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):pass
    def json(self,status,body):self.send(status,json.dumps(body,ensure_ascii=False).encode('utf-8'))
    def trusted(self):
        return self.headers.get('Origin') in (None,*ALLOWED_ORIGINS) and self.headers.get('X-EMA-Client')=='DersPusulasi'
    def do_GET(self):
        if self.path!='/health':return self.json(404,{'error':'Not found'})
        self.json(200,{'service':'derspusulasi-ema','version':1,'model_ready':MODEL is not None,'language':'tr-TR'})
    def do_OPTIONS(self):self.json(403,{'error':'Direct browser access disabled; use application bridge'})
    def do_POST(self):
        if not self.trusted():return self.json(403,{'error':'Forbidden'})
        if self.path!='/synthesize':return self.json(404,{'error':'Not found'})
        if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.json(415,{'error':'JSON required'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<=MAX_BODY:raise ValueError('Request too large')
            text=valid_payload(json.loads(self.rfile.read(size)))
        except (ValueError,TypeError,UnicodeDecodeError):return self.json(400,{'error':'Geçersiz metin, dil veya istek boyutu'})
        if not MODEL_LOCK.acquire(timeout=2):return self.json(429,{'error':'EMA meşgul; kısa süre sonra yeniden deneyin'})
        try:self.send(200,synthesize(text),'audio/wav')
        except Exception as error:
            print('EMA synthesis error:',type(error).__name__,str(error)[:160],flush=True)
            self.json(503,{'error':'Yerel EMA sesi üretilemedi; model ve çalışma ortamını kontrol edin'})
        finally:MODEL_LOCK.release()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=17184);parser.add_argument('--cache-dir',type=Path,default=Path(__file__).resolve().parents[1]/'.runtime/models');args=parser.parse_args()
    args.cache_dir.mkdir(parents=True,exist_ok=True)
    os.environ['HF_HOME']=str(args.cache_dir);os.environ['HF_HUB_DISABLE_TELEMETRY']='1';os.environ['HF_HUB_DISABLE_XET']='1'
    # Downloaded weights remain local. An existing complete cache never checks the internet.
    if any((p/'ema.pt').is_file() and (p/'decoder.pt').is_file() for p in (args.cache_dir/'hub/models--canberkkkkkk--ema-lightning/snapshots').glob('*')):os.environ['HF_HUB_OFFLINE']='1'
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler);server.daemon_threads=True
    print('EMA loopback bridge ready',flush=True);server.serve_forever()

