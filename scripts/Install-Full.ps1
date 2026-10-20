param([string]$InstallDir=(Join-Path $env:LOCALAPPDATA 'Programs\DersPusulasi'),[switch]$NoLaunch,[switch]$ValidateOnly)

$ErrorActionPreference='Stop'

$packageRoot=$PSScriptRoot

$InstallDir=[IO.Path]::GetFullPath($InstallDir)

if($InstallDir-eq [IO.Path]::GetPathRoot($InstallDir)){throw 'Disk root cannot be an installation directory.'}

if(-not [Environment]::Is64BitOperatingSystem){throw '64-bit Windows is required.'}

$manifest=Get-Content -LiteralPath (Join-Path $packageRoot 'FULL-SHA256.json') -Raw | ConvertFrom-Json

Write-Host 'Kurulum dosyalari dogrulaniyor. Lutfen bekleyin...'

foreach($entry in $manifest.PSObject.Properties){

 $path=[IO.Path]::GetFullPath((Join-Path $packageRoot $entry.Name))

 if(-not $path.StartsWith($packageRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid package path.'}

 if(-not(Test-Path -LiteralPath $path)-or(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()-ne $entry.Value){throw ('File integrity mismatch: '+$entry.Name)}

}

if($ValidateOnly){Write-Host 'Tum paket dosyalari dogrulandi.';exit 0}

if(@(Get-Process | Where-Object {$_.ProcessName.ToLowerInvariant()-eq 'derspusulasi'}).Count){throw 'DersPusulasi acik. Uygulamayi normal kapatip kurulumu yeniden baslatin.'}

$vcInstaller=Join-Path $packageRoot 'VC_redist.x64.exe'

$vcVersion=[regex]::Match((Get-Item -LiteralPath $vcInstaller).VersionInfo.ProductVersion,'\d+\.\d+\.\d+\.\d+').Value

$vcInstalled=$false

$vcLibrary=Join-Path $env:SystemRoot 'System32\msvcp140.dll'

if((Test-Path -LiteralPath $vcLibrary)-and $vcVersion){$vcInstalled=[version](Get-Item -LiteralPath $vcLibrary).VersionInfo.FileVersion-ge [version]$vcVersion}

if(-not $vcInstalled){

 $signature=Get-AuthenticodeSignature -LiteralPath $vcInstaller

 if($signature.Status-ne 'Valid'-or $signature.SignerCertificate.Subject-notmatch 'O=Microsoft Corporation'){throw 'Microsoft Visual C++ publisher could not be verified.'}

 Write-Host 'Microsoft Visual C++ kuruluyor. Windows yonetici izni isteyebilir.'

 $dependency=Start-Process -FilePath $vcInstaller -ArgumentList @('/install','/passive','/norestart') -PassThru -Wait

 if($dependency.ExitCode-notin @(0,3010,1638)){throw ('Visual C++ installation failed: '+$dependency.ExitCode)}

}

$webview=Join-Path $packageRoot 'MicrosoftEdgeWebView2RuntimeInstallerX64.exe'

$hasWebview=$false

foreach($key in @('HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}','HKCU:\Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}')){try{$pv=(Get-ItemProperty -LiteralPath $key).pv;if([version]$pv-gt [version]'0.0.0.0'){$hasWebview=$true}}catch{}}

if(-not $hasWebview){

 $signature=Get-AuthenticodeSignature -LiteralPath $webview

 if($signature.Status-ne 'Valid'-or $signature.SignerCertificate.Subject-notmatch 'O=Microsoft Corporation'){throw 'Microsoft WebView2 publisher could not be verified.'}

 $dependency=Start-Process -FilePath $webview -ArgumentList @('/silent','/install') -WindowStyle Hidden -PassThru -Wait

 if($dependency.ExitCode-notin @(0,3010)){throw ('WebView2 installation failed: '+$dependency.ExitCode)}

}

$rollback=Join-Path $InstallDir ('.rollback\'+(Get-Date -Format 'yyyyMMdd-HHmmss'))

foreach($entry in $manifest.PSObject.Properties | Where-Object Name -like 'payload/*'){

 $relative=$entry.Name.Substring(8);$existing=[IO.Path]::GetFullPath((Join-Path $InstallDir $relative))

 if(-not $existing.StartsWith($InstallDir+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid runtime destination.'}

 if((Test-Path -LiteralPath $existing)-and(Get-FileHash -LiteralPath $existing).Hash.ToLowerInvariant()-ne $entry.Value){$saved=Join-Path $rollback $relative;New-Item -ItemType Directory -Force (Split-Path $saved -Parent) | Out-Null;Copy-Item -LiteralPath $existing -Destination $saved}

}

foreach($name in @('derspusulasi.exe','KULLANIM.md','scripts\ema_server.py')){if(Test-Path -LiteralPath (Join-Path $InstallDir $name)){$saved=Join-Path $rollback $name;New-Item -ItemType Directory -Force (Split-Path $saved -Parent) | Out-Null;Copy-Item -LiteralPath (Join-Path $InstallDir $name) -Destination $saved}}

$oldMedia=Join-Path $InstallDir 'lesson-media'

if(Test-Path -LiteralPath $oldMedia){New-Item -ItemType Directory -Force $rollback | Out-Null;Copy-Item -LiteralPath $oldMedia -Destination (Join-Path $rollback 'lesson-media') -Recurse -Force}

Write-Host 'Uygulama kuruluyor...'

$setup=Start-Process -FilePath (Join-Path $packageRoot 'DersPusulasi-0.10.0-Kurulum.exe') -ArgumentList @('/S',('/D='+$InstallDir)) -WindowStyle Hidden -Wait -PassThru

if($setup.ExitCode-ne 0){throw ('Application installation failed: '+$setup.ExitCode)}

Write-Host 'Yerel ses ve ogretmen modelleri kuruluyor...'

$runtimeEntries=@($manifest.PSObject.Properties | Where-Object Name -like 'payload/*')

$copied=0

foreach($entry in $runtimeEntries){

 $copied++

 if($copied%100-eq 0){Write-Progress -Activity 'Yerel motorlar kuruluyor' -Status ($copied.ToString()+'/'+$runtimeEntries.Count) -PercentComplete (100*$copied/$runtimeEntries.Count)}

 $relative=$entry.Name.Substring(8);$target=[IO.Path]::GetFullPath((Join-Path $InstallDir $relative))

 if(-not $target.StartsWith($InstallDir+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid runtime destination.'}

 if((Test-Path -LiteralPath $target)-and(Get-FileHash -LiteralPath $target).Hash.ToLowerInvariant()-eq $entry.Value){continue}

 $null=[IO.Directory]::CreateDirectory((Split-Path $target -Parent))

 [IO.File]::Copy((Join-Path $packageRoot $entry.Name),$target,$true)

 if((Get-FileHash -LiteralPath $target).Hash.ToLowerInvariant()-ne $entry.Value){throw ('Installed runtime mismatch: '+$relative)}

}

Write-Progress -Activity 'Yerel motorlar kuruluyor' -Completed

& (Join-Path $InstallDir '.runtime\ema\Scripts\python.exe') -I -c "import torch,numpy,ema_lightning;print('Yerel ses motoru hazir.')"

if($LASTEXITCODE-ne 0){throw 'Portable speech runtime did not load.'}

& (Join-Path $InstallDir '.runtime\kitten\Scripts\python.exe') -I -c "import onnxruntime,phonemizer,espeakng_loader;print('Yerel Ingilizce motoru hazir.')"
if($LASTEXITCODE-ne 0){throw 'Portable English runtime did not load.'}
Write-Host 'Tam kurulum tamamlandi. API anahtarlari bu paketle tasinmaz.'

if(-not $NoLaunch){Start-Process -FilePath (Join-Path $InstallDir 'derspusulasi.exe')}

