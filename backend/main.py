from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from worker import download_video_task
import redis
import json
import uuid
import asyncio
from services.scraper import get_video_info

app = FastAPI(title="9.5/10 Pro Downloader API")

# Connect to Redis for Caching
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Restrict to your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/analyze")
async def analyze(url: str):
    # REDIS CACHING: Check if we analyzed this link in the last hour
    cache_key = f"meta:{url}"
    cached_data = r.get(cache_key)
    if cached_data:
        return json.loads(cached_data)
    
    data = get_video_info(url)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    
    # Store result in Redis for 3600 seconds (1 hour)
    r.setex(cache_key, 3600, json.dumps(data))
    return data

@app.get("/download/start")
async def start_download(url: str, format_id: str = "best"):
    output_filename = f"{uuid.uuid4()}.mp4"
    output_path = f"temp_downloads/{output_filename}"
    
    # TRIGGER CELERY WORKER: Hand off the work and return task_id immediately
    task = download_video_task.delay(url, format_id, output_path)
    return {"task_id": task.id, "file_path": output_path}

@app.websocket("/ws/progress/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        while True:
            result = download_video_task.AsyncResult(task_id)
            if result.state == 'PROGRESS':
                await websocket.send_json(result.info)
            elif result.state == 'SUCCESS':
                # Signal the frontend that the file is ready for download
                await websocket.send_json({"progress": 100, "status": "Finished", "task_id": task_id})
                break
            elif result.state == 'FAILURE':
                await websocket.send_json({"status": "Error", "message": str(result.info)})
                break
            await asyncio.sleep(0.5) # Poll Redis every 0.5s
    except WebSocketDisconnect:
        pass