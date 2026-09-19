param(
  [Parameter(Mandatory=$true)][string]$PairingCode,
  [string]$WorkspaceRoot = "",
  [string]$Server = "https://iammagnanimousway.com",
  [string]$NetwalkToolkit = "",
  [switch]$InstallGit
)

$ErrorActionPreference = "Stop"

function Refresh-Path {
  $machine = [Environment]::GetEnvironmentVariable("Path","Machine")
  $user = [Environment]::GetEnvironmentVariable("Path","User")
  $env:Path = "$machine;$user"
}

function Test-PythonCandidate {
  param([Parameter(Mandatory=$true)][string]$Executable,[string[]]$PrefixArgs=@())
  try {
    $resolved = & $Executable @PrefixArgs -c "import os,sys; print(os.path.realpath(sys.executable))" 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $resolved) { return $null }
    $real = ($resolved | Select-Object -Last 1).ToString().Trim()
    if (-not $real -or -not (Test-Path $real)) { return $null }
    if ($real -match '\\WindowsApps\\python(3)?\.exe$') { return $null }
    return (Resolve-Path $real).Path
  } catch { return $null }
}

function Find-Python {
  $candidates = @()
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { $candidates += [PSCustomObject]@{ Executable=$py.Source; Args=@("-3") } }
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) { $candidates += [PSCustomObject]@{ Executable=$python.Source; Args=@() } }
  $python3 = Get-Command python3 -ErrorAction SilentlyContinue
  if ($python3) { $candidates += [PSCustomObject]@{ Executable=$python3.Source; Args=@() } }
  foreach ($candidate in $candidates) {
    $real = Test-PythonCandidate -Executable $candidate.Executable -PrefixArgs $candidate.Args
    if ($real) { return $real }
  }
  $searchRoots = @()
  if ($env:LOCALAPPDATA) { $searchRoots += (Join-Path $env:LOCALAPPDATA "Programs\Python") }
  if ($env:ProgramFiles) { $searchRoots += (Join-Path $env:ProgramFiles "Python") }
  if (${env:ProgramFiles(x86)}) { $searchRoots += (Join-Path ${env:ProgramFiles(x86)} "Python") }
  foreach ($root in ($searchRoots | Where-Object { $_ -and (Test-Path $_) })) {
    $found = Get-ChildItem -Path $root -Filter python.exe -File -Recurse -ErrorAction SilentlyContinue | Sort-Object FullName -Descending
    foreach ($item in $found) {
      $real = Test-PythonCandidate -Executable $item.FullName
      if ($real) { return $real }
    }
  }
  return $null
}

function Install-WithWinget([string]$Id,[string]$Name) {
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) { throw "$Name is required and Windows Package Manager (winget) is unavailable. Install $Name, then run this installer again." }
  Write-Host "Installing $Name with winget..."
  & $winget.Source install --id $Id -e --source winget --accept-package-agreements --accept-source-agreements --silent
  if ($LASTEXITCODE -ne 0) { throw "$Name installation failed with exit code $LASTEXITCODE." }
  Refresh-Path
}

$pythonExe = Find-Python
if (-not $pythonExe) {
  Install-WithWinget "Python.Python.3.13" "Python 3"
  Refresh-Path
  Start-Sleep -Seconds 2
  $pythonExe = Find-Python
}
if (-not $pythonExe) {
  throw "Python 3 was installed or detected, but Windows is still exposing only the Microsoft Store App Execution Alias. Disable the python.exe/python3.exe aliases under Settings > Apps > Advanced app settings > App execution aliases, then run this activation file again."
}
Write-Host "Using Python: $pythonExe"

if ($InstallGit -and -not (Get-Command git -ErrorAction SilentlyContinue)) {
  Install-WithWinget "Git.Git" "Git"
}

