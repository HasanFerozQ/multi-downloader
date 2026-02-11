import os, subprocess, time
from celery import Celery

# Initialize Celery
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

def update_ytdlp():
    """Keep yt-dlp updated to bypass platform changes"""
    subprocess.run(["pip", "install", "-U", "yt-dlp"], capture_output=True)

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    update_ytdlp()
    
    # Ensure the output directory exists before starting
    # This prevents 'File Not Found' errors if the folder was moved or deleted
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    self.update_state(state='PROGRESS', meta={'progress': 0})
    
    # Using 'ffmpeg' directly relies on your System PATH (recommended)
    # Your log shows FFmpeg is at C:\ffmpeg\bin\ffmpeg.EXE
    ffmpeg_path = r"C:\ffmpeg\bin"
    
    if format_id == "mp3":
        cmd = [
            "yt-dlp", "-f", "bestaudio/best", "--extract-audio", 
            "--audio-format", "mp3", "--audio-quality", "0",
            "--ffmpeg-location", ffmpeg_path, "--newline", "-o", output_path, url
        ]
    else:
        # IMPROVED COMPATIBILITY FIX: 
        # Tries H.264 (avc1) first, but falls back to the next best video if avc1 is unavailable.
        format_spec = f"({format_id}[vcodec^=avc1]/bestvideo[vcodec^=avc1])+(bestaudio[ext=m4a]/bestaudio)/best"
        
        cmd = [
            "yt-dlp", 
            "-f", format_spec, 
            "--merge-output-format", "mp4", 
            "--ffmpeg-location", ffmpeg_path,
            "--postprocessor-args", "ffmpeg:-c:a aac -b:a 192k",
            "--newline", "-o", output_path, url
        ]

    # Execute the download process
    process = subprocess.Popen(
        cmd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT, 
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    
    for line in process.stdout:
        if "[download]" in line and "%" in line:
            try:
                parts = line.split()
                for part in parts:
                    if '%' in part:
                        p_str = ''.join(c for c in part if c.isdigit() or c == '.')
                        if p_str:
                            self.update_state(state='PROGRESS', meta={'progress': float(p_str)})
                        break
            except: pass
                
    process.wait()
    if process.returncode != 0:
        # Pass a specific error back to the frontend
        raise Exception(f"yt-dlp error code {process.returncode}. Possible causes: Age restriction or unsupported URL.")

@celery.task
def scheduled_cleanup():
    """Automatic cleanup of files older than 30 minutes"""
    folder = "temp_downloads"
    if not os.path.exists(folder):
        return
    now = time.time()
    for f in os.listdir(folder):
        f_path = os.path.join(folder, f)
        if os.path.isfile(f_path) and os.stat(f_path).st_mtime < now - 1800:
            try:
                os.remove(f_path)
            except: pass