from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks # type: ignore
from fastapi.responses import JSONResponse, FileResponse # type: ignore
import os
import shutil
import uuid
from pathlib import Path
import json
import asyncio
import subprocess
import threading
import time
from dotenv import load_dotenv # type: ignore

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

# --- In-Memory Task Store (replaces Celery for audio processing) ---
# task_id -> {"status": "PENDING"|"PROCESSING"|"SUCCESS"|"FAILURE", "path": str|None, "error": str|None, "progress": int}
_tasks: dict = {}
_tasks_lock = threading.Lock()

def _set_task(task_id: str, **kwargs):
    with _tasks_lock:
        if task_id not in _tasks:
            _tasks[task_id] = {}
        _tasks[task_id].update(kwargs)

def _get_task(task_id: str) -> dict:
    with _tasks_lock:
        return dict(_tasks.get(task_id, {}))

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
        result = await asyncio.to_thread(lambda: subprocess.run(cmd, capture_output=True, text=True))  # type: ignore
        import re
        match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})", result.stderr)
        if match:
            h, m, s = map(float, match.groups())
            return h * 3600 + m * 60 + s
    except Exception as e:
        print(f"[WARNING] Duration check failed: {e}")
    return 0.0

def _run_audio_task(task_id: str, input_path: str, output_path: str, effects: dict):
    """
    Runs the audio pipeline in a background thread.
    Updates the in-memory task store with progress/result.
    """
    try:
        _set_task(task_id, status="PROCESSING", progress=5, message="Starting pipeline...")

        # Import run_audio_pipeline relative to this file's location
        import sys
        _backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if _backend_dir not in sys.path:
            sys.path.insert(0, _backend_dir)
        from worker import run_audio_pipeline  # type: ignore

        def progress_cb(msg: str, pct: int):
            _set_task(task_id, progress=pct, message=msg)

        run_audio_pipeline(input_path, output_path, effects, progress_cb)

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            _set_task(task_id, status="SUCCESS", progress=100, message="Complete!", path=output_path)
            print(f"[INFO] Task {task_id} SUCCESS: {output_path}")
        else:
            raise Exception("Output file not found after processing")

    except Exception as e:
        print(f"[ERROR] Task {task_id} FAILED: {e}")
        _set_task(task_id, status="FAILURE", error=str(e))
    finally:
        # Clean up input file
        cleanup_file(input_path)


@router.post("/process-audio")
async def process_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    effects: str = Form(...),
    preview: str = Form("false")
):
    try:
        effects_data = json.loads(effects)
        print(f"[DEBUG] /process-audio received effects: {effects_data}")

        # Validate File Size (100MB Limit)
        if file.size and file.size > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 100MB.")

        file_id = str(uuid.uuid4())
        input_filename = f"{file_id}_{file.filename}"
        input_path = UPLOAD_DIR / input_filename

        # Save file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Validate Duration (Hard Limit 3 mins)
        duration_sec = await get_audio_duration(str(input_path))
        if duration_sec > 180:
            cleanup_file(str(input_path))
            raise HTTPException(status_code=400, detail="Audio file too long. Maximum allowed is 3 minutes (180s).")

        # Set up output path
        output_filename = f"processed_{file_id}.mp3"
        output_path = OUTPUT_DIR / output_filename

        # Register task as PENDING
        task_id = file_id
        _set_task(task_id, status="PENDING", progress=0, message="Queued...", path=None, error=None)

        # Run in background thread (non-blocking)
        background_tasks.add_task(
            _run_audio_task,
            task_id,
            str(input_path.resolve()),
            str(output_path.resolve()),
            effects_data
        )

        return {
            "task_id": task_id,
            "status": "queued",
            "queue_position": 1,
            "estimated_wait_seconds": 30,
            "message": "File received! Processing started."
        }

    except HTTPException:
        raise
    except Exception as e:
        cleanup_file(str(input_path)) if 'input_path' in locals() else None
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}")
async def get_status(task_id: str):
    """Check status of background processing task"""
    task = _get_task(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    response = {
        "task_id": task_id,
        "status": task.get("status", "PENDING"),
        "progress": task.get("progress", 0),
        "message": task.get("message", "Processing..."),
    }

    if task.get("status") == "SUCCESS":
        response["result_url"] = f"/audio-tools/download/{task_id}"

    if task.get("status") == "FAILURE":
        response["error"] = task.get("error", "Unknown error")

    return response


@router.get("/download/{task_id}")
async def download_result(task_id: str):
    """Download processed file"""
    task = _get_task(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.get("status") == "SUCCESS":
        output_path = task.get("path")
        if output_path and os.path.exists(output_path):
            return FileResponse(output_path, filename="processed_audio.mp3", media_type="audio/mpeg")
        raise HTTPException(status_code=404, detail="Output file missing — may have been cleaned up")

    if task.get("status") == "FAILURE":
        raise HTTPException(status_code=500, detail=f"Processing failed: {task.get('error')}")

    raise HTTPException(status_code=202, detail=f"Still processing. Status: {task.get('status')}")


@router.post("/extract-from-video")
async def extract_from_video(file: UploadFile = File(...)):
    try:
        file_id = str(uuid.uuid4())
        input_filename = f"{file_id}_{file.filename}"
        input_path = UPLOAD_DIR / input_filename

        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        output_filename = f"extracted_{file_id}.wav"
        output_path = UPLOAD_DIR / output_filename

        cmd = [
            FFMPEG_PATH, "-y",
            "-i", str(input_path),
            "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
            str(output_path)
        ]

        subprocess.run(cmd, check=True, capture_output=True)

        cleanup_file(str(input_path))

        return FileResponse(str(output_path), filename="extracted.wav")

    except Exception as e:
        cleanup_file(str(input_path)) if 'input_path' in locals() else None
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
