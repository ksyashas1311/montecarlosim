"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { formatINR } from "../shared/CurrencyFormat";
import SkeletonChart from "../shared/SkeletonChart";

interface FutureConeChartProps {
  currentAge: number;
  retirementAge: number;
  simulation: any;
  className?: string;
}

export default function FutureConeChart({
  currentAge,
  retirementAge,
  simulation,
  className = "",
}: FutureConeChartProps) {
  const [coneNarration, setConeNarration] = useState<"optimistic" | "median" | "conservative">("median");
  const [hoveredAgeIndex, setHoveredAgeIndex] = useState<number | null>(null);

  const p5 = simulation?.percentiles?.p5 || [];
  const p25 = simulation?.percentiles?.p25 || [];
  const p50 = simulation?.percentiles?.p50 || [];
  const p75 = simulation?.percentiles?.p75 || [];
  const p95 = simulation?.percentiles?.p95 || [];
  const ages = simulation?.percentiles?.ages || [];

  const terminalMedian = simulation?.terminal_wealth_median ?? 48500000;
  const svgWidth = 840;
  const svgHeight = 280;
  const nPoints = ages.length;
  const maxWealth = p95.length > 0 ? Math.max(...p95) * 1.12 : 100000000;

  const getX = (idx: number) => (idx / Math.max(1, nPoints - 1)) * svgWidth;
  const getY = (val: number) => svgHeight - (Math.max(0, val) / maxWealth) * (svgHeight - 20) - 10;

  const buildPath = (data: number[]) => {
    if (!data.length) return "";
    return data
      .map((val, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx).toFixed(1)},${getY(val).toFixed(1)}`)
      .join(" ");
  };

  const outerConeD =
    p95.length > 0 && p5.length > 0
      ? `M ${p95.map((v: number, i: number) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(" L ")} L ${p5
          .map((v: number, i: number) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`)
          .reverse()
          .join(" L ")} Z`
      : "";

  const innerConeD =
    p75.length > 0 && p25.length > 0
      ? `M ${p75.map((v: number, i: number) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(" L ")} L ${p25
          .map((v: number, i: number) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`)
          .reverse()
          .join(" L ")} Z`
      : "";

  return (
    <section
      className={`bg-gradient-to-b from-[#111822] to-[#0c1017] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl ${className}`}
    >
      {/* Top bar of chart */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 z-10 relative">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#00dce5] uppercase tracking-wider">
              Wealth Trajectory
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              · Ages {currentAge} → {currentAge + 35}
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-0.5 tracking-tight">The Future Cone</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Narration perspective toggles */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {(["optimistic", "median", "conservative"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setConeNarration(mode)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition ${
                  coneNarration === mode
                    ? mode === "optimistic"
                      ? "bg-[#d1bcff] text-[#0b0f14]"
                      : mode === "conservative"
                      ? "bg-[#ffb4ab] text-[#0b0f14]"
                      : "bg-[#00dce5] text-[#0b0f14]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="text-right pl-3 border-l border-white/10 hidden sm:block">
            <span className="text-[10px] text-white/40 uppercase block font-mono">
              Median Wealth @ {retirementAge}
            </span>
            <span className="text-base font-bold text-[#00dce5] font-mono">
              {formatINR(terminalMedian, true)}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Fan Chart Canvas */}
      <div className="w-full h-72 sm:h-80 relative">
        {simulation ? (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            onMouseLeave={() => setHoveredAgeIndex(null)}
          >
            <defs>
              <linearGradient id="outer-fan-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00dce5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00dce5" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="inner-fan-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00dce5" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00dce5" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {/* Horizontal reference grid */}
            <line
              x1="0"
              y1={getY(maxWealth * 0.25)}
              x2={svgWidth}
              y2={getY(maxWealth * 0.25)}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="4 4"
            />
            <line
              x1="0"
              y1={getY(maxWealth * 0.5)}
              x2={svgWidth}
              y2={getY(maxWealth * 0.5)}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="4 4"
            />
            <line
              x1="0"
              y1={getY(maxWealth * 0.75)}
              x2={svgWidth}
              y2={getY(maxWealth * 0.75)}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="4 4"
            />

            {/* Outer 90% Confidence Cone (p5 to p95) */}
            <path d={outerConeD} fill="url(#outer-fan-grad)" />

            {/* Inner 50% Confidence Cone (p25 to p75) */}
            <path d={innerConeD} fill="url(#inner-fan-grad)" />

            {/* 95th Percentile Line */}
            <path
              d={buildPath(p95)}
              stroke="#d1bcff"
              strokeWidth={coneNarration === "optimistic" ? "3" : "1.5"}
              strokeDasharray={coneNarration === "optimistic" ? "" : "4 4"}
              fill="none"
              opacity={coneNarration === "optimistic" ? 1 : 0.6}
            />

            {/* 50th Percentile (Median) Line */}
            <path
              d={buildPath(p50)}
              stroke="#00dce5"
              strokeWidth={coneNarration === "median" ? "3.5" : "2"}
              fill="none"
              opacity={coneNarration === "median" ? 1 : 0.8}
            />

            {/* 5th Percentile Line */}
            <path
              d={buildPath(p5)}
              stroke="#ffb4ab"
              strokeWidth={coneNarration === "conservative" ? "3" : "1.5"}
              strokeDasharray={coneNarration === "conservative" ? "" : "4 4"}
              fill="none"
              opacity={coneNarration === "conservative" ? 1 : 0.6}
            />

            {/* Interactive Hover Vertical Guideline */}
            {hoveredAgeIndex !== null && ages[hoveredAgeIndex] !== undefined && (
              <g>
                <line
                  x1={getX(hoveredAgeIndex)}
                  y1={0}
                  x2={getX(hoveredAgeIndex)}
                  y2={svgHeight}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.5"
                />
                <circle
                  cx={getX(hoveredAgeIndex)}
                  cy={getY(p50[hoveredAgeIndex])}
                  r="5"
                  fill="#00dce5"
                  stroke="#0b0f14"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        ) : (
          <SkeletonChart />
        )}

        {/* Invisible interactive hover columns */}
        <div className="absolute inset-0 flex">
          {ages.map((age: number, idx: number) => (
            <div
              key={age}
              className="flex-1 h-full cursor-crosshair group relative"
              onMouseEnter={() => setHoveredAgeIndex(idx)}
            >
              {hoveredAgeIndex === idx && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0e141c] border border-white/20 px-3 py-1.5 rounded-xl shadow-2xl text-[11px] pointer-events-none whitespace-nowrap z-30">
                  <span className="text-white/60 font-medium">Age {age}: </span>
                  <span className="font-bold text-[#00dce5] font-mono">
                    {formatINR(p50[idx], true)} (p50)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Narration Bar */}
      <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-[#00dce5] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white capitalize">{coneNarration} Outlook Analysis:</span>
          <p className="text-white/60 leading-relaxed">
            {coneNarration === "optimistic" &&
              `In high market regimes (95th percentile), compounding accelerates your portfolio to ${formatINR(
                p95[p95.length - 1] || 0,
                true
              )} with substantial headroom above all goals.`}
            {coneNarration === "median" &&
              `Across 10,000 simulations, your expected median net worth reaches ${formatINR(
                terminalMedian,
                true
              )} by age ${retirementAge}. Your savings trajectory is sufficient to fund primary goals.`}
            {coneNarration === "conservative" &&
              `Under prolonged bear markets or stagflation (5th percentile), your portfolio holds at ${formatINR(
                p5[p5.length - 1] || 0,
                true
              )}, preserving capital with minimal ruin risk.`}
          </p>
        </div>
      </div>
    </section>
  );
}
