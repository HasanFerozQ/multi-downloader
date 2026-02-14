import os
import shutil
import subprocess
import uuid
import zipfile
from pathlib import Path
from typing import List, Tuple, Optional

from PIL import Image
# from pydub import AudioSegment
from pdf2docx import Converter as PdfConverter
import docx

# Directories
UPLOAD_DIR = Path("temp_downloads")
OUTPUT_DIR = Path("temp_outputs")

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class BaseConverter:
    @staticmethod
    def _get_unique_filename(original_filename: str, extension: str) -> Path:
        """Generate a unique path for output functionality."""
        unique_id = uuid.uuid4().hex[:8]
        safe_name = Path(original_filename).stem
        return OUTPUT_DIR / f"{safe_name}_{unique_id}.{extension.lstrip('.')}"
    
    @staticmethod
    def create_zip(files: List[Path], zip_name: str = "converted_files.zip") -> Path:
        """Zips a list of files and returns the zip path."""
        zip_path = OUTPUT_DIR / f"{zip_name}_{uuid.uuid4().hex[:6]}.zip"
        with zipfile.ZipFile(zip_path, 'w') as zf:
            for file in files:
                zf.write(file, arcname=file.name)
        return zip_path


class ImageConverter(BaseConverter):
    SUPPORTED_FORMATS = {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'gif', 'ico', 'pdf'}

    def convert(self, file_path: Path, target_format: str) -> Path:
        """Convert image to target format."""
        target_format = target_format.lower()
        if target_format == 'jpeg': target_format = 'jpg'
        
        output_path = self._get_unique_filename(file_path.name, target_format)
        
        try:
            with Image.open(file_path) as img:
                # Convert RGBA to RGB if saving as JPG (which doesn't support alpha)
                if target_format in ['jpg', 'jpeg', 'bmp'] and img.mode in ('RGBA', 'LA'):
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[-1])
                    img = bg
                elif img.mode == 'P' and target_format == 'jpg':
                    img = img.convert("RGB")
                    
                img.save(output_path, quality=95)
                return output_path
        except Exception as e:
            raise RuntimeError(f"Image conversion failed: {str(e)}")


class AudioConverter(BaseConverter):
    SUPPORTED_FORMATS = {'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'}

    def convert(self, file_path: Path, target_format: str) -> Path:
        """Convert audio using ffmpeg subprocess directly."""
        target_format = target_format.lower()
        output_path = self._get_unique_filename(file_path.name, target_format)
        
        try:
            # Command: ffmpeg -y -i input.mp3 output.wav
            cmd = [
                "ffmpeg", "-y",
                "-i", str(file_path),
                str(output_path)
            ]
            
            # Run ffmpeg
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise RuntimeError(f"FFmpeg failed: {result.stderr}")
                
            if not output_path.exists():
                raise RuntimeError("FFmpeg finished but output file not found.")
                
            return output_path
        except Exception as e:
            raise RuntimeError(f"Audio conversion failed: {str(e)}")


class DocumentConverter(BaseConverter):
    # For LibreOffice conversions (doc, docx, ppt, pptx, xls, xlsx -> pdf)
    OFFICE_FORMATS = {'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp'}
    
    def convert(self, file_path: Path, target_format: str) -> Path:
        target_format = target_format.lower()
        input_ext = file_path.suffix.lower().lstrip('.')
        
        output_path = self._get_unique_filename(file_path.name, target_format)
        
        try:
            # 1. Word/Excel/PPT -> PDF using LibreOffice
            if target_format == 'pdf' and input_ext in self.OFFICE_FORMATS:
                return self._convert_to_pdf_libreoffice(file_path)
                
            # 2. PDF -> Word (docx) using pdf2docx
            elif input_ext == 'pdf' and target_format == 'docx':
                return self._pdf_to_docx(file_path, output_path)
            
            # 3. PDF to Images? (Could be added to ImageConverter but document context fits here too)
            
            else:
                raise ValueError(f"Conversion from {input_ext} to {target_format} is not supported directly.")
                
        except Exception as e:
             raise RuntimeError(f"Document conversion failed: {str(e)}")

    def _convert_to_pdf_libreoffice(self, file_path: Path) -> Path:
        """Uses LibreOffice headless to convert to PDF."""
        # Output dir for libreoffice must be a directory
        # The file will be named same as input but .pdf
        
        # Command: libreoffice --headless --convert-to pdf --outdir <dir> <file>
        cmd = [
            "libreoffice", "--headless",
            "--convert-to", "pdf",
            "--outdir", str(OUTPUT_DIR),
            str(file_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice failed: {result.stderr}")
            
        # Predict output filename: name.pdf
        expected_output = OUTPUT_DIR / f"{file_path.stem}.pdf"
        
        if not expected_output.exists():
            raise RuntimeError("LibreOffice finished but output file not found.")
            
        # check if we need to rename to use our unique naming convention? 
        # BaseConverter._get_unique_filename logic handles uniqueness, but here LO dictates name.
        # We can rename it to ensure uniqueness if multiple same-name files exist?
        # For now, simplistic approach.
        return expected_output

    def _pdf_to_docx(self, input_path: Path, output_path: Path) -> Path:
        cv = PdfConverter(str(input_path))
        cv.convert(str(output_path), start=0, end=None)
        cv.close()
        return output_path
