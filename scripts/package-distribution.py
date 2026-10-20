"""Build parity + allowlisted delivery. No browser profiles, keys, databases or model caches."""

from pathlib import Path

import hashlib, json, re, shutil, zipfile



root=Path(__file__).resolve().parents[1]

out=root/'Çalışma/Dagitim-0.10.0-20261020'

out.mkdir(parents=True,exist_ok=True)

exe=root/'.release-build/release/derspusulasi.exe'

setup=root/'.release-build/release/bundle/nsis/study-companion_0.10.0_x64-setup.exe'

buildlog=(root/'docs/distribution-installer-build.txt').read_text(encoding='utf-8-sig',errors='replace')

if 'Finished 1 bundle' not in buildlog or not setup.exists():raise RuntimeError('Final installer build is incomplete')

qa=json.loads((root/'docs/distribution-installer-qa.json').read_text(encoding='utf-8-sig'))

if not all(qa.get(k) for k in ('bundlePayloadMatches','resourceHashesMatch','startupAlive','windowCreated','isolatedProfile')):raise RuntimeError('Installer acceptance is incomplete')

if (root/'.runtime/ollama-models/manifests/registry.ollama.ai/library/qwen2.5/1.5b').exists() and not all(qa.get(k) for k in ('localAiReady','ownedLocalAiStopped')):raise RuntimeError('Local AI lifecycle acceptance is incomplete')



def hash_file(p):

    with p.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()

build_inputs=[]

for folder in ('src','public','src-tauri','lesson-media'):

    build_inputs.extend(p for p in (root/folder).rglob('*') if p.is_file() and not any(x in {'target','__pycache__'} for x in p.relative_to(root/folder).parts))

for name in ('package.json','package-lock.json','vite.config.ts','scripts/ema_server.py','scripts/emaBridge.ts','scripts/kitten_server.py','scripts/kittenBridge.ts','scripts/vendor/kitten_inference.py','scripts/vendor/kitten_preprocess.py','docs/voice-studio-model.json','scripts/lessonMediaBridge.ts','EMA-Kur.ps1','docs/ema-runtime-lock.txt','docs/THIRD-PARTY-NOTICES.txt','docs/DISTRIBUTION-GUIDE.md','docs/vendor/EMA-LICENSE.txt'):

    build_inputs.append(root/name)

for p in build_inputs:

    if p.stat().st_mtime>exe.stat().st_mtime:raise RuntimeError('Source changed after binary build: '+p.relative_to(root).as_posix())

input_hashes={p.relative_to(root).as_posix():hash_file(p) for p in sorted(build_inputs)}

(root/'docs/distribution-build-inputs.json').write_text(json.dumps(input_hashes,ensure_ascii=False,indent=2),encoding='utf-8')

if qa.get('releaseExeSHA256')!=hash_file(exe):raise RuntimeError('Installer test belongs to a different executable')

if qa.get('installerSHA256')!=hash_file(setup):raise RuntimeError('Installer differs from the accepted setup file')



entries={}

allowed={'.ts','.tsx','.css','.json','.html','.svg','.png','.jpg','.jpeg','.webp','.woff2','.wasm','.rs','.toml','.lock','.ico','.icns','.py','.ps1','.bat','.md','.txt','.wav','.exe','.js','.cjs','.mp4'}

for folder in ('src','public','dist','src-tauri','scripts','lesson-media'):

    for p in (root/folder).rglob('*'):

        if not p.is_file() or any(x in {'target','node_modules','__pycache__'} for x in p.relative_to(root/folder).parts):continue

        if p.suffix.lower() in allowed or p.name=='.gitignore':entries[p.relative_to(root).as_posix()]=p

for name in ('.gitignore','.oxlintrc.json','package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html','README.md','baslat.bat','calistir.bat','calistir_masaustu.bat','EMA-Kur.ps1'):

    entries[name]=root/name

for p in [*(root/'docs').glob('distribution-*'),*(root/'docs').glob('student-flow-*'),*(root/'docs').glob('discovery-*'),*(root/'docs').glob('manual-start-*'),*(root/'docs').glob('admin-notebook-*'),*(root/'docs').glob('adaptive-*'),*(root/'docs').glob('full-setup-*'),*(root/'docs').glob('notebook-detail-*'),*(root/'docs').glob('voice-studio-*')]:

    if p.is_file() and not p.name.endswith('package-result.txt'):entries['docs/'+p.name]=p

for name in ('VOICE-STUDIO-REVIEW.md','DISTRIBUTION-STATUS.md','DISTRIBUTION-GUIDE.md','THIRD-PARTY-NOTICES.txt','ENGLISH-RESEARCH.md','english-research-checkpoint.json','english-research-verification.json','ema-runtime-lock.txt','EMA-STATUS.md'):

    entries['docs/'+name]=root/'docs'/name

for name in ('EMA-LICENSE.txt','OLLAMA-LICENSE.txt','QWEN2.5-LICENSE.txt'):entries['docs/vendor/'+name]=root/'docs/vendor'/name

for p in (root/'.work-backups/voice-studio-20261020').rglob('*'):

    if p.is_file() and not any(part.startswith('installed-before-update') for part in p.relative_to(root/'.work-backups/voice-studio-20261020').parts):entries['rollback/'+p.relative_to(root/'.work-backups/voice-studio-20261020').as_posix()]=p

for p in (root/'Çalışma/NotebookLM-Ayrintili-20261018').rglob('*'):

    if p.is_file() and p.suffix in {'.txt','.json','.md'}:entries['continuation/'+p.relative_to(root/'Çalışma/NotebookLM-Ayrintili-20261018').as_posix()]=p

