"use client";
import type { Metadata } from "next";
import { useState } from "react";
import Navbar from "@/components/Navbar";

// Note: metadata export doesn't work in client components
// Metadata is handled in layout.tsx for this page

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setVideoData(null);

    try {
      const res = await fetch(`http://localhost:8000/analyze?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setVideoData(data);
        // Auto-select best quality (usually last format before MP3)
        const bestFormat = data.formats[data.formats.length - 2] || data.formats[0];
        setSelectedFormat(bestFormat?.id || "");
      }
    } catch (err) {
      setError("Backend connection failed! Make sure the server is running on port 8000.");
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!selectedFormat) {
      setError("Please select a quality");
      return;
    }

    setDownloading(true);
    setProgress(0);
    setStatus("Starting download...");
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/download/start?url=${encodeURIComponent(url)}&format_id=${selectedFormat}`
      );
      const data = await res.json();

      if (!data.task_id) {
        setError("Failed to start download");
        setDownloading(false);
        return;
      }

      const { task_id } = data;

      // Connect to WebSocket for real-time progress
      const ws = new WebSocket(`ws://localhost:8000/ws/progress/${task_id}`);

      ws.onopen = () => {
        setStatus("Connected");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.progress !== undefined) {
          setProgress(Math.round(data.progress));
        }

        if (data.status) {
          setStatus(data.status);
        }

        if (data.status === "Finished") {
          ws.close();
          setStatus("Download complete! Saving file...");

          const downloadUrl = `http://localhost:8000/download/file/${task_id}?title=${encodeURIComponent(videoData.title)}`;

          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = '';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => {
            setDownloading(false);
            setProgress(0);
            setStatus("Ready for next download");
          }, 2000);
        }

        if (data.status === "Error") {
          ws.close();
          setError("Download failed: " + (data.message || "Unknown error"));
          setDownloading(false);
          setProgress(0);
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection failed");
        setDownloading(false);
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };

    } catch (err) {
      setError("Download request failed! Make sure backend is running.");
      setDownloading(false);
    }
  };

  const formatFileSize = (mb: number) => {
    if (mb >= 1000) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto pt-24 px-4 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
            Multi-Platform Downloader
          </h1>
          <p className="text-gray-400 text-lg">
            Download from YouTube, Facebook, Instagram, TikTok, and X
          </p>
        </div>

        {/* URL Input Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="🔎 Paste your video link here..."
              className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : "🔍 Analyze"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Video Info & Download Section */}
        {videoData && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-fade-in">
            {/* Video Preview */}
            <div className="flex flex-col md:flex-row gap-6 p-6">
              <div className="md:w-80 flex-shrink-0">
                <img
                  src={videoData.thumbnail}
                  className="w-full rounded-xl shadow-lg border border-gray-600"
                  alt="Video Thumbnail"
                />
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>👤 Uploader:</span>
                    <span className="text-white">{videoData.uploader}</span>
                  </div>
                  {videoData.duration && (
                    <div className="flex justify-between">
                      <span>⏱️ Duration:</span>
                      <span className="text-white">{Math.floor(videoData.duration / 60)}:{(videoData.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}
                  {videoData.views && (
                    <div className="flex justify-between">
                      <span>👁️ Views:</span>
                      <span className="text-white">{videoData.views.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  {videoData.title}
                </h2>

                {videoData.description && (
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                    {videoData.description}
                  </p>
                )}

                {/* Quality Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-300">
                    📹 Select Quality:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {videoData.formats.map((f: any) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFormat(f.id)}
                        disabled={downloading}
                        className={`relative p-3 rounded-lg border-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${selectedFormat === f.id
                            ? f.id === "mp3"
                              ? "bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50"
                              : "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/50"
                            : "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
                          }`}
                      >
                        <div className="font-bold text-sm">
                          {f.quality}
                        </div>
                        {f.size_mb && (
                          <div className="text-xs text-gray-300 mt-1">
                            {formatFileSize(f.size_mb)}
                          </div>
                        )}
                        {selectedFormat === f.id && (
                          <div className="absolute top-1 right-1 text-xs">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Download Progress or Button */}
                {downloading ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{status}</span>
                      <span className="font-bold text-blue-400">{progress}%</span>
                    </div>

                    <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Downloading...</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormat}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    ⬇️ Download Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {!videoData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">Download videos in seconds with optimized processing</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-bold mb-2">Multiple Qualities</h3>
              <p className="text-gray-400 text-sm">Choose from 144p to 4K or extract audio only</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold mb-2">Safe & Private</h3>
              <p className="text-gray-400 text-sm">No data collection, downloads are deleted after 30 minutes</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}
