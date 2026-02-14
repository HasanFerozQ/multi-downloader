"""
Video Tools API Router
Handles video editing operations: trim, resize, convert, extract audio
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from services.video_processor import VideoProcessor
from pathlib import Path
import json
import shutil
import uuid

router = APIRouter(prefix="/video-tools", tags=["video-tools"])
processor = VideoProcessor()

# Temporary upload directory
UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file to temp directory."""
    file_path = UPLOAD_DIR / f"{uuid.uuid4()}_{upload_file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return str(file_path)


@router.post("/trim")
async def trim_video(
    file: UploadFile = File(...),
    params: str = Form(...)
):
    """
    Trim video by start and end time.
    
    Params JSON format:
    {
        "startTime": float,  # in seconds
        "endTime": float     # in seconds
    }
    """
    input_path = None
    output_path = None
    
    try:
        # Parse parameters
        params_dict = json.loads(params)
        start_time = float(params_dict.get("startTime", 0))
        end_time = float(params_dict.get("endTime", 10))
        
        # Validate
        if start_time < 0 or end_time <= start_time:
            raise HTTPException(status_code=400, detail="Invalid time range")
        
        # Save uploaded file
        input_path = save_upload_file(file)
        
        # Process video
        output_path = processor.trim_video(input_path, start_time, end_time)
        
        # Return file
        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename=f"trimmed_{Path(file.filename).stem}.mp4"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup input file
        if input_path:
            processor.cleanup_file(input_path)


@router.post("/resize")
async def resize_video(
    file: UploadFile = File(...),
    params: str = Form(...)
):
    """
    Resize video for multiple social media platforms.
    
    Params JSON format:
    {
        "platforms": ["tiktok", "youtube", "ig-post"],
        "cropStyle": "center"  # center, top, bottom, fit
    }
    """
    input_path = None
    output_paths = []
    
    try:
        # Parse parameters
        params_dict = json.loads(params)
        platforms = params_dict.get("platforms", [])
        crop_style = params_dict.get("cropStyle", "center")
        
        if not platforms:
            raise HTTPException(status_code=400, detail="No platforms selected")
        
        # Platform dimensions
        platform_specs = {
            "tiktok": (1080, 1920),
            "reels": (1080, 1920),
            "youtube": (1920, 1080),
            "shorts": (1080, 1920),
            "ig-post": (1080, 1080),
            "twitter": (1280, 720),
        }
        
        # Save uploaded file
        input_path = save_upload_file(file)
        
        # Process for first platform (return single file for now)
        # TODO: Support multiple outputs in a ZIP file
        first_platform = platforms[0]
        width, height = platform_specs.get(first_platform, (1920, 1080))
        
        output_path = processor.resize_video(input_path, width, height, crop_style)
        
        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename=f"{first_platform}_{Path(file.filename).stem}.mp4"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if input_path:
            processor.cleanup_file(input_path)


@router.post("/convert")
async def convert_video(
    file: UploadFile = File(...),
    params: str = Form(...)
):
    """
    Convert video format with quality settings.
    
    Params JSON format:
    {
        "outputFormat": "mp4",  # mp4, webm, avi, mov, mkv
        "quality": "medium",    # high, medium, low
        "resolution": "original"  # original, 2160, 1080, 720, 480, 360
    }
    """
    input_path = None
    
    try:
        # Parse parameters
        params_dict = json.loads(params)
        output_format = params_dict.get("outputFormat", "mp4")
        quality = params_dict.get("quality", "medium")
        resolution = params_dict.get("resolution", "original")
        
        # Save uploaded file
        input_path = save_upload_file(file)
        
        # Process video
        output_path = processor.convert_format(
            input_path, 
            output_format, 
            quality, 
            resolution if resolution != "original" else None
        )
        
        # Determine MIME type
        mime_types = {
            "mp4": "video/mp4",
            "webm": "video/webm",
            "avi": "video/x-msvideo",
            "mov": "video/quicktime",
            "mkv": "video/x-matroska"
        }
        
        return FileResponse(
            output_path,
            media_type=mime_types.get(output_format, "video/mp4"),
            filename=f"converted_{Path(file.filename).stem}.{output_format}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if input_path:
            processor.cleanup_file(input_path)


@router.post("/extract-audio")
async def extract_audio(
    file: UploadFile = File(...),
    params: str = Form(...)
):
    """
    Extract audio from video.
    
    Params JSON format:
    {
        "audioFormat": "mp3",  # mp3, wav, aac, flac
        "bitrate": "320"       # 320, 256, 192, 128
    }
    """
    input_path = None
    
    try:
        # Parse parameters
        params_dict = json.loads(params)
        audio_format = params_dict.get("audioFormat", "mp3")
        bitrate = params_dict.get("bitrate", "320")
        
        # Save uploaded file
        input_path = save_upload_file(file)
        
        # Process audio
        output_path = processor.extract_audio(input_path, audio_format, bitrate)
        
        # Determine MIME type
        mime_types = {
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "aac": "audio/aac",
            "flac": "audio/flac"
        }
        
        return FileResponse(
            output_path,
            media_type=mime_types.get(audio_format, "audio/mpeg"),
            filename=f"{Path(file.filename).stem}.{audio_format}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if input_path:
            processor.cleanup_file(input_path)
