import hashlib,json,sys
from pathlib import Path
a,b=(Path(name).read_bytes() for name in sys.argv[1:3])
installed=b'__TAURI_BUNDLE_TYPE_VAR_NSS'
standalone=b'__TAURI_BUNDLE_TYPE_VAR_UNK'
# Tauri patches its bundle marker for NSIS, then restores the standalone binary.
normalized=a.replace(installed,standalone,1) if a.count(installed)==1 else a
print(json.dumps({'rawHashesIdentical':a==b,'bundlePayloadMatches':normalized==b,'installedExeSHA256':hashlib.sha256(a).hexdigest(),'releaseExeSHA256':hashlib.sha256(b).hexdigest(),'bundleMarkerNormalized':a!=b and normalized==b}))
