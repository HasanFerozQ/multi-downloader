// frontend/app/page.tsx
"use client";
import { useState } from "react";
import { Search, BarChart3, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import DonationSection from "@/components/DonationSection";

interface AnalysisResult {
  score: number;
  grade: string;
  title: string;
  view_count: number;
  like_count: number;
  engagement_rate: number;
  issues: Array<{
    category: string;
    impact: number;
    message: string;
  }>;
  strengths: Array<{
    category: string;
    message: string;
  }>;
  suggestions: string[];
  metadata: {
    tag_count: number;
    description_length: number;
    hashtag_count: number;
    timestamp_count: number;
  };
}

export default function VideoAnalyzerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const analyzeVideo = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`http://localhost:8000/analyze-video?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Failed to analyze video. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return "from-green-600/20 to-emerald-600/10 border-green-500/20";
    if (score >= 70) return "from-yellow-600/20 to-amber-600/10 border-yellow-500/20";
    return "from-red-600/20 to-rose-600/10 border-red-500/20";
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        
        {/* HERO SECTION */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 px-4 py-2 rounded-full mb-6">
            <BarChart3 className="text-blue-400" size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Video SEO Analyzer</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
            Optimize Your YouTube Videos
          </h1>
          
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Get comprehensive SEO analysis with 15+ checks. Improve your rankings, engagement, and visibility.
          </p>
        </div>

        {/* INPUT SECTION */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeVideo()}
              placeholder="Paste YouTube URL here..."
              className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              onClick={analyzeVideo}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Analyze
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* SCORE CARD */}
            <div className={`bg-gradient-to-br ${getScoreBg(result.score)} border rounded-2xl p-8`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{result.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>👁️ {result.view_count.toLocaleString()} views</span>
                    <span>👍 {result.like_count.toLocaleString()} likes</span>
                    <span>📊 {result.engagement_rate}% engagement</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-7xl font-black ${getScoreColor(result.score)}`}>
                    {result.score}
                  </div>
                  <div className="text-sm text-slate-400 uppercase tracking-widest mt-2">
                    Grade: {result.grade}
                  </div>
                </div>
              </div>
            </div>

            {/* METADATA */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Tags", value: result.metadata.tag_count, icon: "🏷️" },
                { label: "Description", value: `${result.metadata.description_length} chars`, icon: "📝" },
                { label: "Hashtags", value: result.metadata.hashtag_count, icon: "#️⃣" },
                { label: "Timestamps", value: result.metadata.timestamp_count, icon: "⏱️" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-slate-400 text-xs uppercase">{item.label}</div>
                  <div className="text-white font-bold">{item.value}</div>
                </div>
              ))}
            </div>

            {/* ISSUES */}
            {result.issues.length > 0 && (
              <div className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={24} />
                  Issues to Fix ({result.issues.length})
                </h3>
                <div className="space-y-3">
                  {result.issues.map((issue, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border-l-4 border-red-500">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-slate-300 text-sm flex-1">{issue.message}</p>
                        <span className="text-xs text-red-400 font-mono bg-red-500/10 px-2 py-1 rounded">
                          {issue.impact} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STRENGTHS */}
            {result.strengths.length > 0 && (
              <div className="bg-slate-900/50 border border-green-500/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" size={24} />
                  Strengths ({result.strengths.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {result.strengths.map((strength, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-xl p-3 border-l-4 border-green-500">
                      <p className="text-slate-300 text-sm">{strength.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUGGESTIONS */}
            {result.suggestions.length > 0 && (
              <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-blue-400" size={24} />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {result.suggestions.map((suggestion, idx) => (
                    <p key={idx} className="text-slate-300 text-sm">{suggestion}</p>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* DONATION SECTION - Shows after analysis or standalone */}
        <DonationSection />

      </div>
    </div>
  );
}
