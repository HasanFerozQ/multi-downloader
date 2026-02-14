"use client";

import { useState } from 'react';
import VideoUploader from '../components/VideoUploader';
import { RefreshCw, Loader2 } from 'lucide-react';

interface ConvertToolProps {
    onProcess: (file: File, params: any) => Promise<void>;
}

export default function ConvertTool({ onProcess }: ConvertToolProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState('mp4');
    const [quality, setQuality] = useState('medium');
    const [resolution, setResolution] = useState('original');
    const [processing, setProcessing] = useState(false);

    const handleProcess = async () => {
        if (!videoFile) return;

        setProcessing(true);
        try {
            await onProcess(videoFile, { outputFormat, quality, resolution });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-3">
                <RefreshCw className="text-indigo-600" size={32} />
                Format Converter
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                Convert your video to any format with custom quality settings
            </p>

            <VideoUploader onFileSelect={setVideoFile} />

            {videoFile && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">
                                Output Format
                            </label>
                            <select
                                value={outputFormat}
                                onChange={(e) => setOutputFormat(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            >
                                <option value="mp4">MP4 (Recommended)</option>
                                <option value="webm">WebM (Web optimized)</option>
                                <option value="avi">AVI (High quality)</option>
                                <option value="mov">MOV (Apple devices)</option>
                                <option value="mkv">MKV (High quality)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">
                                Quality Preset
                            </label>
                            <select
                                value={quality}
                                onChange={(e) => setQuality(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            >
                                <option value="high">High (Large file size)</option>
                                <option value="medium">Medium (Balanced)</option>
                                <option value="low">Low (Small file size)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">
                                Resolution
                            </label>
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            >
                                <option value="original">Keep Original</option>
                                <option value="2160">4K (3840 × 2160)</option>
                                <option value="1080">1080p (1920 × 1080)</option>
                                <option value="720">720p (1280 × 720)</option>
                                <option value="480">480p (854 × 480)</option>
                                <option value="360">360p (640 × 360)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 mb-6">
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                            <strong>Output:</strong> {outputFormat.toUpperCase()} • {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality • {resolution === 'original' ? 'Original' : resolution + 'p'} Resolution
                        </p>
                    </div>

                    <button
                        onClick={handleProcess}
                        disabled={processing || !videoFile}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Converting Video...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={24} />
                                Convert Video
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    );
}
