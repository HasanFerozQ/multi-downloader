import os, subprocess, time, shutil

# Python 3.13 compatibility fix - MUST be imported before Celery
try:
    import billiard_fix
except ImportError:
    pass  # Skip if not using Python 3.13

from celery import Celery

celery = Celery('worker', 
                broker='redis://localhost:6379/0', 
                backend='redis://localhost:6379/0')

def get_ffmpeg_location():
    """
    FIXED FOR DIGITAL OCEAN / LINUX HOSTING
    Detects FFmpeg automatically - works on Linux servers
    """
    # First check if ffmpeg is in PATH (most common on Linux)
    if shutil.which("ffmpeg"):
        return None  # yt-dlp will use system ffmpeg
    
    # Linux common locations
    linux_paths = [
        "/usr/bin",
        "/usr/local/bin",
        "/opt/ffmpeg/bin"
    ]
    
    for path in linux_paths:
        ffmpeg_bin = os.path.join(path, "ffmpeg")
        if os.path.exists(ffmpeg_bin):
            return path
    
    # Windows fallback (for local development)
    if os.name == 'nt':  # Windows
        windows_paths = [
            r"C:\ffmpeg\bin",
            r"C:\Program Files\ffmpeg\bin",
        ]
        for path in windows_paths:
            if os.path.exists(os.path.join(path, "ffmpeg.exe")):
                return path
    
    return None

def update_ytdlp():
    """Keep yt-dlp updated"""
    try:
        subprocess.run(["pip", "install", "-U", "yt-dlp"], 
                      capture_output=True, 
                      timeout=30,
                      check=False)
    except:
        pass

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    """
    FIXED: Complete working version with proper return values
    """
    try:
        update_ytdlp()
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        self.update_state(state='PROGRESS', meta={'progress': 0, 'status': 'Starting'})
        
        ffmpeg_location = get_ffmpeg_location()
        
        if format_id == "mp3":
            # Audio extraction
            cmd = [
                "yt-dlp", 
                "-f", "bestaudio/best", 
                "--extract-audio", 
                "--audio-format", "mp3", 
                "--audio-quality", "0",
                "--newline", 
                "-o", output_path.replace('.mp3', '.%(ext)s'),
                url
            ]
            if ffmpeg_location:
                cmd.insert(1, "--ffmpeg-location")
                cmd.insert(2, ffmpeg_location)
        else:
            # Video download
            if format_id == "best":
                format_spec = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best"
            else:
                format_spec = f"({format_id}[vcodec^=avc1]/bestvideo[vcodec^=avc1])+(bestaudio[ext=m4a]/bestaudio)/best"
            
            cmd = [
                "yt-dlp", 
                "-f", format_spec, 
                "--merge-output-format", "mp4", 
                "--newline",
                "-o", output_path,
                url
            ]
            
            if ffmpeg_location:
                cmd.insert(1, "--ffmpeg-location")
                cmd.insert(2, ffmpeg_location)
                cmd.extend(["--postprocessor-args", "ffmpeg:-c:a aac -b:a 192k"])
        
        self.update_state(state='PROGRESS', meta={'progress': 5, 'status': 'Downloading'})
        
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT, 
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        last_progress = 0
        
        for line in process.stdout:
            if "[download]" in line and "%" in line:
                try:
                    parts = line.split()
                    for part in parts:
                        if '%' in part:
                            p_str = ''.join(c for c in part if c.isdigit() or c == '.')
                            if p_str:
                                progress = float(p_str)
                                if progress - last_progress >= 1 or progress == 100:
                                    last_progress = progress
                                    self.update_state(
                                        state='PROGRESS', 
                                        meta={'progress': min(progress, 99), 'status': 'Downloading'}
                                    )
                            break
                except:
                    pass
            
            if "[Merger]" in line or "Merging formats" in line:
                self.update_state(state='PROGRESS', meta={'progress': 95, 'status': 'Processing'})
            
            if "ExtractAudio" in line or "Converting" in line:
                self.update_state(state='PROGRESS', meta={'progress': 90, 'status': 'Converting'})
        
        process.wait()
        
        if process.returncode != 0:
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                # FIXED: Return success even if exit code is non-zero but file exists
                return {"status": "success", "path": output_path, "size": os.path.getsize(output_path)}
            else:
                raise Exception(f"Download failed. Check URL validity or age restrictions.")
        
        # FIXED: Handle extension changes
        if not os.path.exists(output_path):
            base_path = os.path.splitext(output_path)[0]
            for ext in ['.mp4', '.webm', '.mkv', '.mp3', '.m4a']:
                alt_path = base_path + ext
                if os.path.exists(alt_path):
                    try:
                        os.rename(alt_path, output_path)
                    except:
                        output_path = alt_path
                    break
            else:
                raise Exception("File not found after download")
        
        # FIXED: Verify file size
        if os.path.getsize(output_path) < 1024:
            raise Exception("File too small, download may have failed")
        
        # FIXED: MUST return success result for task to complete
        return {
            "status": "success", 
            "path": output_path,
            "size": os.path.getsize(output_path)
        }
        
    except Exception as e:
        # Clean up failed downloads
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass
        raise Exception(f"Download failed: {str(e)}")

@celery.task
def scheduled_cleanup():
    """Cleanup old files every 10 minutes"""
    folder = "temp_downloads"
    if not os.path.exists(folder):
        return "Folder not found"
    
    now = time.time()
    cleaned = 0
    
    for f in os.listdir(folder):
        f_path = os.path.join(folder, f)
        if os.path.isfile(f_path):
            if now - os.stat(f_path).st_mtime > 1800:  # 30 minutes
                try:
                    os.remove(f_path)
                    cleaned += 1
                except:
                    pass
    
    return f"Cleaned {cleaned} files"

# Celery Beat schedule for periodic cleanup
celery.conf.beat_schedule = {
    'cleanup-every-10-minutes': {
        'task': 'worker.scheduled_cleanup',
        'schedule': 600.0,
    },
}
