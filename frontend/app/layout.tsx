import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner"; 
import Navbar from "./components/Navbar"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "King Tools | AI Creator Toolkit & Video Downloader",
  description: "Professional creator tools for video analysis, 1080p downloading, and AI transcription. Safe, fast, and no pop-up ads.",
  keywords: ["Video Analyzer", "Channel Earnings", "Video Downloader", "AI Transcriber", "YouTube SEO"],
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#020617]`}>
        <Navbar />
        {/* pt-20 is essential to push content below the new fixed Navbar */}
        <div className="pt-20">
          {children}
        </div>
        <CookieBanner />
      </body>
    </html>
  );
}