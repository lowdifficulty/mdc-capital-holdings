@echo off
cd /d "%~dp0.."
echo.
echo === Starting MDC dev server on http://localhost:3001 ===
echo Leave this window OPEN. Close it to stop the server.
echo.
where node >nul 2>&1 || (echo ERROR: Install Node.js from https://nodejs.org & pause & exit /b 1)
call npm install
if exist .next rmdir /s /q .next
start "" cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3001"
call npm run dev
pause
