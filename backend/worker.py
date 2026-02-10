import os
import subprocess
from celery import Celery
from pathlib import Path

# Setup Celery
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    self.update_state(state='PROGRESS', meta={'progress': 0})
    
    # Absolute path to your ffmpeg bin based on your screenshots
    ffmpeg_path = r"C:\ffmpeg\bin"
    
    if format_id == "mp3":
        cmd = [
            "yt-dlp",
            "-f", "bestaudio/best",
            "--extract-audio",
            "--audio-format", "mp3",
            "--ffmpeg-location", ffmpeg_path,
            "--newline", "-o", output_path, url
        ]
    else:
        # THE FIX: This command forces 'best video up to 1080p' + 'best audio'
        # It ignores the specific 'format_id' to ensure audio is always included
        cmd = [
            "yt-dlp",
            "-f", "bv*[height<=1080]+ba/b[height<=1080] / wv*+ba/w",
            "--merge-output-format", "mp4",
            "--ffmpeg-location", ffmpeg_path,
            "--newline", "-o", output_path, url
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
            except: pass
                
    process.wait()
    return {"status": "Success", "file": output_path}