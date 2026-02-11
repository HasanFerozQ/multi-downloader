"use client";
import { useState } from "react";
import axios from "axios";
import { Star, Zap, DollarSign, Target, CheckCircle2, XCircle, Loader2, Cpu, Activity, Layout, Eye } from "lucide-react";

interface AnalyzerData {
  title: string;
  channel_intelligence: any;
  seo_metrics: any;
  behavioral: any;
  technical: any;
  tags: string[];
}

export default function AnalyzerPage() {
  const [url, setUrl] = useState("");
  const [kw, setKw] = useState("");
  const [data, setData] = useState<AnalyzerData | null>(null);
  const [loading, setLoading] = useState(false);

  const onAnalyze = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/analyze/seo`, { params: { url, keyword: kw } });
      setData(res.data);
    } catch (e) { alert("Error"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#020617] p-6 max-w-7xl mx-auto pb-32 text-slate-300">
      <h1 className="text-4xl font-black text-white mb-10 text-center uppercase italic tracking-tighter">Video Intelligence</h1>

      <div className="bg-[#0f172a] p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-4 mb-12 shadow-2xl">
        <input className="flex-[2] bg-white/5 p-4 text-white text-sm outline-none rounded-2xl border border-white/5" placeholder="Video URL..." value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className="flex-1 bg-white/5 p-4 text-white text-sm outline-none rounded-2xl border border-white/5" placeholder="Target Keyword..." value={kw} onChange={(e) => setKw(e.target.value)} />
        <button onClick={onAnalyze} className="bg-blue-600 px-12 py-4 rounded-2xl text-white font-bold uppercase text-xs">
          {loading ? <Loader2 className="animate-spin" /> : "Run Full Audit"}
        </button>
      </div>

      {data && (
        <div className="space-y-10 animate-in fade-in duration-700">
          
          {/* CHANNEL INTELLIGENCE */}
          <section>
            <h3 className="text-blue-500 font-black uppercase text-xs tracking-widest mb-6">Channel Intelligence</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                <Star className="text-blue-500 mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase text-slate-500">Performance Grade</p>
                <h2 className="text-3xl font-black text-white">{data.channel_intelligence.grade}</h2>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                <Zap className="text-purple-500 mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase text-slate-500">Engagement</p>
                <h2 className="text-3xl font-black text-white">{data.channel_intelligence.engagement}%</h2>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center md:col-span-2 flex justify-around items-center">
                <div><p className="text-[10px] font-bold uppercase text-slate-500">Monthly</p><h2 className="text-xl font-black text-white">${data.channel_intelligence.earnings.monthly}</h2></div>
                <div><p className="text-[10px] font-bold uppercase text-slate-500">Views</p><h2 className="text-xl font-black text-white">{data.channel_intelligence.views.toLocaleString()}</h2></div>
              </div>
            </div>
          </section>

          {/* SEO & KEYWORD AUDIT */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-4">Overall SEO Score</p>
              <h2 className="text-6xl font-black text-blue-500">{data.seo_metrics.overall_score}%</h2>
            </div>
            <div className="lg:col-span-2 bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-6 flex items-center gap-2"><Target size={14}/> Keyword Presence Audit</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.seo_metrics.kw_audit).map(([key, val]) => (
                  <div key={key} className="bg-white/5 p-4 rounded-xl flex flex-col items-center">
                    <p className="text-[8px] font-bold uppercase mb-2">{key.replace('in_', '')}</p>
                    {val ? <CheckCircle2 className="text-green-500" size={16}/> : <XCircle className="text-red-500" size={16}/>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BEHAVIORAL & TECHNICAL SEPARATE METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Click Potential</p>
              <h2 className="text-3xl font-black text-white">{data.behavioral.click_potential} / 10</h2>
            </div>
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Resolution Health</p>
              <h2 className="text-3xl font-black text-white">{data.technical.res}</h2>
            </div>
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">FPS Optimization</p>
              <h2 className="text-3xl font-black text-white">{data.technical.fps} FPS</h2>
            </div>
          </div>

          {/* DETAILED SEO LIST */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Tag Score</p>
              <p className="text-xl font-black text-white">{data.seo_metrics.tag_score}%</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Hashtags</p>
              <p className="text-xl font-black text-white">{data.seo_metrics.hashtags_count}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Drop-off Risk</p>
              <p className="text-xl font-black text-orange-500">{data.behavioral.retention_risk}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">CTA Presence</p>
              <p className="text-xl font-black text-white">{data.behavioral.cta_detected ? "Detected" : "Missing"}</p>
            </div>
          </section>

        </div>
      )}
    </main>
  );
}