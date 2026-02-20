"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
    Image as ImageIcon,
    Video,
    Upload,
    Download,
    Loader2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ArrowDown,
    Zap,
} from "lucide-react";
import DoNotRefresh from "../components/DoNotRefresh";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

type TabId = "image" | "video";

interface UploadedFile {
    file: File;
    id: string;
}

interface CompressionResult {
    originalSize: number;
    compressedSize: number;
    compressedUrl: string;
    filename: string;
}

// ── Tab Config ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: typeof ImageIcon; desc: string; accept: Record<string, string[]>; maxFiles: number; maxSizePerFile: number; maxCombinedSize: number }[] = [
    {
        id: "image",
        label: "Image",
        icon: ImageIcon,
        desc: "Compress JPG, PNG, WebP, GIF, BMP — batch up to 10 files (100 MB total)",
        accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"] },
        maxFiles: 10,
        maxSizePerFile: 100 * 1024 * 1024,
        maxCombinedSize: 100 * 1024 * 1024,
    },
    {
        id: "video",
        label: "Video",
        icon: Video,
        desc: "Compress MP4, MOV, AVI, MKV — up to 5 files (500 MB total)",
        accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
        maxFiles: 5,
        maxSizePerFile: 500 * 1024 * 1024,
        maxCombinedSize: 500 * 1024 * 1024,
    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
}

function uid(): string {
    return Math.random().toString(36).slice(2, 10);
}

