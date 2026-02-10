import uuid
import asyncio
import json
import redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from worker import download_video_task 
from services.scraper import get_video_info

app = FastAPI(title="Pro 5-in-1 Downloader")
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
limiter = Limiter(key_func=get_remote_address)

# ============= CORS CONFIGURATION =============
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
    # REDIS CACHE: Check if we analyzed this link in the last hour
    cache_key = f"meta:{url}"
    cached = r.get(cache_key)
    if cached: 
        return json.loads(cached)
    
    data = get_video_info(url)
    if "error" in data: 
        raise HTTPException(status_code=400, detail=data["error"])
    
    # Store result in Redis for 1 hour
    r.setex(cache_key, 3600, json.dumps(data))
    return data

@app.get("/download/start")
async def start_download(url: str, format_id: str = "best"):
    task_id = str(uuid.uuid4())
    output_path = f"temp_downloads/{task_id}.mp4"
    # Send task to Celery worker via Memurai
    download_video_task.apply_async(args=[url, format_id, output_path], task_id=task_id)
    return {"task_id": task_id}

# ============= WEBSOCKET FOR PROGRESS =============

@app.websocket("/ws/progress/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        while True:
            result = download_video_task.AsyncResult(task_id)
            if result.state == 'PROGRESS':
                await websocket.send_json(result.info)
            elif result.state == 'SUCCESS':
                # Final message to frontend
                await websocket.send_json({"progress": 100, "status": "Finished", "task_id": task_id})
                break
            elif result.state == 'FAILURE':
                await websocket.send_json({"status": "Error"})
                break
            await asyncio.sleep(0.5) # Poll Redis every 0.5s
    except WebSocketDisconnect:
        pass