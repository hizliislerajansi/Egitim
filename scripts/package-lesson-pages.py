from pathlib import Path
import hashlib,json,zipfile,shutil
root=Path(__file__).resolve().parents[1]
out=root/'Çalışma'/'DersSayfalari-20261016'
out.mkdir(parents=True,exist_ok=True)
exe=root/'src-tauri/target/release/derspusulasi.exe'
if not exe.exists():raise RuntimeError('Desktop build missing')
entries=[]
for folder in ('src','public','dist','src-tauri','scripts'):
 for p in (root/folder).rglob('*'):
  if p.is_file() and not any(x in ('target','node_modules','__pycache__') for x in p.parts):entries.append((p,p.relative_to(root).as_posix()))
for name in ('package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html','baslat.bat','calistir.bat','calistir_masaustu.bat','README.md','.gitignore','.oxlintrc.json'):
 entries.append((root/name,name))
for name in ('LESSON-PAGES-STATUS.md','lesson-pages-tests.txt','lesson-pages-lint.txt','lesson-pages-desktop-build.txt','API-STATUS.md','NARRATION-CACHE-STATUS.md','VOICE-SUBJECTS-STATUS.md'):
 entries.append((root/'docs'/name,'docs/'+name))
entries.append((exe,'desktop/DersPusulasi-DersSayfalari.exe'))
archive=out/'DersPusulasi-Kaynak-ve-Web.zip'
hashes={name:hashlib.sha256(p.read_bytes()).hexdigest() for p,name in entries}
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p,name in entries:z.write(p,name)
 z.writestr('SHA256.json',json.dumps(hashes,ensure_ascii=False,indent=2))
with zipfile.ZipFile(archive) as z:
 for name,h in hashes.items():
  if hashlib.sha256(z.read(name)).hexdigest()!=h:raise RuntimeError('Archive mismatch: '+name)
shutil.copy2(exe,out/'DersPusulasi-DersSayfalari.exe')
for name in ('LESSON-PAGES-STATUS.md','lesson-pages-tests.txt','lesson-pages-lint.txt','lesson-pages-desktop-build.txt'):
 shutil.copy2(root/'docs'/name,out/name)
shutil.copy2(root/'docs/LESSON-PAGES-STATUS.md',out/'DEVAM.md')
shutil.copy2(root/'docs/LESSON-PAGES-STATUS.md',root/'Çalışma/DEVAM.md')
(out/'SHA256.txt').write_text('\n'.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name for p in (archive,out/'DersPusulasi-DersSayfalari.exe'))+'\n',encoding='utf-8')
print('Archive verified:',len(entries),'files')
print(out)
