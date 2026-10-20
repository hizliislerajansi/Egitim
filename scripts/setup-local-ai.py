"""Fetch only the CPU runtime from the official Ollama release ZIP using HTTP ranges."""
import io,json,urllib.request,zipfile,zlib,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
request=urllib.request.Request('https://api.github.com/repos/ollama/ollama/releases/latest',headers={'User-Agent':'DersPusulasi-local-setup'})
release=json.load(urllib.request.urlopen(request,timeout=30))
asset=next(a for a in release['assets'] if a['name']=='ollama-windows-amd64.zip')
class RemoteZip(io.RawIOBase):
 def __init__(self):self.pos=0
 def seekable(self):return True
 def readable(self):return True
 def tell(self):return self.pos
 def seek(self,n,whence=0):
  self.pos=n if whence==0 else self.pos+n if whence==1 else asset['size']+n
  return self.pos
 def read(self,n=-1):
  n=asset['size']-self.pos if n<0 else min(n,asset['size']-self.pos)
  if n<=0:return b''
  req=urllib.request.Request(asset['browser_download_url']+f'?cpu-range={self.pos}-{n}',headers={'Range':f'bytes={self.pos}-{self.pos+n-1}','User-Agent':'DersPusulasi-local-setup'})
  with urllib.request.urlopen(req,timeout=120) as response:
   if response.status!=206:raise RuntimeError('Range download unsupported; no large fallback download started')
   data=response.read(n+1)
  if len(data)!=n:raise RuntimeError('Unexpected range length')
  self.pos+=len(data);return data
out=root/'.runtime/ollama';out.mkdir(parents=True,exist_ok=True)
records=[]
with zipfile.ZipFile(RemoteZip()) as archive:
 selected=[i for i in archive.infolist() if not i.is_dir() and (i.filename=='ollama.exe' or ('/cuda' not in i.filename.lower() and '/vulkan' not in i.filename.lower() and i.filename.lower().endswith(('.dll','.exe')) and 'lib/ollama/' in i.filename.lower()))]
 for item in selected:
  target=(out/item.filename).resolve()
  if not target.is_relative_to(out.resolve()):raise RuntimeError('Unsafe archive path')
  existing=target.read_bytes() if target.exists() else b''
  data=existing if len(existing)==item.file_size and zlib.crc32(existing)==item.CRC else archive.read(item)
  if zlib.crc32(data)!=item.CRC:raise RuntimeError('CRC mismatch')
  target.parent.mkdir(parents=True,exist_ok=True)
  if data is not existing:target.write_bytes(data)
  records.append({'file':item.filename,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
(root/'docs/student-flow-runtime.json').write_text(json.dumps({'release':release['tag_name'],'source':asset['browser_download_url'],'files':records},indent=2),encoding='utf-8')
print('Official CPU runtime extracted:',release['tag_name'],len(records),'files',flush=True)
