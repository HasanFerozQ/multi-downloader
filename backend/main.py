from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from services.scraper import get_video_info
import subprocess
import os
import re
import uuid
import asyncio
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta
import shutil
from urllib.parse import urlparse

# ============= LOGGING SETUP =============
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('downloader.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============= APP INITIALIZATION =============
app = FastAPI(
    title="5-in-1 Video Downloader API",
    description="Download videos from YouTube, TikTok, Instagram, Facebook, and X (Twitter)",
    version="2.0.0"
)

# ============= RATE LIMITING =============
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============= CORS CONFIGURATION =============
# TODO: Update with your production domain
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    # Add your production domain here
    # "https://yourdomain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ============= CONSTANTS =============
TEMP_DIR = Path("temp_downloads")
TEMP_DIR.mkdir(exist_ok=True)

ALLOWED_DOMAINS = [
    "youtube.com", "youtu.be",
    "tiktok.com", "vt.tiktok.com",
    "instagram.com",
    "facebook.com", "fb.watch", "fb.com",
    "twitter.com", "x.com"
]

MAX_FILE_SIZE_MB = 500
MIN_FREE_DISK_GB = 5

# ============= HELPER FUNCTIONS =============

def validate_url(url: str) -> bool:
    """Validate that URL is from supported platform"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "").lower()
        return any(allowed in domain for allowed in ALLOWED_DOMAINS)
    except:
        return False


def safe_filename(title: str, ext: str) -> str:
    """Generate safe filename from video title"""
    safe = re.sub(r'[^\w\s-]', '', title or "video").strip()
    safe = re.sub(r'\s+', '_', safe)
    return f"{safe[:60]}.{ext}"


def check_disk_space():
    """Ensure sufficient disk space before download"""
    try:
        stat = shutil.disk_usage(TEMP_DIR)
        free_gb = stat.free / (1024**3)
        
        if free_gb < MIN_FREE_DISK_GB:
            raise HTTPException(
                status_code=507,
                detail=f"Insufficient disk space. {free_gb:.1f}GB available, need at least {MIN_FREE_DISK_GB}GB"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking disk space: {e}")


def get_platform_cookies(url: str) -> Optional[str]:
    """Return appropriate cookie file based on platform"""
    cookie_mapping = {
        "facebook.com": "cookies_facebook.txt",
        "fb.watch": "cookies_facebook.txt",
        "instagram.com": "cookies_instagram.txt",
        "tiktok.com": "cookies_tiktok.txt",
    }
    
    for platform, cookie_file in cookie_mapping.items():
        if platform in url:
            cookie_path = os.path.join(os.getcwd(), cookie_file)
            if os.path.exists(cookie_path):
                return cookie_path
    
    # Fallback to general cookies.txt
    general_cookies = os.path.join(os.getcwd(), "cookies.txt")
    return general_cookies if os.path.exists(general_cookies) else None


def delete_file(path: str):
    """Background task to delete temp file after sending"""
    try:
        if os.path.exists(path):
            os.remove(path)
            logger.info(f"Deleted temp file: {path}")
    except Exception as e:
        logger.error(f"Failed to delete temp file {path}: {e}")


async def cleanup_old_files():
    """Cleanup files older than 1 hour - runs as background task"""
    while True:
        try:
            now = datetime.now()
            deleted_count = 0
            
            for file in TEMP_DIR.glob("*"):
                if file.is_file():
                    file_age = now - datetime.fromtimestamp(file.stat().st_mtime)
                    if file_age > timedelta(hours=1):
                        try:
                            file.unlink()
                            deleted_count += 1
                        except Exception as e:
                            logger.error(f"Error deleting {file}: {e}")
            
            if deleted_count > 0:
                logger.info(f"Cleanup: deleted {deleted_count} old files")
        
        except Exception as e:
            logger.error(f"Cleanup task error: {e}")
        
        await asyncio.sleep(3600)  # Run every hour


def download_to_file(url: str, format_id: str, output_path: str) -> tuple[bool, str]:
    """
    Downloads video to a temp file using yt-dlp.
    Returns (success: bool, error_message: str)
    
    Improvements:
    - Platform-specific format selection
    - Better audio merging for Facebook/Instagram
    - Cookie support per platform
    - FFmpeg verification
    """
    cookie_path = get_platform_cookies(url)
    
    # MP3 Audio extraction
    if format_id == "mp3":
        cmd = [
            "yt-dlp",
            "-x", "--audio-format", "mp3",
            "--audio-quality", "0",
            "--no-playlist",
            "--no-warnings",
            "-o", output_path,
            url
        ]
    
    # Video downloads with platform-specific handling
    else:
        # Facebook/Instagram: Use best single file (they have complex DASH streams)
        if "facebook.com" in url or "fb.watch" in url or "instagram.com" in url:
            cmd = [
                "yt-dlp",
                "-f", "best",  # Get best single file with audio+video
                "--merge-output-format", "mp4",
                "--recode-video", "mp4",  # Force re-encode to ensure compatibility
                "--no-playlist",
                "--no-warnings",
                "-o", output_path,
                url
            ]
        
        # TikTok: Usually has audio embedded
        elif "tiktok.com" in url:
            cmd = [
                "yt-dlp",
                "-f", "best",
                "--merge-output-format", "mp4",
                "--no-playlist",
                "--no-warnings",
                "-o", output_path,
                url
            ]
        
        # YouTube, X: Use format ID with audio merge
        else:
            cmd = [
                "yt-dlp",
                "-f", f"{format_id}+bestaudio[ext=m4a]/bestaudio/best",
                "--merge-output-format", "mp4",
                "--no-playlist",
                "--no-warnings",
                "--postprocessor-args", "-c:v copy -c:a aac -strict -2",
                "-o", output_path,
                url
            ]
    
    # Add cookies if available
    if cookie_path:
        cmd.extend(["--cookies", cookie_path])
        logger.info(f"Using cookies: {cookie_path}")
    
    # Specify FFmpeg location (update path if needed)
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        cmd.extend(["--ffmpeg-location", ffmpeg_path])
    
    # Add user agent rotation
    cmd.extend([
        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ])
    
    logger.info(f"Download command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=300,  # 5 min max
            text=True
        )
        
        if result.returncode != 0:
            error_msg = result.stderr
            logger.error(f"yt-dlp error for {url}: {error_msg}")
            
            # Parse common errors
            if "Sign in to confirm your age" in error_msg:
                return False, "Video is age-restricted and requires authentication"
            elif "Private video" in error_msg:
                return False, "Video is private"
            elif "Video unavailable" in error_msg:
                return False, "Video is unavailable or deleted"
            elif "This video is not available" in error_msg:
                return False, "Video is region-locked or not available"
            else:
                return False, "Download failed. Video may be private, region-locked, or require login."
        
        # Verify file was created
        if not os.path.exists(output_path):
            return False, "Download completed but file not found"
        
        # Verify file size
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        if file_size_mb > MAX_FILE_SIZE_MB:
            os.remove(output_path)
            return False, f"File too large ({file_size_mb:.1f}MB). Maximum: {MAX_FILE_SIZE_MB}MB"
        
        logger.info(f"Download successful: {output_path} ({file_size_mb:.2f}MB)")
        return True, ""
        
    except subprocess.TimeoutExpired:
        logger.error(f"Download timeout for {url}")
        return False, "Download timed out. Video may be too large."
    
    except Exception as e:
        logger.error(f"Download exception for {url}: {e}")
        return False, f"Download error: {str(e)}"


# ============= STARTUP/SHUTDOWN EVENTS =============

@app.on_event("startup")
async def startup_event():
    """Initialize background tasks and verify dependencies"""
    logger.info("Starting Video Downloader API")
    
    # Verify FFmpeg installation
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        logger.warning("FFmpeg not found! Some downloads may fail.")
    else:
        logger.info(f"FFmpeg found at: {ffmpeg_path}")
    
    # Verify yt-dlp installation
    ytdlp_path = shutil.which("yt-dlp")
    if not ytdlp_path:
        logger.error("yt-dlp not found! App will not work.")
    else:
        logger.info(f"yt-dlp found at: {ytdlp_path}")
    
    # Start cleanup task
    asyncio.create_task(cleanup_old_files())
    logger.info("Started temp file cleanup task")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Video Downloader API")


# ============= MIDDLEWARE =============

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = datetime.now()
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.2f}s - "
        f"IP: {request.client.host}"
    )
    
    return response


# ============= API ENDPOINTS =============

@app.get("/")
async def root():
    """API root - basic info"""
    return {
        "name": "5-in-1 Video Downloader API",
        "version": "2.0.0",
        "status": "operational",
        "supported_platforms": ["YouTube", "TikTok", "Instagram", "Facebook", "X (Twitter)"],
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze?url=<video_url>",
            "download": "/download?url=<video_url>&format_id=<format>&title=<title>"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        # Check disk space
        stat = shutil.disk_usage(TEMP_DIR)
        free_gb = stat.free / (1024**3)
        
        # Check FFmpeg
        ffmpeg_ok = shutil.which("ffmpeg") is not None
        
        # Check yt-dlp
        ytdlp_ok = shutil.which("yt-dlp") is not None
        
        status = "healthy" if (ffmpeg_ok and ytdlp_ok and free_gb > MIN_FREE_DISK_GB) else "degraded"
        
        return {
            "status": status,
            "disk_space_gb": round(free_gb, 2),
            "ffmpeg_available": ffmpeg_ok,
            "ytdlp_available": ytdlp_ok,
            "temp_files_count": len(list(TEMP_DIR.glob("*")))
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/analyze")
@limiter.limit("20/minute")  # Allow 20 analyze requests per minute
async def analyze(request: Request, url: str = Query(..., description="Video URL to analyze")):
    """
    Analyze a video URL and return available formats
    
    Rate limit: 20 requests per minute per IP
    """
    url = url.strip()
    
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    
    if not validate_url(url):
        raise HTTPException(
            status_code=400,
            detail="Unsupported platform. Supported: YouTube, TikTok, Instagram, Facebook, X (Twitter)"
        )
    
    logger.info(f"Analyze request for: {url}")
    
    try:
        data = get_video_info(url)
        
        if "error" in data:
            logger.error(f"Scraper error for {url}: {data['error']}")
            raise HTTPException(status_code=400, detail=data["error"])
        
        logger.info(f"Analysis successful: {data['title']}")
        return data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analyze exception for {url}: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/download")
@limiter.limit("10/minute")  # Allow 10 downloads per minute per IP
async def download(
    request: Request,
    background_tasks: BackgroundTasks,
    url: str = Query(..., description="Video URL to download"),
    format_id: str = Query(default="best", description="Format ID or 'mp3' for audio"),
    title: str = Query(default="video", description="Video title for filename"),
):
    """
    Download a video in specified format
    
    Rate limit: 10 requests per minute per IP
    """
    url = url.strip()
    
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    
    if not validate_url(url):
        raise HTTPException(
            status_code=400,
            detail="Unsupported platform. Supported: YouTube, TikTok, Instagram, Facebook, X (Twitter)"
        )
    
    # Check disk space before starting
    check_disk_space()
    
    ext = "mp3" if format_id == "mp3" else "mp4"
    filename = safe_filename(title, ext)
    
    # Unique temp file per request
    temp_filename = f"{uuid.uuid4().hex}.{ext}"
    temp_path = str(TEMP_DIR / temp_filename)
    
    logger.info(f"Download request: {url} - Format: {format_id} - File: {filename}")
    
    # Run download in executor to avoid blocking
    loop = asyncio.get_event_loop()
    success, error_msg = await loop.run_in_executor(
        None, download_to_file, url, format_id, temp_path
    )
    
    if not success:
        logger.error(f"Download failed for {url}: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg or "Download failed")
    
    if not os.path.exists(temp_path):
        logger.error(f"Download completed but file not found: {temp_path}")
        raise HTTPException(status_code=500, detail="Download completed but file not found")
    
    media_type = "audio/mpeg" if ext == "mp3" else "video/mp4"
    
    # Schedule cleanup
    background_tasks.add_task(delete_file, temp_path)
    
    logger.info(f"Sending file: {filename} ({os.path.getsize(temp_path) / (1024*1024):.2f}MB)")
    
    return FileResponse(
        path=temp_path,
        media_type=media_type,
        filename=filename,
        headers={
            "Cache-Control": "no-store",
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


# ============= ERROR HANDLERS =============

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return {
        "error": "Not Found",
        "message": f"Endpoint {request.url.path} not found",
        "available_endpoints": ["/", "/health", "/analyze", "/download"]
    }


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal error: {exc}")
    return {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred. Please try again later."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