for p in (root/'docs/vendor').glob('*'):
    if p.is_file():entries['docs/vendor/'+p.name]=p
entries['desktop/DersPusulasi.exe']=exe

entries['installer/DersPusulasi-0.10.0-Kurulum.exe']=setup



for name,p in entries.items():

    if p.suffix.lower() in {'.sqlite','.db','.pem','.key'} or any(part in {'.runtime','.research','.distribution-qa','.git','node_modules'} for part in Path(name).parts) or re.search(r'(^|/)(\.env|auth\.json|credentials|secrets)',name,re.I):raise RuntimeError('Forbidden entry: '+name)

    if p.suffix.lower() in {'.ts','.tsx','.json','.js','.py','.ps1','.toml','.txt','.md'}:

        raw=p.read_bytes();content=raw.decode('utf-16') if raw.startswith((b'\xff\xfe',b'\xfe\xff')) else raw.decode('utf-8-sig',errors='replace')

        if re.search(r'AIza[0-9A-Za-z_-]{30,}|sk-(?:proj-|ant-)?[A-Za-z0-9_-]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',content):raise RuntimeError('Credential-pattern review required (value withheld): '+name)

hashes={name:hash_file(p) for name,p in sorted(entries.items())}

archive=out/'DersPusulasi-0.10.0-Kaynak-Web-GeriAlma.zip'

with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:

    for name,p in sorted(entries.items()):z.write(p,name)

    z.writestr('SHA256.json',json.dumps(hashes,ensure_ascii=False,indent=2))

with zipfile.ZipFile(archive) as z:

    if z.testzip() is not None:raise RuntimeError('CRC mismatch')

    for name,digest in hashes.items():

        if hashlib.sha256(z.read(name)).hexdigest()!=digest:raise RuntimeError('Package hash mismatch: '+name)



appfiles={'DersPusulasi.exe':exe,'EMA-Kur.ps1':root/'EMA-Kur.ps1','ema-runtime-lock.txt':root/'docs/ema-runtime-lock.txt','scripts/ema_server.py':root/'scripts/ema_server.py','licenses/EMA-LICENSE.txt':root/'docs/vendor/EMA-LICENSE.txt','licenses/THIRD-PARTY-NOTICES.txt':root/'docs/THIRD-PARTY-NOTICES.txt','KULLANIM.md':root/'docs/DISTRIBUTION-GUIDE.md'}

appfiles.update({'licenses/'+p.name:p for p in (root/'docs/vendor').iterdir() if p.is_file()})
appfiles.update({'scripts/kitten_server.py':root/'scripts/kitten_server.py','scripts/vendor/kitten_inference.py':root/'scripts/vendor/kitten_inference.py','scripts/vendor/kitten_preprocess.py':root/'scripts/vendor/kitten_preprocess.py','docs/voice-studio-model.json':root/'docs/voice-studio-model.json'})
appfiles.update({'lesson-media/'+p.name:p for p in (root/'lesson-media').iterdir() if p.is_file()})

with zipfile.ZipFile(out/'DersPusulasi-0.10.0-Uygulama-Dosyalari.zip','w',zipfile.ZIP_DEFLATED) as z:

    for name,p in appfiles.items():z.write(p,name)

    z.writestr('SHA256.json',json.dumps({name:hash_file(p) for name,p in appfiles.items()},ensure_ascii=False,indent=2))

with zipfile.ZipFile(out/'DersPusulasi-0.10.0-Uygulama-Dosyalari.zip') as z:

    if z.testzip() is not None:raise RuntimeError('Application archive CRC mismatch')

    for name,p in appfiles.items():

        if hashlib.sha256(z.read(name)).hexdigest()!=hash_file(p):raise RuntimeError('Application archive hash mismatch')

shutil.copy2(setup,out/'DersPusulasi-0.10.0-Kurulum.exe')

for name in ('DISTRIBUTION-STATUS.md','DISTRIBUTION-GUIDE.md','distribution-tests.txt','distribution-native-tests.txt','distribution-installer-qa.json','distribution-provider-smoke.json','distribution-browser.png','distribution-mobile.png','THIRD-PARTY-NOTICES.txt'):

    shutil.copy2(root/'docs'/name,out/name)

shutil.copy2(root/'docs/DISTRIBUTION-STATUS.md',out/'DEVAM.md')

shutil.copy2(root/'docs/DISTRIBUTION-STATUS.md',root/'Çalışma/DEVAM.md')

(out/'SHA256.json').write_text(json.dumps(hashes,ensure_ascii=False,indent=2),encoding='utf-8')

for p in [*(root/'docs').glob('student-flow-*'),*(root/'docs').glob('discovery-*'),*(root/'docs').glob('manual-start-*'),*(root/'docs').glob('admin-notebook-*'),*(root/'docs').glob('adaptive-*'),*(root/'docs').glob('full-setup-*'),*(root/'docs').glob('notebook-detail-*'),*(root/'docs').glob('voice-studio-*')]:

    if p.is_file():shutil.copy2(p,out/p.name)

products=sorted(p for p in out.iterdir() if p.suffix in {'.exe','.zip'})

(out/'SHA256.txt').write_text('\n'.join(hash_file(p)+'  '+p.name for p in products)+'\n',encoding='utf-8')

print('Final package verified:',len(entries),'entries; build input parity and installer acceptance checked.')

print(out)

