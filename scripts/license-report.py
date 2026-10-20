from pathlib import Path
import json, subprocess, re
root=Path(__file__).resolve().parents[1]
notices=[]; inventory=[]
def append(name,version,license_name,folder,source):
    inventory.append({'name':name,'version':version,'license':license_name,'source':source})
    notices.append(f'\n===== {name} {version} — {license_name} =====\nSource for this unmodified package: {source}\n')
    found=False
    for p in sorted(folder.iterdir()):
        if p.is_file() and re.match(r'^(licen[sc]e|copying|notice)([.\-_]|$)',p.name,re.I) and p.stat().st_size<300000:
            notices.append(p.read_text(encoding='utf-8',errors='replace'));found=True
    if not found:notices.append('License identifier is recorded above; see the exact upstream package for any additional notices.\n')
lock=json.loads((root/'package-lock.json').read_text(encoding='utf-8'))
for name,meta in sorted(lock.get('packages',{}).items()):
    folder=root/name
    if not name or not (folder/'package.json').exists():continue
    pkg=json.loads((folder/'package.json').read_text(encoding='utf-8'))
    license_name=pkg.get('license',meta.get('license','Not declared'))
    append(pkg.get('name',name),pkg.get('version',''),license_name,folder,f"https://www.npmjs.com/package/{pkg.get('name',name)}/v/{pkg.get('version','')}")
metadata=json.loads(subprocess.check_output(['cargo','metadata','--offline','--filter-platform','x86_64-pc-windows-msvc','--format-version','1','--manifest-path',str(root/'src-tauri/Cargo.toml')],text=True,encoding='utf-8'))
for pkg in sorted(metadata['packages'],key=lambda p:(p['name'],p['version'])):
    if pkg['name']=='app':continue
    append(pkg['name'],pkg['version'],pkg.get('license') or 'Not declared',Path(pkg['manifest_path']).parent,f"https://crates.io/crates/{pkg['name']}/{pkg['version']}")
(root/'docs/THIRD-PARTY-NOTICES.txt').write_text('DersPusulası distribution dependency notices\nThis file records installed package declarations; it is not a legal compatibility certification.\n'+ '\n'.join(notices),encoding='utf-8')
(root/'docs/distribution-dependencies.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2),encoding='utf-8')
print('Dependency declarations and license texts:',len(inventory))
