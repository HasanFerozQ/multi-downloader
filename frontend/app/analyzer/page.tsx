// frontend/app/analyzer/page.tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { DollarSign, Tag, FileText, BarChart, Loader2, Youtube, TrendingUp } from "lucide-react";

const BACKEND = "http://localhost:8000";

export default function AnalyzerPage() {
  const [url, setUrl] = useState("");
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setSeoData(null);
    try {
      const res = await axios.get(`${BACKEND}/analyze/seo`, { params: { url: url.trim() } });
      setSeoData(res.data);
    } catch (err) {
      alert("Analysis failed. Ensure the link is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] p-6 flex flex-col items-center">
      <header className="text-center mb-10 pt-4">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
          Video <span className="text-indigo-500 underline decoration-indigo-500/30">Analyzer</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Creator SEO & Revenue Intelligence</p>
      </header>
      
      {/* SEARCH INPUT */}
      <div className="w-full max-w-2xl bg-[#0f172a] p-2 rounded-2xl flex flex-col md:flex-row border border-white/5 mb-12 shadow-2xl gap-2">
        <input 
          className="flex-1 bg-transparent p-4 outline-none text-white text-sm"
          placeholder="Paste YouTube link for SEO audit..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
        />
        <button onClick={handleAnalyze} className="bg-indigo-600 hover:bg-indigo-500 px-10 py-4 rounded-xl text-white font-bold transition-all uppercase text-xs">
           {loading ? <Loader2 className="animate-spin mx-auto" /> : "Audit Video"}
        </button>
      </div>

      {seoData && (
        <div className="w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* EARNINGS CARD  */}
            <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl">
              <DollarSign className="text-green-400 mb-2" size={40} />
              <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1">Est. Revenue</p>
              <h2 className="text-3xl font-black text-white">${seoData.earnings.low} - ${seoData.earnings.high}</h2>
            </div>

            {/* PERFORMANCE DATA */}
            <div className="md:col-span-2 bg-white/5 border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-center">
              <h3 className="text-white font-bold text-lg mb-4 italic line-clamp-1">{seoData.title}</h3>
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">Engagement</p>
                  <p className="text-xl font-black text-white">{seoData.view_count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">Duration</p>
                  <p className="text-xl font-black text-white">{seoData.duration}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TAGS SECTION  */}
          <div className="bg-[#0f172a] border border-white/5 p-10 rounded-[2.5rem] shadow-inner">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
              <TrendingUp size={18} className="text-indigo-400"/> Viral Keywords & SEO Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {seoData.tags.length > 0 ? seoData.tags.map((t: string) => (
                <span key={t} className="bg-indigo-600/5 text-slate-300 text-[10px] px-4 py-2 rounded-lg border border-white/5 hover:border-indigo-500 transition cursor-default">
                  {t}
                </span>
              )) : <p className="text-slate-600 text-[10px] uppercase font-bold italic">No tags extracted.</p>}
            </div>
          </div>
        </div>

        
      )}

      {/* New Social Blade Stats Grid */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
  {/* GRADE CARD */}
  <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl text-center">
    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Channel Grade</p>
    <h2 className="text-4xl font-black text-white">{seoData.grade}</h2>
  </div>

  {/* ENGAGEMENT CARD */}
  <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-3xl text-center">
    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Engagement Rate</p>
    <h2 className="text-4xl font-black text-white">{seoData.engagement_rate}%</h2>
  </div>

  {/* EARNINGS CARD (Expanded) */}
  <div className="md:col-span-2 bg-green-500/10 border border-green-500/20 p-6 rounded-3xl flex justify-around items-center">
    <div className="text-center">
      <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1">Monthly Est.</p>
      <h2 className="text-2xl font-black text-white">${seoData.earnings.low} - ${seoData.earnings.high}</h2>
    </div>
    <div className="text-center border-l border-white/10 pl-6">
      <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest mb-1">Yearly Est.</p>
      <h2 className="text-2xl font-black text-white">${(seoData.earnings.low * 12).toFixed(2)}</h2>
    </div>
  </div>
</div>
    </main>
  );
}