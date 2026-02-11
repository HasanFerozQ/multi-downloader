import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner"; 
import Navbar from "./components/Navbar"; // New Global Navigation

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "King Downloader | Safe 1080p Video Downloader | No Pop-up Ads",
  description: "The fastest, safest way to download 1080p videos and HQ MP3s. 100% clean experience with no redirecting ads or malicious pop-ups.",
  keywords: ["Safe Video Downloader", "No Pop-up Ads Downloader", "Fastest Video Downloader", "High Quality MP3", "1080p Video Downloader"],
  icons: {
    icon: "/favicon.ico", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#020617]`}>
        {/* The Navbar will now be visible on all tools and legal pages */}
        <Navbar />

        {/* Content container with padding-top so content is not hidden behind the fixed Navbar */}
        <div className="pt-20"> 
          {children}
        </div>

        {/* Legal compliance banner */}
        <CookieBanner />
      </body>
    </html>
  );
}