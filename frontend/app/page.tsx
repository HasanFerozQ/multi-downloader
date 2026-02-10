"use client";
import { useState } from "react";
import axios from "axios";
import { Download, Link2, Monitor, Music, CheckCircle, Loader2, AlertCircle, Coffee, Heart } from "lucide-react";

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
    window.location.href = downloadUrl; // One-click trigger for higher retention
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
    <main className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center font-sans pb-24">
      {/* AD PILLAR LEFT */}
      <div className="fixed left-0 top-0 w-[160px] h-full hidden xl:flex items-center justify-center bg-white/5 border-r border-white/10">
        <p className="rotate-90 text-slate-600 font-bold tracking-[1em] uppercase text-xs">Advertisement</p>
      </div>

      {/* AD PILLAR RIGHT */}
      <div className="fixed right-0 top-0 w-[160px] h-full hidden xl:flex items-center justify-center bg-white/5 border-l border-white/10">
        <p className="rotate-90 text-slate-600 font-bold tracking-[1em] uppercase text-xs">Advertisement</p>
      </div>

      <div className="max-w-4xl w-full px-6 pt-12">
        <header className="flex flex-col items-center text-center mb-12">
          <img src="/logo.jpg" alt="Logo" className="w-[100px] h-[100px] rounded-2xl mb-6 shadow-2xl" />
          <h1 className="text-5xl font-black text-white">KING <span className="text-blue-500">DOWNLOADER</span></h1>
          <p className="text-slate-500 mt-2 text-xs uppercase tracking-widest">Fastest Video Downloader & High Quality MP3</p>
        </header>

        {/* INPUT */}
        <div className="relative group max-w-2xl mx-auto mb-10">
          <div className="relative flex items-center bg-[#0f172a] rounded-2xl p-2 border border-white/5">
            <Link2 className="ml-4 text-slate-500" />
            <input 
              className="flex-1 p-4 bg-transparent outline-none text-white"
              placeholder="Paste link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button onClick={handleAnalyze} className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-xl font-bold">
              {loading ? <Loader2 className="animate-spin" /> : "PROCESS"}
            </button>
          </div>
        </div>

        {/* PROGRESS & ADS */}
        {downloadProgress && (
          <div className="max-w-2xl mx-auto mb-10 text-center">
            {/* IN-STREAM AD PLACEHOLDER */}
            <div className="w-full h-[90px] bg-white/5 rounded-xl mb-4 flex items-center justify-center text-slate-700 text-xs italic">
              Display Ad Placeholder (728x90)
            </div>
            <div className="bg-[#0f172a] p-8 rounded-3xl border border-blue-500/20">
               <h3 className="text-xl font-bold mb-4">{downloadProgress.status === "Finished" ? "Finished!" : "Downloading..."}</h3>
               <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all" style={{width: `${downloadProgress.progress}%`}}></div>
               </div>
               <p className="mt-2 text-blue-400 font-bold">{Math.round(downloadProgress.progress)}%</p>
            </div>
          </div>
        )}

        {/* RESULT CARD */}
        {videoData && !downloadProgress && (
          <div className="grid md:grid-cols-2 gap-10 bg-white/[0.02] p-10 rounded-[2.5rem] border border-white/5">
            <img src={videoData.thumbnail} className="rounded-3xl aspect-video object-cover" alt="thumb" />
            <div className="flex flex-col justify-between">
              <h2 className="text-2xl font-bold mb-4">{videoData.title}</h2>
              <div className="space-y-3">
                {videoData.formats.map((f: any) => (
                  <button key={f.id} onClick={() => handleDownload(f.id)} className="w-full flex justify-between bg-white/5 hover:bg-blue-600 p-4 rounded-xl transition-all">
                    <span className="font-bold">{f.quality} MP4</span>
                    <Download size={18} />
                  </button>
                ))}
                <button onClick={() => handleDownload("mp3")} className="w-full flex justify-between bg-white/5 hover:bg-cyan-600 p-4 rounded-xl transition-all">
                  <span className="font-bold">320KBPS MP3</span>
                  <Music size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DONATION SECTION (BINANCE QR APPEAL) */}
        <section className="mt-20 bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border border-yellow-500/20 p-10 rounded-[2.5rem] text-center">
          <div className="flex justify-center mb-4"><Coffee className="text-yellow-500" size={40} /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Support King Downloader</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-6">We keep this service free and ad-light. If we helped you, consider donating 1 USDT to keep the servers running.</p>
          <div className="inline-block bg-white p-2 rounded-xl mb-4">
            {/* Replace this with your actual Binance QR Image path */}
            <img src="/binance_qr.png" alt="Binance QR" className="w-32 h-32" />
          </div>
          <p className="text-[10px] text-yellow-500 font-mono">Binance Pay ID: YOUR_ID_HERE</p>
        </section>

        {/* SEO CONTENT SECTION */}
        <section className="mt-24 border-t border-white/5 pt-12 text-slate-500 text-sm">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">How to download 1080p YouTube videos?</h3>
              <p>Simply paste the YouTube URL into the search bar above. King Downloader will analyze the link and provide you with high-quality MP4 options including Full HD 1080p. Click download, and the file will save directly to your computer.</p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">How to convert FB to MP3?</h3>
              <p>Paste your Facebook video link and select the "320KBPS MP3" option. Our engine extracts the high-fidelity audio stream and converts it instantly for your offline listening.</p>
            </div>
          </div>
        </section>
      </div>

      {/* STICKY FOOTER BANNER AD */}
      <footer className="fixed bottom-0 left-0 w-full h-20 bg-[#0f172a]/90 backdrop-blur-md border-t border-white/10 flex items-center justify-center z-50">
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
           <span>ADVERTISEMENT</span>
           <div className="w-[300px] md:w-[728px] h-[60px] bg-white/5 rounded flex items-center justify-center italic">
              Sticky Footer Ad Area
           </div>
           <button onClick={() => {}} className="p-1 hover:text-white">✕</button>
        </div>
      </footer>
    </main>
  );
}