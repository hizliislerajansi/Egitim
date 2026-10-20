"""Build a complete offline runtime delivery from public, pinned files only."""

from pathlib import Path

import hashlib,json,shutil,zipfile

root=Path(__file__).resolve().parents[1]

stage=root/'.distribution-qa/full-runtime'

out=root/'Çalışma/Dagitim-0.10.1-20261020'

out.mkdir(parents=True,exist_ok=True)

def sha(path):

    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()

# Reuse the already verified, public Ollama/Qwen distribution. Never copy a user home.

companion=root/'Çalışma/Dagitim-0.7.0-20261018/Yerel-Ogretmen-EkPaketi.zip'

with zipfile.ZipFile(companion) as archive:

    checks=json.loads(archive.read('YEREL-OGRETMEN-SHA256.json'))

    for name in archive.namelist():

        if not name.startswith('.runtime/') or name.endswith('/'):continue

        if '..' in Path(name).parts:raise RuntimeError('Unsafe companion path')

        target=stage/'payload'/name

        target.parent.mkdir(parents=True,exist_ok=True)

        if not target.exists() or sha(target)!=checks[name]:

            with archive.open(name) as source,target.open('wb') as dest:shutil.copyfileobj(source,dest)

        if sha(target)!=checks[name]:raise RuntimeError('Public runtime hash mismatch')

setup=root/'.release-build/release/bundle/nsis/study-companion_0.10.1_x64-setup.exe'

shutil.copy2(setup,stage/'DersPusulasi-0.10.1-Kurulum.exe')

shutil.copy2(root/'scripts/Install-Full.ps1',stage/'Install-Full.ps1')

shutil.copy2(root/'docs/DISTRIBUTION-GUIDE.md',stage/'KURULUM.md')

with (stage/'KURULUM.md').open('a',encoding='utf-8') as guide:guide.write('\nTam pakette Microsoft imzalı Visual C++ x64 kurucusu da vardır. Gerekli sürüm eksikse otomatik çalışır; Windows yönetici izni veya yeniden başlatma isteyebilir. Temiz bilgisayarda bu bağımlılığın kurulum dalı bu bilgisayarda ayrıca denenmiş sayılmaz. Resmi kaynak: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist/ .\n')

with (stage/'KURULUM.md').open('a',encoding='utf8') as guide:guide.write('\n0.10.1 GitHub güncellemesi: Yönetici paneli > Güncellemeler. Varsayılan depo https://github.com/hizliislerajansi/Egitim . Kontrol internet ister; kurulum yönetici tarafından başlatılır. Yerel sesler çevrimdışı çalışır.\n')

(stage/'TAM-KUR.bat').write_text('@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Full.ps1"\r\nif errorlevel 1 (echo Kurulum tamamlanamadi. Yukaridaki aciklamayi kontrol edin. & pause & exit /b 1)\r\npause\r\n',encoding='ascii')

for name in ('EMA-LICENSE.txt','OLLAMA-LICENSE.txt','QWEN2.5-LICENSE.txt','KITTEN-LICENSE.txt','VOICE-STUDIO-LICENSE.txt','PHONEMIZER-GPL-3.txt','ESPEAK-GPL-3.txt'):

    target=stage/'payload/licenses'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/'docs/vendor'/name,target)

shutil.copy2(root/'docs/THIRD-PARTY-NOTICES.txt',stage/'payload/licenses/THIRD-PARTY-NOTICES.txt')

files={}

for path in stage.rglob('*'):

    if not path.is_file():continue

    relative=path.relative_to(stage)

    if len(relative.parts)==1 and path.name not in {'DersPusulasi-0.10.1-Kurulum.exe','Install-Full.ps1','KURULUM.md','TAM-KUR.bat','FULL-SHA256.json','MicrosoftEdgeWebView2RuntimeInstallerX64.exe','VC_redist.x64.exe'}:continue

    if '__pycache__' in relative.parts or path.suffix in {'.pyc','.pyo'} or path.name=='FULL-SHA256.json':continue

    name=relative.as_posix()

    if name.startswith('payload/') and not (name.startswith('payload/.runtime/') or name.startswith('payload/licenses/')):raise RuntimeError('Unexpected runtime content')

    public_ca=name in {'payload/.runtime/ema/Lib/site-packages/pip/_vendor/certifi/cacert.pem','payload/.runtime/kitten/Lib/site-packages/pip/_vendor/certifi/cacert.pem'}

    if public_ca and (b'PRIVATE KEY' in path.read_bytes() or b'BEGIN CERTIFICATE' not in path.read_bytes()):raise RuntimeError('Invalid public CA bundle')

    if (path.suffix in {'.key','.pem','.sqlite','.db'} and not public_ca) or path.name in {'token','tokens','auth.json','.env','pyvenv.cfg'}:raise RuntimeError('Private runtime entry rejected')

    files[name]=path

hashes={name:sha(path) for name,path in sorted(files.items())}

(stage/'FULL-SHA256.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')

archive_path=out/'DersPusulasi-0.10.1-Tam-Kurulum.zip'

with zipfile.ZipFile(archive_path,'w',zipfile.ZIP_DEFLATED,compresslevel=1,allowZip64=True) as archive:

    for name,path in sorted(files.items()):archive.write(path,name)

    archive.write(stage/'FULL-SHA256.json','FULL-SHA256.json')

with zipfile.ZipFile(archive_path) as archive:

    for name,digest in hashes.items():

        with archive.open(name) as stream:

            if hashlib.file_digest(stream,'sha256').hexdigest()!=digest:raise RuntimeError('Full archive entry mismatch: '+name)

report={'version':'0.10.1','file':archive_path.name,'entries':len(files)+1,'bytes':archive_path.stat().st_size,'sha256':sha(archive_path),'entryHashesVerified':True,'apiKeysIncluded':False,'accountSessionsIncluded':False,'externalPythonRequired':False,'webviewInstallerIncluded':True,'portableSpeechTest':json.loads((root/'docs/full-setup-portable-voice.json').read_text())}

report['localEnglishSpeechTest']=json.loads((root/'docs/voice-studio-eight-voices.json').read_text())
report['freshTurkishSpeechTest']=json.loads((root/'docs/voice-studio-turkish-offline.json').read_text())
(root/'docs/full-setup-package.json').write_text(json.dumps(report,indent=2),encoding='utf-8')

print(json.dumps(report,indent=2))

