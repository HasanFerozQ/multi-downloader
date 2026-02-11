@echo off
TITLE King Tools Master Launcher
color 0B
set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend
set FRONTEND_DIR=%ROOT_DIR%frontend
set FFMPEG_PATH=C:\ffmpeg\bin
set PATH=%PATH%;%FFMPEG_PATH%

echo ====================================================
echo   KING TOOLS - SYSTEM RESTORATION (5 WINDOWS)
echo ====================================================

:: 1. Start Redis
tasklist /fi "imagename eq redis-server.exe" | find ":" > nul
if errorlevel 1 (start "King Redis" cmd /k "redis-server" & timeout /t 2 > nul)

:: 2. Launch FastAPI Backend
start "King Backend" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: 3. Launch Worker
start "King Worker" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && celery -A worker worker --loglevel=info --pool=solo"

:: 4. Launch Beat
start "King Beat" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && celery -A worker beat --loglevel=info"

:: 5. Launch UI (Clean Boot)
if exist "%FRONTEND_DIR%\.next\dev\lock" del /f /q "%FRONTEND_DIR%\.next\dev\lock"
start "King UI" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ====================================================
echo   BOOT COMPLETE - VISIT http://localhost:3000
echo ====================================================
pause