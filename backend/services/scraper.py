import yt_dlp
import os
import logging
import random
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
]

def get_platform_cookies(url: str) -> Optional[str]:
    cookie_mapping = {
        "facebook.com": "cookies_facebook.txt",
        "fb.watch": "cookies_facebook.txt",
        "instagram.com": "cookies_instagram.txt",
        "tiktok.com": "cookies_tiktok.txt",
        "twitter.com": "cookies_x.txt",
        "x.com": "cookies_x.txt",
    }
    for platform, cookie_file in cookie_mapping.items():
        if platform in url.lower():
            cookie_path = os.path.join(os.getcwd(), cookie_file)
            if os.path.exists(cookie_path):
                return cookie_path
    return None

def get_video_info(url: str) -> Dict[str, Any]:
    cookie_path = get_platform_cookies(url)
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'user_agent': random.choice(USER_AGENTS),
        'extract_flat': False,
        'no_color': True,
    }
    if cookie_path:
        ydl_opts['cookiefile'] = cookie_path
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return {"error": "Could not extract video information"}
            if 'entries' in info:
                info = info['entries'][0]
            
            formats = []
            for f in info.get('formats', []):
                height = f.get('height')
                if height and f.get('vcodec') != 'none':
                    formats.append({"id": f.get("format_id"), "height": height, "ext": "mp4"})
            
            formats.sort(key=lambda x: x["height"], reverse=True)

            return {
                "title": info.get('title') or "Untitled",
                "thumbnail": info.get('thumbnail') or "",
                "description": info.get('description') or "",
                "tags": info.get('tags', []), 
                "view_count": info.get('view_count', 0),
                "like_count": info.get('like_count', 0),
                "comment_count": info.get('comment_count', 0),
                "uploader": info.get('uploader') or info.get('channel') or "Unknown",
                "duration": info.get('duration', 0),
                "fps": info.get('fps', 30),
                "upload_date": info.get('upload_date', ""),
                "formats": formats[:4] 
            }
    except Exception as e:
        logger.error(f"Scraper Error: {e}")
        return {"error": str(e)}