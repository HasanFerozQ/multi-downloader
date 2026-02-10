import os
import subprocess
from celery import Celery
from pathlib import Path

# Setup Celery to use Memurai (localhost:6379)
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    self.update_state(state='PROGRESS', meta={'progress': 0})
    
    # Pro Command: Ensures best video + best audio are merged properly
    cmd = [
        "yt-dlp",
        "-f", f"{format_id}+bestaudio/best" if format_id != "mp3" else "bestaudio",
        "--merge-output-format", "mp4" if format_id != "mp3" else "mp3",
        "--newline", "-o", output_path, url
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        if "[download]" in line and "%" in line:
            try:
                p = float(line.split()[1].replace('%', ''))
                self.update_state(state='PROGRESS', meta={'progress': p})
            except: pass
    process.wait()
    return {"status": "Success", "file": output_path}