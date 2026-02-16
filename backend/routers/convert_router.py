from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional
import shutil
import os
from pathlib import Path
import uuid

from backend.services.converter import ImageConverter, AudioConverter, DocumentConverter, BaseConverter, UPLOAD_DIR, OUTPUT_DIR

router = APIRouter()

image_converter = ImageConverter()
audio_converter = AudioConverter()
doc_converter = DocumentConverter()


def cleanup_files(file_paths: List[Path]):
    """Background task to remove temp files after response."""
    for path in file_paths:
        try:
            if path.exists():
                os.remove(path)
        except Exception as e:
            print(f"Error cleaning up {path}: {e}")

@router.post("/convert/image")
async def convert_images(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed.")

    converted_files = []
    temp_inputs = []

    try:
        for file in files:
            # Save input file uniquely
            unique_name = f"{uuid.uuid4().hex}_{file.filename}"
            input_path = UPLOAD_DIR / unique_name
            with open(input_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_inputs.append(input_path)

            # Convert
            output_path = image_converter.convert(input_path, target_format)
            converted_files.append(output_path)

        # Response
        if len(converted_files) == 1:
            final_file = converted_files[0]
            filename = final_file.name
            media_type = f"image/{target_format}"
            background_tasks.add_task(cleanup_files, temp_inputs + converted_files)
            return FileResponse(final_file, media_type=media_type, filename=filename)
        else:
            # Zip multiple files
            zip_path = BaseConverter.create_zip(converted_files, "images_converted")
            background_tasks.add_task(cleanup_files, temp_inputs + converted_files + [zip_path])
            return FileResponse(zip_path, media_type="application/zip", filename="converted_images.zip")

    except Exception as e:
        # Cleanup on error
        cleanup_files(temp_inputs + converted_files)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/audio")
async def convert_audio(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    target_format: str = Form(...)
):
    if len(files) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 audio files allowed.")

    converted_files = []
    temp_inputs = []

    try:
        for file in files:
            unique_name = f"{uuid.uuid4().hex}_{file.filename}"
            input_path = UPLOAD_DIR / unique_name
            with open(input_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_inputs.append(input_path)

            output_path = audio_converter.convert(input_path, target_format)
            converted_files.append(output_path)

        if len(converted_files) == 1:
            final_file = converted_files[0]
            background_tasks.add_task(cleanup_files, temp_inputs + converted_files)
            return FileResponse(final_file, media_type=f"audio/{target_format}", filename=final_file.name)
        else:
            zip_path = BaseConverter.create_zip(converted_files, "audios_converted")
            background_tasks.add_task(cleanup_files, temp_inputs + converted_files + [zip_path])
            return FileResponse(zip_path, media_type="application/zip", filename="converted_audio.zip")

    except Exception as e:
        cleanup_files(temp_inputs + converted_files)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/document")
async def convert_document(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    target_format: str = Form(...)
):
    # PDF conversion usually 1 by 1 or small batch
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 documents allowed.")
        
    converted_files = []
    temp_inputs = []

    try:
        for file in files:
            unique_name = f"{uuid.uuid4().hex}_{file.filename}"
            input_path = UPLOAD_DIR / unique_name
            with open(input_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_inputs.append(input_path)
            
            output_path = doc_converter.convert(input_path, target_format)
            converted_files.append(output_path)

        if len(converted_files) == 1:
            final_file = converted_files[0]
            background_tasks.add_task(cleanup_files, temp_inputs + converted_files)
            return FileResponse(final_file, filename=final_file.name)
        else:
            zip_path = BaseConverter.create_zip(converted_files, "docs_converted")
            background_tasks.add_task(cleanup_files, temp_inputs + converted_files + [zip_path])
            return FileResponse(zip_path, media_type="application/zip", filename="converted_docs.zip")
            
    except Exception as e:
        cleanup_files(temp_inputs + converted_files)
        raise HTTPException(status_code=500, detail=str(e))
