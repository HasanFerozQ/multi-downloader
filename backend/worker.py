import os, subprocess, time
from celery import Celery

celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

# --- AUTOMATIC UPDATES ---
def update_ytdlp():
    """Keep yt-dlp updated to bypass platform changes"""
    subprocess.run(["pip", "install", "-U", "yt-dlp"], capture_output=True)

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    update_ytdlp()
    self.update_state(state='PROGRESS', meta={'progress': 0})
    ffmpeg_path = r"C:\ffmpeg\bin"
    
    if format_id == "mp3":
        cmd = [
            "yt-dlp", "-f", "bestaudio/best", "--extract-audio", 
            "--audio-format", "mp3", "--audio-quality", "0", # 0 = Best Quality (320kbps)
            "--ffmpeg-location", ffmpeg_path, "--newline", "-o", output_path, url
        ]
    else:
        cmd = [
            "yt-dlp", "-f", f"{format_id}+bestaudio/best", 
            "--merge-output-format", "mp4", "--ffmpeg-location", ffmpeg_path,
            "--postprocessor-args", "ffmpeg:-c:a aac -b:a 192k", # High audio bitrate
            "--newline", "-o", output_path, url
        ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    for line in process.stdout:
        if "[download]" in line and "%" in line:
            try:
                p = float([x for x in line.split() if '%' in x][0].replace('%', ''))
                self.update_state(state='PROGRESS', meta={'progress': p})
            except: pass
                
    process.wait()
    if process.returncode != 0:
        raise Exception("yt-dlp failed. Try again later.")

# --- PERIODIC STORAGE CLEANUP ---
@celery.task
def scheduled_cleanup():
    """Deletes files older than 30 mins that weren't caught by main.py"""
    folder = "temp_downloads"
    now = time.time()
    for f in os.listdir(folder):
        f_path = os.path.join(folder, f)
        if os.stat(f_path).st_mtime < now - 1800:
            os.remove(f_path)