param(
  [switch]$KeepWorkspace
)

$ErrorActionPreference = "Stop"
$taskName = "Magnanimous Local Bridge"
$homeDir = Join-Path $env:USERPROFILE ".magnanimous"

try {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($task) {
    try { Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue } catch {}
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }
} catch {
  Write-Warning "Could not remove scheduled task: $($_.Exception.Message)"
}

if (Test-Path $homeDir) {
  Remove-Item -Path $homeDir -Recurse -Force
}

if (-not $KeepWorkspace) {
  $defaultWorkspace = Join-Path $env:USERPROFILE "Documents\MagnanimousWorkspace"
  if (Test-Path $defaultWorkspace) {
    $items = Get-ChildItem -Force -ErrorAction SilentlyContinue $defaultWorkspace
    if (-not $items) { Remove-Item -Force $defaultWorkspace }
  }
}

Write-Host "Magnanimous Local Bridge local files and startup task were removed."
Write-Host "The server-side device should also be revoked from Owner Center -> Local Bridge."
