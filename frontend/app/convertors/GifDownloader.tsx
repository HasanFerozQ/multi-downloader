"use client";

import { useState } from "react";
import { Download, Globe, Link as LinkIcon, Loader2, Image as ImageIcon } from "lucide-react";

export default function GifDownloader() {
    const [mode, setMode] = useState<'direct' | 'extract'>('direct');
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [downloadReady, setDownloadReady] = useState<string | null>(null);

    const handleAction = async () => {
        if (!url) {
            setError("Please enter a URL.");
            return;
        }

        setLoading(true);
        setError(null);
        setPreviewUrls([]);
        setDownloadReady(null);

        try {
            if (mode === 'direct') {
                // Validate generic GIF URL
                const response = await fetch(`http://localhost:8000/gif/validate?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                
                if (data.valid) {
                    setPreviewUrls([url]);
                    setDownloadReady(url);
                } else {
                    setError("Invalid GIF URL. Please check the link.");
                }

            } else {
                // Extract GIFs from page
                const response = await fetch(`http://localhost:8000/gif/extract-page?url=${encodeURIComponent(url)}`);
                if (!response.ok) {
                     const err = await response.json();
                     throw new Error(err.detail || "Failed to extract");
                }
                const data = await response.json();
                if (data.gifs && data.gifs.length > 0) {
                    setPreviewUrls(data.gifs);
                } else {
                    setError("No GIFs found on this page.");
                }
            }
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleDownload = async (gifUrl: string) => {
        try {
            // Trigger download
             const response = await fetch(gifUrl);
             const blob = await response.blob();
             const blobUrl = window.URL.createObjectURL(blob);
             
             const a = document.createElement('a');
             a.href = blobUrl;
             a.download = gifUrl.split('/').pop() || 'download.gif';
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             window.URL.revokeObjectURL(blobUrl);

        } catch (e) {
            window.open(gifUrl, '_blank');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header / Mode Toggle */}
            <div className="flex flex-col items-center gap-4">
                 <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Free Online GIF Downloader
                </h2>
                <p className="text-slate-400 text-sm">Instantly download any GIF, No Login/Signup required</p>

                <div className="flex bg-slate-800 p-1 rounded-lg mt-4 border border-slate-700">
                    <button
                        onClick={() => setMode('direct')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${
                            mode === 'direct' 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <LinkIcon size={16} />
                        Direct GIF URL
                    </button>
                    <button
                        onClick={() => setMode('extract')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${
                            mode === 'extract' 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Globe size={16} />
                        Webpage Extract
                    </button>
                </div>
            </div>

            {/* Input Area */}
            <div className="flex gap-4 items-center">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={mode === 'direct' ? "https://example.com/direct/link.gif" : "https://giphy.com/search/dogs"}
                    className="flex-1 bg-white text-slate-800 placeholder:text-slate-400 rounded-lg p-4 outline-none border border-slate-200 focus:border-indigo-500 transition-all font-medium"
                />
                <button
                    onClick={handleAction}
                    disabled={loading}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                    {mode === 'direct' ? 'Download GIF' : 'Extract GIFs'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                    {error}
                </div>
            )}

            {/* Live Preview Area */}
            <div className="bg-white rounded-2xl p-6 min-h-[300px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-900 font-bold mb-4">
                    <ImageIcon size={20} className="text-orange-500" />
                    Live Preview
                </div>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 min-h-[200px] flex flex-wrap gap-4 items-center justify-center">
                    {loading ? (
                         <div className="flex flex-col items-center text-slate-400 gap-2">
                            <Loader2 size={40} className="animate-spin text-indigo-400" />
                            <p>Processing...</p>
                        </div>
                    ) : previewUrls.length > 0 ? (
                        previewUrls.map((gif, idx) => (
                             <div key={idx} className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-white border border-slate-100">
                                <img src={gif} alt={`GIF Preview ${idx}`} className="max-h-[300px] object-contain" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform flex justify-center">
                                     <button 
                                        onClick={() => handleDownload(gif)}
                                        className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-50"
                                     >
                                        <Download size={14} /> Download
                                     </button>
                                </div>
                             </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center text-slate-400 gap-2">
                             <div className="bg-slate-200 p-4 rounded-full">
                                <ImageIcon size={32} className="text-slate-400" />
                             </div>
                             <p>Paste a link above to see results</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
