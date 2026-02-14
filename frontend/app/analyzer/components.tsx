import { scoreColor, fmt, fmtNum } from "./utils";
import { Zap, Search, Clock, Rocket, Settings, BarChart, Brain, MousePointer } from "lucide-react";

interface SubMetricRowProps {
    name: string;
    value: number | string | undefined;
    max?: number;
}

export function SubMetricRow({ name, value, max = 100 }: SubMetricRowProps) {
    if (value === undefined || value === null) return null;
    const isText = typeof value === "string";
    const numVal = isText ? 0 : (value as number);

    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/20 p-4 mb-3">
            <span className="text-slate-300 font-medium">{name}</span>
            <span
                className="font-bold text-lg"
                style={{ color: isText ? "#818cf8" : scoreColor(numVal, max) }}
            >
                {isText ? value : fmt(numVal, max)}
            </span>
        </div>
    );
}

interface MasterCardProps {
    icon: string;
    label: string;
    score: number;
    subtitle: string;
    active: boolean;
    onClick: () => void;
}

export function MasterCard({ icon, label, score, subtitle, active, onClick }: MasterCardProps) {
    function fillGradient(score: number, max = 100): string {
        // Re-implement or import if needed, keeping it self-contained for now or move to utils
        // For brevity, simple gradient
        return `linear-gradient(90deg, ${scoreColor(score, max)} 0%, ${scoreColor(score, max)} 100%)`;
    }

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
            <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", marginTop: 8 }}>
                <div style={{ width: `${score * 10}%`, height: "100%", background: fillGradient(score * 10, 10), borderRadius: 10, transition: "width 0.8s ease" }} />
            </div>
            <div style={{ fontSize: "0.8em", color: "#888", marginTop: 8 }}>{subtitle}</div>
        </div>
    );
}
