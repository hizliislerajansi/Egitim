"""Allowlisted source delivery. Never reads browser storage, credentials or runtime profiles."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
out = root / 'Çalışma' / 'Ingilizce-20261017'
out.mkdir(parents=True, exist_ok=True)
entries = {}
allowed = {'.ts','.tsx','.css','.json','.html','.svg','.png','.jpg','.jpeg','.webp','.woff2','.wasm','.rs','.toml','.lock','.ico','.icns','.py','.ps1','.bat','.md','.txt','.wav','.exe','.js'}
def add(path, name):
    if not path.is_file():
        raise RuntimeError('Missing delivery file: ' + str(path))
    if (path.suffix.lower() not in allowed and path.name != '.gitignore') or any(part in {'.git','.research','.runtime','node_modules','target','__pycache__'} for part in Path(name).parts):
        return
    if re.search(r'(^|/)(\.env|auth\.json|credentials|secrets|session)', name, re.I) or path.suffix in {'.sqlite','.db','.pem','.key'}:
        raise RuntimeError('Forbidden package entry: ' + name)
    if path.suffix in {'.ts','.tsx','.json','.js','.py','.ps1','.toml','.txt','.md'}:
        content = path.read_text(encoding='utf-8-sig')
        if re.search(r'AIza[0-9A-Za-z_-]{30,}|sk-(?:proj-|ant-)?[A-Za-z0-9_-]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', content):
            raise RuntimeError('Credential-pattern review required (value withheld): ' + name)
    entries[name] = path

for folder in ('src','public','dist','src-tauri','scripts'):
    for path in (root/folder).rglob('*'):
        if path.is_file() and not any(p in {'target','node_modules','__pycache__'} for p in path.relative_to(root/folder).parts):
            add(path,path.relative_to(root).as_posix())
for name in ('.gitignore','package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html','README.md','baslat.bat','calistir.bat','calistir_masaustu.bat','EMA-Kur.ps1'):
    add(root/name,name)
for path in (root/'docs').glob('english-*'):
    if path.is_file(): add(path,'docs/'+path.name)
for name in ('ENGLISH-RESEARCH.md','ENGLISH-STATUS.md','EMA-STATUS.md','LESSON-PAGES-STATUS.md'):
    add(root/'docs'/name,'docs/'+name)
backup=root/'.work-backups/english-20261017'
for path in backup.rglob('*'):
    if path.is_file(): add(path,'rollback/'+path.relative_to(backup).as_posix())
add(root/'src-tauri/target/release/derspusulasi.exe','desktop/DersPusulasi-Ingilizce.exe')
manifest={name:hashlib.sha256(p.read_bytes()).hexdigest() for name,p in sorted(entries.items())}
archive=out/'DersPusulasi-Ingilizce-Kaynak-Web.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for name,path in sorted(entries.items()): z.write(path,name)
    z.writestr('SHA256.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for name,digest in manifest.items():
        if hashlib.sha256(z.read(name)).hexdigest()!=digest: raise RuntimeError('Hash mismatch: '+name)
for name in ('ENGLISH-STATUS.md','ENGLISH-RESEARCH.md','english-tests.txt','english-desktop-build.txt','english-native-tests.txt','english-browser.png'):
    shutil.copy2(root/'docs'/name,out/name)
shutil.copy2(root/'src-tauri/target/release/derspusulasi.exe',out/'DersPusulasi-Ingilizce.exe')
shutil.copy2(root/'docs/ENGLISH-STATUS.md',out/'DEVAM.md')
shutil.copy2(root/'docs/ENGLISH-STATUS.md',root/'Çalışma/DEVAM.md')
(out/'SHA256.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'SHA256.txt').write_text('\n'.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name for p in (archive,out/'DersPusulasi-Ingilizce.exe'))+'\n',encoding='utf-8')
print('Verified archive entries:',len(entries))
print('Credential files, user SQLite, browser sessions and runtime profiles excluded.')
print(out)
