@echo off
cd /d "%~dp0"
start "Parecer Ambiental" /min node "%~dp0server.js"
powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 20;$i++){try{Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://127.0.0.1:4178/ | Out-Null; $ok=$true; break}catch{Start-Sleep -Milliseconds 500}}; if(-not $ok){exit 1}"
if errorlevel 1 (
  echo Nao foi possivel iniciar o aplicativo.
  pause
  exit /b 1
)
start "" http://127.0.0.1:4178