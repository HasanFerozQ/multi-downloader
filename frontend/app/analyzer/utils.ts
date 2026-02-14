export function scoreClass(score: number, max = 100): string {
    const pct = (score / max) * 100;
    if (pct >= 75) return "excellent";
    if (pct >= 50) return "good";
    if (pct >= 30) return "average";
    return "poor";
}

export function scoreColor(score: number, max = 100): string {
    const cls = scoreClass(score, max);
    if (cls === "excellent") return "#10b981";
    if (cls === "good") return "#3b82f6";
    if (cls === "average") return "#f59e0b";
    return "#ef4444";
}

export function fillGradient(score: number, max = 100): string {
    const cls = scoreClass(score, max);
    if (cls === "excellent") return "linear-gradient(90deg,#10b981,#34d399)";
    if (cls === "good") return "linear-gradient(90deg,#3b82f6,#60a5fa)";
    if (cls === "average") return "linear-gradient(90deg,#f59e0b,#fbbf24)";
    return "linear-gradient(90deg,#ef4444,#f87171)";
}

export function fmt(n: number | undefined | null, max = 100): string {
    if (n === undefined || n === null) return "N/A";
    return max === 10 ? `${n}/10` : `${n}/100`;
}

export function fmtNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}
