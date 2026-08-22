"use client";

import React from "react";
import { Scenario } from "../../store/planStore";

interface ScenarioCompareChartProps {
  scenarios: Scenario[];
  className?: string;
}

export default function ScenarioCompareChart({
  scenarios,
  className = "",
}: ScenarioCompareChartProps) {
  return (
    <section
      className={`bg-gradient-to-b from-[#111822] to-[#0c1017] border border-white/10 rounded-3xl p-6 sm:p-8 relative shadow-xl ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <span className="text-[10px] font-bold text-[#00dce5] uppercase tracking-wider">
            Overlaid Projections
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">Scenario Trajectory Comparison</h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {scenarios.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-white/70 font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Multi-Line Overlay */}
      <div className="w-full h-64 relative">
        <svg viewBox="0 0 800 240" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid */}
          <line
            x1="0"
            y1="60"
            x2="800"
            y2="60"
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1="120"
            x2="800"
            y2="120"
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1="180"
            x2="800"
            y2="180"
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />

          {/* Current Plan Curve */}
          <path
            d="M 0,210 Q 200,195 400,140 T 800,65"
            stroke="#00dce5"
            strokeWidth="3.5"
            fill="none"
          />

          {/* Scenario Boost Curve */}
          <path
            d="M 0,210 Q 200,190 400,120 T 800,30"
            stroke="#d1bcff"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            fill="none"
          />

          {/* Early Retire Curve */}
          <path
            d="M 0,210 Q 200,200 400,170 T 800,120"
            stroke="#ffb4ab"
            strokeWidth="2"
            strokeDasharray="3 3"
            fill="none"
          />
        </svg>

        <div className="flex justify-between text-xs text-white/40 border-t border-white/5 pt-2">
          <span>Age 25 (Today)</span>
          <span>Age 35</span>
          <span>Age 48 (Retire Target)</span>
          <span>Age 60</span>
        </div>
      </div>
    </section>
  );
}
