"use client";

import { useState } from "react";
import { scoreColor, fmtNum, fmt } from "./analyzer/utils";
import { MasterCard, SubMetricRow } from "./analyzer/components";
import dynamic from 'next/dynamic';
import {
  Zap, Search, Clock, Rocket, Settings, BarChart, Brain, MousePointer,
  TrendingUp, Tag, Lightbulb, Info
} from "lucide-react";

// Dynamic import for performance
// No need for ConvertorSection anymore
const DetailedAnalysisSection = dynamic(() => import('./analyzer/DetailedAnalysisSection'), {
  loading: () => <p className="text-center p-10 text-slate-500">Loading detailed metrics...</p>,
  ssr: false
});

// ─── Type Definitions ────────────────────────────────────────────────────────

interface SubMetrics {
  title_performance_score?: number;
  ctr_predictor?: number;
  title_sentiment?: string;
  thumbnail_title_alignment?: number;
  hook_strength?: number;
  hook_strength_first_15s?: number;
  keyword_density_map?: number;
  description_structure_score?: number;
  tag_quality_score?: number;
  searchability_index?: number;
  keyword_difficulty_score?: number;
  pacing_score?: number;
  content_structure_completeness?: number;
  engagement_signal_density?: number;
  drop_off_risk_label?: string;
  drop_off_risk_score?: number;
  watch_time_optimization?: number;
  emotional_intensity_index?: number;
  shareability_score?: number;
  trend_alignment_score?: number;
  controversy_meter?: number;
  video_length_optimization?: number;
  metadata_completeness?: number;
  upload_timing_score?: number;
  title_uniqueness_score?: number;
  duration_benchmarking?: string;
  curiosity_gap_score?: number;
  authority_signals?: number;
  relatability_index?: number;
  cta_strength_score?: number;
  subscription_trigger_score?: number;
}

interface Section {
  master_score: number;
  sub_metrics: SubMetrics;
  ctr_label?: string;
  ctr_reason?: string;
  viral_probability?: string;
  emotional_triggers?: Record<string, number>;
  trending_topics?: string;
  main_keyword?: string;
  keyword_position?: string;
  keyword_difficulty_label?: string;
  seo_overall?: number;
  upload_timing_label?: string;
  duration_formatted?: string;
  retention_risks?: string[];
}

