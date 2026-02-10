import os
import subprocess
import logging
from celery import Celery
from pathlib import Path

# Setup Celery with Redis
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

logger = logging.getLogger(__name__)
TEMP_DIR = Path("temp_downloads")

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    """Processes downloads in the background with FFmpeg merging"""
    self.update_state(state='PROGRESS', meta={'progress': 0, 'status': 'Initializing...'})
    
    # Advanced command to handle FB/YT merging and ensure audio presence
    cmd = [
        "yt-dlp",
        "-f", f"{format_id}+bestaudio/best" if format_id != "mp3" else "bestaudio",
        "--merge-output-format", "mp4" if format_id != "mp3" else "mp3",
        "--newline", 
        "-o", output_path,
        url
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    for line in process.stdout:
        # Regex to capture yt-dlp percentage progress
        if "[download]" in line and "%" in line:
            try:
                parts = line.split()
                percent_str = parts[1].replace('%', '')
                percent = float(percent_str)
                self.update_state(state='PROGRESS', meta={'progress': percent, 'status': 'Downloading...'})
            except:
                pass
            
    process.wait()
    if process.returncode == 0:
        return {"status": "Success", "file": output_path}
    else:
        raise Exception("FFmpeg merging failed or download interrupted")