"use client";
import Image from "next/image";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function DonationSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full bg-[#020617] border-t border-white/5 py-12 mt-20 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="bg-slate-900/50 border border-indigo-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-sm shadow-2xl">

          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl shadow-xl shrink-0 rotate-1 hover:rotate-0 transition-transform duration-500 group">
              <div className="relative w-[180px] h-[180px] md:w-[200px] md:h-[200px]">
                <Image
                  src="/binance_qr.png"
                  alt="Binance Pay QR"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <div className="text-center font-bold text-slate-900 mt-2 text-sm tracking-widest">BINANCE PAY</div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2 text-amber-400">
                <span className="text-2xl animate-bounce">☕</span>
                <h2 className="text-2xl font-black uppercase tracking-wide text-white">Support the Server</h2>
              </div>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                Keep <strong>King Tools</strong> online, ad-light and high-speed. Your support directly covers our server costs and fuels new feature development.
              </p>

              <div className="space-y-4">
                {/* Binance Pay ID */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all group hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1">
                  <div className="text-[10px] text-amber-500 font-bold mb-1 uppercase tracking-wider">Binance Pay ID</div>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-white text-lg font-mono font-bold">86846518</code>
                    <button
                      onClick={() => copyToClipboard("86846518", "binance")}
                      className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                      title="Copy ID"
                    >
                      {copied === "binance" ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                {/* USDT Address */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all group hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1">
                  <div className="text-[10px] text-blue-400 font-bold mb-1 uppercase tracking-wider">Global USDT (TRC-20)</div>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-white text-sm md:text-base font-mono break-all text-left">TLlggXh91RjxpKNb7FHXgTd6JDHb9gQVVE</code>
                    <button
                      onClick={() => copyToClipboard("TLlggXh91RjxpKNb7FHXgTd6JDHb9gQVVE", "usdt")}
                      className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg shrink-0"
                      title="Copy Address"
                    >
                      {copied === "usdt" ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
