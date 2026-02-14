"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, FileImage, FileText, X, Download, Loader2 } from "lucide-react";

interface ConvertorProps {
    type: 'image' | 'audio' | 'document';
}

export default function ConvertorSection() {
    const [activeTab, setActiveTab] = useState<'image' | 'audio' | 'document'>('image');

    return (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Tabs */}
            <div className="flex justify-center mb-8 gap-4 flex-wrap">
                {[
                    { id: 'image', label: 'Image Converter', icon: FileImage },
                    { id: 'audio', label: 'Audio Converter', icon: FileAudio },
                    { id: 'document', label: 'File Converter', icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === tab.id
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-105"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-slate-900/50 border border-indigo-500/30 rounded-2xl p-6 min-h-[400px]">
                <ConvertorInterface type={activeTab} key={activeTab} />
            </div>
        </div>
    );
}

function ConvertorInterface({ type }: ConvertorProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [targetFormat, setTargetFormat] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [downloadName, setDownloadName] = useState<string>("");

    // Configuration based on type
    const config = {
        image: {
            accept: { 'image/*': [] },
            formats: ['JPG', 'PNG', 'WEBP', 'GIF', 'BMP', 'ICO', 'PDF'],
            maxFiles: 10,
            endpoint: '/convert/image'
        },
        audio: {
            accept: { 'audio/*': [] },
            formats: ['MP3', 'WAV', 'AAC', 'FLAC', 'OGG', 'M4A'],
            maxFiles: 3,
            endpoint: '/convert/audio'
        },
        document: {
            accept: {
                'application/pdf': ['.pdf'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.ms-powerpoint': ['.ppt'],
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
            },
            formats: ['PDF', 'DOCX'],
            maxFiles: 5,
            endpoint: '/convert/document'
        }
    }[type];

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (files.length + acceptedFiles.length > config.maxFiles) {
            setError(`Maximum ${config.maxFiles} files allowed.`);
            return;
        }
        setFiles(prev => [...prev, ...acceptedFiles]);
        setError(null);
        setDownloadUrl(null);
    }, [files, config.maxFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: config.accept as any
    });

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        if (!targetFormat) {
            setError("Please select a target format.");
            return;
        }

        setUploading(true);
        setError(null);
        setDownloadUrl(null);

        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        formData.append('target_format', targetFormat.toLowerCase());

        try {
            const res = await fetch(`http://localhost:8000${config.endpoint}`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Conversion failed");
            }

            // Get filename from header if possible, or fallback
            const disposition = res.headers.get('content-disposition');
            let filename = `converted_files.zip`;
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            setDownloadName(filename);

            // Create blob URL for download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            setDownloadUrl(url);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-10 cursor-pointer transition-all ${isDragActive ? "border-indigo-400 bg-indigo-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/30"
                    }`}
            >
                <input {...getInputProps()} />
                <Upload size={48} className={`mb-4 ${isDragActive ? "text-indigo-400" : "text-slate-500"}`} />
                <p className="text-lg font-medium text-slate-300">
                    {isDragActive ? "Drop files here..." : `Drag & drop ${type} files here`}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    or click to select (Max {config.maxFiles})
                </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <span className="text-sm text-slate-300 truncate max-w-[200px]">{f.name}</span>
                            <span className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                            <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-slate-500 hover:text-red-400 px-2">
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-4 items-center flex-wrap">
                <select
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value)}
                    className="flex-1 min-w-[150px] bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-indigo-500"
                >
                    <option value="">Select Target Format</option>
                    {config.formats.map(fmt => (
                        <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                </select>

                <button
                    onClick={handleConvert}
                    disabled={files.length === 0 || uploading}
                    className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 min-w-[160px] justify-center transition-all ${files.length > 0 && !uploading
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-700 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {uploading ? <Loader2 className="animate-spin" /> : "Convert Now"}
                </button>
            </div>

            {/* Result & Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg text-sm text-center animate-in fade-in">
                    {error}
                </div>
            )}

            {downloadUrl && (
                <a
                    href={downloadUrl}
                    download={downloadName}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl flex items-center justify-center gap-3 font-bold animate-in fade-in slide-in-from-bottom-2 shadow-lg shadow-emerald-600/20"
                >
                    <Download size={20} />
                    Download Converted Files
                </a>
            )}
        </div>
    );
}
