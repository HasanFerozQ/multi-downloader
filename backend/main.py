import uuid
import asyncio
import json
import redis
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

# Links to your worker and scraper logic
from worker import download_video_task 
from services.scraper import get_video_info

# ============= APP INITIALIZATION =============
app = FastAPI(title="Pro StreamDown API")
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
limiter = Limiter(key_func=get_remote_address)

# ============= CORS CONFIGURATION =============
# Allows your Next.js frontend to talk to this FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= API ENDPOINTS =============

@app.get("/analyze")
@limiter.limit("20/minute")
async def analyze(request: Request, url: str):
    cache_key = f"meta:{url}"
    cached = r.get(cache_key)
    if cached: 
        return json.loads(cached)
    
    data = get_video_info(url)
    if "error" in data: 
        raise HTTPException(status_code=400, detail=data["error"])
    
    r.setex(cache_key, 3600, json.dumps(data))
    return data

@app.get("/download/start")
async def start_download(url: str, format_id: str = "best"):
    task_id = str(uuid.uuid4())
    # The worker will save the file here temporarily
    output_path = f"temp_downloads/{task_id}.mp4"
    
    # Hand off task to Celery worker
    download_video_task.apply_async(args=[url, format_id, output_path], task_id=task_id)
    
    return {"task_id": task_id}

# NEW: The route that triggers the browser "Save As" window for the user
@app.get("/download/file/{task_id}")
async def get_actual_file(task_id: str, background_tasks: BackgroundTasks):
    file_path = f"temp_downloads/{task_id}.mp4"
    
    if os.path.exists(file_path):
        # Define the cleanup function
        def remove_file():
            try:
                os.remove(file_path)
                print(f"✅ Successfully cleaned up: {file_path}")
            except Exception as e:
                print(f"❌ Cleanup error: {e}")

        # Send the file to the browser
        response = FileResponse(
            path=file_path,
            filename=f"video_{task_id}.mp4",
            media_type='application/octet-stream'
        )
        
        # Tell FastAPI to delete the file AFTER the download finishes
        background_tasks.add_task(remove_file)
        return response
        
    raise HTTPException(status_code=404, detail="File expired or not found")

# ============= WEBSOCKET FOR LIVE PROGRESS =============

@app.websocket("/ws/progress/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        while True:
            result = download_video_task.AsyncResult(task_id)
            
            if result.state == 'PROGRESS':
                await websocket.send_json(result.info)
            
            elif result.state == 'SUCCESS':
                # Notify frontend to call the /download/file/ endpoint
                await websocket.send_json({"progress": 100, "status": "Finished", "task_id": task_id})
                break
            
            elif result.state == 'FAILURE':
                await websocket.send_json({"status": "Error"})
                break
                
            await asyncio.sleep(0.5) 
    except WebSocketDisconnect:
        pass