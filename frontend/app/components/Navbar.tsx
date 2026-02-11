"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Download, Languages, Crown } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "5-in-1 Downloader", path: "/", icon: <Download size={18} /> },
    { name: "Video Analyzer", path: "/analyzer", icon: <BarChart3 size={18} /> },
    { name: "Transcriber", path: "/transcriber", icon: <Languages size={18} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 z-[100] h-16">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            <Crown size={20} className="text-white" />
          </div>
          <span className="font-black text-white tracking-tighter hidden sm:block uppercase italic">King Tools</span>
        </Link>

        <div className="flex gap-1 md:gap-4 bg-white/5 p-1 rounded-xl border border-white/5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                pathname === item.path 
                ? "bg-blue-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="hidden lg:inline">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}