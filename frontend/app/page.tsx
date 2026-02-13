"use client";
import { useState } from "react";

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
}

// ─── Utility Functions ────────────────────────────────────────────────────────

function scoreClass(score: number, max = 100): string {
  const pct = (score / max) * 100;
  if (pct >= 75) return "excellent";
  if (pct >= 50) return "good";
  if (pct >= 30) return "average";
  return "poor";
}

function scoreColor(score: number, max = 100): string {
  const cls = scoreClass(score, max);
  if (cls === "excellent") return "#10b981";
  if (cls === "good") return "#3b82f6";
  if (cls === "average") return "#f59e0b";
  return "#ef4444";
}

function fillGradient(score: number, max = 100): string {
  const cls = scoreClass(score, max);
  if (cls === "excellent") return "linear-gradient(90deg,#10b981,#34d399)";
  if (cls === "good") return "linear-gradient(90deg,#3b82f6,#60a5fa)";
  if (cls === "average") return "linear-gradient(90deg,#f59e0b,#fbbf24)";
  return "linear-gradient(90deg,#ef4444,#f87171)";
}

function fmt(n: number | undefined | null, max = 100): string {
  if (n === undefined || n === null) return "N/A";
  return max === 10 ? `${n}/10` : `${n}/100`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", marginTop: 8 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: fillGradient(value, max), borderRadius: 10, transition: "width 0.8s ease" }} />
    </div>
  );
}

function SubMetricRow({ name, value, max = 100 }: { name: string; value: number | string | undefined; max?: number }) {
  if (value === undefined || value === null) return null;
  const isText = typeof value === "string";
  const numVal = isText ? 0 : (value as number);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 15px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #667eea", marginBottom: 8 }}>
      <span style={{ color: "#ccc", fontSize: "0.95em" }}>{name}</span>
      <span style={{ fontWeight: "bold", color: isText ? "#667eea" : scoreColor(numVal, max), fontSize: "1.1em" }}>
        {isText ? value : fmt(numVal, max)}
      </span>
    </div>
  );
}

