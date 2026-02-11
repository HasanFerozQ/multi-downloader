@echo off
TITLE King Tools Master Launcher
color 0B

echo ====================================================
echo   KING TOOLS - FULL SYSTEM RESTORATION
echo ====================================================
echo.

:: 1. Start the Backend Services
echo [1/2] Launching Backend (FastAPI + Celery + Redis)...
:: We enter the backend folder specifically to find run_test.bat
start "King Backend" cmd /k "cd /d %%cd%%\backend && run_test.bat"

:: 2. Start the Frontend UI
echo [2/2] Launching Frontend UI (Next.js)...
:: Deleting cache automatically to prevent Turbopack panics
if exist "frontend\.next" (
    echo [INFO] Clearing corrupted Next.js cache...
    rmdir /s /q "frontend\.next"
)
start "King Frontend" cmd /k "cd /d %%cd%%\frontend && npm run dev"

echo.
echo ====================================================
echo   SYSTEMS BOOTING
echo   - If Frontend fails, wait 10 seconds and refresh
echo ====================================================
echo.
pause