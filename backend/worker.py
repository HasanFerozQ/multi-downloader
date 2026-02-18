import os, subprocess, time, shutil

# Python 3.13 compatibility fix - MUST be imported before Celery
try:
    import backend.billiard_fix
except ImportError:
    try:
        import billiard_fix
    except ImportError:
        pass  # Skip if not using Python 3.13

from celery import Celery

from dotenv import load_dotenv
load_dotenv()

# rnnoise-python is not on PyPI — we use FFmpeg's built-in arnndn filter instead
# (same underlying RNNoise neural network, no extra Python dependencies needed)
HAS_RNNOISE = True  # Always available via FFmpeg

try:
    import noisereduce as nr # type: ignore
    import numpy as np # type: ignore
    import soundfile as sf # type: ignore
    HAS_NOISEREDUCE = True
except ImportError:
    HAS_NOISEREDUCE = False
    print("[WARNING] noisereduce/soundfile not found. Spectral Denoise will be skipped.")

try:
    from pedalboard import Pedalboard, NoiseGate, HighpassFilter, LowpassFilter # type: ignore
    from pedalboard.io import AudioFile # type: ignore
    HAS_PEDALBOARD = True
except ImportError:
    HAS_PEDALBOARD = False
    print("[WARNING] pedalboard not found. Clarity slider will be skipped.")
import uuid
import json


