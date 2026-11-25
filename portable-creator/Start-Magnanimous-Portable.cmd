@echo off
setlocal
rem Process-scoped execution policy only; no persistent computer policy is changed.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch-windows.ps1" %*
if errorlevel 1 (
  echo.
  echo Magnanimous Portable Creator could not start. Read the message above.
  pause
)
endlocal
