@echo off
setlocal
powershell.exe -NoProfile -File "%~dp0launch-windows.ps1" %*
if errorlevel 1 (
  echo.
  echo Magnanimous Portable Creator could not start. Read the message above.
  pause
)
endlocal