celery = Celery('worker', 
                broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"), 
                backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")) # type: ignore

def get_ffmpeg_location():
    """
    FIXED FOR DIGITAL OCEAN / LINUX HOSTING
    Detects FFmpeg automatically - works on Linux servers
    """
    # First check if ffmpeg is in PATH (most common on Linux)
    if shutil.which("ffmpeg"):
        return None  # yt-dlp will use system ffmpeg
    
    # Linux common locations
    linux_paths = [
        "/usr/bin",
        "/usr/local/bin",
        "/opt/ffmpeg/bin"
    ]
    
    for path in linux_paths:
        ffmpeg_bin = os.path.join(path, "ffmpeg")
        if os.path.exists(ffmpeg_bin):
            return path
    
    # Windows fallback (for local development)
    if os.name == 'nt':  # Windows
        windows_paths = [
            r"C:\ffmpeg\bin",
            r"C:\Program Files\ffmpeg\bin",
        ]
        for path in windows_paths:
            if os.path.exists(os.path.join(path, "ffmpeg.exe")):
                return path
    
    return None

def update_ytdlp():
    """Keep yt-dlp updated"""
    try:
        subprocess.run(["pip", "install", "-U", "yt-dlp"], 
                      capture_output=True, 
                      timeout=30,
                      check=False)
    except:
        pass

@celery.task(bind=True)
def download_video_task(self, url: str, format_id: str, output_path: str):
    """
    FIXED: Complete working version with proper return values
    """
    try:
        update_ytdlp()
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        self.update_state(state='PROGRESS', meta={'progress': 0, 'status': 'Starting'})
        
        ffmpeg_location = get_ffmpeg_location()
        
        if format_id == "mp3":
            # Audio extraction
            cmd = [
                "yt-dlp", 
                "-f", "bestaudio/best", 
                "--extract-audio", 
                "--audio-format", "mp3", 
                "--audio-quality", "0",
                "--newline", 
                "-o", output_path.replace('.mp3', '.%(ext)s'),
                url
            ]
            if ffmpeg_location:
                cmd.insert(1, "--ffmpeg-location")
                cmd.insert(2, ffmpeg_location)
        else:
            # Video download
            if format_id == "best":
                format_spec = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best"
            else:
                format_spec = f"({format_id}[vcodec^=avc1]/bestvideo[vcodec^=avc1])+(bestaudio[ext=m4a]/bestaudio)/best"
            
            cmd = [
                "yt-dlp", 
                "-f", format_spec, 
                "--merge-output-format", "mp4", 
                "--newline",
                "-o", output_path,
                url
            ]
            
            if ffmpeg_location:
                cmd.insert(1, "--ffmpeg-location")
                cmd.insert(2, ffmpeg_location)
                cmd.extend(["--postprocessor-args", "ffmpeg:-c:a aac -b:a 192k"])
        
        self.update_state(state='PROGRESS', meta={'progress': 5, 'status': 'Downloading'})
        
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT, 
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        last_progress: float = 0.0
        
        if process.stdout:
            for line in process.stdout:
                if "[download]" in line and "%" in line:
                    try:
                        parts = line.split()
                        for part in parts:
                            if '%' in part:
                                p_str = ''.join(c for c in part if c.isdigit() or c == '.')
                                if p_str:
                                    progress = float(p_str)
                                    if progress - last_progress >= 1.0 or progress == 100.0:
                                        last_progress = progress
                                        self.update_state(
                                            state='PROGRESS', 
                                            meta={'progress': min(progress, 99.0), 'status': 'Downloading'}
                                        )
                                break
                    except:
                        pass
                
                if "[Merger]" in line or "Merging formats" in line:
                    self.update_state(state='PROGRESS', meta={'progress': 95, 'status': 'Processing'})
                
                if "ExtractAudio" in line or "Converting" in line:
                    self.update_state(state='PROGRESS', meta={'progress': 90, 'status': 'Converting'})

        
        process.wait()
        
        if process.returncode != 0:
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                # FIXED: Return success even if exit code is non-zero but file exists
                return {"status": "success", "path": output_path, "size": os.path.getsize(output_path)}
            else:
                raise Exception(f"Download failed. Check URL validity or age restrictions.")
        
        # FIXED: Handle extension changes
        if not os.path.exists(output_path):
            base_path = os.path.splitext(output_path)[0]
            for ext in ['.mp4', '.webm', '.mkv', '.mp3', '.m4a']:
                alt_path = base_path + ext
                if os.path.exists(alt_path):
                    try:
                        os.rename(alt_path, output_path)
                    except:
                        output_path = alt_path
                    break
            else:
                raise Exception("File not found after download")
        
        # FIXED: Verify file size
        if os.path.getsize(output_path) < 1024:
            raise Exception("File too small, download may have failed")
        
        # FIXED: MUST return success result for task to complete
        return {
            "status": "success", 
            "path": output_path,
            "size": os.path.getsize(output_path)
        }
        
    except Exception as e:
        # Clean up failed downloads
        if os.path.exists(output_path):
            try:
                os.remove(str(output_path))
            except:
                pass
        raise Exception(f"Download failed: {str(e)}")

@celery.task
def scheduled_cleanup():
    """Cleanup old files every 10 minutes"""
    folder = "temp_downloads"
    if not os.path.exists(folder):
        return "Folder not found"
    
    now = time.time()
    cleaned: int = 0
    
    for f in os.listdir(folder):
        f_path = os.path.join(folder, f)
        if os.path.isfile(f_path):
            if now - float(os.stat(f_path).st_mtime) > 1800:  # 30 minutes
                try:
                    os.remove(f_path)
                    cleaned += 1
                except:
                    pass
    
    return f"Cleaned {cleaned} files"

# Celery Beat schedule for periodic cleanup
celery.conf.beat_schedule = {
    'cleanup-every-10-minutes': {
        'task': 'backend.worker.scheduled_cleanup',
        'schedule': 600.0,
    },
}

# --- Audio Processing Helpers ---

def _to_wav(input_path: str, ffmpeg_cmd: str, sample_rate: int = 44100) -> str:
    """Convert any audio file to a temporary WAV for processing."""
    wav_path = input_path + "_tmp.wav"
    subprocess.run(
        [ffmpeg_cmd, "-y", "-i", input_path, "-ar", str(sample_rate), "-ac", "1", wav_path],
        check=True, capture_output=True
    )
    return wav_path


def apply_rnnoise(input_path: str, ffmpeg_cmd: str) -> str:
    """
    DeNoise Ultra: aggressive dual-filter FFmpeg denoising.
    Uses afftdn (spectral subtraction) + anlmdn (non-local means) in sequence.
    arnndn requires an external model file so we avoid it.
    """
    try:
        out_path = input_path + "_rnnoise.wav"
        # afftdn: aggressive spectral noise floor at -25dB
        # anlmdn: non-local means denoiser, strong settings
        filter_chain = "afftdn=nf=-25:nr=33:nt=w,anlmdn=s=10:p=0.001:r=0.001:m=15"
        result = subprocess.run(
            [ffmpeg_cmd, "-y", "-i", input_path, "-af", filter_chain, out_path],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            # type: ignore - stderr is str due to text=True
            err_msg = result.stderr[-300:] if result.stderr else "Unknown error"
            print(f"[WARNING] DeNoise Ultra FFmpeg error: {err_msg}")
            return input_path
        print("[INFO] DeNoise Ultra complete.")
        return out_path
    except Exception as e:
        print(f"[WARNING] DeNoise Ultra failed ({e}), skipping.")
        return input_path


def apply_noisereduce(input_path: str, ffmpeg_cmd: str, strength: float) -> str:
    """Spectral gating noise reduction via noisereduce. strength: 0.0-1.0"""
    if not HAS_NOISEREDUCE or strength <= 0:
        return input_path
    try:
        wav_path = _to_wav(input_path, ffmpeg_cmd)
        audio_data, sample_rate = sf.read(wav_path)
        print(f"[INFO] noisereduce: audio shape={audio_data.shape}, sr={sample_rate}, strength={strength:.2f}")
        # stationary=True: estimates noise floor from the whole signal — no noise clip needed
        # This is more reliable than using first 0.5s which may contain speech
        reduced = nr.reduce_noise(
            y=audio_data,
            sr=sample_rate,
            prop_decrease=strength,
            stationary=True,
            n_fft=1024,
            n_std_thresh_stationary=1.5,
        )
        out_path = input_path + "_nr.wav"
        sf.write(out_path, reduced, sample_rate)
        os.remove(wav_path)
        print(f"[INFO] noisereduce complete (strength={strength:.2f}).")
        return out_path
    except Exception as e:
        print(f"[WARNING] noisereduce failed ({e}), skipping.")
        return input_path


def apply_pedalboard_clarity(input_path: str, ffmpeg_cmd: str, strength: float) -> str:
    """Pedalboard clarity chain: NoiseGate + HighpassFilter + LowpassFilter. strength: 0.0-1.0"""
    if not HAS_PEDALBOARD or strength <= 0:
        return input_path
    try:
        wav_path = _to_wav(input_path, ffmpeg_cmd)
        # threshold_db: maps 0-1 strength to -60dB (gentle) to -20dB (aggressive)
        threshold_db = -60.0 + (strength * 40.0)
        print(f"[INFO] Pedalboard clarity: threshold={threshold_db:.1f}dB, strength={strength:.2f}")
        board = Pedalboard([
            NoiseGate(threshold_db=threshold_db, ratio=6.0, attack_ms=2.0, release_ms=150.0),
            HighpassFilter(cutoff_frequency_hz=80.0),
            LowpassFilter(cutoff_frequency_hz=16000.0),
        ])
        out_path = input_path + "_clarity.wav"
        with AudioFile(wav_path) as f:
            audio = f.read(f.frames)
            sample_rate = f.samplerate
        processed = board(audio, sample_rate)
        with AudioFile(out_path, 'w', sample_rate, processed.shape[0]) as f:
            f.write(processed)
        os.remove(wav_path)
        print(f"[INFO] Pedalboard clarity complete.")
        return out_path
    except Exception as e:
        print(f"[WARNING] Pedalboard failed ({e}), skipping.")
        return input_path


# --- Audio Processing Task ---

def run_audio_pipeline(input_path: str, output_path: str, effects: dict, progress_callback=None):
    """
    Core audio processing logic.
    progress_callback(status_str, progress_int)
    """
    intermediate_files = []
    try:
        if progress_callback: progress_callback('Initializing...', 0)

        ffmpeg_dir = get_ffmpeg_location()
        ffmpeg_cmd = os.path.join(ffmpeg_dir, "ffmpeg") if ffmpeg_dir else "ffmpeg"

        current_input = input_path

        # 1. DeNoise Ultra (RNNoise)
        if effects.get("denoise_ultra", False):
            if progress_callback: progress_callback('Running DeNoise Ultra (RNNoise)...', 15)
            result = apply_rnnoise(current_input, ffmpeg_cmd)
            if result != current_input:
                intermediate_files.append(result)
                current_input = result

        # 2. Spectral Denoise (noisereduce)
        nr_strength = float(effects.get("advanced_noise_reduction", 0)) / 100.0
        if nr_strength > 0:
            if progress_callback: progress_callback('Applying Spectral Denoise...', 35)
            result = apply_noisereduce(current_input, ffmpeg_cmd, nr_strength)
            if result != current_input:
                intermediate_files.append(result)
                current_input = result

        # 3. Clarity (pedalboard)
        clarity_strength = float(effects.get("clarity", 0)) / 100.0
        if clarity_strength > 0:
            if progress_callback: progress_callback('Applying Clarity Enhancement...', 55)
            result = apply_pedalboard_clarity(current_input, ffmpeg_cmd, clarity_strength)
            if result != current_input:
                intermediate_files.append(result)
                current_input = result

        # 4. FFmpeg Filters
        if progress_callback: progress_callback('Applying Effects...', 75)

        filter_complex = []
        volume = int(effects.get("volume", 0))
        if volume != 0:
            filter_complex.append(f"volume={volume}dB")

        noise_reduction = float(effects.get("noise_reduction", 0))
        if noise_reduction > 0:
            nr_level = -50 + (noise_reduction / 100) * 30
            filter_complex.append(f"afftdn=nf={nr_level}")

        if float(effects.get("hum_removal", 0)) > 0:
            filter_complex.append("anequalizer=c0 f=50 w=100 g=-60 t=2|c0 f=100 w=100 g=-60 t=2|c0 f=150 w=100 g=-60 t=2")

        filter_str = ",".join(filter_complex) if filter_complex else "anull"

        cmd = [
            ffmpeg_cmd, "-y",
            "-i", current_input,
            "-af", filter_str,
            "-c:a", "libmp3lame", "-q:a", "2",
            output_path
        ]

        print(f"[INFO] Pipeline running FFmpeg: {cmd}")
        subprocess.run(cmd, check=True, capture_output=True)

        if progress_callback: progress_callback('Complete', 100)
        return output_path

    finally:
        for f in intermediate_files:
            try:
                if os.path.exists(f): 
                    os.remove(f)
            except: pass


# --- Audio Processing Task ---

@celery.task(bind=True)
def process_audio_task(self, input_path: str, output_path: str, effects: dict):
    """
    Background task wrapper for run_audio_pipeline.
    """
    try:
        def update_progress(status, progress):
            self.update_state(state='PROCESSING', meta={'status': status, 'progress': progress})

        run_audio_pipeline(input_path, output_path, effects, update_progress)
        
        # Do NOT call self.update_state(state='SUCCESS') here.
        # Celery automatically sets the task to SUCCESS and stores the return value
        # as result.result. Manual update_state(SUCCESS) would overwrite the result
        # with just the meta dict (no 'path' key), breaking the download endpoint.
        return {"status": "success", "path": output_path}

    except Exception as e:
        print(f"[ERROR] Worker failed: {e}")
        self.update_state(state='FAILURE', meta={'status': 'Failed', 'error': str(e)})
        raise e
