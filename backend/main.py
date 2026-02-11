import uuid, asyncio, json, redis, os, re
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from worker import download_video_task 
from services.scraper import get_video_info

app = FastAPI(title="King Tools API")
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def validate_url(url: str):
    patterns = [r"youtube\.com", r"youtu\.be", r"twitter\.com", r"tiktok\.com", r"facebook\.com", r"instagram\.com"]
    if not any(re.search(p, url) for p in patterns):
        raise HTTPException(status_code=400, detail="Unsupported platform.")

@app.get("/analyze/seo")
async def analyze_seo(url: str, keyword: str = ""):
    validate_url(url)
    data = get_video_info(url)
    if "error" in data: raise HTTPException(status_code=400, detail=data["error"])
    
    # --- DATA EXTRACTION ---
    title = data.get("title", "").lower()
    desc = data.get("description", "").lower()
    tags = [t.lower() for t in data.get("tags", [])]
    views = data.get("view_count", 0)
    likes = data.get("like_count", 0)
    comments = data.get("comment_count", 0)
    duration = data.get("duration", 0)
    kw = keyword.lower() if keyword else (tags[0] if tags else "video")

    # --- CHANNEL INTELLIGENCE ---
    eng_rate = round(((likes + comments) / views) * 100, 2) if views > 0 else 0
    grade = "A+" if eng_rate > 5 else "A" if eng_rate > 3 else "B"

    # --- SEO & KEYWORD AUDIT ---
    kw_audit = {"in_title": kw in title, "in_desc": kw in desc, "in_first_100": kw in desc[:100], "in_tags": kw in tags}
    seo_checks = {"desc_length": len(desc) > 250, "has_hashtags": "#" in desc, "has_cta": any(x in desc for x in ["subscribe", "link", "follow"]), "tag_count": len(tags) >= 10}
    seo_score = sum([25 for v in seo_checks.values() if v])

    # --- BEHAVIORAL & RETENTION ---
    click_potential = 9 if len(title) < 60 and "?" in title else 7
    retention_risk = "High" if duration > 1200 and eng_rate < 2 else "Low"
    
    return {
        "title": data.get("title"),
        "channel_intelligence": {
            "views": views,
            "grade": grade,
            "engagement": eng_rate,
            "earnings": {"monthly": round((views/1000)*1.5, 2), "yearly": round((views/1000)*18, 2)}
        },
        "seo_metrics": {
            "overall_score": seo_score,
            "kw_audit": kw_audit,
            "hashtags_count": desc.count("#"),
            "tag_score": round((len(tags)/20)*100) if len(tags) < 20 else 100,
            "desc_score": 100 if len(desc) > 500 else 50
        },
        "behavioral": {
            "click_potential": click_potential,
            "retention_risk": retention_risk,
            "cta_detected": seo_checks["has_cta"]
        },
        "technical": {
            "res": f"{data.get('formats', [{}])[0].get('height', 0)}p",
            "fps": data.get("fps", 0),
            "freq": "Daily" if views > 100000 else "Weekly",
            "cat_match": "High" if kw in title else "Medium"
        },
        "tags": data.get("tags", [])
    }

# (Existing start_download and get_actual_file routes here)