if (-not $WorkspaceRoot) { $WorkspaceRoot = Join-Path $env:USERPROFILE "Documents\MagnanimousWorkspace" }
$WorkspaceRoot = [Environment]::ExpandEnvironmentVariables($WorkspaceRoot)
New-Item -ItemType Directory -Force -Path $WorkspaceRoot | Out-Null
$WorkspaceRoot = (Resolve-Path $WorkspaceRoot).Path

if ($NetwalkToolkit) {
  $NetwalkToolkit = [Environment]::ExpandEnvironmentVariables($NetwalkToolkit)
  if (-not (Test-Path (Join-Path $NetwalkToolkit "scripts"))) { throw "Netwalk toolkit path does not contain the expected scripts folder: $NetwalkToolkit" }
  $NetwalkToolkit = (Resolve-Path $NetwalkToolkit).Path
}

$homeDir = Join-Path $env:USERPROFILE ".magnanimous"
New-Item -ItemType Directory -Force -Path $homeDir | Out-Null
$config = Join-Path $homeDir "local-bridge.json"
$agent = Join-Path $homeDir "bridge_agent.py"
$source = "https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/bridge_agent.py"
Write-Host "Downloading the Magnanimous Local Bridge agent..."
Invoke-WebRequest -UseBasicParsing -Uri $source -OutFile $agent

$reusePairing = $false
if (Test-Path $config) {
  try {
    $saved = Get-Content -Raw -Path $config | ConvertFrom-Json
    $savedServer = ([string]$saved.server).TrimEnd("/")
    if ($saved.device_id -and $saved.token -and $savedServer -eq $Server.TrimEnd("/")) {
      $reusePairing = $true
      Write-Host "Existing Magnanimous Local Bridge pairing found. Reusing device: $($saved.device_id)"
    }
  } catch {
    Write-Warning "Existing Local Bridge configuration could not be read. A fresh pairing will be attempted."
  }
}

if (-not $reusePairing) {
  $argsList = @($agent, "pair", "--server", $Server, "--code", $PairingCode, "--root", $WorkspaceRoot)
  if ($NetwalkToolkit) { $argsList += @("--netwalk-toolkit", $NetwalkToolkit) }
  & $pythonExe @argsList
  if ($LASTEXITCODE -ne 0) { throw "Magnanimous Local Bridge pairing failed." }
}

$taskName = "Magnanimous Local Bridge"
$runArgs = '"' + $agent + '" run'
$startupDir = [Environment]::GetFolderPath("Startup")
$startupLauncher = Join-Path $startupDir "Magnanimous-Local-Bridge.cmd"
$startupBody = "@echo off`r`nstart `"`" /min `"$pythonExe`" `"$agent`" run`r`n"
Set-Content -Path $startupLauncher -Value $startupBody -Encoding Ascii
$startupMode = "per-user Startup folder"

try {
  $action = New-ScheduledTaskAction -Execute $pythonExe -Argument $runArgs
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1)
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Outbound-only I AM MAGNANIMOUS WAY local execution bridge" -Force | Out-Null
  try { Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue } catch {}
  Start-ScheduledTask -TaskName $taskName
  $startupMode = "Windows Task Scheduler plus per-user Startup fallback"
} catch {
  Write-Warning "Task Scheduler registration was unavailable for this Windows account. Using the per-user Startup folder instead; Administrator access is not required."
}

$alreadyRunning = $false
try {
  $alreadyRunning = [bool](Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*bridge_agent.py*run*" } | Select-Object -First 1)
} catch {}
if (-not $alreadyRunning) {
  Start-Process -FilePath $pythonExe -ArgumentList $runArgs -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Magnanimous Local Bridge paired and started."
Write-Host "Authorized workspace: $WorkspaceRoot"
Write-Host "Configuration: $config"
Write-Host "Startup: $startupMode"
Write-Host "Startup launcher: $startupLauncher"
Write-Host "No inbound port was opened."
Write-Host "Magnanimous will run an automatic health check to verify real execution."
