"use client";

import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, Loader2, Mic, Music, Volume2, Wind, Sparkles, Activity, Play, Pause, Radio, Phone, Podcast, Mountain, X, Zap, Sliders, ToggleLeft, ToggleRight } from "lucide-react";
import { API_URL } from "@/config/api";
import WaveSurfer from 'wavesurfer.js';

// Effect state now mixes booleans (toggles) and numbers (real-time sliders)
type EffectState = {
    // Backend Toggles (Heavy Processing)
    noise_reduction: boolean; // Was number
    fix_echo: boolean;        // Was number
    enhance_voice: boolean;   // Was number
    breath_removal: boolean;  // Was number
    advanced_noise_reduction: boolean; // Was number
    hum_removal: boolean;     // Was number
    denoise_ultra: boolean;   // Already boolean

    // Real-time Web Audio API (Sliders)
    volume: number;           // +/- dB
    clarity: number;          // 0-100%
};

const MAX_FILE_SIZE = 700 * 1024 * 1024; // 700MB

export default function AudioToolsSection() {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    // Queue System State
    const [taskId, setTaskId] = useState<string | null>(null);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>("Processing...");

    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Web Audio API Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
    const highpassNodeRef = useRef<BiquadFilterNode | null>(null);

    const [effects, setEffects] = useState<EffectState>({
        // Toggles -> Default Off
        noise_reduction: false,
        fix_echo: false,
        enhance_voice: false,
        breath_removal: false,
        advanced_noise_reduction: false,
        hum_removal: false,
        denoise_ultra: false,

        // Sliders -> Default 0
        volume: 0,
        clarity: 0,
    });

    // --- Web Audio API Setup ---
    useEffect(() => {
        if (!extractedAudioUrl || !wavesurfer.current) return;

        const mediaElement = wavesurfer.current.getMediaElement();
        if (!mediaElement) return;

        // Initialize Audio Context only once
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }

        const ctx = audioContextRef.current;

        // Create Nodes if they don't exist
        if (!sourceNodeRef.current) {
            try {
                sourceNodeRef.current = ctx.createMediaElementSource(mediaElement);
            } catch (e) {
                // Node might already be connected if re-running
                console.warn("MediaElementSource mostly already attached", e);
            }
        }

        if (!gainNodeRef.current) gainNodeRef.current = ctx.createGain();
        if (!compressorNodeRef.current) compressorNodeRef.current = ctx.createDynamicsCompressor();
        if (!highpassNodeRef.current) {
            highpassNodeRef.current = ctx.createBiquadFilter();
            highpassNodeRef.current.type = "highpass";
            highpassNodeRef.current.frequency.value = 0; // Start flat
        }

        // Connect Graph: Source -> Highpass -> Compressor -> Gain -> Destination
        if (sourceNodeRef.current && highpassNodeRef.current && compressorNodeRef.current && gainNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current
                .connect(highpassNodeRef.current)
                .connect(compressorNodeRef.current)
                .connect(gainNodeRef.current)
                .connect(ctx.destination);
        }

        return () => {
            // Cleanup on unmount/change? Usually contexts persist, but we can disconnect
        };
    }, [extractedAudioUrl]);

    // --- Real-time Effect Updates ---

    // 1. Volume Change (GainNode)
    useEffect(() => {
        if (!gainNodeRef.current || !audioContextRef.current) return;

        // Map dB to linear gain: 10^(dB/20)
        // effects.volume is -10 to +10
        const gainValue = Math.pow(10, effects.volume / 20);

        // Smooth transition
        gainNodeRef.current.gain.setTargetAtTime(gainValue, audioContextRef.current.currentTime, 0.1);

    }, [effects.volume]);

    // 2. Clarity Change (Compressor + Highpass)
    useEffect(() => {
        if (!compressorNodeRef.current || !highpassNodeRef.current || !audioContextRef.current) return;

        const percent = effects.clarity; // 0-100

        // Compressor Threshold: Lower threshold = more compression = "punchier/clearer"
        // 0% -> -10dB (barely active), 100% -> -40dB (squashed/loud)
        const threshold = -10 - (percent * 0.3);
        compressorNodeRef.current.threshold.setTargetAtTime(threshold, audioContextRef.current.currentTime, 0.1);

        // Highpass Filter: Remove muddiness
        // 0% -> 0Hz, 100% -> 200Hz
        const cutoff = percent * 2;
        highpassNodeRef.current.frequency.setTargetAtTime(cutoff, audioContextRef.current.currentTime, 0.1);

        // Makeup Gain (roughly): Compressor reduces volume, so we boost slightly
        // We can do this via the knee or ratio, keeping it simple
        compressorNodeRef.current.ratio.value = 1 + (percent / 20); // 1 to 6 ratio
        compressorNodeRef.current.knee.value = 40 - (percent * 0.3);

    }, [effects.clarity]);


    // Polling Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (processing && taskId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_URL}/audio-tools/status/${taskId}`);
                    if (!res.ok) return;

                    const data = await res.json();

                    if (data.status === 'SUCCESS') {
                        clearInterval(interval);
                        setProcessing(false);
                        setTaskId(null);

                        // Download
                        const downloadUrl = `${API_URL}/audio-tools/download/${data.task_id}`;
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = "processed_audio.mp3";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                    } else if (data.status === 'FAILURE') {
                        clearInterval(interval);
                        setProcessing(false);
                        setTaskId(null);
                        setError(data.error || "Processing failed");
                    } else {
                        // Update UI
                        setStatusMessage(data.message || "Processing...");
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [processing, taskId]);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];

            if (selectedFile.size > MAX_FILE_SIZE) {
                setError(`File size exceeds 700MB limit. Your file is ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
                return;
            }

            setFile(selectedFile);
            setError(null);
            setSelectedPreset(null);
            handleExtract(selectedFile);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': [], 'audio/*': [] },
        maxFiles: 1,
        maxSize: MAX_FILE_SIZE
    });

    useEffect(() => {
        if (extractedAudioUrl && waveformRef.current) {
            if (wavesurfer.current) wavesurfer.current.destroy();

            wavesurfer.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#4f46e5',
                progressColor: '#ec4899',
                cursorColor: '#ec4899',
                barWidth: 2,
                barGap: 3,
                height: 100,
                // Important for Web Audio API:
                backend: 'MediaElement',
            });

            wavesurfer.current.load(extractedAudioUrl);

            wavesurfer.current.on('ready', () => {
                console.log('[DEBUG] Waveform loaded and ready');
                setUploadProgress(0);
            });

            wavesurfer.current.on('finish', () => setIsPlaying(false));
            wavesurfer.current.on('play', () => setIsPlaying(true));
            wavesurfer.current.on('pause', () => setIsPlaying(false));

            return () => {
                if (wavesurfer.current) wavesurfer.current.destroy();
            };
        }
    }, [extractedAudioUrl]);

    const handleExtract = async (uploadedFile: File) => {
        setProcessing(true);
        setError(null);
        setExtractedAudioUrl(null);
        setUploadProgress(0);

        try {
            let extractedBlob: Blob;
            const isVideo = uploadedFile.type.startsWith('video');

            if (isVideo) {
                const formData = new FormData();
                formData.append("file", uploadedFile);

                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        setUploadProgress(Math.round(percentComplete));
                    }
                });

                const response = await new Promise<Response>((resolve, reject) => {
                    xhr.onload = () => resolve(new Response(xhr.response));
                    xhr.onerror = () => reject(new Error('Upload failed'));
                    xhr.open('POST', `${API_URL}/audio-tools/extract-from-video`);
                    xhr.responseType = 'blob';
                    xhr.send(formData);
                });

                if (!response.ok) throw new Error('Extraction failed');
                extractedBlob = await response.blob();
            } else {
                extractedBlob = uploadedFile;
                setUploadProgress(100);
            }

            const audioUrl = window.URL.createObjectURL(extractedBlob);
            setExtractedAudioUrl(audioUrl);

        } catch (err: any) {
            setError(err.message || "Extraction failed");
            setUploadProgress(0);
        } finally {
            setProcessing(false);
        }
    };

    const handlePresetClick = (preset: string) => {
        setSelectedPreset(preset);
        // Preset logic could setup defaults here if needed
    };

    const clearPreset = () => {
        setSelectedPreset(null);
    };

    const handleDownload = async () => {
        if (!extractedAudioUrl) return;
        setProcessing(true);
        setError(null);
        setStatusMessage("Uploading configuration...");

        try {
            const response = await fetch(extractedAudioUrl);
            const blob = await response.blob();

            const effectFormData = new FormData();
            effectFormData.append("file", blob, "input.mp3");

            // Convert UI State to Backend API format
            // Backend expects 0-100 for some values, so we map booleans to 100/0
            const backendEffects = {
                noise_reduction: effects.noise_reduction ? 100 : 0,
                fix_echo: effects.fix_echo ? 100 : 0,
                enhance_voice: effects.enhance_voice ? 100 : 0,
                breath_removal: effects.breath_removal ? 100 : 0,
                advanced_noise_reduction: effects.advanced_noise_reduction ? 100 : 0,
                hum_removal: effects.hum_removal ? 100 : 0,
                denoise_ultra: effects.denoise_ultra, // boolean stays boolean in backend? Check backend. 
                // Backend checks: if effects.get("denoise_ultra", False) -> boolean is fine.
                // But others divide by 100.

                volume: effects.volume, // Pass dB directly
                clarity: effects.clarity, // Pass 0-100 directly
            };

            const effectsToSend = selectedPreset
                ? { preset: selectedPreset, ...backendEffects }
                : backendEffects;

            effectFormData.append("effects", JSON.stringify(effectsToSend));
            effectFormData.append("preview", "false");

            const res = await fetch(`${API_URL}/audio-tools/process-audio`, {
                method: "POST",
                body: effectFormData
            });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();

            // Start Polling
            setTaskId(data.task_id);
            setQueuePosition(data.queue_position);
            setEstimatedWait(data.estimated_wait_seconds);
            setStatusMessage(data.message || "Queued...");

        } catch (err: any) {
            setError(err.message || "Processing failed");
            setProcessing(false);
        }
    };

    const togglePlay = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
            // Resume context if suspended (browser autoplay policy)
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
        }
    };

    const toggleEffect = (key: keyof EffectState) => {
        setEffects(prev => ({ ...prev, [key]: !prev[key as any] }));
    };

    const updateSlider = (key: keyof EffectState, value: number) => {
        setEffects(prev => ({ ...prev, [key]: value }));
    };

    const presets = [
        { id: 'podcast', label: 'Podcast', icon: Podcast, gradient: 'from-purple-500 to-pink-500' },
        { id: 'cave', label: 'Cave', icon: Mountain, gradient: 'from-teal-500 to-cyan-500' },
        { id: 'radio', label: 'Radio', icon: Radio, gradient: 'from-orange-500 to-red-500' },
        { id: 'phone', label: 'Phone', icon: Phone, gradient: 'from-blue-500 to-indigo-500' },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20">
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Input */}
                <div className="lg:col-span-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 h-fit">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="text-rose-400" /> Upload Audio
                    </h3>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all min-h-[200px] ${isDragActive ? "border-rose-400 bg-rose-500/10" : "border-slate-700 hover:border-rose-500/50 hover:bg-slate-800/30"}`}
                    >
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="text-center">
                                <Music size={48} className="text-rose-400 mx-auto mb-4" />
                                <p className="font-bold text-white mb-1 break-all">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button onClick={(e) => { e.stopPropagation(); setFile(null); setExtractedAudioUrl(null); setSelectedPreset(null); }} className="text-red-400 text-sm mt-4 hover:underline">Remove</button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Upload size={48} className="text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-300 font-medium">Drag & drop files</p>
                                <p className="text-slate-500 text-sm mt-2">Video/Audio (Max 700MB, 3 mins)</p>
                            </div>
                        )}
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>{uploadProgress === 100 ? "Processing..." : "Uploading..."}</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${uploadProgress === 100
                                        ? "bg-emerald-500 animate-pulse"
                                        : "bg-gradient-to-r from-rose-500 to-pink-500"
                                        }`}
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Workstation */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {extractedAudioUrl ? (
                        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
                            {/* Waveform */}
                            <div className="mb-6 bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                                <div ref={waveformRef} className="w-full" />
                                <div className="flex justify-center mt-4 gap-4 items-center">
                                    <button
                                        onClick={togglePlay}
                                        className="bg-rose-500 hover:bg-rose-400 text-white p-4 rounded-full shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
                                    >
                                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                    </button>
                                </div>
                            </div>

                            {/* Real-time Adjustments */}
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                    <Activity size={16} /> Real-Time Adjustments (Instant)
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4 bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">

                                    {/* Volume Slider */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                                <Volume2 size={16} /> Volume Gain
                                            </label>
                                            <span className="text-xs font-mono text-rose-400">{effects.volume > 0 ? '+' : ''}{effects.volume} dB</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-10"
                                            max="10"
                                            step="1"
                                            value={effects.volume}
                                            onChange={(e) => updateSlider('volume', parseInt(e.target.value))}
                                            className="w-full accent-rose-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Clarity Slider */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                                <Sliders size={16} /> Clarity / Crispness
                                            </label>
                                            <span className="text-xs font-mono text-violet-400">{effects.clarity}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={effects.clarity}
                                            onChange={(e) => updateSlider('clarity', parseInt(e.target.value))}
                                            className="w-full accent-violet-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Heavy Processing (Toggles) */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-400" /> Deep Processing (Applied on Download)
                                </h4>

                                {/* DeNoise Ultra Separate */}
                                <div className="mb-4">
                                    <button
                                        onClick={() => toggleEffect('denoise_ultra')}
                                        disabled={processing}
                                        className={`w-full flex items-center justify-between font-bold py-3 px-5 rounded-xl transition-all duration-200 ${effects.denoise_ultra
                                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white ring-2 ring-violet-400/60 shadow-lg shadow-violet-500/30"
                                            : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-violet-500/50 hover:text-white"
                                            } disabled:opacity-50`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={18} className={effects.denoise_ultra ? "text-yellow-300 fill-yellow-300" : "text-slate-400"} />
                                            <span>DeNoise Ultra (AI)</span>
                                        </div>
                                        {effects.denoise_ultra ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-slate-500" />}
                                    </button>
                                </div>

                                {/* Grid of Toggles */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    <ToggleButton
                                        label="Spectral Denoise"
                                        active={effects.advanced_noise_reduction}
                                        onClick={() => toggleEffect('advanced_noise_reduction')}
                                    />
                                    <ToggleButton
                                        label="Noise Removal"
                                        active={effects.noise_reduction}
                                        onClick={() => toggleEffect('noise_reduction')}
                                    />
                                    <ToggleButton
                                        label="Fix Echo"
                                        active={effects.fix_echo}
                                        onClick={() => toggleEffect('fix_echo')}
                                    />
                                    <ToggleButton
                                        label="Enhance Voice"
                                        active={effects.enhance_voice}
                                        onClick={() => toggleEffect('enhance_voice')}
                                    />
                                    <ToggleButton
                                        label="Breath Removal"
                                        active={effects.breath_removal}
                                        onClick={() => toggleEffect('breath_removal')}
                                    />
                                    <ToggleButton
                                        label="Hum Removal"
                                        active={effects.hum_removal}
                                        onClick={() => toggleEffect('hum_removal')}
                                    />
                                </div>
                            </div>

                            {/* Preset Selection (Optional Overlay) */}
                            <div className="mb-6 opacity-80">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Presets</h4>
                                    {selectedPreset && (
                                        <button onClick={clearPreset} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                                            <X size={14} /> Clear
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {presets.map((preset) => {
                                        const Icon = preset.icon;
                                        const isSelected = selectedPreset === preset.id;
                                        return (
                                            <button
                                                key={preset.id}
                                                onClick={() => handlePresetClick(preset.id)}
                                                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all text-xs ${isSelected
                                                    ? `bg-gradient-to-r ${preset.gradient} text-white`
                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                <Icon size={14} /> {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                disabled={processing}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-80"
                            >
                                {processing ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" />
                                            <span>{statusMessage}</span>
                                        </div>
                                        {estimatedWait && (
                                            <span className="text-xs font-normal opacity-90">
                                                Est. wait: {Math.ceil(estimatedWait / 60)} min
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Download size={20} />
                                        <span>Process & Download Result</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
                            <Music size={64} className="mb-4 opacity-20" />
                            <p>Upload an audio file to start editing</p>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl animate-in fade-in">
                    {error}
                </div>
            )}
        </div>
    );
}

function ToggleButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${active
                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-100"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                }`}
        >
            <span className="text-sm font-medium">{label}</span>
            {active ? <ToggleRight size={20} className="text-indigo-400" /> : <ToggleLeft size={20} />}
        </button>
    );
}
