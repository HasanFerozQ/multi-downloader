// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AdPillar from "@/components/AdPillar";
import FooterAd from "@/components/FooterAd";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "King Tools - Video Analyzer & Downloader",
  description: "Professional social media services platform for video analysis and downloads",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
