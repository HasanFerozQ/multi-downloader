import os
import subprocess
from celery import Celery
from pathlib import Path

# Setup Celery
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    self.update_state(state='PROGRESS', meta={'progress': 0})
    
    # Path exactly as shown in your C: drive screenshot
    ffmpeg_path = r"C:\ffmpeg\bin"
    
    if format_id == "mp3":
        # Handle audio extraction
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
        # THE CRITICAL FIX:
        # 1. We force the specific format_id + bestaudio.
        # 2. We add --merge-output-format mp4 to ensure a single file.
        # 3. We use --postprocessor-args to ensure the audio is encoded correctly for MP4.
        cmd = [
            "yt-dlp",
            "-f", f"{format_id}+bestaudio/best",
            "--merge-output-format", "mp4",
            "--ffmpeg-location", ffmpeg_path,
            "--postprocessor-args", "ffmpeg:-c:a aac", 
            "--newline",
            "-o", output_path,
            url
        ]

    # Execute the yt-dlp process
    process = subprocess.Popen(
        cmd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT, 
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    
    for line in process.stdout:
        # Real-time progress monitoring for the frontend WebSocket
        if "[download]" in line and "%" in line:
            try:
                parts = line.split()
                for part in parts:
                    if '%' in part:
                        p_str = part.replace('%', '')
                        # Handle cases where percentage might be colored or have extra chars
                        p = float(''.join(c for c in p_str if c.isdigit() or c == '.'))
                        self.update_state(state='PROGRESS', meta={'progress': p})
                        break
            except: 
                pass
                
    process.wait()

    # Final verification: If the file exists but is under 1MB, it likely failed to merge
    if os.path.exists(output_path) and os.path.getsize(output_path) > 1024:
        return {"status": "Success", "file": output_path}
    else:
        return {"status": "Error", "message": "Download or Merge failed. Check if FFmpeg is accessible."}