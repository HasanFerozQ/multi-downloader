"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Script from "next/script";
import { 
  Download, Link2, Music, CheckCircle, Loader2, 
  AlertCircle, Coffee, ShieldCheck, Crown, X 
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
      setError(err.response?.data?.detail || "Error analyzing link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const triggerBrowserDownload = (taskId: string, title: string) => {
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
    } catch (err) { setError("Server busy."); }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center font-sans pb-32 overflow-x-hidden">
      
      {/* SCRIPT INJECTION (Adsterra/PropellerAds) */}
      {showAds && (
        <>
          <Script id="propeller-ads-nav" strategy="afterInteractive">
             {`/* PASTE PROPELLERADS MULTITAG CODE HERE */`}
          </Script>
        </>
      )}

      {/* DESKTOP AD PILLARS (160x600) */}
      {showAds && (
        <>
          <div className="fixed left-0 top-0 w-[160px] h-full hidden xl:flex flex-col items-center justify-center bg-white/[0.02] border-r border-white/5 z-0">
            <div className="w-[120px] h-[600px] bg-white/5 border border-white/5 rounded flex items-center justify-center italic text-[10px] text-slate-800">160x600 Ad</div>
          </div>
          <div className="fixed right-0 top-0 w-[160px] h-full hidden xl:flex flex-col items-center justify-center bg-white/[0.02] border-l border-white/5 z-0">
            <div className="w-[120px] h-[600px] bg-white/5 border border-white/5 rounded flex items-center justify-center italic text-[10px] text-slate-800">160x600 Ad</div>
          </div>
        </>
      )}

      <div className="max-w-4xl w-full px-6 pt-12 z-10">
        {/* BRANDING */}
        <header className="flex flex-col items-center text-center mb-10">
          <img src="/logo.jpg" alt="King Logo" className="w-[100px] h-[100px] rounded-2xl mb-4 shadow-2xl border border-white/10" />
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">KING <span className="text-blue-500">DOWNLOADER</span></h1>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full border border-green-500/20 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck size={14} /> NO REDIRECTS • NO POP-UP ADS
            </div>
            <button onClick={() => setShowAds(!showAds)} className="text-[10px] font-bold uppercase text-slate-500 hover:text-white transition">
              {showAds ? "✨ Hide Ads" : "👁️ Show Ads"}
            </button>
          </div>
        </header>

        {/* INPUT SECTION */}
        <div className="relative group max-w-2xl mx-auto mb-10">
          <div className="relative flex flex-col md:flex-row items-center bg-[#0f172a] rounded-2xl p-2 border border-white/5 gap-2 shadow-2xl">
            <div className="flex flex-1 items-center w-full px-4">
              <Link2 className="text-slate-500" />
              <input 
                className="flex-1 p-4 bg-transparent outline-none text-white text-sm"
                placeholder="Paste YouTube, TikTok, FB, or X link..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <button onClick={handleAnalyze} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "PROCESS"}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400">
            <AlertCircle size={18} />
            <p className="text-xs md:text-sm font-medium">{error}</p>
          </div>
        )}

        {/* DOWNLOAD PROGRESS */}
        {downloadProgress && (
          <div className="max-w-2xl mx-auto mb-10 text-center animate-in fade-in zoom-in duration-300">
            {showAds && (
              <div className="w-full h-[90px] bg-white/[0.03] rounded-xl mb-6 flex items-center justify-center border border-white/5 italic text-[10px] text-slate-700 font-bold uppercase">
                728x90 In-Stream Ad Area
              </div>
            )}
            <div className="bg-[#0f172a] p-8 rounded-3xl border border-blue-500/20 shadow-2xl">
               <h3 className="text-xl font-bold mb-4">{downloadProgress.progress < 100 ? "Processing Media..." : "Almost Ready..."}</h3>
               <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden p-1">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-300" style={{width: `${downloadProgress.progress}%`}}></div>
               </div>
               <p className="mt-4 text-3xl font-black text-white">{Math.round(downloadProgress.progress)}%</p>
            </div>
          </div>
        )}

        {/* RESULT CARD */}
        {videoData && !downloadProgress && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white/[0.02] backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] border border-white/5 animate-in slide-in-from-bottom-4 duration-500">
            <div className="relative group overflow-hidden rounded-3xl shadow-2xl border border-white/10">
              <img src={videoData.thumbnail} className="w-full h-full object-cover aspect-video group-hover:scale-105 transition duration-500" alt="thumb" />
            </div>
            <div className="flex flex-col justify-between">
              <h2 className="text-2xl font-bold text-white mb-6 line-clamp-2 leading-tight">{videoData.title}</h2>
              <div className="space-y-3">
                {videoData.formats.map((f: any) => (
                  <button key={f.id} onClick={() => handleDownload(f.id)} className="w-full flex justify-between items-center bg-white/5 hover:bg-blue-600 p-5 rounded-2xl border border-white/5 transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-wider">{f.quality} MP4 VIDEO</span>
                    <Download size={18} className="text-slate-500 group-hover:text-white" />
                  </button>
                ))}
                <button onClick={() => handleDownload("mp3")} className="w-full flex justify-between items-center bg-white/5 hover:bg-cyan-600 p-5 rounded-2xl border border-white/5 transition-all group">
                  <span className="font-bold text-xs md:text-sm uppercase tracking-wider">320kbps MP3 AUDIO</span>
                  <Music size={18} className="text-slate-500 group-hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUPPORT SECTION - GLOBAL PAYMENTS */}
