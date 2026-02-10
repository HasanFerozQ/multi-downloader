import yt_dlp
import os
import logging
from typing import Dict, Any, Optional
import random

logger = logging.getLogger(__name__)

# User agent rotation for bot detection mitigation
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
    
    # Fallback to general cookies
    general_cookies = os.path.join(os.getcwd(), "cookies.txt")
    if os.path.exists(general_cookies):
        logger.info("Using general cookies.txt")
        return general_cookies
    
    logger.warning("No cookies found - private/logged-in content may fail")
    return None


def get_video_info(url: str) -> Dict[str, Any]:
    """
    Extract video information and available formats
    
    Improvements:
    - Better error handling with specific error messages
    - Cookie support per platform
    - User agent rotation
    - Better format filtering
    - Handles various edge cases
    """
    
    cookie_path = get_platform_cookies(url)
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'user_agent': random.choice(USER_AGENTS),
        'extract_flat': False,
        'no_color': True,
    }
    
    # Add cookies if available
    if cookie_path:
        ydl_opts['cookiefile'] = cookie_path
    
    # Platform-specific options
    if "tiktok.com" in url:
        ydl_opts['http_headers'] = {
            'Referer': 'https://www.tiktok.com/',
        }
    
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
            seen_combinations = set()  # To avoid duplicate quality+codec combos
            
            for f in info.get('formats', []):
                height = f.get('height')
                vcodec = f.get('vcodec', 'none')
                acodec = f.get('acodec', 'none')
                format_id = f.get("format_id")
                
                # Must have a real video stream with a known height
                if not height or vcodec == 'none' or not format_id:
                    continue
                
                # Skip very low quality (below 144p)
                if height < 144:
                    continue
                
                # Create unique combo identifier
                combo_key = f"{height}_{vcodec[:4]}"
                
                # Skip duplicate resolutions (keep first/best one)
                if height in seen_heights or combo_key in seen_combinations:
                    continue
                
                seen_heights.add(height)
                seen_combinations.add(combo_key)
                
                # Quality labels
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
                
                # Get file size if available
                filesize = f.get('filesize') or f.get('filesize_approx')
                filesize_mb = round(filesize / (1024 * 1024), 1) if filesize else None
                
                # Get bitrate info
                vbr = f.get('vbr')  # Video bitrate
                
                format_entry = {
                    "id": format_id,
                    "quality": quality_labels.get(height, f"{height}p"),
                    "height": height,
                    "ext": "mp4",
                    "has_audio": acodec != "none",
                    "vcodec": vcodec,
                }
                
                # Add optional fields
                if filesize_mb:
                    format_entry["size_mb"] = filesize_mb
                if vbr:
                    format_entry["bitrate"] = round(vbr / 1000)  # Convert to kbps
                
                formats.append(format_entry)
            
            # Sort by resolution (lowest to highest)
            formats.sort(key=lambda x: x["height"])
            
            # If no video formats found, might be audio-only content
            if not formats:
                logger.warning("No video formats found, checking for audio-only")
                for f in info.get('formats', []):
                    acodec = f.get('acodec', 'none')
                    if acodec != 'none':
                        logger.info("Audio-only content detected")
                        break
            
            # Round duration
            raw_duration = info.get('duration')
            duration = int(round(raw_duration)) if raw_duration is not None else None
            
            # Get best thumbnail
            thumbnail = info.get('thumbnail')
            thumbnails = info.get('thumbnails', [])
            if not thumbnail and thumbnails:
                # Get highest quality thumbnail
                thumbnail = thumbnails[-1].get('url')
            
            # Get uploader info
            uploader = info.get('uploader') or info.get('channel') or "Unknown"
            
            # View count
            view_count = info.get('view_count')
            
            result = {
                "title": info.get('title') or "Untitled",
                "thumbnail": thumbnail or "",
                "duration": duration,
                "formats": formats,
                "original_url": url,
                "uploader": uploader,
            }
            
            # Add optional fields
            if view_count:
                result["views"] = view_count
            
            # Add upload date if available
            upload_date = info.get('upload_date')
            if upload_date:
                # Format: YYYYMMDD -> YYYY-MM-DD
                try:
                    formatted_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
                    result["upload_date"] = formatted_date
                except:
                    pass
            
            logger.info(f"Successfully extracted: {result['title']} ({len(formats)} formats)")
            return result
            
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        logger.error(f"DownloadError for {url}: {error_msg}")
        
        # Parse specific errors
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
            # Just check version
            version = ydl.params.get('version', 'unknown')
            logger.info(f"yt-dlp version: {version}")
            return True
    except Exception as e:
        logger.error(f"yt-dlp verification failed: {e}")
        return False
