// frontend/components/FooterAd.tsx
"use client";

export default function FooterAd() {
  return (
    <div className="mt-20 border-t border-white/5 bg-slate-900/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto py-6 px-4">
        
        {/* Ad Label */}
        <div className="text-center mb-3">
          <span className="text-[10px] text-slate-600 uppercase tracking-widest">Advertisement</span>
        </div>

        {/* PropellerAds Banner Container */}
        <div className="bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden">
          {/* REPLACE THIS DIV WITH YOUR PROPELLERADS CODE */}
          <div className="h-[90px] md:h-[100px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-slate-600 text-xs mb-1">FOOTER AD SPACE</div>
              <div className="text-slate-500 text-[10px] font-mono">728x90 / Responsive</div>
              <div className="text-slate-600 text-[9px] mt-1">Replace with PropellerAds code</div>
            </div>
          </div>

          {/* EXAMPLE: Paste your PropellerAds code here
          <script async src="//propellerads.com/banner.js"></script>
          <div id="propeller-banner"></div>
          */}
        </div>

      </div>
    </div>
  );
}

/* 
PROPELLERADS INTEGRATION GUIDE:
================================

1. Go to PropellerAds Dashboard
2. Create a "Banner" ad zone
3. Select size: 728x90 (Leaderboard) or Responsive
4. Copy the banner code
5. Replace the placeholder div above

Example PropellerAds code:
<script async src="https://propellerads.com/..."></script>

RECOMMENDED SIZES:
- Desktop: 728x90 (Leaderboard)
- Mobile: 320x50 (Mobile Banner)
- Responsive: Auto-adjusts

IMPORTANT:
- This appears AFTER all tool content
- Stays below donation section
- Non-intrusive placement
- Meets AdSense spacing requirements
*/
