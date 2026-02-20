import sys
import os

# Add parent directory to sys.path to allow importing backend modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid, asyncio, json, redis, re  # type: ignore
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, BackgroundTasks  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.responses import FileResponse, JSONResponse  # type: ignore
from slowapi import Limiter  # type: ignore
from slowapi.util import get_remote_address  # type: ignore
from backend.worker import download_video_task   # type: ignore
from backend.services.scraper import get_video_info  # type: ignore
from backend.services.video_analyzer import analyze_video_comprehensive  # type: ignore
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Pro StreamDown API")

from backend.routers import convert_router, feedback_router, gif_router, audio_tools_router, compress_router # type: ignore
app.include_router(convert_router)
app.include_router(feedback_router)
app.include_router(gif_router)
app.include_router(audio_tools_router)
app.include_router(compress_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if hasattr(exc, "status_code") and hasattr(exc, "detail"):
        status_code = getattr(exc, "status_code")
        detail = getattr(exc, "detail")
        return JSONResponse(
            status_code=status_code,
            content={"detail": detail},
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)
limiter = Limiter(key_func=get_remote_address)

origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure temp directory exists on startup
os.makedirs("temp_downloads", exist_ok=True)

from backend.services.validators import validate_url, sanitize_input # type: ignore

# --- INPUT VALIDATION ---
# Moved to services/validators.py

def validate_url_dependency(url: str):
    """Ensure the URL belongs to a supported platform"""
    if not validate_url(url):
        raise HTTPException(status_code=400, detail="Unsupported platform. Please use YouTube, X, TikTok, FB, or IG.")
    return sanitize_input(url)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "Pro StreamDown API"}

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

@app.get("/download/start")
@limiter.limit("5/minute")
async def start_download(request: Request, url: str, format_id: str = "best"):
    validate_url(url)
    task_id = str(uuid.uuid4())
    
    # FIXED: Proper extension handling
    if format_id == "mp3":
        output_path = f"temp_downloads/{task_id}.mp3"
    else:
        output_path = f"temp_downloads/{task_id}.mp4"
    
    download_video_task.apply_async(args=[url, format_id, output_path], task_id=task_id)
    return {"task_id": task_id, "status": "started"}

@app.get("/download/status/{task_id}")
async def check_status(task_id: str):
    """REST endpoint to check status"""
    result = download_video_task.AsyncResult(task_id)
    
    if result.state == 'PENDING':
        # Estimate queue position (simple FIFO approximation)
        # In a real production app with Celery, accurate position is hard.
        # We'll calculate it by counting how many tasks are unresolved in our specific Redis tracking if we had one.
        # For now, we'll return a generic "Waiting in queue" message, or if possible,
        # we can check Redis queue length.
        try:
            # Celery default queue is 'celery'
            queue_len = r.llen("celery")
            return {"status": "queued", "progress": 0, "queue_position": queue_len if queue_len else 1}
        except:
            return {"status": "queued", "progress": 0}
            
    elif result.state == 'PROGRESS':
        return {"status": "downloading", **result.info}
    elif result.state == 'SUCCESS':
        return {"status": "completed", "progress": 100}
    elif result.state == 'FAILURE':
        return {"status": "failed", "error": str(result.info)}
    else:
        return {"status": result.state}

@app.get("/download/file/{task_id}")
async def get_actual_file(task_id: str, background_tasks: BackgroundTasks, title: str = "video"):
    """File download with proper extension handling"""
    file_path_mp4 = f"temp_downloads/{task_id}.mp4"
    file_path_mp3 = f"temp_downloads/{task_id}.mp3"
    
    # Use str() cast to satisfy strict linter for slice
    safe_title = str(re.sub(r'[\\/*?:"<>|]', "", title))[:50]  # type: ignore
    
    if os.path.exists(file_path_mp4):
        file_path = file_path_mp4
        filename = f"{safe_title}.mp4"
        media_type = 'video/mp4'
    elif os.path.exists(file_path_mp3):
        file_path = file_path_mp3
        filename = f"{safe_title}.mp3"
        media_type = 'audio/mpeg'
    else:
        raise HTTPException(status_code=404, detail="File not found")
    
    def remove_file():
        try: os.remove(file_path)
        except: pass

    response = FileResponse(path=file_path, filename=filename, media_type=media_type)
    background_tasks.add_task(remove_file)
    return response

@app.websocket("/ws/progress/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        max_wait = 300
        start = asyncio.get_event_loop().time()
        
        while True:
            if asyncio.get_event_loop().time() - start > max_wait:
                await websocket.send_json({"status": "Error", "message": "Timeout"})
                break
            
            result = download_video_task.AsyncResult(task_id)
            
            if result.state == 'PENDING':
                await websocket.send_json({"progress": 0, "status": "Queued"})
            elif result.state == 'PROGRESS':
                await websocket.send_json(result.info)
            elif result.state == 'SUCCESS':
                await websocket.send_json({"progress": 100, "status": "Finished", "task_id": task_id})
                break
            elif result.state == 'FAILURE':
                await websocket.send_json({"status": "Error", "message": str(result.info)})
                break
            
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"status": "Error", "message": str(e)})
        except:
            pass

@app.get("/analyze-video")
@limiter.limit("10/minute")
async def analyze_video_endpoint(request: Request, url: str):
    """Comprehensive video analysis endpoint"""
    validate_url(url)
    
    cache_key = f"analysis_v5:{url}"  # v5: Data validation, engagement metrics, precise timestamp
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Run analysis in a separate thread to prevent blocking
    result = await asyncio.to_thread(analyze_video_comprehensive, url)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Cache for 1 hour
    r.setex(cache_key, 3600, json.dumps(result))
    return result

