import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// This is the new line we added to link the banner
import CookieBanner from "./components/CookieBanner"; 

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Your main content (page.tsx) loads here */}
        {children}

        {/* This stays at the bottom and pops up for new users */}
        <CookieBanner />
      </body>
    </html>
  );
}