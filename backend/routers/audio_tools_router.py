from fastapi import APIRouter, File, UploadFile, Form, HTTPException # type: ignore
from fastapi.responses import JSONResponse, FileResponse # type: ignore
import os
import shutil
import uuid
from pathlib import Path
import json
import asyncio
import subprocess
from celery.result import AsyncResult # type: ignore
import redis # type: ignore
from dotenv import load_dotenv # type: ignore

# Import Celery app and task
# Adjust import based on project structure. Assuming backend runs as module.
try:
    from backend.worker import celery, process_audio_task, run_audio_pipeline # type: ignore
except ImportError:
    # Fallback for local run without module structure
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from worker import celery, process_audio_task, run_audio_pipeline # type: ignore

load_dotenv()

router = APIRouter(
    prefix="/audio-tools",
    tags=["Audio Tools"]
)

# Configuration
UPLOAD_DIR = Path("temp_uploads")
OUTPUT_DIR = Path("temp_outputs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Redis for Queue Length
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

FFMPEG_PATH = "ffmpeg"
if os.name == 'nt':
    possible_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
    ]
    for p in possible_paths:
        if os.path.exists(p):
            FFMPEG_PATH = p
            break

def cleanup_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass

async def get_audio_duration(file_path: str) -> float:
    """Get audio duration in seconds using ffprobe/ffmpeg"""
    try:
        cmd = [FFMPEG_PATH, "-i", file_path]
        # type: ignore - subprocess.run typing issue
        result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True) 
        import re
        match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})", result.stderr)
        if match:
            h, m, s = map(float, match.groups())
            return h * 3600 + m * 60 + s
    except Exception as e:
        print(f"[WARNING] Duration check failed: {e}")
    return 0.0

@router.post("/process-audio")
async def process_audio(
    file: UploadFile = File(...),
    effects: str = Form(...),
    preview: str = Form("false")
):
    try:
        effects_data = json.loads(effects)
        print(f"[DEBUG] /process-audio received effects: {effects_data}")
        is_preview = preview.lower() == "true"
        
        file_id = str(uuid.uuid4())
        input_filename = f"{file_id}_{file.filename}"
        input_path = UPLOAD_DIR / input_filename
        
        # Save file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. Validate Duration (Hard Limit 3 mins)
        duration_sec = await get_audio_duration(str(input_path))
        if duration_sec > 180:
             cleanup_file(str(input_path))
             raise HTTPException(status_code=400, detail="Audio file too long. Maximum allowed is 3 minutes (180s).")

        # 2. Enqueue Task
        output_filename = f"processed_{file_id}.mp3"
        output_path = OUTPUT_DIR / output_filename
        
        # Submit to Celery
        task = process_audio_task.delay(str(input_path), str(output_path), effects_data)
        
        # 3. Estimate Queue Position
        # Queue length = tasks in 'celery' list
        queue_len = redis_client.llen("celery")
        # Estimated wait time: (queue_len * 30s) + 30s processing
        est_wait = (queue_len * 30) + 30 
        
        return {
            "task_id": task.id,
            "status": "queued",
            "queue_position": queue_len + 1, # +1 for self
            "estimated_wait_seconds": est_wait,
            "message": f"File received! You are #{queue_len + 1} in line."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        cleanup_file(str(input_path)) if 'input_path' in locals() else None
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/preview-audio")
async def preview_audio(
    file: UploadFile = File(...),
    effects: str = Form(...)
):
    try:
        effects_data = json.loads(effects)
        
        file_id = str(uuid.uuid4())
        input_filename = f"preview_in_{file_id}_{file.filename}"
        input_path = UPLOAD_DIR / input_filename
        
        # Save file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. Trim to 5s if longer
        trimmed_path = str(input_path) + "_trim.mp3"
        duration_sec = await get_audio_duration(str(input_path))
        if duration_sec > 5.0:
            cmd = [FFMPEG_PATH, "-y", "-i", str(input_path), "-t", "5", "-c", "copy", trimmed_path]
            await asyncio.to_thread(subprocess.run, cmd, check=True, capture_output=True)
            cleanup_file(str(input_path))
            input_path = Path(trimmed_path)

        # 2. Run Pipeline Synchronously
        output_filename = f"preview_out_{file_id}.mp3"
        output_path = OUTPUT_DIR / output_filename
        
        # Use run_audio_pipeline directly (blocking call, but short duration)
        # Offload to thread to keep async loop unblocked
        await asyncio.to_thread(
            run_audio_pipeline, 
            str(input_path), 
            str(output_path), 
            effects_data
        )
        
        cleanup_file(str(input_path))
        
        return FileResponse(output_path, filename="preview.mp3")

    except Exception as e:
        cleanup_file(str(input_path)) if 'input_path' in locals() else None
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")

@router.get("/status/{task_id}")
async def get_status(task_id: str):
    """Check status of background processing task"""
    try:
        result = AsyncResult(task_id, app=celery)
        
        response = {
            "task_id": task_id,
            "status": result.state,
        }
        
        if result.state == 'PENDING':
             # Calculate refreshed queue position if needed, or just return basic info
             response["progress"] = 0
             response["message"] = "Waiting in queue..."
             
        elif result.state == 'STARTED':
            response["progress"] = 0
            response["message"] = "Processing started..."
            if result.info:
                response.update(result.info) # status, progress
                
        elif result.state == 'PROCESSING':
             # Custom state for progress updates
             if result.info:
                response.update(result.info)
                
        elif result.state == 'SUCCESS':
            response["progress"] = 100
            response["message"] = "Complete!"
            # Return download URL (handled by separate endpoint or direct file access)
            # For simplicity, we can let frontend request the file via another endpoint or directly if static
            # But let's add a download endpoint
            response["result_url"] = f"/audio-tools/download/{task_id}"
            
        elif result.state == 'FAILURE':
            response["status"] = "FAILURE"
            response["error"] = str(result.result)
            
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{task_id}")
async def download_result(task_id: str):
    """Download processed file"""
    # Find file logic
    # In process_audio, we defined output path based on file_id, but task_id is different.
    # Actually, process_audio defines output path.
    # We need to map task_id to file path.
    # Or, rely on the task return value if stored.
    
    result = AsyncResult(task_id, app=celery)
    if result.state == 'SUCCESS':
        output_path = result.result.get("path")
        if output_path and os.path.exists(output_path):
            return FileResponse(output_path, filename="processed_audio.mp3")
            
    raise HTTPException(status_code=404, detail="File not found or processing not complete.")

@router.post("/extract-from-video")
async def extract_from_video(file: UploadFile = File(...)):
    # Existing synchronous extraction (lightweight for now, or move to task later)
    # Keeping existing logic for now as requested user focus is on audio processing queue
    try:
        file_id = str(uuid.uuid4())
        input_filename = f"{file_id}_{file.filename}"
        input_path = UPLOAD_DIR / input_filename
        
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        output_filename = f"extracted_{file_id}.wav"
        output_path = UPLOAD_DIR / output_filename # Save to uploads as it's input for next step

        cmd = [
            FFMPEG_PATH, "-y",
            "-i", str(input_path),
            "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
            str(output_path)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Cleanup input video
        cleanup_file(str(input_path))
        
        return FileResponse(str(output_path), filename="extracted.wav")
        
    except Exception as e:
        cleanup_file(str(input_path)) if 'input_path' in locals() else None
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
