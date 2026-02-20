"use client";
import { useState } from "react";
import DoNotRefresh from "../components/DoNotRefresh";

export default function DownloaderPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleFetch = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setVideoData(null);
    setSelectedFormat("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(
        `http://localhost:8000/analyze?url=${encodeURIComponent(url)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (!data.formats || data.formats.length === 0) {
        setError("No downloadable formats found. The platform may be unsupported or the video is restricted.");
      } else {
        setVideoData(data);
        // Auto-select best video quality (last before MP3)
        const formats: any[] = data.formats || [];
        const videoFormats = formats.filter((f: any) => f.id !== "mp3");
        const bestFormat = videoFormats.length > 0 ? videoFormats[videoFormats.length - 1] : formats[0];
        setSelectedFormat(bestFormat?.id || "");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Request timed out. The server might be busy — please try again.");
      } else {
        setError(err.message || "Backend connection failed! Make sure the server is running on port 8000.");
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
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
      const data = await res.json().catch(() => ({}));

      if (!data.task_id) {
        setError("Failed to start download");
        setDownloading(false);
        return;
      }

      const { task_id } = data;
      let retries = 0;

      const connectWs = () => {
        const ws = new WebSocket(`ws://localhost:8000/ws/progress/${task_id}`);

        ws.onopen = () => setStatus("Connected — preparing download...");

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.progress !== undefined) setProgress(Math.round(msg.progress));
            if (msg.status) setStatus(msg.status);

            if (msg.status === "Finished") {
              ws.close();
              setStatus("Download complete! Saving file...");

              const downloadUrl = `http://localhost:8000/download/file/${task_id}?title=${encodeURIComponent(videoData?.title || "video")}`;
              const a = document.createElement("a");
              a.href = downloadUrl;
              a.download = "";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);

              setTimeout(() => {
                setDownloading(false);
                setProgress(0);
                setStatus("Ready for next download");
              }, 2000);
            }

            if (msg.status === "Error") {
              ws.close();
              setError("Download failed: " + (msg.message || "Unknown error"));
              setDownloading(false);
              setProgress(0);
            }
          } catch { /* ignore parse errors */ }
        };

        ws.onerror = () => {
          if (retries < 1) {
            retries++;
            setTimeout(connectWs, 2000);
          } else {
            setError("WebSocket connection failed. Check your backend.");
            setDownloading(false);
          }
        };

        ws.onclose = () => console.log("WebSocket closed");
      };

      connectWs();
    } catch (err) {
      setError("Download request failed! Make sure backend is running.");
      setDownloading(false);
    }
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds <= 0) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (mb: number) => {
    if (mb >= 1000) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  const getQualityColor = (quality: string, isSelected: boolean) => {
    if (quality.includes("1080")) return isSelected ? "border-emerald-400 bg-emerald-500/20 shadow-emerald-500/30" : "border-emerald-500/30 hover:border-emerald-400/60";
    if (quality.includes("720")) return isSelected ? "border-blue-400 bg-blue-500/20 shadow-blue-500/30" : "border-blue-500/30 hover:border-blue-400/60";
    if (quality.includes("Audio") || quality.includes("MP3")) return isSelected ? "border-pink-400 bg-pink-500/20 shadow-pink-500/30" : "border-pink-500/30 hover:border-pink-400/60";
    return isSelected ? "border-indigo-400 bg-indigo-500/20 shadow-indigo-500/30" : "border-slate-600 hover:border-slate-500";
  };

  const getQualityBadge = (quality: string) => {
    if (quality.includes("1080")) return { label: "FHD", color: "bg-emerald-500" };
    if (quality.includes("720")) return { label: "HD", color: "bg-blue-500" };
    if (quality.includes("Audio") || quality.includes("MP3")) return { label: "MP3", color: "bg-pink-500" };
    if (quality.includes("480")) return { label: "SD", color: "bg-slate-500" };
    return { label: "", color: "" };
  };

  return (
    <div className="min-h-screen text-white">
      <DoNotRefresh visible={downloading || loading} />
      <div className="max-w-5xl mx-auto pt-8 px-4 pb-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            5-in-1 Video Downloader
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Download videos from <strong className="text-blue-400">YouTube</strong>, <strong className="text-pink-400">Instagram</strong>, <strong className="text-cyan-400">TikTok</strong>, <strong className="text-blue-300">Facebook</strong>, and <strong className="text-slate-300">X (Twitter)</strong> — in any quality up to Full HD (1080p)
          </p>
        </div>

        {/* URL Input */}
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-indigo-500/30 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="🔗 Paste your video link here..."
              className="flex-1 p-4 rounded-xl bg-white/5 border border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-slate-500 text-lg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            />
            <button
              onClick={handleFetch}
              disabled={loading}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${loading
                ? "bg-slate-700 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 active:scale-95 hover:shadow-indigo-500/40"
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Fetching...
                </span>
              ) : (
                "🔗 Fetch Video"
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 flex items-center gap-2 text-sm">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Video Info & Download */}
        {videoData && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Video Preview */}
            <div className="flex flex-col md:flex-row gap-6 p-6">
              <div className="md:w-72 flex-shrink-0">
                {videoData.thumbnail ? (
                  <img
                    src={videoData.thumbnail}
                    className="w-full rounded-xl shadow-lg border border-slate-700"
                    alt={videoData.title || "Video Thumbnail"}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full aspect-video rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 text-5xl border border-slate-700">
                    🎬
                  </div>
                )}
                <div className="mt-4 space-y-2.5 text-sm">
                  {videoData.uploader && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">👤 Uploader</span>
                      <span className="text-white font-medium truncate ml-2 max-w-[160px]">{videoData.uploader}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">⏱️ Duration</span>
                    <span className="text-white font-medium">{formatDuration(videoData.duration)}</span>
                  </div>
                  {videoData.views != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">👁️ Views</span>
                      <span className="text-white font-medium">{videoData.views?.toLocaleString?.() ?? "N/A"}</span>
                    </div>
                  )}
                  {videoData.platform && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">📱 Platform</span>
                      <span className="text-white font-medium">{videoData.platform}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-white leading-tight">
                  {videoData.title}
                </h2>

                {videoData.description && (
                  <p className="text-slate-400 text-sm mb-5 line-clamp-2">
                    {videoData.description}
                  </p>
                )}

                {/* Quality Selection */}
                <div className="mb-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Select Quality
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {(videoData.formats || []).map((f: any) => {
                      const isSelected = selectedFormat === f.id;
                      const badge = getQualityBadge(f.quality);
                      return (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFormat(f.id)}
                          disabled={downloading}
                          className={`relative p-3 rounded-xl border-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${isSelected
                            ? `${getQualityColor(f.quality, true)} shadow-lg scale-[1.02]`
                            : `bg-white/5 ${getQualityColor(f.quality, false)} hover:bg-white/10`
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-left">
                              <div className="font-bold text-sm text-white">{f.quality}</div>
                              {f.size_mb && (
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {formatFileSize(f.size_mb)}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {badge.label && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.color} text-white`}>
                                  {badge.label}
                                </span>
                              )}
                              {f.has_audio === false && (
                                <span className="text-[10px] text-slate-500">🔇 No audio</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 text-xs text-white bg-white/20 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Download Progress or Button */}
                {downloading ? (
                  <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{status}</span>
                      <span className="font-bold text-indigo-400">{progress}%</span>
                    </div>
                    <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
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
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    ⬇️ Download Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Features — empty state */}
        {!videoData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Download videos in seconds with server-side processing",
              },
              {
                icon: "🎨",
                title: "Multiple Qualities",
                desc: "Choose from 144p to 1080p, or extract audio as MP3",
              },
              {
                icon: "🔒",
                title: "Safe & Private",
                desc: "No data collection — files auto-delete after 30 minutes",
              },
              {
                icon: "🌐",
                title: "5 Platforms",
                desc: "YouTube, Instagram, TikTok, Facebook, and X (Twitter)",
              },
              {
                icon: "📊",
                title: "Real-Time Progress",
                desc: "Live download progress bar with WebSocket updates",
              },
              {
                icon: "🎵",
                title: "Audio Extraction",
                desc: "Extract MP3 audio from any video with one click",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-indigo-500/20 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-indigo-500/40 transition-all duration-300"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
