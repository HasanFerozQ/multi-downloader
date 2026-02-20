import yt_dlp  # type: ignore
import os
import logging
import subprocess
from typing import Dict, Any, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
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
        "x.com": "cookies_x.txt",
        "twitter.com": "cookies_x.txt",
        "youtube.com": "cookies_youtube.txt",
        "youtu.be": "cookies_youtube.txt",
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


def _update_ytdlp() -> None:
    """Keep yt-dlp updated to avoid 'video not available' errors."""
    try:
        subprocess.run(
            ["pip", "install", "-U", "yt-dlp"],
            capture_output=True,
            timeout=30,
            check=False,
        )
        logger.info("yt-dlp update check complete.")
    except Exception:
        logger.warning("Failed to update yt-dlp, continuing with current version.")


def _clean_youtube_url(url: str) -> str:
    """Strip playlist/radio parameters from YouTube URLs to avoid processing entire playlists."""
    if 'youtube.com' not in url.lower() and 'youtu.be' not in url.lower():
        return url
    
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    
    # Keep only the video ID parameter, drop list/index/start_radio etc.
    clean_params = {}
    if 'v' in params:
        clean_params['v'] = params['v'][0]
    if 't' in params:  # keep timestamp if present
        clean_params['t'] = params['t'][0]
    
    if clean_params:
        clean_url = urlunparse((
            parsed.scheme, parsed.netloc, parsed.path,
            '', urlencode(clean_params), ''
        ))
        if clean_url != url:
            logger.info(f"Cleaned YouTube URL: {url} -> {clean_url}")
        return clean_url
    
    return url


