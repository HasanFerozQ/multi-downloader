// frontend/components/DonationSection.tsx
"use client";
import { Heart, QrCode, CreditCard, Copy, Check } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export default function DonationSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="mt-16 mb-8 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-pink-600/10 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 px-4 py-2 rounded-full mb-4">
            <Heart className="text-red-500 animate-pulse" size={20} fill="currentColor" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Support The Server</span>
          </div>
          <p className="text-slate-400 text-sm">
            Choose your preferred way to help us stay online.
          </p>
        </div>

        {/* Payment Options */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Binance Pay QR */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="text-yellow-500" size={20} />
              <h3 className="font-bold text-white uppercase text-sm tracking-wide">Binance Pay</h3>
            </div>
            
            <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center">
              <Image 
                src="/binance_qr.png" 
                alt="Binance Pay QR Code" 
                width={200} 
                height={200}
                className="rounded-lg"
                priority
              />
            </div>

            {/* Binance Pay ID */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
              <p className="text-xs text-yellow-500 font-bold uppercase mb-1">Binance Pay ID</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-white font-mono text-sm">86846518</code>
                <button
                  onClick={() => copyToClipboard("86846518", "payid")}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Copy Pay ID"
                >
                  {copied === "payid" ? (
                    <Check className="text-green-500" size={16} />
                  ) : (
                    <Copy className="text-slate-400" size={16} />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Scan via Binance App → Pay → Scan QR
            </p>
          </div>

          {/* Global Payment (USDT) */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="text-blue-500" size={20} />
              <h3 className="font-bold text-white uppercase text-sm tracking-wide">Credit / Debit Card (Global)</h3>
            </div>

            <div className="space-y-3">
              {/* USDT Address */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-bold uppercase mb-1">Global USDT (TRC-20)</p>
                <div className="flex items-start justify-between gap-2">
                  <code className="text-white font-mono text-[10px] leading-relaxed break-all">
                    TL1gxN0161p3pKnb7FRiKqTd8JDH9bq0Y6E
                  </code>
                  <button
                    onClick={() => copyToClipboard("TL1gxN0161p3pKnb7FRiKqTd8JDH9bq0Y6E", "usdt")}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                    title="Copy USDT Address"
                  >
                    {copied === "usdt" ? (
                      <Check className="text-green-500" size={16} />
                    ) : (
                      <Copy className="text-slate-400" size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Credit Card Button */}
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all uppercase text-sm tracking-wider shadow-lg hover:shadow-xl">
                💳 Pay with Credit / Debit Card
              </button>

              <p className="text-xs text-slate-500 text-center">
                Worldwide payments accepted
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Message */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            🙏 Every contribution helps keep King Tools free and ad-light. Thank you for your support!
          </p>
        </div>

      </div>
    </section>
  );
}
