"""Only redistribute verified runtime files and public model blobs; no user home or sessions."""
from pathlib import Path
import json,hashlib,zipfile
root=Path(__file__).resolve().parents[1]
out=root/'Çalışma/Dagitim-0.10.0-20261020';out.mkdir(parents=True,exist_ok=True)
entries={}
runtime=json.loads((root/'docs/student-flow-runtime.json').read_text(encoding='utf-8'))
for item in runtime['files']:
 p=root/'.runtime/ollama'/item['file']
 if hashlib.sha256(p.read_bytes()).hexdigest()!=item['sha256']:raise RuntimeError('Runtime hash mismatch')
 entries['.runtime/ollama/'+item['file']]=p
manifest=root/'.runtime/ollama-models/manifests/registry.ollama.ai/library/qwen2.5/1.5b'
data=json.loads(manifest.read_text(encoding='utf-8'))
entries[manifest.relative_to(root).as_posix()]=manifest
for layer in [data['config'],*data['layers']]:
 digest=layer['digest'];p=root/'.runtime/ollama-models/blobs'/digest.replace(':','-')
 if not digest.startswith('sha256:') or len(digest)!=71 or hashlib.sha256(p.read_bytes()).hexdigest()!=digest[7:]:raise RuntimeError('Model blob hash mismatch')
 entries[p.relative_to(root).as_posix()]=p
for name in ('OLLAMA-LICENSE.txt','QWEN2.5-LICENSE.txt'):entries['licenses/'+name]=root/'docs/vendor'/name
entries['YEREL-OGRETMEN-KULLANIM.md']=root/'docs/DISTRIBUTION-GUIDE.md'
hashes={name:hashlib.sha256(p.read_bytes()).hexdigest() for name,p in entries.items()}
with zipfile.ZipFile(out/'Yerel-Ogretmen-EkPaketi.zip','w',zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for name,p in entries.items():z.write(p,name)
 z.writestr('YEREL-OGRETMEN-SHA256.json',json.dumps(hashes,indent=2))
with zipfile.ZipFile(out/'Yerel-Ogretmen-EkPaketi.zip') as z:
 if z.testzip():raise RuntimeError('Local AI archive CRC mismatch')
 for name,digest in hashes.items():
  with z.open(name) as f:
   if hashlib.file_digest(f,'sha256').hexdigest()!=digest:raise RuntimeError('Local AI archive hash mismatch')
print('Verified public local AI companion:',len(entries),'files; no account data')