function ExpandableSection({ title, icon, children, defaultOpen = false }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ background: "rgba(102,126,234,0.2)", padding: "15px 20px", borderRadius: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: "2px solid rgba(102,126,234,0.5)", transition: "background 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(102,126,234,0.32)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(102,126,234,0.2)")}
      >
        <span style={{ fontSize: "1.1em", fontWeight: "bold" }}>{icon} {title}</span>
        <span style={{ fontSize: "1.4em", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>▼</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(102,126,234,0.3)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MasterCard({ icon, label, score, subtitle, active, onClick }: {
  icon: string; label: string; score: number; subtitle: string; active: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{ background: "rgba(255,255,255,0.05)", borderRadius: 15, padding: "20px 15px", textAlign: "center", border: `2px solid ${active ? "#667eea" : "transparent"}`, cursor: "pointer", transition: "all 0.25s", boxShadow: active ? "0 8px 24px rgba(102,126,234,0.4)" : "none" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "rgba(102,126,234,0.5)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ fontSize: "2.5em", marginBottom: 8 }}>{icon}</div>
      <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: "2.2em", fontWeight: "bold", color: scoreColor(score, 10) }}>{Math.round(score * 10)}</div>
      <ScoreBar value={score} max={10} />
      <div style={{ fontSize: "0.8em", color: "#888", marginTop: 8 }}>{subtitle}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VideoAnalyzerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const analyze = async () => {
    if (!url.trim()) { setError("Please enter a YouTube URL"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    setActiveSection(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const res = await fetch(`http://localhost:8000/analyze-video?url=${encodeURIComponent(url)}`, {
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
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)", fontFamily: "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif", padding: "20px", color: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ── */}
        <h1 style={{ textAlign: "center", fontSize: "2.4em", marginBottom: 8, background: "linear-gradient(90deg,#667eea 0%,#764ba2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          📊 Video Analyzer Metrics Dashboard
        </h1>
        <p style={{ textAlign: "center", color: "#aaa", marginBottom: 32, fontSize: "1.05em" }}>
          5 master scores · 31 sub-metrics · Real data from your video
        </p>

        {/* ── URL Input ── */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "2px solid #667eea", borderRadius: 15, padding: 24, marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder="Paste YouTube URL here..."
              style={{ flex: 1, minWidth: 260, padding: "14px 18px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(102,126,234,0.4)", color: "white", fontSize: "1em", outline: "none" }}
            />
            <button
              onClick={analyze}
              disabled={loading}
              style={{ padding: "14px 32px", background: loading ? "#334" : "linear-gradient(90deg,#667eea,#764ba2)", border: "none", borderRadius: 10, color: "white", fontWeight: "bold", fontSize: "1em", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.05em", transition: "opacity 0.2s" }}
            >
              {loading ? "⏳ Analyzing..." : "🔍 Analyze"}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "12px 16px", color: "#f87171" }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {result && (
          <>
            {/* ── VIDEO INFO ── */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "2px solid #667eea", borderRadius: 15, padding: 24, marginBottom: 28 }}>
              <h2 style={{ color: "#667eea", marginBottom: 16, fontSize: "1.2em" }}>📹 VIDEO INFORMATION</h2>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
                {result.thumbnail && (
                  <img src={result.thumbnail} alt="Thumbnail" style={{ width: 200, borderRadius: 10, flexShrink: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }} />
                )}
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontSize: "1.15em", fontWeight: "bold", marginBottom: 14 }}>{result.title}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 10 }}>
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
                      <div key={label as string} style={{ background: "rgba(102,126,234,0.1)", padding: "10px 12px", borderRadius: 8, borderLeft: "3px solid #667eea" }}>
                        <div style={{ color: "#aaa", fontSize: "0.78em", marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: "1.05em", fontWeight: "bold", color: "#667eea" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── PERFORMANCE DASHBOARD ── */}
            <div style={{ background: "linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2))", border: "3px solid #667eea", borderRadius: 20, padding: 30, marginBottom: 28, boxShadow: "0 10px 40px rgba(102,126,234,0.3)" }}>
              <h2 style={{ textAlign: "center", fontSize: "1.8em", marginBottom: 20 }}>🎯 PERFORMANCE DASHBOARD</h2>

              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: "5em", fontWeight: "bold", color: scoreColor(result.overall_score) }}>{result.overall_score}</div>
                <div style={{ color: "#aaa", fontSize: "1.1em", marginTop: -8 }}>OVERALL VIDEO SCORE / 100 · Grade: <strong style={{ color: scoreColor(result.overall_score) }}>{result.grade}</strong></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
                <MasterCard icon="⚡" label="Click Potential" score={result.click_potential} subtitle="Will people click?" active={activeSection === "click"} onClick={() => setActiveSection(activeSection === "click" ? null : "click")} />
                <MasterCard icon="🔍" label="SEO Strength" score={result.seo_score} subtitle="Can it be found?" active={activeSection === "seo"} onClick={() => setActiveSection(activeSection === "seo" ? null : "seo")} />
                <MasterCard icon="⏱️" label="Retention Prediction" score={result.retention_score} subtitle="Will they watch?" active={activeSection === "retention"} onClick={() => setActiveSection(activeSection === "retention" ? null : "retention")} />
                <MasterCard icon="🚀" label="Viral Probability" score={result.viral_score} subtitle="Can it go viral?" active={activeSection === "viral"} onClick={() => setActiveSection(activeSection === "viral" ? null : "viral")} />
                <MasterCard icon="⚙️" label="Technical Quality" score={result.technical_score} subtitle="Is it optimized?" active={activeSection === "technical"} onClick={() => setActiveSection(activeSection === "technical" ? null : "technical")} />
              </div>

              <div style={{ background: "rgba(251,191,36,0.1)", borderLeft: "4px solid #fbbf24", padding: 14, marginTop: 24, borderRadius: 8, color: "#fbbf24", fontSize: "0.9em" }}>
                <strong>💡 How to use:</strong> Click any master score card above to jump directly to that section's detailed breakdown below.
              </div>
            </div>

            {/* ── 8 EXPANDABLE DETAIL SECTIONS ── */}

            {/* SECTION 1 — Click Potential */}
            <ExpandableSection title="SECTION 1: Click Potential Metrics (5 metrics)" icon="⚡" defaultOpen={activeSection === "click"}>
              <SubMetricRow name="1. Title Performance Score" value={s?.click_potential?.sub_metrics?.title_performance_score} />
              <SubMetricRow name="2. CTR Predictor" value={s?.click_potential?.sub_metrics?.ctr_predictor} max={10} />
              <SubMetricRow name="3. Title Sentiment" value={s?.click_potential?.sub_metrics?.title_sentiment as string | undefined} />
              <SubMetricRow name="4. Thumbnail-Title Alignment" value={s?.click_potential?.sub_metrics?.thumbnail_title_alignment} />
              <SubMetricRow name="5. Hook Strength" value={s?.click_potential?.sub_metrics?.hook_strength} max={10} />
              {result.metrics.ctr_reason && (
                <div style={{ marginTop: 10, padding: 12, background: "rgba(102,126,234,0.1)", borderRadius: 8, color: "#ccc", fontSize: "0.9em" }}>
                  💬 CTR Assessment: {result.metrics.ctr_reason}
                </div>
              )}
            </ExpandableSection>

            {/* SECTION 2 — SEO Strength */}
            <ExpandableSection title="SECTION 2: Enhanced SEO Metrics (5 metrics)" icon="🔍" defaultOpen={activeSection === "seo"}>
              <SubMetricRow name="6. Keyword Density Map" value={s?.seo_strength?.sub_metrics?.keyword_density_map} />
              <SubMetricRow name="7. Description Structure Score" value={s?.seo_strength?.sub_metrics?.description_structure_score} />
              <SubMetricRow name="8. Tag Quality Score" value={s?.seo_strength?.sub_metrics?.tag_quality_score} />
              <SubMetricRow name="9. Searchability Index" value={s?.seo_strength?.sub_metrics?.searchability_index} />
              <SubMetricRow name={`10. Keyword Difficulty — ${s?.seo_strength?.keyword_difficulty_label}`} value={s?.seo_strength?.sub_metrics?.keyword_difficulty_score} />
              {result.metrics.keyword_position && (
                <div style={{ marginTop: 10, padding: 12, background: "rgba(102,126,234,0.1)", borderRadius: 8, color: "#ccc", fontSize: "0.9em" }}>
                  🔑 {result.metrics.keyword_position}
                </div>
              )}
            </ExpandableSection>

            {/* SECTION 3 — Retention */}
            <ExpandableSection title="SECTION 3: Retention & Watchability (6 metrics)" icon="⏱️" defaultOpen={activeSection === "retention"}>
              <SubMetricRow name="11. Pacing Score" value={s?.retention?.sub_metrics?.pacing_score} />
              <SubMetricRow name="12. Hook Strength (First 15s)" value={s?.retention?.sub_metrics?.hook_strength_first_15s} max={10} />
              <SubMetricRow name="13. Content Structure Completeness" value={s?.retention?.sub_metrics?.content_structure_completeness} />
              <SubMetricRow name="14. Engagement Signal Density" value={s?.retention?.sub_metrics?.engagement_signal_density} max={10} />
              <SubMetricRow name={`15. Drop-off Risk — ${s?.retention?.sub_metrics?.drop_off_risk_label}`} value={s?.retention?.sub_metrics?.drop_off_risk_score} max={10} />
              <SubMetricRow name="16. Watch Time Optimization" value={s?.retention?.sub_metrics?.watch_time_optimization} />
              {result.metrics.retention_risks?.length > 0 && (
                <div style={{ marginTop: 10, padding: 12, background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
                  {result.metrics.retention_risks.map((r, i) => (
                    <div key={i} style={{ color: "#fca5a5", fontSize: "0.88em", marginBottom: 4 }}>⚠️ {r}</div>
                  ))}
                </div>
              )}
            </ExpandableSection>

            {/* SECTION 4 — Virality */}
            <ExpandableSection title="SECTION 4: Virality Potential (4 metrics)" icon="🚀" defaultOpen={activeSection === "viral"}>
              <SubMetricRow name="17. Emotional Intensity Index" value={s?.virality?.sub_metrics?.emotional_intensity_index} max={10} />
              <SubMetricRow name="18. Shareability Score" value={s?.virality?.sub_metrics?.shareability_score} />
              <SubMetricRow name="19. Trend Alignment Score" value={s?.virality?.sub_metrics?.trend_alignment_score} />
              <SubMetricRow name="20. Controversy Meter" value={s?.virality?.sub_metrics?.controversy_meter} max={10} />
              <div style={{ marginTop: 12, padding: 14, background: "rgba(102,126,234,0.1)", borderRadius: 8 }}>
                <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: 8 }}>🎯 Viral Probability: <strong style={{ color: result.viral_probability === "High" ? "#10b981" : result.viral_probability === "Medium" ? "#f59e0b" : "#ef4444" }}>{result.viral_probability}</strong></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 8 }}>
                  {Object.entries(result.metrics.emotional_triggers || {}).map(([k, v]) => (
                    <div key={k} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.4em", fontWeight: "bold", color: scoreColor(v, 10) }}>{v}/10</div>
                      <div style={{ fontSize: "0.72em", color: "#888", textTransform: "capitalize" }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ExpandableSection>

            {/* SECTION 5 — Technical Quality */}
            <ExpandableSection title="SECTION 5: Technical Quality (3 metrics)" icon="⚙️" defaultOpen={activeSection === "technical"}>
              <SubMetricRow name="21. Video Length Optimization" value={s?.technical?.sub_metrics?.video_length_optimization} />
              <SubMetricRow name="22. Metadata Completeness" value={s?.technical?.sub_metrics?.metadata_completeness} />
              <SubMetricRow name={`23. Upload Timing — ${s?.technical?.upload_timing_label}`} value={s?.technical?.sub_metrics?.upload_timing_score} />
            </ExpandableSection>

            {/* SECTION 6 — Competitive Intelligence */}
            <ExpandableSection title="SECTION 6: Competitive Intelligence (3 metrics)" icon="📈">
              <SubMetricRow name="24. Title Uniqueness Score" value={s?.competitive?.sub_metrics?.title_uniqueness_score} />
              <SubMetricRow name="25. Duration Benchmarking" value={s?.competitive?.sub_metrics?.duration_benchmarking as string | undefined} />
              <SubMetricRow name={`26. Keyword Difficulty — ${s?.competitive?.keyword_difficulty_label}`} value={s?.competitive?.sub_metrics?.keyword_difficulty_score} />
            </ExpandableSection>

            {/* SECTION 7 — Audience Psychology */}
            <ExpandableSection title="SECTION 7: Audience Psychology (3 metrics)" icon="🧠">
              <SubMetricRow name="27. Curiosity Gap Score" value={s?.audience_psychology?.sub_metrics?.curiosity_gap_score} max={10} />
              <SubMetricRow name="28. Authority Signals" value={s?.audience_psychology?.sub_metrics?.authority_signals} />
              <SubMetricRow name="29. Relatability Index" value={s?.audience_psychology?.sub_metrics?.relatability_index} />
            </ExpandableSection>

            {/* SECTION 8 — CTA Analysis */}
            <ExpandableSection title="SECTION 8: Call-to-Action Analysis (2 metrics)" icon="📢">
              <SubMetricRow name="30. CTA Strength Score" value={s?.cta?.sub_metrics?.cta_strength_score} />
              <SubMetricRow name="31. Subscription Trigger Score" value={s?.cta?.sub_metrics?.subscription_trigger_score} max={10} />
            </ExpandableSection>

            {/* ── RECOMMENDATIONS ── */}
            {result.recommendations?.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(102,126,234,0.3)", borderRadius: 15, padding: 24, marginTop: 16 }}>
                <h3 style={{ color: "#667eea", marginBottom: 16, fontSize: "1.3em" }}>💡 Action Items & Recommendations</h3>
                <div>
                  {result.recommendations.map((rec, i) => {
                    const borderColor = rec.priority === "high" ? "#ef4444" : rec.priority === "medium" ? "#f59e0b" : "#10b981";
                    const bgColor = rec.priority === "high" ? "rgba(239,68,68,0.07)" : rec.priority === "medium" ? "rgba(245,158,11,0.07)" : "rgba(16,185,129,0.07)";
                    return (
                      <div key={i} style={{ padding: 16, marginBottom: 10, borderRadius: 10, borderLeft: `4px solid ${borderColor}`, background: bgColor }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <span style={{ fontSize: "1.5em" }}>{rec.priority === "high" ? "🔴" : rec.priority === "medium" ? "🟡" : "🟢"}</span>
                          <div>
                            <div style={{ fontWeight: "bold", marginBottom: 4 }}>{rec.title}</div>
                            <div style={{ color: "#ccc", fontSize: "0.9em" }}>{rec.suggestion}</div>
                            <span style={{ display: "inline-block", marginTop: 6, fontSize: "0.75em", padding: "2px 10px", borderRadius: 20, background: `${borderColor}22`, color: borderColor, fontWeight: "bold" }}>
                              {rec.priority.toUpperCase()} PRIORITY
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
            <div style={{ background: "rgba(251,191,36,0.1)", borderLeft: "4px solid #fbbf24", padding: 16, marginTop: 20, marginBottom: 20, borderRadius: 8, color: "#fbbf24", fontSize: "0.88em", lineHeight: 1.7 }}>
              <strong>📋 COLOR GUIDE:</strong><br />
              <span style={{ color: "#10b981" }}>● Green (75–100)</span> = Excellent &nbsp;
              <span style={{ color: "#3b82f6" }}>● Blue (50–74)</span> = Good &nbsp;
              <span style={{ color: "#f59e0b" }}>● Orange (30–49)</span> = Average &nbsp;
              <span style={{ color: "#ef4444" }}>● Red (0–29)</span> = Needs work
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {!result && !loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginTop: 32 }}>
            {[
              { icon: "🎯", title: "31 Sub-Metrics", desc: "Every ranking factor analysed in depth" },
              { icon: "⚡", title: "5 Master Scores", desc: "Click, SEO, Retention, Viral, Technical" },
              { icon: "📋", title: "Actionable Fixes", desc: "Prioritised recommendations to improve rank" },
            ].map(item => (
              <div key={item.title} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 15, padding: 28, textAlign: "center", border: "1px solid rgba(102,126,234,0.3)" }}>
                <div style={{ fontSize: "3em", marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontWeight: "bold", fontSize: "1.1em", marginBottom: 6 }}>{item.title}</div>
                <div style={{ color: "#aaa", fontSize: "0.9em" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
