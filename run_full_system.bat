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
echo   KING TOOLS - FULL SYSTEM RESTORATION
echo ====================================================

:: 1. Start Redis Server
echo [1/5] Checking Redis...
tasklist /fi "imagename eq redis-server.exe" | find ":" > nul
if errorlevel 1 (
    echo Starting Redis Server...
    start "King Redis" cmd /k "redis-server"
    timeout /t 2 > nul
) else (
    echo Redis is already running.
)

:: 2. Terminal 1: FastAPI Backend
echo [2/5] Launching FastAPI Backend...
start "King Backend" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: 3. Terminal 2: Celery Worker (The Muscle)
echo [3/5] Launching Celery Worker...
:: --pool=solo is REQUIRED for yt-dlp subprocesses on Windows
start "King Worker" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && celery -A worker worker --loglevel=info --pool=solo"

:: 4. Terminal 3: Celery Beat (The Scheduler)
echo [4/5] Launching Celery Beat...
start "King Beat" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && celery -A worker beat --loglevel=info"

:: 5. Terminal 4: Frontend UI (Clean Boot)
echo [5/5] Launching Frontend UI...
:: Automatically clearing Turbopack lock and cache to prevent infinite loading
if exist "%FRONTEND_DIR%\.next\dev\lock" del /f /q "%FRONTEND_DIR%\.next\dev\lock"
start "King UI" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ====================================================
echo   ALL SYSTEMS ONLINE - VISIT http://localhost:3000
echo ====================================================
echo.
pause