"use client";

import React from "react";

interface RiskGaugeProps {
  score: number; // 0 - 100
  toleranceScore: number;
  capacityScore: number;
  category: string;
}

export default function RiskGauge({
  score,
  toleranceScore,
  capacityScore,
  category,
}: RiskGaugeProps) {
  // SVG Arc parameters for 180-degree semi-circle
  const radius = 100;
  const strokeWidth = 14;
  const cx = 130;
  const cy = 125;

  // Normalized score 0-100 mapped to angle -180 to 0 degrees
  const clampedScore = Math.min(100, Math.max(0, score));
  const angle = (clampedScore / 100) * 180 - 180;
  const needleRad = (angle * Math.PI) / 180;
  const needleLength = 75;
  const nx = cx + needleLength * Math.cos(needleRad);
  const ny = cy + needleLength * Math.sin(needleRad);

  // Category Color Map
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Conservative":
        return "#38bdf8"; // Sky blue
      case "Moderately Conservative":
        return "#2dd4bf"; // Teal
      case "Moderate":
        return "#00dce5"; // Cyan / Neon
      case "Moderately Aggressive":
        return "#d1bcff"; // Lavender / Violet
      case "Aggressive":
        return "#f43f5e"; // Rose / Coral
      default:
        return "#00dce5";
    }
  };

  const accentColor = getCategoryColor(category);

  return (
    <div className="p-6 rounded-3xl bg-[#0e141c] border border-white/5 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: accentColor }}
      />

      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-white/50">
          Risk Spectrum
        </span>
        <span
          className="px-3 py-1 rounded-full text-[11px] font-extrabold border"
          style={{
            borderColor: `${accentColor}40`,
            backgroundColor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {category}
        </span>
      </div>

      {/* SVG Radial Arc Gauge */}
      <div className="relative flex items-center justify-center my-2">
        <svg width="260" height="150" viewBox="0 0 260 150" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="25%" stopColor="#2dd4bf" />
              <stop offset="50%" stopColor="#00dce5" />
              <stop offset="75%" stopColor="#d1bcff" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d="M 30,125 A 100,100 0 0,1 230,125"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Gradient Track */}
          <path
            d="M 30,125 A 100,100 0 0,1 230,125"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="314"
            strokeDashoffset={314 - (314 * clampedScore) / 100}
            className="transition-all duration-700 ease-out"
          />

          {/* Needle Center Pivot */}
          <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
          <circle cx={cx} cy={cy} r="10" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" />

          {/* Needle Line */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out shadow-lg"
          />

          {/* End Scale Labels */}
          <text x="25" y="145" fill="rgba(255, 255, 255, 0.3)" fontSize="10" fontWeight="bold">
            0 (Low)
          </text>
          <text x="200" y="145" fill="rgba(255, 255, 255, 0.3)" fontSize="10" fontWeight="bold">
            100 (High)
          </text>
        </svg>

        {/* Center Display Score */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-3xl font-black text-white tracking-tight leading-none">
            {clampedScore.toFixed(0)}
          </span>
          <span className="text-[10px] text-white/40 font-mono">Overall Score</span>
        </div>
      </div>

      {/* Mini Sub-Scores: Tolerance vs Capacity */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60 font-semibold">Tolerance (Psychology)</span>
            <span className="text-white font-bold">{toleranceScore.toFixed(0)}/100</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-[#00dce5] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, toleranceScore))}%` }}
            />
          </div>
          <span className="text-[9px] text-white/40 mt-1 block">Willingness to endure volatility</span>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60 font-semibold">Capacity (Financial)</span>
            <span className="text-white font-bold">{capacityScore.toFixed(0)}/100</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-[#d1bcff] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, capacityScore))}%` }}
            />
          </div>
          <span className="text-[9px] text-white/40 mt-1 block">Ability to absorb drawdowns</span>
        </div>
      </div>
    </div>
  );
}
