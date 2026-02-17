from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks # type: ignore
from fastapi.responses import FileResponse, JSONResponse # type: ignore
import shutil
import os
import uuid
import asyncio
import subprocess
from pathlib import Path
import json
from backend.services.video_processor import VideoProcessor # type: ignore 

router = APIRouter(prefix="/audio-tools", tags=["audio-tools"])

@router.get("/debug")
async def debug_env():
    import platform
    import os
    from pathlib import Path
    
    ffmpeg_path = str(Path(__file__).parent.parent / "ffmpeg.exe") if platform.system() == "Windows" else (shutil.which("ffmpeg") or "ffmpeg")
    
    return {
        "os": platform.system(),
        "cwd": os.getcwd(),
        "ffmpeg_path": ffmpeg_path,
        "ffmpeg_exists": os.path.exists(ffmpeg_path) if platform.system() == "Windows" else True,
        "temp_uploads_exists": os.path.exists("temp_uploads"),
        "temp_outputs_exists": os.path.exists("temp_outputs")
    }


# FFmpeg path - cross-platform compatible
# On Windows: use local ffmpeg.exe in backend directory
# On Linux/Production: use system-installed ffmpeg
import shutil
import platform

if platform.system() == "Windows":
    # Local ffmpeg.exe for Windows development
    FFMPEG_PATH = str(Path(__file__).parent.parent / "ffmpeg.exe")
