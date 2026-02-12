"use client";
import { useState } from "react";
import Navbar from "../components/Navbar";

export default function VideoAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysisData(null);

    try {
      const res = await fetch(`http://localhost:8000/analyze-video?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setAnalysisData(data);
        setActiveTab("overview");
      }
    } catch (err) {
      setError("Backend connection failed! Make sure the server is running on port 8000.");
    }
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return "text-green-400";
    if (score >= 5) return "text-blue-400";
    if (score >= 3) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 7.5) return "from-green-500 to-emerald-500";
    if (score >= 5) return "from-blue-500 to-cyan-500";
    if (score >= 3) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  const getPercentageScore = (score: number, max: number = 10) => {
    return Math.round((score / max) * 100);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-24 px-4 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            🎬 AI Video Analyzer
          </h1>
          <p className="text-gray-300 text-lg">
            Get deep insights into your video's performance potential
          </p>
        </div>

        {/* URL Input */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/30 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="🔗 Paste YouTube, TikTok, Instagram, or Facebook video URL..."
              className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-purple-500/50"
            >
              {loading ? "🔄 Analyzing..." : "🚀 Analyze"}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisData && (
          <>
            {/* Video Info Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 shadow-2xl mb-8 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                <div className="md:w-80 flex-shrink-0">
                  <img 
                    src={analysisData.thumbnail} 
                    className="w-full rounded-xl shadow-lg border border-gray-600" 
                    alt="Video Thumbnail" 
                  />
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>🎭 Platform:</span>
                      <span className="text-white font-semibold">{analysisData.platform}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>👤 Uploader:</span>
                      <span className="text-white font-semibold">{analysisData.uploader}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>⏱️ Duration:</span>
                      <span className="text-white font-semibold">
                        {Math.floor(analysisData.duration / 60)}:{(analysisData.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>👁️ Views:</span>
                      <span className="text-white font-semibold">{analysisData.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{analysisData.title}</h2>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3">{analysisData.description}</p>
                </div>
              </div>
            </div>

            {/* Master Scores Dashboard */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl border-2 border-purple-500/50 shadow-2xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-center mb-8">📊 Performance Dashboard</h2>
              
              {/* Overall Score - BIG */}
              <div className="text-center mb-10">
                <div className={`text-8xl font-extrabold mb-2 ${getScoreColor(analysisData.overall_score / 10)}`}>
                  {analysisData.overall_score}
                </div>
                <div className="text-xl text-gray-300">OVERALL VIDEO SCORE / 100</div>
              </div>

              {/* 5 Master Scores Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div 
                  className={`bg-gray-800/60 rounded-xl p-6 text-center border-2 cursor-pointer transition-all hover:scale-105 ${
                    activeTab === 'click' ? 'border-purple-500 shadow-lg shadow-purple-500/50' : 'border-gray-700'
                  }`}
                  onClick={() => setActiveTab('click')}
                >
                  <div className="text-4xl mb-2">⚡</div>
                  <div className="text-sm text-gray-400 mb-2">Click Potential</div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysisData.click_potential)}`}>
                    {getPercentageScore(analysisData.click_potential)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Will they click?</div>
                </div>

                <div 
                  className={`bg-gray-800/60 rounded-xl p-6 text-center border-2 cursor-pointer transition-all hover:scale-105 ${
                    activeTab === 'seo' ? 'border-purple-500 shadow-lg shadow-purple-500/50' : 'border-gray-700'
                  }`}
                  onClick={() => setActiveTab('seo')}
                >
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="text-sm text-gray-400 mb-2">SEO Strength</div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysisData.seo_score)}`}>
                    {getPercentageScore(analysisData.seo_score)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Can it be found?</div>
                </div>

                <div 
                  className={`bg-gray-800/60 rounded-xl p-6 text-center border-2 cursor-pointer transition-all hover:scale-105 ${
                    activeTab === 'retention' ? 'border-purple-500 shadow-lg shadow-purple-500/50' : 'border-gray-700'
                  }`}
                  onClick={() => setActiveTab('retention')}
                >
                  <div className="text-4xl mb-2">⏱️</div>
                  <div className="text-sm text-gray-400 mb-2">Retention</div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysisData.retention_score)}`}>
                    {getPercentageScore(analysisData.retention_score)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Will they watch?</div>
                </div>

                <div 
                  className={`bg-gray-800/60 rounded-xl p-6 text-center border-2 cursor-pointer transition-all hover:scale-105 ${
                    activeTab === 'viral' ? 'border-purple-500 shadow-lg shadow-purple-500/50' : 'border-gray-700'
                  }`}
                  onClick={() => setActiveTab('viral')}
                >
                  <div className="text-4xl mb-2">🚀</div>
                  <div className="text-sm text-gray-400 mb-2">Viral Potential</div>
                  <div className={`text-4xl font-bold ${getScoreColor(
                    analysisData.viral_probability === 'High' ? 9 : 
                    analysisData.viral_probability === 'Medium' ? 6 : 3
                  )}`}>
                    {analysisData.viral_probability === 'High' ? '90' : 
                     analysisData.viral_probability === 'Medium' ? '60' : '30'}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Can it go viral?</div>
                </div>

                <div 
                  className={`bg-gray-800/60 rounded-xl p-6 text-center border-2 cursor-pointer transition-all hover:scale-105 ${
                    activeTab === 'recommendations' ? 'border-purple-500 shadow-lg shadow-purple-500/50' : 'border-gray-700'
                  }`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  <div className="text-4xl mb-2">💡</div>
                  <div className="text-sm text-gray-400 mb-2">Action Items</div>
                  <div className="text-4xl font-bold text-purple-400">
                    {analysisData.recommendations?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Improvements</div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 shadow-2xl p-8">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-6 text-purple-400">📊 Quick Overview</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4 text-blue-400">🎯 Title Analysis</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Score:</span>
                          <span className={`font-bold ${getScoreColor(analysisData.metrics.title_score)}`}>
                            {analysisData.metrics.title_score}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Length:</span>
                          <span className="text-white">{analysisData.metrics.title_length} chars</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">CTR Prediction:</span>
                          <span className={`font-bold ${
                            analysisData.metrics.ctr_prediction === 'High' ? 'text-green-400' :
                            analysisData.metrics.ctr_prediction === 'Medium' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>{analysisData.metrics.ctr_prediction}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sentiment:</span>
                          <span className="text-white">{analysisData.metrics.title_sentiment}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4 text-green-400">📈 SEO Quick Stats</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Overall SEO:</span>
                          <span className={`font-bold ${getScoreColor(analysisData.metrics.seo_overall / 10)}`}>
                            {analysisData.metrics.seo_overall}/100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Keyword Score:</span>
                          <span className="text-white">{analysisData.metrics.keyword_score}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tag Count:</span>
                          <span className="text-white">{analysisData.metrics.tag_count} tags</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Description:</span>
                          <span className="text-white">{analysisData.metrics.description_length} chars</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-6 rounded-xl border border-purple-500/30">
                    <h4 className="text-lg font-semibold mb-3 text-purple-300">💬 CTR Analysis</h4>
                    <p className="text-gray-300">{analysisData.metrics.ctr_reason}</p>
                  </div>
                </div>
              )}

              {/* CLICK POTENTIAL TAB */}
              {activeTab === 'click' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-6 text-purple-400">⚡ Click Potential Analysis</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <MetricCard 
                      title="Title Performance Score" 
                      value={analysisData.metrics.title_score} 
                      max={10}
                      description="Based on length, power words, and structure"
                    />
                    <MetricCard 
                      title="CTR Predictor" 
                      value={analysisData.metrics.ctr_prediction === 'High' ? 9 : analysisData.metrics.ctr_prediction === 'Medium' ? 6 : 3} 
                      max={10}
                      description={analysisData.metrics.ctr_reason}
                      displayValue={analysisData.metrics.ctr_prediction}
                    />
                    <MetricCard 
                      title="Hook Strength" 
                      value={analysisData.metrics.hook_strength} 
                      max={10}
                      description="First impression power"
                    />
                    <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4">Title Sentiment</h4>
                      <div className="text-3xl font-bold text-purple-400 mb-2">
                        {analysisData.metrics.title_sentiment}
                      </div>
                      <p className="text-gray-400 text-sm">Emotional tone of your title</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO TAB */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-6 text-purple-400">🔍 SEO Strength Analysis</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <MetricCard 
                      title="Keyword Optimization" 
                      value={analysisData.metrics.keyword_score} 
                      max={10}
                      description={`Main keyword: "${analysisData.metrics.main_keyword}"`}
                    />
                    <MetricCard 
                      title="Description Score" 
                      value={analysisData.metrics.description_score} 
                      max={10}
                      description={`${analysisData.metrics.description_length} characters`}
                    />
                    <MetricCard 
                      title="Tag Quality" 
                      value={analysisData.metrics.tag_score} 
                      max={10}
                      description={`${analysisData.metrics.tag_count} tags used`}
                    />
                    <MetricCard 
                      title="SEO Overall" 
                      value={analysisData.metrics.seo_overall} 
                      max={100}
                      description="Combined SEO effectiveness"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 p-6 rounded-xl border border-blue-500/30">
                    <h4 className="text-lg font-semibold mb-3 text-blue-300">🎯 Keyword Position</h4>
                    <p className="text-gray-300">{analysisData.metrics.keyword_position}</p>
                  </div>
                </div>
              )}

              {/* RETENTION TAB */}
              {activeTab === 'retention' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-6 text-purple-400">⏱️ Retention & Watchability</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <MetricCard 
                      title="Pacing Score" 
                      value={analysisData.metrics.pacing_score} 
                      max={10}
                      description="Video length optimization"
                    />
                    <MetricCard 
                      title="Engagement Density" 
                      value={analysisData.metrics.engagement_density} 
                      max={10}
                      description="Questions and interactions"
                    />
                    <MetricCard 
                      title="Content Structure" 
                      value={analysisData.metrics.structure_score} 
                      max={10}
                      description="Organization quality"
                    />
                    <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4">Drop-off Risks</h4>
                      <div className="space-y-2">
                        {analysisData.metrics.retention_risks?.map((risk: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-400">⚠️</span>
                            <span className="text-gray-300 text-sm">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIRAL TAB */}
              {activeTab === 'viral' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-6 text-purple-400">🚀 Virality Potential</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <MetricCard 
                      title="Shareability Score" 
                      value={analysisData.metrics.shareability_score} 
                      max={10}
                      description="How likely people will share this"
                    />
                    <MetricCard 
                      title="Trend Alignment" 
                      value={analysisData.metrics.trend_score} 
                      max={10}
                      description={analysisData.metrics.trending_topics || "No trending topics detected"}
                    />
                    <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4">Emotional Triggers</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(analysisData.metrics.emotional_triggers || {}).map(([emotion, score]: [string, any]) => (
                          <div key={emotion} className="text-center">
                            <div className={`text-2xl font-bold mb-1 ${getScoreColor(score)}`}>
                              {score}/10
                            </div>
                            <div className="text-xs text-gray-400 capitalize">{emotion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 p-6 rounded-xl border border-pink-500/30">
                    <h4 className="text-lg font-semibold mb-3 text-pink-300">🎯 Viral Probability</h4>
                    <div className="text-4xl font-bold mb-2">
                      <span className={
                        analysisData.viral_probability === 'High' ? 'text-green-400' :
                        analysisData.viral_probability === 'Medium' ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {analysisData.viral_probability}
                      </span>
                    </div>
                    <p className="text-gray-300">
                      {analysisData.viral_probability === 'High' && 'Strong viral potential! This video has great shareability.'}
                      {analysisData.viral_probability === 'Medium' && 'Moderate viral potential. Could improve with trending topics.'}
                      {analysisData.viral_probability === 'Low' && 'Limited viral potential. Consider adding emotional triggers and trending elements.'}
                    </p>
                  </div>
                </div>
              )}

              {/* RECOMMENDATIONS TAB */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-6 text-purple-400">💡 Action Items & Recommendations</h3>
                  
                  {analysisData.recommendations && analysisData.recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {analysisData.recommendations.map((rec: any, idx: number) => (
                        <div 
                          key={idx}
                          className={`p-6 rounded-xl border-l-4 ${
                            rec.priority === 'high' ? 'bg-red-900/20 border-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-900/20 border-yellow-500' :
                            'bg-green-900/20 border-green-500'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`text-3xl ${
                              rec.priority === 'high' ? 'text-red-400' :
                              rec.priority === 'medium' ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold mb-2">{rec.title}</h4>
                              <p className="text-gray-300">{rec.suggestion}</p>
                              <div className="mt-2">
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                  rec.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                                  rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                  'bg-green-500/20 text-green-300'
                                }`}>
                                  {rec.priority.toUpperCase()} PRIORITY
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎉</div>
                      <h4 className="text-2xl font-bold mb-2 text-green-400">Perfect!</h4>
                      <p className="text-gray-400">Your video is well-optimized. No major improvements needed.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}

        {/* Features - Show when no results */}
        {!analysisData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-800/30 p-8 rounded-xl border border-purple-500/30 text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3">Deep Analytics</h3>
              <p className="text-gray-400">Get 30+ metrics analyzing every aspect of your video</p>
            </div>
            <div className="bg-gray-800/30 p-8 rounded-xl border border-purple-500/30 text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3">Viral Prediction</h3>
              <p className="text-gray-400">AI-powered analysis of your video's viral potential</p>
            </div>
            <div className="bg-gray-800/30 p-8 rounded-xl border border-purple-500/30 text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-xl font-bold mb-3">Action Items</h3>
              <p className="text-gray-400">Get specific recommendations to improve performance</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}

// Reusable Metric Card Component
function MetricCard({ 
  title, 
  value, 
  max, 
  description,
  displayValue 
}: { 
  title: string; 
  value: number; 
  max: number; 
  description?: string;
  displayValue?: string;
}) {
  const percentage = (value / max) * 100;
  const getColor = (val: number, maximum: number) => {
    const percent = (val / maximum) * 100;
    if (percent >= 75) return "text-green-400";
    if (percent >= 50) return "text-blue-400";
    if (percent >= 30) return "text-yellow-400";
    return "text-red-400";
  };

  const getGradient = (val: number, maximum: number) => {
    const percent = (val / maximum) * 100;
    if (percent >= 75) return "from-green-500 to-emerald-500";
    if (percent >= 50) return "from-blue-500 to-cyan-500";
    if (percent >= 30) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  return (
    <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
      <h4 className="text-lg font-semibold mb-4 text-gray-300">{title}</h4>
      <div className={`text-4xl font-bold mb-3 ${getColor(value, max)}`}>
        {displayValue || `${value}/${max}`}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full bg-gradient-to-r ${getGradient(value, max)} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {description && (
        <p className="text-gray-400 text-sm">{description}</p>
      )}
    </div>
  );
}
