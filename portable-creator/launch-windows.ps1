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

$creatorListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$Port)
try { $creatorListener.Start(); $creatorListener.Stop() }
catch {
  try { $creatorListener.Stop() } catch {}
  throw "Port $Port is already in use. Close the other local workspace or launch with -Port 3220."
}

$HostLog = Join-Path $Logs 'creator.stdout.log'
$HostErrorLog = Join-Path $Logs 'creator.stderr.log'
$HostArguments = '"{0}" --root "{1}" --port {2}' -f $HostScript,$Root,$Port
$HostProcess = $null
try {
  $HostProcess = Start-Process -FilePath $Node -ArgumentList $HostArguments -WorkingDirectory $Root -WindowStyle Hidden -PassThru -RedirectStandardOutput $HostLog -RedirectStandardError $HostErrorLog
  $deadline = (Get-Date).AddSeconds(20)
  $ready = $false
  do {
    Start-Sleep -Milliseconds 500
    if ($HostProcess.HasExited) { break }
    try {
      $health = Invoke-RestMethod -Uri ('http://127.0.0.1:' + $Port + '/api/health') -TimeoutSec 2
      if ($health.ok -and $health.mode -eq 'offline-portable') { $ready = $true; break }
    } catch {}
  } while ((Get-Date) -lt $deadline)

  if (-not $ready) {
    if ($HostProcess -and -not $HostProcess.HasExited) { Stop-Process -Id $HostProcess.Id -Force }
    $detail = ''
    if (Test-Path $HostErrorLog) { $detail = (Get-Content -Path $HostErrorLog -Tail 8 -ErrorAction SilentlyContinue) -join ' ' }
    throw "Magnanimous local host did not pass its health check. $detail"
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

  $browserProfile = Join-Path $Data 'browser-profile'
  $browserCache = Join-Path $Cache 'browser'
  New-Item -ItemType Directory -Path $browserProfile,$browserCache -Force | Out-Null
  if (Test-Path $Chromium) {
    Start-Process -FilePath $Chromium -ArgumentList @("--user-data-dir=$browserProfile","--disk-cache-dir=$browserCache",'--app=http://127.0.0.1:'+ $Port,'--no-first-run','--disable-sync')
  } else {
    $systemEdge = $null
    $edgeCandidates = @()
    if (${env:ProgramFiles(x86)}) { $edgeCandidates += (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe') }
    if ($env:ProgramFiles) { $edgeCandidates += (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe') }
    $systemEdge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $systemEdge) {
      $edgeCommand = Get-Command msedge.exe -ErrorAction SilentlyContinue
      if ($edgeCommand) { $systemEdge = $edgeCommand.Source }
    }
    if ($systemEdge) {
      Start-Process -FilePath $systemEdge -ArgumentList @("--user-data-dir=$browserProfile","--disk-cache-dir=$browserCache",'--app=http://127.0.0.1:'+ $Port,'--no-first-run','--disable-sync')
    } else {
      Write-Warning 'No bundled Chromium or system Edge was found. The default browser may store its profile on the system drive.'
      Start-Process -FilePath ('http://127.0.0.1:' + $Port)
    }
  }
  Write-Host ''
  Write-Host ('Magnanimous Portable Creator is running at http://127.0.0.1:' + $Port)
  Write-Host 'The service is bound to this computer only. No cloud connection is used.'
  Write-Host 'Keep this window open. Press Ctrl+C to stop the local service.'
  while ($HostProcess -and -not $HostProcess.HasExited) {
    Start-Sleep -Seconds 1
    $HostProcess.Refresh()
  }
} finally {
  if ($HostProcess -and -not $HostProcess.HasExited) {
    Stop-Process -Id $HostProcess.Id -Force -ErrorAction SilentlyContinue
  }
  if ($ModelProcess -and -not $ModelProcess.HasExited) {
    Stop-Process -Id $ModelProcess.Id -Force -ErrorAction SilentlyContinue
  }
}