interface AnalysisResult {
  title: string;
  thumbnail: string;
  uploader: string;
  platform: string;
  duration: number;
  views: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  engagement_rate: number;
  overall_score: number;
  grade: string;
  click_potential: number;
  seo_score: number;
  retention_score: number;
  viral_score: number;
  technical_score: number;
  viral_probability: string;
  metrics: {
    title_score: number;
    title_length: number;
    ctr_prediction: string;
    ctr_reason: string;
    title_sentiment: string;
    hook_strength: number;
    main_keyword: string;
    keyword_position: string;
    seo_overall: number;
    keyword_score: number;
    tag_count: number;
    description_length: number;
    description_score: number;
    tag_score: number;
    pacing_score: number;
    engagement_density: number;
    structure_score: number;
    retention_risks: string[];
    shareability_score: number;
    trend_score: number;
    trending_topics: string;
    emotional_triggers: Record<string, number>;
    upload_timing: string;
    duration_formatted: string;
    cta_strength: number;
    subscription_trigger: number;
  };
  sections: {
    click_potential: Section;
    seo_strength: Section;
    retention: Section;
    virality: Section;
    technical: Section;
    cta: Section;
    competitive: Section;
    audience_psychology: Section;
  };
  metadata: {
    tag_count: number;
    description_length: number;
    hashtag_count: number;
    timestamp_count: number;
  };
  recommendations: Array<{
    priority: string;
    title: string;
    suggestion: string;
  }>;
  vph?: number;
  tags?: string[];
  reality_check?: {
    boosts: string[];
  };
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VideoAnalyzerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!url.trim()) { setError("Please enter a YouTube URL"); return; }
    setLoading(true);
    setError("");
    setResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      // Use standard localhost for now, or use NEXT_PUBLIC_API_URL if configured
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/analyze-video?url=${encodeURIComponent(url)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 500) throw new Error("Server error (500). Please try again later.");
        if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
        if (res.status === 404) throw new Error("Video not found. Check the URL.");
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError("Analysis timed out. The video might be too long or the server is busy.");
      } else {
        setError(err.message || "Backend connection failed. Make sure the server is running on port 8000.");
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const s = result?.sections;

  return (
    <main className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-indigo-950 text-white font-sans p-5">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <h1 className="text-center text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          📊 Video Analyzer Metrics Dashboard
        </h1>
        <p className="text-center text-slate-400 mb-8 text-lg">
          5 master scores · 31 sub-metrics · Real data from your video
        </p>

        {/* ── URL Input ── */}
        <div className="bg-white/5 border border-indigo-500/50 rounded-2xl p-6 mb-7">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder="Paste YouTube URL here..."
              className="flex-1 min-w-[260px] p-4 rounded-xl bg-white/5 border border-indigo-400/40 text-white text-lg outline-none focus:border-indigo-400 transition-colors"
            />
            <button
              onClick={analyze}
              disabled={loading}
              className={`px-8 py-3.5 rounded-xl font-bold text-lg tracking-wide transition-all ${loading ? "bg-slate-700 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 active:scale-95"
                }`}
            >
              {loading ? "⏳ Analyzing..." : "🔍 Analyze"}
            </button>
          </div>
          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-red-400 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* ── 1. VIDEO INFO ── */}
            <div className="bg-white/5 border border-indigo-500/50 rounded-2xl p-6 mb-7">
              <h2 className="text-indigo-400 mb-4 text-xl font-bold flex items-center gap-2">📹 VIDEO INFORMATION</h2>
              <div className="flex gap-5 flex-wrap items-start">
                {result.thumbnail && (
                  <img src={result.thumbnail} alt="Thumbnail" className="w-[200px] rounded-xl shadow-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-[240px]">
                  <div className="text-xl font-bold mb-3">{result.title}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      ["⏱️ Duration", result.metrics.duration_formatted],
                      ["👁️ Views", fmtNum(result.views)],
                      ["👍 Likes", fmtNum(result.like_count)],
                      ["💬 Comments", fmtNum(result.comment_count)],
                      ["📊 Engagement", `${result.engagement_rate}%`],
                      ["📅 Platform", result.platform],
                      ["👤 Uploader", result.uploader],
                      ["🏷️ Tags", `${result.metadata.tag_count} tags`],
                      ["📝 Description", `${result.metadata.description_length} chars`],
                      ["# Hashtags", `${result.metadata.hashtag_count}`],
                      ["🕐 Timestamps", `${result.metadata.timestamp_count}`],
                    ].map(([label, val]) => (
                      <div key={label as string} className="bg-indigo-500/10 p-2.5 rounded-lg border-l-2 border-indigo-500">
                        <div className="text-slate-400 text-xs mb-1">{label}</div>
                        <div className="text-indigo-400 font-bold">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2. PERFORMANCE DASHBOARD ── */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 border-indigo-500 rounded-2xl p-8 mb-7 shadow-[0_10px_40px_rgba(99,102,241,0.2)]">
              <h2 className="text-center text-2xl font-bold mb-5 tracking-tight">🎯 PERFORMANCE DASHBOARD</h2>

              <div className="text-center mb-7">
                <div className="text-7xl font-black mb-2" style={{ color: scoreColor(result.overall_score) }}>{result.overall_score}</div>
                <div className="text-slate-400 text-lg">OVERALL VIDEO SCORE / 100 · Grade: <strong style={{ color: scoreColor(result.overall_score) }}>{result.grade}</strong></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="md:contents">
                  <MasterCard icon="⚡" label="Click Potential" score={result.click_potential} subtitle="Will people click?" active={false} onClick={() => { }} />
                  <MasterCard icon="🔍" label="SEO Strength" score={result.seo_score} subtitle="Can it be found?" active={false} onClick={() => { }} />
                  <MasterCard icon="⏱️" label="Retention" score={result.retention_score} subtitle="Will they watch?" active={false} onClick={() => { }} />
                  <MasterCard icon="🚀" label="Viral Probability" score={result.viral_score} subtitle="Can it go viral?" active={false} onClick={() => { }} />
                  <MasterCard icon="⚙️" label="Technical" score={result.technical_score} subtitle="Is it optimized?" active={false} onClick={() => { }} />
                </div>
              </div>
            </div>

            {/* ── 2.5 AUTHENTIC INSIGHTS ── */}
            <div className="bg-white/5 border border-indigo-500/50 rounded-2xl p-6 mb-7">
              <h2 className="text-indigo-400 mb-4 text-xl font-bold flex items-center gap-2">🚀 GENUINE INSIGHTS & REALITY CHECK</h2>

              {/* Reality Check Banner */}
              {result.reality_check && result.reality_check.boosts && result.reality_check.boosts.length > 0 && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-2">
                    <TrendingUp size={20} />
                    Performance Boost Active
                  </h3>
                  <div className="space-y-1">
                    {result.reality_check.boosts.map((boost, i) => (
                      <div key={i} className="text-emerald-200 text-sm flex items-center gap-2">
                        ✨ {boost}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-emerald-500/60 mt-2">
                    * Because this video is performing well in the real world, we've adjusted its scores to match reality, ignoring some theoretical rules.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* VPH Card */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-indigo-500/30">
                  <div className="flex items-center gap-2 mb-2 text-indigo-300">
                    <Clock size={18} />
                    <span className="font-bold">Velocity (VPH)</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-bold text-white">
                      {result.vph?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-slate-400 mb-1">views/hour</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {Number(result.vph) > 1000 ? "🔥 Viral velocity" : Number(result.vph) > 100 ? "⚡ High velocity" : "Standard velocity"}
                  </div>
                </div>

                {/* Engagement Card */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-indigo-500/30">
                  <div className="flex items-center gap-2 mb-2 text-pink-300">
                    <Brain size={18} />
                    <span className="font-bold">Real Engagement Score</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-bold text-white">
                      {result.engagement_rate}%
                    </div>
                    <div className="text-sm text-slate-400 mb-1">likes & comments / views</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Industry avg: ~3-4%
                  </div>
                </div>
              </div>

              {/* Tags Cloud */}
              {result.tags && result.tags.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3 text-slate-300">
                    <Tag size={16} />
                    <span className="font-bold text-sm uppercase tracking-wider">Video Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-full text-sm border border-indigo-500/20 transition-colors cursor-default">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── 3. DETAILED ANALYSIS (VERTICAL SECTIONS) ── */}
            <div className="space-y-6 mb-8">
              {/* Helper to render sub-metrics as cards */}
              {([
                { id: 'click_potential', icon: Zap, label: 'Click Potential Metrics', count: 5 },
                { id: 'seo_strength', icon: Search, label: 'SEO Strength Metrics', count: 5 },
                { id: 'retention', icon: Clock, label: 'Retention & Watchability', count: 6 },
                { id: 'virality', icon: Rocket, label: 'Virality Potential', count: 4 },
                { id: 'technical', icon: Settings, label: 'Technical Quality', count: 3 },
                { id: 'competitive', icon: BarChart, label: 'Competitive Intelligence', count: 3 },
                { id: 'audience_psychology', icon: Brain, label: 'Audience Psychology', count: 3 },
                { id: 'cta', icon: MousePointer, label: 'Call-to-Action', count: 2 },
              ] as const).map((section) => {
                const s = result.sections; // Define s here for the new structure
                const sectionData = s[section.id];
                // Map sub-metrics for this section
                // We manually construct the list based on the type definition to ensure order
                let metrics: { name: string, value: any, max?: number }[] = [];

                if (section.id === 'click_potential') {
                  metrics = [
                    { name: "Title Performance", value: sectionData.sub_metrics.title_performance_score },
                    { name: "CTR Predictor", value: sectionData.sub_metrics.ctr_predictor, max: 10 },
                    { name: "Hook Strength", value: sectionData.sub_metrics.hook_strength, max: 10 },
                    { name: "Thumbnail-Title", value: sectionData.sub_metrics.thumbnail_title_alignment },
                    { name: "Title Sentiment", value: sectionData.sub_metrics.title_sentiment },
                  ];
                } else if (section.id === 'seo_strength') {
                  metrics = [
                    { name: "Keyword Density", value: sectionData.sub_metrics.keyword_density_map },
                    { name: "Desc. Structure", value: sectionData.sub_metrics.description_structure_score },
                    { name: "Tag Quality", value: sectionData.sub_metrics.tag_quality_score },
                    { name: "Searchability", value: sectionData.sub_metrics.searchability_index },
                    { name: `Difficulty (${sectionData.keyword_difficulty_label || 'N/A'})`, value: sectionData.sub_metrics.keyword_difficulty_score },
                  ];
                } else if (section.id === 'retention') {
                  metrics = [
                    { name: "Pacing Score", value: sectionData.sub_metrics.pacing_score },
                    { name: "Hook (First 15s)", value: sectionData.sub_metrics.hook_strength_first_15s, max: 10 },
                    { name: "Structure", value: sectionData.sub_metrics.content_structure_completeness },
                    { name: "Engagement Density", value: sectionData.sub_metrics.engagement_signal_density, max: 10 },
                    { name: `Drop-off Risk`, value: sectionData.sub_metrics.drop_off_risk_score, max: 10 },
                    { name: "Watch Time Opt.", value: sectionData.sub_metrics.watch_time_optimization },
                  ];
                } else if (section.id === 'virality') {
                  metrics = [
                    { name: "Emotional Intensity", value: sectionData.sub_metrics.emotional_intensity_index, max: 10 },
                    { name: "Shareability", value: sectionData.sub_metrics.shareability_score },
                    { name: "Trend Alignment", value: sectionData.sub_metrics.trend_alignment_score },
                    { name: "Controversy", value: sectionData.sub_metrics.controversy_meter, max: 10 },
                  ];
                } else if (section.id === 'technical') {
                  metrics = [
                    { name: "Length Optimization", value: sectionData.sub_metrics.video_length_optimization },
                    { name: "Metadata Complete", value: sectionData.sub_metrics.metadata_completeness },
                    { name: `Upload Timing`, value: sectionData.sub_metrics.upload_timing_score },
                  ];
                } else if (section.id === 'competitive') {
                  metrics = [
                    { name: "Title Uniqueness", value: sectionData.sub_metrics.title_uniqueness_score },
                    { name: "Duration Bench.", value: sectionData.sub_metrics.duration_benchmarking },
                    { name: "Keyword Diff.", value: sectionData.sub_metrics.keyword_difficulty_score },
                  ];
                } else if (section.id === 'audience_psychology') {
                  metrics = [
                    { name: "Curiosity Gap", value: sectionData.sub_metrics.curiosity_gap_score, max: 10 },
                    { name: "Authority Signals", value: sectionData.sub_metrics.authority_signals },
                    { name: "Relatability", value: sectionData.sub_metrics.relatability_index },
                  ];
                } else if (section.id === 'cta') {
                  metrics = [
                    { name: "CTA Strength", value: sectionData.sub_metrics.cta_strength_score },
                    { name: "Sub Trigger", value: sectionData.sub_metrics.subscription_trigger_score, max: 10 },
                  ];
                }

                return (
                  <div key={section.id} className="bg-slate-900/50 border border-indigo-500/30 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-white/5 p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <section.icon size={24} className="text-indigo-400" />
                        <h3 className="text-xl font-bold text-white">{section.label}</h3>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">{metrics.length} metrics</span>
                      </div>
                    </div>

                    {/* Grid of Cards */}
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {metrics.map((m, idx) => {
                        if (m.value === undefined || m.value === null) return null;
                        const isText = typeof m.value === 'string';
                        const numVal = isText ? 0 : (m.value as number);
                        const displayVal = isText ? m.value : fmt(numVal, m.max);
                        const color = isText ? "#818cf8" : scoreColor(numVal, m.max || 100);

                        return (
                          <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center text-center hover:border-indigo-500/50 transition-all group">
                            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 h-8 flex items-center justify-center">{m.name}</div>
                            <div
                              className="text-2xl font-black transition-all group-hover:scale-110"
                              style={{ color: color, textShadow: `0 0 10px ${color}40` }}
                            >
                              {displayVal}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Insights & Tips — beautiful cards */}
                    {section.id === 'retention' && result.metrics.retention_risks?.length > 0 && (
                      <div className="mx-6 mb-6 space-y-2.5">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb size={16} className="text-amber-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Insights & Tips</span>
                        </div>
                        {result.metrics.retention_risks.map((r, i) => (
                          <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg border-l-[3px] border-l-amber-400 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 transition-all hover:translate-x-1 duration-200">
                            <Lightbulb size={16} className="flex-shrink-0 mt-0.5 text-amber-400" />
                            <span className="text-sm font-medium leading-relaxed text-amber-200">{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {section.id === 'click_potential' && result.metrics.ctr_reason && (
                      <div className="mx-6 mb-6">
                        <div className="flex items-start gap-3 p-3.5 rounded-lg border-l-[3px] border-l-indigo-400 bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 border border-indigo-500/30 transition-all hover:translate-x-1 duration-200">
                          <Info size={16} className="flex-shrink-0 mt-0.5 text-indigo-400" />
                          <span className="text-sm font-medium leading-relaxed text-indigo-200">CTR Assessment: {result.metrics.ctr_reason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── 4. RECOMMENDATIONS ── */}
            {result.recommendations?.length > 0 && (
              <div className="bg-white/5 border border-indigo-500/30 rounded-2xl p-6 mt-6">
                <h3 className="text-indigo-400 mb-4 text-xl font-bold flex items-center gap-2">💡 Action Items & Recommendations</h3>
                <div className="grid gap-3">
                  {result.recommendations.map((rec, i) => {
                    const borderColor = rec.priority === "high" ? "#ef4444" : rec.priority === "medium" ? "#f59e0b" : "#10b981";
                    const bgColor = rec.priority === "high" ? "rgba(239,68,68,0.07)" : rec.priority === "medium" ? "rgba(245,158,11,0.07)" : "rgba(16,185,129,0.07)";
                    return (
                      <div key={i} className="p-4 rounded-xl border-l-[4px]" style={{ borderColor, background: bgColor }}>
                        <div className="flex gap-4 items-start">
                          <span className="text-2xl">{rec.priority === "high" ? "🔴" : rec.priority === "medium" ? "🟡" : "🟢"}</span>
                          <div>
                            <div className="font-bold mb-1">{rec.title}</div>
                            <div className="text-slate-400 text-sm mb-2">{rec.suggestion}</div>
                            <span
                              className="inline-block text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider"
                              style={{ background: `${borderColor}22`, color: borderColor }}
                            >
                              {rec.priority} PRIORITY
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SUMMARY NOTE ── */}
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mt-6 rounded-lg text-amber-500 text-sm leading-relaxed">
              <strong>📋 COLOR GUIDE:</strong><br />
              <span className="text-emerald-500">● Green (75–100)</span> = Excellent &nbsp;
              <span className="text-blue-500">● Blue (50–74)</span> = Good &nbsp;
              <span className="text-amber-500">● Orange (30–49)</span> = Average &nbsp;
              <span className="text-red-500">● Red (0–29)</span> = Needs work
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            {[
              { icon: "🎯", title: "31 Sub-Metrics", desc: "Every ranking factor analysed in depth" },
              { icon: "⚡", title: "5 Master Scores", desc: "Click, SEO, Retention, Viral, Technical" },
              { icon: "📋", title: "Actionable Fixes", desc: "Prioritised recommendations to improve rank" },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-indigo-500/30 rounded-2xl p-8 text-center hover:bg-white/10 transition-colors">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="font-bold text-lg mb-2">{item.title}</div>
                <div className="text-slate-400 text-sm">{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