function savingsPercent(original: number, compressed: number): string {
    if (original === 0) return "0";
    return ((1 - compressed / original) * 100).toFixed(1);
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CompressorPage() {
    const [activeTab, setActiveTab] = useState<TabId>("image");
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [compressing, setCompressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("");
    const [result, setResult] = useState<CompressionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const progressTimer = useRef<NodeJS.Timeout | null>(null);
    const autoDownloaded = useRef(false);

    const tabConfig = TABS.find((t) => t.id === activeTab)!;

    // Compute combined size of current files
    const combinedSize = files.reduce((sum, f) => sum + f.file.size, 0);

    const onDrop = useCallback(
        (accepted: File[]) => {
            setError(null);
            setResult(null);
            autoDownloaded.current = false;

            if (accepted.length === 0) return;

            const maxFiles = tabConfig.maxFiles;
            const toAdd = accepted.slice(0, maxFiles - files.length);
            if (toAdd.length === 0) {
                setError(`Maximum ${maxFiles} file(s) allowed`);
                return;
            }

            // Per-file size check
            for (const f of toAdd) {
                if (f.size > tabConfig.maxSizePerFile) {
                    setError(`"${f.name}" is too large (${fmtSize(f.size)}). Maximum is ${fmtSize(tabConfig.maxSizePerFile)} per file.`);
                    return;
                }
            }

            // Combined size check
            const currentTotal = files.reduce((sum, f) => sum + f.file.size, 0);
            const newTotal = currentTotal + toAdd.reduce((sum, f) => sum + f.size, 0);
            if (newTotal > tabConfig.maxCombinedSize) {
                setError(`Combined file size (${fmtSize(newTotal)}) exceeds ${fmtSize(tabConfig.maxCombinedSize)} limit.`);
                return;
            }

            setFiles((prev) => [...prev, ...toAdd.map((f) => ({ file: f, id: uid() }))]);
        },
        [files, tabConfig]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: tabConfig.accept,
        maxFiles: tabConfig.maxFiles,
        disabled: compressing,
    });

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setResult(null);
        autoDownloaded.current = false;
    };

    const clearAll = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        autoDownloaded.current = false;
    };

    const switchTab = (tab: TabId) => {
        setActiveTab(tab);
        setFiles([]);
        setResult(null);
        setError(null);
        setProgress(0);
        autoDownloaded.current = false;
    };

    // Simulated progress for responsiveness
    const startProgressSimulation = (isVideo: boolean) => {
        setProgress(0);
        setProgressLabel(isVideo ? "Encoding video..." : "Compressing...");
        let current = 0;
        const maxSimulated = isVideo ? 85 : 90;
        const interval = isVideo ? 800 : 200;

        progressTimer.current = setInterval(() => {
            current += Math.random() * (isVideo ? 3 : 8);
            if (current >= maxSimulated) current = maxSimulated;
            setProgress(Math.round(current));
            if (isVideo && current > 20) setProgressLabel("Encoding video...");
            if (isVideo && current > 60) setProgressLabel("Finalizing...");
        }, interval);
    };

    const stopProgressSimulation = () => {
        if (progressTimer.current) clearInterval(progressTimer.current);
        setProgress(100);
        setProgressLabel("Complete!");
    };

    // Auto-download trigger
    const triggerDownload = (url: string, filename: string) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCompress = async () => {
        if (files.length === 0) return;
        setCompressing(true);
        setError(null);
        setResult(null);
        autoDownloaded.current = false;

        const endpoint = `${API_URL}/compress/${activeTab}`;
        const formData = new FormData();
        const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

        for (const item of files) {
            formData.append("files", item.file);
        }

        startProgressSimulation(activeTab === "video");

        try {
            const res = await fetch(endpoint, { method: "POST", body: formData });

            if (!res.ok) {
                const errText = await res.text();
                let errMsg = "Compression failed";
                try {
                    const errJson = JSON.parse(errText);
                    errMsg = errJson.detail || errJson.message || errMsg;
                } catch {
                    errMsg = errText || errMsg;
                }
                throw new Error(errMsg);
            }

            const blob = await res.blob();
            const compressedSize = blob.size;

            const contentDisposition = res.headers.get("content-disposition");
            let filename: string;

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+?)"?$/);
                filename = match ? match[1] : `compressed_${activeTab}`;
            } else if (files.length === 1) {
                const originalName = files[0].file.name;
                const dotIdx = originalName.lastIndexOf(".");
                const baseName = dotIdx > 0 ? originalName.substring(0, dotIdx) : originalName;
                const ext = dotIdx > 0 ? originalName.substring(dotIdx) : "";
                filename = `${baseName}_Compressed${ext}`;
            } else {
                filename = activeTab === "image" ? "compressed_images.zip" : "compressed_videos.zip";
            }

            stopProgressSimulation();

            const url = URL.createObjectURL(blob);
            setResult({ originalSize: totalSize, compressedSize, compressedUrl: url, filename });

            // Auto-download
            triggerDownload(url, filename);
            autoDownloaded.current = true;
        } catch (err: any) {
            stopProgressSimulation();
            setError(err.message || "Compression failed");
        } finally {
            setCompressing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        triggerDownload(result.compressedUrl, result.filename);
    };

    return (
        <main className="min-h-screen pt-24 px-4 pb-12 bg-slate-950">
            {/* Do Not Refresh Warning */}
            <DoNotRefresh visible={compressing} />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 mb-3">
                        Media Compressor
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Reduce file sizes without losing quality — images and videos.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-slate-900/60 border border-slate-800 rounded-2xl p-1.5 gap-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => switchTab(tab.id)}
                                    disabled={compressing}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 ${isActive
                                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-6 pt-6 pb-0">
                        <p className="text-sm text-slate-500 text-center">{tabConfig.desc}</p>
                    </div>

                    <div className="p-6">
                        {/* Dropzone */}
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-10 cursor-pointer transition-all duration-200 min-h-[180px] ${compressing
                                ? "border-slate-700 opacity-50 cursor-not-allowed"
                                : isDragActive
                                    ? "border-cyan-400 bg-cyan-500/10"
                                    : "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/30"
                                }`}
                        >
                            <input {...getInputProps()} />
                            <Upload size={40} className={`mb-4 ${isDragActive ? "text-cyan-400" : "text-slate-500"}`} />
                            <p className="text-slate-300 font-medium">
                                {isDragActive ? "Drop files here..." : "Drag & drop files, or click to browse"}
                            </p>
                            <p className="text-slate-500 text-xs mt-2">
                                Max {tabConfig.maxFiles} file{tabConfig.maxFiles > 1 ? "s" : ""} · {fmtSize(tabConfig.maxSizePerFile)} each · {fmtSize(tabConfig.maxCombinedSize)} total
                            </p>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="mt-5 space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-slate-300">
                                        {files.length} file{files.length > 1 ? "s" : ""} selected
                                        <span className="text-slate-500 font-normal ml-2">({fmtSize(combinedSize)})</span>
                                    </span>
                                    <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                                        <Trash2 size={12} /> Clear all
                                    </button>
                                </div>
                                {files.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-1.5 bg-slate-700 rounded-md">
                                                {activeTab === "image" ? (
                                                    <ImageIcon size={14} className="text-blue-400" />
                                                ) : (
                                                    <Video size={14} className="text-emerald-400" />
                                                )}
                                            </div>
                                            <span className="text-sm text-slate-300 truncate max-w-[300px]">{item.file.name}</span>
                                            <span className="text-xs text-slate-500 flex-shrink-0">{fmtSize(item.file.size)}</span>
                                        </div>
                                        <button
                                            onClick={() => removeFile(item.id)}
                                            disabled={compressing}
                                            className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50 ml-2"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                {/* Progress Bar */}
                                {compressing && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                            <span className="flex items-center gap-1.5">
                                                <Loader2 size={12} className="animate-spin" />
                                                {progressLabel}
                                            </span>
                                            <span className="font-bold text-cyan-400">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Compress Button */}
                                {!compressing && !result && (
                                    <button
                                        onClick={handleCompress}
                                        disabled={compressing || files.length === 0}
                                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <Zap size={18} />
                                        <span>Compress {files.length > 1 ? `${files.length} Files` : "File"}</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mt-5 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl flex items-start gap-3">
                                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="mt-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-5">
                                    <CheckCircle2 size={20} className="text-emerald-400" />
                                    <span className="font-bold text-emerald-300">Compression Complete!</span>
                                </div>

                                {/* Size Comparison */}
                                <div className="flex items-center justify-center gap-4 mb-5 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Original</p>
                                        <p className="text-xl font-bold text-slate-300">{fmtSize(result.originalSize)}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <ArrowDown size={20} className="text-emerald-400" />
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            -{savingsPercent(result.originalSize, result.compressedSize)}%
                                        </span>
                                    </div>
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Compressed</p>
                                        <p className="text-xl font-bold text-emerald-400">{fmtSize(result.compressedSize)}</p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 text-center mb-4">
                                    Saved {fmtSize(result.originalSize - result.compressedSize)} ({savingsPercent(result.originalSize, result.compressedSize)}% reduction)
                                </p>

                                <button
                                    onClick={handleDownload}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Download size={18} />
                                    Download {result.filename}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                {files.length === 0 && !result && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
                        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl text-center">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Zap size={20} className="text-blue-400" />
                            </div>
                            <h3 className="font-bold text-white mb-1 text-sm">Smart Compression</h3>
                            <p className="text-slate-500 text-xs">Intelligent algorithms reduce file sizes by up to 50% while preserving visual quality</p>
                        </div>
                        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl text-center">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Upload size={20} className="text-emerald-400" />
                            </div>
                            <h3 className="font-bold text-white mb-1 text-sm">Batch Upload</h3>
                            <p className="text-slate-500 text-xs">Compress up to 10 images or 5 videos at once — automatically zipped for download</p>
                        </div>
                        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl text-center">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Download size={20} className="text-purple-400" />
                            </div>
                            <h3 className="font-bold text-white mb-1 text-sm">Auto Download</h3>
                            <p className="text-slate-500 text-xs">Compressed files download automatically — no extra clicks needed</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
