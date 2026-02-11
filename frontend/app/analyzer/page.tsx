"use client";
import { useState } from "react";
import axios from "axios";
import { Star, Zap, Target, CheckCircle2, XCircle, Loader2, Cpu, Activity, Eye, TrendingUp, Layout } from "lucide-react";

export default function AnalyzerPage() {
  const [url, setUrl] = useState("");
  const [kw, setKw] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setData(null);
    try {
      const res = await axios.get(`http://localhost:8000/analyze/seo`, { params: { url, keyword: kw } });
      setData(res.data);
    } catch (e) { 
      alert("Error contacting the Intelligence Server.");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] p-6 max-w-7xl mx-auto pb-32 text-slate-300">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Video Intelligence Dashboard</h1>
      </header>

      {/* SEARCH BAR */}
      <div className="bg-[#0f172a] p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-4 mb-12 shadow-2xl">
        <input className="flex-[2] bg-white/5 p-4 text-white text-sm outline-none rounded-2xl border border-white/5 focus:border-blue-500" placeholder="Paste Video Link..." value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className="flex-1 bg-white/5 p-4 text-white text-sm outline-none rounded-2xl border border-white/5 focus:border-blue-500" placeholder="Keyword..." value={kw} onChange={(e) => setKw(e.target.value)} />
        <button onClick={onAnalyze} className="bg-blue-600 hover:bg-blue-500 px-12 py-4 rounded-2xl text-white font-bold uppercase text-xs transition-all">
          {loading ? <Loader2 className="animate-spin mx-auto" size={18}/> : "Audit Video"}
        </button>
      </div>

      {data && (
        <div className="space-y-10 animate-in fade-in duration-700">
          
          {/* SECTION 1: CHANNEL INTELLIGENCE */}
          <section>
            <h3 className="text-blue-500 font-black uppercase text-[10px] tracking-widest mb-4">Channel Intelligence</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                <Star className="text-blue-500 mx-auto mb-2" size={24} />
                <p className="text-[10px] font-bold text-slate-500 uppercase">Grade</p>
                <h2 className="text-4xl font-black text-white">{data.channel_intelligence?.grade}</h2>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                <Zap className="text-purple-500 mx-auto mb-2" size={24} />
                <p className="text-[10px] font-bold text-slate-500 uppercase">Engagement</p>
                <h2 className="text-4xl font-black text-white">{data.channel_intelligence?.engagement}%</h2>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 md:col-span-2 flex justify-around items-center">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Monthly Earnings</p>
                  <h2 className="text-2xl font-black text-white">${data.channel_intelligence?.earnings?.monthly}</h2>
                </div>
                <div className="text-center border-l border-white/10 pl-8">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Views</p>
                  <h2 className="text-2xl font-black text-white">{data.channel_intelligence?.views?.toLocaleString()}</h2>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: SEO AUDIT */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Overall SEO Score</p>
              <h2 className="text-7xl font-black text-blue-500">{data.seo_metrics?.overall_score}%</h2>
            </div>
            <div className="lg:col-span-2 bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-8 flex items-center gap-2 tracking-widest"><Target size={14}/> Keyword Presence Audit</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.seo_metrics?.kw_audit || {}).map(([key, val]) => (
                  <div key={key} className="bg-white/5 p-4 rounded-2xl flex flex-col items-center border border-white/5">
                    <p className="text-[9px] font-bold uppercase mb-2 text-slate-400">{key}</p>
                    {val ? <CheckCircle2 className="text-green-500" size={20}/> : <XCircle className="text-red-500" size={20}/>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: TECHNICAL & BEHAVIORAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-2 mb-4"><Eye className="text-blue-400" size={18}/> <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Click Potential</p></div>
                <h2 className="text-4xl font-black text-white">{data.behavioral?.click_potential} / 10</h2>
             </div>
             <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-2 mb-4"><Cpu className="text-indigo-400" size={18}/> <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Resolution Health</p></div>
                <h2 className="text-4xl font-black text-white">{data.technical?.res}</h2>
             </div>
             <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-2 mb-4"><Activity className="text-green-400" size={18}/> <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">FPS Optimization</p></div>
                <h2 className="text-4xl font-black text-white">{data.technical?.fps} FPS</h2>
             </div>
          </div>

          {/* SECTION 4: DETAILED LISTS */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Tag Score</p>
                <p className="text-xl font-black text-white">{data.seo_metrics?.tag_score}%</p>
             </div>
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Hashtags count</p>
                <p className="text-xl font-black text-white">{data.seo_metrics?.hashtags_count}</p>
             </div>
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Drop-off Risk</p>
                <p className={`text-xl font-black ${data.behavioral?.retention_risk === 'High' ? 'text-red-500' : 'text-green-500'}`}>{data.behavioral?.retention_risk}</p>
             </div>
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">CTA Presence</p>
                <p className="text-xl font-black text-white">{data.behavioral?.cta_detected ? "Detected" : "Missing"}</p>
             </div>
          </section>

          {/* SECTION 5: TAGS */}
          <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5">
             <h3 className="text-white font-black uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Tag Cloud</h3>
             <div className="flex flex-wrap gap-2">
                {data.tags?.map((t: string) => (
                  <span key={t} className="bg-white/5 text-slate-300 text-[10px] px-4 py-2 rounded-xl border border-white/10">#{t}</span>
                ))}
             </div>
          </div>

        </div>
      )}
    </main>
  );
}