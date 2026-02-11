"use client";
import { useState } from "react";
import axios from "axios";
import Script from "next/script";
import { 
  Download, Link2, Music, Loader2, 
  AlertCircle, Coffee, ShieldCheck, Crown 
} from "lucide-react";

const BACKEND = "http://localhost:8000";
const WS_BACKEND = "ws://localhost:8000";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAds, setShowAds] = useState(true);

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
          window.location.href = `${BACKEND}/download/file/${data.task_id}?title=${encodeURIComponent(videoData.title)}`;
          setProgress(null);
          ws.close();
        }
      };
    } catch (err) { setError("Download engine busy."); }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center font-sans pb-40 overflow-x-hidden">
      
      {/* 1. AD PILLARS (Restored) */}
      {showAds && (
        <>
          <div className="fixed left-0 top-0 w-[160px] h-full hidden xl:flex flex-col items-center justify-center bg-white/[0.02] border-r border-white/5 z-0">
            <div className="w-[120px] h-[600px] bg-white/5 border border-white/5 rounded flex items-center justify-center italic text-[10px] text-slate-800 uppercase font-black tracking-widest">160x600 Ad Pillar</div>
          </div>
          <div className="fixed right-0 top-0 w-[160px] h-full hidden xl:flex flex-col items-center justify-center bg-white/[0.02] border-l border-white/5 z-0">
            <div className="w-[120px] h-[600px] bg-white/5 border border-white/5 rounded flex items-center justify-center italic text-[10px] text-slate-800 uppercase font-black tracking-widest">160x600 Ad Pillar</div>
          </div>
        </>
      )}

      <div className="max-w-4xl w-full px-6 pt-12 z-10">
        <header className="flex flex-col items-center text-center mb-10">
          <img src="/logo.jpg" alt="King Logo" className="w-[100px] h-[100px] rounded-2xl mb-4 shadow-2xl border border-white/10" />
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">KING <span className="text-blue-500">DOWNLOADER</span></h1>
          <div className="mt-4 flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full border border-green-500/20 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} /> NO REDIRECTS • HIGH SPEED
          </div>
        </header>

        {/* INPUT */}
        <div className="relative group max-w-2xl mx-auto mb-10">
          <div className="flex flex-col md:flex-row items-center bg-[#0f172a] rounded-2xl p-2 border border-white/5 gap-2 shadow-2xl">
            <div className="flex flex-1 items-center w-full px-4">
              <Link2 className="text-slate-500" />
              <input className="flex-1 p-4 bg-transparent outline-none text-white text-sm" placeholder="Paste Video Link..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <button onClick={handleAnalyze} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 uppercase tracking-tighter">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Analyze"}
            </button>
          </div>
        </div>

        {downloadProgress && (
          <div className="max-w-2xl mx-auto mb-10 text-center animate-pulse">
            <div className="bg-[#0f172a] p-8 rounded-3xl border border-blue-500/20 shadow-2xl">
               <h3 className="text-xl font-bold mb-4 text-blue-400">Processing via King Engine...</h3>
               <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden p-1">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-300" style={{width: `${downloadProgress.progress}%`}}></div>
               </div>
               <p className="mt-4 text-3xl font-black text-white">{Math.round(downloadProgress.progress)}%</p>
            </div>
          </div>
        )}

        {videoData && !downloadProgress && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white/[0.02] backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] border border-white/5 animate-in slide-in-from-bottom-4">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10"><img src={videoData.thumbnail} className="w-full aspect-video object-cover" alt="thumb" /></div>
            <div className="flex flex-col justify-between">
              <h2 className="text-2xl font-bold text-white mb-6 line-clamp-2 leading-tight">{videoData.title}</h2>
              <div className="space-y-3">
                {videoData.formats.map((f: any) => (
                  <button key={f.id} onClick={() => handleDownload(f.id)} className="w-full flex justify-between items-center bg-white/5 hover:bg-blue-600 p-5 rounded-2xl border border-white/5 transition-all group font-bold text-xs uppercase">
                    <span>{f.quality} MP4 VIDEO</span>
                    <Download size={18} className="text-slate-500 group-hover:text-white" />
                  </button>
                ))}
                <button onClick={() => handleDownload("mp3")} className="w-full flex justify-between items-center bg-white/5 hover:bg-cyan-600 p-5 rounded-2xl border border-white/5 transition-all group font-bold text-xs uppercase">
                  <span>320kbps MP3 AUDIO</span>
                  <Music size={18} className="text-slate-500 group-hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BINANCE SECTION (Locked In) */}
        <section className="mt-24 max-w-2xl mx-auto bg-[#0f172a] border border-yellow-500/20 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-stretch p-8 gap-8">
            <div className="flex-shrink-0 bg-white p-3 rounded-xl shadow-lg border-4 border-yellow-500/10 flex flex-col items-center justify-center">
              <img src="/binance_qr.png" alt="Binance QR" className="w-32 h-32 object-contain" />
              <p className="text-[9px] text-center text-slate-900 font-black mt-2 uppercase">Binance Pay</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2"><Coffee className="text-yellow-500" size={24} /><h2 className="text-xl font-black text-white uppercase tracking-tighter">Support Server</h2></div>
              <p className="text-slate-500 text-xs mb-6">Choose your preferred way to help us stay online.</p>
              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-yellow-500 font-bold mb-1">Binance Pay ID</p>
                  <p className="text-[11px] text-white font-mono font-bold select-all leading-none">86846518</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-blue-400 font-bold mb-1">Global USDT (TRC-20)</p>
                  <p className="text-[10px] text-white font-mono font-bold select-all truncate leading-none font-mono">TLLggXh91RjxpKNb7FHXgTd6JDHb9gQVGE</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 2. STICKY FOOTER & LEGAL LINKS (Restored) */}
      <footer className="fixed bottom-0 left-0 w-full h-24 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-full max-w-[728px] h-[50px] bg-white/5 rounded border border-white/5 flex items-center justify-center italic text-[9px] text-slate-700 uppercase font-black">728x90 Sticky Ad Area</div>
            <div className="flex gap-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <a href="/terms" className="hover:text-blue-500 transition">Terms</a>
                <a href="/privacy" className="hover:text-blue-500 transition">Privacy</a>
                <a href="/about" className="hover:text-blue-500 transition">About</a>
                <span className="text-slate-800">© KING TOOLS 2026</span>
            </div>
          </div>
      </footer>
    </main>
  );
}