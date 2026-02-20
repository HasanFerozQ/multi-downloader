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
        for file in files:
            ext = Path(file.filename or "image.jpg").suffix.lower().lstrip('.')
            if ext not in ImageCompressor.SUPPORTED:
                raise HTTPException(400, f"Unsupported format: {ext}")

            uid = uuid.uuid4().hex[:8]
            input_path = UPLOAD_DIR / f"{uid}_{file.filename}"
            content = await file.read()
            input_path.write_bytes(content)
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
    if len(files) > 1:
        raise HTTPException(400, "Only 1 video at a time")

    file = files[0]
    file_size = 0
    
    uid = uuid.uuid4().hex[:8]
    input_path = UPLOAD_DIR / f"{uid}_{file.filename}"
    
    try:
        content = await file.read()
        file_size = len(content)
        
        if file_size > VideoCompressor.MAX_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"File too large. Maximum is {VideoCompressor.MAX_SIZE_MB}MB.")

        input_path.write_bytes(content)

        compressor = VideoCompressor()
        compressed = compressor.compress(input_path)

        background_tasks.add_task(cleanup_files, [input_path, compressed])
        
        ext = compressed.suffix.lstrip('.')
        return FileResponse(
            str(compressed), media_type=f"video/{ext}", filename=compressed.name
        )

    except HTTPException:
        raise
    except Exception as e:
        cleanup_files([input_path])
        raise HTTPException(500, f"Video compression failed: {str(e)}")
