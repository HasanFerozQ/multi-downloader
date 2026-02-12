"use client";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { 
  TrendingUp, Eye, Search, Zap, Target, Clock, 
  ThumbsUp, MessageCircle, Share2, BarChart3, 
  Award, AlertCircle, CheckCircle, XCircle 
} from "lucide-react";

export default function VideoAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a valid video URL");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const res = await fetch(
        `http://localhost:8000/analyze-video?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data);
      }
    } catch (err) {
      setError("Failed to analyze video. Make sure the backend is running.");
    }
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-green-500/20 border-green-500/50";
    if (score >= 6) return "bg-yellow-500/20 border-yellow-500/50";
    return "bg-red-500/20 border-red-500/50";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-24 px-4 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Video Analyzer
          </h1>
          <p className="text-gray-400 text-lg">
            Get instant insights on click potential, SEO, retention & virality
          </p>
        </div>

        {/* URL Input */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="🔗 Paste YouTube, TikTok, Instagram, Facebook, or X video URL..."
              className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white placeholder-gray-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "🔍 Analyze"
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6 animate-fade-in">
            {/* Overall Score Card */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-8 rounded-2xl border-2 border-blue-500/30 shadow-2xl">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">
                  Overall Video Score
                </h2>
                <div className="text-7xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                  {analysis.overall_score}
                  <span className="text-3xl text-gray-400">/100</span>
                </div>
                <div className="flex justify-center gap-8 mt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {analysis.click_potential}/10
                    </div>
                    <div className="text-sm text-gray-400">Click Potential</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {analysis.seo_score}/10
                    </div>
                    <div className="text-sm text-gray-400">SEO Strength</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">
                      {analysis.retention_score}/10
                    </div>
                    <div className="text-sm text-gray-400">Retention</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-400">
                      {analysis.viral_probability}
                    </div>
                    <div className="text-sm text-gray-400">Viral Potential</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <div className="flex gap-6">
                <img
                  src={analysis.thumbnail}
                  alt="Thumbnail"
                  className="w-80 rounded-xl border-2 border-gray-600"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{analysis.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mt-4">
                    <div>
                      <span className="font-semibold text-white">Channel:</span>{" "}
                      {analysis.uploader}
                    </div>
                    <div>
                      <span className="font-semibold text-white">Views:</span>{" "}
                      {analysis.views?.toLocaleString() || "N/A"}
                    </div>
                    <div>
                      <span className="font-semibold text-white">Duration:</span>{" "}
                      {Math.floor(analysis.duration / 60)}:
                      {(analysis.duration % 60).toString().padStart(2, "0")}
                    </div>
                    <div>
                      <span className="font-semibold text-white">Platform:</span>{" "}
                      {analysis.platform}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Section 1: Click Potential */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="text-green-400" size={24} />
                  Click Potential Metrics
                </h3>

                <div className="space-y-4">
                  {/* Title Score */}
                  <MetricItem
                    label="Title Score"
                    score={analysis.metrics.title_score}
                    max={10}
                    details={`Length: ${analysis.metrics.title_length} chars (ideal: 45-65)`}
                  />

                  {/* CTR Prediction */}
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">CTR Prediction</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          analysis.metrics.ctr_prediction === "High"
                            ? "bg-green-500/20 text-green-400"
                            : analysis.metrics.ctr_prediction === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {analysis.metrics.ctr_prediction}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {analysis.metrics.ctr_reason}
                    </div>
                  </div>

                  {/* Title Sentiment */}
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Title Sentiment</span>
                      <span className="text-purple-400 font-bold">
                        {analysis.metrics.title_sentiment}
                      </span>
                    </div>
                  </div>

                  {/* Hook Strength */}
                  <MetricItem
                    label="Hook Strength"
                    score={analysis.metrics.hook_strength}
                    max={10}
                    details="Based on first 15 seconds"
                  />
                </div>
              </div>

              {/* Section 2: SEO Metrics */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Search className="text-blue-400" size={24} />
                  SEO Optimization
                </h3>

                <div className="space-y-4">
                  <MetricItem
                    label="Keyword Presence"
                    score={analysis.metrics.keyword_score}
                    max={10}
                    details={`Main keyword: "${analysis.metrics.main_keyword}"`}
                  />

                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Keyword Position</span>
                      <span className="text-blue-400 font-bold">
                        {analysis.metrics.keyword_position}
                      </span>
                    </div>
                  </div>

                  <MetricItem
                    label="Description Quality"
                    score={analysis.metrics.description_score}
                    max={10}
                    details={`${analysis.metrics.description_length} characters`}
                  />

                  <MetricItem
                    label="Tag Optimization"
                    score={analysis.metrics.tag_score}
                    max={10}
                    details={`${analysis.metrics.tag_count} tags found`}
                  />

                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/30">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">SEO Score</span>
                      <span className="text-3xl font-black text-blue-400">
                        {analysis.metrics.seo_overall}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Retention & Watchability */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Eye className="text-yellow-400" size={24} />
                  Retention & Watchability
                </h3>

                <div className="space-y-4">
                  <MetricItem
                    label="Pacing Score"
                    score={analysis.metrics.pacing_score}
                    max={10}
                    details="Content flow and rhythm"
                  />

                  <MetricItem
                    label="Engagement Density"
                    score={analysis.metrics.engagement_density}
                    max={10}
                    details={`${analysis.metrics.questions_asked} questions asked`}
                  />

                  <MetricItem
                    label="Content Structure"
                    score={analysis.metrics.structure_score}
                    max={10}
                    details="Intro, problem, value, conclusion"
                  />

                  {/* Drop-off Risk Points */}
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="font-semibold mb-2">Retention Risk Points</div>
                    <div className="space-y-2">
                      {analysis.metrics.retention_risks.map((risk: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                          <AlertCircle size={16} className="text-yellow-400" />
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Virality Potential */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="text-pink-400" size={24} />
                  Virality Potential
                </h3>

                <div className="space-y-4">
                  {/* Emotional Trigger Index */}
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="font-semibold mb-3">Emotional Triggers</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(analysis.metrics.emotional_triggers).map(
                        ([emotion, score]: [string, any]) => (
                          <div key={emotion} className="flex justify-between">
                            <span className="text-gray-400 capitalize">{emotion}:</span>
                            <span className="font-bold text-white">{score}/10</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <MetricItem
                    label="Shareability Score"
                    score={analysis.metrics.shareability_score}
                    max={10}
                    details="Likelihood of being shared"
                  />

                  <MetricItem
                    label="Trend Alignment"
                    score={analysis.metrics.trend_score}
                    max={10}
                    details={analysis.metrics.trending_topics || "No trending topics detected"}
                  />

                  {/* Viral Probability */}
                  <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-4 rounded-lg border border-pink-500/30">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Viral Probability</span>
                      <span className="text-2xl font-black text-pink-400">
                        {analysis.viral_probability}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="text-yellow-400" size={24} />
                Improvement Recommendations
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      rec.priority === "high"
                        ? "bg-red-500/10 border-red-500/50"
                        : rec.priority === "medium"
                        ? "bg-yellow-500/10 border-yellow-500/50"
                        : "bg-green-500/10 border-green-500/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {rec.priority === "high" ? (
                        <XCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
                      ) : rec.priority === "medium" ? (
                        <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                      ) : (
                        <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                      )}
                      <div>
                        <div className="font-bold mb-1">{rec.title}</div>
                        <div className="text-sm text-gray-400">{rec.suggestion}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Features Info (shown when no analysis) */}
        {!analysis && !loading && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon={<Target className="text-green-400" size={32} />}
              title="Click Potential"
              description="Analyze title, thumbnail, and hook strength to predict CTR"
            />
            <FeatureCard
              icon={<Search className="text-blue-400" size={32} />}
              title="SEO Analysis"
              description="Keyword optimization, tags, and search rankings insights"
            />
            <FeatureCard
              icon={<Eye className="text-yellow-400" size={32} />}
              title="Retention Metrics"
              description="Content pacing, engagement density, and drop-off predictions"
            />
            <FeatureCard
              icon={<Zap className="text-pink-400" size={32} />}
              title="Virality Score"
              description="Emotional triggers, shareability, and trend alignment"
            />
            <FeatureCard
              icon={<BarChart3 className="text-purple-400" size={32} />}
              title="Competitive Analysis"
              description="Compare against top-performing videos in your niche"
            />
            <FeatureCard
              icon={<Award className="text-orange-400" size={32} />}
              title="Smart Recommendations"
              description="Get actionable tips to improve your video performance"
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}

// Metric Item Component
function MetricItem({
  label,
  score,
  max,
  details,
}: {
  label: string;
  score: number;
  max: number;
  details?: string;
}) {
  const percentage = (score / max) * 100;
  const getColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">{label}</span>
        <span className="font-bold text-white">
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {details && <div className="text-xs text-gray-400">{details}</div>}
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 text-center hover:border-gray-600 transition-all">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
