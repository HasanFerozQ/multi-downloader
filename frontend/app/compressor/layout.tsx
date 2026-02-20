import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Media Compressor — Compress Images & Videos Online Free | King Tools",
    description:
        "Compress images and videos online for free. Reduce file sizes by up to 50% without losing quality. Supports JPG, PNG, WebP, GIF, MP4, MOV, AVI, MKV. Batch compress up to 10 images or 5 videos at once.",
    keywords: [
        "image compressor",
        "video compressor",
        "compress images online",
        "compress video online",
        "reduce file size",
        "jpg compressor",
        "png compressor",
        "mp4 compressor",
        "batch image compression",
        "free video compression",
        "resize images",
        "optimize images",
    ],
    openGraph: {
        title: "Media Compressor — Compress Images & Videos Online Free",
        description:
            "Reduce image and video file sizes by up to 50% without quality loss. Batch upload supported. Free, fast, and private.",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function CompressorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
