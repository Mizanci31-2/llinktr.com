@echo off
setlocal
cd /d "%~dp0"
set "NODE_ENV=production"
set "NODE_EXE=E:\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

:loop
echo.
echo [%date% %time%] llinktr server baslatiliyor: http://127.0.0.1:3000/
"%NODE_EXE%" dist\index.js
echo.
echo [%date% %time%] Server kapandi. 2 saniye sonra yeniden baslatiliyor...
timeout /t 2 /nobreak >nul
goto loop
