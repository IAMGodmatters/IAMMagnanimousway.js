# I AM MAGNANIMOUS WAY™ — Magnanimous Local Bridge
# Copyright (c) God Matters Inc. All Rights Reserved.
# Authorized client bootstrap. This file does not grant permission to copy, republish,
# reverse engineer, rebrand, or redistribute Magnanimous platform source or services.

param(
  [Parameter(Mandatory=$true)][string]$PairingCode,
  [string]$WorkspaceRoot = "",
  [string]$Server = "https://iammagnanimousway.com",
  [switch]$InstallGit
)

$ErrorActionPreference = "Stop"
$distributionBase = "https://iammagnanimousway.com/downloads/local-bridge"
$coreInstaller = Join-Path $env:TEMP "magnanimous-local-bridge-core.ps1"

try {
  Write-Host "Downloading the authorized Magnanimous Local Bridge installer..."
  Invoke-WebRequest -UseBasicParsing -Uri "$distributionBase/install-core.ps1" -OutFile $coreInstaller

  $invoke = @{
    PairingCode = $PairingCode
    Server = $Server
  }
  if ($WorkspaceRoot) { $invoke.WorkspaceRoot = $WorkspaceRoot }
  if ($InstallGit) { $invoke.InstallGit = $true }

  & $coreInstaller @invoke
  if (-not $?) { throw "Magnanimous Local Bridge core installer did not complete successfully." }
}
finally {
  Remove-Item -Force -ErrorAction SilentlyContinue $coreInstaller
}
