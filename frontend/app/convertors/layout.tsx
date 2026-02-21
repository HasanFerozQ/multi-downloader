import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Multi-Format Converter — Images, Audio & Documents | King Tools",
    description: "Convert images (JPG, PNG, WebP), audio (MP3, WAV, FLAC), and documents (PDF, DOCX) online for free. Batch conversion with instant download.",
    keywords: ["image converter", "audio converter", "document converter", "pdf converter", "webp converter", "online converter", "free file converter"],
    openGraph: {
        title: "Multi-Format Converter — King Tools",
        description: "Convert images, audio, and documents online for free. Batch conversion with instant download.",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Multi-Format Converter — King Tools",
        description: "Convert images, audio, and documents online for free.",
    },
};

export default function ConvertorsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