<section className="mt-24 max-w-2xl mx-auto bg-[#0f172a] border border-yellow-500/20 rounded-2xl overflow-hidden shadow-2xl">
  <div className="flex flex-col md:flex-row items-stretch p-8 gap-8">
    
    {/* QR CODE (Binance Pay) */}
    <div className="flex-shrink-0 bg-white p-3 rounded-xl shadow-lg border-4 border-yellow-500/10 flex flex-col items-center justify-center">
      <img src="/binance_qr.png" alt="Binance QR" className="w-32 h-32 object-contain" />
      <p className="text-[9px] text-center text-slate-900 font-black mt-2 uppercase tracking-tighter">Binance Pay</p>
    </div>

    {/* MULTI-PAYMENT OPTIONS */}
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <Coffee className="text-yellow-500" size={24} />
        <h2 className="text-xl font-black text-white uppercase">Support the Server</h2>
      </div>
      
      <p className="text-slate-500 text-xs mb-6">Choose your preferred way to help us stay online.</p>

      <div className="space-y-3">
        {/* GLOBAL CREDIT/DEBIT CARD (Payoneer/XPay) */}
        <a 
          href="PASTE_YOUR_PAYONEER_OR_XPAY_LINK_HERE" 
          target="_blank"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          💳 CREDIT / DEBIT CARD (GLOBAL)
        </a>

        {/* BINANCE PAY ID */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 group relative cursor-pointer active:scale-95 transition">
          <p className="text-[8px] uppercase tracking-[0.2em] text-yellow-500 font-bold mb-1">Binance Pay ID</p>
          <p className="text-[11px] text-white font-mono font-bold select-all leading-none">86846518</p>
        </div>

        {/* MANUAL USDT (TRC-20) */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-[8px] uppercase tracking-[0.2em] text-blue-400 font-bold mb-1">Global USDT (TRC-20)</p>
          <p className="text-[10px] text-white font-mono font-bold select-all truncate">TLLggXh91RjxpKNb7FHXgTd6JDHb9gQVGE</p>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* SEO SECTIONS */}
        <section className="mt-24 grid md:grid-cols-2 gap-16 border-t border-white/5 pt-16 text-slate-500 text-xs md:text-sm">
          <article>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Crown size={14} className="text-blue-500" /> Fast YouTube 1080p Download</h4>
            <p className="leading-relaxed text-slate-500">King Downloader uses advanced H.264 (avc1) merging to provide Full HD 1080p MP4 files. Unlike other sites, we offer a 100% safe environment with no malicious pop-up redirects.</p>
          </article>
          <article>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Crown size={14} className="text-cyan-500" /> Clean FB to MP3 Extraction</h4>
            <p className="leading-relaxed text-slate-500">Extract high-fidelity 320kbps audio from Facebook and TikTok without risk. Our one-click system saves the file directly to your downloads folder safely.</p>
          </article>
        </section>
      </div>

      {/* ADAPTIVE STICKY FOOTER */}
      {showAds && (
        <footer className="fixed bottom-0 left-0 w-full h-20 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-center z-50">
          <div className="flex flex-col md:flex-row items-center gap-4 px-4 w-full justify-center">
             <div className="w-full max-w-[320px] md:max-w-[728px] h-[50px] bg-white/5 rounded flex items-center justify-center border border-white/5">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">320x50 / 728x50 Sticky Ad Area</span>
             </div>
             <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <a href="/terms" target="_blank" className="hover:text-blue-500 transition">Terms</a>
                <a href="/privacy" target="_blank" className="hover:text-blue-500 transition">Privacy</a>
             </div>
          </div>
        </footer>
      )}
    </main>
  );
}