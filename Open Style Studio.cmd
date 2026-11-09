@echo off
if not exist "%~dp0OfflineStyleStudio\Start Style Studio.cmd" (
  echo Build the offline package first with npm run build:offline.
  pause
  exit /b 1
)
call "%~dp0OfflineStyleStudio\Start Style Studio.cmd"
