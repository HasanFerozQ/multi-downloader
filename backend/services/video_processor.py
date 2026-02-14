"""
Video processing service using FFmpeg for various video editing operations.
"""

import subprocess
import os
import uuid
from pathlib import Path
from typing import Dict, List, Optional

class VideoProcessor:
    """Handles video processing operations using FFmpeg."""
    
    def __init__(self, temp_dir: str = "temp_outputs"):
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(exist_ok=True)
    
    def _generate_output_path(self, extension: str) -> Path:
        """Generate a unique output file path."""
        filename = f"{uuid.uuid4()}.{extension}"
        return self.temp_dir / filename
    
    def trim_video(self, input_path: str, start_time: float, end_time: float) -> str:
        """
        Trim video from start_time to end_time (in seconds).
        
        Args:
            input_path: Path to input video file
            start_time: Start time in seconds
            end_time: End time in seconds
            
        Returns:
            Path to output video file
        """
        output_path = self._generate_output_path("mp4")
        duration = end_time - start_time
        
        cmd = [
            "ffmpeg",
            "-i", input_path,
            "-ss", str(start_time),
            "-t", str(duration),
            "-c", "copy",  # Copy codec for faster processing
            "-y",  # Overwrite output file
            str(output_path)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_path)
    
    def resize_video(
        self, 
        input_path: str, 
        width: int, 
        height: int, 
        crop_style: str = "center"
    ) -> str:
        """
        Resize video to specific dimensions with cropping.
        
        Args:
            input_path: Path to input video file
            width: Target width
            height: Target height
            crop_style: Crop style (center, top, bottom, fit)
            
        Returns:
            Path to output video file
        """
        output_path = self._generate_output_path("mp4")
        
        # Build filter based on crop style
        if crop_style == "fit":
            # Scale to fit with black bars
            vf = f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2"
        elif crop_style == "top":
            vf = f"scale={width}:-1,crop={width}:{height}:0:0"
        elif crop_style == "bottom":
            vf = f"scale={width}:-1,crop={width}:{height}:0:ih-{height}"
        else:  # center (default)
            vf = f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"
        
        cmd = [
            "ffmpeg",
            "-i", input_path,
            "-vf", vf,
            "-c:a", "copy",  # Copy audio codec
            "-y",
            str(output_path)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_path)
    
    def convert_format(
        self,
        input_path: str,
        output_format: str,
        quality: str = "medium",
        resolution: Optional[str] = None
    ) -> str:
        """
        Convert video to different format with quality settings.
        
        Args:
            input_path: Path to input video file
            output_format: Target format (mp4, webm, avi, mov, mkv)
            quality: Quality preset (high, medium, low)
            resolution: Target resolution (original, 2160, 1080, 720, 480, 360)
            
        Returns:
            Path to output video file
        """
        output_path = self._generate_output_path(output_format)
        
        # Quality presets
        quality_map = {
            "high": "18",    # CRF value (lower = better quality)
            "medium": "23",
            "low": "28"
        }
        crf = quality_map.get(quality, "23")
        
        cmd = [
            "ffmpeg",
            "-i", input_path,
        ]
        
        # Add resolution scaling if specified
        if resolution and resolution != "original":
            height = resolution
            cmd.extend(["-vf", f"scale=-2:{height}"])
        
        # Add codec and quality settings
        if output_format in ["mp4", "mov"]:
            cmd.extend(["-c:v", "libx264", "-crf", crf])
        elif output_format == "webm":
            cmd.extend(["-c:v", "libvpx-vp9", "-crf", crf])
        
        cmd.extend(["-c:a", "aac", "-b:a", "192k", "-y", str(output_path)])
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_path)
    
    def extract_audio(
        self,
        input_path: str,
        audio_format: str = "mp3",
        bitrate: str = "320"
    ) -> str:
        """
        Extract audio from video file.
        
        Args:
            input_path: Path to input video file
            audio_format: Output audio format (mp3, wav, aac, flac)
            bitrate: Audio bitrate in kbps (320, 256, 192, 128)
            
        Returns:
            Path to output audio file
        """
        output_path = self._generate_output_path(audio_format)
        
        cmd = [
            "ffmpeg",
            "-i", input_path,
            "-vn",  # No video
        ]
        
        # Format-specific settings
        if audio_format == "mp3":
            cmd.extend(["-c:a", "libmp3lame", "-b:a", f"{bitrate}k"])
        elif audio_format == "wav":
            cmd.extend(["-c:a", "pcm_s16le"])
        elif audio_format == "aac":
            cmd.extend(["-c:a", "aac", "-b:a", f"{bitrate}k"])
        elif audio_format == "flac":
            cmd.extend(["-c:a", "flac"])
        
        cmd.extend(["-y", str(output_path)])
        
        subprocess.run(cmd, check=True, capture_output=True)
        return str(output_path)
    
    def cleanup_file(self, file_path: str):
        """Delete a temporary file."""
        try:
            Path(file_path).unlink()
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
