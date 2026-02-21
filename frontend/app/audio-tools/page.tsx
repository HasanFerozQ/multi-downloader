"use client";

import dynamic from 'next/dynamic';
import FAQSection from '../components/FAQSection';

const AudioToolsSection = dynamic(() => import('./AudioToolsSection'), {
    loading: () => <p className="text-center p-10 text-slate-500">Loading audio tools...</p>,
    ssr: false
});

const AUDIO_FAQ = [
    {
        q: "What audio effects can I apply?",
        a: "King Tools offers volume boost, noise reduction (spectral gating), hum removal, voice enhancement, breath removal, and clarity enhancement. You can combine them freely or use one-click presets like Podcast, Radio, Cave, and Phone.",
    },
    {
        q: "What are the one-click presets?",
        a: "Podcast applies voice clarity + gentle compression + high-pass filter. Radio applies narrow bandpass + heavy compression. Cave simulates reverb. Phone mimics landline audio quality. Each preset applies an optimized FFmpeg filter chain.",
    },
    {
        q: "Can I extract audio from a video file?",
        a: "Yes — use the 'Extract from Video' tab. Upload any MP4, MOV, MKV, or AVI file and the tool will extract the audio track as a high-quality MP3.",
    },
    {
        q: "What audio formats can I upload?",
        a: "MP3, WAV, AAC, OGG, FLAC, and M4A are all supported for audio processing. Video uploads (for audio extraction) support MP4, MOV, MKV, and AVI.",
    },
    {
        q: "How does the noise reduction work?",
        a: "There are two noise reduction layers: spectral gating via the noisereduce library (targets consistent background hum) and FFmpeg's afftdn+anlmdn dual-filter chain (aggressive broadband noise reduction). You can use one or both.",
    },
    {
        q: "What is the file size limit?",
        a: "Audio files are capped at 100MB per upload. Very long files (2+ hours) should be split into segments for best results.",
    },
    {
        q: "The processing seems slow — is that normal?",
        a: "Audio processing happens in real-time on the server with no GPU acceleration. Noise reduction and clarity enhancement are computationally intensive — a 5-minute audio file typically processes in 30–60 seconds.",
    },
    {
        q: "Where is my processed audio stored?",
        a: "Processed files exist only temporarily on the server and are automatically deleted after download. No audio data is stored or accessed after your session.",
    },
];

export default function AudioToolsPage() {
    return (
        <>
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

            {/* FAQ */}
            <FAQSection items={AUDIO_FAQ} title="Audio Tools — FAQ" />
        </>
    );
}
