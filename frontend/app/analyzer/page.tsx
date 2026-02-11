// frontend/app/analyzer/page.tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { Search, DollarSign, Tag, FileText, BarChart } from "lucide-react";

export default function AnalyzerPage() {
  const [url, setUrl] = useState("");
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/analyze/seo`, { params: { url } });
      setSeoData(res.data);
    } catch (err) { alert("Failed to analyze."); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#020617] p-6 pt-10 flex flex-col items-center">
      <h1 className="text-3xl font-black text-white uppercase mb-8 tracking-tighter">Video <span className="text-indigo-500">Analyzer</span></h1>
      
      {/* Search Input */}
      <div className="w-full max-w-2xl bg-[#0f172a] p-2 rounded-2xl flex border border-white/5 mb-10">
        <input 
          className="flex-1 bg-transparent p-4 outline-none text-white text-sm"
          placeholder="Paste link to analyze SEO & Earnings..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleAnalyze} className="bg-indigo-600 hover:bg-indigo-500 px-8 rounded-xl text-white font-bold">
           {loading ? "..." : "ANALYZE"}
        </button>
      </div>

      {seoData && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Earnings Card */}
          <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-3xl flex flex-col items-center">
            <DollarSign className="text-green-400 mb-2" size={32} />
            <p className="text-xs text-green-400 font-bold uppercase">Est. Earnings</p>
            <h2 className="text-2xl font-black text-white">${seoData.earnings.low} - ${seoData.earnings.high}</h2>
          </div>

          {/* Metadata Card */}
          <div className="md:col-span-2 bg-white/5 border border-white/5 p-6 rounded-3xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Tag size={18} className="text-indigo-400"/> Tags & SEO</h3>
            <div className="flex flex-wrap gap-2">
              {seoData.tags.map((t: string) => (
                <span key={t} className="bg-indigo-500/10 text-indigo-300 text-[10px] px-3 py-1 rounded-full border border-indigo-500/20">#{t}</span>
              ))}
            </div>
          </div>

          {/* Description Analyzer */}
          <div className="md:col-span-3 bg-white/5 border border-white/5 p-6 rounded-3xl">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-400"/> Description</h3>
             <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed">{seoData.description}</p>
          </div>
        </div>
      )}
    </main>
  );
}