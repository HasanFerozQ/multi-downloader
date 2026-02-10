@echo off
title KING DOWNLOADER - MASTER CONTROL
color 0b

echo [1/4] Starting Redis Server...
:: Ensure Redis is installed and in your PATH
start cmd /k "redis-server"

timeout /t 3

echo [2/4] Starting FastAPI Backend...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo [3/4] Starting Celery Worker + Beat...
:: Starts worker and the cleanup scheduler together
start cmd /k "cd backend && venv\Scripts\activate && celery -A worker.celery worker --loglevel=info -P eventlet"
start cmd /k "cd backend && venv\Scripts\activate && celery -A worker.celery beat --loglevel=info"

echo [4/4] Starting Next.js Frontend...
start cmd /k "cd frontend && npm run dev"

echo ========================================
echo KING DOWNLOADER SYSTEMS ACTIVE
echo URL: http://localhost:3000
echo ========================================
pause