"use client";

import { useState } from 'react';
import VideoUploader from '../components/VideoUploader';
import { Music, Loader2 } from 'lucide-react';

interface AudioFormat {
    id: string;
    name: string;
    icon: string;
    description: string;
}

const AUDIO_FORMATS: AudioFormat[] = [
    { id: 'mp3', name: 'MP3', icon: '🎵', description: 'Most compatible' },
    { id: 'wav', name: 'WAV', icon: '🎶', description: 'Lossless quality' },
    { id: 'aac', name: 'AAC', icon: '🎧', description: 'High quality, small' },
    { id: 'flac', name: 'FLAC', icon: '💿', description: 'Lossless compression' },
];

interface AudioExtractToolProps {
    onProcess: (file: File, params: any) => Promise<void>;
}

export default function AudioExtractTool({ onProcess }: AudioExtractToolProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [audioFormat, setAudioFormat] = useState('mp3');
    const [bitrate, setBitrate] = useState('320');
    const [processing, setProcessing] = useState(false);

    const handleProcess = async () => {
        if (!videoFile) return;

        setProcessing(true);
        try {
            await onProcess(videoFile, { audioFormat, bitrate });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-3">
                <Music className="text-indigo-600" size={32} />
                Extract Audio
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                Extract audio from video and save as MP3, WAV, or other formats
            </p>

            <VideoUploader onFileSelect={setVideoFile} />

            {videoFile && (
                <>
                    <div className="mb-8">
                        <label className="block text-sm font-bold mb-4 text-slate-700 dark:text-slate-300">
                            Audio Format
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {AUDIO_FORMATS.map(format => (
                                <button
                                    key={format.id}
                                    onClick={() => setAudioFormat(format.id)}
                                    className={`
                    p-6 rounded-xl border-2 transition-all text-center
                    ${audioFormat === format.id
                                            ? 'border-indigo-600 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:scale-105'
                                        }
                  `}
                                >
                                    <div className="text-4xl mb-3">{format.icon}</div>
                                    <div className="font-bold mb-1">{format.name}</div>
                                    <div className={`text-xs ${audioFormat === format.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {format.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">
                            Audio Quality (Bitrate)
                        </label>
                        <select
                            value={bitrate}
                            onChange={(e) => setBitrate(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        >
                            <option value="320">320 kbps (High)</option>
                            <option value="256">256 kbps (Good)</option>
                            <option value="192">192 kbps (Standard)</option>
                            <option value="128">128 kbps (Low)</option>
                        </select>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-xl p-4 mb-6">
                        <p className="text-purple-800 dark:text-purple-200 text-sm">
                            <strong>Output:</strong> {audioFormat.toUpperCase()} • {bitrate} kbps • Audio only
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
                                Extracting Audio...
                            </>
                        ) : (
                            <>
                                <Music size={24} />
                                Extract Audio
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    );
}
