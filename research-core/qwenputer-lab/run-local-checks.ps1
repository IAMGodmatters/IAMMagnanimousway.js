param([string]$CheckpointDirectory = $env:QWENPUTER_CHECKPOINT_DIR)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { throw 'Python 3 is required. Install Python, then rerun this script.' }

Write-Host '=== Magnanimous AI: Qwenputer hardware preflight ===' -ForegroundColor Cyan
if ($CheckpointDirectory) {
    python (Join-Path $root 'qwenputer_preflight.py') --checkpoint-dir $CheckpointDirectory
} else {
    python (Join-Path $root 'qwenputer_preflight.py')
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host '=== CPU-only DeltaNet RAM reference tests ===' -ForegroundColor Cyan
python -m unittest discover -s (Join-Path $root 'tests') -v
exit $LASTEXITCODE
