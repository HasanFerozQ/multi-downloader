@echo off
title Multi-Downloader - Python 3.13 Compatible Start
color 0A

echo ========================================
echo   Multi-Downloader (Python 3.13 Mode)
echo ========================================
echo.

REM Set project paths
set PROJECT_ROOT=C:\Users\Hasan-PC\Desktop\multi-downloader
set BACKEND_DIR=%PROJECT_ROOT%\backend
set FRONTEND_DIR=%PROJECT_ROOT%\frontend

cd /d "%PROJECT_ROOT%"

REM ========================================
REM   Clean Previous Instances
REM ========================================

echo [CLEANUP] Stopping any existing instances...
taskkill /F /IM redis-server.exe 2>nul
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

REM ========================================
REM   Start Services
REM ========================================

echo [STARTING] Services...
echo.

REM 1. Redis Server
echo [1/4] Starting Redis Server...
start "Redis Server" redis-server
timeout /t 2 /nobreak >nul
echo   [OK] Redis started

REM 2. Celery Worker with GEVENT pool (Python 3.13 compatible)
echo [2/4] Starting Celery Worker (gevent pool)...
start "Celery Worker" cmd /k "cd /d %BACKEND_DIR% && celery -A worker.celery worker --loglevel=info --pool=gevent --concurrency=10"
timeout /t 3 /nobreak >nul
echo   [OK] Celery Worker started

REM 3. FastAPI Backend
echo [3/4] Starting FastAPI Backend (Port 8000)...
start "FastAPI Backend" cmd /k "cd /d %BACKEND_DIR% && uvicorn main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 4 /nobreak >nul
echo   [OK] FastAPI started

REM 4. Next.js Frontend
echo [4/4] Starting Next.js Frontend (Port 3000)...
start "Next.js Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"
timeout /t 3 /nobreak >nul
echo   [OK] Next.js started

echo.
echo ========================================
echo   ALL SERVICES RUNNING!
echo ========================================
echo.
echo Services:
echo   Redis Server     : Running
echo   Celery Worker    : gevent pool (Python 3.13 compatible)
echo   FastAPI Backend  : http://127.0.0.1:8000
echo   Next.js Frontend : http://localhost:3000
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

start http://localhost:3000

echo.
echo Application ready! Check the terminal windows for logs.
echo To stop: run stop-dev.bat or close all windows
echo.
pause
