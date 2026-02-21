"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Languages,
  Crown,
  Music,
  Minimize2,
  BookOpen,
  ImagePlus,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { name: "Video Analyzer", path: "/", icon: <BarChart3 size={18} /> },
  { name: "5-in-1 Downloader", path: "/downloader", icon: <Download size={18} /> },
  { name: "Audio Tools", path: "/audio-tools", icon: <Music size={18} /> },
  { name: "Compressor", path: "/compressor", icon: <Minimize2 size={18} /> },
  { name: "Convertors", path: "/convertors", icon: <Languages size={18} /> },
  { name: "GIF Downloader", path: "/gif-downloader", icon: <ImagePlus size={18} /> },
  { name: "Blog", path: "/blog", icon: <BookOpen size={18} /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 z-[100] h-16">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Crown size={20} className="text-white" />
            </div>
            <span className="font-black text-white tracking-tighter uppercase italic">King Tools</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${pathname === item.path
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            id="navbar-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-16 left-0 right-0 z-[95] md:hidden bg-[#0f172a] border-b border-white/10 transition-all duration-300 ${menuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-col py-3 px-4 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase transition-all ${pathname === item.path
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
