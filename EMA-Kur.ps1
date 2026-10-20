$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$emaPython=Join-Path $PSScriptRoot '.runtime/ema/Scripts/python.exe'
if(-not(Test-Path -LiteralPath $emaPython)){py -3.12 -m venv (Join-Path $PSScriptRoot '.runtime/ema');if($LASTEXITCODE-ne 0){throw 'Python 3.12 kurulumu gerekli.'}}
& $emaPython -m pip install 'torch==2.14.1+cpu' --index-url https://download.pytorch.org/whl/cpu
if($LASTEXITCODE-ne 0){throw 'PyTorch kurulamadı.'}
$emaLock=Join-Path $PSScriptRoot 'ema-runtime-lock.txt'
if(-not(Test-Path -LiteralPath $emaLock)){$emaLock=Join-Path $PSScriptRoot 'docs/ema-runtime-lock.txt'}
if(-not(Test-Path -LiteralPath $emaLock)){throw 'Sabit sürüm dosyası ema-runtime-lock.txt bulunamadı.'}
& $emaPython -m pip install --no-deps -r $emaLock
if($LASTEXITCODE-ne 0){throw 'EMA kurulamadı.'}
Write-Host 'EMA hazır. Uygulama sesi ilk istediğinde model indirilir. Sonraki kullanımlar yereldir.'
# Pin the local model revision; no account or token is needed.
$emaRevision='7a6ba1ad216bb2f1da9863f80ac8770a6a807632'
$emaCache=Join-Path $PSScriptRoot '.runtime/models/hub/models--canberkkkkkk--ema-lightning'
$emaSnapshot=Join-Path $emaCache "snapshots/$emaRevision"
New-Item -ItemType Directory -Force -Path $emaSnapshot,(Join-Path $emaCache 'refs') | Out-Null
$emaFiles=@{'ema.pt'='95AEC03DAFBE0E1D69BCA774AB597C779464729A14BC99BFCB52480090C7DFE6';'decoder.pt'='9595819B173F411340F63D11332695121A97F8BF1F6D8B6FEF0B21CF99C7AD67'}
foreach($emaName in $emaFiles.Keys){
 $emaTarget=Join-Path $emaSnapshot $emaName
 if((Test-Path -LiteralPath $emaTarget)-and (Get-FileHash -LiteralPath $emaTarget -Algorithm SHA256).Hash-eq $emaFiles[$emaName]){continue}
 $emaTemporary=$emaTarget+'.download'
 Invoke-WebRequest -Uri "https://huggingface.co/canberkkkkkk/ema-lightning/resolve/$emaRevision/$emaName" -OutFile $emaTemporary -TimeoutSec 120
 if((Get-FileHash -LiteralPath $emaTemporary -Algorithm SHA256).Hash-ne $emaFiles[$emaName]){throw 'EMA model özeti eşleşmedi.'}
 Move-Item -LiteralPath $emaTemporary -Destination $emaTarget -Force
}
Set-Content -LiteralPath (Join-Path $emaCache 'refs/main') -Value $emaRevision -Encoding ascii
Write-Host 'Doğrulanmış EMA modeli yerelde hazır; ses üretimi için internet gerekmez.'
