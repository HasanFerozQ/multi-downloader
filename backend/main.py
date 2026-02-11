import uuid, asyncio, json, redis, os, re
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from worker import download_video_task 
from services.scraper import get_video_info

app = FastAPI(title="King Downloader API")
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
limiter = Limiter(key_func=get_remote_address)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INPUT VALIDATION ---
SUPPORTED_DOMAINS = [
    r"(youtube\.com|youtu\.be)",
    r"(twitter\.com|x\.com)",
    r"(tiktok\.com)",
    r"(facebook\.com|fb\.watch)",
    r"(instagram\.com)"
]

def validate_url(url: str):
    """Ensure the URL belongs to a supported platform"""
    if not any(re.search(pattern, url) for pattern in SUPPORTED_DOMAINS):
        raise HTTPException(status_code=400, detail="Unsupported platform. Please use YouTube, X, TikTok, FB, or IG.")

@app.get("/analyze")
@limiter.limit("10/minute") 
async def analyze(request: Request, url: str):
    validate_url(url)
    cache_key = f"meta:{url}"
    cached = r.get(cache_key)
    if cached: return json.loads(cached)
    
    data = get_video_info(url)
    if "error" in data: raise HTTPException(status_code=400, detail=data["error"])
    
    r.setex(cache_key, 3600, json.dumps(data))
    return data

@app.get("/analyze/seo")
async def analyze_seo(url: str):
    """Pillar 1: SEO & Earnings Analysis"""
    validate_url(url)
    data = get_video_info(url)
    if "error" in data: 
        raise HTTPException(status_code=400, detail=data["error"])
    
    # --- LOGIC FOR EARNINGS & SEO ---
    views = data.get("view_count", 0)
    # Estimated Earnings based on average CPM ($2 - $5)
    est_low = (views / 1000) * 2
    est_high = (views / 1000) * 5
    
    return {
        "title": data.get("title"),
        "description": data.get("description"),
        "tags": data.get("tags", []),
        "view_count": views,
        "earnings": {
            "low": round(est_low, 2),
            "high": round(est_high, 2)
        },
        "thumbnail": data.get("thumbnail"),
        "channel": data.get("uploader"),
        "duration": data.get("duration_string")
    }

@app.get("/download/start")
@limiter.limit("5/minute") 
async def start_download(request: Request, url: str, format_id: str = "best"):
    validate_url(url)
    task_id = str(uuid.uuid4())
    output_path = f"temp_downloads/{task_id}.mp4"
    
    download_video_task.apply_async(args=[url, format_id, output_path], task_id=task_id)
    return {"task_id": task_id}

@app.get("/download/file/{task_id}")
async def get_actual_file(task_id: str, background_tasks: BackgroundTasks, title: str = "video"):
    """Handles professional file naming and auto-cleanup"""
    file_path = f"temp_downloads/{task_id}.mp4"
    safe_title = re.sub(r'[\\/*?:"<>|]', "", title)[:50] 
    
    if os.path.exists(file_path):
        def remove_file():
            try: os.remove(file_path)
            except: pass

        response = FileResponse(
            path=file_path,
            filename=f"{safe_title}.mp4",
            media_type='application/octet-stream'
        )
        background_tasks.add_task(remove_file) 
        return response
    raise HTTPException(status_code=404, detail="File expired")

@app.websocket("/ws/progress/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        while True:
            result = download_video_task.AsyncResult(task_id)
            if result.state == 'PROGRESS':
                await websocket.send_json(result.info)
            elif result.state == 'SUCCESS':
                await websocket.send_json({"progress": 100, "status": "Finished", "task_id": task_id})
                break
            elif result.state == 'FAILURE':
                await websocket.send_json({"status": "Error", "message": str(result.info)})
                break
            await asyncio.sleep(0.5) 
    except WebSocketDisconnect: pass