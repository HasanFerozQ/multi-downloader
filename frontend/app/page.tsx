"use client";
import { useState } from "react";
import axios from "axios";
import { Download, Link2, Monitor, Music, CheckCircle, Loader2 } from "lucide-react";

const BACKEND = "http://localhost:8000";
const WS_BACKEND = "ws://localhost:8000";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setProgress] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/analyze`, { params: { url: url.trim() } });
      setVideoData(res.data);
    } catch (err) {
      alert("Error analyzing link. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const triggerBrowserDownload = (taskId: string, fileName: string) => {
    // This forces the file to move from your server to the USER'S computer
    const downloadUrl = `${BACKEND}/download/file/${taskId}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownload = async (formatId: string) => {
    try {
      const { data } = await axios.get(`${BACKEND}/download/start`, {
        params: { url: url.trim(), format_id: formatId }
      });

      const ws = new WebSocket(`${WS_BACKEND}/ws/progress/${data.task_id}`);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setProgress({ progress: msg.progress, status: msg.status });
        
        if (msg.status === "Finished") {
          triggerBrowserDownload(data.task_id, `${videoData.title}.mp4`);
          setProgress(null);
        }
      };
    } catch (err) {
      alert("Failed to start download.");
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center p-6 font-sans">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-4xl w-full pt-16">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Pro StreamDown
          </h1>
          <p className="text-slate-400 text-lg">High-speed 1080p video & MP3 downloader</p>
        </header>

        {/* Search Bar */}
        <div className="relative group max-w-2xl mx-auto mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-[#1e293b] rounded-2xl p-2 border border-slate-700">
            <Link2 className="ml-4 text-slate-500" />
            <input 
              className="flex-1 p-4 bg-transparent outline-none text-white placeholder-slate-500"
              placeholder="Paste YouTube, TikTok, or FB link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Analyze"}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {downloadProgress && (
          <div className="max-w-2xl mx-auto mb-8 bg-[#1e293b] p-6 rounded-2xl border border-blue-500/30 animate-pulse">
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span>{downloadProgress.status}</span>
              <span>{Math.round(downloadProgress.progress)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300" style={{width: `${downloadProgress.progress}%`}}></div>
            </div>
          </div>
        )}

        {/* Video Card */}
        {videoData && (
          <div className="grid md:grid-cols-2 gap-8 bg-[#1e293b]/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
              <img src={videoData.thumbnail} className="object-cover w-full h-full" alt="thumbnail" />
              <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-xs font-mono">
                {videoData.duration}s
              </div>
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight line-clamp-2">{videoData.title}</h2>
                <p className="text-slate-400 text-sm mb-6 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" /> Verfied Content
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Available Formats</p>
                <div className="grid grid-cols-2 gap-3">
                  {videoData.formats.map((f: any) => (
                    <button 
                      key={f.id} 
                      onClick={() => handleDownload(f.id)} 
                      className="group flex items-center justify-between bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Monitor size={18} className="text-blue-400" />
                        <div>
                          <p className="text-sm font-bold text-white">{f.quality}</p>
                          <p className="text-[10px] text-slate-500 uppercase">MP4 Video</p>
                        </div>
                      </div>
                      <Download size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </button>
                  ))}
                  <button onClick={() => handleDownload("mp3")} className="group flex items-center justify-between bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all text-left">
                    <div className="flex items-center gap-3">
                      <Music size={18} className="text-purple-400" />
                      <div>
                        <p className="text-sm font-bold text-white">Audio Only</p>
                        <p className="text-[10px] text-slate-500 uppercase">320kbps MP3</p>
                      </div>
                    </div>
                    <Download size={16} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}