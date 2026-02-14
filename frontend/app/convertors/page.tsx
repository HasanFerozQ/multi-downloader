"use client";
import dynamic from 'next/dynamic';

const ConvertorSection = dynamic(() => import('./ConvertorSection'), {
    loading: () => <p className="text-center p-10 text-slate-500">Loading convertors...</p>,
    ssr: false
});

export default function ConvertorsPage() {
    return (
        <main className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-indigo-950 text-white font-sans p-5 pt-32">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-center text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Multi-Format File Convertor
                </h1>
                <p className="text-center text-slate-400 mb-10 text-lg">
                    Convert Images, Audio, and Documents securely in your browser.
                </p>

                <ConvertorSection />
            </div>
        </main>
    );
}
