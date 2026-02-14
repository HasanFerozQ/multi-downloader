"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, FileVideo } from 'lucide-react';

interface VideoUploaderProps {
    onFileSelect: (file: File) => void;
    accept?: string;
}

export default function VideoUploader({ onFileSelect, accept = "video/*" }: VideoUploaderProps) {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setUploadedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': [] },
        multiple: false,
        maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    });

    return (
        <div
            {...getRootProps()}
            className={`
        border-4 border-dashed rounded-2xl p-16 text-center cursor-pointer
        transition-all duration-300 mb-8
        ${uploadedFile
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                    : isDragActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-105'
                        : 'border-indigo-300 dark:border-indigo-700 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20'
                }
      `}
        >
            <input {...getInputProps()} />

            {uploadedFile ? (
                <div className="flex flex-col items-center gap-4">
                    <CheckCircle size={64} className="text-emerald-500" />
                    <div>
                        <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2 justify-center">
                            <FileVideo size={24} />
                            {uploadedFile.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <Upload size={64} className="text-indigo-500" />
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                            {isDragActive ? 'Drop your video here!' : 'Click to upload video'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            or drag and drop • Max 2GB
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
