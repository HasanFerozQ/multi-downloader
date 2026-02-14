"use client";

import { useState } from 'react';
import VideoUploader from '../components/VideoUploader';
import { Maximize2, Loader2 } from 'lucide-react';

interface Platform {
    id: string;
    name: string;
    icon: string;
    width: number;
    height: number;
    ratio: string;
}

const PLATFORMS: Platform[] = [
    { id: 'tiktok', name: 'TikTok', icon: '📱', width: 1080, height: 1920, ratio: '9:16 Vertical' },
    { id: 'reels', name: 'Instagram Reels', icon: '📸', width: 1080, height: 1920, ratio: '9:16 Vertical' },
    { id: 'youtube', name: 'YouTube', icon: '📺', width: 1920, height: 1080, ratio: '16:9 Horizontal' },
    { id: 'shorts', name: 'YouTube Shorts', icon: '🩳', width: 1080, height: 1920, ratio: '9:16 Vertical' },
    { id: 'ig-post', name: 'Instagram Post', icon: '📷', width: 1080, height: 1080, ratio: '1:1 Square' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', width: 1280, height: 720, ratio: '16:9 Horizontal' },
];

interface ResizeToolProps {
    onProcess: (file: File, params: any) => Promise<void>;
}

export default function ResizeTool({ onProcess }: ResizeToolProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'reels', 'youtube']);
    const [cropStyle, setCropStyle] = useState('center');
    const [processing, setProcessing] = useState(false);

    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(id => id !== platformId)
                : [...prev, platformId]
        );
    };

    const handleProcess = async () => {
        if (!videoFile || selectedPlatforms.length === 0) return;

        setProcessing(true);
        try {
            await onProcess(videoFile, { platforms: selectedPlatforms, cropStyle });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-3">
                <Maximize2 className="text-indigo-600" size={32} />
                Resize for Social Media
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                Convert your video to perfect sizes for all platforms at once
            </p>

            <VideoUploader onFileSelect={setVideoFile} />

            {videoFile && (
                <>
                    <div className="mb-8">
                        <label className="block text-sm font-bold mb-4 text-slate-700 dark:text-slate-300">
                            Select Platforms (you'll get all sizes in one click)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {PLATFORMS.map(platform => (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`
                    p-5 rounded-xl border-2 transition-all text-center
                    ${selectedPlatforms.includes(platform.id)
                                            ? 'border-indigo-600 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:scale-105'
                                        }
                  `}
                                >
                                    <div className="text-3xl mb-2">{platform.icon}</div>
                                    <div className="font-bold text-sm mb-1">{platform.name}</div>
                                    <div className={`text-xs ${selectedPlatforms.includes(platform.id) ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {platform.width} × {platform.height}<br />
                                        {platform.ratio}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">
                            Crop Style
                        </label>
                        <select
                            value={cropStyle}
                            onChange={(e) => setCropStyle(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        >
                            <option value="center">Center Crop (Default)</option>
                            <option value="top">Top Crop (Keep top portion)</option>
                            <option value="bottom">Bottom Crop (Keep bottom portion)</option>
                            <option value="fit">Scale to Fit (Add black bars)</option>
                        </select>
                    </div>

                    {selectedPlatforms.length > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 mb-6">
                            <p className="text-emerald-800 dark:text-emerald-200 text-sm">
                                <strong>Selected:</strong> {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} •
                                You'll receive {selectedPlatforms.length} optimized video{selectedPlatforms.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleProcess}
                        disabled={processing || !videoFile || selectedPlatforms.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Converting to All Platforms...
                            </>
                        ) : (
                            <>
                                <Maximize2 size={24} />
                                Convert to All Platforms
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    );
}
