"""
Compression services for images and videos.
Uses Pillow for images, FFmpeg for video.
"""
import os
import subprocess
import shutil
from pathlib import Path
from PIL import Image  # type: ignore

OUTPUT_DIR = Path("temp_outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

# Maximum dimension (width or height) for image compression
MAX_IMAGE_DIMENSION = 2048


class ImageCompressor:
    """Compress images (JPG, PNG, WebP, GIF) aggressively while preserving acceptable quality."""

    SUPPORTED = {'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'}

    def compress(self, file_path: Path, quality: int = 50) -> Path:
        ext = file_path.suffix.lower().lstrip('.')
        out_name = f"{file_path.stem}_Compressed"
        output_path = OUTPUT_DIR / f"{out_name}.{ext}"

        if ext == 'svg':
            # SVG: just copy — binary compression doesn't apply
            output_path = OUTPUT_DIR / f"{out_name}.svg"
            shutil.copy2(str(file_path), str(output_path))
            return output_path

        img = Image.open(file_path)

        # Resize if image exceeds max dimension (preserves aspect ratio)
        if max(img.size) > MAX_IMAGE_DIMENSION:
            img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)

        if ext in ('jpg', 'jpeg'):
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.save(str(output_path), 'JPEG', quality=quality, optimize=True)

        elif ext == 'png':
            # If no transparency, convert to JPEG for much better compression
            if img.mode in ('RGB', 'L'):
                output_path = OUTPUT_DIR / f"{out_name}.jpg"
                img.save(str(output_path), 'JPEG', quality=quality, optimize=True)
            else:
                # Has transparency — quantize + optimize
                img = img.quantize(method=2, dither=0)
                img.save(str(output_path), 'PNG', optimize=True)

        elif ext == 'webp':
            img.save(str(output_path), 'WEBP', quality=quality, method=6)

        elif ext == 'gif':
            img.save(str(output_path), 'GIF', optimize=True)

        elif ext == 'bmp':
            # BMP → JPEG for real compression
            output_path = OUTPUT_DIR / f"{out_name}.jpg"
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            else:
                img = img.convert('RGB')
            img.save(str(output_path), 'JPEG', quality=quality, optimize=True)

        else:
            raise ValueError(f"Unsupported image format: {ext}")

        return output_path


class VideoCompressor:
    """Compress video using FFmpeg CRF encoding."""

    MAX_SIZE_MB = 500

    def compress(self, file_path: Path, crf: int = 28, preset: str = "veryfast") -> Path:
        ext = file_path.suffix.lower()
        output_path = OUTPUT_DIR / f"{file_path.stem}_Compressed{ext}"

        ffmpeg_cmd = self._find_ffmpeg()

        cmd = [
            ffmpeg_cmd, "-y",
            "-i", str(file_path),
            "-c:v", "libx264",
            "-crf", str(crf),
            "-preset", preset,
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            str(output_path)
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            raise RuntimeError(f"Video compression failed: {result.stderr[-500:]}")

        if not output_path.exists() or output_path.stat().st_size < 1024:
            raise RuntimeError("Video compression produced no valid output file.")

        return output_path

    @staticmethod
    def _find_ffmpeg() -> str:
        if shutil.which("ffmpeg"):
            return "ffmpeg"

        if os.name == 'nt':
            for path in [r"C:\ffmpeg\bin\ffmpeg.exe", r"C:\Program Files\ffmpeg\bin\ffmpeg.exe"]:
                if os.path.exists(path):
                    return path

        raise RuntimeError("FFmpeg not found. Please install FFmpeg.")
