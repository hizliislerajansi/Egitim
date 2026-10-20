"""Run with the shipped Python interpreter; all network connects are denied."""
import socket, time, wave, io, json
from pathlib import Path
import kitten_server

def denied(*args,**kwargs):raise RuntimeError('Network disabled during offline speech verification')
socket.socket.connect=denied
socket.socket.connect_ex=denied
results=[]
for voice in kitten_server.VOICES:
    started=time.monotonic()
    data=kitten_server.synthesize('Hello. Learning takes practice. You can do it.',voice)
    with wave.open(io.BytesIO(data)) as audio:
        import numpy as np
        samples=np.frombuffer(audio.readframes(audio.getnframes()),dtype='<i2')
        assert samples.std()>100
        assert audio.getframerate()==24000 and audio.getnchannels()==1
        results.append({'voice':voice,'seconds':audio.getnframes()/24000,'bytes':len(data),'elapsed':time.monotonic()-started,'nonSilent':True})
print(json.dumps({'networkConnectDenied':True,'voices':results},indent=2))
