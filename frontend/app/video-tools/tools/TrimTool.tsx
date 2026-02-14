"use client";

import { useState } from 'react';
import VideoUploader from '../components/VideoUploader';
import VideoPreview from '../components/VideoPreview';
import { Scissors, Loader2 } from 'lucide-react';

interface TrimToolProps {
    onProcess: (file: File, params: any) => Promise<void>;
}

export default function TrimTool({ onProcess }: TrimToolProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(10);
    const [currentTime, setCurrentTime] = useState(0);
    const [processing, setProcessing] = useState(false);

    const handleProcess = async () => {
        if (!videoFile) return;

        setProcessing(true);
        try {
            await onProcess(videoFile, { startTime, endTime });
        } finally {
            setProcessing(false);
        }
    };

    const markStart = () => {
        setStartTime(Math.floor(currentTime));
    };

    const markEnd = () => {
        setEndTime(Math.floor(currentTime));
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-3">
                <Scissors className="text-indigo-600" size={32} />
                Trim Video
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                Cut your video to the perfect length by selecting start and end times
            </p>

            <VideoUploader onFileSelect={setVideoFile} />

            {videoFile && (
                <>
                    <VideoPreview
                        videoFile={videoFile}
                        onTimeUpdate={setCurrentTime}
                        showTimeline={true}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                            <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">
                                Start Time (seconds)
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    value={startTime}
                                    onChange={(e) => setStartTime(parseFloat(e.target.value))}
                                    min="0"
                                    className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                />
                                <button
                                    onClick={markStart}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Mark Start
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                            <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">
                                End Time (seconds)
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    value={endTime}
                                    onChange={(e) => setEndTime(parseFloat(e.target.value))}
                                    min="0"
                                    className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                />
                                <button
                                    onClick={markEnd}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Mark End
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 mb-6">
                        <p className="text-amber-800 dark:text-amber-200 text-sm">
                            <strong>Preview:</strong> Your video will be trimmed from {startTime}s to {endTime}s (Duration: {endTime - startTime}s)
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
                                Trimming Video...
                            </>
                        ) : (
                            <>
                                <Scissors size={24} />
                                Trim Video
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    );
}
