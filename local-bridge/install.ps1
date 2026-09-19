param(
  [Parameter(Mandatory=$true)][string]$PairingCode,
  [Parameter(Mandatory=$true)][string]$WorkspaceRoot,
  [string]$Server = "https://iammagnanimousway.com",
  [string]$NetwalkToolkit = ""
)

$ErrorActionPreference = "Stop"
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { $python = Get-Command py -ErrorAction SilentlyContinue }
if (-not $python) { throw "Python 3 is required before installing Magnanimous Local Bridge." }

$homeDir = Join-Path $env:USERPROFILE ".magnanimous"
New-Item -ItemType Directory -Force -Path $homeDir | Out-Null
$agent = Join-Path $homeDir "bridge_agent.py"
$source = "https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/bridge_agent.py"
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
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Outbound-only I AM MAGNANIMOUS WAY local execution bridge" -Force | Out-Null
Start-ScheduledTask -TaskName $taskName

Write-Host "Magnanimous Local Bridge paired and started."
Write-Host "Configuration: $homeDir\local-bridge.json"
Write-Host "No inbound port was opened."
