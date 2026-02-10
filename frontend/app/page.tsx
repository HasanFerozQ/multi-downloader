"use client";
import { useState } from "react";
import axios from "axios";

interface Format {
  id: string;
  quality: string;
  height: number;
  ext: string;
  has_audio: boolean;
}

interface VideoData {
  title: string;
  thumbnail: string;
  duration: number | null;
  formats: Format[];
  original_url: string;
}

const BACKEND = "http://localhost:8000";

function formatDuration(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) { setError("Please paste a link first!"); return; }
    setError("");
    setVideoData(null);
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/analyze`, {
        params: { url: trimmed },
        timeout: 30000,
      });
      setVideoData(res.data);
    } catch (err: any) {
      if (!err.response) {
        setError("Cannot reach backend. Start it with: uvicorn main:app --reload");
      } else {
        setError(err.response?.data?.detail || "Could not fetch video. Link may be private or unsupported.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (formatId: string) => {
    if (!videoData) return;
    setDownloadingId(formatId);
    setError("");

    try {
      const params = new URLSearchParams({
        url: url.trim(),
        format_id: formatId,
        title: videoData.title,
      });

      // Fetch as blob so we can show progress and trigger download properly
      const res = await axios.get(`${BACKEND}/download?${params}`, {
        responseType: "blob",
        timeout: 300000, // 5 min timeout for large videos
      });

      const ext = formatId === "mp3" ? "mp3" : "mp4";
      const filename = `${videoData.title.slice(0, 60).replace(/[^\w\s-]/g, "").trim()}.${ext}`;

      // Trigger browser download
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

    } catch (err: any) {
      if (!err.response) {
        setError("Download failed — backend may be offline.");
      } else {
        // Parse error from blob response
        const text = await err.response?.data?.text?.();
        try {
          const json = JSON.parse(text || "{}");
          setError(json.detail || "Download failed. Video may be private or region-locked.");
        } catch {
          setError("Download failed. Video may be private or region-locked.");
        }
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-4 py-10">
      <div className="max-w-3xl w-full text-center">

        <h1 className="text-4xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          5-in-1 Downloader
        </h1>
        <p className="text-gray-400 mb-1 text-sm md:text-base">
          YouTube • TikTok • Instagram • Facebook • X (Twitter)
        </p>
        <p className="text-gray-600 mb-8 text-xs">No Spam. No Ads. High Speed HD Downloads.</p>

        {/* Input */}
        <div className="flex flex-col md:flex-row gap-2 bg-gray-800 p-2 rounded-2xl shadow-2xl border border-gray-700">
          <input
            className="flex-1 bg-transparent p-4 outline-none text-base md:text-lg placeholder-gray-500"
            placeholder="Paste YouTube, TikTok, IG, FB or X link..."
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyzing...
              </span>
            ) : "Analyze"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-300 text-sm text-left">
            ⚠️ {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="mt-10 bg-gray-800 rounded-3xl overflow-hidden border border-gray-700 animate-pulse">
            <div className="w-full h-64 bg-gray-700" />
            <div className="p-6 space-y-4">
              <div className="h-5 bg-gray-700 rounded w-3/4 mx-auto" />
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-700 rounded-xl" />)}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {videoData && !loading && (
          <div className="mt-10 bg-gray-800 rounded-3xl overflow-hidden border border-gray-700">
            <div className="relative bg-gray-700">
              {videoData.thumbnail ? (
                <img
                  src={videoData.thumbnail}
                  alt="Thumbnail"
                  className="w-full h-64 object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-gray-500 text-sm">
                  No thumbnail
                </div>
              )}
              {videoData.duration != null && (
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
                  {formatDuration(videoData.duration)}
                </span>
              )}
            </div>

            <div className="p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-6 line-clamp-2 text-left">
                {videoData.title}
              </h2>

              {/* Global downloading indicator */}
              {downloadingId && (
                <div className="mb-4 p-3 bg-blue-900/50 border border-blue-500 rounded-xl text-blue-300 text-sm flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Preparing download... This may take a minute for large videos.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {videoData.formats.length === 0 && (
                  <p className="col-span-2 text-gray-400 text-sm py-2">
                    ⚠️ No video formats found — only audio available.
                  </p>
                )}

                {videoData.formats.map((f) => {
                  const isDownloading = downloadingId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleDownload(f.id)}
                      disabled={downloadingId !== null}
                      className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors group disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-blue-400 font-mono text-sm bg-gray-900 px-2 py-1 rounded">
                          {f.quality}
                        </span>
                        <span className="text-gray-300">MP4</span>
                      </span>
                      <span className="text-gray-500 group-hover:text-white transition-colors text-sm">
                        {isDownloading ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : "↓ Download"}
                      </span>
                    </button>
                  );
                })}

                {/* MP3 */}
                <button
                  onClick={() => handleDownload("mp3")}
                  disabled={downloadingId !== null}
                  className="flex items-center justify-between p-4 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-bold transition-colors group disabled:opacity-50 disabled:cursor-not-allowed md:col-span-2 w-full"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-200 font-mono text-sm bg-emerald-900 px-2 py-1 rounded">MP3</span>
                    <span>Audio Only</span>
                  </span>
                  <span className="text-emerald-300 group-hover:text-white transition-colors text-sm">
                    {downloadingId === "mp3" ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : "↓ Download"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-gray-700 text-xs">For personal use only. Respect copyright laws.</p>
      </div>
    </main>
  );
}
