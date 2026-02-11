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

# backend/main.py

@app.get("/analyze/seo")
async def analyze_seo(url: str):
    validate_url(url)
    data = get_video_info(url)
    if "error" in data: raise HTTPException(status_code=400, detail=data["error"])
    
    views = data.get("view_count", 0)
    # Social Blade Logic: Calculate Engagement
    # (Assuming likes/comments come from scraper)
    likes = data.get("like_count", 0)
    comments = data.get("comment_count", 0)
    engagement_rate = round(((likes + comments) / views) * 100, 2) if views > 0 else 0

    # Calculate Social Blade style "Grade"
    if views > 1000000: grade = "A+"
    elif views > 500000: grade = "A"
    elif views > 100000: grade = "B+"
    elif views > 10000: grade = "B"
    else: grade = "C"
    
    est_low = (views / 1000) * 2
    est_high = (views / 1000) * 5
    
    return {
        "title": data.get("title"),
        "uploader": data.get("uploader"),
        "view_count": views,
        "grade": grade,
        "engagement_rate": engagement_rate,
        "earnings": {"low": round(est_low, 2), "high": round(est_high, 2)},
        "tags": data.get("tags", []),
        "thumbnail": data.get("thumbnail"),
        "duration": data.get("duration_string")
    }
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