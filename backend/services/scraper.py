import yt_dlp
import os
import logging
import random
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# User agent rotation to mitigate bot detection 
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
]

def get_platform_cookies(url: str) -> Optional[str]:
    """Return appropriate cookie file based on platform """
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
    """
    Extract video information for both Downloading and SEO Analysis.
    """
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
            logger.info(f"Extracting info for: {url}")
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return {"error": "Could not extract video information"}
            
            # Handle playlists by taking the first entry 
            if 'entries' in info:
                if not info['entries']:
                    return {"error": "Playlist is empty"}
                info = info['entries'][0]
            
            formats = []
            seen_heights = set()
            
            for f in info.get('formats', []):
                height = f.get('height')
                vcodec = f.get('vcodec', 'none')
                format_id = f.get("format_id")
                
                # Filter for valid video formats with resolutions 
                if not height or vcodec == 'none' or not format_id:
                    continue
                if height < 144 or height in seen_heights:
                    continue
                
                seen_heights.add(height)
                
                quality_labels = {
                    144: "144p", 240: "240p", 360: "360p", 480: "480p SD",
                    720: "720p HD", 1080: "1080p Full HD", 1440: "1440p 2K", 2160: "2160p 4K"
                }
                
                formats.append({
                    "id": format_id,
                    "quality": quality_labels.get(height, f"{height}p"),
                    "height": height,
                    "ext": "mp4"
                })
            
            formats.sort(key=lambda x: x["height"], reverse=True) # Highest quality first

            # Extraction of Metadata for Video Analyzer Pillar 
            return {
                "title": info.get('title') or "Untitled",
                "thumbnail": info.get('thumbnail') or (info.get('thumbnails', [{}])[-1].get('url') if info.get('thumbnails') else ""),
                "description": info.get('description') or "",
                "tags": info.get('tags', []),  # Crucial for SEO Pillar [cite: 10]
                "view_count": info.get('view_count', 0),  # Crucial for Earnings Pillar [cite: 10]
                "uploader": info.get('uploader') or info.get('channel') or "Unknown",
                "duration_string": info.get('duration_string') or "0:00",
                "formats": formats[:4] # Top 4 resolutions for the UI 
            }
            
    except Exception as e:
        logger.error(f"Scraper Error: {e}")
        return {"error": str(e)}