import { Zap, Search, Clock, Rocket, Settings, BarChart, Brain, MousePointer } from "lucide-react";
import { fmt, scoreColor } from "./utils";

// Re-using the types from the main file would be ideal, but for now we define what we need or import if extracted
interface AnalysisResult {
    sections: any;
    metrics: any;
}

export default function DetailedAnalysisSection({ result }: { result: AnalysisResult }) {
    if (!result) return null;

    return (
        <div className="space-y-6 mb-8">
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

                        {/* Specific Alerts/Messages using clean styling */}
                        {section.id === 'retention' && result.metrics.retention_risks?.length > 0 && (
                            <div className="mx-6 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
                                {result.metrics.retention_risks.map((r: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-rose-300 text-sm font-medium">
                                        ⚠️ {r}
                                    </div>
                                ))}
                            </div>
                        )}
                        {section.id === 'click_potential' && result.metrics.ctr_reason && (
                            <div className="mx-6 mb-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4 text-indigo-300 text-sm">
                                💬 {result.metrics.ctr_reason}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    )
}
