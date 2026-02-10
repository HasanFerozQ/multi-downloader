import os
import subprocess
from celery import Celery
from pathlib import Path

# Setup Celery to use Redis (localhost:6379)
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    self.update_state(state='PROGRESS', meta={'progress': 0})
    
    # 1. Determine if we are downloading Audio Only (MP3) or Video
    if format_id == "mp3":
        cmd = [
            "yt-dlp",
            "-f", "bestaudio/best",
            "--extract-audio",
            "--audio-format", "mp3",
            "--newline",
            "-o", output_path,
            url
        ]
    else:
        # 2. For 1080p+, we force yt-dlp to find the specific format PLUS best audio
        # We also ensure the output is merged into an mp4 container
        cmd = [
            "yt-dlp",
            "-f", f"{format_id}+bestaudio/bestvideo+bestaudio/best",
            "--merge-output-format", "mp4",
            "--newline",
            "-o", output_path,
            url
        ]

    # Execute the process
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    for line in process.stdout:
        # Update progress bar for the frontend
        if "[download]" in line and "%" in line:
            try:
                # Extracts the percentage number from the yt-dlp output
                parts = line.split()
                for part in parts:
                    if '%' in part:
                        p = float(part.replace('%', ''))
                        self.update_state(state='PROGRESS', meta={'progress': p})
                        break
            except: 
                pass
                
    process.wait()
    
    if process.returncode != 0:
        return {"status": "Error", "message": "yt-dlp failed to download or merge"}

    return {"status": "Success", "file": output_path}