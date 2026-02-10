"use client";
import { useState } from "react";
import axios from "axios";
import { Download, Link2, Monitor, Music, CheckCircle, Loader2, AlertCircle, Coffee, ShieldCheck, Crown } from "lucide-react";

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
    // ONE-CLICK DOWNLOAD: Guaranteed no pop-up redirects
    const downloadUrl = `${BACKEND}/download/file/${taskId}?title=${encodeURIComponent(title)}`;
    window.location.href = downloadUrl;
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
    } catch (err) {
      setError("Server capacity reached. Try again in 1 minute.");
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center font-sans pb-32">
      
      {/* SAFE AD PILLARS (Non-intrusive display only) */}
      <div className="fixed left-0 top-0 w-[160px] h-full hidden xl:flex flex-col items-center justify-center bg-white/[0.02] border-r border-white/5 z-0">
        <p className="rotate-90 text-slate-700 font-bold tracking-[1.5em] uppercase text-[10px]">Advertisement</p>
      </div>
      <div className="fixed right-0 top-0 w-[160px] h-full hidden xl:flex flex-col items-center justify-center bg-white/[0.02] border-l border-white/5 z-0">
        <p className="rotate-90 text-slate-700 font-bold tracking-[1.5em] uppercase text-[10px]">Advertisement</p>
      </div>

      <div className="max-w-4xl w-full px-6 pt-12 z-10">
        {/* BRANDING */}
        <header className="flex flex-col items-center text-center mb-10">
          <img src="/logo.jpg" alt="King Logo" className="w-[100px] h-[100px] rounded-2xl mb-4 shadow-2xl" />
          <h1 className="text-5xl font-black text-white">KING <span className="text-blue-500">DOWNLOADER</span></h1>
          
          {/* ADVANTAGE ADVERTISING */}
          <div className="mt-4 flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full border border-green-500/20 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} /> NO POP-UP ADS • NO REDIRECTS • 100% SAFE
          </div>
        </header>

        {/* SEARCH AREA */}
        <div className="relative group max-w-2xl mx-auto mb-10">
          <div className="relative flex items-center bg-[#0f172a] rounded-2xl p-2 border border-white/5">
            <Link2 className="ml-4 text-slate-500" />
            <input 
              className="flex-1 p-4 bg-transparent outline-none text-white"
              placeholder="YouTube, TikTok, FB, IG, or X link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button onClick={handleAnalyze} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-bold transition-all">
              {loading ? <Loader2 className="animate-spin" /> : "PROCESS"}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* PROGRESS + ADS */}
        {downloadProgress && (
          <div className="max-w-2xl mx-auto mb-10 text-center">
            <div className="w-full h-[90px] bg-white/[0.03] rounded-xl mb-6 flex items-center justify-center text-slate-700 text-[10px] font-bold border border-white/5">
              SAFE DISPLAY AD (728x90)
            </div>
            
            <div className="bg-[#0f172a] p-8 rounded-3xl border border-blue-500/20 shadow-2xl">
               <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
                 {downloadProgress.progress < 100 ? "Downloading Media..." : "Finalizing Files..."}
               </h3>
               <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-300" style={{width: `${downloadProgress.progress}%`}}></div>
               </div>
               <p className="mt-4 text-3xl font-black text-white">{Math.round(downloadProgress.progress)}%</p>
            </div>
          </div>
        )}

        {/* RESULT CARD */}
        {videoData && !downloadProgress && (
          <div className="grid md:grid-cols-2 gap-10 bg-white/[0.02] backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5">
            <img src={videoData.thumbnail} className="rounded-3xl aspect-video object-cover" alt="thumb" />
            <div className="flex flex-col justify-between">
              <h2 className="text-2xl font-bold text-white mb-6 line-clamp-2">{videoData.title}</h2>
              <div className="space-y-3">
                {videoData.formats.map((f: any) => (
                  <button key={f.id} onClick={() => handleDownload(f.id)} className="w-full flex justify-between bg-white/5 hover:bg-blue-600 p-5 rounded-2xl border border-white/5 transition-all">
                    <span className="font-bold text-sm uppercase">{f.quality} MP4 VIDEO</span>
                    <Download size={18} />
                  </button>
                ))}
                <button onClick={() => handleDownload("mp3")} className="w-full flex justify-between bg-white/5 hover:bg-cyan-600 p-5 rounded-2xl border border-white/5 transition-all">
                  <span className="font-bold text-sm uppercase">320kbps MP3 AUDIO</span>
                  <Music size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DONATION SECTION */}
        <section className="mt-24 bg-gradient-to-br from-yellow-600/5 to-orange-600/5 border border-yellow-500/10 p-12 rounded-[3rem] text-center">
          <Coffee className="text-yellow-500 mx-auto mb-4" size={32} />
          <h2 className="text-2xl font-bold text-white mb-2">Keep King Downloader Online</h2>
          <p className="text-slate-500 max-w-lg mx-auto mb-8 text-sm">
            We offer a premium experience with no pop-up scams. If you value this safe service, please donate 1 USDT to help us pay the monthly server costs.
          </p>
          <div className="inline-block bg-white p-3 rounded-2xl shadow-2xl mb-6">
            <img src="/binance_qr.png" alt="Binance QR" className="w-32 h-32" />
          </div>
          <p className="text-[10px] font-mono text-yellow-600">Pay ID: YOUR_ID_HERE</p>
        </section>

        {/* SEO HELP SECTIONS */}
        <section className="mt-24 grid md:grid-cols-2 gap-16 border-t border-white/5 pt-16 text-slate-500 text-sm">
          <article>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Crown size={14} className="text-blue-500" /> Safe YouTube 1080p Downloads</h4>
            <p className="leading-relaxed">King Downloader is built for safety. Unlike other sites, we never use redirecting ads or malicious pop-ups. Just paste your YouTube link, select 1080p, and enjoy your clean MP4 file.</p>
          </article>
          <article>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Crown size={14} className="text-cyan-500" /> Secure FB to MP3 Conversion</h4>
            <p className="leading-relaxed">Extract high-quality 320kbps audio from Facebook and TikTok without risk. Our one-click system ensures a direct download to your folder without third-party interference.</p>
          </article>
        </section>
      </div>

      {/* STICKY FOOTER AD (Purely Display) */}
      <footer className="fixed bottom-0 left-0 w-full h-20 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-center z-50">
        <div className="flex items-center gap-6 px-4">
           <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest hidden md:block">Ad Sponsored</span>
           <div className="w-[320px] md:w-[728px] h-[50px] bg-white/5 rounded flex items-center justify-center italic text-slate-700 text-[10px] tracking-tighter">
              SAFE DISPLAY BANNER (728x50)
           </div>
        </div>
      </footer>
    </main>
  );
}