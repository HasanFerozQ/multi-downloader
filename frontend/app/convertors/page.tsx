"use client";

import dynamic from 'next/dynamic';

const ConvertorSection = dynamic(() => import('./ConvertorSection'), {
    loading: () => <p className="text-center p-10 text-slate-500">Loading converters...</p>,
    ssr: false
});

export default function ConvertorPage() {
    return (
        <main className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-indigo-950 text-white font-sans p-5 pt-32">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-center text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    🔄 Multi-Format Converter Suite
                </h1>
                <p className="text-center text-slate-400 mb-10 text-lg">
                    Convert images, audio, documents, and download GIFs - all in one place.
                </p>

                <ConvertorSection />
            </div>
        </main>
    );
}
