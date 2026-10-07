param(
  [string]$Root = "D:\NCS2_AI",
  [string]$PythonExe = "D:\NCS2_AI\venv232\Scripts\python.exe"
)

$ErrorActionPreference = "Stop"
$Script = Join-Path $PSScriptRoot "ncs2_edge.py"
if (-not (Test-Path $PythonExe)) {
  throw "Python 3.10 NCS2 environment was not found at $PythonExe. Keep the NCS2 runtime isolated from newer Python versions."
}

$setup = Get-ChildItem -Path (Join-Path $Root "openvino_2022.3.2") -Filter "setupvars.bat" -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $setup) {
  throw "OpenVINO 2022.3.2 full Windows archive was not found under $Root\openvino_2022.3.2. Intel still supports Movidius VPU products in this maintenance release."
}

& $PythonExe -m pip install --disable-pip-version-check --no-warn-script-location "openvino==2022.3.2" "numpy==1.24.4" "pillow>=10.4,<13" "imageio-ffmpeg==0.6.0"
if ($LASTEXITCODE -ne 0) { throw "Failed to install the isolated NCS2 Python dependencies." }

$models = @(
  @{ Name='person-vehicle-bike-detection-crossroad-0078'; Base='https://storage.openvinotoolkit.org/repositories/open_model_zoo/2022.1/models_bin/2/person-vehicle-bike-detection-crossroad-0078/FP16' },
  @{ Name='face-detection-retail-0004'; Base='https://storage.openvinotoolkit.org/repositories/open_model_zoo/2022.3/models_bin/1/face-detection-retail-0004/FP16' },
  @{ Name='horizontal-text-detection-0001'; Base='https://storage.openvinotoolkit.org/repositories/open_model_zoo/2022.3/models_bin/1/horizontal-text-detection-0001/FP16' }
)
foreach ($m in $models) {
  $dir = Join-Path $Root "models\$($m.Name)\FP16"
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  foreach ($ext in @('xml','bin')) {
    $target = Join-Path $dir "$($m.Name).$ext"
    if (-not (Test-Path $target) -or (Get-Item $target).Length -lt 1024) {
      & curl.exe -L --fail --retry 3 --output $target "$($m.Base)/$($m.Name).$ext"
      if ($LASTEXITCODE -ne 0) { throw "Failed to download $($m.Name).$ext from Intel Open Model Zoo." }
    }
  }
}

$env:MAGNANIMOUS_NCS2_ROOT = $Root
$env:MAGNANIMOUS_NCS2_PYTHON = $PythonExe
[Environment]::SetEnvironmentVariable('MAGNANIMOUS_NCS2_ROOT', $Root, 'User')
[Environment]::SetEnvironmentVariable('MAGNANIMOUS_NCS2_PYTHON', $PythonExe, 'User')
$prefix = 'set "PATH=' + (Split-Path $PythonExe -Parent) + ';%PATH%" && call "' + $setup.FullName + '" >nul && '
$cmd = $prefix + '"' + $PythonExe + '" "' + $Script + '" status'
cmd.exe /d /s /c $cmd
if ($LASTEXITCODE -ne 0) { throw "NCS2 status verification failed." }
$bench = $prefix + '"' + $PythonExe + '" "' + $Script + '" benchmark --count 100 --jobs 4'
cmd.exe /d /s /c $bench
if ($LASTEXITCODE -ne 0) { throw "NCS2 benchmark verification failed." }

Write-Host ""
Write-Host "Magnanimous NCS2 Edge AI is ready on OpenVINO 2022.3.2."
Write-Host "Root: $Root"
Write-Host "Capabilities: status, benchmark, detect, media triage, bounded batch scan, sampled video scan, face-presence boxes, text regions."
