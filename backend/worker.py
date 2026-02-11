import os
import yt_dlp
from celery import Celery

# Initialize Celery with Redis
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery.task(bind=True)
def download_video_task(self, url, format_id, output_path):
    """
    Finalized High-Speed Downloader Task
    """
    def progress_hook(d):
        if d['status'] == 'downloading':
            try:
                # Extract clean percentage for the frontend WebSocket
                p = d.get('_percent_str', '0%').replace('%','').strip()
                self.update_state(state='PROGRESS', meta={
                    'progress': float(p),
                    'status': 'Downloading...',
                    'speed': d.get('_speed_str', 'N/A'),
                    'eta': d.get('_eta_str', 'N/A')
                })
            except: pass

    ydl_opts = {
        # Select best video and best audio and merge them
        'format': f'{format_id}+bestaudio/best',
        'outtmpl': output_path,
        'progress_hooks': [progress_hook],
        'noplaylist': True,
        'quiet': True,
        
        # --- MULTI-THREADED SPEED HACKS ---
        'external_downloader': 'aria2c', 
        'external_downloader_args': [
            '--min-split-size=1M',
            '--max-connection-per-server=16',
            '--split=16',
            '--j=16'
        ],
        'merge_output_format': 'mp4',
        'postprocessor_args': ['-preset', 'ultrafast'] # Fast merging
    }

    try:
        if not os.path.exists("temp_downloads"):
            os.makedirs("temp_downloads")
            
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return {"status": "Success", "file": output_path}
    except Exception as e:
        self.update_state(state='FAILURE', meta={'message': str(e)})
        raise e