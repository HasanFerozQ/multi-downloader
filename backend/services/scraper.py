import yt_dlp  # type: ignore
import os
import logging
from typing import Dict, Any, Optional
import random

logger = logging.getLogger(__name__)

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
]


def get_platform_cookies(url: str) -> Optional[str]:
    """Return appropriate cookie file based on platform"""
    cookie_mapping = {
        "facebook.com": "cookies_facebook.txt",
        "fb.watch": "cookies_facebook.txt",
        "fb.com": "cookies_facebook.txt",
        "instagram.com": "cookies_instagram.txt",
        "tiktok.com": "cookies_tiktok.txt",
    }
    
    for platform, cookie_file in cookie_mapping.items():
        if platform in url.lower():
            cookie_path = os.path.join(os.getcwd(), cookie_file)
            if os.path.exists(cookie_path):
                logger.info(f"Using cookies for {platform}: {cookie_file}")
                return cookie_path
    
    general_cookies = os.path.join(os.getcwd(), "cookies.txt")
    if os.path.exists(general_cookies):
        logger.info("Using general cookies.txt")
        return general_cookies
    
    logger.warning("No cookies found - private/logged-in content may fail")
    return None


def get_video_info(url: str) -> Dict[str, Any]:
    """Extract video information and available formats"""
    
    cookie_path = get_platform_cookies(url)
    
    ydl_opts: Dict[str, Any] = {
        'quiet': True,
        'no_warnings': True,
        'user_agent': random.choice(USER_AGENTS),
        'extract_flat': False,
        'no_color': True,
        'retries': 3,
        'fragment_retries': 3,
    }
    
    if cookie_path:
        ydl_opts['cookiefile'] = cookie_path
    
    if "tiktok.com" in url:
        ydl_opts['http_headers'] = {'Referer': 'https://www.tiktok.com/'}

    # Proxy Support
    proxy_url = os.getenv("PROXY_URL")
    if proxy_url:
        logger.info(f"Using proxy: {proxy_url}")
        ydl_opts['proxy'] = proxy_url
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logger.info(f"Extracting info for: {url}")
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return {"error": "Could not extract video information"}
            
            # Handle playlists
            if 'entries' in info:
                logger.warning("URL is a playlist, using first video")
                if not info['entries']:
                    return {"error": "Playlist is empty"}
                info = info['entries'][0]
            
            formats = []
            seen_heights = set()
            seen_combinations = set()
            
            for f in info.get('formats', []):
                height = f.get('height')
                vcodec = f.get('vcodec', 'none')
                acodec = f.get('acodec', 'none')
                format_id = f.get("format_id")
                
                if not height or vcodec == 'none' or not format_id:
                    continue
                
                if height < 144:
                    continue
                
                combo_key = f"{height}_{vcodec[:4]}"
                
                if height in seen_heights or combo_key in seen_combinations:
                    continue
                
                seen_heights.add(height)
                seen_combinations.add(combo_key)
                
                quality_labels = {
                    144:  "144p",
                    240:  "240p",
                    360:  "360p",
                    480:  "480p SD",
                    720:  "720p HD",
                    1080: "1080p Full HD",
                    1440: "1440p 2K",
                    2160: "2160p 4K",
                    4320: "4320p 8K",
                }
                
                filesize = f.get('filesize') or f.get('filesize_approx')
                filesize_mb = round(filesize / (1024 * 1024), 1) if filesize else None
                
                vbr = f.get('vbr')
                
                format_entry = {
                    "id": format_id,
                    "quality": quality_labels.get(height, f"{height}p"),
                    "height": height,
                    "ext": "mp4",
                    "has_audio": acodec != "none",
                    "vcodec": vcodec,
                }
                
                if filesize_mb:
                    format_entry["size_mb"] = filesize_mb
                if vbr:
                    format_entry["bitrate"] = round(vbr / 1000)
                
                formats.append(format_entry)
            
            formats.sort(key=lambda x: x["height"])
            
            # Add MP3 option
            audio_formats = [f for f in info.get('formats', []) 
                           if f.get('acodec', 'none') != 'none']
            
            if audio_formats or formats:
                formats.append({
                    "id": "mp3",
                    "quality": "Audio Only (MP3)",
                    "height": 0,
                    "ext": "mp3",
                    "has_audio": True,
                    "vcodec": "none",
                })
            
            if not formats:
                logger.warning("No formats found")
                return {"error": "No downloadable formats found"}
            
            raw_duration = info.get('duration')
            duration = int(round(raw_duration)) if raw_duration is not None else None
            
            thumbnail = info.get('thumbnail')
            thumbnails = info.get('thumbnails', [])
            if not thumbnail and thumbnails:
                thumbnail = thumbnails[-1].get('url')
            
            uploader = info.get('uploader') or info.get('channel') or info.get('creator') or "Unknown"
            
            # Extract and validate numeric fields
            view_count = info.get('view_count')
            like_count = info.get('like_count')
            comment_count = info.get('comment_count')
            tags = info.get('tags') or info.get('categories') or []
            
            # Validate numeric fields
            if view_count is not None and view_count < 0:
                logger.warning(f"Invalid view_count: {view_count}, setting to 0")
                view_count = 0
            if like_count is not None and like_count < 0:
                logger.warning(f"Invalid like_count: {like_count}, setting to 0")
                like_count = 0
            if comment_count is not None and comment_count < 0:
                logger.warning(f"Invalid comment_count: {comment_count}, setting to 0")
                comment_count = 0
            
            # Detect impossible values
            if view_count is not None and like_count is not None and like_count > view_count:
                logger.warning(f"Like count ({like_count}) exceeds view count ({view_count})")
            
            result = {
                "title": info.get('title') or "Untitled",
                "thumbnail": thumbnail or "",
                "duration": duration,
                "formats": formats,
                "original_url": url,
                "uploader": uploader,
                "tags": tags,
            }
            
            # Add numeric fields only if present
            if view_count is not None: result["views"] = view_count
            if like_count is not None: result["like_count"] = like_count
            if comment_count is not None: result["comment_count"] = comment_count
            
            upload_date = info.get('upload_date')
            if upload_date:
                try:
                    formatted_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
                    result["upload_date"] = formatted_date
                except:
                    pass
            
            # Precise upload timestamp (epoch) for accurate VPH
            # Prefer release_timestamp over timestamp for better accuracy
            release_timestamp = info.get('release_timestamp')
            timestamp = info.get('timestamp')
            
            if release_timestamp:
                result['timestamp'] = release_timestamp
                logger.info(f"Using release_timestamp: {release_timestamp}")
            elif timestamp:
                result['timestamp'] = timestamp
                logger.info(f"Using timestamp: {timestamp}")
            else:
                logger.warning("No precise timestamp available, VPH will use upload_date (less accurate)")
            
            description = info.get('description')
            if description:
                # Keep full description for analysis, don't truncate significantly
                result["description"] = description[:5000] if len(description) > 5000 else description
            
            logger.info(f"Successfully extracted: {result['title']} ({len(formats)} formats, {len(tags)} tags)")
            return result
            
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        logger.error(f"DownloadError for {url}: {error_msg}")
        
        if "Private video" in error_msg:
            return {"error": "This video is private"}
        elif "Video unavailable" in error_msg:
            return {"error": "Video is unavailable or has been deleted"}
        elif "Sign in to confirm" in error_msg or "age" in error_msg.lower():
            return {"error": "Video is age-restricted. Cookie authentication required."}
        elif "country" in error_msg.lower() or "region" in error_msg.lower():
            return {"error": "Video is not available in your region"}
        elif "HTTP Error 404" in error_msg:
            return {"error": "Video not found (404)"}
        elif "HTTP Error 403" in error_msg:
            return {"error": "Access forbidden (403). May require cookies or be region-locked."}
        elif "429" in error_msg or "Too Many Requests" in error_msg:
            return {"error": "Rate limited. Please try again in a few minutes."}
        else:
            return {"error": f"Could not fetch video: {error_msg}"}
    
    except yt_dlp.utils.ExtractorError as e:
        logger.error(f"ExtractorError for {url}: {e}")
        return {"error": f"Failed to extract video info: {str(e)}"}
    
    except Exception as e:
        logger.error(f"Unexpected error for {url}: {e}", exc_info=True)
        return {"error": f"Unexpected error: {str(e)}"}


def verify_ytdlp_installation() -> bool:
    """Verify yt-dlp is installed and working"""
    try:
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            version = ydl._get_version()
            logger.info(f"yt-dlp version: {version}")
            return True
    except Exception as e:
        logger.error(f"yt-dlp verification failed: {e}")
        return False
