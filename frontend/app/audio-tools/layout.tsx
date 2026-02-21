import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Professional Audio Tools — Extract, Enhance & Edit Audio | King Tools",
    description: "Extract audio from videos, remove noise, apply professional presets, and enhance audio quality online. Free audio processing tools — no signup required.",
    keywords: ["audio tools", "audio extractor", "noise removal", "audio enhancer", "mp3 processor", "online audio editor"],
    openGraph: {
        title: "Professional Audio Tools — King Tools",
        description: "Extract, enhance, and process audio online for free.",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Professional Audio Tools — King Tools",
        description: "Extract, enhance, and process audio online for free.",
    },
};

export default function AudioToolsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
