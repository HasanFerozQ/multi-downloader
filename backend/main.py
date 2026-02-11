import uuid, asyncio, json, redis, os, re
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from services.scraper import get_video_info
from worker import download_video_task 

app = FastAPI(title="King Tools API")
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ANALYZER ENDPOINT ---
@app.get("/analyze/seo")
async def analyze_seo(url: str, keyword: str = ""):
    """Unified Video Intelligence Endpoint"""
    data = get_video_info(url)
    if "error" in data: 
        raise HTTPException(status_code=400, detail=data["error"])
    
    # Metadata Setup
    views = data.get("view_count", 0)
    likes = data.get("like_count", 0)
    comments = data.get("comment_count", 0)
    duration = data.get("duration", 0)
    title = data.get("title", "").lower()
    desc = data.get("description", "").lower()
    tags = [t.lower() for t in data.get("tags", [])]
    kw = keyword.lower() if keyword else (tags[0] if tags else "video")

    # Metrics Calculation
    eng_rate = round(((likes + comments) / views) * 100, 2) if views > 0 else 0
    seo_checks = {
        "desc_length": len(desc) > 300,
        "has_hashtags": "#" in desc,
        "has_cta": any(x in desc for x in ["subscribe", "click", "link"]),
        "tag_count": len(tags) >= 10
    }

    return {
        "title": data.get("title"),
        "channel_intelligence": {
            "grade": "A+" if eng_rate > 5 else "A" if eng_rate > 2.5 else "B",
            "engagement": eng_rate,
            "views": views,
            "earnings": {"monthly": round((views / 1000) * 1.8, 2), "yearly": round((views / 1000) * 21.6, 2)}
        },
        "seo_metrics": {
            "overall_score": sum([25 for v in seo_checks.values() if v]),
            "kw_audit": {"title": kw in title, "desc": kw in desc, "tags": kw in tags, "top_100": kw in desc[:100]},
            "hashtags_count": desc.count("#"),
            "tag_score": min(100, round((len(tags) / 15) * 100)),
            "desc_score": min(100, round((len(desc) / 500) * 100))
        },
        "behavioral": {
            "click_potential": 10 if ("?" in title and len(title) < 70) else 7,
            "retention_risk": "High" if (duration > 900 and eng_rate < 1.5) else "Low",
            "cta_detected": seo_checks["has_cta"],
            "pacing_score": 92 if duration < 300 else 70
        },
        "technical": {
            "res": data.get("resolution", "1080p"),
            "fps": data.get("fps", 60),
            "freq": "Daily" if views > 100000 else "Weekly",
            "cat_match": "High" if kw in title else "Standard"
        },
        "tags": data.get("tags", [])
    }

# --- DOWNLOADER ENDPOINTS ---
@app.get("/download/start")
async def start_download(url: str, format_id: str = "best"):
    task_id = str(uuid.uuid4())
    output_path = f"temp_downloads/{task_id}.mp4"
    download_video_task.apply_async(args=[url, format_id, output_path], task_id=task_id)
    return {"task_id": task_id}

@app.get("/download/file/{task_id}")
async def get_actual_file(task_id: str, background_tasks: BackgroundTasks, title: str = "video"):
    file_path = f"temp_downloads/{task_id}.mp4"
    if os.path.exists(file_path):
        response = FileResponse(path=file_path, filename=f"{title}.mp4")
        background_tasks.add_task(lambda: os.remove(file_path))
        return response
    raise HTTPException(status_code=404)

@app.websocket("/ws/progress/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        while True:
            result = download_video_task.AsyncResult(task_id)
            if result.state == 'PROGRESS':
                await websocket.send_json(result.info)
            elif result.state == 'SUCCESS':
                await websocket.send_json({"progress": 100, "status": "Finished"})
                break
            await asyncio.sleep(0.5)
    except WebSocketDisconnect: pass