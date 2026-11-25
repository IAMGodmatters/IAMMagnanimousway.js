[CmdletBinding()]
param(
  [switch]$LaunchOBS,
  [int]$Port = 3219
)
$ErrorActionPreference = 'Stop'
$Root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$Data = Join-Path $Root 'data'
$Logs = Join-Path $Data 'logs'
$Cache = Join-Path $Data 'cache'
$HostScript = Join-Path $Root 'host.mjs'
$NodePortable = Join-Path $Root 'runtime\node\node.exe'
$ModelServer = Join-Path $Root 'runtime\llama.cpp\llama-server.exe'
$ModelFile = Join-Path $Root 'models\magnanimous.gguf'
$ObsRoot = Join-Path $Root 'runtime\obs'
$ObsExe = Join-Path $ObsRoot 'bin\64bit\obs64.exe'
$Chromium = Join-Path $Root 'runtime\browser\chrome.exe'
$ModelProcess = $null
$env:MAGNANIMOUS_LOCAL_MODEL_ENABLED = 'false'
$env:HF_HOME = Join-Path $Cache 'huggingface'
$env:TRANSFORMERS_CACHE = Join-Path $Cache 'transformers'
$env:TORCH_HOME = Join-Path $Cache 'torch'
$env:OLLAMA_MODELS = Join-Path $Cache 'ollama'

foreach ($dir in @($Data,$Logs,$Cache,$env:HF_HOME,$env:TRANSFORMERS_CACHE,$env:TORCH_HOME,$env:OLLAMA_MODELS,(Join-Path $Data 'workspace'),(Join-Path $Data 'exports'))) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
if (-not (Test-Path $HostScript)) { throw 'The portable host file is missing. Restore the complete Magnanimous Portable Creator folder.' }

$Node = $null
if (Test-Path $NodePortable) {
  $Node = $NodePortable
} else {
  $systemNode = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($systemNode) { $Node = $systemNode.Source }
}
if (-not $Node) {
  throw 'Node.js is missing. Place the reviewed Windows Node.js runtime at runtime\node\node.exe. The launcher will not download software.'
}
$nodeVersion = (& $Node --version).Trim()
if ($nodeVersion -notmatch '^v(2[024-9]|[3-9][0-9])\.') {
  throw "Node.js 20 or newer is required. Detected: $nodeVersion"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,9931)
try { $listener.Start(); $listener.Stop() }
catch {
  try { $listener.Stop() } catch {}
  Write-Warning 'Port 9931 is already in use. The launcher will not trust or reuse an unknown local model server.'
  $ModelServer = ''
}

if ($ModelServer -and (Test-Path $ModelServer) -and (Test-Path $ModelFile)) {
  $stdout = Join-Path $Logs 'llama.stdout.log'
  $stderr = Join-Path $Logs 'llama.stderr.log'
  $ModelProcess = Start-Process -FilePath $ModelServer -ArgumentList @('--host','127.0.0.1','--port','9931','--ctx-size','4096','-m',$ModelFile) -WorkingDirectory $Root -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  $deadline = (Get-Date).AddSeconds(45)
  do {
    Start-Sleep -Milliseconds 750
    try {
      $response = Invoke-RestMethod -Uri 'http://127.0.0.1:9931/v1/models' -TimeoutSec 2
      if ($response.data -and $ModelProcess -and -not $ModelProcess.HasExited) {
        $env:MAGNANIMOUS_LOCAL_MODEL_ENABLED = 'true'
        Write-Host 'Local model ready. Prompts stay on this device.'
        break
      }
    } catch {}
  } while ((Get-Date) -lt $deadline -and $ModelProcess -and -not $ModelProcess.HasExited)
  if ($env:MAGNANIMOUS_LOCAL_MODEL_ENABLED -ne 'true') {
    if ($ModelProcess -and -not $ModelProcess.HasExited) { Stop-Process -Id $ModelProcess.Id -Force }
    $ModelProcess = $null
    Write-Warning 'The local model did not pass its health check. The creator workspace will open without AI generation.'
  }
} else {
  Write-Host 'No local model bundle found. Workspace and encrypted project storage will still work; no model will be downloaded.'
}

if ($LaunchOBS) {
  if (Test-Path $ObsExe) {
    $portableMarker = Join-Path $ObsRoot 'portable_mode'
    if (-not (Test-Path $portableMarker)) { New-Item -ItemType File -Path $portableMarker | Out-Null }
    Start-Process -FilePath $ObsExe -ArgumentList '--portable' -WorkingDirectory $ObsRoot
  } else {
    Write-Warning 'OBS Portable files are not present. Add a reviewed Windows portable distribution to runtime\obs.'
  }
}

try {
  if (Test-Path $Chromium) {
    $browserProfile = Join-Path $Data 'browser-profile'
    New-Item -ItemType Directory -Path $browserProfile -Force | Out-Null
    Start-Process -FilePath $Chromium -ArgumentList @("--user-data-dir=$browserProfile",'--app=http://127.0.0.1:'+ $Port,'--no-first-run','--disable-sync')
  } else {
    Start-Process -FilePath ('http://127.0.0.1:'+ $Port)
  }
  Write-Host ''
  Write-Host 'Magnanimous Portable Creator is running at http://127.0.0.1:'$Port
  Write-Host 'It is bound to this computer only. Keep this window open while using the workspace.'
  Write-Host 'Press Ctrl+C to stop the local creator service.'
  & $Node $HostScript --root $Root --port $Port
} finally {
  if ($ModelProcess -and -not $ModelProcess.HasExited) {
    Stop-Process -Id $ModelProcess.Id -Force -ErrorAction SilentlyContinue
  }
}
