"use client";
import { useState } from "react";
import axios from "axios";
import { Download, Link2, Monitor, Music, CheckCircle, Loader2, AlertCircle, Crown } from "lucide-react";

const BACKEND = "http://localhost:8000";
const WS_BACKEND = "ws://localhost:8000";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setVideoData(null);
    try {
      const res = await axios.get(`${BACKEND}/analyze`, { params: { url: url.trim() } });
      setVideoData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error analyzing link.");
    } finally {
      setLoading(false);
    }
  };

  const triggerBrowserDownload = (taskId: string, title: string) => {
    const downloadUrl = `${BACKEND}/download/file/${taskId}?title=${encodeURIComponent(title)}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `${title}.mp4`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownload = async (formatId: string) => {
    setError(null);
    try {
      const { data } = await axios.get(`${BACKEND}/download/start`, {
        params: { url: url.trim(), format_id: formatId }
      });

      const ws = new WebSocket(`${WS_BACKEND}/ws/progress/${data.task_id}`);
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setProgress({ progress: msg.progress, status: msg.status });
        
        if (msg.status === "Finished") {
          triggerBrowserDownload(data.task_id, videoData.title);
          setProgress(null);
          ws.close();
        }
      };
    } catch (err: any) {
      setError("Download limit reached or server error.");
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center p-6 font-sans">
      {/* Visual Accents */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-4xl w-full pt-8">
        {/* BRANDING HEADER */}
        <header className="flex flex-col items-center text-center mb-12">
          <div className="relative mb-6">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-30 animate-pulse"></div>
            <img 
              src="/logo.jpg" 
              alt="King Downloader Logo" 
              className="relative w-[100px] h-[100px] rounded-2xl object-cover border border-white/10 shadow-2xl" 
            />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-3">
            KING <span className="text-blue-500">DOWNLOADER</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium tracking-widest text-xs uppercase">Premium Media Extraction Service</p>
        </header>

        {/* INPUT AREA */}
        <div className="relative group max-w-2xl mx-auto mb-10">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center bg-[#0f172a] rounded-2xl p-2 border border-white/5">
            <Link2 className="ml-4 text-slate-500" />
            <input 
              className="flex-1 p-4 bg-transparent outline-none text-white placeholder-slate-600 font-medium"
              placeholder="Enter video URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button 
              onClick={handleAnalyze} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : "PROCESS"}
            </button>
          </div>
        </div>

        {/* PROGRESS BAR WITH DYNAMIC STATUS */}
        {downloadProgress && (
          <div className="max-w-2xl mx-auto mb-10 bg-[#0f172a] p-8 rounded-3xl border border-blue-500/20 shadow-inner">
            <div className="flex justify-between mb-4 items-end">
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Status</p>
                {/* Dynamic Labeling */}
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {downloadProgress.progress < 100 ? (
                    <><Loader2 className="animate-spin text-blue-400" size={20}/> Downloading...</>
                  ) : (
                    <><CheckCircle className="text-green-500" size={20}/> Muxing Streams...</>
                  )}
                </h3>
              </div>
              <span className="text-3xl font-black text-white">{Math.round(downloadProgress.progress)}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-4 p-1 border border-white/5">
              <div 
                className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                style={{width: `${downloadProgress.progress}%`}}
              ></div>
            </div>
          </div>
        )}

        {/* RESULT CARD */}
        {videoData && !downloadProgress && (
          <div className="grid md:grid-cols-2 gap-10 bg-white/[0.02] backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group">
              <img src={videoData.thumbnail} className="object-cover w-full h-full" alt="thumbnail" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <Crown size={16} className="text-yellow-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">{videoData.uploader}</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4 line-clamp-2 leading-tight">{videoData.title}</h2>
                <div className="h-1 w-20 bg-blue-600 rounded-full mb-8"></div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  {videoData.formats.map((f: any) => (
                    <button 
                      key={f.id} 
                      onClick={() => handleDownload(f.id)} 
                      className="group flex items-center justify-between bg-white/[0.03] hover:bg-blue-600 p-5 rounded-2xl border border-white/5 hover:border-blue-400 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <Monitor size={22} className="text-blue-400 group-hover:text-white" />
                        <div>
                          <p className="text-sm font-bold text-white uppercase">{f.quality} MP4</p>
                          <p className="text-[10px] text-slate-500 group-hover:text-blue-100 font-bold">STABLE VIDEO STREAM</p>
                        </div>
                      </div>
                      <Download size={18} className="text-slate-600 group-hover:text-white" />
                    </button>
                  ))}
                  <button 
                    onClick={() => handleDownload("mp3")} 
                    className="group flex items-center justify-between bg-white/[0.03] hover:bg-cyan-600 p-5 rounded-2xl border border-white/5 hover:border-cyan-400 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <Music size={22} className="text-cyan-400 group-hover:text-white" />
                      <div>
                        <p className="text-sm font-bold text-white uppercase">320KBPS MP3</p>
                        <p className="text-[10px] text-slate-500 group-hover:text-cyan-100 font-bold">HQ AUDIO EXTRACTION</p>
                      </div>
                    </div>
                    <Download size={18} className="text-slate-600 group-hover:text-white" />
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