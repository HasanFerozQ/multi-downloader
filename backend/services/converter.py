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
        raw_uuid = str(uuid.uuid4().hex)
        unique_id = raw_uuid[0:8] # type: ignore
        safe_name = Path(original_filename).stem
        return OUTPUT_DIR / f"{safe_name}_{unique_id}.{extension.lstrip('.')}"
    
    @staticmethod
    def create_zip(files: List[Path], zip_name: str = "converted_files.zip") -> Path:
        """Zips a list of files and returns the zip path."""
        zip_uuid = str(uuid.uuid4().hex)
        zip_path = OUTPUT_DIR / f"{zip_name}_{zip_uuid[0:6]}.zip" # type: ignore
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
    
    @staticmethod
    def _find_libreoffice() -> str:
        """Find the LibreOffice executable. Returns the path or raises an error."""
        import shutil
        
        # Check common command names in PATH
        for cmd in ['libreoffice', 'soffice']:
            found = shutil.which(cmd)
            if found:
                return found
        
        # Windows: check common install paths
        if os.name == 'nt':
            windows_paths = [
                r"C:\Program Files\LibreOffice\program\soffice.exe",
                r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            ]
            for path in windows_paths:
                if os.path.exists(path):
                    return path
        
        raise RuntimeError(
            "LibreOffice is not installed or not found in PATH. "
            "Please install LibreOffice from https://www.libreoffice.org/download/ "
            "to enable document conversions (DOC, DOCX, PPT, XLS → PDF)."
        )
    
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
            
            else:
                raise ValueError(f"Conversion from {input_ext} to {target_format} is not supported directly.")
                
        except Exception as e:
             raise RuntimeError(f"Document conversion failed: {str(e)}")

    def _convert_to_pdf_libreoffice(self, file_path: Path) -> Path:
        """Uses LibreOffice headless to convert to PDF, with docx2pdf fallback on Windows."""
        try:
            lo_cmd = self._find_libreoffice()
        except RuntimeError:
            lo_cmd = None
        
        if lo_cmd:
            cmd = [
                lo_cmd, "--headless",
                "--convert-to", "pdf",
                "--outdir", str(OUTPUT_DIR),
                str(file_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if result.returncode != 0:
                raise RuntimeError(f"LibreOffice conversion failed: {result.stderr}")
                
            # LibreOffice outputs to `stem.pdf` — rename to UUID to avoid concurrent collisions
            lo_output = OUTPUT_DIR / f"{file_path.stem}.pdf"
            if not lo_output.exists():
                raise RuntimeError("LibreOffice finished but output file not found.")
            unique_output = OUTPUT_DIR / f"{file_path.stem}_{uuid.uuid4().hex[:8]}.pdf"
            lo_output.rename(unique_output)
            return unique_output
        
        # Fallback: try docx2pdf (requires Microsoft Word on Windows)
        input_ext = file_path.suffix.lower().lstrip('.')
        if input_ext in ('doc', 'docx') and os.name == 'nt':
            try:
                import docx2pdf  # type: ignore
                output_path = OUTPUT_DIR / f"{file_path.stem}.pdf"
                docx2pdf.convert(str(file_path), str(output_path))
                if output_path.exists():
                    return output_path
            except ImportError:
                pass
            except Exception as e:
                raise RuntimeError(f"docx2pdf conversion failed: {str(e)}")
        
        # Final fallback: python-docx + fpdf2 (pure Python, no external tools needed)
        input_ext = file_path.suffix.lower().lstrip('.')
        if input_ext in ('doc', 'docx'):
            try:
                return self._convert_docx_to_pdf_python(file_path)
            except Exception as e:
                raise RuntimeError(f"All PDF conversion methods failed. Last error: {str(e)}")
        
        raise RuntimeError(
            "Neither LibreOffice nor Microsoft Word found. "
            "Install LibreOffice from https://www.libreoffice.org/download/ "
            "or Microsoft Word to enable document conversions."
        )

    def _convert_docx_to_pdf_python(self, file_path: Path) -> Path:
        """Pure-Python fallback: converts DOCX to PDF using python-docx + fpdf2."""
        from fpdf import FPDF  # type: ignore
        import docx as _docx

        output_path = OUTPUT_DIR / f"{file_path.stem}.pdf"

        doc = _docx.Document(str(file_path))
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Helvetica", size=11)

        for para in doc.paragraphs:
            text = para.text
            if not text.strip():
                pdf.ln(4)  # blank line spacing
                continue
            # Detect headings by style name
            style_name = para.style.name.lower() if para.style and para.style.name else ""
            if "heading 1" in style_name:
                pdf.set_font("Helvetica", style="B", size=16)
            elif "heading 2" in style_name:
                pdf.set_font("Helvetica", style="B", size=14)
            elif "heading" in style_name:
                pdf.set_font("Helvetica", style="B", size=12)
            else:
                pdf.set_font("Helvetica", size=11)
            # Encode safely for latin-1 (fpdf2 default)
            safe_text = text.encode("latin-1", errors="replace").decode("latin-1")
            pdf.multi_cell(0, 6, safe_text)
            pdf.ln(1)

        pdf.output(str(output_path))
        if not output_path.exists():
            raise RuntimeError("fpdf2 finished but output PDF not found.")
        return output_path

    def _pdf_to_docx(self, input_path: Path, output_path: Path) -> Path:
        cv = PdfConverter(str(input_path))
        try:
            cv.convert(str(output_path), start=0, end=None)
        finally:
            cv.close()
        return output_path

