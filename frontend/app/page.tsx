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
    // Direct trigger for high retention - no pop-ups
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
    } catch (err) { setError("Server capacity reached."); }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center font-sans pb-32">
      
      {/* RESPONSIVE AD PILLARS - Hidden on Mobile/Tablet, only visible on XL Desktop */}
      <div className="fixed left-0 top-0 w-[160px] h-full hidden xl:flex flex-col items-center justify-center bg-white/[0.02] border-r border-white/5 z-0">
        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest rotate-90 mb-8">Advertisement</div>
        {/* Ad Code Placeholder */}
        <div className="w-[120px] h-[600px] bg-white/5 border border-white/5 rounded flex items-center justify-center italic text-[10px] text-slate-800">120x600 Ad</div>
      </div>

      <div className="fixed right-0 top-0 w-[160px] h-full hidden xl:flex flex-col items-center justify-center bg-white/[0.02] border-l border-white/5 z-0">
        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest rotate-90 mb-8">Advertisement</div>
        {/* Ad Code Placeholder */}
        <div className="w-[120px] h-[600px] bg-white/5 border border-white/5 rounded flex items-center justify-center italic text-[10px] text-slate-800">120x600 Ad</div>
      </div>

      {/* MAIN CONTENT - Max-width ensures content never touches ads */}
      <div className="max-w-4xl w-full px-6 pt-12 z-10">
        <header className="flex flex-col items-center text-center mb-10">
          <img src="/logo.jpg" alt="King Logo" className="w-[100px] h-[100px] rounded-2xl mb-4 shadow-2xl" />
          <h1 className="text-4xl md:text-5xl font-black text-white">KING <span className="text-blue-500">DOWNLOADER</span></h1>
          <div className="mt-4 flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full border border-green-500/20 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} /> NO REDIRECTS • NO POP-UP ADS • 100% SAFE
          </div>
        </header>

        {/* SEARCH AREA */}
        <div className="relative group max-w-2xl mx-auto mb-10">
          <div className="relative flex flex-col md:flex-row items-center bg-[#0f172a] rounded-2xl p-2 border border-white/5 gap-2">
            <div className="flex flex-1 items-center w-full">
              <Link2 className="ml-4 text-slate-500" />
              <input 
                className="flex-1 p-4 bg-transparent outline-none text-white text-sm md:text-base"
                placeholder="Paste Link (YouTube, FB, TikTok...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <button onClick={handleAnalyze} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all">
              {loading ? <Loader2 className="animate-spin" /> : "PROCESS"}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400">
            <AlertCircle size={18} />
            <p className="text-xs md:text-sm font-medium">{error}</p>
          </div>
        )}

        {/* PROGRESS + AD AREA */}
        {downloadProgress && (
          <div className="max-w-2xl mx-auto mb-10 text-center">
            {/* Mobile-Friendly Banner Ad */}
            <div className="w-full max-w-[728px] h-[90px] bg-white/[0.03] rounded-xl mx-auto mb-6 flex items-center justify-center text-slate-700 text-[10px] font-bold border border-white/5">
              SAFE RESPONSIVE AD (320x50 or 728x90)
            </div>
            <div className="bg-[#0f172a] p-6 md:p-8 rounded-3xl border border-blue-500/20 shadow-2xl">
               <h3 className="text-lg md:text-xl font-bold mb-4">{downloadProgress.status === "Finished" ? "Complete!" : "Downloading..."}</h3>
               <div className="w-full bg-slate-900 h-3 md:h-4 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{width: `${downloadProgress.progress}%`}}></div>
               </div>
               <p className="mt-4 text-2xl md:text-3xl font-black text-white">{Math.round(downloadProgress.progress)}%</p>
            </div>
          </div>
        )}

        {/* RESULT CARD */}
        {videoData && !downloadProgress && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 bg-white/[0.02] backdrop-blur-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/5">
            <img src={videoData.thumbnail} className="rounded-2xl md:rounded-3xl aspect-video object-cover" alt="thumb" />
            <div className="flex flex-col justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-6 line-clamp-2">{videoData.title}</h2>
              <div className="space-y-3">
                {videoData.formats.map((f: any) => (
                  <button key={f.id} onClick={() => handleDownload(f.id)} className="w-full flex justify-between bg-white/5 hover:bg-blue-600 p-4 rounded-xl border border-white/5 transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-wider">{f.quality} MP4 VIDEO</span>
                    <Download size={18} className="text-slate-500 group-hover:text-white" />
                  </button>
                ))}
                <button onClick={() => handleDownload("mp3")} className="w-full flex justify-between bg-white/5 hover:bg-cyan-600 p-4 rounded-xl border border-white/5 transition-all group">
                  <span className="font-bold text-xs md:text-sm uppercase tracking-wider">320kbps MP3 AUDIO</span>
                  <Music size={18} className="text-slate-500 group-hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DONATION SECTION */}
        <section className="mt-20 bg-gradient-to-br from-yellow-600/5 to-orange-600/5 border border-yellow-500/10 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] text-center">
          <Coffee className="text-yellow-500 mx-auto mb-4" size={32} />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Support the Server</h2>
          <p className="text-slate-500 max-w-lg mx-auto mb-8 text-xs md:text-sm">
            Maintaining a safe, no-redirect service is expensive. If we saved your time today, consider a 1 USDT donation to keep King Downloader free forever.
          </p>
          <div className="inline-block bg-white p-3 rounded-2xl shadow-2xl mb-6">
            <img src="/binance_qr.png" alt="Binance QR" className="w-28 h-28 md:w-32 md:h-32" />
          </div>
          <p className="text-[9px] md:text-[10px] font-mono text-yellow-600">Binance Pay ID: YOUR_ID_HERE</p>
        </section>

        {/* SEO SECTION */}
        <section className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/5 pt-16 text-slate-500 text-xs md:text-sm leading-relaxed">
          <article>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Crown size={14} className="text-blue-500" /> Safe YouTube 1080p Download</h4>
            <p>Our downloader uses an advanced merging engine to deliver 1080p Full HD video with crystal clear audio. Unlike other sites, we prioritize a 100% safe environment with zero malicious pop-up redirects.</p>
          </article>
          <article>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Crown size={14} className="text-cyan-500" /> High Quality FB to MP3</h4>
            <p>Convert Facebook and TikTok videos to high-fidelity 320kbps MP3 audio instantly. Our one-click system saves the file directly to your user downloads folder for offline listening.</p>
          </article>
        </section>
      </div>

      {/* STICKY FOOTER - Adaptive size for Mobile vs Desktop */}
      <footer className="fixed bottom-0 left-0 w-full h-16 md:h-20 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-center z-50">
        <div className="flex items-center gap-4 px-4 w-full justify-center">
           <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest hidden lg:block">Sponsor</span>
           <div className="w-full max-w-[320px] md:max-w-[728px] h-[50px] bg-white/5 rounded border border-white/5 flex items-center justify-center italic text-slate-700 text-[9px] md:text-[10px]">
              SAFE STICKY AD (320x50 on Mobile / 728x50 on Desktop)
           </div>
        </div>
      </footer>
    </main>
  );
}