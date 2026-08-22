import React from "react";

export default function SkeletonChart() {
  return (
    <div className="w-full h-full flex flex-col justify-between p-6 animate-pulse relative overflow-hidden">
      {/* Top row */}
      <div className="flex justify-between items-start z-10">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-white/10 rounded"></div>
          <div className="h-6 w-44 bg-white/15 rounded"></div>
        </div>
        <div className="space-y-2 text-right">
          <div className="h-3 w-32 bg-white/10 rounded ml-auto"></div>
          <div className="h-7 w-24 bg-[#00dce5]/20 rounded ml-auto"></div>
        </div>
      </div>

      {/* Fan chart silhouette */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <svg viewBox="0 0 800 320" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M 0,260 Q 200,240 400,160 T 800,20 L 800,290 Q 400,295 0,260 Z"
            fill="url(#skeleton-grad)"
          />
          <path
            d="M 0,260 Q 200,250 400,200 T 800,110"
            stroke="#00dce5"
            strokeWidth="2"
            fill="none"
            strokeDasharray="6 6"
          />
          <defs>
            <linearGradient id="skeleton-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00dce5" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#00dce5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#00dce5" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom axis row */}
      <div className="flex justify-between items-center text-xs text-white/30 border-t border-white/5 pt-3 z-10">
        <div className="h-3 w-20 bg-white/10 rounded"></div>
        <div className="h-3 w-32 bg-white/10 rounded"></div>
      </div>
    </div>
  );
}
