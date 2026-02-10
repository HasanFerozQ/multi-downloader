import os
import subprocess
from celery import Celery
from pathlib import Path

# Setup Celery
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    self.update_state(state='PROGRESS', meta={'progress': 0})
    
    # Path from your screenshot
    ffmpeg_path = r"C:\ffmpeg\bin"
    
    # Logic to handle 1080p + Audio merging
    if format_id == "mp3":
        cmd = [
            "yt-dlp",
            "-f", "bestaudio/best",
            "--extract-audio",
            "--audio-format", "mp3",
            "--ffmpeg-location", ffmpeg_path,
            "--newline",
            "-o", output_path,
            url
        ]
    else:
        # The '+' forces yt-dlp to download both and merge them using ffmpeg
        cmd = [
            "yt-dlp",
            "-f", f"{format_id}+bestaudio/best",
            "--merge-output-format", "mp4",
            "--ffmpeg-location", ffmpeg_path,
            "--newline",
            "-o", output_path,
            url
        ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    for line in process.stdout:
        if "[download]" in line and "%" in line:
            try:
                parts = line.split()
                for part in parts:
                    if '%' in part:
                        p = float(part.replace('%', ''))
                        self.update_state(state='PROGRESS', meta={'progress': p})
                        break
            except: 
                pass
                
    process.wait()
    return {"status": "Success", "file": output_path}