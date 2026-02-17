"use client";

import dynamic from 'next/dynamic';

const AudioToolsSection = dynamic(() => import('./AudioToolsSection'), {
    loading: () => <p className="text-center p-10 text-slate-500">Loading audio tools...</p>,
    ssr: false
});

export default function AudioToolsPage() {
    return (
        <main className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-indigo-950 text-white font-sans p-5 pt-32">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-center text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                    Professional Audio Tools
                </h1>
                <p className="text-center text-slate-400 mb-10 text-lg">
                    Extract, Enhance, and Edit Audio from Videos and Links.
                </p>

                <AudioToolsSection />
            </div>
        </main>
    );
}
