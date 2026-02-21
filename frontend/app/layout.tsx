// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AdPillar from "@/components/AdPillar";
import FooterAd from "@/components/FooterAd";
import Footer from "@/components/Footer";
import DonationSection from "@/components/DonationSection";
import FeedbackWidget from "@/components/FeedbackWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kingtools.pro"),
  title: "King Tools - Video Analyzer, Downloader, Audio Tools & Converters",
  description: "Professional social media toolkit: Analyze YouTube videos with 31 metrics, download from 5+ platforms, extract & enhance audio, convert images/audio/documents. Free online tools.",
  keywords: ["video analyzer", "youtube analyzer", "video downloader", "audio tools", "file converter", "social media tools", "tiktok downloader", "instagram downloader"],
  authors: [{ name: "King Tools" }],
  openGraph: {
    title: "King Tools - Complete Social Media Toolkit",
    description: "Analyze, download, convert, and enhance your media content with professional-grade tools",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "King Tools — Professional Media Toolkit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "King Tools - Complete Social Media Toolkit",
    description: "Analyze, download, convert, and enhance your media content with professional-grade tools",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": (process.env.NEXT_PUBLIC_SITE_URL || "https://kingtools.pro") + "/#website",
                  "url": process.env.NEXT_PUBLIC_SITE_URL || "https://kingtools.pro",
                  "name": "King Tools",
                  "description": "Professional media toolkit: analyze videos, download from 5+ platforms, convert files, compress media.",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": (process.env.NEXT_PUBLIC_SITE_URL || "https://kingtools.pro") + "/?url={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  "name": "King Tools",
                  "applicationCategory": "MultimediaApplication",
                  "operatingSystem": "Web",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-[#020617] min-h-screen flex flex-col`}>
        {/* Navbar */}
        <Navbar />

        {/* Main Layout with Ad Pillars */}
        <div className="relative flex-1">

          {/* LEFT AD PILLAR - Only on xl screens */}
          <AdPillar side="left" />

          {/* RIGHT AD PILLAR - Only on xl screens */}
          <AdPillar side="right" />

          {/* MAIN CONTENT AREA - Tools stay centered and ad-free */}
          <main className="pt-16 pb-8">
            {children}
          </main>

        </div>


        {/* DONATION SECTION */}
        <DonationSection />

        {/* FEEDBACK WIDGET */}
        <FeedbackWidget />

        {/* FOOTER AD - PropellerAds */}
        <FooterAd />

        {/* MAIN FOOTER - Links and Legal */}
        <Footer />
      </body>
    </html>
  );
}

/* 
LAYOUT STRUCTURE:
=================

┌─────────────────────────────────────────┐
│          NAVBAR (Ad-free)              │
├──┬───────────────────────────────┬─────┤
│  │                               │     │
│L │      MAIN CONTENT             │  R  │
│E │      (Tools Section)          │  I  │
│F │      ✓ Clean                  │  G  │
│T │      ✓ No Ads Here            │  H  │
│  │                               │  T  │
│A │      DONATION SECTION         │     │
│D │      (Part of tool pages)     │  A  │
│  │                               │  D  │
│P │                               │     │
│I │                               │  P  │
│L │                               │  I  │
│L │                               │  L  │
│A │                               │  L  │
│R │                               │  A  │
│  │                               │  R  │
├──┴───────────────────────────────┴─────┤
│        FOOTER AD (PropellerAds)        │
├────────────────────────────────────────┤
│        FOOTER (Links & Legal)          │
└────────────────────────────────────────┘

KEY FEATURES:
- Ad pillars only show on desktop (xl: 1280px+)
- Mobile users see ZERO ads
- Tools stay centered (max-w-6xl)
- Ads never overlap content
- AdSense-friendly spacing
*/