else:
    # System ffmpeg for Linux/Production
    FFMPEG_PATH = shutil.which("ffmpeg") or "ffmpeg"

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR = Path("temp_outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

def cleanup_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass

@router.post("/extract-from-video")
async def extract_from_video(file: UploadFile = File(...)):
    """
    Extract audio from an uploaded video file.
    Default output format: mp3, 192k
    """
    try:
        file_id = str(uuid.uuid4())
        input_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
        output_path = OUTPUT_DIR / f"{file_id}.mp3"
        
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Use ffmpeg to extract audio
        cmd = [
            FFMPEG_PATH, "-i", str(input_path),
            "-vn", "-acodec", "libmp3lame", "-q:a", "2", 
            "-y", str(output_path)
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        
        result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True) # type: ignore
        stdout, stderr = result.stdout, result.stderr
        return_code = result.returncode
        
        if return_code != 0:
            error_msg = stderr if stderr else "No error output (stderr empty)"
            print(f"FFmpeg failed with return code {return_code}. Error: {error_msg}")
            raise HTTPException(status_code=500, detail=f"FFmpeg failed [{return_code}]: {error_msg}")
        
        cleanup_file(str(input_path))
        
        if not output_path.exists():
             raise HTTPException(status_code=500, detail="Audio extraction failed: Output file not created")
             
        return FileResponse(output_path, media_type="audio/mpeg", filename=f"{Path(file.filename).stem}.mp3")

    except HTTPException:
        cleanup_file(str(input_path))
        raise
    except Exception as e:
        cleanup_file(str(input_path))
        import traceback
        tb = traceback.format_exc()
        print(f"CRITICAL ERROR in extract_from_video:\n{tb}")
        # Return full traceback detail temporarily for debugging
        raise HTTPException(
            status_code=500, 
            detail=f"Server error [{type(e).__name__}]: {str(e)}\nTraceback: {tb}"
        )

@router.post("/process-audio")
async def process_audio(
    file: UploadFile = File(...),
    effects: str = Form(...), # JSON string of effects or preset name
    preview: bool = Form(False)
):
    """
    Apply audio effects to an uploaded audio file.
    Effects: noise_reduction (0-100), fix_echo (0-100), enhance_voice (0-100), breath_removal (0-100), volume (-10 to 10), advanced_noise_reduction (0-100), hum_removal (0-100)
    Presets: 'podcast', 'cave', 'radio', 'phone'
    If preview is True, only processes first 30 seconds.
    """
    input_path = None
    output_path = None
    try:
        effects_data = json.loads(effects)
        print(f"[DEBUG] Received effects data: {effects_data}")
        
        file_id = str(uuid.uuid4())
        input_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
        output_path = OUTPUT_DIR / f"processed_{file_id}.mp3"
        
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Build filters list - always process manual effects, then prepend preset if selected
        filters = []
        preset = effects_data.get("preset")
        
        # ALWAYS process manual effects (whether preset is selected or not)
        # 1. Noise Removal (Highpass filter) - INCREASED RANGE
        # Strength 0-100 maps to frequency 50Hz - 800Hz
        if effects_data.get("noise_reduction"):
            strength = float(effects_data.get("noise_reduction", 0))
            if strength > 0:
                freq = 50 + (strength * 7.5) # 50Hz to 800Hz
                filters.append(f"highpass=f={freq}")

        # 2. Fix Echo / Reverb (Gate) - PROFESSIONAL DEREVERB
        # Strength 0-100 maps to dereverb intensity
        if effects_data.get("fix_echo"):
            strength = float(effects_data.get("fix_echo", 0))
            if strength > 0:
                 # Combine afftdn in speech mode + aggressive gating
                 # afftdn with track noise (tn=1) for adaptive noise reduction
                 nr_amount = 10 + (strength * 0.3) # 10-40dB
                 threshold = 0.001 + (strength / 100.0) # 0.001 to 1.0
                 filters.append(f"afftdn=nr={nr_amount}:nf=-20:tn=1,agate=threshold={threshold}:ratio=4:attack=5:release=50")

        # 3. Enhance Voice (Equalizer) - PROFESSIONAL VOICE ENHANCEMENT
        # Clarity 0-100 maps to presence boost + low-cut
        if effects_data.get("enhance_voice"):
            clarity = float(effects_data.get("enhance_voice", 0))
            if clarity > 0:
                # Presence boost at 2.5kHz-5kHz, cut mud at 200-400Hz
                presence_gain = clarity / 6.67 # 0 to 15dB
                mud_cut = -1 * (clarity / 20.0) # 0 to -5dB
                filters.append(f"equalizer=f=3000:t=q:w=1:g={presence_gain},equalizer=f=300:t=q:w=2:g={mud_cut},highpass=f=80")

        # 4. Breath Removal (Gate) - PROFESSIONAL BREATH GATE
        # Sensitivity 0-100 maps to threshold
        if effects_data.get("breath_removal"):
             sensitivity = float(effects_data.get("breath_removal", 0))
             if sensitivity > 0:
                 # Very fast attack, medium release for breath removal
                 threshold = 0.005 + (sensitivity / 200.0) # 0.005 to 0.5
                 filters.append(f"highpass=f=150,agate=threshold={threshold}:ratio=10:attack=1:release=50:range=-60dB")

        # 5. Volume
        # Gain -10 to 10 dB
        if effects_data.get("volume") is not None:
            vol = float(effects_data.get("volume", 0))
            if vol != 0:
                filters.append(f"volume={vol}dB")

        # 6. Advanced Noise Reduction (FFT-based) - PROFESSIONAL GRADE
        # Strength 0-100 maps to noise reduction level
        if effects_data.get("advanced_noise_reduction"):
            adv_strength = float(effects_data.get("advanced_noise_reduction", 0))
            if adv_strength > 0:
                # Use afftdn (FFT denoiser) + anlmdn (non-local means) for best results
                # afftdn: nr=noise reduction amount, nf=noise floor, tn=track noise
                nr_level = 15 + (adv_strength * 0.5) # 15-65dB
                # anlmdn: s=strength (higher = more smoothing)
                anlmdn_strength = adv_strength / 10.0 # 0-10
                filters.append(f"afftdn=nr={nr_level}:nf=-25:tn=1,anlmdn=s={anlmdn_strength}")

        # 7. Hum / Buzz Removal (Notch filters) - PROFESSIONAL DEHUMMER
        # Strength 0-100. Remove 50Hz/60Hz + harmonics
        if effects_data.get("hum_removal"):
             hum_strength = float(effects_data.get("hum_removal", 0))
             if hum_strength > 0:
                 # Remove fundamental frequencies + harmonics
                 # 50Hz (EU) + harmonics: 100Hz, 150Hz
                 # 60Hz (US) + harmonics: 120Hz, 180Hz
                 width = 5 + (hum_strength / 10.0) # Adaptive width based on strength
                 filters.append(f"highpass=f=35,lowpass=f=15000,notch=f=50:w={width},notch=f=60:w={width},notch=f=100:w={width},notch=f=120:w={width},notch=f=150:w={width},notch=f=180:w={width}")

        # NOW prepend preset filters if a preset is selected
        # This allows combining preset + manual effects
        if preset:
            preset_filters = []
            if preset == "podcast":
                preset_filters = [
                    "highpass=f=80",
                    "compand=attacks=0.3:decays=0.8:points=-80/-80|-45/-15|-27/-9|0/-7|20/-7:soft-knee=6",
                    "equalizer=f=3000:t=q:w=1:g=6",
                    "equalizer=f=150:t=q:w=1:g=-3"
                ]
            elif preset == "cave":
                preset_filters = [
                    "aecho=0.8:0.88:60:0.4",
                    "aecho=0.8:0.88:1000:0.3",
                    "equalizer=f=1000:t=q:w=2:g=-4"
                ]
            elif preset == "radio":
                preset_filters = [
                    "highpass=f=300",
                    "lowpass=f=3000",
                    "compand=attacks=0.1:decays=0.4:points=-80/-80|-50/-50|-30/-30|-20/-20|0/-10:soft-knee=6",
                    "equalizer=f=2000:t=q:w=1:g=3"
                ]
            elif preset == "phone":
                preset_filters = [
                    "highpass=f=300",
                    "lowpass=f=3400",
                    "equalizer=f=1000:t=q:w=2:g=-6"
                ]
            # Prepend preset filters to manual filters
            filters = preset_filters + filters

        print(f"[DEBUG] Total filters to apply: {len(filters)}")
        print(f"[DEBUG] Filter list: {filters}")
        
        filter_str = ",".join(filters) if filters else "anull"
        print(f"[DEBUG] Final filter string: {filter_str}")
        
        cmd = [FFMPEG_PATH, "-i", str(input_path)]
        
        if preview:
            cmd.extend(["-t", "30"]) # Process only 30 seconds for preview
            
        cmd.extend([
            "-af", filter_str,
            "-y", str(output_path)
        ])
        
        print(f"[DEBUG] FFmpeg command: {' '.join(cmd)}")
        result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True) # type: ignore
        print(f"[DEBUG] FFmpeg return code: {result.returncode}")
        if result.stderr:
            stderr_str: str = str(result.stderr) if result.stderr else ""
            stderr_preview = stderr_str[:500]  # type: ignore
            print(f"[DEBUG] FFmpeg stderr: {stderr_preview}")
        
        if not output_path.exists():
             error_msg = result.stderr if result.stderr else "No error output"
             print(f"FFmpeg failed: {error_msg}")
             raise HTTPException(status_code=500, detail=f"Audio processing failed: {error_msg}")

        return FileResponse(output_path, media_type="audio/mpeg", filename=f"processed_{file.filename}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if input_path: cleanup_file(str(input_path))

@router.get("/extract-from-link")
async def extract_from_link(url: str):
    """
    Extract audio from a supported link (YouTube, TikTok, etc.)
    """
    try:
        file_id = str(uuid.uuid4())
        output_template = str(OUTPUT_DIR / f"{file_id}.%(ext)s")
        
        cmd = [
            "yt-dlp",
            "-x", # Extract audio
            "--audio-format", "mp3",
            "--audio-quality", "192K",
            "-o", output_template,
            url
        ]
        
        result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True) # type: ignore
        
        if result.returncode != 0:
            error_msg = result.stderr if result.stderr else "No error output"
            raise HTTPException(status_code=400, detail=f"Download failed: {error_msg}")
            
        # yt-dlp might output .mp3 directly
        final_path = OUTPUT_DIR / f"{file_id}.mp3"
        
        if not final_path.exists():
             raise HTTPException(status_code=500, detail="Audio file not found after extraction")
             
        # Return the file directly for now, or a download URL if we had static serving
        # For this app, we return the file stream
        return FileResponse(final_path, media_type="audio/mpeg", filename="extracted_audio.mp3")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
