@echo off
TITLE King Tools Master Launcher
color 0B

:: --- CONFIGURATION ---
set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend
set FRONTEND_DIR=%ROOT_DIR%frontend
set FFMPEG_PATH=C:\ffmpeg\bin
set PATH=%PATH%;%FFMPEG_PATH%

echo ====================================================
echo   KING TOOLS - FULL SYSTEM BOOT (4 WINDOWS)
echo ====================================================

:: 1. Start Redis
tasklist /fi "imagename eq redis-server.exe" | find ":" > nul
if errorlevel 1 (
    start "Redis Server" cmd /k "redis-server"
    timeout /t 2 > nul
)

:: 2. Launch FastAPI Backend
start "FastAPI Backend" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: 3. Launch Celery Engine (Combined Worker + Beat)
:: The -B flag combines them into one window as requested
start "Celery Engine" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && celery -A worker worker --loglevel=info --pool=solo -B"

:: 4. Launch Frontend UI (With Auto-Cache Clear)
:: This line specifically fixes the "FATAL: Turbopack error"
if exist "%FRONTEND_DIR%\.next" rmdir /s /q "%FRONTEND_DIR%\.next"
start "King Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ====================================================
echo   ALL SYSTEMS ONLINE
echo ====================================================
pause