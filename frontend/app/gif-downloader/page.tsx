import type { Metadata } from "next";
import GifDownloader from "../convertors/GifDownloader";
import FAQSection from "../components/FAQSection";

export const metadata: Metadata = {
    title: "Free GIF Downloader — King Tools",
    description:
        "Download any GIF instantly by direct URL or extract GIFs from any webpage. No login or signup required.",
    keywords: ["gif downloader", "download gif", "gif extractor", "free gif download"],
};

const GIF_FAQ = [
    {
        q: "How do I download a GIF by direct URL?",
        a: "Paste the full .gif URL (e.g. https://example.com/animation.gif) into the input field and click Download. The GIF will be fetched and saved to your device instantly — no account needed.",
    },
    {
        q: "What does 'Extract GIFs from Page' do?",
        a: "Enter any webpage URL and King Tools will scan all HTML elements on that page and find every embedded GIF. You'll see a preview grid — click any thumbnail to download that specific GIF.",
    },
    {
        q: "Can I download GIFs from Tenor or GIPHY?",
        a: "Yes. Paste the direct .gif URL from Tenor, GIPHY, or any other GIF host. Note: use the actual .gif file link rather than the share page URL for best results.",
    },
    {
        q: "What file format is the downloaded GIF?",
        a: "GIFs are downloaded in their original .gif format, preserving all animation frames, loop count, and colors exactly as uploaded by the creator.",
    },
    {
        q: "Is there a size limit for GIFs I can download?",
        a: "There's no hard size limit on the download itself — however, very large GIFs (50MB+) may take a few seconds to fetch. The tool streams the file directly to your browser.",
    },
    {
        q: "Why does the page extractor sometimes miss some GIFs?",
        a: "Some sites load GIFs dynamically via JavaScript after the page loads. The extractor fetches the initial HTML, so dynamically injected GIFs may not appear. Try using the direct GIF URL instead.",
    },
    {
        q: "Is it legal to download GIFs?",
        a: "Downloaded GIFs should only be used for personal, non-commercial purposes unless you have the creator's permission. Respect copyright — King Tools provides the technical means, but usage responsibility rests with you.",
    },
    {
        q: "Do I need to create an account?",
        a: "No. King Tools requires zero sign-up. Simply paste your URL and download — completely free and anonymous.",
    },
];

export default function GifDownloaderPage() {
    return (
        <div className="min-h-screen text-white">
            <div className="max-w-4xl mx-auto pt-8 px-4 pb-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        GIF Downloader
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Download any GIF by direct URL, or extract all GIFs from any webpage — free &amp; instant.
                    </p>
                </div>

                {/* Tool Card */}
                <div className="bg-slate-900/50 border border-indigo-500/30 rounded-2xl p-6">
                    <GifDownloader />
                </div>
            </div>

            {/* FAQ */}
            <FAQSection items={GIF_FAQ} title="GIF Downloader — FAQ" />
        </div>
    );
}
