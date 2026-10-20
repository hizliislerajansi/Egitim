"""Local English speech. No downloads, cloud clients, telemetry or user-supplied paths."""
import argparse, hashlib, io, json, os, sys, threading, wave
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VOICES = {'Jasper':'expr-voice-2-m','Bella':'expr-voice-2-f','Bruno':'expr-voice-3-m','Luna':'expr-voice-3-f','Hugo':'expr-voice-4-m','Rosie':'expr-voice-4-f','Leo':'expr-voice-5-m','Kiki':'expr-voice-5-f'}
MODEL = None
LOCK = threading.Lock()
ROOT = Path(__file__).resolve().parents[1]

def valid_payload(body):
    if not isinstance(body, dict) or body.get('lang') != 'en-US': raise ValueError('English required')
    text = body.get('text'); voice = body.get('voice', 'Jasper')
    if not isinstance(text, str) or not text.strip() or len(text)>4000 or voice not in VOICES: raise ValueError('Invalid text or voice')
    return text, voice

def synthesize(text, voice):
    global MODEL
    import numpy as np
    if MODEL is None:
        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        data_path = espeakng_loader.get_data_path()
        if os.name == 'nt':
            import ctypes
            buffer = ctypes.create_unicode_buffer(32768)
            if not ctypes.windll.kernel32.GetShortPathNameW(data_path,buffer,len(buffer)): raise RuntimeError('Speech data path unavailable')
            data_path = buffer.value
            if not data_path.isascii(): raise RuntimeError('Install speech data in an ASCII path when short names are unavailable')
        os.environ['ESPEAK_DATA_PATH'] = data_path
        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        sys.path.insert(0, str(ROOT/'scripts/vendor'))
        from kitten_inference import KittenTTS_1_Onnx
        folder = ROOT/'.runtime/kitten-model'
        lock = json.loads((ROOT/'docs/voice-studio-model.json').read_text(encoding='utf8'))
        for name, expected in lock['files'].items():
            if name not in {'config.json','voices.npz','kitten_tts_mini_v0_8.onnx','README.md'}: raise RuntimeError('Invalid manifest')
            with (folder/name).open('rb') as stream:
                if hashlib.file_digest(stream,'sha256').hexdigest()!=expected['sha256']: raise RuntimeError('Local model integrity failure')
        MODEL = KittenTTS_1_Onnx(str(folder/'kitten_tts_mini_v0_8.onnx'), str(folder/'voices.npz'))
    samples = np.asarray(MODEL.generate(text, voice=VOICES[voice], speed=1.0)).reshape(-1)
    if not samples.size or not np.isfinite(samples).all(): raise RuntimeError('Invalid waveform')
    pcm=(np.clip(samples,-1,1)*32767).astype('<i2').tobytes()
    result=io.BytesIO()
    with wave.open(result,'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(24000);out.writeframes(pcm)
    return result.getvalue()

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def send(self,status,body,mime='application/json'):
        self.send_response(status);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers()
        try:self.wfile.write(body)
        except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):pass
    def do_GET(self):
        if self.path!='/health':return self.send(404,b'{}')
        self.send(200,json.dumps({'service':'derspusulasi-kitten','version':1,'ready':MODEL is not None}).encode())
    def do_OPTIONS(self):self.send(403,b'{}')
    def do_POST(self):
        if self.path!='/synthesize':return self.send(404,b'{}')
        if self.headers.get('Origin') is not None or self.headers.get('X-LocalSpeech-Client')!='DersPusulasi':return self.send(403,b'{}')
        if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.send(415,b'{}')
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<=24000:raise ValueError()
            text,voice=valid_payload(json.loads(self.rfile.read(size)))
        except (ValueError,TypeError,UnicodeDecodeError):return self.send(400,b'{}')
        if not LOCK.acquire(timeout=2):return self.send(429,b'{}')
        try:self.send(200,synthesize(text,voice),'audio/wav')
        except Exception as error:
            print('Local English synthesis failed:',type(error).__name__,flush=True)
            self.send(503,b'{"error":"Local English speech is unavailable; check installed model files"}')
        finally:LOCK.release()

if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('--port',type=int,default=17185);options=args.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',options.port),Handler);server.daemon_threads=True;server.serve_forever()
