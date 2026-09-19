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

function Find-Python {
  $cmd = Get-Command python -ErrorAction SilentlyContinue
  if (-not $cmd) { $cmd = Get-Command py -ErrorAction SilentlyContinue }
  return $cmd
}

function Install-WithWinget([string]$Id,[string]$Name) {
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) { throw "$Name is required and Windows Package Manager (winget) is unavailable. Install $Name, then run this installer again." }
  Write-Host "Installing $Name with winget..."
  & $winget.Source install --id $Id -e --source winget --accept-package-agreements --accept-source-agreements --silent
  if ($LASTEXITCODE -ne 0) { throw "$Name installation failed with exit code $LASTEXITCODE." }
  Refresh-Path
}

$python = Find-Python
if (-not $python) {
  Install-WithWinget "Python.Python.3.13" "Python 3"
  $python = Find-Python
}
if (-not $python) { throw "Python 3 installation completed but Python is still not available in PATH. Sign out/in and run the installer again." }

if ($InstallGit -and -not (Get-Command git -ErrorAction SilentlyContinue)) {
  Install-WithWinget "Git.Git" "Git"
}

if (-not $WorkspaceRoot) {
  $WorkspaceRoot = Join-Path $env:USERPROFILE "Documents\MagnanimousWorkspace"
}
$WorkspaceRoot = [Environment]::ExpandEnvironmentVariables($WorkspaceRoot)
New-Item -ItemType Directory -Force -Path $WorkspaceRoot | Out-Null
$WorkspaceRoot = (Resolve-Path $WorkspaceRoot).Path

if ($NetwalkToolkit) {
  $NetwalkToolkit = [Environment]::ExpandEnvironmentVariables($NetwalkToolkit)
  if (-not (Test-Path (Join-Path $NetwalkToolkit "scripts"))) {
    throw "Netwalk toolkit path does not contain the expected scripts folder: $NetwalkToolkit"
  }
  $NetwalkToolkit = (Resolve-Path $NetwalkToolkit).Path
}

$homeDir = Join-Path $env:USERPROFILE ".magnanimous"
New-Item -ItemType Directory -Force -Path $homeDir | Out-Null
$agent = Join-Path $homeDir "bridge_agent.py"
$source = "https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/bridge_agent.py"
Write-Host "Downloading the Magnanimous Local Bridge agent..."
Invoke-WebRequest -UseBasicParsing -Uri $source -OutFile $agent

$argsList = @($agent, "pair", "--server", $Server, "--code", $PairingCode, "--root", $WorkspaceRoot)
if ($NetwalkToolkit) { $argsList += @("--netwalk-toolkit", $NetwalkToolkit) }
& $python.Source @argsList
if ($LASTEXITCODE -ne 0) { throw "Magnanimous Local Bridge pairing failed." }

$taskName = "Magnanimous Local Bridge"
$pythonExe = $python.Source
$taskArgs = '"' + $agent + '" run'
$action = New-ScheduledTaskAction -Execute $pythonExe -Argument $taskArgs
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Outbound-only I AM MAGNANIMOUS WAY local execution bridge" -Force | Out-Null

try { Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue } catch {}
Start-ScheduledTask -TaskName $taskName

$config = Join-Path $homeDir "local-bridge.json"
Write-Host ""
Write-Host "Magnanimous Local Bridge paired and started."
Write-Host "Authorized workspace: $WorkspaceRoot"
Write-Host "Configuration: $config"
Write-Host "Startup task: $taskName"
Write-Host "No inbound port was opened."
Write-Host "Magnanimous will run an automatic health check to verify real execution."
