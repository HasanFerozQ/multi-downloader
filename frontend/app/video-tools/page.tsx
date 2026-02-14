"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ToolSidebar from './components/ToolSidebar';

// Dynamic imports for tools
const WelcomeTool = dynamic(() => import('./tools/WelcomeTool'), { ssr: false });
const TrimTool = dynamic(() => import('./tools/TrimTool'), { ssr: false });
const ResizeTool = dynamic(() => import('./tools/ResizeTool'), { ssr: false });
const ConvertTool = dynamic(() => import('./tools/ConvertTool'), { ssr: false });
const AudioExtractTool = dynamic(() => import('./tools/AudioExtractTool'), { ssr: false });

export default function VideoToolsPage() {
    const [activeTool, setActiveTool] = useState('welcome');
    const [processing, setProcessing] = useState(false);

    const handleProcess = async (file: File, params: any) => {
        setProcessing(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('params', JSON.stringify(params));

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            let endpoint = '';
            switch (activeTool) {
                case 'trim':
                    endpoint = '/video-tools/trim';
                    break;
                case 'resize':
                    endpoint = '/video-tools/resize';
                    break;
                case 'convert':
                    endpoint = '/video-tools/convert';
                    break;
                case 'audio':
                    endpoint = '/video-tools/extract-audio';
                    break;
                default:
                    throw new Error('Unknown tool');
            }

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Processing failed');
            }

            const result = await response.json();

            // Handle download
            if (result.download_url) {
                window.open(result.download_url, '_blank');
            }

            alert('✅ Video processed successfully!');
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ✂️ Video Tools
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400">
                        All-in-one video editor - Trim, resize, convert, and more!
                    </p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
                    {/* Sidebar */}
                    <ToolSidebar activeTool={activeTool} onToolChange={setActiveTool} />

                    {/* Main Content */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 min-h-[600px]">
                        {activeTool === 'welcome' && <WelcomeTool />}
                        {activeTool === 'trim' && <TrimTool onProcess={handleProcess} />}
                        {activeTool === 'resize' && <ResizeTool onProcess={handleProcess} />}
                        {activeTool === 'convert' && <ConvertTool onProcess={handleProcess} />}
                        {activeTool === 'audio' && <AudioExtractTool onProcess={handleProcess} />}
                    </div>
                </div>
            </div>
        </main>
    );
}
