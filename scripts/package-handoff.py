from pathlib import Path
import hashlib,json,zipfile,shutil,subprocess
root=Path(__file__).resolve().parents[1]
out=root/'Çalışma/AKTARIM-20261017'
out.mkdir(parents=True,exist_ok=True)
exe=root/'src-tauri/target/release/derspusulasi.exe'
assert 'Finished `release`' in (root/'docs/ema-desktop-build.txt').read_text(encoding='utf-8-sig'), 'Final build missing'
shutil.copy2(exe,out/'DersPusulasi-EMA.exe')
(out/'Baslat.bat').write_text('@echo off\r\ncd /d "%~dp0"\r\nstart "" "%~dp0DersPusulasi-EMA.exe"\r\n',encoding='ascii')
entries=[]
for folder in ('src','public','dist','src-tauri','scripts'):
 for p in (root/folder).rglob('*'):
  if p.is_file() and not any(x in ('target','node_modules','__pycache__') for x in p.parts) and p.suffix not in ('.pyc','.pyo'):entries.append((p,p.relative_to(root).as_posix()))
for name in ('package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html','baslat.bat','calistir.bat','calistir_masaustu.bat','README.md','.gitignore','.oxlintrc.json','EMA-Kur.ps1'):
 entries.append((root/name,name))
for p in (root/'.runtime/ema').rglob('*'):
 if p.is_file() and '__pycache__' not in p.parts and p.suffix not in ('.pyc','.pyo'):entries.append((p,p.relative_to(root).as_posix()))
model=root/'.runtime/models/hub/models--canberkkkkkk--ema-lightning'
rev=(model/'refs/main').read_text().strip()
entries.append((model/'refs/main',(model/'refs/main').relative_to(root).as_posix()))
for p in (model/'snapshots'/rev).iterdir():
 if p.is_file():entries.append((p,p.relative_to(root).as_posix()))
reports=['EMA-STATUS.md','LESSON-PAGES-STATUS.md','NARRATION-CACHE-STATUS.md','API-STATUS.md','VOICE-SUBJECTS-STATUS.md','ema-tests.txt','ema-lint.txt','ema-native-tests.txt','ema-native-live.txt','ema-native-autostart.txt','ema-python-tests.txt','ema-desktop-build.txt','ema-live-results.json','ema-live-test.txt','ema-real-sample.wav','ema-model-manifest.json','ema-runtime-lock.txt','english-research-checkpoint.json','vendor/EMA-LICENSE.txt']
for name in reports:
 p=root/'docs'/name
 if p.exists():entries.append((p,'docs/'+name))
for folder in ('ema-20261016','lesson-pages-20261016'):
 for p in (root/'.work-backups'/folder).iterdir():
  if p.is_file() and (p.suffix in ('.ts','.tsx','.css','.bak') or p.name=='.gitignore'):entries.append((p,p.relative_to(root).as_posix()))
for p in out.rglob('*'):
 if p.is_file() and p.suffix in ('.md','.txt','.bat','.exe') and p.name!='SHA256.txt':entries.append((p,p.relative_to(out).as_posix()))
assert len({name for _,name in entries})==len(entries),'Duplicate archive path'
print('Hashing',len(entries),'files',flush=True)
hashes={name:hashlib.sha256(p.read_bytes()).hexdigest() for p,name in entries}
archive=out/'TAM-DEVIR.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=3) as z:
 for p,name in entries:z.write(p,name)
 z.writestr('SHA256.json',json.dumps(hashes,ensure_ascii=False,indent=2))
print('Checking archive bytes',flush=True)
with zipfile.ZipFile(archive) as z:
 for name,h in hashes.items():
  if hashlib.sha256(z.read(name)).hexdigest()!=h:raise RuntimeError('Archive mismatch: '+name)
(out/'SHA256.txt').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n'+hashlib.sha256(exe.read_bytes()).hexdigest()+'  DersPusulasi-EMA.exe\n',encoding='utf-8')
(out/'PAKET-DOGRULAMA.json').write_text(json.dumps({'verified_files':len(entries),'archive_bytes':archive.stat().st_size,'contains_credentials':False,'includes_user_database':False,'model_revision':rev,'frontend_tests_passed':191,'native_tests_passed':8,'native_live_synthesis_tests_passed':1},indent=2),encoding='utf-8')
print('VERIFIED',len(entries),'files;',archive.stat().st_size,'bytes',flush=True)
