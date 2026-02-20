import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "5-in-1 Video Downloader — YouTube, TikTok, Instagram, Facebook, X | King Tools",
    description:
        "Download videos from YouTube, TikTok, Instagram, Facebook, and X (Twitter) for free. Choose quality from 144p to 4K or extract MP3 audio. Fast, safe, and private — files auto-delete after 30 minutes.",
    keywords: [
        "video downloader",
        "youtube downloader",
        "tiktok downloader",
        "instagram downloader",
        "facebook video downloader",
        "twitter video downloader",
        "x video downloader",
        "mp3 extractor",
        "4K video download",
        "online video downloader",
        "free video downloader",
    ],
    openGraph: {
        title: "5-in-1 Video Downloader — Download from YouTube, TikTok, Instagram, Facebook & X",
        description:
            "Download videos in HD/4K or extract MP3 audio from 5 platforms. Free, fast, and private.",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function DownloaderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
