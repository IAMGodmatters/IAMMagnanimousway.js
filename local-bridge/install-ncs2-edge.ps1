param(
  [string]$Root = "D:\NCS2_AI",
  [string]$PythonExe = "D:\Python310\python.exe"
)

$ErrorActionPreference = "Stop"
$ModelName = "person-vehicle-bike-detection-2004"
$ModelDir = Join-Path $Root "models\$ModelName\FP16"
$Script = Join-Path $PSScriptRoot "ncs2_edge.py"

if (-not (Test-Path $PythonExe)) {
  throw "Python 3.10 was not found at $PythonExe. Keep the NCS2 runtime isolated from newer Python versions."
}

$setup = Get-ChildItem -Path (Join-Path $Root "openvino_2022.3.1") -Filter "setupvars.bat" -Recurse -File -ErrorAction SilentlyContinue |
  Select-Object -First 1
if (-not $setup) {
  throw "OpenVINO 2022.3.1 full Windows archive was not found under $Root\openvino_2022.3.1."
}

New-Item -ItemType Directory -Path $ModelDir -Force | Out-Null
& $PythonExe -m pip install --disable-pip-version-check --no-warn-script-location "numpy==1.24.4" "pillow==10.4.0"

$base = "https://storage.openvinotoolkit.org/repositories/open_model_zoo/2021.4/models_bin/2/$ModelName/FP16"
foreach ($ext in @("xml","bin")) {
  $target = Join-Path $ModelDir "$ModelName.$ext"
  if (-not (Test-Path $target) -or (Get-Item $target).Length -lt 1024) {
    & curl.exe -L --fail --retry 3 --output $target "$base/$ModelName.$ext"
    if ($LASTEXITCODE -ne 0) { throw "Failed to download $ModelName.$ext from Intel Open Model Zoo." }
  }
}

$env:MAGNANIMOUS_NCS2_ROOT = $Root
$cmd = 'call "' + $setup.FullName + '" >nul && "' + $PythonExe + '" "' + $Script + '" status'
cmd.exe /d /s /c $cmd
if ($LASTEXITCODE -ne 0) { throw "NCS2 status verification failed." }

$bench = 'call "' + $setup.FullName + '" >nul && "' + $PythonExe + '" "' + $Script + '" benchmark --count 100 --jobs 4'
cmd.exe /d /s /c $bench
if ($LASTEXITCODE -ne 0) { throw "NCS2 benchmark verification failed." }

Write-Host ""
Write-Host "Magnanimous NCS2 Edge AI is ready."
Write-Host "Root: $Root"
Write-Host "Model: $ModelDir"
Write-Host "The Local Bridge will advertise ncs2_status, ncs2_benchmark, and ncs2_detect when this runtime is present."
