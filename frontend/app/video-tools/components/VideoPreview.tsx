"use client";

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface VideoPreviewProps {
    videoFile: File | null;
    onTimeUpdate?: (currentTime: number) => void;
    showTimeline?: boolean;
}

export default function VideoPreview({ videoFile, onTimeUpdate, showTimeline = true }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [videoUrl, setVideoUrl] = useState<string>('');

    useEffect(() => {
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [videoFile]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            onTimeUpdate?.(time);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const skip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!videoFile) return null;

    return (
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl mb-8">
            <video
                ref={videoRef}
                src={videoUrl}
                className="w-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            {showTimeline && (
                <div className="bg-slate-900 p-4">
                    <div className="flex items-center gap-4 mb-3">
                        <button
                            onClick={() => skip(-5)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                        >
                            <SkipBack size={20} />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>

                        <button
                            onClick={() => skip(5)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                        >
                            <SkipForward size={20} />
                        </button>

                        <div className="flex-1 text-center">
                            <span className="text-white font-mono text-sm">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => {
                            if (videoRef.current) {
                                videoRef.current.currentTime = parseFloat(e.target.value);
                            }
                        }}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>
            )}
        </div>
    );
}
