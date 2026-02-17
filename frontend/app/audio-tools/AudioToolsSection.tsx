"use client";

import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, Loader2, Mic, Music, Volume2, Wind, Sparkles, Activity, Play, Pause, Radio, Phone, Podcast, Mountain, X } from "lucide-react";
import { API_URL } from "@/config/api";
import WaveSurfer from 'wavesurfer.js';

type EffectState = {
    noise_reduction: number;
    fix_echo: number;
    enhance_voice: number;
    breath_removal: number;
    volume: number;
    advanced_noise_reduction: number;
    hum_removal: number;
};

const MAX_FILE_SIZE = 700 * 1024 * 1024; // 700MB

export default function AudioToolsSection() {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const [effects, setEffects] = useState<EffectState>({
        noise_reduction: 0,
        fix_echo: 0,
        enhance_voice: 0,
        breath_removal: 0,
        volume: 0,
        advanced_noise_reduction: 0,
        hum_removal: 0
    });

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
            });

            wavesurfer.current.load(extractedAudioUrl);

            // Hide upload progress once waveform is ready
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

            // Keep progress at 100 until waveform loads
            // The waveform useEffect will handle hiding the progress

        } catch (err: any) {
            setError(err.message || "Extraction failed");
            setUploadProgress(0);
        } finally {
            setProcessing(false);
        }
    };

    const handlePresetClick = (preset: string) => {
        setSelectedPreset(preset);
        // Don't auto-download, just set the preset as active
    };

    const clearPreset = () => {
        setSelectedPreset(null);
    };

    const handleDownload = async () => {
        if (!extractedAudioUrl) return;
        setProcessing(true);
        setError(null);

        try {
            const response = await fetch(extractedAudioUrl);
            const blob = await response.blob();

            const effectFormData = new FormData();
            effectFormData.append("file", blob, "input.mp3");

            const effectsToSend = selectedPreset
                ? { preset: selectedPreset, ...effects }
                : effects;

            console.log('[DEBUG] Sending effects to backend:', effectsToSend);
            console.log('[DEBUG] Selected preset:', selectedPreset);
            console.log('[DEBUG] Manual effects:', effects);

            effectFormData.append("effects", JSON.stringify(effectsToSend));
            effectFormData.append("preview", "false");

            const res = await fetch(`${API_URL}/audio-tools/process-audio`, {
                method: "POST",
                body: effectFormData
            });

            if (!res.ok) throw new Error(await res.text());

            const processedBlob = await res.blob();
            const processedUrl = window.URL.createObjectURL(processedBlob);

            const a = document.createElement('a');
            a.href = processedUrl;
            a.download = selectedPreset ? `${selectedPreset}_audio.mp3` : "processed_audio.mp3";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (err: any) {
            setError(err.message || "Processing failed");
        } finally {
            setProcessing(false);
        }
    };

    const togglePlay = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const updateEffect = (key: keyof EffectState, value: number) => {
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
                                <p className="text-slate-500 text-sm mt-2">Video or Audio (Max 700MB)</p>
                            </div>
                        )}
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full transition-all duration-300"
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
                                <div className="flex justify-center mt-4">
                                    <button
                                        onClick={togglePlay}
                                        className="bg-rose-500 hover:bg-rose-400 text-white p-4 rounded-full shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
                                    >
                                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                    </button>
                                </div>
                            </div>

                            {/* Preset Selection */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-slate-300">One-Click Presets</h4>
                                    {selectedPreset && (
                                        <button onClick={clearPreset} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                                            <X size={14} /> Clear Preset
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {presets.map((preset) => {
                                        const Icon = preset.icon;
                                        const isSelected = selectedPreset === preset.id;
                                        const isDisabled = selectedPreset && selectedPreset !== preset.id;

                                        return (
                                            <button
                                                key={preset.id}
                                                onClick={() => handlePresetClick(preset.id)}
                                                disabled={isDisabled || processing}
                                                className={`flex items-center gap-2 font-bold py-3 px-4 rounded-xl transition-all ${isSelected
                                                    ? `bg-gradient-to-r ${preset.gradient} text-white ring-2 ring-white/50`
                                                    : isDisabled
                                                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                                        : `bg-gradient-to-r ${preset.gradient} hover:opacity-80 text-white`
                                                    } disabled:opacity-50`}
                                            >
                                                <Icon size={18} /> {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Manual Effects */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-300 mb-3">
                                    Manual Effects {selectedPreset && <span className="text-xs text-slate-500">(Combined with {selectedPreset})</span>}
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                    <EffectControl label="Noise Removal" icon={Volume2} value={effects.noise_reduction} onChange={(v) => updateEffect('noise_reduction', v)} />
                                    <EffectControl label="Fix Echo / Reverb" icon={Activity} value={effects.fix_echo} onChange={(v) => updateEffect('fix_echo', v)} />
                                    <EffectControl label="Enhance Voice" icon={Mic} value={effects.enhance_voice} onChange={(v) => updateEffect('enhance_voice', v)} />
                                    <EffectControl label="Breath Removal" icon={Wind} value={effects.breath_removal} onChange={(v) => updateEffect('breath_removal', v)} />
                                    <EffectControl label="Adv. Noise Reduction" icon={Sparkles} value={effects.advanced_noise_reduction} onChange={(v) => updateEffect('advanced_noise_reduction', v)} />
                                    <EffectControl label="Hum / Buzz Removal" icon={Activity} value={effects.hum_removal} onChange={(v) => updateEffect('hum_removal', v)} />
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                            <Music size={16} /> Volume Gain
                                        </label>
                                        <span className="text-xs font-mono text-rose-400">{effects.volume > 0 ? '+' : ''}{effects.volume} dB</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-10"
                                        max="10"
                                        step="1"
                                        value={effects.volume}
                                        onChange={(e) => updateEffect('volume', parseInt(e.target.value))}
                                        className="w-full accent-rose-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                disabled={processing}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {processing ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                                Download Result
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

function EffectControl({ label, icon: Icon, value, onChange }: { label: string, icon: any, value: number, onChange: (v: number) => void }) {
    return (
        <div className={`p-4 rounded-xl border transition-all ${value > 0 ? "bg-rose-500/10 border-rose-500/50" : "bg-slate-800/50 border-slate-700"}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${value > 0 ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                        <Icon size={18} />
                    </div>
                    <span className={`font-bold text-sm ${value > 0 ? "text-white" : "text-slate-300"}`}>{label}</span>
                </div>
                <span className="text-xs font-mono text-slate-500">{value}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full accent-rose-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );
}
