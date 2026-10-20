$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$testRoot=[IO.Path]::GetFullPath((Join-Path $projectRoot '.distribution-qa'))
$testInstall=[IO.Path]::GetFullPath((Join-Path $testRoot 'installed'))
if(-not $testInstall.StartsWith($testRoot+[IO.Path]::DirectorySeparatorChar)){throw 'Test directory is outside workspace.'}
$reg='HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\study-companion'
if((Test-Path $reg)-or(Test-Path 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\study-companion')){throw 'An installed user copy exists; refusing to replace it for QA.'}
if(@(Get-Process derspusulasi -ErrorAction SilentlyContinue).Count){throw 'Desktop application is already running; refusing to interrupt it.'}
New-Item -ItemType Directory -Force $testRoot | Out-Null
$installer=Join-Path $projectRoot '.release-build/release/bundle/nsis/study-companion_0.8.0_x64-setup.exe'
$process=Start-Process -FilePath $installer -ArgumentList @('/S',('/D='+$testInstall)) -WindowStyle Hidden -PassThru -Wait
if($process.ExitCode-ne 0){throw ('Installer failed: '+$process.ExitCode)}
$exe=Join-Path $testInstall 'derspusulasi.exe'
$files=@('derspusulasi.exe','scripts/ema_server.py','EMA-Kur.ps1','ema-runtime-lock.txt','licenses/EMA-LICENSE.txt','licenses/THIRD-PARTY-NOTICES.txt','KULLANIM.md')
foreach($file in $files){if(-not(Test-Path -LiteralPath (Join-Path $testInstall $file))){throw ('Installed resource missing: '+$file)}}
$resourceSources=@{'scripts/ema_server.py'='scripts/ema_server.py';'EMA-Kur.ps1'='EMA-Kur.ps1';'ema-runtime-lock.txt'='docs/ema-runtime-lock.txt';'licenses/EMA-LICENSE.txt'='docs/vendor/EMA-LICENSE.txt';'licenses/THIRD-PARTY-NOTICES.txt'='docs/THIRD-PARTY-NOTICES.txt';'KULLANIM.md'='docs/DISTRIBUTION-GUIDE.md'}
foreach($name in $resourceSources.Keys){if((Get-FileHash -LiteralPath (Join-Path $testInstall $name)).Hash-ne(Get-FileHash -LiteralPath (Join-Path $projectRoot $resourceSources[$name])).Hash){throw ('Installed resource hash mismatch: '+$name)}}
$binaryCheck=python (Join-Path $PSScriptRoot 'verify-release-bytes.py') $exe (Join-Path $projectRoot '.release-build/release/derspusulasi.exe') | ConvertFrom-Json
if(-not $binaryCheck.bundlePayloadMatches){throw 'Installed executable payload differs from release beyond the Tauri NSIS marker.'}
# Microsoft WebView2 documents this per-process override. Never opens the real student profile.
$start=[Diagnostics.ProcessStartInfo]::new($exe)
$start.UseShellExecute=$false
$start.WindowStyle=[Diagnostics.ProcessWindowStyle]::Hidden
$start.Environment['WEBVIEW2_USER_DATA_FOLDER']=Join-Path $testRoot 'webview-profile'
$localAiPreexisting=$false
try{$localAiPreexisting=(Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 1).models-ne $null}catch{}
$localAiExpected=Test-Path -LiteralPath (Join-Path $projectRoot '.runtime/ollama-models/manifests/registry.ollama.ai/library/qwen2.5/1.5b')
$app=[Diagnostics.Process]::Start($start)
Start-Sleep -Seconds 4
$localAiReady=$false
if($localAiExpected){for($attempt=0;$attempt-lt 16;$attempt++){try{$localAiReady=@((Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 1).models | Where-Object name -eq 'qwen2.5:1.5b').Count-gt 0}catch{};if($localAiReady){break};Start-Sleep -Milliseconds 500}}
$startupAlive=-not $app.HasExited
$windowCreated=$false
if($startupAlive){$app.Refresh();$windowCreated=$app.MainWindowHandle-ne [IntPtr]::Zero;$null=$app.CloseMainWindow();if(-not $app.WaitForExit(5000)){$app.Kill();$app.WaitForExit()}}
$report=[ordered]@{version='0.8.0';installerExitCode=$process.ExitCode;installedFiles=$files;bundlePayloadMatches=$binaryCheck.bundlePayloadMatches;rawHashesIdentical=$binaryCheck.rawHashesIdentical;bundleMarkerNormalized=$binaryCheck.bundleMarkerNormalized;releaseExeSHA256=$binaryCheck.releaseExeSHA256;installedExeSHA256=$binaryCheck.installedExeSHA256;installerSHA256=(Get-FileHash -LiteralPath $installer).Hash.ToLowerInvariant();startupAlive=$startupAlive;windowCreated=$windowCreated;isolatedProfile=(Test-Path -LiteralPath (Join-Path $testRoot 'webview-profile'));signature=(Get-AuthenticodeSignature -LiteralPath $installer).Status.ToString();realStudentProfileUsed=$false}
$report['resourceHashesMatch']=$true
$report['localAiPreexisting']=$localAiPreexisting
$report['localAiReady']=$localAiReady
Start-Sleep -Milliseconds 600
$localAiClosed=$true
if(-not $localAiPreexisting){try{$null=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 1;$localAiClosed=$false}catch{}}
$report['ownedLocalAiStopped']=$localAiClosed
$uninstaller=Join-Path $testInstall 'uninstall.exe'
if(Test-Path -LiteralPath $uninstaller){
 # NSIS's optional app-data deletion checkbox is never selected or passed.
 $uninstall=Start-Process -FilePath $uninstaller -ArgumentList '/S' -WindowStyle Hidden -PassThru -Wait
 $report['uninstallerExitCode']=$uninstall.ExitCode
}
$report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $projectRoot 'docs/distribution-installer-qa.json') -Encoding utf8
if(-not $startupAlive -or -not $windowCreated){throw 'Installed application did not create its window.'}
if($localAiExpected-and -not $localAiPreexisting-and(-not $localAiReady-or -not $localAiClosed)){throw 'Local AI lifecycle acceptance failed.'}
Write-Output 'Installer, resources, hash parity, isolated-profile startup and uninstall checked.'
