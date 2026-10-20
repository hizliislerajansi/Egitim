from pathlib import Path
import shutil,json,hashlib,subprocess
root=Path.cwd();base=Path(subprocess.check_output([str(root/'.runtime/ema/Scripts/python.exe'),'-c','import sys;print(sys.base_prefix)'],text=True).strip());dest=root/'.distribution-qa/full-runtime/payload/.runtime/ema'
dest.mkdir(parents=True,exist_ok=True)
ignore=shutil.ignore_patterns('__pycache__','*.pyc','*.pyo','site-packages','test','tests','idlelib','tkinter','turtledemo','ensurepip')
shutil.copytree(base/'Lib',dest/'Lib',dirs_exist_ok=True,ignore=ignore)
shutil.copytree(base/'DLLs',dest/'DLLs',dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.pdb','*.lib','*.exp'))
shutil.copytree(root/'.runtime/ema/Lib/site-packages',dest/'Lib/site-packages',dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','*.pyc','*.pyo','direct_url.json','tests','test'))
(dest/'Scripts').mkdir(exist_ok=True)
for p in base.iterdir():
 if p.is_file() and (p.suffix.lower()=='.dll' or p.name=='python.exe'):shutil.copy2(p,dest/'Scripts'/p.name)
shutil.copy2(base/'LICENSE.txt',dest/'LICENSE-PYTHON.txt')
(dest/'Scripts/python312._pth').write_text('../Lib\n../Lib/site-packages\n../DLLs\n.\nimport site\n',encoding='ascii')
# Only pinned public model snapshot and ref; no Hugging Face tokens, logs or locks.
model=root/'.runtime/models/hub/models--canberkkkkkk--ema-lightning';revision='7a6ba1ad216bb2f1da9863f80ac8770a6a807632';modeldest=root/'.distribution-qa/full-runtime/payload/.runtime/models/hub/models--canberkkkkkk--ema-lightning'
for name in ['ema.pt','decoder.pt']:
 target=modeldest/'snapshots'/revision/name;target.parent.mkdir(exist_ok=True,parents=True);shutil.copy2(model/'snapshots'/revision/name,target)
(modeldest/'refs').mkdir(exist_ok=True);(modeldest/'refs/main').write_text(revision,encoding='ascii')
print('Portable Python, EMA packages, pinned model staged. No venv configuration or account cache copied.')
