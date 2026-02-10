"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  // Check if user has already given consent on page load
  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setIsVisible(false);
  };

  // If the user already accepted, don't render anything
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 md:bottom-28 left-4 right-4 md:left-auto md:right-8 md:max-w-sm z-[100] animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
        <h3 className="text-white font-bold text-sm mb-2 uppercase tracking-tight">
          EU Privacy Preference
        </h3>
        <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
          We use cookies to improve your experience and show relevant ads via 
          <strong> Adsterra & PropellerAds</strong>. By clicking "Accept", 
          you consent to our use of cookies for advertising and analytics.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={acceptCookies}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded-lg transition-all"
          >
            ACCEPT ALL
          </button>
          <a 
            href="/privacy" 
            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-bold py-2 rounded-lg text-center transition-all border border-white/5"
          >
            LEARN MORE
          </a>
        </div>
      </div>
    </div>
  );
}