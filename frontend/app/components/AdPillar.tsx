// frontend/components/AdPillar.tsx
"use client";

interface AdPillarProps {
  side: "left" | "right";
}

export default function AdPillar({ side }: AdPillarProps) {
  return (
    <aside
      className={`fixed top-20 ${side === "left" ? "left-4" : "right-4"} 
                  w-[160px] hidden xl:block z-10`}
      style={{ maxHeight: "calc(100vh - 100px)" }}
    >
      {/* Adsterra Ad Container */}
      <div className="sticky top-20 space-y-4">
        
        {/* Main Vertical Banner (160x600) */}
        <div className="bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden">
          {/* REPLACE THIS DIV WITH YOUR ADSTERRA CODE */}
          <div className="h-[600px] flex flex-col items-center justify-center p-4 text-center">
            <div className="text-slate-600 text-xs mb-2">
              {side === "left" ? "LEFT" : "RIGHT"} PILLAR AD
            </div>
            <div className="text-slate-500 text-[10px] font-mono">
              160x600
            </div>
            <div className="text-slate-600 text-[9px] mt-2 max-w-[120px]">
              Replace with Adsterra banner code
            </div>
          </div>
          
          {/* EXAMPLE: Paste your Adsterra code here
          <script async="async" data-cfasync="false" src="//example.com/ad.js"></script>
          */}
        </div>

        {/* Optional: Second smaller banner (160x300) */}
        {/* Uncomment if you want 2 ads per pillar
        <div className="bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden">
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-slate-600 text-xs">160x300</div>
          </div>
        </div>
        */}

      </div>
    </aside>
  );
}

/* 
ADSTERRA INTEGRATION GUIDE:
===========================

1. Go to Adsterra Dashboard
2. Create a "Banner" ad unit (160x600 or 120x600)
3. Copy the banner code
4. Replace the placeholder div above with your code

Example Adsterra code structure:
<script async src="https://...adsterra.js"></script>
<ins class="adsterra-banner" data-ad-client="ca-pub-xxx" data-ad-slot="xxx"></ins>

IMPORTANT NOTES:
- Keep the h-[600px] height for proper spacing
- Ads only show on xl screens (1280px+)
- Mobile/tablet users won't see pillar ads
- Maintains clean look on smaller screens
*/
