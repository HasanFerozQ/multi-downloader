import type { Metadata } from "next";
import GifDownloader from "../convertors/GifDownloader";

export const metadata: Metadata = {
    title: "Free GIF Downloader — King Tools",
    description:
        "Download any GIF instantly by direct URL or extract GIFs from any webpage. No login or signup required.",
    keywords: ["gif downloader", "download gif", "gif extractor", "free gif download"],
};

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
        </div>
    );
}
