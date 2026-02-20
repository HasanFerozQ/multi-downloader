"""
Compression router for images and videos.
"""
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List
import uuid
import os

from backend.services.compressor import ImageCompressor, VideoCompressor

router = APIRouter(prefix="/compress", tags=["Compression"])

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Size limits
IMAGE_MAX_PER_FILE = 100 * 1024 * 1024   # 100 MB per image
IMAGE_MAX_COMBINED = 100 * 1024 * 1024    # 100 MB combined
VIDEO_MAX_PER_FILE = 500 * 1024 * 1024    # 500 MB per video
VIDEO_MAX_COMBINED = 500 * 1024 * 1024    # 500 MB combined


def cleanup_files(files: list):
    for f in files:
        try:
            p = Path(f) if not isinstance(f, Path) else f
            if p.exists():
                os.remove(str(p))
        except Exception:
            pass


@router.post("/image")
async def compress_images(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    if len(files) > 10:
        raise HTTPException(400, "Maximum 10 images allowed")

    compressor = ImageCompressor()
    temp_inputs: list[Path] = []
    compressed_files: list[Path] = []

    try:
        # Read all files and validate sizes
        file_contents: list[tuple[UploadFile, bytes]] = []
        combined_size = 0
        for file in files:
            content = await file.read()
            file_size = len(content)
            if file_size > IMAGE_MAX_PER_FILE:
                raise HTTPException(400, f'"{file.filename}" is too large ({file_size // (1024*1024)}MB). Maximum is 100MB per image.')
            combined_size += file_size
            if combined_size > IMAGE_MAX_COMBINED:
                raise HTTPException(400, f"Combined file size exceeds 100MB limit.")
            file_contents.append((file, content))

        for file, content in file_contents:
            ext = Path(file.filename or "image.jpg").suffix.lower().lstrip('.')
            if ext not in ImageCompressor.SUPPORTED:
                raise HTTPException(400, f"Unsupported format: {ext}")

            raw_uuid = str(uuid.uuid4().hex)
            uid = raw_uuid[0:8] # type: ignore
            input_path = UPLOAD_DIR / f"{uid}_{file.filename}"
            input_path.write_bytes(content if isinstance(content, bytes) else bytes(content)) # type: ignore
            temp_inputs.append(input_path)

            compressed = compressor.compress(input_path)
            compressed_files.append(compressed)

        if len(compressed_files) == 1:
            final = compressed_files[0]
            ext = final.suffix.lstrip('.')
            media_type = f"image/{ext}" if ext != 'svg' else "image/svg+xml"
            background_tasks.add_task(cleanup_files, temp_inputs + compressed_files)
            return FileResponse(
                str(final), media_type=media_type, filename=final.name
            )
        else:
            from backend.services.converter import BaseConverter
            zip_path = BaseConverter.create_zip(compressed_files, "compressed_images")
            background_tasks.add_task(cleanup_files, temp_inputs + compressed_files + [zip_path])
            return FileResponse(
                str(zip_path), media_type="application/zip", filename="compressed_images.zip"
            )

    except HTTPException:
        raise
    except Exception as e:
        cleanup_files(temp_inputs + compressed_files)
        raise HTTPException(500, f"Image compression failed: {str(e)}")


@router.post("/video")
async def compress_video(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    if len(files) > 5:
        raise HTTPException(400, "Maximum 5 videos allowed at a time")

    compressor = VideoCompressor()
    temp_inputs: list[Path] = []
    compressed_files: list[Path] = []

    try:
        # Read all files and validate sizes
        file_contents: list[tuple[UploadFile, bytes]] = []
        combined_size = 0
        for file in files:
            content = await file.read()
            file_size = len(content)
            if file_size > VIDEO_MAX_PER_FILE:
                raise HTTPException(400, f'"{file.filename}" is too large ({file_size // (1024*1024)}MB). Maximum is 500MB per video.')
            combined_size += file_size
            if combined_size > VIDEO_MAX_COMBINED:
                raise HTTPException(400, f"Combined file size exceeds 500MB limit.")
            file_contents.append((file, content))

        for file, content in file_contents:
            raw_uuid = str(uuid.uuid4().hex)
            uid = raw_uuid[0:8] # type: ignore
            input_path = UPLOAD_DIR / f"{uid}_{file.filename}"
            input_path.write_bytes(content if isinstance(content, bytes) else bytes(content)) # type: ignore
            temp_inputs.append(input_path)

            compressed = compressor.compress(input_path)
            compressed_files.append(compressed)

        if len(compressed_files) == 1:
            final = compressed_files[0]
            ext = final.suffix.lstrip('.')
            background_tasks.add_task(cleanup_files, temp_inputs + compressed_files)
            return FileResponse(
                str(final), media_type=f"video/{ext}", filename=final.name
            )
        else:
            from backend.services.converter import BaseConverter
            zip_path = BaseConverter.create_zip(compressed_files, "compressed_videos")
            background_tasks.add_task(cleanup_files, temp_inputs + compressed_files + [zip_path])
            return FileResponse(
                str(zip_path), media_type="application/zip", filename="compressed_videos.zip"
            )

    except HTTPException:
        raise
    except Exception as e:
        cleanup_files(temp_inputs + compressed_files)
        raise HTTPException(500, f"Video compression failed: {str(e)}")
