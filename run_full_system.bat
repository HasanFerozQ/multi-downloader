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
echo   KING TOOLS - FULL SYSTEM BOOT
echo ====================================================
echo.

:: 1. Start Redis Server (Global Check)
echo [1/5] Checking Redis Connection...
tasklist /fi "imagename eq redis-server.exe" | find ":" > nul
if errorlevel 1 (
    echo Redis is already running.
) else (
    echo Starting Redis Server...
    start "Redis Server" cmd /k "redis-server"
    timeout /t 2 > nul
)

:: 2. Terminal 1: FastAPI Backend
echo [2/5] Launching FastAPI Backend...
start "FastAPI Backend" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: 3. Terminal 2: Celery Worker
echo [3/5] Launching Celery Worker...
start "Celery Worker" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && celery -A worker worker --loglevel=info --pool=solo"

:: 4. Terminal 3: Celery Beat (FIXED LINE BREAK)
echo [4/5] Launching Celery Beat...
start "Celery Beat" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && celery -A worker beat --loglevel=info"

:: 5. Terminal 4: Frontend UI
echo [5/5] Launching Frontend UI...
if exist "%FRONTEND_DIR%\.next" rmdir /s /q "%FRONTEND_DIR%\.next"
start "King Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ====================================================
echo   ALL SYSTEMS ONLINE
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:3000
echo ====================================================
echo.
pause