def get_video_info(url: str) -> Dict[str, Any]:
    """Extract video information and available formats"""
    _update_ytdlp()
    
    # Clean playlist/radio params from YouTube URLs
    url = _clean_youtube_url(url)
    
    cookie_path = get_platform_cookies(url)
    
    ydl_opts: Dict[str, Any] = {
        'quiet': True,
        'no_warnings': True,
        'user_agent': random.choice(USER_AGENTS),
        'extract_flat': False,
        'no_color': True,
        'noplaylist': True,
        'retries': 3,
        'fragment_retries': 3,
        'socket_timeout': 30,
        'nocheckcertificate': True,
    }
    
    if cookie_path:
        ydl_opts['cookiefile'] = cookie_path
    
    # YouTube: Use default client behavior (safest) 
    # Removed manual player_client configuration as it was causing 'Video not available' errors
    
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
            
            # Detect platform for platform-specific format handling
            url_lower = url.lower()
            is_youtube = "youtube.com" in url_lower or "youtu.be" in url_lower
            is_twitter = "x.com" in url_lower or "twitter.com" in url_lower
            is_instagram = "instagram.com" in url_lower
            is_tiktok = "tiktok.com" in url_lower
            is_facebook = "facebook.com" in url_lower or "fb.watch" in url_lower
            
            # Check if ANY audio stream exists in the formats list
            # If so, we can merge audio into video-only streams
            # NOTE: .get('acodec', 'none') may return Python None, so we use `or 'none'`
            all_formats = info.get('formats', [])
            has_separate_audio = any(
                (f.get('acodec') or 'none') != 'none' for f in all_formats
            )
            
            # Find best audio stream size for file size estimation
            best_audio_size = 0
            for af in all_formats:
                af_vcodec = af.get('vcodec') or 'none'
                af_acodec = af.get('acodec') or 'none'
                if af_vcodec == 'none' and af_acodec != 'none':
                    asize = af.get('filesize') or af.get('filesize_approx')
                    if asize and asize > best_audio_size:
                        best_audio_size = asize
            
            for f in all_formats:
                height = f.get('height')
                width = f.get('width')
                # Handle None values: yt-dlp may set vcodec/acodec to None instead of 'none'
                vcodec = f.get('vcodec') or 'none'
                acodec = f.get('acodec') or 'none'
                format_id = f.get("format_id")
                
                if vcodec == 'none' or not format_id:
                    continue
                
                # If height is missing, try to infer from width (assume 16:9)
                if not height and width:
                    height = int(width * 9 / 16)
                
                # Skip formats without any resolution info
                if not height:
                    continue
                
                # For portrait videos (e.g. Instagram Reels, TikTok), height > width
                # Use the shorter dimension as the quality indicator
                if width and height > width:
                    quality_height = width  # e.g. 1080x1920 portrait → 1080p
                else:
                    quality_height = height
                
                if quality_height < 144:
                    continue
                
                # STRICT 1080p LIMIT (User Request)
                if quality_height > 1080:
                    continue
                
                combo_key = f"{quality_height}_{vcodec[:4]}"
                
                if quality_height in seen_heights or combo_key in seen_combinations:
                    continue
                
                seen_heights.add(quality_height)
                seen_combinations.add(combo_key)
                
                quality_labels = {
                    144:  "144p",
                    240:  "240p",
                    360:  "360p",
                    480:  "480p SD",
                    720:  "720p HD",
                    1080: "1080p Full HD",
                }
                
                filesize = f.get('filesize') or f.get('filesize_approx')
                filesize_mb = round(filesize / (1024 * 1024), 1) if filesize else None
                
                vbr = f.get('vbr')
                
                # Audio availability logic:
                # - X/Twitter: always True — audio IS extractable even when 
                #   yt-dlp doesn't list separate audio streams
                # - Others: True if stream has audio OR separate audio exists
                stream_has_audio = acodec != "none"
                if is_twitter:
                    effective_has_audio = True
                else:
                    effective_has_audio = stream_has_audio or has_separate_audio
                
                format_entry = {
                    "id": format_id,
                    "quality": quality_labels.get(quality_height, f"{quality_height}p"),
                    "height": quality_height,
                    "ext": "mp4",
                    "has_audio": effective_has_audio,
                    "vcodec": vcodec,
                }
                
                # Add audio size to video-only streams for more accurate file size display
                if filesize and not stream_has_audio and (has_separate_audio or is_twitter) and best_audio_size > 0:
                    filesize_with_audio = filesize + best_audio_size
                    filesize_mb = round(filesize_with_audio / (1024 * 1024), 1)

                if filesize_mb:
                    format_entry["size_mb"] = filesize_mb
                if vbr:
                    format_entry["bitrate"] = round(vbr / 1000)
                
                formats.append(format_entry)
            
            # FALLBACK: If no height-based formats found (common for Instagram/TikTok),
            # add a single "Best Quality" option so the user can still download
            if not formats and all_formats:
                # Check if there's any video format at all
                video_formats_exist = any(
                    f.get('vcodec', 'none') != 'none' for f in all_formats
                )
                if video_formats_exist:
                    formats.append({
                        "id": "best",
                        "quality": "Best Quality",
                        "height": 720,  # Assume HD for sorting
                        "ext": "mp4",
                        "has_audio": True,
                        "vcodec": "auto",
                    })
            
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
            
            # Detect platform from URL
            platform = "YouTube"
            url_lower = url.lower()
            if "instagram.com" in url_lower:
                platform = "Instagram"
            elif "tiktok.com" in url_lower:
                platform = "TikTok"
            elif "x.com" in url_lower or "twitter.com" in url_lower:
                platform = "X (Twitter)"
            elif "facebook.com" in url_lower or "fb.watch" in url_lower:
                platform = "Facebook"
            
            result = {
                "title": info.get('title') or "Untitled",
                "thumbnail": thumbnail or "",
                "duration": duration,
                "formats": formats,
                "original_url": url,
                "uploader": uploader,
                "tags": tags,
                "platform": platform,
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
        elif "not available" in error_msg.lower() or "Video unavailable" in error_msg:
            return {"error": "This video is not available. Possible reasons: it may be age-restricted (requires YouTube cookies), deleted, private, or region-locked. Try adding a cookies_youtube.txt file."}
        elif "Sign in to confirm" in error_msg or "age" in error_msg.lower():
            return {"error": "Video is age-restricted. Cookie authentication required. Add a cookies_youtube.txt file to enable access."}
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
