"use client";

import dynamic from 'next/dynamic';
import FAQSection from '../components/FAQSection';

const ConvertorSection = dynamic(() => import('./ConvertorSection'), {
    loading: () => <p className="text-center p-10 text-slate-500">Loading converters...</p>,
    ssr: false
});

const CONVERTOR_FAQ = [
    {
        q: "What image formats can I convert between?",
        a: "You can convert between JPEG, PNG, WebP, BMP, and PDF. Output quality is optimized per format — PNG preserves transparency, WebP gives the best compression-to-quality ratio.",
    },
    {
        q: "How do I convert multiple images at once?",
        a: "Upload multiple image files in the Image tab. They will all be converted to your chosen format and bundled into a single ZIP file for download.",
    },
    {
        q: "What audio formats are supported?",
        a: "The audio converter supports MP3, WAV, AAC, OGG, FLAC, and M4A. Format conversion is handled by FFmpeg for professional-grade output quality.",
    },
    {
        q: "Can I convert Word documents to PDF?",
        a: "Yes — DOCX and DOC files can be converted to PDF. The tool uses a pure-Python conversion engine, so no Microsoft Word or LibreOffice is required on your end.",
    },
    {
        q: "Can I convert PDF back to Word (DOCX)?",
        a: "Yes — the File tab supports PDF → DOCX conversion. Formatting fidelity depends on the complexity of the original PDF; text-heavy documents convert best.",
    },
    {
        q: "Is there a file size limit?",
        a: "Individual files are capped at 50MB each, with a combined limit of 100MB per conversion batch. Files larger than this should be split before uploading.",
    },
    {
        q: "Are converted files stored on your servers?",
        a: "No. Converted files live in a temporary directory and are automatically deleted after you download. Your files are never stored persistently.",
    },
    {
        q: "Why can't I download a single converted file as ZIP?",
        a: "Single-file conversions download directly as the converted file (e.g. photo.webp). ZIP packaging only kicks in when you convert multiple files at once.",
    },
];

export default function ConvertorPage() {
    return (
        <>
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

            {/* FAQ */}
            <FAQSection items={CONVERTOR_FAQ} title="File Converter — FAQ" />
        </>
    );
}
