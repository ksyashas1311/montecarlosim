"use client";

import React from "react";
import { Activity, ArrowUpRight } from "lucide-react";

interface HealthScoreCardProps {
  score: number;
  delta: number;
  feasibilityPercent?: number;
  className?: string;
}

export default function HealthScoreCard({
  score,
  delta,
  feasibilityPercent = 84,
  className = "",
}: HealthScoreCardProps) {
  const isHealthy = score >= 70;
  const isModerate = score >= 50 && score < 70;

  const statusText = isHealthy ? "On Track" : isModerate ? "Moderate Attention" : "Action Required";
  const statusColor = isHealthy
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : isModerate
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <div
      className={`bg-gradient-to-br from-[#111c28] via-[#0e1620] to-[#0a0f16] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between ${className}`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#00dce5]" /> Financial Health
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className="my-5 flex items-baseline gap-3">
        <span className="text-5xl font-black text-white font-mono tracking-tight">{score}</span>
        <span className="text-sm font-semibold text-white/40 font-mono">/ 100</span>
        <div className="flex items-center text-xs font-bold text-emerald-400 ml-auto bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +{delta} this month
        </div>
      </div>

      <div className="space-y-2 border-t border-white/5 pt-3">
        <div className="flex justify-between text-xs text-white/60">
          <span>Goal Feasibility</span>
          <span className="text-white font-mono font-medium">{feasibilityPercent}%</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#00dce5] h-full rounded-full transition-all duration-500"
            style={{ width: `${feasibilityPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-white/40 pt-1 leading-relaxed">
          Your savings rate and asset allocation provide high resilience against inflation shocks.
        </p>
      </div>
    </div>
  );
}
