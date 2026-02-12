// frontend/components/Footer.tsx
import Link from "next/link";
import { FileText, Shield, Info, Crown } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-[#0f172a]/50 backdrop-blur-xl mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Section */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
                <Crown size={20} className="text-white" />
              </div>
              <span className="font-black text-white tracking-tighter uppercase italic">King Tools</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Professional social media services platform dedicated to media intelligence and content optimization.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Legal</h3>
            <nav className="space-y-3">
              <Link 
                href="/terms" 
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-500 transition-colors group"
              >
                <FileText size={16} className="group-hover:scale-110 transition-transform" />
                <span>Terms of Service</span>
              </Link>
              <Link 
                href="/privacy" 
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-500 transition-colors group"
              >
                <Shield size={16} className="group-hover:scale-110 transition-transform" />
                <span>Privacy Policy</span>
              </Link>
              <Link 
                href="/about" 
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-500 transition-colors group"
              >
                <Info size={16} className="group-hover:scale-110 transition-transform" />
                <span>About Us</span>
              </Link>
            </nav>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Tools</h3>
            <nav className="space-y-3">
              <Link 
                href="/" 
                className="block text-sm text-slate-400 hover:text-blue-500 transition-colors"
              >
                Video Analyzer
              </Link>
              <Link 
                href="/downloader" 
                className="block text-sm text-slate-400 hover:text-blue-500 transition-colors"
              >
                5-in-1 Downloader
              </Link>
              <Link 
                href="/transcriber" 
                className="block text-sm text-slate-400 hover:text-blue-500 transition-colors"
              >
                Transcriber
              </Link>
            </nav>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <p className="text-xs text-slate-500">
              © {currentYear} <span className="text-blue-500 font-semibold">King Tools</span>. All rights reserved.
            </p>

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-600 text-center md:text-right max-w-md">
              Not affiliated with YouTube, TikTok, Instagram, Facebook, or X (Twitter). 
              For personal use only. Respect copyright laws.
            </p>
          </div>
        </div>

        {/* Extra Legal Notice */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[9px] text-slate-700 text-center leading-relaxed">
            King Tools acts as a general-purpose search engine and does not host any videos on its servers. 
            All content is processed through original platform CDNs. Users are solely responsible for 
            ensuring they have rights to download content. Subject to the laws of Pakistan.
          </p>
        </div>

      </div>
    </footer>
  );
}
