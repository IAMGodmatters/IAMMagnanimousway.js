# I AM MAGNANIMOUS WAY - optional Heimdall local setup
# Installs an official-community-manifest (hash-verified) package and refreshes the outbound-only Local Bridge.
# No firmware flashing, unlocks, USB driver replacement, or unknown AUTOBOOT executables.
[CmdletBinding()]
param([switch]$SkipBridgeRefresh,[switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$packageId = 'BenjaminDobell.Heimdall'
$version = '1.4.0'
$upstream = 'https://github.com/Benjamin-Dobell/Heimdall'
$bridgeSource = 'https://iammagnanimousway.com/downloads/local-bridge/bootstrap.ps1'
function Say([string]$message) { Write-Host "[MAGNANIMOUS] $message" }
function Find-Heimdall {
    $command = Get-Command heimdall.exe -CommandType Application -ErrorAction SilentlyContinue
    if (-not $command) { $command = Get-Command heimdall -CommandType Application -ErrorAction SilentlyContinue }
    if ($command -and (Test-Path -LiteralPath $command.Source)) { return $command.Source }
    $userLink = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\heimdall.exe'
    if (Test-Path -LiteralPath $userLink) { return $userLink }
    $saved = [Environment]::GetEnvironmentVariable('MAGNANIMOUS_HEIMDALL_PATH','User')
    if ($saved -and (Test-Path -LiteralPath $saved)) { return $saved }
    return $null
}
Say 'Checking Windows, storage, software package, and existing authorized Local Bridge.'
if ($env:OS -ne 'Windows_NT') { throw 'This script only supports Windows.' }
$c = Get-PSDrive C -PSProvider FileSystem
Say ('C: free space: ' + [math]::Round($c.Free / 1GB, 2) + ' GB')
Say ('Official source: ' + $upstream)
$exe = Find-Heimdall
if (-not $exe) {
    if ($CheckOnly) { Say 'Heimdall is NOT installed; no changes requested.'; exit 2 }
    if ($c.Free -lt 750MB) { throw 'Not enough free C: space for package-manager dependencies. Free at least 750 MB first; no change was made.' }
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw 'Windows Package Manager (winget) is not installed. Install Microsoft App Installer first.' }
    $disk = Get-PSDrive F -PSProvider FileSystem -ErrorAction SilentlyContinue
    $prefer = if ($disk) { 'F:\MagnanimousTools\Heimdall' } else { (Join-Path $env:LOCALAPPDATA 'MagnanimousTools\Heimdall') }
    Say ('Installing exact WinGet community package ' + $packageId + ' version ' + $version + ' to requested location: ' + $prefer)
    Say 'The package is distributed from the original developer and verified against the SHA-256 in the Microsoft WinGet manifest.'
    & winget install --id $packageId --exact --version $version --source winget --location $prefer --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { throw ('WinGet failed with exit code ' + $LASTEXITCODE + '. No driver changes were attempted.') }
    $env:PATH = [Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH','User')
    $exe = Find-Heimdall
    if (-not $exe -and (Test-Path -LiteralPath $prefer)) {
        $found = Get-ChildItem -LiteralPath $prefer -File -Recurse -Filter 'heimdall.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $exe = $found.FullName }
    }
    if (-not $exe) { throw 'Package manager completed, but heimdall.exe was not discovered. Verify WinGet installation before proceeding.' }
}
if (-not [string]::Equals([IO.Path]::GetFileName($exe),'heimdall.exe',[StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected executable filename; refusing to register it.' }
Say ('Heimdall executable: ' + $exe)
& $exe version
if ($LASTEXITCODE -ne 0) { throw 'Heimdall version check failed; no Local Bridge changes made.' }
[Environment]::SetEnvironmentVariable('MAGNANIMOUS_HEIMDALL_PATH',$exe,'User')
$env:MAGNANIMOUS_HEIMDALL_PATH=$exe
Say 'Heimdall executable verified and user-local path registered. USB drivers were not modified.'
if ($CheckOnly -or $SkipBridgeRefresh) {
    Say 'Bridge update skipped. Restart/refresh the local bridge separately to advertise heimdall_detect.'
    exit 0
}
$config = Join-Path $env:USERPROFILE '.magnanimous\local-bridge.json'
$hasConfig = Test-Path -LiteralPath $config
if ($c.Free -lt 1500MB) {
    Say 'Skipping Local Bridge installer refresh because C: has less than 1.5 GB free. Existing bridge was not touched.'
    Say 'After freeing space, rerun this script. Heimdall is already installed and will be reused.'
    exit 0
}
$pairingCode = if ($hasConfig) { 'REUSE-EXISTING-AUTHORIZED-PAIRING' } else { Read-Host 'Create an activation in https://iammagnanimousway.com/local-bridge and enter the code' }
if (-not $pairingCode) { throw 'A pairing code is required for a computer that has not yet been paired.' }
$temp = Join-Path $env:TEMP 'Magnanimous-Local-Bridge-Official-Bootstrap.ps1'
Say 'Retrieving the official Magnanimous Local Bridge bootstrap over HTTPS.'
Invoke-WebRequest -UseBasicParsing -Uri $bridgeSource -OutFile $temp -TimeoutSec 45
$content = Get-Content -Raw -LiteralPath $temp
if ($content -notmatch 'PairingCode' -or $content -notmatch 'Magnanimous') { throw 'Downloaded bootstrap did not match the expected installer markers. Refusing execution.' }
& $temp -PairingCode $pairingCode
Say 'Local Bridge setup call completed. Open the owner dashboard and verify READY LOCAL and Heimdall installation status.'
Say 'No Samsung phone was accessed or modified by this setup.'