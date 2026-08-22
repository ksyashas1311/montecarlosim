"use client";

import React from "react";
import { Clock, ChevronRight } from "lucide-react";
import { WhatChangedItem, planStore } from "../../store/planStore";

interface WhatChangedFeedProps {
  items: WhatChangedItem[];
  className?: string;
}

export default function WhatChangedFeed({ items, className = "" }: WhatChangedFeedProps) {
  return (
    <div
      className={`bg-[#0e141c]/90 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#d1bcff]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            What Changed Since Last Visit
          </h3>
        </div>
        <span className="text-[11px] text-white/40 font-mono">Auto-recalculated</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between hover:border-white/15 transition group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] text-white/40 font-mono mb-1">
                <span>{item.timestamp}</span>
                {item.impact && (
                  <span className="text-[#00dce5] font-semibold bg-[#00dce5]/10 px-1.5 py-0.5 rounded">
                    {item.impact}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-[#00dce5] transition">
                {item.title}
              </h4>
              <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-3">
        <span>Every edit recalculates your twin in real-time</span>
        <button
          onClick={() => planStore.setActiveScreen("plan")}
          className="text-[#00dce5] font-semibold hover:underline flex items-center gap-1 text-[11px]"
        >
          <span>View input log</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
