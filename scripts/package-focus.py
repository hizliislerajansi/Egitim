from pathlib import Path
import zipfile,hashlib,json,shutil
root=Path(__file__).resolve().parents[1]
output=root/'Çalışma'
output.mkdir(exist_ok=True)
archive=output/'DersPusulasi-20261016.zip'
entries=[]
for folder in ('src','public','dist','src-tauri','scripts'):
 for p in (root/folder).rglob('*'):
  if not p.is_file() or any(x in ('target','node_modules','__pycache__') for x in p.parts) or ' (1)' in p.name:continue
  entries.append((p,p.relative_to(root).as_posix()))
for name in ('package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html','baslat.bat','calistir.bat','calistir_masaustu.bat','README.md','.gitignore','.oxlintrc.json'):
 p=root/name
 if p.exists():entries.append((p,name))
for name in ('FOCUS-STATUS.md','API-STATUS.md','WORKLOG.md','focus-tests.txt','focus-native-tests.txt','focus-desktop-build.txt','focus-lint.txt','focus-home.png','focus-mobile.png','SOUND-STATUS.md','sound-tests.txt','sound-native-tests.txt','sound-desktop-build.txt','sound-verified.png','ses-denemesi.wav','VOICE-SUBJECTS-STATUS.md','voice-subjects-build.txt','voice-subjects-tests.txt','voice-subjects-desktop-build.txt','voice-subjects-final-build.txt','voice-subjects-menu.png','voice-subjects-settings.png','NARRATION-CACHE-STATUS.md','narration-gap-build.txt','narration-gap-tests.txt','narration-cache-desktop-build.txt','narration-gap-verified.png','narration-cache-verified.png'):
 p=root/'docs'/name
 if p.exists():entries.append((p,'docs/'+name))
exe=root/'src-tauri/target/release/derspusulasi.exe'
if not exe.exists():raise RuntimeError('Build derspusulasi.exe first')
entries.append((exe,'desktop/app.exe'))
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p,name in entries:z.write(p,name)
 with z.open('SHA256.json','w') as f:f.write(json.dumps({name:hashlib.sha256(p.read_bytes()).hexdigest() for p,name in entries},ensure_ascii=False,indent=2).encode('utf-8'))
with zipfile.ZipFile(archive) as z:
 hashes=json.loads(z.read('SHA256.json'))
 for name,h in hashes.items():
  if hashlib.sha256(z.read(name)).hexdigest()!=h:raise RuntimeError(name)
exe_dest=output/'DersPusulasi.exe'
try:shutil.copy2(exe,exe_dest)
except PermissionError:
 exe_dest=output/'DersPusulasi-Gemini.exe'
 shutil.copy2(exe,exe_dest)
status=root/'docs/NARRATION-CACHE-STATUS.md'
shutil.copy2(status if status.exists() else root/'docs/FOCUS-STATUS.md',output/'DEVAM.md')
(output/'SHA256.txt').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n'+hashlib.sha256(exe.read_bytes()).hexdigest()+'  '+exe_dest.name+'\n',encoding='utf-8')
print(str(exe_dest));print(str(archive));print('Verified files:',len(entries))
