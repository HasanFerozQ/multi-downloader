"use client";

import { AlertTriangle } from "lucide-react";

interface DoNotRefreshProps {
    visible: boolean;
}

export default function DoNotRefresh({ visible }: DoNotRefreshProps) {
    if (!visible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-amber-500/15 border border-amber-500/30 backdrop-blur-xl rounded-full shadow-lg shadow-amber-500/10">
                <AlertTriangle size={14} className="text-amber-400 animate-pulse flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-300 tracking-wide whitespace-nowrap">
                    Do not refresh the page
                </span>
            </div>
        </div>
    );
}
